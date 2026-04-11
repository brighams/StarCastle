# Project MAJOR TOM - STARKEEPER 2 ("StarCastles")
--

## Milestone 1

- Game World becomes a model, not pixels

- the view  is a camera into the world not the entire world

- world is 2000x2000 units

- when you hit the edge of the circle you will bounce off, same for all entities

- starcastle spawns at origin

- player spawns randomly around edge of world, say outer 20%

- Camera always locked on player ship


- add a "Radar" in the upper right corner of screen it will be a circle shaped and show a minimap with a x where the player is and a red square where star castle is in the origin.

The rest of the game works the same

## Milestone 2

- Multiple StarCastles
- sparks know where they come from
- they return to same castle
- have maximum distance they will stay within castle
- destroying a castle does not advance to the next level
- all castles must be destroyed!

## Milestone 3 - Squadrons
When a castle is destroyed
  Another ship will join the player.
  the "fleet" will have flocking behavior and try to stay together but they may behave on their own.
  wingmen will not try to shoot castle, but it could happen they are looking for sparks.
  
  Make it spawn randomly on the map and fly to the player and join up
  
  it will try to stay within X of player. It will try to shoot sparks, ignoring castles
  May have 2 additional wingmen
  Ships can die separately
  wingmen do not drop space mines
  
- Multiple ships in the player fleet
- Ship spawns, tries to stay in formation but plays defensively
