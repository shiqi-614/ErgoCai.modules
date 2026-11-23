#!/bin/zsh
# the sensor board end to end: placement, autorouting, zones, DRC (into /tmp/erc2/side4/route)
set -e
B=${0:A:h}; R=${ROUTE:-/tmp/erc2/side4/route}; mkdir -p $R
D=$B/../sensor
# the sizes that follow the ball's (params.json)
python3 -I $B/geometry.py $B/../params.json $B/geometry.json
PY=/Applications/KiCad/KiCad.app/Contents/Frameworks/Python.framework/Versions/3.9/bin/python3
KC=/Applications/KiCad/KiCad.app/Contents/MacOS/kicad-cli
# Freerouting and its headless driver (FrRoute.java, from the kicad-headless-board-design skill), compiled once
JAR=${JAR:-~/Development/freerouting/build/libs/freerouting-executable.jar}
[ -f /tmp/erc2/fr/FrRoute.class ] || { mkdir -p /tmp/erc2/fr; javac -cp $JAR -d /tmp/erc2/fr $B/FrRoute.java; }
cp $D/../../PMW3610-pogo/PMW3610-pogo.kicad_pcb $D/PMW3610-side-pogo-sensor.kicad_pcb
# (a failure stops the run: the board would stay the pogo module's)
arch -arm64 $PY $B/sensor_pcb.py $D/PMW3610-side-pogo-sensor.kicad_pcb $D/PMW3610-side-pogo-sensor.kicad_sch $B/place.json > $R/place.log 2>&1 || { grep -v "Debug\|assert\|swig" $R/place.log | tail -3; exit 1; }
grep -v "Debug\|assert\|swig" $R/place.log | head -1
cp $D/PMW3610-side-pogo-sensor.kicad_pcb $R/s.kicad_pcb; cp $D/PMW3610-side-pogo-sensor.kicad_pro $R/s.kicad_pro
cd $R
# ZONES_FIRST=1: the GND zones before the autorouter, which then leaves GND to them as a plane (as the module board's)
[ -n "$ZONES_FIRST" ] && arch -arm64 $PY $B/sensor_finish.py s.kicad_pcb - > /dev/null 2>&1
arch -arm64 $PY -c 'import pcbnew,sys; pcbnew.ExportSpecctraDSN(pcbnew.LoadBoard(sys.argv[1]), sys.argv[2])' s.kicad_pcb s.dsn 2>&1 | grep -v "Debug\|assert\|swig" || true
python3 -I $B/inset.py s.dsn 0.35 > /dev/null
nice -n 19 java -cp $JAR:/tmp/erc2/fr FrRoute s.dsn s.ses ${PASSES:-40} > fr.log 2>&1
arch -arm64 $PY $B/sensor_finish.py s.kicad_pcb s.ses 2>&1 | grep -v "Debug\|assert\|swig"
$KC pcb drc --severity-all --format json -o drc.json s.kicad_pcb > /dev/null 2>&1
DROP=$(python3 -c "
import json; d=json.load(open('drc.json'))
print(' '.join(f\"{i['pos']['x']},{i['pos']['y']}\" for v in d['violations'] if v['type'] == 'via_dangling' for i in v['items']))")
if false && [ -n "$DROP" ]; then arch -arm64 $PY $B/sensor_finish.py s.kicad_pcb - ${=DROP} 2>&1 | grep -v "Debug\|assert\|swig"; $KC pcb drc --severity-all --format json -o drc.json s.kicad_pcb > /dev/null 2>&1; fi
arch -arm64 $PY $B/gnd_vias.py s.kicad_pcb 2>&1 | grep -v "Debug\|assert\|swig"
$KC pcb drc --severity-all --format json -o drc.json s.kicad_pcb > /dev/null 2>&1
python3 -c "
import json,collections;d=json.load(open('drc.json'));print(dict(collections.Counter(v['type'] for v in d['violations'])), 'unconnected', len(d['unconnected_items']))
for v in d['unconnected_items'][:12]: print('  unc', [i['description'][:60] for i in v['items']])
for v in d['violations']:
    if v['type'] not in ('silk_over_copper','silk_overlap','lib_footprint_mismatch','lib_footprint_issues','silk_edge_clearance','courtyards_overlap'): print(' ', v['type'], [i['description'][:60] for i in v['items']])"
