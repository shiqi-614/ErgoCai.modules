# PMW3610-side-pogo.kicad_pcb, the side-read trackball's module board, from PMW3610-pogo's: in the mount's frame (the
# module goes on it as it is). The pogo pins turned half a turn about the origin, to x -11 (pin k on the mount's pad
# k); holes at (-12.35, +-10.85) and (24.5, 0); TB_J1's six holes for the sensor board's header pins (x 12.94 and
# 15.48: the header's rows 3.81 and 1.27 in front of the sensor board, whose front is at x 16.75); the 20 mm ball's
# hole round its axis (0, -1.5), 18 mm; a notch the sensor board's tab goes down into; the outline is the mount's
# User.1 outline less 0.1, the notch cut from its -y edge. Everything else, and all copper, goes.
# usage: module_pcb.py <board> <schematic>
import sys, os, re, math, pcbnew
board, sch = sys.argv[1:3]
M, T = pcbnew.FromMM, pcbnew.ToMM
V = lambda x, y: pcbnew.VECTOR2I(M(x), M(y))
BALL = (0.0, -1.5, 8.5)          # the hole: the ball is 7.5 mm round where it passes the board, 1 mm clear
NOTCH = (16.55, 18.55, 5.0)          # x from, x to, up to y (from the -y edge)
OUTLINE = [(-14.5, -13), (NOTCH[0], -13), (NOTCH[0], NOTCH[2]), (NOTCH[1], NOTCH[2]), (NOTCH[1], -13), (22, -13), (22, -4.5),
           (27, -4.5), (27, 4.5), (21, 4.5), (21, 7), (18.5, 13), (-14.5, 13)]
b = pcbnew.LoadBoard(board)
for t in list(b.GetTracks()): b.Delete(t)
for z in list(b.Zones()): b.Delete(z)
for d in list(b.GetDrawings()): b.Delete(d)
keep = {f'TB_P{k}' for k in range(1, 7)} | {'H1', 'H2', 'H3'}
for f in list(b.GetFootprints()):
    if f.GetReference() not in keep: b.Delete(f)
fps = {f.GetReference(): f for f in b.GetFootprints()}
for k in range(1, 7): fps[f'TB_P{k}'].Rotate(V(0, 0), pcbnew.EDA_ANGLE(180, pcbnew.DEGREES_T))
for ref, (x, y) in {'H1': (-12.35, -10.85), 'H2': (-12.35, 10.85), 'H3': (24.5, 0)}.items(): fps[ref].SetPosition(V(x, y))
for a, c in zip(OUTLINE, OUTLINE[1:] + OUTLINE[:1]):
    e = pcbnew.PCB_SHAPE(b, pcbnew.SHAPE_T_SEGMENT); e.SetLayer(pcbnew.Edge_Cuts); e.SetWidth(M(0.05)); e.SetStart(V(*a)); e.SetEnd(V(*c)); b.Add(e)
h = pcbnew.PCB_SHAPE(b, pcbnew.SHAPE_T_CIRCLE); h.SetLayer(pcbnew.Edge_Cuts); h.SetWidth(M(0.05)); h.SetCenter(V(BALL[0], BALL[1]))
h.SetEnd(V(BALL[0] + BALL[2], BALL[1])); b.Add(h)
# a keep-out round the ball's hole, the board's edge clearance and a little more (the autorouter keeps less from an
# inner cut-out)
ka = pcbnew.ZONE(b); ka.SetIsRuleArea(True); ka.SetDoNotAllowTracks(True); ka.SetDoNotAllowVias(True)
ka.SetDoNotAllowPads(False); ka.SetDoNotAllowFootprints(False); ka.SetDoNotAllowCopperPour(False); ka.SetLayerSet(pcbnew.LSET.AllCuMask())
o = ka.Outline(); o.NewOutline()
for k in range(48):
    a = 2 * math.pi * k / 48; o.Append(M(BALL[0] + (BALL[2] + 0.3) * math.cos(a)), M(BALL[1] + (BALL[2] + 0.3) * math.sin(a)))
b.Add(ka)
uid = re.search(r'\(uuid "([0-9a-f-]+)"\)\n\t\t\(property "Reference" "TB_J1"', open(sch).read()).group(1)
lib = '/Applications/KiCad/KiCad.app/Contents/SharedSupport/footprints/Connector_PinHeader_2.54mm.pretty'
j1 = pcbnew.FootprintLoad(lib, 'PinHeader_2x03_P2.54mm_Vertical')
j1.SetFPIDAsString('Connector_PinHeader_2.54mm:PinHeader_2x03_P2.54mm_Vertical'); j1.SetReference('TB_J1'); j1.SetValue('Conn_02x03')
b.Add(j1); j1.SetPosition(V(12.94, 6.61))
j1.SetAttributes(j1.GetAttributes() | pcbnew.FP_EXCLUDE_FROM_BOM)   # holes only: the header is the sensor board's
j1.SetPath(pcbnew.KIID_PATH(f'/{uid}')); j1.SetSheetfile('PMW3610-side-pogo.kicad_sch'); j1.SetSheetname('/')
J1 = {'1': 'NCS', '2': 'MOTION', '3': 'SDIO', '4': 'SCLK', '5': 'VCC', '6': 'GND'}
for p in j1.Pads(): p.SetNet(b.FindNet(J1[p.GetNumber()]))
# its GND hole by the board's corner, where tracks crowd the thermal spokes: solid to the zones
for p in j1.Pads():
    if J1[p.GetNumber()] == 'GND': p.SetLocalZoneConnection(pcbnew.ZONE_CONNECTION_FULL)
# the cartridge, the ball and the sensor board standing upright, for the 3D view (ErgoCaiLib, board only)
cart = pcbnew.FootprintLoad(os.path.join(os.environ.get('ERGOCAI_LIB', os.path.expanduser('~/Development/ErgoCaiLib')), 'footprints', 'ErgoCai.pretty'), 'TrackballCartridge_PMW3610-side-pogo')
cart.SetFPIDAsString('ErgoCai.pretty:TrackballCartridge_PMW3610-side-pogo'); cart.SetReference('TB_CART1')
cart.SetValue('TrackballCartridge_PMW3610-side-pogo'); b.Add(cart); cart.SetPosition(V(0, 0))
for f in b.GetFootprints():
    if f.GetSheetfile() == 'PMW3610-pogo.kicad_sch': f.SetSheetfile('PMW3610-side-pogo.kicad_sch')
b.Save(board)
for f in sorted(b.GetFootprints(), key=lambda f: f.GetReference()):
    for p in f.Pads():
        q = p.GetPosition(); print(f.GetReference(), p.GetNumber(), round(T(q.x), 2), round(T(q.y), 2), p.GetNetname())
