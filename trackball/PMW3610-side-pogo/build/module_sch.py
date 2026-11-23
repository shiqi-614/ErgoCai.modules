# PMW3610-side-pogo.kicad_sch (the side-read trackball's module board) from PMW3610-pogo's: the six pogo pins (TB_P1..6,
# pin k for the mount's pad k), two mounting holes (at -x: the +x end is held by the cartridge's tongue), the power flags, and TB_J1, the six holes the sensor board's 2x3
# right-angle header comes down into; the sensor and its parts are on the sensor board (sensor/).
# usage: module_sch.py <PMW3610-pogo.kicad_sch> <out.kicad_sch> <kicad_libs dir>
import sys, re, uuid
src, out, libdir = sys.argv[1:4]
sys.path.insert(0, libdir)
import kicad_libs as kl, sexp
s = open(src).read()
U = lambda: str(uuid.uuid4())
def block(text, start):
    d = 0
    for j in range(start, len(text)):
        if text[j] == '(': d += 1
        elif text[j] == ')':
            d -= 1
            if d == 0: return start, j + 1
def cut(text, span):
    a, b = span
    while b < len(text) and text[b] in '\n': b += 1
    while a > 0 and text[a - 1] == '\t': a -= 1
    return text[:a] + text[b:]
def top_blocks(text, head):
    """spans of the schematic's top-level (one tab in) blocks starting with head"""
    spans, i = [], 0
    while True:
        i = text.find('\n\t(' + head, i)
        if i < 0: return spans
        spans.append(block(text, i + 2)); i += 3
keep = {f'TB_P{k}' for k in range(1, 7)} | {'H1', 'H2', '#FLG01', '#FLG02'}
for span in reversed(top_blocks(s, 'symbol\n')):
    ref = re.search(r'\(property "Reference" "([^"]+)"', s[span[0]:span[1]]).group(1)
    if ref not in keep: s = cut(s, span)
for head in ('global_label', 'wire', 'junction', 'no_connect', 'text ', 'label'):
    for span in reversed(top_blocks(s, head)): s = cut(s, span)
s = s.replace('(project "PMW3610-pogo"', '(project "PMW3610-side-pogo"')
s = s.replace('(title "PMW3610 trackball module (pogo pins)")', '(title "PMW3610 side-read trackball module: the module board (pogo pins)")')
root = re.search(r'\(path "(/[0-9a-f-]+)"\n\t\t\t\t\t\(reference "TB_P1"', s).group(1)
sym = kl.get_symbol('Connector_Generic', 'Conn_02x03_Odd_Even')
ls = block(s, s.index('(lib_symbols'))
s = s[:ls[1] - 1] + '\t' + sexp.dump(sym) + '\n\t' + s[ls[1] - 1:]
def label(net, x, y, rot, justify):
    return (f'\t(global_label "{net}"\n\t\t(shape passive)\n\t\t(at {x:.2f} {y:.2f} {rot})\n\t\t(fields_autoplaced yes)\n\t\t(effects\n'
            f'\t\t\t(font\n\t\t\t\t(size 1.27 1.27)\n\t\t\t)\n\t\t\t(justify {justify})\n\t\t)\n\t\t(uuid "{U()}")\n'
            f'\t\t(property "Intersheetrefs" "${{INTERSHEET_REFS}}"\n\t\t\t(at {x:.2f} {y:.2f} 0)\n\t\t\t(effects\n\t\t\t\t(font\n'
            f'\t\t\t\t\t(size 1.27 1.27)\n\t\t\t\t)\n\t\t\t\t(justify {justify})\n\t\t\t\t(hide yes)\n\t\t\t)\n\t\t)\n\t)\n')
add = ''
# the pogo pins: pin k at the mount's pad k (the mount's pins.yaml: VCC, SDIO, SCLK, NCS, MOTION, GND)
POGO = {1: 'VCC', 2: 'SDIO', 3: 'SCLK', 4: 'NCS', 5: 'MOTION', 6: 'GND'}
for k, net in POGO.items():
    at = re.search(r'\(at ([\d.]+) ([\d.]+) 0\)', s[s.rindex('\n\t(symbol\n', 0, s.index(f'(property "Reference" "TB_P{k}"')):]).groups()
    add += label(net, float(at[0]) - 5.08, float(at[1]), 180, 'right')
for ref, net in (('#FLG01', 'VCC'), ('#FLG02', 'GND')):
    at = re.search(r'\(at ([\d.]+) ([\d.]+) 0\)', s[s.rindex('\n\t(symbol\n', 0, s.index(f'(property "Reference" "{ref}"')):]).groups()
    add += label(net, float(at[0]), float(at[1]), 0, 'left')
# the header's holes: pad k as they come, by place, from the sensor board's TB_J1 (its pins bent down into them)
X, Y = 101.6, 114.3
J1 = {'1': 'NCS', '2': 'MOTION', '3': 'SDIO', '4': 'SCLK', '5': 'VCC', '6': 'GND'}
for num, name, px, py, ang, _ in kl.pins(sym):
    add += label(J1[num], X + px, Y - py, 180 if ang == 0 else 0, 'right' if ang == 0 else 'left')
props = [('Reference', 'TB_J1', (X + 1.27, Y - 7.62), False), ('Value', 'Conn_02x03', (X + 1.27, Y + 7.62), False),
         ('Footprint', 'Connector_PinHeader_2.54mm:PinHeader_2x03_P2.54mm_Vertical', (X, Y + 17.78), True),
         ('Datasheet', '', (X, Y), True),
         ('Description', "The six holes the sensor board's 2x3 right-angle header comes down into (its pins soldered "
                         "here): no part of its own", (X, Y), True)]
symtxt = (f'\t(symbol\n\t\t(lib_id "Connector_Generic:Conn_02x03_Odd_Even")\n\t\t(at {X} {Y} 0)\n\t\t(unit 1)\n\t\t(exclude_from_sim no)\n'
          f'\t\t(in_bom no)\n\t\t(on_board yes)\n\t\t(dnp no)\n\t\t(uuid "{uuid.uuid5(uuid.UUID(root.strip("/")), "TB_J1")}")\n')
for name, val, at, hide in props:
    symtxt += (f'\t\t(property "{name}" "{val}"\n\t\t\t(at {at[0]:.2f} {at[1]:.2f} 0)\n\t\t\t(effects\n\t\t\t\t(font\n\t\t\t\t\t(size 1.27 1.27)\n'
               f'\t\t\t\t)\n' + ('\t\t\t\t(hide yes)\n' if hide else '') + '\t\t\t)\n\t\t)\n')
for k in range(1, 7): symtxt += f'\t\t(pin "{k}"\n\t\t\t(uuid "{U()}")\n\t\t)\n'
symtxt += (f'\t\t(instances\n\t\t\t(project "PMW3610-side-pogo"\n\t\t\t\t(path "{root}"\n\t\t\t\t\t(reference "TB_J1")\n'
           f'\t\t\t\t\t(unit 1)\n\t\t\t\t)\n\t\t\t)\n\t\t)\n\t)\n')
note = ('\t(text "PMW3610 side-read trackball, its module board on the joystick mount (joystick-mount-pogo): the pogo pins\\n'
        'TB_P1..6 where the mount\'s pads are (pin k on pad k: VCC, SDIO, SCLK, NCS, MOTION, GND), the 20 mm ball\\n'
        'through its hole, and the sensor board (sensor/) standing on it, its header\'s pins down into TB_J1."\n'
        f'\t\t(exclude_from_sim no)\n\t\t(at 30.48 22.86 0)\n\t\t(effects\n\t\t\t(font\n\t\t\t\t(size 1.27 1.27)\n\t\t\t)\n'
        f'\t\t\t(justify left)\n\t\t)\n\t\t(uuid "{U()}")\n\t)\n')
i = s.index('\t(sheet_instances')
s = s[:i] + add + symtxt + note + s[i:]
open(out, 'w').write(s)
print('ok')
