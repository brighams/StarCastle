---
apply: always
---

# Web App Coding Prompt (Generic, Constraint-First)
**Project Overview**

This repository contains two related subprojects.

**StarCastle/2d**
A complete implementation of the game using raw WebGL for rendering. This version is considered the **authoritative reference implementation**.

Rules:

* Treat this directory as **read-only**.
* **Do not modify any files** in this directory.
* Use the 2D implementation strictly as a **behavioral and feature reference**.

**StarCastle/3d**
The active project. This is a port of the 2D game to a full 3D implementation using **three.js**.

The objective is to recreate **all gameplay behavior from the 2D version** while expanding the simulation into a fully navigable 3D environment with cameras and models.

---

**Primary Objective**

Implement a **feature-complete 3D version** of the game that preserves the mechanics, rules, and behavior of the 2D version as closely as possible.

All gameplay logic should remain consistent with the 2D implementation unless a change is required to support the transition to 3D space.

---

**StarCastle/3d – Design Goals**

Physics

* Implement **space flight simulator–style physics** consistent with the 2D version, extended into full 3D motion.

Controls

* `W/S` – forward/back thrusters
* `A/D` – lateral thrusters
* Mouse – heading, pitch, yaw

Camera

* Third-person perspective.
* The player controls a ship viewed from behind or slightly offset.

Models

* Each game entity should have a simple 3D model.
* Models should be generated as **Blender `.glTF` files**.

Architecture

* Each major sprite from the 2D game becomes an **encapsulated object/class** in the 3D implementation.
* Assume **multiple instances** of every entity type may exist (player ships, star castles, enemies, etc.).

State Management

* All state should be **encapsulated within objects**.
* Avoid global or loose state variables.
* Only use shared/global state when absolutely necessary and clearly justified.

---

**Implementation Philosophy**

* Use the **2D implementation as the canonical gameplay reference**.
* Preserve game mechanics first, then extend spatial representation to 3D.
* Favor **clear modular architecture** over shortcuts.
* Code should support **multiple entities and scalable simulation**.

---

If useful, a stronger version for Codex planning phases can also include an explicit planning rule such as:

> Before implementing code, generate a detailed project plan describing system architecture, entity models, physics approach, input handling, rendering pipeline, and asset pipeline. Do not write implementation code until the plan is complete.


## Absolute Output Contract

- Respond with a **directly applicable patch**.
- Include the **file name** above each code block.
- Keep changes **incremental, correct, and fully functional**.
- **Focus only** on the task requested. Do not add features or anticipate future needs.
- Do not add dead code or unused features.
- Do not add new npm packages, frameworks, or modules.
- Only create new source files if absolutely necessary and follow existing naming conventions.
- Validate imports against `package.json`.

---

## Non-Negotiable Code Rules

### Iteration (Hard)

- **NEVER** use `array.forEach(...)` (or `forEach` anywhere).
- Use `for (const x of xs)` / `for (const [i, x] of xs.entries())` instead.
- For object iteration, use `for (const [k, v] of Object.entries(obj))`.

### Async (Hard)

- Always use `async/await`.
- Do **NOT** use promise chaining: `then`, `catch`, `finally`
- If libraries do not support async/await, wrap them in a promise
- NEVER use completion or error callbacks.

### Strings & Quotes (Hard)

- **Always** use **single quotes** for strings: `'text'`.
- Always use **template literals** for interpolation: `` `${a} ${b}` ``.
- Do **NOT** use string concatenation with `+`.

> JSX note: Prefer `{ 'text' }` for string props/children if needed to preserve single quotes, e.g.
`<Button label={'Save'} />`.

### Semicolons (Hard)

- **No semicolons unless the language requires them** (TypeScript/JavaScript/TSX)

### Imports / Modules

- Always use **ES module syntax** (`import` / `export`).
- No CommonJS (`require`, `module.exports`).

### Functions

- Define functions as const arrow functions:
  ```ts
  const my_function = (x: X): Y => {
    // ...
  }
  ``` 
- Naming:
  - `snake_case` → functions and non-component variables
  - `CamelCase` → React components, types, interfaces, enums
  - `IMPORTANT_THINGS` → ALL CAPS constants only when explicitly designated as such
- Parameters:
  - prefer to use object destructuring for multiple parameters
  - provide default values for optional parameters that do not cause a side effect
  - use param = null to indicate an optional parameter that may be null
  - only check for nulls on option parameters

### When Using Tailwind

- Use Tailwind utility classes only.
- Do not introduce custom CSS classes unless already present and required.

### Duplication

- If a block of logic is repeated, extract a function.
- Do not call it a “Helper Function”. Use a descriptive name.

### Comments

- DO NOT ADD ANY NEW COMMENTS.

---

## Method Chaining Rules (Very Strict)

- **No method chaining Except as described below.**.
- **Allowed:** chainable list-processing pipelines and string processing:
  - Example allowed:
    - `list.filter(...).map(...)`
    - `str.trim().toLowerCase()`
- **Not allowed:** chaining for other domains (dates, strings, DOM, builders, request clients, class instances, etc.).

---

## Formatting

- Indentation: **2 spaces**
- TypeScript/JavaScript/TSX:
  - single quotes
  - no semicolons
- Keep diffs small and readable.

---

## “Do Not Do” HARD RULES

- No `forEach`
- No semicolons
- No `.then/.catch/.finally` method chaining
- No `var`
- No string concatenation with `+`
- No non-list method chaining
- No “Helper Function” phrase
- No comments

DO NOT PUT ANY COMMENTS IN CODE EVER
IF YOU FIND YOURSELF WRITING A COMMENT, MAKE A NEW FUNCTION WITH A GOOD NAME INSTEAD
DO NOT USE MAGIC NUMBERS - DECLARE A CONST VARIABLE AT THE TOP OF THE FILE
YOU ARE A CODING EXPERT - ALWAYS WRITE THE BEST CODE POSSIBLE
YOU ARE A CODING EXPERT - YOU DO NOT NEED COMMENTS
