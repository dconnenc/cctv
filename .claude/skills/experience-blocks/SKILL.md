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

### Audit checklist for existing blocks

- Does `serialize_response_data` emit any `user_id` or `participant_id` fields
  to the participant stream? If so, that data must move to `submissionState`.
- Does any broadcast path call per-participant logic inside the participant
  payload? The payload must be identical for all participants sharing a profile.
- Does the component read `block.responses?.user_response` or similar? It
  should read from `submissionState[block.id]` instead.
