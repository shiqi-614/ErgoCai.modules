#!/usr/bin/env python3
# A joystick cap of a chosen height, for the Alps Alpine RKJXV122400R stick on ErgoCai's joystick board, as STEP,
# STL and GLB.
# - It is ErgoCaiLib's 3dmodels/Joystick Cap.stp, with its neck made longer or shorter, so only its top moves. The
#   skirt over the stick and the socket stay where they are.
# - The socket is the stick shaft's shape: a double D, 4.00 mm across and 2.98 mm between the flats (measured from
#   Alps' model of the stick). The source cap's round 4.5 mm hole would let the cap turn and wobble. --fit opens it
#   up for the printer. A 0.3 mm chamfer leads the shaft in.
# - Coordinates are the joystick board's: z = 0 on its top, the shaft's axis at x = y = 0. The model goes into a
#   footprint with no offset or rotation, or as an assembly part at the board's top.
# - The source cap is 16.92 mm tall: its skirt's rim at 9.08 mm over the board, its top at 26.00 mm. --height sets
#   the cap's height, rim to top; the neck has room to shorten it to 15.2 mm.
# Needs CadQuery: python3 -m venv .venv && .venv/bin/pip install -r tools/requirements-cap.txt. Or let GitHub Actions
# make one: Actions > joystick cap > Run workflow, then the files are under the run's Artifacts
# (.github/workflows/joystick-cap.yml).
# usage: python3 tools/joystick_cap.py --height <mm> [--fit <mm>] [--source <Joystick Cap.stp>] --out <path without
#        extension>
import argparse
import os
import sys

import cadquery as cq

# the source cap, placed as Alpsalpine's JT_J1 places it: turned over (rotate 0 180 180) and 18 mm up
SOURCE_Z, RIM, TOP = 18.0, 9.075, 26.0
# its neck, a cylinder of radius 5, runs from z 19.10 to 21.00 over the board
NECK_R, NECK_LO, NECK_HI = 5.0, 19.10, 21.00
# the source's round socket: from its ceiling at z 15.107 up to 19.10; the shaft's top is at 18.96
CEILING, SOCKET_TOP = 15.107, 19.10
# the shaft: a double D, round 4.00 mm, flats 2.98 mm apart
SHAFT_D, SHAFT_FLATS = 4.00, 2.98


def write_glb(path, shape, rgb):
    """The shape as a glTF binary, meshed as finely as the STL: one mesh with normals, in metres with y up (z up
    becomes y up, y becomes -z), as KiCad writes them. CadQuery's own export meshes a shape in metres far too
    finely."""
    import json
    import struct
    import numpy as np
    verts, tris = shape.tessellate(0.01, 0.1)
    v = np.array([(p.x, p.z, -p.y) for p in verts], dtype=np.float64) / 1000
    t = np.array(tris, dtype=np.uint32)
    # each vertex's normal: the triangles round it, weighted by their area (vertices are not shared across faces,
    # so edges stay sharp)
    n = np.zeros_like(v)
    c = np.cross(v[t[:, 1]] - v[t[:, 0]], v[t[:, 2]] - v[t[:, 0]])
    for k in range(3):
        np.add.at(n, t[:, k], c)
    n /= np.maximum(np.linalg.norm(n, axis=1, keepdims=True), 1e-30)
    pos, nor, idx = v.astype(np.float32).tobytes(), n.astype(np.float32).tobytes(), t.tobytes()
    binary = pos + nor + idx
    doc = {
        'asset': {'version': '2.0', 'generator': 'ErgoCai.modules tools/joystick_cap.py'},
        'scene': 0, 'scenes': [{'nodes': [0]}], 'nodes': [{'name': 'joystick cap', 'mesh': 0}],
        'meshes': [{'name': 'joystick cap', 'primitives': [{'attributes': {'POSITION': 0, 'NORMAL': 1}, 'indices': 2, 'material': 0}]}],
        'materials': [{'name': 'cap', 'pbrMetallicRoughness': {'baseColorFactor': [*rgb, 1], 'metallicFactor': 0, 'roughnessFactor': 0.6}}],
        'buffers': [{'byteLength': len(binary)}],
        'bufferViews': [{'buffer': 0, 'byteOffset': 0, 'byteLength': len(pos), 'target': 34962},
                        {'buffer': 0, 'byteOffset': len(pos), 'byteLength': len(nor), 'target': 34962},
                        {'buffer': 0, 'byteOffset': len(pos) + len(nor), 'byteLength': len(idx), 'target': 34963}],
        'accessors': [{'bufferView': 0, 'componentType': 5126, 'count': len(v), 'type': 'VEC3',
                       'min': v.min(axis=0).tolist(), 'max': v.max(axis=0).tolist()},
                      {'bufferView': 1, 'componentType': 5126, 'count': len(v), 'type': 'VEC3'},
                      {'bufferView': 2, 'componentType': 5125, 'count': t.size, 'type': 'SCALAR'}],
    }
    js = json.dumps(doc, separators=(',', ':')).encode()
    js += b' ' * (-len(js) % 4)
    binary += b'\0' * (-len(binary) % 4)
    with open(path, 'wb') as f:
        f.write(struct.pack('<III', 0x46546C67, 2, 12 + 8 + len(js) + 8 + len(binary)))
        f.write(struct.pack('<II', len(js), 0x4E4F534A) + js)
        f.write(struct.pack('<II', len(binary), 0x004E4942) + binary)


def main():
    p = argparse.ArgumentParser(description='A joystick cap of a chosen height (STEP, STL and GLB).')
    p.add_argument('--height', type=float, required=True, help=f'the cap, rim to top, in mm (the source is {TOP - RIM:.2f})')
    p.add_argument('--fit', type=float, default=0.05, help='clearance round the shaft, a side, in mm (default 0.05)')
    p.add_argument('--source', default=os.path.join(os.environ.get('ERGOCAI_LIB', os.path.join(os.path.dirname(__file__), '..', '..', 'ErgoCaiLib')), '3dmodels', 'Joystick Cap.stp'),
                   help="ErgoCaiLib's Joystick Cap.stp (default: ${ERGOCAI_LIB}, else ../ErgoCaiLib beside this repo)")
    p.add_argument('--out', required=True, help='the output path without extension: <out>.step, <out>.stl and <out>.glb')
    args = p.parse_args()
    extra = args.height - (TOP - RIM)
    if extra < -(NECK_HI - NECK_LO - 0.2):
        sys.exit(f'--height must be at least {TOP - RIM - (NECK_HI - NECK_LO - 0.2):.2f} mm: the neck can shorten by '
                 f'{NECK_HI - NECK_LO - 0.2:.1f} mm only')

    src = cq.importers.importStep(args.source).val()
    src = src.rotate((0, 0, 0), (1, 0, 0), 180).translate((0, 0, SOURCE_Z))
    # the cap is round: it is rebuilt from its half section, which is changed in the plane (the source solid itself
    # doesn't cut cleanly)
    rect = lambda x0, z0, x1, z1: cq.Face.makeFromWires(cq.Wire.makePolygon(
        [cq.Vector(x0, 0, z0), cq.Vector(x1, 0, z0), cq.Vector(x1, 0, z1), cq.Vector(x0, 0, z1)], close=True))
    profile = src.intersect(rect(0, 0, 40, 40))
    # the neck is cut at its middle; the top goes up by extra, and the gap is neck again (or a slab of it goes)
    cut = (NECK_LO + NECK_HI) / 2
    gone = max(-extra, 0)
    lower = profile.intersect(rect(0, 0, 40, cut - gone / 2))
    upper = profile.intersect(rect(0, cut + gone / 2, 40, 60)).translate((0, 0, extra))
    profile = lower.fuse(upper)
    if extra > 0:
        profile = profile.fuse(rect(0, cut - gone / 2, NECK_R, cut + extra))
    # the source's round socket filled in
    profile = profile.fuse(rect(0, CEILING, 2.8, SOCKET_TOP + 0.1)).clean()
    faces = profile.Faces()
    assert len(faces) == 1, f'the section came out as {len(faces)} faces'
    cap = cq.Solid.revolve(faces[0], 360, cq.Vector(0, 0, 0), cq.Vector(0, 0, 1))

    # the shaft's double D, with a chamfer to lead it in
    r, half = SHAFT_D / 2 + args.fit, SHAFT_FLATS / 2 + args.fit
    depth = SOCKET_TOP - CEILING
    socket = (cq.Workplane('XY', origin=(0, 0, CEILING - 0.01)).circle(r).extrude(depth + 0.01)
              .intersect(cq.Workplane('XY', origin=(0, 0, CEILING - 0.01)).rect(2 * r, 2 * half).extrude(depth + 0.01)))
    lead = (cq.Workplane('XY').add(cq.Solid.makeCone(r + 0.3, r, 0.3, cq.Vector(0, 0, CEILING - 0.001)))
            .intersect(cq.Workplane('XY', origin=(0, 0, CEILING - 0.005)).rect(2 * r + 1, 2 * half + 0.6).extrude(0.31)))
    cap = cap.cut(socket.val()).cut(lead.val())
    solids = cap.Solids()
    assert len(solids) == 1 and solids[0].isValid(), f'the cap came out as {len(solids)} solids, or an invalid one'
    cap = solids[0]

    bb = cap.BoundingBox()
    os.makedirs(os.path.dirname(os.path.abspath(args.out)), exist_ok=True)
    cq.exporters.export(cap, args.out + '.step')
    cq.exporters.export(cap, args.out + '.stl', tolerance=0.01, angularTolerance=0.1)
    write_glb(args.out + '.glb', cap, (0.93, 0.93, 0.93))
    print(f'{args.out}.step/.stl/.glb: {bb.zmax - bb.zmin:.2f} mm tall, rim at {bb.zmin:.2f} and top at {bb.zmax:.2f} mm over the joystick '
          f'board; ø{bb.xmax - bb.xmin:.2f} mm; socket {2 * r:.2f} x {2 * half:.2f} mm; volume {cap.Volume() / 1000:.2f} cm³')


if __name__ == '__main__':
    main()
