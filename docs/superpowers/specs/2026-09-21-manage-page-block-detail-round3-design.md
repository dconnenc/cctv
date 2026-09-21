# Manage Page Block Detail — Round 3

**Date:** 2026-09-21

## Problems

1. **Kind label is too large** — the block kind (`ANNOUNCEMENT`, `POLL`, etc.) renders as an `h2 text-xl` heading. It dominates the header for no informational reason; it's a label, not a title.
2. **Header wastes vertical space** — three rows (kind label / status+visibility / edit-delete) for information that fits in two compact rows.
3. **Tab selected state is not clear** — the active Screens/Block tab uses `bg-muted` which provides insufficient contrast. Users cannot reliably tell which tab is selected.
4. **Screens: participant dropdown causes layout shift** — when switching from Monitor to Participant sub-mode, the `<select>` appears below the toggle, pushing content down.
5. **Block tab is empty for Announcement** — currently returns `null`. The host has no summary of what the block is configured to do.
6. **Block tab lacks visibility metadata** — the visibility rules (Public / Targeted) removed from the metadata grid in Round 2 were not reinstated anywhere in the Block tab. The host must edit the block to see its targeting rules.
7. **Block tab config text is absent for simple blocks** — Poll, Question, Photo Upload, and Buzzer don't show their configured question/prompt at a glance; only raw responses are shown.

---

## Design

### 1. Header compaction

Collapse three rows into two:

**Row 1 (`flex items-center justify-between`):**

- Left: small kind label · status dot · status text · Targeted badge (if applicable)
- Right: Edit (or Detach for child blocks) · Delete

Kind label: `text-xs font-medium uppercase tracking-wide text-[hsl(var(--muted-foreground))]`

Remove the `h2 text-xl font-semibold` element entirely. Remove the `-mt-4` hack on the action row.

### 2. Tab selected state

Replace `bg-[hsl(var(--muted))]` with a bottom-border indicator pattern:

- Active tab: `border-b-2 border-[hsl(var(--primary))] rounded-none text-white font-medium`
- Inactive tab: `text-[hsl(var(--muted-foreground))] rounded-none`

The `fieldset aria-label="Preview mode"` element and `aria-pressed` attributes are preserved unchanged — system spec helpers depend on them.

### 3. Screens: participant dropdown inline

Move `<select aria-label="View as participant">` from its own row to the **same flex row** as the Monitor / Participant toggle:

```
[Monitor] [Participant]          [select: View as participant ▾]
```

- The select appears on the right of the same row only when `viewMode === 'participant'`.
- The preview content area below is always present, so no height shift occurs when toggling sub-mode.
- Since the select has zero width when hidden (not rendered), use a single `flex items-center justify-between` wrapper — Monitor+Participant buttons on the left, select on the right.

### 4. Block tab: visibility + per-block config

#### Extract `VisibilityDetails`

`VisibilityDetails` and `hasTargetingRules` currently live in `BlockDetailPanel.tsx`. Extract them to a new file:

`app/frontend/Pages/Manage/Viewer/BlockVisibility.tsx`

Exports: `hasTargetingRules(block: Block): boolean` and `VisibilityDetails({ block }: { block: Block })`.

`BlockDetailPanel.tsx` imports from this file (header badge unchanged).
`BlockContextTab.tsx` imports from this file (Block tab section).

#### Block tab structure

Every block kind renders a visibility section at the top of the Block tab:

- If `hasTargetingRules(block)`: render `<VisibilityDetails block={block} />` (expandable "Targeted")
- Otherwise: render a plain `Public` badge (`text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded`)

Below the visibility section, render block-kind-specific config text, then existing response/manager content:

| Block kind     | Config section content                                                               |
| -------------- | ------------------------------------------------------------------------------------ |
| `ANNOUNCEMENT` | `Message: [payload.message]` · `Monitor: [Yes / No]`                                 |
| `POLL`         | `[payload.question]`                                                                 |
| `QUESTION`     | `[payload.question]`                                                                 |
| `PHOTO_UPLOAD` | `[payload.prompt]`                                                                   |
| `BUZZER`       | `[payload.label]` if present · `[payload.prompt]` if present · silent if both absent |
| `FAMILY_FEUD`  | visibility section only — `FamilyFeudManager` handles the rest                       |
| `GUESS_WHO`    | visibility section only — `GuessWhoManager` handles the rest                         |
| `MINIGAME_*`   | visibility section only — `MinigameControls` + `BlockResponsesList` handle the rest  |
| `THE_SCENE`    | visibility section only — `BlockResponsesList` handles the rest                      |

Config text style: `text-sm text-[hsl(var(--muted-foreground))]` label + `text-sm text-white` value.

---

## Verb / Button changes

No button labels change. No new interactive elements beyond what already exists.

---

## System Spec Impact

| Helper                   | Change required                                                                                                        |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------- |
| `manage_page_v2_spec.rb` | Add assertion: Block tab shows "Public" or "Targeted" text; Announcement block shows its message text                  |
| All existing helpers     | No change — `aria-label="Preview mode"`, `aria-label="View as participant"`, `aria-label="Participants"` all preserved |

---

## Files Affected

| File                                                    | Change                                                             |
| ------------------------------------------------------- | ------------------------------------------------------------------ |
| `app/frontend/Pages/Manage/Viewer/BlockDetailPanel.tsx` | Header compaction; tab selected state; participant dropdown inline |
| `app/frontend/Pages/Manage/Viewer/BlockContextTab.tsx`  | Visibility section + per-block config text                         |
| `app/frontend/Pages/Manage/Viewer/BlockVisibility.tsx`  | **New** — extracted `hasTargetingRules` + `VisibilityDetails`      |
| `spec/system/experiences/manage_page_v2_spec.rb`        | Add Block-tab visibility and Announcement message assertions       |

---

## Out of Scope

- No changes to `FamilyFeudManager`, `GuessWhoManager`, `MinigameControls`, `BlockResponsesList`.
- No backend changes.
- No changes to block creation or edit forms.
- No changes to the ManageViewer command bar.
- Full test suite is not run locally; targeted proxy spec only.
