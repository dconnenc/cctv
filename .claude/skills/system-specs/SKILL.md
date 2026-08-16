---
name: system-specs
description: Use when writing or modifying system specs. Auto-invoke for any file in spec/system/.
---

# System Specs (Capybara/Cuprite)

## Config

System specs must simulate a real environment where possible.

## Pre-Action Assertions

Before any click or link interaction whose availability depends on async state,
assert the element is in the expected state. This guards against low-level
mouse events firing before the renderer has committed its state update.

perform_async_work(...)
expect(page).to have_button("Submit", disabled: false) # pre-assert
click_button "Submit"

expect(page).to have_link("Continue") # pre-assert
click_link "Continue"

Required when the element's availability or state depends on async work that
just occurred -- a prior interaction, data loading, validation, websocket update,
or anything that could delay the element reaching its expected state. Not
required when nothing async precedes the interaction and the element's state
is unconditionally known.

## Post-Action Assertions

Any action that mutates state or navigates must be followed by a positive
assertion before the next action. The assertion must confirm something that
could not have been true before the action -- asserting pre-existing content
bypasses Capybara's retry and proves nothing.

# Dangerous -- "Welcome" may already be on the page; passes immediately

click_button "Sign In"
expect(page).to have_text("Welcome")

# Correct -- only exists after successful sign in

click_button "Sign In"
expect(page).to have_text("Signed in as jane@example.com")

### Hierarchy of assertion strength (prefer higher when possible)

1. Domain state confirmed via UI -- navigate to where the mutation is visible
2. Page content unique to the success state
   expect(page).to have_text("Invitation sent")
3. URL change
   expect(page).to have_current_path("/dashboard")
4. Element presence that only exists post-action
   expect(page).to have_css(".success-banner")

### Best effort is acceptable -- with intent

Not every mutation can be asserted unambiguously from the current page.
Use judgment based on what the test is trying to prove:

# Weak but acceptable if the mutation isn't the focus of the test

click_button "Save"
expect(page).to have_current_path("/projects")

# Stronger -- navigate to confirm if the test specifically asserts mutation

click_button "Save"
visit "/projects/#{project.id}/settings"
expect(page).to have_text("Updated project name")

### Never use direct database access to assert UI behavior

# Bad

click_button "Save"
expect(Project.last.name).to eq("Updated")

# Good

click_button "Save"
visit "/projects/#{project.id}"
expect(page).to have_text("Updated")

Database assertions in system specs are a code smell -- they bypass the UI
contract the test is supposed to verify.

## Negative Assertions

Negative assertions are a narrow, specific tool. Two distinct failure modes
make them dangerous when used carelessly:

1. `not_to have_*` does not retry -- it passes immediately if the element is
   absent at that instant, racing against async updates
2. Asserting absence of something never present always passes and proves nothing

Use `have_no_*` (not `not_to have_*`) and only after establishing presence:

# Wrong -- spinner may never have appeared; always passes

click_button "Submit"
expect(page).to have_no_css(".loading")

# Wrong -- does not retry; may pass before spinner appears

click_button "Submit"
expect(page).not_to have_css(".loading")

# Correct -- establish presence first, then assert disappearance

click_button "Submit"
expect(page).to have_css(".loading")
expect(page).to have_no_css(".loading")

Prefer positive post-action assertions. Use negative assertions only when
the transient state (loading, error, modal) is itself what you are testing.

## Scoping Assertions

Avoid asserting against the full page when the same text or element could
appear in multiple regions (nav, sidebar, flash, body). Use `within` to
scope to the relevant container.

# Brittle -- "Saved" may match a flash message, not the record

expect(page).to have_text("Saved")

# Better

within "#main-content" do
expect(page).to have_text("Saved")
end

## Full Example

perform_async_work(...)
expect(page).to have_button("Submit", disabled: false) # pre-assert: async guard
click_button "Submit"
expect(page).to have_text("Players in Lobby:") # post-assert: unique to success
