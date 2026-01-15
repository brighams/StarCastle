# STARKEEPER ONE
### Inspired by the 1980 arcade game Star Castle

A WebGL recreation of the classic 1980 arcade game Star Castle.

![Star Castle Gameplay](README.png)

## About

Star Castle is a vector-graphics arcade shooter where you pilot a ship around a fortified castle defended by rotating energy rings. Your goal is to blast through the defensive rings and destroy the reactor core at the center, all while avoiding enemy sparks and the castle's deadly cannon.

## How to Play

- **W** - Thrust forward
- **S** - Brake / Reverse thrust
- **A** - Rotate left
- **D** - Rotate right
- **Spacebar** - Fire (max 3 shots on screen)

## Game Mechanics

- **Castle Rings** - Three rotating rings protect the castle core. Destroy all segments of a ring to temporarily disable it (it will respawn after a short delay).
- **Castle Cannon** - The cannon tracks your ship and fires when a gap aligns through all three rings. Watch out for the large cyan spark!
- **Enemy Sparks** - Purple sparks spawn from the castle and chase your ship. Destroy them or evade them.
- **Castle Core** - When you destroy the red core at the center, you win the round and gain an extra life.

## Running the Game

Simply open `starcastle.html` in a modern web browser with WebGL support.
