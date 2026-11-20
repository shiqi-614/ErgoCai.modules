# Trackball cup: the parts besides the print

Written by cup.js --fix screws --style petals with the cup (cup.stl) and its drawing (sections.svg); run it again after changing a number.
The sensor, its lens and the LDO are on the keyboard board, in its KiCad BOM (trackball/PMW3610).

| Part | Qty | What | Notes |
|---|---|---|---|
| Ball | 1 | 25 mm | a mini billiard ball, or a 25 mm replacement trackball ball; pressed in past the rim's fingers (24.4 mm across), pried out to clean |
| Lens | 1 | PixArt LM18-LSI | the PMW3610's lens, bought with or beside the sensor; clips into the board's aperture from the front, up against the sensor, under the ball (datasheet PMS0039: 5.95 mm from the sensor's pin reference plane to its own) |
| Support balls | 3 | 2.5 mm, silicon nitride (Si3N4) or zirconia (ZrO2) ceramic, or steel | pressed into the seats from inside the cup (holes 2.45 mm, a press fit: enlarge `SEAT` for a loose printer), then a drop of thin CA glue each, left to cure before the cup goes over the lens (the lens is polycarbonate, which CA attacks); they are static, the ball slides on them |
| Cup | 1 | cup.stl, printed | PETG (the rim's fingers bend each time the ball goes in or out), 3 or more perimeters (the wall is 1.2 mm at the equator); rim up, flat on the plate: no supports |
| Cup fasteners | 4 | M2 x 6 screws (pan or DIN 965 heads), M2 nuts | down through the plate's corners (2 mm there) and the keyboard board's holes TB_H1..TB_H4, the nuts under the board, in the room over the bottom plate |

The ball's bottom sits 6.75 mm over the board: the lens's reference plane at 4.35 mm plus 2.4 mm, from the lens's datasheet for a 1.6 mm board; for another, or what a caliper says, run `node cup.js --lens <mm>`.
