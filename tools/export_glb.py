#!/usr/bin/env python3
# Exports the 3D model of every module that has one again: <dir>/<name>.glb from <dir>/<name>.kicad_pcb, the board
# with all its footprints' models, for ergogen-gui's 3D view (assemblies.<half>.parts in ErgoCai's config).
# - A module has one when a .glb is committed beside its board. To add one, commit any file of that name, and the
#   next run writes it.
# - The export is KiCad's (kicad-cli pcb export glb --subst-models): metres, y up, the board's bottom at 0.
# - A .glb is rewritten only when its content changes. KiCad's time stamp in it (asset.extras.generated_at) doesn't
#   count.
# - Every model a board names must be found, or that module's .glb is left as it was and the run fails. kicad-cli
#   itself would only warn and leave the model out of the file.
# GitHub Actions runs this on macOS with KiCad's app (.github/workflows/glb.yml) and commits what changed.
# usage: python3 tools/export_glb.py --ergocai-lib <ErgoCaiLib checkout> --kicad-3d <KiCad's 3dmodels dir>
#        [--kicad-cli <command>] [--changed <file to list the rewritten .glb files in>] [<dir to look in>...]
import argparse
import json
import os
import re
import shlex
import shutil
import struct
import subprocess
import sys
import tempfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def modules(tops):
    """<dir>/<name> of every .glb beside a .kicad_pcb of the same name, hidden directories left out."""
    found = []
    for top in tops:
        for d, subdirs, files in os.walk(top):
            subdirs[:] = sorted(s for s in subdirs if not s.startswith('.'))
            found += [os.path.join(d, f[:-4]) for f in sorted(files)
                      if f.endswith('.glb') and os.path.isfile(os.path.join(d, f[:-4] + '.kicad_pcb'))]
    return found


def missing_models(board, env):
    """The models the board names that are not there, as KiCad would look for them with --subst-models."""
    missing = []
    for path in sorted(set(re.findall(r'\(model "([^"]+)"', open(board, encoding='utf-8').read()))):
        names = re.findall(r'\$\{(\w+)\}', path)
        unknown = [n for n in names if n not in env]
        if unknown:
            missing.append(f'{path} (no value for {", ".join(unknown)})')
            continue
        full = re.sub(r'\$\{(\w+)\}', lambda m: env[m.group(1)], path)
        if not os.path.isabs(full):
            full = os.path.join(os.path.dirname(board), full)
        stem, ext = os.path.splitext(full)
        # a VRML model stands for the STEP or IGES model beside it
        tries = [stem + e for e in ('.step', '.stp', '.STEP', '.STP', '.iges', '.igs')] if ext.lower() in ('.wrl', '.wrz') else [full]
        if not any(os.path.isfile(t) for t in tries):
            missing.append(path)
    return missing


def content(path):
    """A .glb's content without KiCad's time stamp: its JSON, sorted, and its binary chunk; None if not a glTF."""
    data = open(path, 'rb').read()
    if len(data) < 20 or data[:4] != b'glTF':
        return None
    length = struct.unpack_from('<I', data, 12)[0]
    doc = json.loads(data[20:20 + length])
    doc.get('asset', {}).get('extras', {}).pop('generated_at', None)
    return json.dumps(doc, sort_keys=True), data[20 + length:]


def main():
    p = argparse.ArgumentParser(description='Export the modules\' .glb files again from their boards.')
    p.add_argument('--ergocai-lib', required=True, help='an ErgoCaiLib checkout, for ${ERGOCAI_LIB}')
    p.add_argument('--kicad-3d', required=True, help="KiCad's 3dmodels directory, for ${KICAD6_3DMODEL_DIR} to ${KICAD9_3DMODEL_DIR}")
    p.add_argument('--kicad-cli', default='kicad-cli', help='the kicad-cli command (default: kicad-cli)')
    p.add_argument('--changed', help='a file to list the rewritten .glb files in, one a line')
    p.add_argument('dirs', nargs='*', help='where to look for modules (default: the whole repo)')
    args = p.parse_args()
    env = {'ERGOCAI_LIB': os.path.abspath(args.ergocai_lib)}
    env.update({f'KICAD{v}_3DMODEL_DIR': os.path.abspath(args.kicad_3d) for v in (6, 7, 8, 9)})
    found = modules(args.dirs or [ROOT])
    if not found:
        sys.exit('no .glb beside a .kicad_pcb of the same name')
    changed, failed = [], []
    with tempfile.TemporaryDirectory() as tmp:
        for module in found:
            name = os.path.relpath(module, ROOT)
            board, glb = module + '.kicad_pcb', module + '.glb'
            missing = missing_models(board, env)
            if missing:
                failed.append(name)
                print(f'{name}: {len(missing)} models not found:\n  ' + '\n  '.join(missing))
                continue
            # the same file name as the module's: KiCad writes it into the file
            out = os.path.join(tmp, os.path.basename(glb))
            cmd = shlex.split(args.kicad_cli) + ['pcb', 'export', 'glb', '--subst-models', '-f']
            cmd += [a for k, v in env.items() for a in ('-D', f'{k}={v}')] + ['-o', out, board]
            r = subprocess.run(cmd, capture_output=True, text=True)
            log = (r.stdout + r.stderr).splitlines()
            # what it says of a model it leaves out (macOS adds harmless NSCocoaErrorDomain lines, so not just 'error')
            problems = [l for l in log if re.search(r'could not add 3d model|file not found', l, re.I)]
            if r.returncode != 0 or problems or not os.path.isfile(out):
                failed.append(name)
                print(f'{name}: kicad-cli failed (exit {r.returncode}):\n  ' + '\n  '.join(problems or log[-10:]))
                continue
            if content(out) == content(glb):
                print(f'{name}.glb: up to date')
                continue
            shutil.copyfile(out, glb)
            changed.append(os.path.relpath(glb, ROOT))
            print(f'{name}.glb: written, {os.path.getsize(glb)} bytes')
    if args.changed:
        with open(args.changed, 'w') as f:
            f.writelines(c + '\n' for c in changed)
    if failed:
        sys.exit(f'not exported: {", ".join(failed)}')


if __name__ == '__main__':
    main()
