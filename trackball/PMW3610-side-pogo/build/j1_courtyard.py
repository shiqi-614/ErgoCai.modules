# usage: j1_courtyard.py <board>: TB_J1's courtyard edge toward the lens moved in to x 5.12, past the lens's courtyard
# (to 5.08): the header's body starts at 5.34 and the lens ends at 4.96, the stock courtyard's 0.5 mm round the body
# overlapped the lens's
import sys, pcbnew
M, T = pcbnew.FromMM, pcbnew.ToMM
b = pcbnew.LoadBoard(sys.argv[1])
j1 = b.FindFootprintByReference('TB_J1')
for g in j1.GraphicalItems():
    if g.GetLayerName() in ('F.CrtYd', 'F.Courtyard'):
        for get, put in ((g.GetStart, g.SetStart), (g.GetEnd, g.SetEnd)):
            p = get()
            if abs(T(p.x) - 4.82) < 0.05: put(pcbnew.VECTOR2I(M(5.12), p.y))
pcbnew.SaveBoard(sys.argv[1], b)
