# PMW3610-side-pogo-sensor.kicad_sch from PMW3610-pogo's: the six pogo pins (TB_P1..TB_P6) with their labels and the
# four mounting holes go; a 1x6 right-angle pin header (TB_J1) under the sensor takes the nets down to the module board below
# (PMW3610-side-pogo), which carries the pogo pins. The sensor board stands upright on it, its lens toward the ball.
# usage: sensor_sch.py <PMW3610-side-pogo-sensor.kicad_sch> <kicad_libs dir>
import sys, re, uuid
p, libdir = sys.argv[1:3]
sys.path.insert(0, libdir)
import kicad_libs as kl, sexp
s = open(p).read()
U = lambda: str(uuid.uuid4())
def block(text, start):
    d = 0
    for j in range(start, len(text)):
        if text[j] == '(': d += 1
        elif text[j] == ')':
            d -= 1
            if d == 0: return start, j + 1
def find_block(text, head):
    i = text.find(head)
    return block(text, i) if i >= 0 else None
def cut(text, span):
    a, b = span
    while b < len(text) and text[b] in '\n': b += 1
    while a > 0 and text[a - 1] == '\t': a -= 1
    return text[:a] + text[b:]
def symbol_of(ref):
    i = s.index(f'(property "Reference" "{ref}"')
    return block(s, s.rindex('\n\t(symbol\n', 0, i) + 1)
# the pogo pins and the label at each one's pin; the mounting holes
for k in range(1, 7):
    span = symbol_of(f'TB_P{k}')
    lab = s.index('(global_label', span[1])
    s = cut(s, block(s, lab))
    s = cut(s, span)
for k in range(1, 5): s = cut(s, symbol_of(f'H{k}'))
for name in ('(symbol "ErgoCai:KTT50003UT01-R"', '(symbol "Mechanical:MountingHole"'):
    span = find_block(s, name)
    if span: s = cut(s, span)
# the header's library symbol
sym = kl.get_symbol('Connector_Generic', 'Conn_01x06')
ls_end = find_block(s, '(lib_symbols')[1] - 1
s = s[:ls_end] + '\t' + sexp.dump(sym) + '\n\t' + s[ls_end:]
root = re.search(r'\(path "(/[0-9a-f-]+)"\n\t\t\t\t\t\(reference "TB_U1"', s).group(1)
X, Y = 50.8, 114.3
NETS = {'1': 'GND', '2': 'MOTION', '3': 'NCS', '4': 'SCLK', '5': 'SDIO', '6': 'VCC'}   # the pogo pins' order (geometry.py)
def label(net, x, y, rot, justify):
    return (f'\t(global_label "{net}"\n\t\t(shape passive)\n\t\t(at {x:.2f} {y:.2f} {rot})\n\t\t(fields_autoplaced yes)\n\t\t(effects\n'
            f'\t\t\t(font\n\t\t\t\t(size 1.27 1.27)\n\t\t\t)\n\t\t\t(justify {justify})\n\t\t)\n\t\t(uuid "{U()}")\n'
            f'\t\t(property "Intersheetrefs" "${{INTERSHEET_REFS}}"\n\t\t\t(at {x:.2f} {y:.2f} 0)\n\t\t\t(effects\n\t\t\t\t(font\n'
            f'\t\t\t\t\t(size 1.27 1.27)\n\t\t\t\t)\n\t\t\t\t(justify {justify})\n\t\t\t\t(hide yes)\n\t\t\t)\n\t\t)\n\t)\n')
add = ''
for num, name, px, py, ang, _ in kl.pins(sym):
    x, y = X + px, Y - py                               # symbol y up, schematic y down
    add += label(NETS[num], x, y, 180 if ang == 0 else 0, 'right' if ang == 0 else 'left')
props = [('Reference', 'TB_J1', (X + 1.27, Y - 7.62), False), ('Value', 'Conn_01x06', (X + 1.27, Y + 10.16), False),
         ('Footprint', 'Connector_PinHeader_2.54mm:PinHeader_1x06_P2.54mm_Horizontal', (X, Y + 17.78), True),
         ('Datasheet', '', (X, Y), True),
         ('Description', "1x6 right-angle pin header, 2.54 mm, on the board's back under the sensor: its pins bent down "
                         "into the module board below (PMW3610-side-pogo's TB_J1), soldered on both", (X, Y), True)]
symtxt = (f'\t(symbol\n\t\t(lib_id "Connector_Generic:Conn_01x06")\n\t\t(at {X} {Y} 0)\n\t\t(unit 1)\n\t\t(exclude_from_sim no)\n'
          f'\t\t(in_bom yes)\n\t\t(on_board yes)\n\t\t(dnp no)\n\t\t(uuid "{uuid.uuid5(uuid.UUID(root.strip("/")), "TB_J1")}")\n')
for name, val, at, hide in props:
    symtxt += (f'\t\t(property "{name}" "{val}"\n\t\t\t(at {at[0]:.2f} {at[1]:.2f} 0)\n\t\t\t(effects\n\t\t\t\t(font\n\t\t\t\t\t(size 1.27 1.27)\n'
               f'\t\t\t\t)\n' + ('\t\t\t\t(hide yes)\n' if hide else '') + '\t\t\t)\n\t\t)\n')
for k in range(1, 7): symtxt += f'\t\t(pin "{k}"\n\t\t\t(uuid "{U()}")\n\t\t)\n'
symtxt += (f'\t\t(instances\n\t\t\t(project "PMW3610-side-pogo-sensor"\n\t\t\t\t(path "{root}"\n\t\t\t\t\t(reference "TB_J1")\n'
           f'\t\t\t\t\t(unit 1)\n\t\t\t\t)\n\t\t\t)\n\t\t)\n\t)\n')
i = s.index('\t(sheet_instances')
s = s[:i] + add + symtxt + s[i:]
# the note
old = re.search(r'\(text "PMW3610 trackball module:[^"]*"', s).group(0)
s = s.replace(old, '(text "PMW3610 side-read trackball, its sensor board: the sensor (its LM18-LSI lens through the board, toward\\n'
              'the ball) and a 1.8 V LDO, the board standing upright on the module board (PMW3610-side-pogo), which has the\\n'
              'pogo pins on the joystick mount. TB_J1, a 1x6 right-angle header under the sensor, takes GND, MOTION, NCS, SCLK, SDIO and VCC\\n'
              'down to it. The keyboard keeps VCC on while the trackball is used."')

# TB_C2 and TB_C1 in 0402 (C2 beside the header, C1 by the board's edge)
for ref in ('TB_C2', 'TB_C1'):
    i = s.index(f'(property "Reference" "{ref}"'); a = s.rindex('\n\t(symbol\n', 0, i); bnd = block(s, a + 1)
    sym = s[bnd[0]:bnd[1]]
    s = s[:bnd[0]] + re.sub(r'\(property "Footprint" "[^"]*"', '(property "Footprint" "Capacitor_SMD:C_0402_1005Metric"', sym, count=1) + s[bnd[1]:]
open(p, 'w').write(s)
print('ok', len(re.findall(r'\(global_label "', s)), 'labels')
