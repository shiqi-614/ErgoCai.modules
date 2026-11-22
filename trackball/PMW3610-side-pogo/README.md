# trackball/PMW3610-side-pogo: the trackball read from the side, on the pogo mount

A 20 mm ball beside a PixArt PMW3610DM-SUDU that reads it from the side. The ball stands high, as keyball's: its
equator 4 mm over the case's top, so the thumb (from -x) reaches its side; its top 27 mm over the keyboard board. It goes on the joystick mount (joystick/joystick-mount-pogo) as
it is (not turned), on the mount's holes at x -12.35 and its fifth hole at (24.5, 0), and needs a case of its own that
opens round the mount's User.1 outline (ErgoCai.ts: the mount's cut-outs with `layers: [User.1]`, `cut: outline`).

- `PMW3610-side-pogo.kicad_*`: the module board. The six pogo pins (TB_P1..6) where the mount's pads are (pin k on pad
  k: VCC, SDIO, SCLK, NCS, MOTION, GND), no hole for the ball (it lies 1.6 mm over the board, its axis at (0, -1.5)), TB_J1's six holes for the
  sensor board's header, a notch the sensor board's tab goes down into, three mounting holes.
- `sensor/`: the sensor board, 26 x 20 mm, standing upright on the module board, its front (the LM18-LSI lens) toward
  the ball, the lens's face 2.4 mm from it, the sensor's optical centre 11.6 mm over the module board, level with the
  ball's centre. The PMW3610 on its back, its lens through the board's aperture; the charge
  pump's and VDD's capacitors in a row over its upper pin row; the 1.8 V LDO and its input capacitor beside it, over
  the header, VDDIO's capacitor and the reset pull-up under its lower pin row (the same circuit as trackball/PMW3610-pogo). TB_J1, a 2x3 right-angle pin header on its
  front, its pins bent down into the module board, soldered on both. A tab under the sensor's lower pin row goes down
  through the module board's notch: the lens's aperture boxes that row in, and its lines run in the tab.
- `cartridge/`: the printed frame and base (`cartridge.js`), screwed together through the module board's holes; the
  frame holds the ball's seat (three 2 mm support balls the ball lies on, the seat's rim 2 mm under its equator;
  nothing holds it down: it lifts out; two more on posts each side of the lens, level with its centre, stop the
  thumb's push toward the sensor; a roof over the lens from the posts to the hood, walled at its sides, keeps light
  and dust off the lens; two strips on the lens's long edges press it back against the sensor, as a mouse's base plate does (all one height with the hood's top; on the user's side the wall only over the header); a small visor over the ball between the sensor and the key matrix, no bigger than leaves
  the ball a way in, `node cartridge.js --way` to check), a hood over the sensor board,
  the cover flush with the case's top, and two hook arms that snap under the case's top layer (at the thumb's end and
  on the +y side). `node cartridge.js --glb cartridge.glb --step <ErgoCaiLib>/3dmodels/TrackballCartridge_PMW3610-side-pogo.step`
- `PMW3610-side-pogo.glb`: the module in 3D, with the cartridge and the sensor board in place (the board's
  TB_CART1, ErgoCaiLib TrackballCartridge_PMW3610-side-pogo), for ergogen-gui's assembly: at_module joystick,
  z 11.8 (the module board's bottom).
- `build/`: the scripts that make both boards (schematics, placement, the sensor's lower pin row's escape laid by
  hand, Freerouting, zones), `run_module.sh` and `run_sensor.sh`. Freerouting's result differs from run to run: the
  sensor board took a few runs to route all of it.

## Another ball size

Set the ball's diameter in `params.json` and run `build/run_all.sh` (MANIFOLD=<a node_modules with manifold-3d>,
ERGOCAI_LIB if ErgoCaiLib is not beside ErgoCai.modules). It works out what follows the ball (`build/geometry.py`
into `build/geometry.json`: the ball's centre's height, the sensor board's place and height, the header's holes, the
module board's +x side), makes the module board, the sensor board (its routing a few runs for each of the placements
`build/place.json` lists for a part, until it is clean), the cartridge, and the 3D models (the cartridge's and the
sensor board's STEP into ErgoCaiLib, the module's GLB). What the keyboard's board fixes stays: the pogo pads and the
mount's holes. So past the 20 mm ball the sensor board comes out only as far as the fifth hole's screw leaves room,
and the ball's axis moves to -x instead; the case's opening (the mount's User.1, in ErgoCaiLib and in
joystick-mount-pogo) grows to the module board and the ball's seat when it must (`build/opening.json`, then
`build/mount_outline.py`), and the keyboard's case follows it; the visor is the biggest that leaves the ball a way into
its seat. Tried: 20 mm (this) and 25 mm (the axis at x -1.3, the visor 46 degrees round, the ball's top 40 mm over the
case's bottom).

The firmware is the trackball's (zmk-ergo-cai shield trackball; pogo_detect finds it as a trackball). Read from the side,
its axes may not run as the trackball read from below: flip them in zmk-config (`&trackball { invert-x; };`, or
`invert-y`) once it is built.

## Parts besides the prints

| Part | Qty | What | Notes |
|---|---|---|---|
| Ball | 1 | 20 mm | PTFE, or an acrylic ball; it lies in the seat, and falls out with the keyboard upside down |
| Small balls | 5 | 2 mm PTFE | three supports and the two stops, pressed into their holes (1.95 mm, a press fit) from inside the seat |
| Lens | 1 | PixArt LM18-LSI | into the sensor board's aperture from the front, its posts in the sensor; the frame's two strips hold it there (no CA glue: it is polycarbonate) |
| Pin header | 1 | 2x3, 2.54 mm, right angle | on the sensor board's front; trim its pins after soldering into the module board |
| Pogo pins | 6 | KERUI KTT50003UT01-R | on the module board's back |
| Inserts | 3 | M2 x 3 x 3.2 heat-set | into the base's spacers |
| Screws | 3 | M2 x 12 countersunk (DIN 965) | down through the frame's columns and the module board into the inserts |

Assembly: solder the sensor board (its parts, the sensor with its leads trimmed); the header on its front; stand it
in the module board's notch, the header's pins through TB_J1, and solder them; the pogo pins; the inserts into the
base; the module board on the base, the frame over it (its hood over the sensor board), the screws; the support balls
into the seat, the ball.
