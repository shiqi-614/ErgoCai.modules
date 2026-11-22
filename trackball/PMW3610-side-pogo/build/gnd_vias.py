# usage: gnd_vias.py <board>: a GND via beside every SMD GND pad whose pad the zone does not reach well (all of them,
# where one fits): the nearest spot round the pad, 0.2 mm clear of every other net's copper and the board's edges
# and cut-outs (0.3), then the zones refilled; then stitching vias between the zones
import sys, math, pcbnew
M, T = pcbnew.FromMM, pcbnew.ToMM
b = pcbnew.LoadBoard(sys.argv[1])
gnd = b.FindNet('GND')
R, CL, EDGE = 0.3, 0.2, 0.3
def seg_dist(p, a, c):
    ax, ay, cx, cy = a.x, a.y, c.x, c.y; px, py = p
    dx, dy = cx - ax, cy - ay; L = dx * dx + dy * dy
    t = 0 if L == 0 else max(0, min(1, ((px - ax) * dx + (py - ay) * dy) / L))
    return math.hypot(px - ax - t * dx, py - ay - t * dy)
others = []                                    # (kind, geometry, half width) of other nets' copper, in nm
for t in b.GetTracks():
    if t.GetClass() == 'PCB_VIA':
        # any via, GND's too: the holes keep apart
        others.append(('c', t.GetPosition(), t.GetWidth(pcbnew.F_Cu) / 2 + (M(0.1) if t.GetNetCode() == gnd.GetNetCode() else 0)))
        continue
    if t.GetNetCode() == gnd.GetNetCode(): continue
    else: others.append(('s', (t.GetStart(), t.GetEnd()), t.GetWidth() / 2))
for f in b.GetFootprints():
    for p in f.Pads():
        if p.GetNetCode() != gnd.GetNetCode() or p.GetAttribute() == pcbnew.PAD_ATTRIB_NPTH:
            others.append(('b', p.GetBoundingBox(), 0))
edges = [(d.GetStart(), d.GetEnd()) for d in b.GetDrawings() if d.GetLayer() == pcbnew.Edge_Cuts]
for f in b.GetFootprints():
    for g in f.GraphicalItems():
        if g.GetLayer() == pcbnew.Edge_Cuts:
            bb = g.GetBoundingBox(); c = [pcbnew.VECTOR2I(bb.GetLeft(), bb.GetTop()), pcbnew.VECTOR2I(bb.GetRight(), bb.GetTop()),
                                          pcbnew.VECTOR2I(bb.GetRight(), bb.GetBottom()), pcbnew.VECTOR2I(bb.GetLeft(), bb.GetBottom())]
            edges += list(zip(c, c[1:] + c[:1]))
outline = b.GetBoardEdgesBoundingBox()
def free(x, y):
    p = (x, y)
    for kind, g, w in others:
        if kind == 'c' and math.hypot(x - g.x, y - g.y) < M(R + CL) + w: return False
        if kind == 's' and seg_dist(p, g[0], g[1]) < M(R + CL) + w: return False
        if kind == 'b':
            dx = max(g.GetLeft() - x, 0, x - g.GetRight()); dy = max(g.GetTop() - y, 0, y - g.GetBottom())
            if math.hypot(dx, dy) < M(R + CL): return False
    return all(seg_dist(p, a, c) >= M(R + EDGE) for a, c in edges)
added = 0
for f in b.GetFootprints():
    for p in f.Pads():
        if p.GetNetCode() != gnd.GetNetCode() or p.GetAttribute() != pcbnew.PAD_ATTRIB_SMD: continue
        c = p.GetPosition(); best = None
        for r in (0.7, 0.9, 1.1, 1.4):
            for k in range(16):
                a = 2 * math.pi * k / 16; x, y = c.x + M(r * math.cos(a)), c.y + M(r * math.sin(a))
                if free(x, y): best = (x, y); break
            if best: break
        if not best: print('no room by', f.GetReference(), p.GetNumber()); continue
        v = pcbnew.PCB_VIA(b); v.SetPosition(pcbnew.VECTOR2I(int(best[0]), int(best[1]))); v.SetDrill(M(0.3))
        v.SetWidth(pcbnew.F_Cu, M(0.6)); v.SetWidth(pcbnew.B_Cu, M(0.6)); v.SetNet(gnd); b.Add(v)
        t = pcbnew.PCB_TRACK(b); t.SetStart(c); t.SetEnd(v.GetPosition()); t.SetWidth(M(0.3)); t.SetLayer(pcbnew.B_Cu if p.IsOnLayer(pcbnew.B_Cu) else pcbnew.F_Cu)
        t.SetNet(gnd); b.Add(t)
        others.append(('c', v.GetPosition(), M(R + 0.1))); added += 1
pcbnew.ZONE_FILLER(b).Fill(b.Zones())
# and stitching vias on a 2 mm grid wherever both zones are filled and a via fits, so no piece of either zone is cut
# off from the rest (the lines can split a zone on one side)
zones = {z.GetLayer(): z for z in b.Zones() if not z.GetIsRuleArea() and z.GetNetCode() == gnd.GetNetCode()}
stitched = 0
if pcbnew.F_Cu in zones and pcbnew.B_Cu in zones:
    filled = [zones[l].GetFilledPolysList(l) for l in (pcbnew.F_Cu, pcbnew.B_Cu)]
    bb = outline
    for x in range(bb.GetLeft() + M(1), bb.GetRight(), M(2)):
        for y in range(bb.GetTop() + M(1), bb.GetBottom(), M(2)):
            p = pcbnew.VECTOR2I(x, y)
            # the via's whole ring inside both fills, and clear of everything else
            if not all(f.Contains(p, -1, M(R + 0.05)) for f in filled) or not free(x, y): continue
            v = pcbnew.PCB_VIA(b); v.SetPosition(p); v.SetDrill(M(0.3)); v.SetWidth(pcbnew.F_Cu, M(0.6)); v.SetWidth(pcbnew.B_Cu, M(0.6))
            v.SetNet(gnd); b.Add(v); others.append(('c', p, M(R + 0.1))); stitched += 1
    pcbnew.ZONE_FILLER(b).Fill(b.Zones())
pcbnew.SaveBoard(sys.argv[1], b)
print('GND vias', added, 'stitching', stitched)
