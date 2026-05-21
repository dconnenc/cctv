## Global context

The application is for building interactive experiences for live audiences

The data model can be derived from the schema (db/schema.rb) and the types file
(app/frontend/types)

## Domain

An experience represents the top level container for an interactive experience.

**Key Models:**

- `User` - Person in the system (email, name, role: admin/superadmin/user)
- `Experience` - The event/activity container
- `ExperienceParticipant` - Join table connecting User to Experience with experience-specific role (host/moderator/player/audience)
- `ExperienceBlock` - Components that make up an interactive experience

ExperienceBlocks (blocks on the frontend) are the components which make up an
interactive experience. They have a payload column for rapid prototyping so any
structure can be experimented with.

Experience blocks have visibility based on segment, role, and target_user_id.
The role refers to the participant role (from ExperienceParticipant), not the
user record's system role. These rules are reflected in the visibility service
and policy files.

**Important:** The frontend should NEVER filter blocks. The backend sends the
correct blocks based on visibility rules. Participants receive exactly ONE block
(or zero) - the block they should currently see. Hosts/moderators receive all
parent blocks.

## Auth

The app uses two authentication systems:

### Session Auth (Administrative)

- Used for admin login and user management
- Traditional Rails session/cookie based
- Used to access admin endpoints

### JWT Auth (Experience Access)

Two JWT scopes exist:

**1. Admin JWT** (`scope: "admin"`)

- Generated via `POST /api/experiences/:code/admin_token`
- Stored in localStorage as `experience_admin_jwt_{code}`
- Grants full access to any experience
- Used by system admins (User.role = admin/superadmin)

**2. Participant JWT** (`scope: "participant"`)

- Generated during experience registration
- Stored in localStorage as `experience_jwt_{code}`
- Scoped to specific experience
- Used by all participants (including hosts)

**Authorization for Managing Experiences:**
Two independent paths:

1. System Admin: User.role = 'admin' | 'superadmin' (can manage ANY experience)
2. Experience Host/Moderator: ExperienceParticipant.role = 'host' | 'moderator' (can manage THEIR experience)

Both paths have equivalent management privileges via the /manage route.

## Websocket Architecture

The app uses ActionCable websockets for real-time communication. All experience
updates flow through websockets - there is NO manual refetching.

### Three Stream Types

**1. Participant Streams (Individual)**

- Stream key: `experience_{experience_id}_participant_{participant_id}`
- One per participant
- Receives filtered view based on visibility rules
- Backend sends exactly the block(s) that participant should see

**2. Monitor Stream (Shared)**

- Stream key: `experience_{experience_id}_Monitor`
- Shared by all Monitor viewers
- Receives public/projected view
- Shows all parent blocks (for projection/display)

**3. Admin Stream (Shared)**

- Stream key: `experience_{experience_id}_admins`
- Shared by all managers (system admins + experience hosts/moderators)
- Receives full experience view with all blocks
- Used by manage page to show program table

### Frontend Websocket Connections

**Manage Page (Admin/Host View):**
Creates 3 websocket connections:

1. Admin websocket → subscribes to admin stream → updates main experience state
2. Monitor websocket → subscribes to Monitor stream → updates Monitor preview panel
3. Impersonation websocket → subscribes to participant stream → updates selected participant preview

**Participant Page:**
Creates 1 websocket connection:

- Participant websocket → subscribes to their participant stream → updates their view

### Broadcast Flow

When any action occurs (start/pause/resume, block status change, poll response, etc.):

1. API endpoint processes the action
2. `Experiences::Broadcaster.broadcast_experience_update` is called
3. Three broadcasts are sent:
   - To all participant streams (each gets their filtered payload)
   - To Monitor stream (public view with all blocks)
   - To admin stream (full view with all blocks)
4. Frontend websockets receive updates
5. UI updates automatically

**No manual refetching occurs anywhere.** Everything is real-time via websockets.

### Backend Stream Routing

`ExperienceSubscriptionChannel` routes subscriptions based on:

- System admin (admin JWT) → admin stream
- Experience host/moderator (participant JWT, role=host/moderator) → admin stream
- Regular participant (participant JWT, role=player/audience) → participant stream
- Monitor view parameter (`view_type: 'monitor'`) → Monitor stream
- Impersonation parameter (`as_participant_id: X`) → that participant's stream

## Frontend Context Management

`ExperienceContext` (`app/frontend/Contexts/ExperienceContext.tsx`) manages:

- JWT loading/generation (detects if admin or participant)
- Websocket connections (creates 1 or 3 based on route)
- Experience state (updated via websocket messages only)
- Manage page state (monitorView, participantView, impersonatedParticipantId)

The context automatically:

- Generates admin JWT when admin visits /manage
- Creates appropriate websockets based on route and role
- Updates state when websocket messages arrive
- Never manually refetches data

## Sound effects

Blocks can attach sound effects that play on the Monitor view in response to
block state transitions.

### Data model

- `experience_blocks.sounds` is a jsonb column **sibling to `payload`** — not
  nested inside it. Use this column for any uniform-shape per-block metadata
  where every kind shares the same structure.
- Shape: `Record<TriggerName, SoundKey>`. Trigger names are kind-specific
  conventions (e.g. `on_show_x` for FamilyFeud). Sound keys are members of the
  `SoundKey` TS union.
- Server-side defaults live in `Experiences::Orchestrator#default_sounds_for`
  and are applied at block creation in `add_block_with_dependencies!`.
- `Experiences::Visibility#serialize_block` emits `sounds` on every block.

### Frontend (`@cctv/sounds`)

- `SoundKey` — string union of valid sound keys
- `play(key)` — fire-and-forget playback; the single entry point to audio
- `useMonitorSound(key, when, viewContext)` — fires `play(key)` on the rising
  edge of `when`; no-op unless `viewContext === 'monitor'`. Pass
  `block.sounds?.<trigger_name>` as the key

MP3 assets live alongside the module in `app/frontend/sounds/` and are imported
directly (bundled, fingerprinted by Vite).

### Adding a sound

1. Drop the mp3 in `app/frontend/sounds/`.
2. Add it to `SoundKey` and `SOUND_URLS` in `registry.ts`.
3. To default it on a block kind, extend `default_sounds_for`.
4. In the block's component, call `useMonitorSound(block.sounds?.<trigger>,
<state>, viewContext)`.

### Wiring a new block kind

Sound-using block components need `sounds` and `viewContext` props. Most kinds
in `ExperienceBlockContainer` receive only `{...block.payload}` — explicitly
pass `sounds={block.sounds} viewContext={viewContext}` for any kind that
consumes audio.

### Constraints

- Monitor only. Participant and manage views never play audio.
- Bundled mp3s only — no host-uploaded sounds yet.
- Never construct `new Audio()` in components; always go through `play(key)`.
  That entry point is the stable seam for future features (e.g. participant
  soundboard).

## Code style

Follow existing patterns

Do not make changes backwards compatible. Do complete refactors

Do not add comments into the code base explaining your changes. Comments are
strictly for code documentation when applicable. Not to convey temporal
information about a change you make.

Do not add in documentation files explaining your changes or testing scripts
outside of the test suite

### Front-end

- Use css modules
- Prefer components UI elements from app/frontend/Core
- Don't repeat colors and variables. use variables from app/frontend/styles.css
- Import from index files, not full paths
- Don't cast `as any`. Use the type system correctly
- Trust backend visibility logic - never filter blocks on frontend
- All state updates come from websockets, not API calls
- New components and visible UI states get a Storybook story alongside the
  component (`<Component>.stories.tsx`). Cover the meaningful variants — empty
  state, loading, error, and any state-driven effects (e.g. monitor-only sound
  triggers). Run with `yarn storybook`.

### Back-end

- Variable naming: `@user` for User, `@participant` for ExperienceParticipant
- Authorization: Check system admin OR experience host/moderator
- Always broadcast after state changes - never return just JSON
- Use `Experiences::Broadcaster.broadcast_experience_update` after any experience modification
