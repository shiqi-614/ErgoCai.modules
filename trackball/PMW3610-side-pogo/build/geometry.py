# usage: geometry.py [params.json] [geometry.json]: the module's sizes that follow the ball's, from params.json (ball:
# the ball's diameter, mm) into geometry.json, which module_pcb.py, sensor_pcb.py, inset.py, sensor_finish.py,
# run_module.sh and cartridge.js read. The rest of the module is the 20 mm ball's, as drawn round it:
# - the ball lies FLOOR over the module board's top; the sensor reads it level with its centre, the lens's face
#   LENS_GAP from it, the sensor board's front LENS_DEPTH behind that (the LM18-LSI's height over the board);
# - the sensor board stands on the module board; the PMW3610's optical centre at the ball's centre's height, its upper
#   pin row 5.35 over that and the capacitors' row over it, so the board's top TOP over the centre;
# - everything at +x (the sensor board, its notch, the module board's end behind it) moves out with the sensor board,
#   but only as far as the 25 mm ball's did, when a screw in the mount's fifth hole (24.5, 0) stood behind it: past
#   that the ball's axis moves to -x instead. (The module board has no hole there now, it ends behind the sensor
#   board; the mount still has it, for the other modules. Letting the sensor board out further would move the
#   module's +x end, and the case's opening, out with it);
# - the case's opening (the mount's User.1) is cartridge.js's: the module board's outline and the ball's seat.
import json, os, sys
B = os.path.dirname(os.path.abspath(__file__))
src = sys.argv[1] if len(sys.argv) > 1 else os.path.join(B, '..', 'params.json')
dst = sys.argv[2] if len(sys.argv) > 2 else os.path.join(B, 'geometry.json')
ball = float(json.load(open(src))['ball'])
R = ball / 2
FLOOR, LENS_GAP, LENS_DEPTH, TOP = 1.6, 2.4, 4.35, 8.4
SENSOR_T, BODY = 1.6, 3.1                      # the sensor board's thickness, the PMW3610's depth behind it
# how far out the sensor board's front may come: the fifth hole's screw (2.3 mm) left it 0.5 mm of wall from the room
# behind the sensor board (its body and 0.2 round it)
HOLE3, SCREW, WALL = (24.5, 0.0), 2.3, 0.5
X0_MAX = HOLE3[0] - SCREW / 2 - WALL - 0.2 - BODY - SENSOR_T
x0 = min(R + LENS_GAP + LENS_DEPTH, X0_MAX)
AXIS = {'x': x0 - (R + LENS_GAP + LENS_DEPTH), 'y': -1.5, 'z': R + FLOOR}
dx = x0 - 16.75                                # how far the +x side moves from the 20 mm ball's
z = AXIS['z']
# the module board's outline (KiCad, y down), the 20 mm ball's with its +x side moved: the notch the sensor board's tab
# goes down into, its +x end 0.55 behind the sensor board's parts, the +y corner cut back clear of the keyboard's
# mounting hole
notch = (16.55 + dx, 18.55 + dx, 5.0)
outline = [(-14.5, -13), (notch[0], -13), (notch[0], notch[2]), (notch[1], notch[2]), (notch[1], -13), (22 + dx, -13),
           (22 + dx, 4.5), (21 + dx, 4.5), (21 + dx, 7), (18.5 + dx, 13), (-14.5, 13)]
g = {
    'ball': ball, 'R': R, 'axis': AXIS, 'dx': round(dx, 3),
    'outline': [[round(x, 3), round(y, 3)] for x, y in outline], 'notch': [round(v, 3) for v in notch],
    # the sensor board in the module's frame, and its lens and body (y KiCad's, z over the module board's top)
    'sensor': {'x0': x0, 'x1': x0 + SENSOR_T, 'y': 13.0, 'top': z + TOP,
               'lens': {'x0': x0 - LENS_DEPTH, 'y0': -13.0, 'y1': 4.96, 'z0': z - 4.7, 'z1': z + 4.7},
               'body': {'x1': x0 + SENSOR_T + BODY, 'y0': -12.59, 'y1': 3.61, 'z0': z - 4.55, 'z1': z + 4.55}},
    # the header's holes in the module board: its rows 3.81 and 1.27 in front of the sensor board
    'j1': {'x': round(x0 - 3.81, 3), 'y': 6.61},
    # the sensor board in its own frame (x along it, y down from its top, its bottom edge at y 0): the sensor's
    # optical centre's height over the bottom edge, the board's height
    'sensor_board': {'axis_z': z, 'h': round(z + TOP, 3)},
    # the roof over the lens: open round the ball's axis, wide enough for the ball to lift out
    'stop': {'open': R + 0.5},
}
# what the fixed parts leave no room for
warn = []
if AXIS['x'] < 0:
    warn.append(f"the ball's axis moves to x {AXIS['x']:.2f}, the sensor board as far out as the 25 mm ball's")
g['warnings'] = warn
rounded = lambda v: {k: rounded(w) for k, w in v.items()} if isinstance(v, dict) else [rounded(w) for w in v] if isinstance(v, list) else round(v, 3) if isinstance(v, float) else v
json.dump(rounded(g), open(dst, 'w'), indent=1)
print(f'ball {ball}: centre {z:.2f} over the module board, sensor board x {x0:.2f}..{x0 + SENSOR_T:.2f}, {z + TOP:.2f} tall')
for w in warn: print('  note:', w)
