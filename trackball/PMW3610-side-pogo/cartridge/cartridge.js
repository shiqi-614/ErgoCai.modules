// The side-read trackball's cartridge (trackball/PMW3610-side-pogo on the pogo mount, joystick/joystick-mount-pogo): a
// printed frame and a printed base, screwed together through the module board's three holes into one cartridge that
// snaps into the case (a case of its own: it opens round the mount's User.1 outline, cut: outline).
//
// - The base: a plate 1 mm thick on the keyboard board, the module board's outline, open over the mount's contact pads
//   (x -12.6..-9.4, |y| < 8); on it a spacer under each of the three holes, 3.8 mm (the pogo pins at 3.8 mm), a spigot
//   under each into the mount's hole, an M2 x 3 x 3.2 insert in each top. It prints upside down, on the spacers' tops.
// - The frame, one print: a rim round the module board's edge, from the board's bottom up to the cover; the ball's seat
//   on the board (a shell round the 20 mm ball, up to 2 mm under its equator, which stands 4 mm over the case's top, so
//   the thumb reaches the ball's side, as on keyball): three 2 mm support balls 30 degrees under the equator (at 0, 135
//   and 225 degrees: clear of the pogo pins at -x, under the lens) that the ball lies on, held by nothing over it;
//   two more level with its centre on each side of the lens (+-40 degrees), in posts roofed over to the hood, which stop
//   the thumb's push toward the sensor; open toward the lens; a slot the sensor board stands in, and a hood over its top, which stands 13.6 mm over the
//   case (in the case's top layer cut to the opening); a cover over it all flush with the case's top; a column on each
//   hole, an M2 x 12 countersunk screw down each into the base's inserts. Two hook arms snap under the case's top
//   layer: at the thumb's end (-x, where the pins push up) and on the +y side (the seat's shell overhangs the board's
//   -y edge, so nothing goes there).
//
// The frame of reference is the module board's (the mount's: the module goes on it as it is): x as the board's x, y as
// its -y (KiCad's y points down), z up, the board's top at z = 0, as KiCad places a footprint's 3D model.
//
// usage: node cartridge.js [--out <frame.stl>] [--base-out <base.stl>] [--glb <file.glb>] [--step <file.step>]
//   manifold-3d (MANIFOLD=<a node_modules folder that has it>); ERGOCAI_LIB for the mount's footprint
const fs = require('fs')
const path = require('path')
const {pathToFileURL} = require('url')
const arg = (name, value) => { const i = process.argv.indexOf(`--${name}`); return i > 0 ? process.argv[i + 1] : value }
const OUT = arg('out', path.join(__dirname, 'frame.stl'))
const BASE_OUT = arg('base-out', path.join(__dirname, 'base.stl'))
const GLB = arg('glb', ''), STEP = arg('step', '')

// the boards (PMW3610-side-pogo, its sensor/): the module board's outline (KiCad's), its holes, the ball's hole and
// axis, the notch the sensor board's tab goes down into; the sensor board's place
const OUTLINE = [[-14.5, -13], [16.55, -13], [16.55, 5.0], [18.55, 5.0], [18.55, -13], [22, -13], [22, -4.5], [27, -4.5],
                 [27, 4.5], [21, 4.5], [21, 7], [18.5, 13], [-14.5, 13]]
const BOARD_T = 1.6
const HOLES = [[-12.35, -10.85], [-12.35, 10.85], [24.5, 0]]
const PADS = {x0: -12.6, x1: -9.4, y: 8.0}           // the mount's contact pads, and the pins' solder on the board's top
const AXIS = {x: 0, y: -1.5, z: 11.6}                 // the ball's centre (KiCad y): its equator 4 mm over the case's top
const BALL = 20, SUPPORT = 2, CLEAR = SUPPORT / 2      // the support balls stand out of the wall by half
const SENSOR = {x0: 16.75, x1: 18.35, y: 13.0, top: 20.0, lens: {x0: 12.4, y0: -13.0, y1: 4.96, z0: 6.9, z1: 16.3},
                body: {x1: 21.45, y0: -12.59, y1: 3.61, z0: 7.05, z1: 16.15}}
// the case (ErgoCai.ts): the keyboard board's top over the case's bottom, the spacers, the top layer 18..21
const KEYBOARD_TOP = 8.0, SPACER_H = 3.8
const BOARD_TOP = KEYBOARD_TOP + SPACER_H + BOARD_T    // 13.4
const LEDGE = 18.0 - BOARD_TOP, CASE_TOP = 21.0 - BOARD_TOP, CLAMP = 0.1
// the mount's outline (ErgoCaiLib Pogo_ModuleMount_1x6_P2.54mm, User.1: the side-read module's), which the case opens
// round grown by 1.5; as points in the model's frame (y up)
const MOUNT = path.join(process.env.ERGOCAI_LIB || path.join(__dirname, '..', '..', '..', '..', 'ErgoCaiLib'),
                        'footprints', 'ErgoCai.pretty', 'Pogo_ModuleMount_1x6_P2.54mm.kicad_mod')
const OPENING = (() => {
    const poly = fs.readFileSync(MOUNT, 'utf8').split('(fp_poly').find(c => /\(layer "User\.1"\)/.test(c.split('(fp_')[0]))
    if (!poly) throw new Error(`${MOUNT}: no User.1 polygon, the side-read module's outline`)
    return [...poly.matchAll(/\(xy (-?[\d.]+) (-?[\d.]+)\)/g)].map(([, x, y]) => [Number(x), -Number(y)])
})()
const GROWN = 1.5
const RIM = {gap: 0.15, wall: 1.0, z0: -BOARD_T}
const COVER = {t: 1.2, clear: 0.3, edge: 0.4}
const SHELL = 1.5                                      // the seat's wall over the cavity
const TILT = 30, AZIMUTHS = [0, 135, 225]              // the support balls: under the equator, round the axis
const SEAT = SUPPORT - 0.05                            // their holes, a press fit
const RIM_UNDER = 2.0                                  // the seat's rim under the ball's equator: its side free for the thumb
const WINDOW = {az0: -48, az1: 33, el: 24}             // the shell open toward the lens (degrees)
// the stops: a 2 mm ball on each side of the lens, level with the ball's centre, in a post, that take the thumb's push
// toward the sensor (the ball is free over the equator on the other sides); over the lens's window a roof from the
// posts' tops to the hood, as wide as it, walled down to the case's top at its sides, which keeps light and dust off
// the lens and the header, open round the ball's axis wide enough for the ball to lift out
const STOP = {azimuths: [40, -40], d: 3.4, top: 18.6, roof: 1.4, open: 10.5}
const SLOT = {gap: 0.2}                                // round the sensor board in the frame
const HOOD = {wall: 1.2, over: 1.0}                    // over the sensor board's top, round its back
const FOOT = {d: 4.0}
const SCREW = {length: 12, clear: 2.3, head: 3.8}
const SPACER = {d: 5.2, spigot: 2.15, spigotH: 1.2, chamfer: 0.2}
const INSERT = {length: 3.0, hole: 3.2, extra: 0.2}
const PLATE = {t: 1.0, inset: 0.3}
// the hook arms: the thumb's end (-x, along y) and the +y side (along x): from the root to the free end, the arm's
// height and root post; the hook; the lever at the free end
const ARMS = [{side: '-x', root: 8.0, free: -8.0}, {side: '+y', root: -8.0, free: 6.0}]
const ARM = {z0: 0.4, post: 1.5}, HOOK = {length: 4.0, reach: 1.0, ramp: 0.7, flat: 0.5}
const LEVER = {length: 4.0, t: 1.5, over: 1.5}, GAP = 0.5, BEND = 1.2
const SEGMENTS = 64

const main = async () => {
    const where = process.env.MANIFOLD || path.join(__dirname, 'node_modules')
    const entry = [path.join(where, 'manifold-3d', 'manifold.js'), path.join(where, 'node_modules', 'manifold-3d', 'manifold.js')].find(p => fs.existsSync(p))
    if (!entry) throw new Error(`no manifold-3d in ${where}: set MANIFOLD`)
    const wasm = await (await import(pathToFileURL(entry).href)).default(); wasm.setup()
    const {Manifold, CrossSection} = wasm
    const box = (x0, x1, y0, y1, z0, z1) => Manifold.cube([x1 - x0, y1 - y0, z1 - z0]).translate([x0, -y1, z0])   // KiCad y
    const disc = (d, x, y, z0, z1) => Manifold.cylinder(z1 - z0, d / 2, d / 2, 48).translate([x, -y, z0])
    const ccw = pts => pts.reduce((s, [x, y], i) => { const [u, v] = pts[(i + 1) % pts.length]; return s + x * v - u * y }, 0) > 0 ? pts : [...pts].reverse()
    const opening = new CrossSection([ccw(OPENING)])
    const board = new CrossSection([ccw(OUTLINE.map(([x, y]) => [x, -y]))])
    const grown = (cs, by, z0, z1) => cs.offset(by, 'Round', 2, 64).extrude(z1 - z0).translate([0, 0, z0])
    const R = BALL / 2, C = [AXIS.x, -AXIS.y, AXIS.z]
    const holdTop = LEDGE + CLAMP, coverZ0 = CASE_TOP - COVER.t
    const parts = [], cuts = [], tabs = []

    // the rim round the board, the board's bottom to the cover; the cover over the opening, its edge in steps
    parts.push(grown(board, RIM.gap + RIM.wall, RIM.z0, coverZ0 + 0.01).subtract(grown(board, RIM.gap, RIM.z0 - 1, coverZ0 + 1)))
    const coverOut = GROWN - COVER.clear, steps = 4
    parts.push(grown(opening, coverOut, coverZ0, CASE_TOP - COVER.edge))
    for (let k = 0; k < steps; k++)
        parts.push(grown(opening, coverOut - COVER.edge * (k + 1) / steps, CASE_TOP - COVER.edge + COVER.edge * k / steps - 0.001, CASE_TOP - COVER.edge + COVER.edge * (k + 1) / steps))
    // the columns on the holes, the board's top to the cover
    for (const [x, y] of HOLES) parts.push(disc(FOOT.d, x, y, 0, coverZ0 + 0.01))
    // the seat: a shell round the ball on the board (its cavity cut below), up to RIM_UNDER under the equator; the ball
    // lies in it on the support balls, held by nothing over it (as keyball's): it lifts out
    const outer = R + CLEAR + SHELL
    const top = AXIS.z - RIM_UNDER
    parts.push(Manifold.sphere(outer, SEGMENTS * 2).translate(C).intersect(Manifold.cube([60, 60, top]).translate([-30 + C[0], -30 + C[1], 0])))
    // the hood over the sensor board: round its back and over its top, open toward the ball (the lens looks out)
    const hy = SENSOR.y + SLOT.gap + HOOD.wall
    const hood = box(SENSOR.x0 - SLOT.gap - HOOD.wall, SENSOR.body.x1 + SLOT.gap + HOOD.wall, -hy, hy, coverZ0, SENSOR.top + SLOT.gap + HOOD.over)
    // in the case's top layer no wider than the cover, so it goes through the opening (thinner at the +y corner, which
    // the outline cuts back); over the case's top all of it
    const hoodIn = grown(opening, coverOut, coverZ0 - 1, CASE_TOP)
    parts.push(hood.intersect(hoodIn), hood.intersect(box(-50, 50, -50, 50, CASE_TOP - 0.001, CASE_TOP + 50)))
    // the cavity, the support balls' seats, the window toward the lens
    cuts.push(Manifold.sphere(R + CLEAR, SEGMENTS * 2).translate(C))
    // each support ball's seat: a hole along the line to the ball's centre, from inside the cavity out to where the
    // support ball, touching the ball, has its far side (as cup.js; OFF degrees off the ball's bottom)
    const OFF = 90 - TILT
    for (const a of AZIMUTHS) {
        const start = R - 0.5, reach = R + SUPPORT
        cuts.push(Manifold.cylinder(reach - start, SEAT / 2, SEAT / 2, 32).rotate([0, 180 - OFF, 0])
            .translate([start * Math.sin(OFF * Math.PI / 180), 0, -start * Math.cos(OFF * Math.PI / 180)]).rotate([0, 0, a]).translate(C))
    }
    // the window toward the lens: the lens's box, a little round it, out from the cavity
    const L = SENSOR.lens
    cuts.push(box(AXIS.x + R - 1, SENSOR.x0 + 0.01, L.y0 - 0.5, L.y1 + 0.5, L.z0 - 0.8, L.z1 + 0.8))
    // the sensor board's slot (its tab too, down the board's notch), its parts and header room behind and in front
    cuts.push(box(SENSOR.x0 - SLOT.gap, SENSOR.x1 + SLOT.gap, -SENSOR.y - SLOT.gap, SENSOR.y + SLOT.gap, RIM.z0 - 1, SENSOR.top + SLOT.gap))
    const B = SENSOR.body
    cuts.push(box(SENSOR.x1, B.x1 + SLOT.gap, -SENSOR.y - SLOT.gap, SENSOR.y + SLOT.gap, 0, SENSOR.top + SLOT.gap))          // its back, the sensor and parts
    cuts.push(box(SENSOR.x0 - 4.5, SENSOR.x0, 5.0, SENSOR.y + SLOT.gap, -0.01, 6.5))                                     // the header, in front
    // the pins' solder on the board's top, the screws' clearance and countersinks
    cuts.push(box(PADS.x0, PADS.x1, -PADS.y, PADS.y, -0.1, 1.0))
    const sink = SCREW.head / 2 + 0.1
    for (const [x, y] of HOLES) {
        cuts.push(disc(SCREW.clear, x, y, -1, CASE_TOP + 1))
        cuts.push(Manifold.cylinder(sink - SCREW.clear / 2 + 0.01, SCREW.clear / 2, sink + 0.01, 48).translate([x, -y, CASE_TOP - (sink - SCREW.clear / 2)]))
    }
    // the hook arms, the rim open over them; rooms for them to bend in
    const inner = 0                                         // (the rim's inside is the board's outline grown by RIM.gap)
    for (const A of ARMS) {
        const alongY = A.side === '-x'
        const lo = Math.min(A.root, A.free), hi = Math.max(A.root, A.free)
        const face = alongY ? OUTLINE.reduce((m, [x]) => Math.min(m, x), 0) - RIM.gap - RIM.wall : 13 + RIM.gap + RIM.wall
        const wallIn = alongY ? face + RIM.wall : face - RIM.wall
        const out = alongY ? -1 : 1
        // in KiCad coords: -x side: x from face to wallIn, y from lo..hi; +y side: y from wallIn..face, x lo..hi
        const span = (a0, a1, z0, z1, d0 = 0, d1 = 0) => alongY ? box(Math.min(face, wallIn) - d0, Math.max(face, wallIn) + d1, a0, a1, z0, z1)
                                                                : box(a0, a1, Math.min(face, wallIn) - d0, Math.max(face, wallIn) + d1, z0, z1)
        const freeEnd = A.free, rootEnd = A.root, dirn = Math.sign(A.free - A.root)
        cuts.push(span(Math.min(rootEnd + dirn * ARM.post, freeEnd + dirn * GAP), Math.max(rootEnd + dirn * ARM.post, freeEnd + dirn * GAP), 0, holdTop + GAP, 0.1, 0.1))
        cuts.push(span(Math.min(freeEnd - dirn * LEVER.length, freeEnd + dirn * GAP), Math.max(freeEnd - dirn * LEVER.length, freeEnd + dirn * GAP), 0, coverZ0 + 1, 0.1, 0.1))
        tabs.push({A, alongY, face, wallIn, out, dirn, span})
    }
    let frame = Manifold.union(parts).subtract(Manifold.union(cuts))
    // the stops (after the window's cut, which they stand in): the posts on the board, carved by the ball's cavity, each
    // ball's hole along the line to the ball's centre, from inside the cavity
    const hoodFront = SENSOR.x0 - SLOT.gap - HOOD.wall
    const stops = [], stopHoles = []
    for (const a of STOP.azimuths) {
        const c = Math.cos(a * Math.PI / 180), s = Math.sin(a * Math.PI / 180), rp = R + CLEAR + STOP.d / 2 - 0.3
        const [px, py] = [C[0] + rp * c, C[1] + rp * s]
        stops.push(Manifold.cylinder(STOP.top, STOP.d / 2, STOP.d / 2, 32).translate([px, py, 0]))
        const start = R - 0.5, reach = R + SUPPORT
        stopHoles.push(Manifold.cylinder(reach - start, SEAT / 2, SEAT / 2, 32).rotate([0, 90, 0]).translate([start, 0, 0]).rotate([0, 0, a]).translate(C))
    }
    stops.push(box(AXIS.x, hoodFront + 0.5, -hy, hy, STOP.top - STOP.roof, STOP.top)
        .subtract(Manifold.cylinder(STOP.top + 1, STOP.open, STOP.open, 96).translate([C[0], C[1], 0])))
    // and a wall down each side of it to the case's top, so no light comes in from the sides either
    for (const [y0, y1] of [[-hy, -hy + HOOD.wall], [hy - HOOD.wall, hy]])
        stops.push(box(AXIS.x, hoodFront + 0.5, y0, y1, CASE_TOP - 0.001, STOP.top))
    frame = frame.add(Manifold.union(stops).subtract(Manifold.sphere(R + CLEAR, SEGMENTS * 2).translate(C)).subtract(Manifold.union(stopHoles)))
    const pieces = []
    for (const {A, alongY, face, wallIn, out, dirn, span} of tabs) {
        const lo = Math.min(A.root, A.free), hi = Math.max(A.root, A.free)
        pieces.push(span(Math.min(A.root, A.root + dirn * ARM.post), Math.max(A.root, A.root + dirn * ARM.post), RIM.z0, coverZ0 + 0.01))   // root post
        pieces.push(span(lo, hi, ARM.z0, holdTop))                                                                                      // the arm
        // the hook: its section across the arm, swept along it; the lever at the free end, up through the cover
        const h0 = Math.min(A.free, A.free - dirn * HOOK.length), h1 = Math.max(A.free, A.free - dirn * HOOK.length)
        const zf = holdTop - HOOK.flat, z0 = zf - HOOK.ramp
        const across = [[face, z0], [face, holdTop], [face + out * HOOK.reach, holdTop], [face + out * HOOK.reach, zf]]
        pieces.push(Manifold.hull(across.flatMap(([c, z]) => alongY ? [[c, -h0, z], [c, -h1, z]] : [[h0, -c, z], [h1, -c, z]])))
        const l0 = Math.min(A.free, A.free - dirn * LEVER.length), l1 = Math.max(A.free, A.free - dirn * LEVER.length)
        const t0 = out > 0 ? face - LEVER.t : face, t1 = out > 0 ? face : face + LEVER.t
        pieces.push(alongY ? box(Math.min(t0, t1), Math.max(t0, t1), l0, l1, ARM.z0, CASE_TOP + LEVER.over)
                           : box(l0, l1, Math.min(t0, t1), Math.max(t0, t1), ARM.z0, CASE_TOP + LEVER.over))
        // its room in the cover, and the seat's and the frame's clear of the arm bending in
        const room = alongY ? box(Math.min(face, wallIn) - 0.5, Math.max(face, wallIn) + LEVER.t + BEND, l0 - 0.4, l1 + 0.4, coverZ0 - 1, CASE_TOP + 1)
                            : box(l0 - 0.4, l1 + 0.4, Math.min(face, wallIn) - LEVER.t - BEND, Math.max(face, wallIn) + 0.5, coverZ0 - 1, CASE_TOP + 1)
        frame = frame.subtract(room)
        const bend = alongY ? box(wallIn, wallIn + BEND, lo - GAP, hi + GAP, -0.1, holdTop + GAP)
                            : box(lo - GAP, hi + GAP, wallIn - BEND, wallIn, -0.1, holdTop + GAP)
        frame = frame.subtract(bend)
    }
    frame = Manifold.union([frame, ...pieces])
    // what the frame must keep clear of, checked: the ball (and 0.3 round it), the sensor board, its lens and its body,
    // the header in front of it (body and pins), the pogo pins' solder
    const keepClear = {
        ball: Manifold.sphere(R + 0.3, 96).translate(C),
        'sensor board': box(SENSOR.x0, SENSOR.x1, -SENSOR.y, SENSOR.y, -BOARD_T, SENSOR.top),
        lens: box(SENSOR.lens.x0, SENSOR.x0, SENSOR.lens.y0, SENSOR.lens.y1, SENSOR.lens.z0, SENSOR.lens.z1),
        'sensor body': box(SENSOR.x1, SENSOR.body.x1, SENSOR.body.y0, SENSOR.body.y1, SENSOR.body.z0, SENSOR.body.z1),
        header: box(SENSOR.x0 - 3.81 - 0.8, SENSOR.x0, 5.3, 13.0, -0.01, 6.0),
        'pins solder': box(PADS.x0, PADS.x1, -PADS.y, PADS.y, 0, 0.8),
        // what the sensor sees of the ball and the light to it: the lens's face to the ball, 3 mm round its axis
        'optical path': box(AXIS.x + R - 1, SENSOR.lens.x0, AXIS.y - 3, AXIS.y + 3, AXIS.z - 3, AXIS.z + 3).subtract(Manifold.sphere(R, 72).translate(C)),
    }
    for (const [name, solid] of Object.entries(keepClear)) {
        const v = frame.intersect(solid).volume()
        if (v > 0.01) console.log(`  the frame meets the ${name}: ${v.toFixed(2)} mm3`)
    }
    // the base: the plate on the keyboard board (open over the pads), the spacers with spigots and inserts
    const floor = -BOARD_T - SPACER_H
    let base = grown(board, -PLATE.inset, floor, floor + PLATE.t).subtract(box(PADS.x0, PADS.x1, -PADS.y, PADS.y, floor - 1, floor + PLATE.t + 1))
    for (const [x, y] of HOLES) {
        base = base.add(disc(SPACER.d, x, y, floor, floor + SPACER_H))
            .add(disc(SPACER.spigot, x, y, floor - SPACER.spigotH, floor + 0.01))
            .add(Manifold.cylinder(SPACER.chamfer, SPACER.spigot / 2 - SPACER.chamfer, SPACER.spigot / 2, 48).translate([x, -y, floor - SPACER.spigotH - SPACER.chamfer]))
            .subtract(disc(INSERT.hole, x, y, floor + SPACER_H - INSERT.length - INSERT.extra, floor + SPACER_H + 0.01))
    }
    const reach = SCREW.length - CASE_TOP - BOARD_T
    if (reach > INSERT.length) throw new Error(`the screws reach ${(reach - INSERT.length).toFixed(1)} mm past their inserts`)
    const ballSolid = Manifold.sphere(R, 72).translate(C)
    // the small balls: the supports under the equator, the stops level with the ball's centre
    const d = R + SUPPORT / 2, t = TILT * Math.PI / 180
    const supports = AZIMUTHS.map(a => [C[0] + d * Math.cos(t) * Math.cos(a * Math.PI / 180), C[1] + d * Math.cos(t) * Math.sin(a * Math.PI / 180), C[2] - d * Math.sin(t)])
        .concat(STOP.azimuths.map(a => [C[0] + d * Math.cos(a * Math.PI / 180), C[1] + d * Math.sin(a * Math.PI / 180), C[2]]))
    fs.writeFileSync(OUT, stl(frame, 'ErgoCai side-read trackball frame (manifold-3d)'))
    fs.writeFileSync(BASE_OUT, stl(base.translate([0, 0, -floor + SPACER.spigotH]), 'ErgoCai side-read trackball base (manifold-3d)'))
    const models = [{name: 'frame', solid: frame, rgb: [0.93, 0.93, 0.95]}, {name: 'base', solid: base, rgb: [0.3, 0.55, 0.9]},
                    {name: 'ball', solid: ballSolid, rgb: [0.78, 0.1, 0.1]},
                    ...supports.map((s, i) => ({name: `ball ${i + 1}`, solid: Manifold.sphere(SUPPORT / 2, 20).translate(s), rgb: [0.55, 0.56, 0.6]}))]
    if (GLB) fs.writeFileSync(GLB, glb(models))
    if (STEP) fs.writeFileSync(STEP, step(models, path.basename(STEP, path.extname(STEP))))
    const bb = frame.boundingBox()
    console.log(`${OUT}: ${(frame.volume() / 1000).toFixed(2)} cm3, ${frame.decompose().length} piece(s), x ${bb.min[0].toFixed(2)}..${bb.max[0].toFixed(2)} ` +
                `y ${bb.min[1].toFixed(2)}..${bb.max[1].toFixed(2)} z ${bb.min[2].toFixed(2)}..${bb.max[2].toFixed(2)}; ball top ${(AXIS.z + R).toFixed(1)} over the board ` +
                `(${(AXIS.z + R + BOARD_TOP).toFixed(1)} over the case's bottom); screws ${reach.toFixed(1)} mm into the inserts`)
    console.log(`${BASE_OUT}: ${(base.volume() / 1000).toFixed(2)} cm3, ${base.decompose().length} piece(s)`)
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
