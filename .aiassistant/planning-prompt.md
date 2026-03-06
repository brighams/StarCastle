Use a planning prompt that forces the model to **analyze first, design second, and only then produce an executable build prompt**. The goal is to convert the 2D codebase and the base rules into a structured implementation plan for the 3D port.

Below is a Codex-optimized planning prompt intended for GPT-5.3.

---

### Codex Planning Prompt

You are acting as a **senior game engine architect** preparing a full implementation plan for a 3D port of an existing 2D WebGL game.

Your task is **not to write implementation code yet**. Your task is to analyze the existing codebase and produce a detailed plan that will later be used to generate code.

The repository contains two projects:

* `StarCastle/2d` — the original reference implementation (read-only)
* `StarCastle/3d` — the new implementation to be built using three.js

The 2D project is the **canonical source of gameplay behavior** and must be studied carefully before planning the 3D implementation.

---

## Step 1 — Read and Analyze the 2D Implementation

Read **all files in `StarCastle/2d`** and determine:

* Core game loop structure
* Entity types
* Physics behavior
* Input handling
* Rendering approach
* Object relationships
* State management patterns
* Collision and interaction rules
* Any implicit gameplay mechanics not documented in comments

Produce a **structured breakdown** of the 2D system including:

Game Architecture

* main loop
* update pipeline
* render pipeline

Game Entities

* player ship
* star castles
* projectiles
* enemies
* other entities discovered

For each entity identify:

* responsibilities
* state variables
* update logic
* interactions with other entities

Physics Model

* motion model
* velocity handling
* rotation rules
* thrust mechanics
* collision logic

Input System

* keyboard controls
* mouse usage (if any)

Rendering Model

* how sprites are structured
* coordinate systems
* camera assumptions

---

## Step 2 — Identify Porting Requirements

Determine what must change when transitioning from 2D to 3D.

Document:

2D → 3D Transformations

* position vectors
* rotation representation
* camera model
* world coordinate system

Physics Changes

* extension from planar motion to 3D vectors
* orientation handling
* thruster directions

Rendering Changes

* sprites → 3D meshes
* WebGL raw calls → three.js scene graph

Asset Pipeline

* required `.glTF` models
* entity-model mapping

---

## Step 3 — Design the 3D Architecture

Design the architecture for `StarCastle/3d`.

The architecture must satisfy the project rules:

* encapsulated objects
* minimal global state
* support multiple instances of entities
* behavior parity with the 2D version

Define:

Project Structure

```
StarCastle/3d
  engine/
  entities/
  physics/
  input/
  rendering/
  assets/
```

Core Systems

* Game loop
* Entity manager
* Physics system
* Input controller
* Rendering system
* Camera system

Entity Class Design
Define classes for:

* PlayerShip
* StarCastle
* Projectile
* Enemy (if present)
* BaseEntity

Each class description should include:

* responsibilities
* internal state
* update methods
* interactions

---

## Step 4 — Map 2D Code to 3D Classes

Create a **mapping table** from 2D code to 3D architecture.

Example format:

```
2D File / System → 3D Component

ship.js → PlayerShip class
castle.js → StarCastle class
projectile.js → Projectile class
input.js → InputController
render.js → Renderer
```

Document what logic can be **reused conceptually** and what must be redesigned.

---

## Step 5 — Define the Implementation Roadmap

Create a step-by-step implementation sequence that an automated coding agent can follow.

Example phases:

Phase 1

* project scaffolding
* three.js initialization
* main game loop

Phase 2

* entity base classes
* object lifecycle system

Phase 3

* physics system

Phase 4

* player ship implementation

Phase 5

* star castle implementation

Phase 6

* combat mechanics

Phase 7

* camera and controls

Phase 8

* asset integration (.glTF)

Phase 9

* gameplay parity testing

Each phase must include **clear deliverables**.

---

## Step 6 — Generate an Executable Build Prompt

Finally, produce a **single executable prompt** that will instruct a coding agent to build the project.

The build prompt must include:

* architecture summary
* project folder layout
* entity definitions
* system responsibilities
* implementation order
* coding constraints

The generated build prompt should be structured so an AI coding agent can begin implementing the project immediately.

---

## Critical Rules

During planning:

* Do **not** write production code.
* Focus on architecture and system design.
* Preserve gameplay parity with the 2D implementation.
* Avoid introducing global state.
* Assume multiple instances of every entity.

The final output must contain:

1. 2D system analysis
2. 3D architecture design
3. entity mapping
4. implementation roadmap
5. the final executable build prompt
