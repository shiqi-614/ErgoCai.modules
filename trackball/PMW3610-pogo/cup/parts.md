# Trackball cup: the parts besides the print

Written by cup.js --fix cartridge --style seat with the cup (cup.stl), the base (base.stl) and its drawing (sections.svg); run it again after changing a number.
The module board itself is in the KiCad BOM of PMW3610-pogo.

| Part | Qty | What | Notes |
|---|---|---|---|
| Ball | 1 | 20 mm | a PTFE ball as the seat's makers use, a mini billiard ball, or a 20 mm replacement trackball ball; laid in before the holding balls go in, taken out to clean after they come out |
| Lens | 1 | PixArt LM18-LSI | the PMW3610's lens, bought with or beside the sensor; clips into the board's aperture from the front, up against the sensor, under the ball (datasheet PMS0039: 5.95 mm from the sensor's pin reference plane to its own) |
| Small balls | 6 | 2 mm, PTFE (as the seat's makers use them), or ceramic | three supports pressed half into the wall under the ball (holes 1.95 mm, a press fit), three that hold the ball down dropped into the lugs' holes from above once the ball is in (take them out to take the ball out); no glue: PTFE takes none, and the lens is polycarbonate, which CA attacks |
| Cup and frame | 1 | cup.stl, printed | PETG (the arms bend as the cartridge snaps under the case's top layer), 3 or more perimeters; the frame's bottom down, supports under the plinth (the rim goes 1.6 mm further down, round the board) and under the arms |
| Base | 1 | base.stl, printed | PETG or PLA; the plate down, flat: no supports |
| Inserts | 4 | M2 heat-set inserts (M2 x 3 x 3.2) | melted into the base's spacers from above |
| Screws | 4 | M2 x 12 countersunk (DIN 965 / ISO 7046) | the module board in the frame, on the base: down through the cup's corners and the board into the spacers' inserts, their heads flush; the base's spigots go into the keyboard board's mount holes, and the frame's arms snap under the case's top layer: no screws into the keyboard |

The ball's bottom sits 6.75 mm over the board: the lens's reference plane at 4.35 mm plus 2.4 mm, from the lens's datasheet for a 1.6 mm board; for another, or what a caliper says, run `node cup.js --lens <mm>`.

## Printing

- Layers 0.12 to 0.16 mm: the cavity is a sphere, and its wall stands 1.0 mm off the ball, so coarse layers leave steps the ball can touch; 0.4 mm nozzle, 3 or more perimeters, 30 % infill or more.
- The small balls' holes are 1.95 mm for 2 mm balls, a press fit: print a test cup and try a ball first. Tight: ream with a 2 mm drill by hand (no glue). Loose: make `SEAT` in cup.js smaller. The supports' holes print at an angle and the holding balls' straight down; clear the strings out of both.
- The inserts' holes are 3.2 mm across and 3.2 mm deep: melt the inserts in square with a soldering iron (about 220 °C for PETG), let them stand proud by no more than 0.1 mm, then file them flush.
- Cup and frame: frame bottom down, in PETG (PLA is too stiff for the arms and cracks). Supports, touching the build plate only, under the plinth (inside the rim) and under the arms and hooks; tree supports come off cleanest. None in the cavity: its lowest part is the lens pocket, open down.
- The arms bend along the layers: keep them whole, with no seam on them (seam "rear" or painted onto the frame's ends), and leave out ironing and fuzzy skin.
- Elephant's foot on the frame bottom makes the rim tight on the board's edge (0.15 mm each side): use the slicer's compensation (0.1 to 0.2 mm), or scrape the first layer's edge inside.
- The hooks' tops stand 0.1 mm over the case's ledge: if the cartridge will not snap in, file them down a little; if it rattles, raise `clamp` in cup.js and print again.
- Base: plate down, flat, no supports; PETG or PLA. The spigots at +x go into the keyboard board's mount holes (2.2 mm): 2.15 mm, sand them if they bind.
