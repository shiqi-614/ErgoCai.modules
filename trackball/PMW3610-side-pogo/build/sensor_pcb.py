# PMW3610-side-pogo-sensor.kicad_pcb from PMW3610-pogo's: the board upright beside the ball, seen from its front (the
# lens's side, toward the ball): x along it (the module's y), y down from its top, its bottom edge on the module board
# at y 0 (z = -y over the module board's top). The pogo pins, the holes, the cup and all copper go; the sensor's
# optical centre at (AXIS_X, -AXIS_Z), the lens's long side to -x; TB_J1, the 2x3 right-angle header, on the front at
# +x, its pins bent down past the bottom edge into the module board; the LDO and the capacitors on the back.
# usage: sensor_pcb.py <board> <schematic> [place.json]
import sys, re, json, pcbnew
board, sch = sys.argv[1:3]
M, T = pcbnew.FromMM, pcbnew.ToMM
V = lambda x, y: pcbnew.VECTOR2I(M(x), M(y))
W, H = 13.0, 20.0                     # half width, height
# the ball's centre 11.6 over the module board: its side over the case's top, for the thumb
AXIS_X, AXIS_Z = -1.5, 11.6
b = pcbnew.LoadBoard(board)
for t in list(b.GetTracks()): b.Delete(t)
for z in list(b.Zones()): b.Delete(z)
for d in list(b.GetDrawings()): b.Delete(d)
fps = {f.GetReference(): f for f in b.GetFootprints()}
for ref in list(fps):
    if ref.startswith('TB_P') or re.match(r'H\d', ref) or ref == 'TB_CUP1': b.Delete(fps.pop(ref))
# the outline: a tab under the sensor's lower pin row reaches down through a notch in the module board, its bottom
# flush with the module board's, a channel for that row's lines (the lens's aperture boxes the row in above)
TAB = (-11.8, 4.8, 1.6)
pts = [V(-W, -H), V(W, -H), V(W, 0), V(TAB[1], 0), V(TAB[1], TAB[2]), V(TAB[0], TAB[2]), V(TAB[0], 0), V(-W, 0)]
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
j1 = pcbnew.FootprintLoad(lib, 'PinHeader_2x03_P2.54mm_Horizontal')
j1.SetFPIDAsString('Connector_PinHeader_2.54mm:PinHeader_2x03_P2.54mm_Horizontal')
j1.SetReference('TB_J1'); j1.SetValue('Conn_02x03')
b.Add(j1)
j1.SetPosition(V(11.69, -9.98)); j1.SetOrientationDegrees(-90)
j1.SetPath(pcbnew.KIID_PATH(f'/{uid}'))
j1.SetSheetfile('PMW3610-side-pogo-sensor.kicad_sch'); j1.SetSheetname('/')
NETS = {'1': 'VCC', '2': 'GND', '3': 'SDIO', '4': 'SCLK', '5': 'NCS', '6': 'MOTION'}
for p in j1.Pads(): p.SetNet(b.FindNet(NETS[p.GetNumber()]))
for f in b.GetFootprints():
    if f.GetSheetfile() == 'PMW3610-pogo.kicad_sch': f.SetSheetfile('PMW3610-side-pogo-sensor.kicad_sch')
# the rest from place.json: ref -> [x, y, rot] (all on the back, as they were)
if len(sys.argv) > 3:
    for ref, (x, y, r) in json.load(open(sys.argv[3])).items():
        f = fps[ref]; f.SetPosition(V(x, y)); f.SetOrientationDegrees(r)
# TB_C2 and TB_C1 in 0402: C2 to fit between the escape lanes under the sensor's lower pin row, C1 by the board's edge
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
# the lower pin row's escape, laid by hand: each pin straight down into the tab, along its lane to the tab's end, up
# and on to x 5.2, where the router takes over. The leftmost pin's lane is the deepest, so no two lines cross; three
# lanes on F.Cu, four on B.Cu, 0.4 mm apart
# Each ends in a via (the router does not go on from a track's end): on B.Cu each lane turns up in turn to a row at
# y -2.4, on F.Cu it runs on to x 9.6..11.6 and up to y -2.0 (pin, lane, turn, run, end x, via y)
LANES = {pcbnew.B_Cu: [('8', 1.15, 3.8, -0.45, 8.6, -2.4), ('6', 0.75, 3.4, -0.85, 7.6, -2.4), ('3', 0.35, 3.0, -1.25, 6.6, -2.4),
                       ('1', -0.05, 2.6, -1.65, 5.6, -2.4)],
         pcbnew.F_Cu: [('7', 1.15, 3.8, -0.45, 11.6, -2.0), ('5', 0.75, 3.4, -0.85, 10.6, -2.0), ('2', 0.35, 3.0, -1.25, 9.6, -2.0)]}
pads = {p.GetNumber(): p for p in u1.Pads()}
for layer, lanes in LANES.items():
    for num, lane, turn, run, end, via in lanes:
        pad = pads[num]; x = T(pad.GetPosition().x)
        pts = [(x, T(pad.GetPosition().y)), (x, lane), (turn, lane), (turn, run), (end, run), (end, via)]
        v = pcbnew.PCB_VIA(b); v.SetPosition(V(end, via)); v.SetDrill(M(0.3)); v.SetWidth(pcbnew.F_Cu, M(0.6)); v.SetWidth(pcbnew.B_Cu, M(0.6))
        v.SetNet(pad.GetNet()); v.SetLocked(True); b.Add(v)
        for (x0, y0), (x1, y1) in zip(pts, pts[1:]):
            t = pcbnew.PCB_TRACK(b); t.SetStart(V(x0, y0)); t.SetEnd(V(x1, y1)); t.SetWidth(M(0.2)); t.SetLayer(layer)
            t.SetNet(pad.GetNet()); t.SetLocked(True); b.Add(t)
b.Save(board)
for f in (u1, j1):
    for p in sorted(f.Pads(), key=lambda p: int(p.GetNumber())):
        q = p.GetPosition(); print(f.GetReference(), p.GetNumber(), round(T(q.x), 2), round(T(q.y), 2), p.GetNetname())
