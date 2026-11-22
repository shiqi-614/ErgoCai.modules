# usage: inset_poly.py <route.dsn> <d mm> <x,y> <x,y> ...: the DSN's boundary replaced with the polygon (KiCad mm, y down)
# inset by d (mitred corners), so the autorouter keeps the board's edge clearance (DSN: um, y up)
import sys
p, d = sys.argv[1], float(sys.argv[2])
poly = [tuple(float(v) for v in a.split(',')) for a in sys.argv[3:]]
s = open(p).read()
i = s.index('(boundary'); depth = 0
for j in range(i, len(s)):
    if s[j] == '(': depth += 1
    elif s[j] == ')':
        depth -= 1
        if depth == 0: break
pts = [(x, -y) for x, y in poly]
if sum(x0 * y1 - x1 * y0 for (x0, y0), (x1, y1) in zip(pts, pts[1:] + pts[:1])) < 0: pts = pts[::-1]
def inward(a, b):
    dx, dy = b[0] - a[0], b[1] - a[1]; L = (dx * dx + dy * dy) ** .5
    return (-dy / L, dx / L)
out = []
for k in range(len(pts)):
    a, v, c = pts[k - 1], pts[k], pts[(k + 1) % len(pts)]
    n1, n2 = inward(a, v), inward(v, c)
    m = (n1[0] + n2[0], n1[1] + n2[1]); f = d / (1 + n1[0] * n2[0] + n1[1] * n2[1])
    out.append((v[0] + f * m[0], v[1] + f * m[1]))
out.append(out[0])
open(p, 'w').write(s[:i] + '(boundary (path pcb 0 ' + ' '.join(f'{x * 1000:.1f} {y * 1000:.1f}' for x, y in out) + '))' + s[j + 1:])
