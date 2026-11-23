# usage: module_finish.py <board> <route.ses|->: the routing in, a GND zone on each layer over the outline, filled
import sys, os, json, pcbnew
M = pcbnew.FromMM
b = pcbnew.LoadBoard(sys.argv[1])
if sys.argv[2] != '-': pcbnew.ImportSpecctraSES(b, sys.argv[2])
for z in list(b.Zones()):
    if not z.GetIsRuleArea(): b.Delete(z)
OUTLINE = json.load(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'geometry.json')))['outline']   # (the slot: the fill keeps off the edges)
gnd = b.FindNet('GND')
for layer in (pcbnew.F_Cu, pcbnew.B_Cu):
    z = pcbnew.ZONE(b); z.SetLayer(layer); z.SetNet(gnd)
    o = z.Outline(); o.NewOutline()
    for x, y in OUTLINE: o.Append(M(x), M(y))
    z.SetMinThickness(M(0.2)); z.SetLocalClearance(M(0.25)); z.SetPadConnection(pcbnew.ZONE_CONNECTION_THT_THERMAL)
    b.Add(z)
pcbnew.ZONE_FILLER(b).Fill(b.Zones())
pcbnew.SaveBoard(sys.argv[1], b)
print('tracks', len([t for t in b.GetTracks() if t.GetClass() == 'PCB_TRACK']), 'vias', len([t for t in b.GetTracks() if t.GetClass() == 'PCB_VIA']))
