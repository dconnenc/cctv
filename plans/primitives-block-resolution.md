# Primitives: Block Resolution for Participants

These primitives address a fundamental limitation in the current block resolution model: `resolve_participant_block` collapses all visible blocks into a single result using implicit position ordering. This creates opaque behavior the host cannot reason about, blocks that silently shadow other blocks, and no coverage signal for interactive blocks.

---

## Current Model (for context)

The backend resolves to exactly one block per participant on every broadcast. The algorithm walks all visible blocks in position order and returns the first one whose DAG dependencies are unresolved, or the first block with no dependencies at all. Position determines everything. There is no way for a participant to access a block that isn't first in their list.

---

## Primitive 1: Return N Blocks

**What it is:** The backend sends all visibility-eligible blocks to the participant — not a single resolved block. The backend no longer runs `resolve_participant_block`. The client receives an ordered list and decides what to display.

**What it gives us:**

- Transparency: a participant who is eligible for multiple blocks sees all of them, none are silently hidden
- Coverage signal: the host can know whether a participant has a given block in their list, because visibility is now explicit rather than implicit in ordering
- No position-ordering side effects: opening a block at position 3 no longer shadows a block at position 5 for a participant who has both

**Trade-offs:**

- The host loses the guarantee that "everyone is looking at the same thing right now" — participants navigate their own list, so at any moment participant A may be on block 1 while participant B is on block 3
- The client now owns a state machine for "what is currently shown," which must survive reconnection
- Same-tier collision: if a participant has two blocks of equal priority, the client needs a tiebreaker rule. Position is the natural one, but it's the same implicit ordering that caused problems in the first place — it just surfaces at a less common boundary

**Illustrative trade-off:**

_Scenario:_ A participant is in Segment A and Segment B. An announcement targeted to Segment A is at position 2. An announcement targeted to Segment B is at position 4. Both are open.

- **Current model:** participant sees only the Segment A announcement (position 2 wins). The Segment B announcement is silently unreachable.
- **N-block model:** participant receives both announcements and can cycle between them. The host can verify both are in the participant's list.
- **Trade-off exposed:** if the host wants participants to see announcements in a specific order without distraction, client-side cycling works against that intent. The synchronized "everyone is here now" guarantee that the single-block model provides has real value for a live orchestrated experience.

---

## Primitive 2: Z-Index / Hierarchical Priority Tiers

**What it is:** Blocks carry an explicit priority level (conceptually a z-index). The client surfaces the highest-priority unresolved block by default. Blocks at the same priority level are accessible but do not automatically interrupt the participant's current view.

**What it gives us:**

- Urgency signaling without implicit position ordering: a buzzer targeted to a specific participant can be given high priority and demand attention regardless of when it was created or what position it occupies
- The host can reason about priority explicitly ("this block is high-priority, it will surface above normal blocks") rather than inferring it from position
- The priority tiers compose with the N-block model: within a tier, all unresolved blocks are navigable; across tiers, the highest unresolved tier is the default view

**Trade-offs:**

- Same-tier collision is unresolved by this primitive alone: two high-priority blocks targeting the same participant (e.g., via two different segments) both demand attention. The client can show all same-tier blocks simultaneously or fall back to position ordering as the tiebreaker — either is valid, but it must be an explicit rule
- Priority is a new dimension the host must understand and set correctly; wrong priority assignments create the same shadowing behavior, just at the tier boundary instead of the position boundary
- "One pinned block per participant" (a simpler form of this) is too limiting: if Segment A has a high-priority block and Segment B has a different high-priority block, and a participant is in both segments, you need same-tier rules anyway

**Illustrative trade-off:**

_Scenario:_ A buzzer is created for a specific participant (target_user_id) at priority tier 2. A general-audience poll is open at priority tier 1.

- **Without z-index:** the buzzer and poll compete purely on position. If the buzzer is at position 5 and the poll at position 3, the participant sees the poll and the buzzer is unreachable until the poll closes.
- **With z-index:** the participant's default view is the buzzer (tier 2 surfaces above tier 1). They can still navigate to the poll, but the buzzer has their attention.
- **Trade-off exposed:** the poll is still accessible but not the default view for this participant. If the host expects N% poll completion including this participant, they need to know that the buzzer is preempting it. The coverage signal from Primitive 1 helps here — the host can see the poll is in this participant's list — but the host cannot guarantee the participant will choose to navigate to it.

---

## Primitive 3: Client-Side "Resolved" State

**What it is:** Each block has a resolved state owned by the client, driven by config on the block itself. Resolved state determines whether the client's default navigation skips past that block to the next unresolved one. What constitutes "resolved" is block-type-specific and potentially instance-specific:

- Poll: resolved after submitting a response
- Announcement with dismiss action: resolved after the participant explicitly dismisses it
- Buzzer: resolved after pressing the buzzer
- Question with editable answer (configured as revisitable): never resolved — always remains in the navigation queue

The client uses resolved state to determine its default focus: highest-priority unresolved block. Resolved blocks remain accessible (the participant can navigate back) but are skipped by default.

**What it gives us:**

- Participant auto-advances past completed interactions without the host needing to close blocks
- The editable-question case shows why config-driven is the right approach: "resolved" is not a property of the block type alone, it depends on how the block is configured. An editable question should never be skipped; a final-answer question should be skipped after submission
- For blocks backed by submissions (poll, question, buzzer), resolved state maps directly to existing backend data (submission exists). No new backend primitive needed for those
- For dismiss-type blocks (announcement without a submission), resolved state is new client state that needs a backend write for cross-device hydration (covered in the plan doc)

**Important nuance:** This primitive _is_ the "resolvable vs unresolvable" concept discussed earlier — it is not an alternative to it. The difference is that it's config-driven per block instance rather than hardcoded per block type. That's strictly better, but the concept is the same.

**Trade-offs:**

- Resolved state for dismiss-type blocks (announcements) is new data that doesn't exist in the backend today. Without persisting it, it is lost on page reload. With persistence, writes must be decoupled from the broadcast pipeline (see plan doc)
- For blocks where resolved = submission exists, the backend can compute and hydrate resolved state on reconnect. For dismiss state, a separate lightweight backend record is needed
- The host's ability to know "has participant X resolved this block" is limited to blocks with backend-tracked state. Dismiss state is eventually consistent with the backend (see plan doc)

**Illustrative trade-off:**

_Scenario:_ An announcement (dismiss action configured) is at priority tier 1. A poll is also at priority tier 1. The participant dismisses the announcement.

- **Without resolved state:** the announcement is always the first thing shown (lower position). The participant must navigate past it every time they look at their blocks.
- **With resolved state:** after dismissing, the announcement is marked resolved on the client. The poll becomes the default view. The participant can navigate back to the announcement if they choose.
- **Trade-off exposed:** if the participant reconnects on a new device before the dismiss write has persisted to the backend, the announcement reappears as unresolved. This is eventual consistency — the dismiss write is decoupled from the broadcast, so there is a window where the backend does not yet reflect the client's state. For a live event, seeing a previously-dismissed announcement once on reconnect is an acceptable degradation; the state will reconcile once the hydration message arrives.

---

## How the Primitives Compose

These three primitives are designed to work together:

1. The backend sends **N blocks** (all visibility-eligible, ordered by position)
2. Each block carries a **priority tier** (z-index)
3. The client tracks **resolved state** per block, derived from config
4. The client's default view: highest-priority tier → first unresolved block in that tier

The host's controls remain: opening and closing blocks changes what is in the participant's N-block list. The primitives give the client a richer state machine for navigating that list without requiring the host to manage single-block ordering for every participant combination.

The synchronized "everyone sees the same thing" guarantee weakens under this model. That is the primary trade-off. How much that matters depends on the product intent: host-orchestrated synchrony (current model's strength) versus participant-navigable richness (what these primitives enable).
