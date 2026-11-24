// The tenting legs' printed parts, for ErgoCai.ts's tent case parts (the acrylic legs, `outlines._tent_*`): a seat
// under each half's two inner screws that holds two legs, one for each tent angle. With the legs folded the keyboard
// lies on the seats and on two bought silicone bumpers by its outer edge, a little tilted up on its thumb side; with a
// pair of legs down it stands on them and on the bumpers, tilted up by that pair's angle.
//
// - The seat: held under the bottom plate by the case's own screw at that corner, an M2 x 10 pan head in place of the
//   case's, from below through the seat and the plate into the standoff, its head sunk. Beside the screw, two slots
//   side by side, a leg in each, both on one pin: an M2 x 16 screw through the slots' walls and the legs' holes, with
//   an M2 nyloc nut, only snug: the legs turn freely on it. A leg folds toward the case's middle (+x), flat under the
//   plate, 0.4 mm under it and 2.2 mm over the seat's bottom. Turned down, it stands square to the plate, its back on
//   the slot's end. Standing, the table pushes its foot toward the raised side (-x), which holds it against that end.
// - The detent: behind each leg an M3 ball plunger (a spring and a 1.5 mm steel ball in a threaded body), screwed into
//   its hole from the seat's back, along the legs at the pin's height, its ball on the leg's round end. The end has a
//   notch for the ball folded and one standing (ErgoCai.ts units tentBall, tentNotchFold, tentNotchOpen, tentRest),
//   each a little past where the leg stops, so that the ball keeps it there: folded, up against the plate; standing,
//   back on the slot's end. Between the two the leg turns freely; how hard it clicks is how far the plunger is
//   screwed in.
// - The bumper: a bought 8 x 2.5 mm silicone dome stuck under the outer edge, drawn here only for the 3D view.
//
// Frame (mm): the seat's screw at x = y = 0, z = 0 the bottom plate's underside, z up; the legs fold toward +x, their
// slots beside the screw, toward -y. That is the right half's seat at matrix_top_left. The mirrored seat (y -> -y)
// goes at thumb_lower, turned 25 degrees with the thumbs; the left half takes the two the other way round, each turned
// a half turn more (ErgoCai.ts: the tent assemblies). The pin's axis is along y at (PIVOT.x, PIVOT.z).
//
// The numbers ErgoCai.ts's tent units repeat: LEG (tentLegW, tentLegT), PIVOT (tentPivotX, tentPivotZ), SLOT and
// SEAT.yc (where each leg is: tentSlotLow, tentSlotHigh), H (tentSeat), BUMPER (tentBumperD, tentBumper).
//
// Writes binary STLs to print, each on the face that is against the plate: seat.stl, seat-mirrored.stl (two of each
// for a keyboard); with --glb, a glTF binary of each beside it (metres, y up) for ergogen-gui's 3D view, and bumper.glb.
//
// usage: node tent.js [--out <dir>] [--glb]
//   manifold-3d (npm install in this folder; or MANIFOLD=<a node_modules folder that has it>)
const fs = require('fs')
const path = require('path')
const {pathToFileURL} = require('url')

const arg = name => {
    const i = process.argv.indexOf(`--${name}`)
    return i > 0 ? process.argv[i + 1] : undefined
}
const OUT = arg('out') || __dirname
const GLB = process.argv.includes('--glb')

// the legs: the case's 3 mm acrylic, 6 mm wide, a round end of half that round the pin
const LEG = {t: 3.0, w: 6.0}
// a slot for each leg, 0.4 mm wider than the sheet (cast acrylic runs 3 +- 0.2), the walls between and outside
// them, and the room round a leg's round end
const SLOT = {n: 2, w: 3.4, inner: 1.6, outer: 1.6, room: 0.3}
// the pin's axis, along y: along the legs from the screw, clear of its boss by the nut's half width; under the plate
// by a leg's round end and 0.4 mm
const PIVOT = {x: 6.5, z: -(LEG.w / 2 + 0.4), hole: 2.3}
// the slots' middle, beside the screw; the seat's back, behind the screw, 6.7 mm of thread for an M3 x 6 plunger; its
// front, past the pin; the screw's boss
const SEAT = {yc: -9.0, x0: -3.5, front: 4.5, boss: 3.5}
// how far the seats reach under the plate: 2.2 mm under a folded leg. Folded, the half lies tilted on the seats and the
// bumpers, the table rising toward the bumpers under the legs; this keeps their ends off it.
const H = -PIVOT.z + LEG.w / 2 + 2.2
// the case screw from below, M2 x 10 pan head (ISO 14583, head 3.8 x 1.6): its head sunk so that 4 mm of seat and the
// 3 mm plate leave 3 mm of it in the standoff
const SCREW = {length: 10, hole: 2.3, head: 4.4, sink: H - 4.0}
// an M3 plunger's hole, for it to cut its own thread in
const PLUNGER = {hole: 2.5}
const BUMPER = {d: 8.0, h: 2.5}
const SEGMENTS = 48

const main = async () => {
    const where = process.env.MANIFOLD || path.join(__dirname, 'node_modules')
    const entry = [path.join(where, 'manifold-3d', 'manifold.js'), path.join(where, 'node_modules', 'manifold-3d', 'manifold.js')]
        .find(p => fs.existsSync(p))
    if (!entry) throw new Error(`no manifold-3d in ${where}: npm install, or set MANIFOLD`)
    const wasm = await (await import(pathToFileURL(entry).href)).default()
    wasm.setup()
    const {Manifold} = wasm

    const box = (x0, x1, y0, y1, z0, z1) => Manifold.cube([x1 - x0, y1 - y0, z1 - z0]).translate([x0, y0, z0])
    const disc = (d, z0, z1) => Manifold.cylinder(z1 - z0, d / 2, d / 2, SEGMENTS).translate([0, 0, z0])
    // the case screw's hole and its head's, from the bottom
    const screw = solid => solid.subtract(disc(SCREW.hole, -H - 1, 1)).subtract(disc(SCREW.head, -H - 1, -H + SCREW.sink))

    const half = (SLOT.n * SLOT.w + (SLOT.n - 1) * SLOT.inner + 2 * SLOT.outer) / 2
    let seat = Manifold.union([disc(2 * SEAT.boss, -H, 0), box(SEAT.x0, PIVOT.x + SEAT.front, SEAT.yc - half, SEAT.yc + half, -H, 0)])
    for (let i = 0; i < SLOT.n; i++) {
        const y0 = SEAT.yc - half + SLOT.outer + i * (SLOT.w + SLOT.inner)
        // over the pin, room round the leg's round end; under it, the slot's end a standing leg's back is on
        seat = seat.subtract(box(PIVOT.x - LEG.w / 2 - SLOT.room, PIVOT.x + 99, y0, y0 + SLOT.w, PIVOT.z, 1))
            .subtract(box(PIVOT.x - LEG.w / 2, PIVOT.x + 99, y0, y0 + SLOT.w, -H - 1, PIVOT.z + 0.01))
            // the plunger's hole, from the seat's back into the slot, on the line through the pin
            .subtract(Manifold.cylinder(PIVOT.x - SEAT.x0, PLUNGER.hole / 2, PLUNGER.hole / 2, SEGMENTS).rotate([0, 90, 0])
                .translate([SEAT.x0 - 1, y0 + SLOT.w / 2, PIVOT.z]))
    }
    const pin = Manifold.cylinder(2 * half + 2, PIVOT.hole / 2, PIVOT.hole / 2, SEGMENTS).rotate([-90, 0, 0])
        .translate([PIVOT.x, SEAT.yc - half - 1, PIVOT.z])
    seat = screw(seat.subtract(pin))
    // the bumper's dome, its flat side on the plate
    const radius = ((BUMPER.d / 2) ** 2 + BUMPER.h ** 2) / (2 * BUMPER.h)
    const bumper = Manifold.sphere(radius, SEGMENTS).translate([0, 0, radius - BUMPER.h])
        .intersect(box(-BUMPER.d, BUMPER.d, -BUMPER.d, BUMPER.d, -BUMPER.h, 0))
    if (GLB) fs.writeFileSync(path.join(OUT, 'bumper.glb'), glb([{name: 'bumper', solid: bumper, rgb: [0.9, 0.93, 0.96]}]))

    const parts = {seat, 'seat-mirrored': seat.mirror([0, 1, 0])}
    for (const [name, solid] of Object.entries(parts)) {
        // printed on the face that is against the plate: turned over (not mirrored), that face at z = 0
        fs.writeFileSync(path.join(OUT, `${name}.stl`), stl(solid.rotate([180, 0, 0]), `ErgoCai tent ${name} (manifold-3d)`))
        if (GLB) fs.writeFileSync(path.join(OUT, `${name}.glb`), glb([{name, solid, rgb: [0.86, 0.9, 0.95]}]))
        const b = solid.boundingBox()
        console.log(`${name}: ${(solid.volume() / 1000).toFixed(2)} cm3, ${solid.decompose().length} piece(s), ` +
                    `x ${b.min[0].toFixed(2)}..${b.max[0].toFixed(2)} y ${b.min[1].toFixed(2)}..${b.max[1].toFixed(2)} ` +
                    `z ${b.min[2].toFixed(2)}..${b.max[2].toFixed(2)}`)
    }
    console.log(`under the plate ${H.toFixed(1)} mm; the pin at x ${PIVOT.x}, z ${PIVOT.z}; the slots' middles at y ` +
                [...Array(SLOT.n).keys()].map(i => (SEAT.yc - half + SLOT.outer + SLOT.w / 2 + i * (SLOT.w + SLOT.inner)).toFixed(1)).join(', ') +
                `; the case screw M2 x ${SCREW.length}, ${(SCREW.length - (H - SCREW.sink) - 3).toFixed(1)} mm into the standoff`)
}

// binary STL, as ergogen writes its cases
const stl = (solid, header) => {
    const {numProp, vertProperties: v, triVerts: t} = solid.getMesh()
    const count = t.length / 3
    const view = new DataView(new ArrayBuffer(84 + 50 * count))
    for (let i = 0; i < header.length; i++) view.setUint8(i, header.charCodeAt(i))
    view.setUint32(80, count, true)
    let at = 84
    for (let i = 0; i < count; i++) {
        const [a, b, c] = [0, 1, 2].map(k => [0, 1, 2].map(axis => v[t[3 * i + k] * numProp + axis]))
        const u = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], w = [c[0] - a[0], c[1] - a[1], c[2] - a[2]]
        const n = [u[1] * w[2] - u[2] * w[1], u[2] * w[0] - u[0] * w[2], u[0] * w[1] - u[1] * w[0]]
        const len = Math.hypot(...n) || 1
        for (const value of [n[0] / len, n[1] / len, n[2] / len, ...a, ...b, ...c]) {
            view.setFloat32(at, value, true)
            at += 4
        }
        at += 2
    }
    return new Uint8Array(view.buffer)
}

// glTF binary of solids, a mesh each with its normals, in a colour of its own; glTF is in metres with y up
const glb = (parts) => {
    const chunks = [], bufferViews = [], accessors = [], meshes = [], materials = []
    let offset = 0
    const add = (array, target) => {
        const bytes = Buffer.from(array.buffer)
        chunks.push(bytes)
        bufferViews.push({buffer: 0, byteOffset: offset, byteLength: bytes.length, target})
        offset += bytes.length
        return bufferViews.length - 1
    }
    for (const {name, solid, rgb} of parts) {
        const {numProp, vertProperties: v, triVerts: t} = solid.calculateNormals(0, 30).getMesh()
        const count = v.length / numProp
        const positions = new Float32Array(count * 3), normals = new Float32Array(count * 3)
        const min = [Infinity, Infinity, Infinity], max = [-Infinity, -Infinity, -Infinity]
        for (let i = 0; i < count; i++) {
            const [x, y, z, nx, ny, nz] = [0, 1, 2, 3, 4, 5].map(k => v[i * numProp + k])
            const p = [x / 1000, z / 1000, -y / 1000]
            positions.set(p, i * 3)
            normals.set([nx, nz, -ny], i * 3)
            p.forEach((value, k) => { min[k] = Math.min(min[k], value); max[k] = Math.max(max[k], value) })
        }
        const indices = new Uint32Array(t)
        accessors.push({bufferView: add(positions, 34962), componentType: 5126, count, type: 'VEC3', min, max})
        accessors.push({bufferView: add(normals, 34962), componentType: 5126, count, type: 'VEC3'})
        accessors.push({bufferView: add(indices, 34963), componentType: 5125, count: indices.length, type: 'SCALAR'})
        materials.push({name, pbrMetallicRoughness: {baseColorFactor: [...rgb, 1], metallicFactor: 0, roughnessFactor: 0.7}})
        const at = accessors.length - 3
        meshes.push({name, primitives: [{attributes: {POSITION: at, NORMAL: at + 1}, indices: at + 2, material: materials.length - 1}]})
    }
    const binary = Buffer.concat(chunks)
    const json = {
        asset: {version: '2.0', generator: 'ErgoCai tent.js (manifold-3d)'},
        scene: 0, scenes: [{nodes: meshes.map((_, i) => i)}], nodes: meshes.map((m, i) => ({mesh: i, name: m.name})),
        meshes, materials, buffers: [{byteLength: binary.length}], bufferViews, accessors,
    }
    const pad = (buffer, fill) => Buffer.concat([buffer, Buffer.alloc((4 - buffer.length % 4) % 4, fill)])
    const jsonChunk = pad(Buffer.from(JSON.stringify(json)), 0x20), binChunk = pad(binary, 0)
    const header = Buffer.alloc(12), jsonHead = Buffer.alloc(8), binHead = Buffer.alloc(8)
    header.writeUInt32LE(0x46546c67, 0); header.writeUInt32LE(2, 4)
    header.writeUInt32LE(12 + 8 + jsonChunk.length + 8 + binChunk.length, 8)
    jsonHead.writeUInt32LE(jsonChunk.length, 0); jsonHead.writeUInt32LE(0x4e4f534a, 4)
    binHead.writeUInt32LE(binChunk.length, 0); binHead.writeUInt32LE(0x004e4942, 4)
    return Buffer.concat([header, jsonHead, jsonChunk, binHead, binChunk])
}

main().catch(e => { console.error(e); process.exit(1) })
