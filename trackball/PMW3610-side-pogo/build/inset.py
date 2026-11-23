# usage: inset.py <route.dsn> <d mm>: the DSN's boundary replaced with the sensor board's outline inset by
# d, so Freerouting keeps the board's edge clearance (DSN: um, y up)
import sys, os, json
p, d = sys.argv[1], float(sys.argv[2])
s = open(p).read()
i = s.index('(boundary'); depth = 0
for j in range(i, len(s)):
    if s[j] == '(': depth += 1
    elif s[j] == ')':
        depth -= 1
        if depth == 0: break
W, H = 13.0, json.load(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'geometry.json')))['sensor_board']['h']
poly = [(-W, -H), (W, -H), (W, 0), (-W, 0)]   # KiCad, y down
pts = [(x, -y) for x, y in poly]                       # y up
area = sum(x0 * y1 - x1 * y0 for (x0, y0), (x1, y1) in zip(pts, pts[1:] + pts[:1]))
if area < 0: pts = pts[::-1]                           # counter-clockwise: the inside on the left of each edge
def inward(a, b):
    dx, dy = b[0] - a[0], b[1] - a[1]; L = (dx * dx + dy * dy) ** .5
    return (-dy / L, dx / L)
out = []
n = len(pts)
for k in range(n):
    a, v, c = pts[k - 1], pts[k], pts[(k + 1) % n]
    n1, n2 = inward(a, v), inward(v, c)
    out.append((v[0] + d * (n1[0] + n2[0]), v[1] + d * (n1[1] + n2[1])))   # rectilinear: both normals add up
out.append(out[0])
open(p, 'w').write(s[:i] + '(boundary (path pcb 0 ' + ' '.join(f'{x * 1000:.1f} {y * 1000:.1f}' for x, y in out) + '))' + s[j + 1:])
print('boundary', [(round(x, 2), round(y, 2)) for x, y in out])
