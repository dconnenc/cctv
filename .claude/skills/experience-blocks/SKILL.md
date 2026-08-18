---
name: experience-blocks
description: Use when creating, modifying, or auditing experience blocks. Auto-invoke when the task involves adding a new block kind, changing how a block stores or broadcasts data, or reviewing block architecture.
---

# Experience Blocks

## Core Invariant: No Per-Participant State in Broadcasts

The broadcast system groups participants by visibility fingerprint and sends one
identical payload per unique profile. **Per-user data must never appear in
broadcast payloads.** Breaking this forces the broadcaster back to N individual
streams and defeats the entire architecture.

User-specific state must live on the client, not in broadcast payloads. Today
this is implemented via `submissionState` — a client-side store hydrated on
connect via a `submission_state` websocket message and updated immediately from
POST response bodies. As the app evolves, this general pattern may expand to
other storage mechanisms (localStorage, vendor object storage, a richer client
state object), but the invariant stays the same: the broadcast carries no
per-person data, and the client is responsible for its own state.

If you find yourself wanting to put a `user_id`, `participant_id`, or any
per-person field into a broadcast payload for a regular participant stream,
stop — it is the wrong model.

---

## Data Storage: Choose the Right Column

### `payload` (jsonb) — block config and server-side game state

The general-purpose column for anything that is not formally modelled. Good for:

- Static config: `title`, `question`, `prompt`, `duration_seconds`, `options`
- Mutable server-side game state: `started_at`, `ended_at`,
  `current_question_index`, `leaderboard`, `phase`

Not for per-participant data. Every participant with the same visibility profile
receives the same payload — it cannot contain anything user-specific.

### `sounds` (jsonb) — per-block audio trigger config

Sibling column to `payload` (not nested inside it). Shape:
`Record<TriggerName, SoundKey>`. Trigger names are kind-specific conventions
(e.g. `on_show_x` for FamilyFeud). Server-side defaults live in
`Orchestrator#default_sounds_for` and are applied at block creation.

### `responses` (computed in serialization, not stored)

`serialize_response_data` in `app/services/experiences/visibility.rb` computes
aggregate metrics that are safe to broadcast to all participants sharing a
profile:

- `total` — submission count
- `aggregate` — poll breakdown percentages
- `correct_count`, `participant_counts` — minigame stats

Hosts/moderators additionally receive `all_responses` for management. Regular
participant payloads get only the aggregate fields — never individual response
data.

### Formal submission models — when you need to query or aggregate

Use a dedicated model when submissions will be queried, counted, or aggregated
across participants. Existing models follow a consistent shape:

```ruby
# belongs_to :experience_block
# belongs_to :experience_participant
# answer :jsonb  (flexible per-kind payload)
ExperienceQuestionSubmission
ExperiencePollSubmission
ExperienceBuzzerSubmission
ExperiencePhotoUploadSubmission
ExperienceMinigameSubmission
```

For simple per-block config that is just read out and minimally processed on
both ends, storing it in `payload` jsonb is fine. Formal models are preferred
when you are aggregating, querying across participants, or need referential
integrity.

---

## Client Submission State Pattern

This is the canonical way per-participant state is stored and hydrated.

### On subscribe

`build_client_state` in `ExperienceSubscriptionChannel` queries all submission
models for the participant and returns a `submission_state` websocket message
keyed by block ID. This fires immediately after the initial `experience_state`
on connect and reconnect.

### On submit

The POST endpoint processes the submission, calls
`broadcast_experience_update`, and returns:

```ruby
render json: { success: true, submission: { id: submission.id, answer: submission.answer } }
```

The client hook reads `submission` from the response body and calls
`setSubmissionState` immediately — no waiting for the broadcast roundtrip.

### In the component

Read from `submissionState[block.id]` (from `useExperienceState`) rather than
from `block.responses`. The `responses` object carries aggregates; the client's
own submission state comes from `submissionState`.

```typescript
const { submissionState } = useExperienceState();
const mySubmission = submissionState[block.id]; // { id, answer, ... }
```

When adding a new submission type, add it to `build_client_state` in
`ExperienceSubscriptionChannel` so it is included in the hydration message.

---

## Prefer Client-Side Computation Over Synchronized Server State

For time-based and game-like mechanics, lean on the client. Attempting to
synchronize state server-side the way a formal game engine would introduces
significant complexity for marginal correctness gain on "fun" audience
interactions.

**Timers:** Store `started_at` (ISO timestamp) in `payload`. The client
computes remaining time from `Date.now() - new Date(started_at).getTime()`.
No server → client timer tick messages needed.

```typescript
// MinigameArithmetic pattern
function useCountdown(startedAt: string | null, durationSeconds: number, endedAt: string | null) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!startedAt || endedAt) return;
    const id = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(id);
  }, [startedAt, endedAt]);
  return useMemo(() => {
    if (!startedAt) return durationSeconds;
    const elapsed = Math.floor((now - new Date(startedAt).getTime()) / 1000);
    return Math.max(0, durationSeconds - elapsed);
  }, [now, startedAt, durationSeconds]);
}
```

**Scores and progress:** Returned directly from the POST response body and
stored in `submissionState`. The server is authoritative on correctness but
the client holds the display state.

**The rule:** If you are tempted to broadcast a message every N ms to keep
clients in sync, reconsider. Store an anchor timestamp server-side; derive
the rest on the client.

---

## Block Visibility and Multi-Item Payloads

The frontend never filters blocks. The backend sends exactly the blocks each
participant is eligible to see (based on role, segments, `target_user_ids`).

A single block can contain multiple sub-items within its payload — for example
FamilyFeud sends all questions with a `current_question_index`, and
MinigameArithmetic sends the next question via `submissionState` after each
answer. The client navigates these using server-side state in the payload and
client-side submission state. This is not "filtering" — it is rendering state
that is already present.

---

## Sounds

`experience_blocks.sounds` is a jsonb column sibling to `payload`.
Shape: `Record<TriggerName, SoundKey>`. Trigger names are kind-specific
conventions (e.g. `on_show_x` for FamilyFeud). Sound keys are members of the
`SoundKey` TS union in `@cctv/sounds`.

Server-side defaults live in `Experiences::Orchestrator#default_sounds_for`
and are applied at block creation in `add_block_with_dependencies!`.
`Experiences::Visibility#serialize_block` emits `sounds` on every block.

### Frontend (`@cctv/sounds`)

- `SoundKey` — string union of valid sound keys
- `play(key)` — fire-and-forget playback; single entry point to audio
- `useMonitorSound(key, when, viewContext)` — fires `play(key)` on the rising
  edge of `when`; no-op unless `viewContext === 'monitor'`

MP3 assets live in `app/frontend/sounds/` and are imported directly (bundled
by Vite).

**Constraints:** Monitor only. Never construct `new Audio()` in components —
always go through `play(key)`. Sound-using block components need `sounds` and
`viewContext` props; pass them explicitly from `ExperienceBlockContainer`.

### Adding a sound

1. Drop the mp3 in `app/frontend/sounds/`
2. Add it to `SoundKey` and `SOUND_URLS` in `registry.ts`
3. Extend `default_sounds_for` in `Orchestrator` if it should default on a kind
4. In the component: `useMonitorSound(block.sounds?.<trigger>, <state>, viewContext)`

---

## High-Frequency Multi-Actor State (Mini-Games and Real-Time Competitions)

When a block has state updated by many concurrent participants at high frequency — per-player
progress in a game, live leaderboards, race mechanics — three architectural primitives apply.

### 1. Backend writes: atomic JSONB patch, not read-modify-write

Reading `block.payload` from the in-memory ActiveRecord instance and writing the whole blob back
with `update_columns` is unsafe under concurrency. The in-memory object is stale by the time the
write executes; it overwrites any DB-level updates that happened in between (including terminal
state like `ended_at`).

**Wrong:**

```ruby
payload = block.payload || {}          # stale copy
block.update_columns(payload: payload.merge("leader_fill" => fill_amount, ...))
# ↑ wipes any fields set by concurrent requests since block was loaded
```

**Right — patch specific keys atomically in the DB:**

```ruby
ExperienceBlock
  .where(id: block.id)
  .where("(payload->>'ended_at') IS NULL")          # guard: don't write past terminal state
  .where("COALESCE((payload->>'leader_fill')::int, 0) < ?", fill_amount)  # guard: only if higher
  .update_all([
    "payload = payload || jsonb_build_object('leader_fill', ?::int, 'leader_participant_id', ?::text), updated_at = ?",
    fill_amount, participant.id.to_s, Time.current
  ])
```

`payload = payload || jsonb_build_object(...)` merges only the specified keys. All other payload
fields are untouched. The WHERE guards are re-evaluated on the locked row under PostgreSQL's
READ COMMITTED, so concurrent writes are safely serialized.

For terminal transitions (ending a game), use `block.lock!` inside a transaction and re-read the
payload from the locked row before writing. Do not pass the winning participant via a query of
what has already crossed the threshold — pass the participant whose request acquired the lock.

This is a trade-off for using a generic `payload` json column. If you are confident in the implementation,
do not use json and instead model the data in the database. Race conditions can still exist, but can be
solved in a more idiomatic way.

### 2. Broadcast throughput: client throttle + Sidekiq `until_executing`

High-frequency participant actions generate proportionally high server load. Two levers, both
non-exclusive and cheap to apply:

**Client-side throttle:** A constant like `MIN_PUMP_INTERVAL_MS = 250` is a one-line change that
reduces request volume at the source. Since these are fun low-stakes games, we do not care about
micro-precision; a 250ms throttle is imperceptible in play.

**Sidekiq deduplication:** `BroadcastUpdateJob` uses `lock: :until_executing` keyed on
`experience_id`. The lock is held from enqueue until the job starts executing. A second enqueue
attempt while a job is already queued is silently dropped. When the job executes it reads current
DB state, so N coalesced events result in one broadcast of the latest value — the same
"eventually consistent" guarantee as the full experience broadcast.

For block-level partial broadcasts, create a job following the same pattern keyed on `block_id`:

```ruby
class BroadcastMyBlockJob < ApplicationJob
  queue_as :default
  sidekiq_options lock: :until_executing,
                  lock_args_method: :lock_args,
                  on_conflict: { client: :log }
  def self.lock_args(args) = [args.first]   # block_id

  def perform(block_id)
    block = ExperienceBlock.find(block_id)
    # read current state from DB, broadcast it
  rescue ActiveRecord::RecordNotFound
  end
end
```

Enqueue from the controller with `BroadcastMyBlockJob.perform_later(@block.id)`.

Do **not** add an external rate limiter. Build things to be eventually consistent and use this pattern.
Do **not** default to a new broadcast job for all changes. This full broadcast is appropriate in most
scenarios. A new broadcast job is only applicable when are modifying partial state outside of the
full broadcast payload

### 3. Frontend reconciliation: partial state via DispatchRegistryContext

Live state that changes at high frequency during a game must NOT be carried in the experience
payload while the game is running. A full `experience_updated` broadcast — triggered by any
unrelated management action — replaces the entire payload and regresses any partial updates the
client has applied.

This is the same reason avatar drawing state is never in the experience payload: drawing updates
come via `drawing_update` messages into `LobbyDrawingContext` (a separate state container), so a
full experience broadcast cannot touch them.

**The pattern for game-specific live state:**

1. **Backend (visibility.rb):** Omit the live field from the shaped payload while the game is
   running. Include it only once the game has ended (when the value is final and won't change).
   The final game-end broadcast carries the authoritative value.

2. **Backend (channel):** On admin subscribe, if a game is running, transmit the current live
   state as a targeted message immediately after `experience_state` — the same way monitor
   subscribe sends `avatar_committed` per participant after the initial state.

3. **Frontend (DispatchRegistryContext):** Extend with a register/unregister/get triple for the
   new message type, following the existing `FamilyFeud` triple exactly. The component registers
   on mount, holds the live value in local state, and unregisters on unmount. `WebSocketContext`
   routes the targeted message to the registered dispatch — same as `FAMILY_FEUD_UPDATED`.

4. **Frontend (component):** Read the live field from local state (hydrated via the targeted
   message) rather than from `block.payload`. When the game ends, the full broadcast delivers
   the final value in the payload; sync it into local state via a `useEffect` on `ended_at`.

See `DispatchRegistryContext.tsx`, `WebSocketContext.tsx` (FAMILY_FEUD_UPDATED handling), and
`FamilyFeudManager` for the canonical implementation of this pattern.

### Audit checklist for high-frequency blocks

- Does any backend method read `block.payload` from the in-memory AR object and write the whole
  blob back? Replace with an atomic JSONB patch with WHERE guards.
- Does any winner/terminal determination query a result table for all rows that crossed a
  threshold? Pass the triggering participant instead — the row lock decides who wins.
- Are high-frequency events broadcasting synchronously in the HTTP request thread? Use a Sidekiq
  job with `until_executing` deduplication keyed on `block_id`.
- Does live state appear in the experience payload while the game is running? If so, a full
  broadcast can regress it. Move it to the `DispatchRegistryContext` pattern.

---

## Checklist: Adding a New Block Kind

### Backend

- [ ] Add constant to `ExperienceBlock` (`POLL = "poll"` style)
- [ ] Add `when` branch to `Orchestrator#default_sounds_for`
- [ ] Add `when` branch to `Visibility#serialize_response_data` — aggregate
      metrics only, never per-participant fields
- [ ] If the block needs setup work or child records: add to
      `Orchestrator#add_block_with_dependencies!`
- [ ] If participants submit responses: create migration + model
      (`belongs_to :experience_block`, `belongs_to :experience_participant`,
      `answer :jsonb`) and add the query to `build_client_state` in
      `ExperienceSubscriptionChannel`
- [ ] Add participant submission endpoint returning
      `{ success: true, submission: { id:, answer: } }` and calling
      `broadcast_experience_update` after

### Frontend

- [ ] Add type to `app/frontend/types.ts`
- [ ] Create component `app/frontend/Experiences/BlockName/BlockName.tsx`
      with `ParticipantView`, `MonitorView`, `ManageView` sub-components as
      needed
- [ ] Add to `ExperienceBlockContainer`; pass `sounds` and `viewContext` if
      the block uses audio
- [ ] Add create form in `Pages/Manage/CreateBlock/`
- [ ] Add edit form in `Pages/Manage/EditBlock/`
- [ ] Export from `app/frontend/Experiences/index.ts`
- [ ] If the block has a submission hook: add to `app/frontend/Hooks/` and
      call `setSubmissionState` from the POST response
- [ ] Add Storybook story covering meaningful variants (empty, active,
      ended, monitor view if sounds are involved)

### System specs

System specs are required for new blocks. Follow the `system-specs` skill
(`~/.claude/skills/system-specs/SKILL.md`) for assertion patterns. Cover:

- Participant submits → sees confirmed state immediately
- Participant reconnects → state is correctly hydrated from `submission_state`
- Host/moderator sees aggregate data (`all_responses`, totals)
- Block transitions (e.g. start → active → ended) update all relevant views

### Additional checklist items for high-frequency multi-actor blocks

If the block has state updated by many concurrent participants (games, races, live competitions):

- [ ] Backend writes to shared payload fields use atomic JSONB patch (`payload = payload || jsonb_build_object(...)`) not read-modify-write
- [ ] Terminal state transitions (end game, set winner) use `block.lock!` inside a transaction; winner is the participant whose request acquires the lock, not a post-hoc query of who crossed a threshold
- [ ] Client submission throttle constant is set to 250ms or higher (these are fun, low-stakes interactions)
- [ ] High-frequency broadcasts use `BroadcastXJob` with `sidekiq_options lock: :until_executing` keyed on `block_id` — not synchronous inline broadcasts
- [ ] Live state that changes during the game is absent from the full experience payload while running; delivered via a targeted partial message routed through `DispatchRegistryContext`
- [ ] Initial live state is sent as a targeted message on admin subscribe (parallel to `avatar_committed` on monitor subscribe)
- [ ] Component holds live state locally via registered dispatch; syncs final value from payload on game end

### Audit checklist for existing blocks

- Does `serialize_response_data` emit any `user_id` or `participant_id` fields
  to the participant stream? If so, that data must move to `submissionState`.
- Does any broadcast path call per-participant logic inside the participant
  payload? The payload must be identical for all participants sharing a profile.
- Does the component read `block.responses?.user_response` or similar? It
  should read from `submissionState[block.id]` instead.
