## Global context

The application is for building interactive experiences for live audiences

The data model can be dervied from the schema (db/schema.rb) and the types file
(app/frontend/types)

## Domain

An experience represents the top level container for an interactive experience.

Participants represent users who are joining a given experience

ExperienceBlocks (blocks on the frontend) are the components which make up an
interactive experience. They have a payload column for rapid prototyping so any
structure can be experimented with

Experience blocks have visibility based on segment, role, and target_user_id.
The role refers to the participant role, not the user record associated with the
participant. These rules are reflected in the visibility service, and the policy
files.

The experience is managed via the /manage route and Manage componenet. At a
given time there are important contexts to get an overview of an experience.

- What is on the "TV". This is a public view of an experience. Custom data can
  live in block payloads to help provide rendering context for the "TV" view

- What does a given participant see? At any given time a user may have an open
  block that is visible to them. The participant context shows what any they will
  currently see.
  - NOTE: Blocks are typically rendered the same way for anyone who can see them
    In order to support rapid prototyping, the client may do some conditional
    rendering for blocks to appear a different way. That is an acceptable path
    for prototyping, but keep in mind the future state of blocks rendering the
    same way

## Auth

The app uses session auth for administrative and user management concerns.

There is JWT auth for the experience. Generally speaking, admins can do anything
pariticpants need a jwt to be a part of the experience. This is modeled in the
ExperienceContext.tsx and the route guards in App.tsx

## Messaging protocols

The app uses websockets for real time communication. Any experience update
triggers a broadcast. This updates every participants view of the experience.
This is unoptimized and will calculate a payload per user per update. This is
intentional as this is a prototype

## Code style

Follow existing patterns

### Front-end

- Use css modules
- Prefer components UI elements from app/frontend/Core
- Don't repeat colors and variables. use variables from app/frontend/styles.css
