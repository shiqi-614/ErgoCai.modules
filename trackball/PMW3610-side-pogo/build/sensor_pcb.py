# PMW3610-side-pogo-sensor.kicad_pcb from PMW3610-pogo's: the board upright beside the ball, seen from its front (the
# lens's side, toward the ball): x along it (the module's y), y down from its top, its bottom edge on the module board
# at y 0 (z = -y over the module board's top). The pogo pins, the holes, the cup and all copper go; the sensor's
# optical centre at (AXIS_X, -AXIS_Z), the lens's long side to -x; TB_J1, the 1x6 right-angle header, on the back under
# the sensor, its pins bent down past the bottom edge into the module board; the LDO and the capacitors on the back.
# usage: sensor_pcb.py <board> <schematic> [place.json]
import sys, os, re, json, pcbnew
board, sch = sys.argv[1:3]
M, T = pcbnew.FromMM, pcbnew.ToMM
V = lambda x, y: pcbnew.VECTOR2I(M(x), M(y))
# the board's ends; its height and the sensor's optical centre's over its bottom edge (level with the ball's
# centre: its side over the case's top, for the thumb) from geometry.json (geometry.py: they follow the ball's size)
G = json.load(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'geometry.json')))
W0, W1, H = G['sensor']['y0'], G['sensor']['y1'], G['sensor_board']['h']     # its ends (the module's y), its height
AXIS_X, AXIS_Z = -1.5, G['sensor_board']['axis_z']
b = pcbnew.LoadBoard(board)
for t in list(b.GetTracks()): b.Delete(t)
for z in list(b.Zones()): b.Delete(z)
for d in list(b.GetDrawings()): b.Delete(d)
fps = {f.GetReference(): f for f in b.GetFootprints()}
for ref in list(fps):
    if ref.startswith('TB_P') or re.match(r'H\d', ref) or ref == 'TB_CUP1': b.Delete(fps.pop(ref))
# the outline: the board's whole bottom edge stands on the module board
pts = [V(W0, -H), V(W1, -H), V(W1, 0), V(W0, 0)]
for a, c in zip(pts, pts[1:] + pts[:1]):
    e = pcbnew.PCB_SHAPE(b, pcbnew.SHAPE_T_SEGMENT); e.SetLayer(pcbnew.Edge_Cuts); e.SetWidth(M(0.05)); e.SetStart(a); e.SetEnd(c); b.Add(e)
# the sensor: on the back, the lens's long side to -x
u1 = fps['TB_U1']
for rot in (0, 90, 180, 270):
    u1.SetOrientationDegrees(rot)
    # the lens's outline: the footprint's B.Fab, on F.Fab with the footprint flipped to the back
    lens = [g for g in u1.GraphicalItems() if g.GetLayerName() == 'F.Fab' and g.GetClass() == 'PCB_SHAPE']
    x0 = min(T(g.GetBoundingBox().GetLeft()) for g in lens) - T(u1.GetPosition().x)
    x1 = max(T(g.GetBoundingBox().GetRight()) for g in lens) - T(u1.GetPosition().x)
    if abs(x0 + 11.5) < 0.1 and abs(x1 - 6.46) < 0.1: break
else: sys.exit('no orientation puts the lens to -x')
u1.SetPosition(V(AXIS_X, -AXIS_Z))
# a keep-out round the lens's aperture (its Edge.Cuts rectangle in the footprint), the board's edge clearance and a
# little more: the autorouter keeps less than that from an inner cut-out
ap = [g for g in u1.GraphicalItems() if g.GetLayerName() == 'Edge.Cuts'][0].GetBoundingBox()
ka = pcbnew.ZONE(b); ka.SetIsRuleArea(True); ka.SetDoNotAllowTracks(True); ka.SetDoNotAllowVias(True)
ka.SetDoNotAllowPads(False); ka.SetDoNotAllowFootprints(False); ka.SetDoNotAllowCopperPour(False)
ka.SetLayerSet(pcbnew.LSET.AllCuMask())
o = ka.Outline(); o.NewOutline(); g = M(0.35)
for x, y in ((ap.GetLeft() - g, ap.GetTop() - g), (ap.GetRight() + g, ap.GetTop() - g), (ap.GetRight() + g, ap.GetBottom() + g), (ap.GetLeft() - g, ap.GetBottom() + g)):
    o.Append(int(x), int(y))
b.Add(ka)
print('TB_U1 at', AXIS_X, -AXIS_Z, 'rot', rot)
# the header, on the front: local x (its rows) down the board, local y (its columns) to -x; pad 1 at its origin
uid = re.search(r'\(uuid "([0-9a-f-]+)"\)\n\t\t\(property "Reference" "TB_J1"', open(sch).read()).group(1)
lib = '/Applications/KiCad/KiCad.app/Contents/SharedSupport/footprints/Connector_PinHeader_2.54mm.pretty'
j1 = pcbnew.FootprintLoad(lib, 'PinHeader_1x06_P2.54mm_Horizontal')
j1.SetFPIDAsString('Connector_PinHeader_2.54mm:PinHeader_1x06_P2.54mm_Horizontal')
j1.SetReference('TB_J1'); j1.SetValue('Conn_01x06')
b.Add(j1)
# on the back, pin k at (y1 + 2.54 (k - 1), -h) (the module's y is the board's x), the body from the pads down to the
# bottom edge: the orientation that puts them so
HD = G['header']
j1.SetPosition(V(HD['y1'], -HD['h'])); j1.Flip(j1.GetPosition(), pcbnew.FLIP_DIRECTION_LEFT_RIGHT)
for rot in (0, 90, 180, 270):
    j1.SetOrientationDegrees(rot)
    q = {p.GetNumber(): (T(p.GetPosition().x), T(p.GetPosition().y)) for p in j1.Pads()}
    # (its drawing: the body and the pins, which reach on past the bottom edge)
    below = max(T(g.GetBoundingBox().GetBottom()) for g in j1.GraphicalItems() if g.GetLayerName() in ('F.Fab', 'B.Fab'))
    if abs(q['6'][0] - (HD['y1'] + 5 * HD['pitch'])) < 0.01 and abs(q['6'][1] + HD['h']) < 0.01 and below > 0: break
else: sys.exit('no orientation puts the header so')
j1.SetPath(pcbnew.KIID_PATH(f'/{uid}'))
j1.SetSheetfile('PMW3610-side-pogo-sensor.kicad_sch'); j1.SetSheetname('/')
NETS = HD['nets']
for p in j1.Pads(): p.SetNet(b.FindNet(NETS[p.GetNumber()]))
for f in b.GetFootprints():
    if f.GetSheetfile() == 'PMW3610-pogo.kicad_sch': f.SetSheetfile('PMW3610-side-pogo-sensor.kicad_sch')
# the rest from place.json: ref -> [x, y, rot] or [x, y, rot, "axis"] (y from the sensor's optical centre, for the
# parts round it, which move with it), all on the back, as they were; or a list of such places to try in turn, the
# one PLACE_ALT picks (run_all.sh tries them until the board routes)
if len(sys.argv) > 3:
    alt = int(os.environ.get('PLACE_ALT', '0'))
    for ref, place in json.load(open(sys.argv[3])).items():
        if isinstance(place[0], list): place = place[alt % len(place)]
        x, y, r, *frm = place
        f = fps[ref]; f.SetPosition(V(x, y - AXIS_Z if frm == ['axis'] else y)); f.SetOrientationDegrees(r)
# TB_C2 and TB_C1 in 0402: C2 beside the header, C1 by the board's edge
if len(sys.argv) > 3:
    for ref in ('TB_C2', 'TB_C1'):
        c = fps[ref]
        small = pcbnew.FootprintLoad('/Applications/KiCad/KiCad.app/Contents/SharedSupport/footprints/Capacitor_SMD.pretty', 'C_0402_1005Metric')
        small.SetFPIDAsString('Capacitor_SMD:C_0402_1005Metric'); small.SetReference(ref); small.SetValue(c.GetValue())
        small.SetPath(c.GetPath()); small.SetSheetfile(c.GetSheetfile()); small.SetSheetname(c.GetSheetname())
        nets = {p.GetNumber(): p.GetNet() for p in c.Pads()}
        pos, rot = c.GetPosition(), c.GetOrientationDegrees()
        b.Delete(c); b.Add(small); small.SetPosition(pos); small.Flip(pos, pcbnew.FLIP_DIRECTION_TOP_BOTTOM); small.SetOrientationDegrees(rot)
        for p in small.Pads(): p.SetNet(nets[p.GetNumber()])
b.Save(board)
for f in (u1, j1):
    for p in sorted(f.Pads(), key=lambda p: int(p.GetNumber())):
        q = p.GetPosition(); print(f.GetReference(), p.GetNumber(), round(T(q.x), 2), round(T(q.y), 2), p.GetNetname())
