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

**2. TV Stream (Shared)**

- Stream key: `experience_{experience_id}_tv`
- Shared by all TV viewers
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
2. TV websocket → subscribes to TV stream → updates TV preview panel
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
   - To TV stream (public view with all blocks)
   - To admin stream (full view with all blocks)
4. Frontend websockets receive updates
5. UI updates automatically

**No manual refetching occurs anywhere.** Everything is real-time via websockets.

### Backend Stream Routing

`ExperienceSubscriptionChannel` routes subscriptions based on:

- System admin (admin JWT) → admin stream
- Experience host/moderator (participant JWT, role=host/moderator) → admin stream
- Regular participant (participant JWT, role=player/audience) → participant stream
- TV view parameter (`view_type: 'tv'`) → TV stream
- Impersonation parameter (`as_participant_id: X`) → that participant's stream

## Frontend Context Management

`ExperienceContext` (`app/frontend/Contexts/ExperienceContext.tsx`) manages:

- JWT loading/generation (detects if admin or participant)
- Websocket connections (creates 1 or 3 based on route)
- Experience state (updated via websocket messages only)
- Manage page state (tvView, participantView, impersonatedParticipantId)

The context automatically:

- Generates admin JWT when admin visits /manage
- Creates appropriate websockets based on route and role
- Updates state when websocket messages arrive
- Never manually refetches data

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

### Back-end

- Variable naming: `@user` for User, `@participant` for ExperienceParticipant
- Authorization: Check system admin OR experience host/moderator
- Always broadcast after state changes - never return just JSON
- Use `Experiences::Broadcaster.broadcast_experience_update` after any experience modification
