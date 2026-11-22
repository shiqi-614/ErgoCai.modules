#!/bin/zsh
# the module for the ball in params.json, end to end: the sizes (geometry.py), the module board, the sensor board (its
# placement's alternatives and a few autorouter runs each, until it routes clean), the cartridge, the case's opening
# into the mount's User.1 if it must grow (mount_outline.py, then the cartridge again), and the 3D models: the
# cartridge's and the sensor board's STEP into ErgoCaiLib (ERGOCAI_LIB), the module's GLB.
#   TRIES (3) runs per placement; ROUTE the scratch directory for the autorouter
set -e
B=${0:A:h}; D=$B/..; W=${ROUTE:-/tmp/erc2/side4}; mkdir -p $W
LIB=${ERGOCAI_LIB:-${B:h:h:h:h}/ErgoCaiLib}; export ERGOCAI_LIB=$LIB
KC=/Applications/KiCad/KiCad.app/Contents/MacOS/kicad-cli
python3 -I $B/geometry.py $D/params.json $B/geometry.json
ROUTE=$W/mroute $B/run_module.sh | tail -1
ALTS=$(python3 -c "import json,sys; print(max([len(v) for v in json.load(open(sys.argv[1])).values() if isinstance(v[0], list)] + [1]))" $B/place.json)
ok=
for alt in $(seq 0 $((ALTS - 1))); do
  for i in $(seq 1 ${TRIES:-3}); do
    out=$(PLACE_ALT=$alt ROUTE=$W/route $B/run_sensor.sh 2>&1)
    errs=$(python3 -c "import json,sys; d=json.load(open(sys.argv[1])); print(len([v for v in d['violations'] if v['severity']=='error']))" $W/route/drc.json)
    echo "sensor board, place $alt, run $i: $(echo $out | grep -oE 'unconnected [0-9]+'), $errs errors"
    if echo $out | grep -q 'unconnected 0' && [ $errs = 0 ]; then ok=1; break 2; fi
  done
done
[ -n "$ok" ] || { echo "the sensor board does not route: move a part in place.json"; exit 1; }
cp $W/route/s.kicad_pcb $D/sensor/PMW3610-side-pogo-sensor.kicad_pcb
cd $D/cartridge
rm -f $B/opening.json
node cartridge.js --way --glb cartridge.glb --step $LIB/3dmodels/TrackballCartridge_PMW3610-side-pogo.step | grep -v '^/'
if [ -f $B/opening.json ]; then
  python3 -I $B/mount_outline.py $B/opening.json
  node cartridge.js --way --glb cartridge.glb --step $LIB/3dmodels/TrackballCartridge_PMW3610-side-pogo.step | grep -v '^/'
fi
cd $D
$KC pcb export step --subst-models -f --no-dnp -o $LIB/3dmodels/PMW3610-side-pogo-sensor.step sensor/PMW3610-side-pogo-sensor.kicad_pcb > /dev/null
$KC pcb export glb --subst-models -f -D ERGOCAI_LIB=$LIB -o PMW3610-side-pogo.glb PMW3610-side-pogo.kicad_pcb > /dev/null
echo "done: ball $(python3 -c "import json; print(json.load(open('$D/params.json'))['ball'])") mm"
