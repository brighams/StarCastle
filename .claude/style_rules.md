---
apply: always
---

# JavaScript & TypeScript Style Rules

## Async
- Always use `async/await` — never `.then`, `.catch`, or `.finally`
- Never use completion or error callbacks
- If a library doesn't support async/await, wrap it in a promise

## Iteration
- Never use `forEach`
- Use `for (const x of xs)` or `for (const [i, x] of xs.entries())`
- For objects: `for (const [k, v] of Object.entries(obj))`

## Strings
- Single quotes: `'text'`
- Template literals for interpolation: `` `${a} ${b}` ``
- Never concatenate with `+`

## Method Chaining
- Allowed: list-processing and string pipelines only
    - `list.filter(...).map(...)`
    - `str.trim().toLowerCase()`
- Not allowed: dates, DOM, builders, request clients, class instances, etc.

## Modules
- Always use ES module syntax: `import` / `export`
- Never use CommonJS: `require`, `module.exports`

## Formatting  (JS/TS/TSX/SQL/HTML/CSS)
- 2-space indentation
- No semicolons

## Functions
- Define as const arrow functions:
  ```ts
  const my_function = (x: X): Y => {
    // ...
  }
  ```

## Naming
- `snake_case` — functions and non-component variables
- `PascalCase` — React components, types, interfaces, enums
- `ALL_CAPS` — only for explicitly designated constants

## Parameters
- Prefer object destructuring for multiple parameters
- Provide default values for optional parameters that have no side effects
- Use `param = null` for optional parameters that may be null
- Only null-check optional parameters

## Comments
- No comments
- No "Helper Function" in prose or code
