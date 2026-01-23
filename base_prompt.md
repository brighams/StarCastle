# Web App Coding Prompt (Generic, Constraint-First)

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
