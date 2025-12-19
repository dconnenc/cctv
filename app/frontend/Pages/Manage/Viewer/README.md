# ManageViewer Page

## Purpose

`ManageViewer` is a Google Sheets-inspired interface for managing live interactive experiences. It's designed for non-technical operators running shows/projector displays, prioritizing scannability and quick actions.

## Layout Structure

```
┌─────────────────────────────────────────────────────────┐
│ [Left Sidebar]  │  [Main Content]         │ [Right Panel] │
│  - Block list   │  - Experience controls  │  - Participants│
│  - Collapsible  │  - Selected block view  │  - Collapsible │
│  - Shows        │  - Block preview        │                │
│    children     │  - Present/Stop buttons │                │
└─────────────────────────────────────────────────────────┘
```

## Key Features

### 1. Left Sidebar (Block List)

- Collapsible (`sidebarCollapsed` state) - auto-collapses on screens < 768px
- Shows `flattenedBlocks` - parent blocks plus their children inline
- Child blocks are indented with `!ml-6` and have a left border
- Status indicators: green dot (open), gray (closed), dim opacity (hidden)
- Green ring around selected block
- "LIVE" badge on open blocks
- Response count badges

### 2. Main Content Area

- Experience header: name, status pill, Start/Pause/Resume button
- Error banner (dismissible)
- Selected block details:
  - Block kind, status
  - "Present" button (opens block, closes others) or "Stop Presenting" + "Play Next" buttons
  - View mode toggle (Monitor/Participant) with participant selector
  - Block preview using `BlockPreview` or `ContextView` components
  - Visibility settings (roles, segments, targets)
  - Response count
  - `FamilyFeudManager` embedded for Family Feud blocks

### 3. Right Panel (Participants)

- Slides in/out (`showParticipantDetails` state)
- Shows `ParticipantsTab` component

## Key State & Data

```tsx
flattenedBlocks; // Array of { block, isChild, parentId } - includes children inline
selectedBlockId; // Currently selected block in sidebar
selectedBlock; // The actual block object
currentOpenBlock; // The block with status === 'open'
viewMode; // 'monitor' | 'participant'
sidebarCollapsed; // Boolean for sidebar visibility
busyBlockId; // Block currently being modified (for loading states)
```

## Key Actions

- **handlePresent(block)**: Closes all open blocks, opens the selected one. For Mad Libs, also opens first child.
- **handleStopPresenting(block)**: Closes the block
- **handlePlayNext()**: Closes current block, opens next in `flattenedBlocks`, selects it
- **handleCreateBlock()**: Opens create block dialog

## Websocket Integration

- Uses `monitorView` and `participantView` from `useExperience()` context
- These come from separate websocket streams showing filtered views
- All state updates flow through websockets (no manual refetching)

## Dependencies

- `@cctv/contexts`: `useExperience`
- `@cctv/hooks`: `useChangeBlockStatus`, `useExperienceStart/Pause/Resume`
- Components: `FamilyFeudManager`, `BlockPreview`, `ContextView`, `CreateBlock`, `ParticipantsTab`
- UI: `Button`, `Pill`, `Dialog` from core/shadcn
