# Trackball cup: the parts besides the print

Written by cup.js --fix screws --style seat with the cup (cup.stl) and its drawing (sections.svg); run it again after changing a number.
The sensor, its lens and the LDO are on the keyboard board, in its KiCad BOM (trackball/PMW3610).

| Part | Qty | What | Notes |
|---|---|---|---|
| Ball | 1 | 20 mm | a PTFE ball as the seat's makers use, a mini billiard ball, or a 20 mm replacement trackball ball; laid in before the holding balls go in, taken out to clean after they come out |
| Lens | 1 | PixArt LM18-LSI | the PMW3610's lens, bought with or beside the sensor; into the board's aperture from the front, its posts in the sensor, under the ball (datasheet PMS0039: 5.95 mm from the sensor's pin reference plane to its own); the cup's two strips hold it down on its long edges, so it stays when the keyboard is upside down (no CA glue: it is polycarbonate) |
| Small balls | 6 | 2 mm, PTFE (as the seat's makers use them), or ceramic | three supports pressed half into the wall under the ball (holes 1.95 mm, a press fit), three that hold the ball down dropped into the lugs' holes from above once the ball is in (take them out to take the ball out); no glue: PTFE takes none, and the lens is polycarbonate, which CA attacks |
| Cup | 1 | cup.stl, printed | PETG or PLA (nothing in it bends), 3 or more perimeters (the wall is 1.5 mm at the equator); the plinth down, flat: no supports |
| Cup fasteners | 4 + 4 | M2 heat-set inserts (M2 x 3 x 3.2), M2 x 6 screws (pan heads) | the inserts melted into the bosses from below, the screws up through the keyboard board's holes TB_H1..TB_H4 into them |

The ball's bottom sits 6.75 mm over the board: the lens's reference plane at 4.35 mm plus 2.4 mm, from the lens's datasheet for a 1.6 mm board; for another, or what a caliper says, run `node cup.js --lens <mm>`.

## Printing

- Layers 0.12 to 0.16 mm: the cavity is a sphere, and its wall stands 1.0 mm off the ball, so coarse layers leave steps the ball can touch; 0.4 mm nozzle, 3 or more perimeters, 30 % infill or more.
- The small balls' holes are 1.95 mm for 2 mm balls, a press fit: print a test cup and try a ball first. Tight: ream with a 2 mm drill by hand (no glue). Loose: make `SEAT` in cup.js smaller. The supports' holes print at an angle and the holding balls' straight down; clear the strings out of both.
- The inserts' holes are 3.2 mm across and 3.2 mm deep: melt the inserts in square with a soldering iron (about 220 °C for PETG), let them stand proud by no more than 0.1 mm, then file them flush.
- Plinth down, flat: no supports. PETG or PLA.
