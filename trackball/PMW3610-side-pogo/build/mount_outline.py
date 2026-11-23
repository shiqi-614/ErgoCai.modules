# usage: mount_outline.py [opening.json]: the case's opening that cartridge.js worked out (build/opening.json, written
# when the mount's User.1 does not fit the module: a bigger ball, or a smaller module board) into the mount's User.1 polygon: ErgoCaiLib's
# Pogo_ModuleMount_1x6_P2.54mm (ERGOCAI_LIB, or ../ErgoCaiLib beside ErgoCai.modules) and its copy in
# joystick/joystick-mount-pogo. ergogen cuts the side module's case round it (layers [User.1], cut: outline), and
# cartridge.js reads it back, so run cartridge.js again after this. The joystick and the trackball read from above
# do not use User.1.
import json, os, re, sys
B = os.path.dirname(os.path.abspath(__file__))
src = sys.argv[1] if len(sys.argv) > 1 else os.path.join(B, 'opening.json')
pts = json.load(open(src))['user1']                     # KiCad's frame, y down
modules = os.path.normpath(os.path.join(B, '..', '..', '..'))
lib = os.environ.get('ERGOCAI_LIB', os.path.join(os.path.dirname(modules), 'ErgoCaiLib'))
files = [os.path.join(lib, 'footprints', 'ErgoCai.pretty', 'Pogo_ModuleMount_1x6_P2.54mm.kicad_mod'),
         os.path.join(modules, 'joystick', 'joystick-mount-pogo', 'joystick-mount-pogo.kicad_pcb')]
xy = ' '.join(f'(xy {x:g} {y:g})' for x, y in pts)
for f in files:
    s = open(f).read()
    # the fp_poly whose layer is User.1: its pts, however they are laid out
    out, n = [], 0
    for m in re.finditer(r'\(fp_poly\s*\(pts(.*?)\)\s*\(stroke', s, re.S):
        block_end = s.find('(layer', m.end())
        if not s.startswith('(layer "User.1"', block_end): continue
        out.append((m.start(1), m.end(1))); n += 1
    if n != 1: sys.exit(f'{f}: {n} User.1 polygons, expected one')
    a, b = out[0]
    s = s[:a] + ' ' + xy + s[b:]
    open(f, 'w').write(s)
    print(f'{f}: User.1, {len(pts)} points')
