# PMW3610-side-pogo.kicad_pcb, the side-read trackball's module board, from PMW3610-pogo's: in the mount's frame (the
# module goes on it as it is). The pogo pins turned half a turn about the origin, to x -11 (pin k on the mount's pad
# k); holes at (-12.35, +-10.85) (none at the mount's third, (24.5, 0): the cartridge's tongue holds the +x end); TB_J1's six holes for the sensor board's header pins (x 12.94 and
# 15.48: the header's rows 3.81 and 1.27 in front of the sensor board, whose front is at x 16.75); no hole for the
# ball, which lies 1.6 mm over the board; a slot the sensor board's tab goes down into, a keep-out round it; the
# outline and the slot from geometry.json. Everything else, and all copper, goes.
# usage: module_pcb.py <board> <schematic>
import sys, os, re, json, pcbnew
board, sch = sys.argv[1:3]
M, T = pcbnew.FromMM, pcbnew.ToMM
V = lambda x, y: pcbnew.VECTOR2I(M(x), M(y))
# the outline and the header's holes from geometry.json (geometry.py: they follow the ball's size)
G = json.load(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'geometry.json')))
OUTLINE = [tuple(p) for p in G['outline']]
SLOT = [tuple(p) for p in G['slot']]
b = pcbnew.LoadBoard(board)
for t in list(b.GetTracks()): b.Delete(t)
for z in list(b.Zones()): b.Delete(z)
for d in list(b.GetDrawings()): b.Delete(d)
keep = {f'TB_P{k}' for k in range(1, 7)} | {'H1', 'H2'}
for f in list(b.GetFootprints()):
    if f.GetReference() not in keep: b.Delete(f)
fps = {f.GetReference(): f for f in b.GetFootprints()}
for k in range(1, 7): fps[f'TB_P{k}'].Rotate(V(0, 0), pcbnew.EDA_ANGLE(180, pcbnew.DEGREES_T))
for ref, (x, y) in {'H1': (-12.35, -10.85), 'H2': (-12.35, 10.85)}.items(): fps[ref].SetPosition(V(x, y))
for P in (OUTLINE, SLOT):
    for a, c in zip(P, P[1:] + P[:1]):
        e = pcbnew.PCB_SHAPE(b, pcbnew.SHAPE_T_SEGMENT); e.SetLayer(pcbnew.Edge_Cuts); e.SetWidth(M(0.05)); e.SetStart(V(*a)); e.SetEnd(V(*c)); b.Add(e)
# the autorouter keeps less than the edge clearance from an inner cut-out: a keep-out round the slot
ka = pcbnew.ZONE(b); ka.SetIsRuleArea(True); ka.SetDoNotAllowTracks(True); ka.SetDoNotAllowVias(True)
ka.SetDoNotAllowPads(False); ka.SetDoNotAllowFootprints(False); ka.SetDoNotAllowCopperPour(False)
ka.SetLayerSet(pcbnew.LSET.AllCuMask())
o = ka.Outline(); o.NewOutline()
xs, ys = [x for x, _ in SLOT], [y for _, y in SLOT]
for x, y in ((min(xs) - 0.35, min(ys) - 0.35), (max(xs) + 0.35, min(ys) - 0.35), (max(xs) + 0.35, max(ys) + 0.35), (min(xs) - 0.35, max(ys) + 0.35)):
    o.Append(M(x), M(y))
b.Add(ka)
uid = re.search(r'\(uuid "([0-9a-f-]+)"\)\n\t\t\(property "Reference" "TB_J1"', open(sch).read()).group(1)
lib = '/Applications/KiCad/KiCad.app/Contents/SharedSupport/footprints/Connector_PinHeader_2.54mm.pretty'
j1 = pcbnew.FootprintLoad(lib, 'PinHeader_2x03_P2.54mm_Vertical')
j1.SetFPIDAsString('Connector_PinHeader_2.54mm:PinHeader_2x03_P2.54mm_Vertical'); j1.SetReference('TB_J1'); j1.SetValue('Conn_02x03')
b.Add(j1); j1.SetPosition(V(G['j1']['x'], G['j1']['y']))
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
# the sensor board's model where it stands: its back at x1
# (Models() hands out copies: the list is put back)
models = list(cart.Models())
for m in models:
    if 'sensor' in m.m_Filename: m.m_Offset = pcbnew.VECTOR3D(G['sensor']['x1'], m.m_Offset.y, m.m_Offset.z)
cart.Models().clear()
for m in models: cart.Add3DModel(m)
for f in b.GetFootprints():
    if f.GetSheetfile() == 'PMW3610-pogo.kicad_sch': f.SetSheetfile('PMW3610-side-pogo.kicad_sch')
b.Save(board)
for f in sorted(b.GetFootprints(), key=lambda f: f.GetReference()):
    for p in f.Pads():
        q = p.GetPosition(); print(f.GetReference(), p.GetNumber(), round(T(q.x), 2), round(T(q.y), 2), p.GetNetname())
