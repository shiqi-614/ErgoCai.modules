# Trackball cup: the parts besides the print

Written by cup.js with the cup (cup.stl) and its drawing (sections.svg); run it again after changing a number.
The module board itself is in the KiCad BOM of PMW3610-pogo.

| Part | Qty | What | Notes |
|---|---|---|---|
| Ball | 1 | 25 mm | a mini billiard ball, or a 25 mm replacement trackball ball |
| Support balls | 3 | 2.5 mm, silicon nitride (Si3N4) or zirconia (ZrO2) ceramic, or steel | pressed into the seats from inside the cup (holes 2.45 mm, a press fit: enlarge `SEAT` for a loose printer); they are static, the ball slides on them |
| Cup | 1 | cup.stl, printed | PETG or PLA, 3 or more perimeters (the wall is 1.2 mm at the equator); rim up, supports only under the plate, between the skirts |
| Module fasteners | 4 | M2 screws and 4 mm M2 standoffs | or M2 locating pins and 4 x 2 mm disc magnets: the mount takes either (ErgoCaiLib Ps4JoystickMount_Pogo); the module is fastened first, then the cup snaps on |

The ball's bottom sits 5.80 mm over the board: the lens's reference plane at 3.4 mm plus 2.4 mm. 3.4 mm is assumed; measure the lens and run `node cup.js --lens <mm>`.
