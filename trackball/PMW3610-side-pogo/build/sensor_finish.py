# usage: sensor_finish.py <board> <route.ses|->: the routing in, a GND zone on each layer over the board's outline,
# filled
import sys, os, json, pcbnew
M = pcbnew.FromMM
b = pcbnew.LoadBoard(sys.argv[1])
if sys.argv[2] != '-': pcbnew.ImportSpecctraSES(b, sys.argv[2])
# the vias DRC called dangling (x,y in mm after the SES), out
drop = [tuple(float(v) for v in a.split(',')) for a in sys.argv[3:]]
for t in list(b.GetTracks()):
    if t.GetClass() == 'PCB_VIA':
        x, y = pcbnew.ToMM(t.GetPosition().x), pcbnew.ToMM(t.GetPosition().y)
        if any(abs(x - a) < 0.01 and abs(y - c) < 0.01 for a, c in drop): b.Delete(t); print('via out', round(x, 2), round(y, 2))
for z in list(b.Zones()):
    if not z.GetIsRuleArea(): b.Delete(z)
W, H = 13.0, json.load(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'geometry.json')))['sensor_board']['h']
poly = [(-W, -H), (W, -H), (W, 0), (-W, 0)]
gnd = b.FindNet('GND')
# the sensor's GND hole (pad 11) solid to the zones: its thermal spokes come out starved between the lines round it; the
# SMD pads solid too (THT_THERMAL), as the capacitors' GND pads were starved
for p in b.FindFootprintByReference('TB_U1').Pads():
    if p.GetNumber() == '11': p.SetLocalZoneConnection(pcbnew.ZONE_CONNECTION_FULL)
# and the header's GND pin, which joins the zones on its two sides
for p in b.FindFootprintByReference('TB_J1').Pads():
    if p.GetNetname() == 'GND': p.SetLocalZoneConnection(pcbnew.ZONE_CONNECTION_FULL)
for layer in (pcbnew.F_Cu, pcbnew.B_Cu):
    z = pcbnew.ZONE(b); z.SetLayer(layer); z.SetNet(gnd)
    o = z.Outline(); o.NewOutline()
    for x, y in poly: o.Append(M(x), M(y))
    z.SetMinThickness(M(0.2)); z.SetLocalClearance(M(0.25)); z.SetPadConnection(pcbnew.ZONE_CONNECTION_THT_THERMAL)
    z.SetIslandRemovalMode(pcbnew.ISLAND_REMOVAL_MODE_ALWAYS)   # a corner the lines cut off is no use as GND
    b.Add(z)
pcbnew.ZONE_FILLER(b).Fill(b.Zones())
pcbnew.SaveBoard(sys.argv[1], b)
print('tracks', len([t for t in b.GetTracks() if t.GetClass() == 'PCB_TRACK']), 'vias', len([t for t in b.GetTracks() if t.GetClass() == 'PCB_VIA']))
