#!/bin/zsh
# the module board end to end: placement, autorouting, zones, DRC (into /tmp/erc2/side4/mroute)
set -e
B=${0:A:h}; R=${ROUTE:-/tmp/erc2/side4/mroute}; mkdir -p $R
D=$B/..
# the sizes that follow the ball's (params.json)
python3 -I $B/geometry.py $D/params.json $B/geometry.json
PY=/Applications/KiCad/KiCad.app/Contents/Frameworks/Python.framework/Versions/3.9/bin/python3
KC=/Applications/KiCad/KiCad.app/Contents/MacOS/kicad-cli
# Freerouting and its headless driver (FrRoute.java, from the kicad-headless-board-design skill), compiled once
JAR=${JAR:-~/Development/freerouting/build/libs/freerouting-executable.jar}
[ -f /tmp/erc2/fr/FrRoute.class ] || { mkdir -p /tmp/erc2/fr; javac -cp $JAR -d /tmp/erc2/fr $B/FrRoute.java; }
cp $D/../PMW3610-pogo/PMW3610-pogo.kicad_pcb $D/PMW3610-side-pogo.kicad_pcb
arch -arm64 $PY $B/module_pcb.py $D/PMW3610-side-pogo.kicad_pcb $D/PMW3610-side-pogo.kicad_sch > /dev/null 2>&1
cp $D/PMW3610-side-pogo.kicad_pcb $R/m.kicad_pcb; cp $D/PMW3610-side-pogo.kicad_pro $R/m.kicad_pro
cd $R
# the GND zones first: the autorouter leaves GND to them (a plane), instead of a track through the narrow places
arch -arm64 $PY $B/module_finish.py m.kicad_pcb - > /dev/null 2>&1
arch -arm64 $PY -c 'import pcbnew,sys; pcbnew.ExportSpecctraDSN(pcbnew.LoadBoard(sys.argv[1]), sys.argv[2])' m.kicad_pcb m.dsn > /dev/null 2>&1 || true
python3 -I $B/inset_poly.py m.dsn 0.35 $(python3 -c "import json,sys; print(' '.join(f'{x},{y}' for x, y in json.load(open(sys.argv[1]))['outline']))" $B/geometry.json)
nice -n 19 java -cp $JAR:/tmp/erc2/fr FrRoute m.dsn m.ses ${PASSES:-40} > fr.log 2>&1
arch -arm64 $PY $B/module_finish.py m.kicad_pcb m.ses 2>&1 | grep -v "Debug\|assert\|swig"
cp m.kicad_pcb $D/PMW3610-side-pogo.kicad_pcb
cd $D; $KC pcb drc --severity-all --schematic-parity --format json -o $R/drc.json PMW3610-side-pogo.kicad_pcb > /dev/null 2>&1
python3 -c "
import json,collections;d=json.load(open('$R/drc.json'));print(dict(collections.Counter((v['type'],v['severity']) for v in d['violations'])), 'unconnected', len(d['unconnected_items']), 'parity', len(d.get('schematic_parity',[])))
for v in d['unconnected_items'][:10]: print('  unc', [i['description'][:60] for i in v['items']])
for v in d.get('schematic_parity',[])[:6]: print('  par', v['type'], v['description'][:80])
for v in d['violations']:
    if v['severity']=='error': print(' ', v['type'], [i['description'][:60] for i in v['items']])"
