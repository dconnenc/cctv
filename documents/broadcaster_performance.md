# Broadcaster Performance Analysis

## Problem Statement

When changing block status (e.g., presenting a sub-block), the system takes **2-3 seconds** to respond and generates excessive database queries.

### Observed Metrics

From a single block status change with ~6 participants:

```
Completed 200 OK in 1479ms
├── ActiveRecord: 118.2ms (2043 queries, 1719 cached)
├── GC: 136.6ms
└── Views: 0.1ms
```

**Key Issues:**

- **2,043 total queries** for a single action
- **324 uncached queries** hitting the database
- **136.6ms in garbage collection** due to object creation overhead
- **~1.5 seconds** total response time

## Root Cause Analysis

### Architecture Overview

The `Experiences::Broadcaster.broadcast_experience_update` method broadcasts personalized payloads to:

1. Each individual participant (N broadcasts)
2. Monitor view (1 broadcast)
3. Admin view (1 broadcast)

### The N+1 Problem

```ruby
# broadcaster.rb:17-19
experience.experience_participants.includes(:user).each do |participant|
  broadcast_to_participant(participant)
end
```

For **each participant**, the system:

1. **Queries participant record again** in `Visibility.payload_for_user` (redundant)
2. **Loads all experience blocks** via `experience.experience_blocks.order(position: :asc)`
3. **Runs visibility filtering** checking each block against role/segment rules
4. **Calls `BlockResolver.next_unresolved_child`** which queries for submissions
5. **Serializes via `BlockSerializer`** which queries:
   - `submissions.count`
   - `submissions.find_by(user_id: ...)`
   - `submissions.map { ... }` (loads all)
   - `block.children.pluck(:id)`
   - `block.parents.pluck(:id)`
   - Recursively serializes children

### Query Multiplication

With **N participants** and **M blocks**:

- N × participant lookups
- N × block list queries
- N × M × visibility checks
- N × M × K submission queries (K ≈ 5-10 per block type)

**Example:** 6 participants × 10 blocks × 8 queries/block = 480 base queries, before caching

### Why Caching Helps But Isn't Enough

Rails query cache prevents duplicate SQL execution within a request, but:

- Cache lookup still has overhead
- Creating N copies of similar serialized objects causes GC pressure
- The iteration itself is O(N) regardless of caching
- First query for each unique parameter set still hits DB

## Potential Solutions

### Option 1: Eager Loading (Quick Win)

**Effort:** Low  
**Impact:** Moderate (30-50% improvement)

Add `.includes()` to preload associations:

```ruby
# broadcaster.rb
def broadcast_experience_update
  # Preload all needed associations once
  experience.experience_blocks
    .includes(:experience_poll_submissions,
              :experience_question_submissions,
              :experience_multistep_form_submissions,
              :children, :parents, :variables)
    .load

  experience.experience_participants.includes(:user).each do |participant|
    broadcast_to_participant(participant)
  end
  # ...
end
```

**Pros:**

- Minimal code changes
- No architectural changes

**Cons:**

- Still O(N) iteration
- Still creates N payloads
- Memory usage increases (all data loaded upfront)

---

### Option 2: Batch Preloading with In-Memory Computation

**Effort:** Medium  
**Impact:** High (60-80% improvement)

Preload all data once, then compute visibility in-memory:

```ruby
def broadcast_experience_update
  # Load everything once
  blocks = experience.experience_blocks.includes(:children, :parents).to_a
  submissions_by_block = preload_all_submissions(blocks)
  participants = experience.experience_participants.includes(:user).to_a

  participants.each do |participant|
    payload = compute_payload_in_memory(
      blocks: blocks,
      submissions: submissions_by_block,
      participant: participant
    )
    broadcast_to_participant_with_payload(participant, payload)
  end
end
```

**Pros:**

- Dramatically reduces queries
- Single DB round-trip for all data

**Cons:**

- More complex code
- Still O(N) payload creation
- Higher memory usage

---

### Option 3: Group by Visibility Profile (Best for Scale)

**Effort:** High  
**Impact:** Very High (80-95% improvement)

Participants with the same role and segments see the same content. Group them:

```ruby
def broadcast_experience_update
  participants = experience.experience_participants.includes(:user).to_a

  # Group participants by their visibility profile
  visibility_groups = participants.group_by do |p|
    [p.role, p.segments.sort]
  end

  visibility_groups.each do |(role, segments), group_participants|
    # Compute payload ONCE for the entire group
    payload = compute_payload_for_profile(role: role, segments: segments)

    # Broadcast same payload to all participants in group
    group_participants.each do |participant|
      broadcast_to_participant_with_payload(participant, payload)
    end
  end
end
```

**Pros:**

- O(V) payloads where V = unique visibility profiles (typically 2-5)
- Massive reduction in computation
- Scales to thousands of participants

**Cons:**

- Requires separating "shared" data from "user-specific" data
- User-specific fields (like `user_response`) need special handling
- More complex architecture

---

### Option 4: Background Job (Perceived Latency)

**Effort:** Low-Medium  
**Impact:** High for user experience

Move broadcasting to Sidekiq so HTTP response returns immediately:

```ruby
# In controller
def open
  orchestrator.open_block!(block)
  BroadcastExperienceUpdateJob.perform_async(experience.id)
  render json: { success: true }
end

# In job
class BroadcastExperienceUpdateJob
  include Sidekiq::Job

  def perform(experience_id)
    experience = Experience.find(experience_id)
    Experiences::Broadcaster.new(experience).broadcast_experience_update
  end
end
```

**Pros:**

- HTTP response returns immediately
- User sees instant UI feedback
- Can be combined with other optimizations

**Cons:**

- Slight delay before websocket updates arrive
- Adds Sidekiq dependency for this path
- Doesn't reduce actual work, just moves it

---

### Option 5: Incremental/Delta Updates

**Effort:** Very High  
**Impact:** Very High

Instead of recomputing entire experience state, send only what changed:

```ruby
def broadcast_block_status_change(block, old_status, new_status)
  delta = {
    type: "block_status_changed",
    block_id: block.id,
    old_status: old_status,
    new_status: new_status,
    block: serialize_single_block(block)
  }

  broadcast_delta_to_all(delta)
end
```

**Pros:**

- Minimal data transferred
- Minimal computation
- Best performance possible

**Cons:**

- Major architectural change
- Frontend must handle delta merging
- Complex state synchronization
- Risk of state drift

---

## Recommended Approach

### Phase 1: Quick Wins (Immediate)

1. Add eager loading for associations
2. Move broadcasting to background job

### Phase 2: Optimization (Short-term)

1. Implement batch preloading with in-memory computation
2. Add visibility profile grouping for role-based optimization

### Phase 3: Scale (If needed)

1. Implement delta updates for high-frequency changes
2. Consider read replicas for broadcast queries

## Metrics to Track

After implementing optimizations, measure:

- Total request time
- Query count (cached vs uncached)
- GC time
- Time to first websocket message received by client
- Memory usage during broadcast

## Files Involved

- `app/services/experiences/broadcaster.rb` - Main broadcast logic
- `app/services/experiences/visibility.rb` - Visibility computation
- `app/serializers/block_serializer.rb` - Block serialization
- `app/services/experiences/block_resolver.rb` - Block resolution for participants
