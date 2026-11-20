// The joystick module's retainer (joystick/Alpsalpine-pogo on the pogo mount, joystick/joystick-mount-pogo): a
// printed frame and a printed base, screwed together through the module board's corner holes into one cartridge
// that snaps into the case and comes out again without a tool. It replaces the module's M2 screws and standoffs,
// or its locating pins and magnets.
//
// - The base: a plate 1 mm thick on the keyboard board, the module board's outline, open over the contact pads
//   (x 9.6..12.4, |y| < 7.75); on it four spacers under the board's corner holes and a post under the stick. The
//   spacers hold the board 3.8 mm over the keyboard board, so the KTT50003 pins work at 3.8 mm, the top of their
//   3.50-3.80 range; a spigot under each goes into the mount's hole (2.2 mm) and puts the cartridge, and so the
//   module's pins, on the contact pads. The post, 5 mm across at the board's centre and as tall as the spacers,
//   takes a hard push on the stick (its push switch needs more than the six pins' 2.4 N) before the board bends
//   down into the pins. The board's back is free over the plate: the stick's legs and locating pegs, the lowest
//   things on it, reach 1.3 mm below the board, 2.5 mm over the keyboard board. It prints upside down, on the
//   spacers' and the post's tops, so they come out level.
// - The frame: four feet on the board's top round its corner holes (where the screw heads were), joined by a wall
//   round the board's edge, in the 1.6 mm between the board and the case's opening, from the board's bottom up to
//   the cover; it is open only over the hook arms and round the levers. A column over each foot carries the
//   cover, and four M2 x 12 countersunk machine screws (ISO 7046 / DIN 965) go down from the cover's top through
//   the columns, the feet and the board's holes into brass heat-set inserts in the spacers, their heads flush, so
//   the cartridge can be taken apart and put together again as often as needed.
// - A hook arm on each short side: at the pin end (the column of pins at x 11, where their 2.4 N pushes up) and at
//   the far end, so the cartridge is held at both ends and cannot turn. Each lies in the frame's plane, rooted at
//   one end; its hook reaches out under the edge of the case's top layer. The middle layer's opening is 1 mm wider
//   than the top layer's (ErgoCai.ts: right_middle cuts modules.joystick with expand 2.5 against 1.5), which leaves
//   that edge as a ledge. Pushed straight down, the hooks' ramps bend the arms in until they spring out under the
//   ledge, and the spigots go into their holes. Squeezing the two levers toward each other (one at each end, up
//   through the cover) bends them in again to lift the cartridge out. The arms bend sideways, along the print's
//   layers, not across them. The hooks reach `--clamp` (0.1 mm) higher than the ledge, so the frame is a little
//   bent when fitted and keeps the cartridge down.
// - A cover over it all, flush with the case's top, fills the top layer's opening but for a round hole the stick's
//   cap moves in, 13.8 mm from the shaft, the levers' slots and the screws' holes. From the module's 3D model, the
//   cap's skirt is 12.0 mm round at 9.1 mm over the board, and the stick's housing stays inside 10.1 mm above 5 mm;
//   tilted 25 degrees about a pivot 3 to 8 mm up (the stick's own is not known), the skirt sweeps out to about
//   13.5-13.8 mm where the cover is. Posts at the rim's corners and the arms' roots hold it. It hides the board.
//
// Writes binary STLs in mm (the frame; the base) and, with --glb, a glTF binary of the frame and the base in place (metres, y up, as glTF has it) for ergogen-gui's 3D view, as an assembly part at the
// joystick module with z = the board's top (13.4 in ErgoCai.ts: the keyboard board's top 8.0 + 3.8 + 1.6). With
// --step, a STEP of the frame (tessellated, as trackball/PMW3610-pogo/cup's cup.js writes them, which KiCad reads
// and ergogen-gui's OpenCascade does not). All in the joystick board's frame as KiCad places a footprint's 3D
// model: z up, the board's top at z = 0, x as the board's x and y as the board's -y (KiCad's y points down), the
// stick's shaft at x = y = 0.
//
// usage: node retainer.js [--spacer <mm>] [--clamp <mm>] [--out <frame.stl>] [--base-out <base.stl>]
//                         [--glb <file.glb>] [--step <file.step>]
//   manifold-3d (npm install in this folder; or MANIFOLD=<a node_modules folder that has it>)
//
// What the numbers rest on (the board and its holes: joystick/Alpsalpine-pogo; the case: ErgoCai.ts):
// - the board: x -14.5..14.5, y -13.0..13.0, 1.6 mm, holes at (+-12.35, +-10.85), as the mount (Pogo_ModuleMount);
// - its top is taken by the stick (its outline, from the footprint's silkscreen, -10.0..8.25 by -11.75..10.0), and
//   by the pins' solder at x 9.6..12.4, |y| < 7.5: the frame stays outside those, but for the feet;
// - the case's opening, from the mount's courtyard (-14.6..14.6 by -13.1..13.1) grown by 1.5: -16.1..16.1 by
//   -14.6..14.6; the top layer 18..21 and the keyboard board's top at 8.0, over the case's bottom;
// - the pins' force, 6 x about 0.4 N at 3.8 mm, almost all on the feet at the pin end (x 12.35): taken there by
//   the pin end's hook;
// - PETG: the arms bend about 0.5 % (1.5 * t * deflection / length^2), far under its 3-4 %.
const fs = require('fs')
const path = require('path')
const {pathToFileURL} = require('url')

const arg = (name, value) => {
    const i = process.argv.indexOf(`--${name}`)
    return i > 0 ? process.argv[i + 1] : value
}
const SPACER_H = Number(arg('spacer', 3.8))      // the board's bottom over the keyboard board's top
const CLAMP = Number(arg('clamp', 0.1))          // the hooks, over the ledge
const OUT = arg('out', path.join(__dirname, 'retainer.stl'))
const BASE_OUT = arg('base-out', path.join(__dirname, 'base.stl'))
const STEP = arg('step', '')
const GLB = arg('glb', '')

const BOARD = {x0: -14.5, x1: 14.5, y0: -13.0, y1: 13.0, t: 1.6}
const HOLES = [[-12.35, -10.85], [-12.35, 10.85], [12.35, -10.85], [12.35, 10.85]]
const KEYBOARD = {top: 8.0, t: 1.6}              // the keyboard board, its top over the case's bottom
const OPENING = {x0: -16.1, x1: 16.1, y: 14.6}   // the top layer's opening
const COURTYARD = {x0: -14.6, x1: 14.6, y: 13.1, grown: 1.5}   // the mount's, which the case cuts round, grown
const BOARD_TOP = KEYBOARD.top + SPACER_H + BOARD.t
const LEDGE = 18.0 - BOARD_TOP                   // the top layer's underside over the board's top
const CASE_TOP = 21.0 - BOARD_TOP
const FOOT = {d: 4.0, h: 1.2}                    // a column from each foot up to the cover, the screw through it
// a spacer: 5.2 mm round, for the insert in its top and 1 mm of wall round it; it reaches 0.45 mm past the board's
// edge, under the frame's rim, and keeps 0.9 mm off the pins' bodies under the board (x 10..12, |y| < 7.35)
const SPACER = {d: 5.2, spigot: 2.15, spigotH: 1.2, chamfer: 0.2}
// the screws that make the frame, the module board and the base one: M2 countersunk machine screws, 12 mm overall,
// from the cover's top down the corner columns and through the board's holes into the inserts; their heads flush
const SCREW = {length: 12, clear: 2.3, head: 3.8}
// M2 brass heat-set inserts, 3 mm long and 3.2 mm round (M2 x 3 x 3.2): their hole in the spacer's top, 0.2 mm
// deeper than they are long, melted in with a soldering iron flush with the top before the board goes on
const INSERT = {length: 3.0, hole: 3.2, extra: 0.2}
// under the stick: as tall as the spacers, so the base prints flat on their tops (and the post's), and the board
// rests on it too
const POST = {d: 5.0, gap: 0}
// the plate the spacers and the post stand on, on the keyboard board: the board's outline, round at its corners,
// less the contact pads (x 9.6..12.4, |y| < 7.75) and a little round them
const PLATE = {t: 1.0, inset: 0.3, r: 2.15, pads: {x0: 9.4, x1: 12.6, y: 8.0}}
const RIM = {gap: 0.15, wall: 1.0, z0: -1.6, z1: 2.0}
// the hook arms, one on each short side (the pin end, +x, and the far end): y from the root to the free end, the
// arm's height, its root post; the hook; the lever at the free end, its length along the arm, its thickness (into
// the frame), and how far it stands up past the case's top
const ARM = {root: 9.0, free: -7.0, z0: 0.4, post: 1.5}
const HOOK = {length: 4.0, reach: 1.0, ramp: 0.7, flat: 0.5}   // out of the arm; its ramp, then its flat, to its top
const LEVER = {length: 4.0, t: 1.5, over: 1.5}
const SLOT = 0.5                                 // between the arm's free end and the rim
// the cover: its thickness, the cap's hole and its chamfer round the top, its gap to the case's opening, its
// posts' side, and the chamfer of its outer top edge
const COVER = {t: 1.2, hole: 13.0, dish: 0.4, clear: 0.3, post: 2.0, edge: 0.4}
const GRIP = {ribs: 2, rib: 0.2, pitch: 0.35, depth: 0.3}      // the levers' ribs, on their outer faces, under the round top
const LEVER_ROOM = {around: 0.4, squeeze: 0.8}   // the levers' slots: round them, and inward for their travel
const SEGMENTS = 48

const main = async () => {
    // manifold-3d: in this folder, or where MANIFOLD points
    const where = process.env.MANIFOLD || path.join(__dirname, 'node_modules')
    const entry = [path.join(where, 'manifold-3d', 'manifold.js'), path.join(where, 'node_modules', 'manifold-3d', 'manifold.js')]
        .find(p => fs.existsSync(p))
    if (!entry) throw new Error(`no manifold-3d in ${where}: npm install, or set MANIFOLD`)
    const wasm = await (await import(pathToFileURL(entry).href)).default()
    wasm.setup()
    const {Manifold, CrossSection} = wasm

    // a box from KiCad coordinates (y down) to the model's (y up)
    const box = (x0, x1, y0, y1, z0, z1) => Manifold.cube([x1 - x0, y1 - y0, z1 - z0]).translate([x0, -y1, z0])
    const disc = (d, x, y, z0, z1) => Manifold.cylinder(z1 - z0, d / 2, d / 2, SEGMENTS).translate([x, -y, z0])
    // the mount's courtyard grown by `by`, round at the corners as ergogen's expand makes the case's opening
    const rounded = (by, z0, z1) => CrossSection.square([COURTYARD.x1 - COURTYARD.x0, 2 * COURTYARD.y])
        .translate([COURTYARD.x0, -COURTYARD.y]).offset(by, 'Round', 2, 64).extrude(z1 - z0).translate([0, 0, z0])

    const inner = {x0: BOARD.x0 - RIM.gap, x1: BOARD.x1 + RIM.gap, y: BOARD.y1 + RIM.gap}
    const outer = {x0: inner.x0 - RIM.wall, x1: inner.x1 + RIM.wall, y: inner.y + RIM.wall}
    const holdTop = LEDGE + CLAMP                // the hooks' tops
    const parts = []

    // the rim: a wall round the board, from the board's bottom up to the cover. On the short sides the arms are
    // the wall: there it is open from the board's top to `SLOT` over the arm (they bend in, over the board), and up
    // to the cover over the lever's end of the arm (the lever comes up there, and bends in with it)
    const coverZ0 = CASE_TOP - COVER.t
    const rim = box(outer.x0, outer.x1, -outer.y, outer.y, RIM.z0, coverZ0 + 0.01)
        .subtract(box(inner.x0, inner.x1, -inner.y, inner.y, RIM.z0 - 1, coverZ0 + 1))
    // an arm's side, in x: [the rim's inside, its outside], and which way is out
    const sides = [{out: -1, x0: outer.x0, x1: inner.x0}, {out: 1, x0: inner.x1, x1: outer.x1}]
    const openings = sides.flatMap(({x0, x1}) => [
        box(x0 - 0.1, x1 + 0.1, ARM.free - SLOT, ARM.root - ARM.post, 0, holdTop + SLOT),
        box(x0 - 0.1, x1 + 0.1, ARM.free - SLOT, ARM.free + LEVER.length + SLOT, 0, coverZ0 + 1)])
    parts.push(rim.subtract(Manifold.union(openings)))

    // the feet, each a column up to the cover, and the corners that join them to the rim (outside the stick,
    // toward the board's corner)
    for (const [x, y] of HOLES) {
        parts.push(disc(FOOT.d, x, y, 0, coverZ0 + 0.01))
        const cx = x < 0 ? outer.x0 : outer.x1, cy = y < 0 ? -outer.y : outer.y
        parts.push(box(Math.min(x, cx), Math.max(x, cx), Math.min(y, cy), Math.max(y, cy), 0, RIM.z1))
    }

    // the hook arms: a post at the root (rim to the arm's top), the arm, the hook at the free end, its lever (the
    // hooks and the levers in tabs: they reach out of the rim)
    const tabs = []
    for (const {out, x0, x1} of sides) {
        parts.push(box(x0, x1, ARM.root - ARM.post, ARM.root, RIM.z0, holdTop))
        parts.push(box(x0, x1, ARM.free, ARM.root, ARM.z0, holdTop))
        // the hook: its section in x-z, swept along y; flat on top, a ramp underneath
        const face = out > 0 ? x1 : x0, reach = out * HOOK.reach
        const z1 = holdTop, zFlat = z1 - HOOK.flat, z0 = zFlat - HOOK.ramp
        const hy0 = ARM.free, hy1 = ARM.free + HOOK.length
        const corners = [[face, z0], [face, z1], [face + reach, z1], [face + reach, zFlat]]
        tabs.push(Manifold.hull(corners.flatMap(([x, z]) => [[x, -hy0, z], [x, -hy1, z]])))
        // the lever, thicker than the arm on its inside (over the board's edge, above it): a finger tab, round on
        // top, with ribs on its outer face above the case's top
        const lx0 = out > 0 ? x1 - LEVER.t : x0, lx1 = out > 0 ? x1 : x0 + LEVER.t
        const r = LEVER.t / 2, top = CASE_TOP + LEVER.over
        tabs.push(box(lx0, lx1, ARM.free, ARM.free + LEVER.length, ARM.z0, top - r))
        tabs.push(Manifold.cylinder(LEVER.length, r, r, SEGMENTS).rotate([90, 0, 0]).translate([(lx0 + lx1) / 2, -ARM.free, top - r]))
        for (let k = 0; k < GRIP.ribs; k++) {
            const z = CASE_TOP + 0.15 + GRIP.pitch * k
            if (z + GRIP.rib > top - r) throw new Error('a lever rib reaches its round top: fewer ribs, or a taller lever')
            tabs.push(box(out > 0 ? x1 : x0 - GRIP.depth, out > 0 ? x1 + GRIP.depth : x0, ARM.free, ARM.free + LEVER.length, z, z + GRIP.rib))
        }
    }

    // the cover: the top layer's opening less a little, round at the corners as it is, its top edge chamfered;
    // less the cap's hole with a chamfer round its top, the levers' slots and the screws' countersinks. On posts at
    // the rim's corners and the arms' roots, and on the corner columns
    const coverOut = COURTYARD.grown - COVER.clear
    let cover = Manifold.hull([rounded(coverOut, coverZ0, CASE_TOP - COVER.edge), rounded(coverOut - COVER.edge, CASE_TOP - COVER.edge, CASE_TOP)])
        .subtract(Manifold.cylinder(COVER.t + 2, COVER.hole, COVER.hole, 128).translate([0, 0, coverZ0 - 1]))
        .subtract(Manifold.cylinder(COVER.dish + 0.01, COVER.hole, COVER.hole + COVER.dish + 0.01, 128).translate([0, 0, CASE_TOP - COVER.dish]))
    for (const {out, x0, x1} of sides) {
        const sx0 = out > 0 ? x1 - LEVER.t - LEVER_ROOM.squeeze : x0 - LEVER_ROOM.around
        const sx1 = out > 0 ? x1 + LEVER_ROOM.around : x0 + LEVER.t + LEVER_ROOM.squeeze
        cover = cover.subtract(box(sx0, sx1, ARM.free - LEVER_ROOM.around, ARM.free + LEVER.length + LEVER_ROOM.around, coverZ0 - 1, CASE_TOP + 1))
        parts.push(box(x0, x1, ARM.root - ARM.post, ARM.root, holdTop - 0.01, coverZ0 + 0.01))
    }
    for (const x of [outer.x0, outer.x1 - COVER.post]) for (const y of [-outer.y, outer.y - COVER.post])
        parts.push(box(x, x + COVER.post, y, y + COVER.post, RIM.z0, coverZ0 + 0.01))
    // all but the cover, the hooks and the levers stays inside the rim, round at its corners like the opening
    const inside = Manifold.union(parts).intersect(rounded(COURTYARD.grown - (OPENING.y - outer.y), RIM.z0 - 1, coverZ0 + 0.02))
    // the screws: clearance down the columns and the feet, a 90 degree countersink in the cover
    const sink = SCREW.head / 2 + 0.1
    const screwHoles = Manifold.union(HOLES.flatMap(([x, y]) => [disc(SCREW.clear, x, y, -1, CASE_TOP + 1),
        Manifold.cylinder(sink - SCREW.clear / 2 + 0.01, SCREW.clear / 2, sink + 0.01, SEGMENTS).translate([x, -y, CASE_TOP - (sink - SCREW.clear / 2)])]))
    const frame = Manifold.union([inside, cover, ...tabs]).subtract(screwHoles)

    // a spacer, its bottom at z = 0: the spigot into the keyboard board's hole, the body under the module board,
    // the insert's hole in its top
    const reach = SCREW.length - CASE_TOP - BOARD.t       // the screw's reach into the insert
    if (reach > INSERT.length) throw new Error(`a ${SCREW.length} mm screw goes ${(reach - INSERT.length).toFixed(1)} mm past the insert`)
    if (INSERT.length + INSERT.extra > SPACER_H - 0.4) throw new Error('the insert is too long for the spacer')
    const spigot = Manifold.cylinder(SPACER.spigotH, SPACER.spigot / 2, SPACER.spigot / 2, SEGMENTS).translate([0, 0, -SPACER.spigotH])
    const lead = Manifold.cylinder(SPACER.chamfer, SPACER.spigot / 2 - SPACER.chamfer, SPACER.spigot / 2, SEGMENTS).translate([0, 0, -SPACER.spigotH - SPACER.chamfer])
    const spacer = Manifold.union([Manifold.cylinder(SPACER_H, SPACER.d / 2, SPACER.d / 2, SEGMENTS), spigot.translate([0, 0, SPACER.chamfer]), lead.translate([0, 0, SPACER.chamfer])])
        .subtract(Manifold.cylinder(INSERT.length + INSERT.extra + 0.01, INSERT.hole / 2, INSERT.hole / 2, SEGMENTS)
            .translate([0, 0, SPACER_H - INSERT.length - INSERT.extra]))
    // in place: under the board's holes, from the keyboard board's top (z = -BOARD.t - SPACER_H)
    const floor = -BOARD.t - SPACER_H
    const placed = ([x, y]) => spacer.translate([x, -y, floor])
    // the base: the spacers and the post on the plate
    const plate = CrossSection.square([BOARD.x1 - BOARD.x0 - 2 * PLATE.inset - 2 * PLATE.r, 2 * (BOARD.y1 - PLATE.inset - PLATE.r)])
        .translate([BOARD.x0 + PLATE.inset + PLATE.r, -(BOARD.y1 - PLATE.inset - PLATE.r)]).offset(PLATE.r, 'Round', 2, 64)
        .extrude(PLATE.t).translate([0, 0, floor])
        .subtract(box(PLATE.pads.x0, PLATE.pads.x1, -PLATE.pads.y, PLATE.pads.y, floor - 1, floor + PLATE.t + 1))
    const post = Manifold.cylinder(SPACER_H - POST.gap, POST.d / 2, POST.d / 2, SEGMENTS).translate([0, 0, floor])
    const base = Manifold.union([...HOLES.map(placed), post, plate])

    fs.writeFileSync(OUT, stl(frame, 'ErgoCai joystick retainer (manifold-3d)'))
    fs.writeFileSync(BASE_OUT, stl(base.translate([0, 0, -floor + SPACER.spigotH]), 'ErgoCai joystick retainer base (manifold-3d)'))
    if (GLB) {
        fs.writeFileSync(GLB, glb([{name: 'retainer', solid: frame, rgb: [0.93, 0.93, 0.95]},
                                   {name: 'base', solid: base, rgb: [0.3, 0.55, 0.9]}]))
        console.log(`${GLB}: the frame and the base in place`)
    }
    if (STEP) {
        fs.writeFileSync(STEP, step([{name: 'retainer', solid: frame, rgb: [0.93, 0.93, 0.95]},
                                     {name: 'base', solid: base, rgb: [0.3, 0.55, 0.9]}], path.basename(STEP, path.extname(STEP))))
        console.log(`${STEP}: the frame and the base in place`)
    }

    // what the hooks and the arms come to: how far each reaches under the ledge, and bends to pass it
    const under = [OPENING.x0 - (outer.x0 - HOOK.reach), outer.x1 + HOOK.reach - OPENING.x1]
    const length = ARM.root - ARM.post - (ARM.free + HOOK.length / 2)        // the root to the hook's middle
    const bend = Math.max(...under) + 0.05                                  // in past the top layer's edge
    const strain = 1.5 * RIM.wall * bend / length ** 2
    const b = frame.boundingBox()
    console.log(`${OUT}: ${(frame.volume() / 1000).toFixed(2)} cm3, ${frame.decompose().length} piece(s), ` +
                `x ${b.min[0].toFixed(2)}..${b.max[0].toFixed(2)} y ${b.min[1].toFixed(2)}..${b.max[1].toFixed(2)} ` +
                `z ${b.min[2].toFixed(2)}..${b.max[2].toFixed(2)}; the hooks ${under.map(u => u.toFixed(2)).join(' and ')} mm ` +
                `under the ledge (far end, pin end), ${CLAMP} mm over it; ` +
                `the arms bend ${bend.toFixed(2)} mm over ${length.toFixed(1)} mm (${(strain * 100).toFixed(2)} %)`)
    console.log(`${BASE_OUT}: ${(base.volume() / 1000).toFixed(2)} cm3, ${base.decompose().length} piece(s), the spacers ${SPACER_H} mm ` +
                `under the board, the post ${POST.gap} mm short of it, the plate ${PLATE.t} mm, open over the contact pads; ` +
                `the board's top at ${BOARD_TOP.toFixed(1)} over the case's bottom; screws M2 x ${SCREW.length} countersunk, ` +
                `${reach.toFixed(1)} mm into M2 x ${INSERT.length} x ${INSERT.hole} inserts`)
}

// binary STL, as ergogen writes its cases
const stl = (solid, header) => {
    const {numProp, vertProperties: v, triVerts: t} = solid.getMesh()
    const count = t.length / 3
    const buffer = new ArrayBuffer(84 + 50 * count)
    const view = new DataView(buffer)
    for (let i = 0; i < header.length; i++) view.setUint8(i, header.charCodeAt(i))
    view.setUint32(80, count, true)
    let at = 84
    for (let i = 0; i < count; i++) {
        const corner = k => [0, 1, 2].map(axis => v[t[3 * i + k] * numProp + axis])
        const [a, b, c] = [corner(0), corner(1), corner(2)]
        const u = [b[0] - a[0], b[1] - a[1], b[2] - a[2]]
        const w = [c[0] - a[0], c[1] - a[1], c[2] - a[2]]
        const n = [u[1] * w[2] - u[2] * w[1], u[2] * w[0] - u[0] * w[2], u[0] * w[1] - u[1] * w[0]]
        const len = Math.hypot(n[0], n[1], n[2]) || 1
        for (const value of [n[0] / len, n[1] / len, n[2] / len, ...a, ...b, ...c]) {
            view.setFloat32(at, value, true)
            at += 4
        }
        view.setUint16(at, 0, true)
        at += 2
    }
    return new Uint8Array(buffer)
}

// glTF binary of solids, a mesh each with its normals, in a colour of its own. glTF is in metres with y up, so
// the model's (x, y, z) in mm is written as (x, z, -y) / 1000.
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
        asset: {version: '2.0', generator: 'ErgoCai retainer.js (manifold-3d)'},
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

// STEP (AP242) of tessellated solids, as trackball/PMW3610-pogo/cup/cup.js writes them: OCCT reads them as faces
// that carry their triangulation, which KiCad's 3D viewer and ergogen-gui's 3D view draw
const step = (parts, title) => {
    const out = []
    let id = 0
    const e = (text) => { out.push(`#${++id}=${text};`); return `#${id}` }
    const num = (v) => (Math.abs(v) < 5e-5 ? 0 : v).toFixed(4).replace(/0+$/, '')
    const app = e(`APPLICATION_CONTEXT('managed model based 3d engineering')`)
    e(`APPLICATION_PROTOCOL_DEFINITION('international standard','ap242_managed_model_based_3d_engineering',2011,${app})`)
    const product = e(`PRODUCT('${title}','${title}','',(${e(`PRODUCT_CONTEXT('',${app},'mechanical')`)}))`)
    const definition = e(`PRODUCT_DEFINITION('design','',${e(`PRODUCT_DEFINITION_FORMATION('','',${product})`)},` +
                         `${e(`PRODUCT_DEFINITION_CONTEXT('part definition',${app},'design')`)})`)
    const shape = e(`PRODUCT_DEFINITION_SHAPE('','',${definition})`)
    const mm = e(`(LENGTH_UNIT()NAMED_UNIT(*)SI_UNIT(.MILLI.,.METRE.))`)
    const rad = e(`(NAMED_UNIT(*)PLANE_ANGLE_UNIT()SI_UNIT($,.RADIAN.))`)
    const sr = e(`(NAMED_UNIT(*)SI_UNIT($,.STERADIAN.)SOLID_ANGLE_UNIT())`)
    const accuracy = e(`UNCERTAINTY_MEASURE_WITH_UNIT(LENGTH_MEASURE(1.E-05),${mm},'distance_accuracy_value','confusion accuracy')`)
    const context = e(`(GEOMETRIC_REPRESENTATION_CONTEXT(3)GLOBAL_UNCERTAINTY_ASSIGNED_CONTEXT((${accuracy}))` +
                      `GLOBAL_UNIT_ASSIGNED_CONTEXT((${mm},${rad},${sr}))REPRESENTATION_CONTEXT('',''))`)
    const solids = [], styled = []
    for (const {name, solid, rgb} of parts) {
        const {numProp, vertProperties: v, triVerts: t} = solid.calculateNormals(0, 30).getMesh()
        const count = v.length / numProp
        const triple = (i, at) => `(${[0, 1, 2].map(k => num(v[i * numProp + at + k])).join(',')})`
        const points = [], normals = []
        for (let i = 0; i < count; i++) {
            points.push(triple(i, 0))
            normals.push(triple(i, 3))
        }
        const triangles = []
        for (let i = 0; i < t.length; i += 3) triangles.push(`(${t[i] + 1},${t[i + 1] + 1},${t[i + 2] + 1})`)
        const coordinates = e(`COORDINATES_LIST('',${count},(${points.join(',')}))`)
        const face = e(`TRIANGULATED_FACE('',${coordinates},${count},(${normals.join(',')}),$,(),(${triangles.join(',')}))`)
        const item = e(`TESSELLATED_SOLID('${name}',(${face}),$)`)
        solids.push(item)
        const fill = e(`FILL_AREA_STYLE('',(${e(`FILL_AREA_STYLE_COLOUR('',${e(`COLOUR_RGB('',${rgb.map(num).join(',')})`)})`)}))`)
        const side = e(`SURFACE_SIDE_STYLE('',(${e(`SURFACE_STYLE_FILL_AREA(${fill})`)}))`)
        styled.push(e(`STYLED_ITEM('',(${e(`PRESENTATION_STYLE_ASSIGNMENT((${e(`SURFACE_STYLE_USAGE(.BOTH.,${side})`)}))`)}),${item})`))
    }
    const representation = e(`TESSELLATED_SHAPE_REPRESENTATION('${title}',(${solids.join(',')}),${context})`)
    e(`SHAPE_DEFINITION_REPRESENTATION(${shape},${representation})`)
    e(`MECHANICAL_DESIGN_GEOMETRIC_PRESENTATION_REPRESENTATION('',(${styled.join(',')}),${context})`)
    return ['ISO-10303-21;', 'HEADER;', `FILE_DESCRIPTION(('${title}'),'2;1');`,
            `FILE_NAME('${title}.step','',(''),(''),'retainer.js','manifold-3d','');`,
            `FILE_SCHEMA(('AP242_MANAGED_MODEL_BASED_3D_ENGINEERING_MIM_LF { 1 0 10303 442 1 1 4 }'));`, 'ENDSEC;',
            'DATA;', ...out, 'ENDSEC;', 'END-ISO-10303-21;', ''].join('\n')
}

main().catch(e => { console.error(e); process.exit(1) })
