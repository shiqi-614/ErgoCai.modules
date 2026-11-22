# trackball/PMW3610-side-pogo: the trackball read from the side, on the pogo mount

A 20 mm ball beside a PixArt PMW3610DM-SUDU that reads it from the side. The ball stands high, as keyball's: its
equator 4 mm over the case's top, so the thumb (from -x) reaches its side; its top 27 mm over the keyboard board. It goes on the joystick mount (joystick/joystick-mount-pogo) as
it is (not turned), on the mount's holes at x -12.35 and its fifth hole at (24.5, 0), and needs a case of its own that
opens round the mount's User.1 outline (ErgoCai.ts: the mount's cut-outs with `layers: [User.1]`, `cut: outline`).

- `PMW3610-side-pogo.kicad_*`: the module board. The six pogo pins (TB_P1..6) where the mount's pads are (pin k on pad
  k: VCC, SDIO, SCLK, NCS, MOTION, GND), the ball's 17 mm hole round its axis (0, -1.5) (the ball now clears the board), TB_J1's six holes for the
  sensor board's header, a notch the sensor board's tab goes down into, three mounting holes.
- `sensor/`: the sensor board, 26 x 21.5 mm, standing upright on the module board, its front (the LM18-LSI lens) toward
  the ball, the lens's face 2.4 mm from it, the sensor's optical centre 11.6 mm over the module board, level with the
  ball's centre. The PMW3610 on its back, its lens through the board's aperture; the 1.8 V
  LDO and the capacitors (the same circuit as trackball/PMW3610-pogo). TB_J1, a 2x3 right-angle pin header on its
  front, its pins bent down into the module board, soldered on both. A tab under the sensor's lower pin row goes down
  through the module board's notch: the lens's aperture boxes that row in, and its lines run in the tab.
- `cartridge/`: the printed frame and base (`cartridge.js`), screwed together through the module board's holes; the
  frame holds the ball's seat (three 2 mm support balls the ball lies on, the seat's rim 2 mm under its equator;
  nothing holds it down: it lifts out; two more on posts each side of the lens, level with its centre, stop the
  thumb's push toward the sensor; a roof over the lens from the posts to the hood, walled at its sides, keeps light
  and dust off the lens), a hood over the sensor board,
  the cover flush with the case's top, and two hook arms that snap under the case's top layer (at the thumb's end and
  on the +y side). `node cartridge.js --glb cartridge.glb --step <ErgoCaiLib>/3dmodels/TrackballCartridge_PMW3610-side-pogo.step`
- `PMW3610-side-pogo.glb`: the module in 3D, with the cartridge and the sensor board in place (the board's
  TB_CART1, ErgoCaiLib TrackballCartridge_PMW3610-side-pogo), for ergogen-gui's assembly: at_module joystick,
  z 11.8 (the module board's bottom).
- `build/`: the scripts that make both boards (schematics, placement, the sensor's lower pin row's escape laid by
  hand, Freerouting, zones), `run_module.sh` and `run_sensor.sh`. Freerouting's result differs from run to run: the
  sensor board took a few runs to route all of it.

The firmware is the trackball's (zmk-ergo-cai shield trackball; pogo_detect finds it as a trackball). Read from the side,
its axes may not run as the trackball read from below: flip them in zmk-config (`&trackball { invert-x; };`, or
`invert-y`) once it is built.

## Parts besides the prints

| Part | Qty | What | Notes |
|---|---|---|---|
| Ball | 1 | 20 mm | PTFE, or an acrylic ball; it lies in the seat, and falls out with the keyboard upside down |
| Small balls | 5 | 2 mm PTFE | three supports and the two stops, pressed into their holes (1.95 mm, a press fit) from inside the seat |
| Lens | 1 | PixArt LM18-LSI | clips into the sensor board's aperture from the front |
| Pin header | 1 | 2x3, 2.54 mm, right angle | on the sensor board's front; trim its pins after soldering into the module board |
| Pogo pins | 6 | KERUI KTT50003UT01-R | on the module board's back |
| Inserts | 3 | M2 x 3 x 3.2 heat-set | into the base's spacers |
| Screws | 3 | M2 x 12 countersunk (DIN 965) | down through the frame's columns and the module board into the inserts |

Assembly: solder the sensor board (its parts, the sensor with its leads trimmed); the header on its front; stand it
in the module board's notch, the header's pins through TB_J1, and solder them; the pogo pins; the inserts into the
base; the module board on the base, the frame over it (its hood over the sensor board), the screws; the support balls
into the seat, the ball.
