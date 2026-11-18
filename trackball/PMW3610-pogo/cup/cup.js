// The ball cup of the trackball module (trackball/PMW3610-pogo): printed, it stands on the module board's front,
// holds the ball over the sensor's lens on three small support balls, and goes down with the module: four M2 screws
// through the cup, the board's holes H1..H4 and into the mount's standoffs (Ps4JoystickMount_Pogo, 4 mm).
// Writes a binary STL in mm: z up, the board's top at z = 0, the ball's axis (the sensor's optical centre) at
// x = y = 0, x as the board's x and y as the board's -y (KiCad's y points down).
//
// usage: node cup.js [--lens <mm>] [--ball <mm>] [--support <mm>] [--out <file.stl>]
//   manifold-3d (npm install in this folder; or MANIFOLD=<a node_modules folder that has it>)
//
// What the numbers rest on:
// - the ball's surface is 2.4 mm (2.2 to 2.6) from the lens's reference plane, its face toward the ball
//   (PMW3610DM-SUDU datasheet, table 2);
// - lens: that plane's height over the board's top. The LM18-LSI lens drawing is not at hand, so 3.4 is a guess:
//   measure it on the assembled board (a caliper from the board's top to the lens's top face) and build the cup
//   for that height. Every height below follows from it;
// - ball: 25 mm. The cup's wall has to take the four screws, 15.3 and 16.4 mm off the axis, so a bigger ball
//   does not fit between them;
// - support: three balls of 2.5 mm (ceramic, Si3N4 or ZrO2, or steel), pressed into their seats from inside the
//   cup, 50 degrees off the bottom, one opposite the lens's long side and two at 120 degrees from it;
// - the pocket in the floor clears the lens, the sensor's leads (trim them to 1.5 mm) and their solder; the pogo
//   pins' tails stay under solder mask, flat, so the floor sits on them;
// - screws: M2, from the rim through 18 to 21 mm of cup and board into the standoff, the heads on the rim.
const fs = require('fs')
const path = require('path')
const {pathToFileURL} = require('url')

const arg = (name, value) => {
    const i = process.argv.indexOf(`--${name}`)
    return i > 0 ? process.argv[i + 1] : value
}
const LENS = Number(arg('lens', 3.4))           // lens reference plane over the board's top
const BALL = Number(arg('ball', 25))
const SUPPORT = Number(arg('support', 2.5))      // support balls
const OUT = arg('out', path.join(__dirname, 'cup.stl'))

const Z_GAP = 2.4                                // reference plane to the ball's surface
const CLEAR = 0.6                                // between the ball and the cup
const SEAT = SUPPORT - 0.05                      // a support ball's hole: a press fit (enlarge for a loose printer)
const TILT = 50                                  // support balls, degrees off the ball's bottom
const AZIMUTHS = [90, 210, 330]                  // and round the axis (90: +y, away from the lens's long side)
const OUTER = 18.6                               // the cup's outside: the screw heads (3.8 mm) at 16.4 mm on it
const ABOVE = 0.5                                // the rim, over the ball's equator
const HOLES = [[-10.85, 10.85], [12.35, 10.85], [-10.85, -10.85], [12.35, -10.85]]
const SCREW = 2.4                                // M2 clearance
// the pocket: the lens (the board's x -4.7..4.7, y -6.46..11.5 in KiCad's frame, the sensor turned 90) and the leads
// (x +-5.35), 1 mm round them
const POCKET = {x0: -6.4, x1: 6.4, y0: -7.5, y1: 12.5}

const R = BALL / 2
const BOTTOM = LENS + Z_GAP                      // the ball's lowest point
const CENTRE = BOTTOM + R
const TOP = CENTRE + ABOVE
const SEGMENTS = 128

const main = async () => {
    // the package exports ES modules only, so it is found by hand and imported by its file
    const where = process.env.MANIFOLD || path.join(__dirname, 'node_modules')
    const entry = [path.join(where, 'manifold-3d', 'manifold.js'), path.join(where, 'node_modules', 'manifold-3d', 'manifold.js')]
        .find(f => fs.existsSync(f))
    if (!entry) throw new Error(`no manifold-3d in ${where}: npm install in ${__dirname}, or MANIFOLD=<node_modules>`)
    const wasm = await (await import(pathToFileURL(entry).href)).default()
    wasm.setup()
    const {Manifold} = wasm

    let cup = Manifold.cylinder(TOP, OUTER, OUTER, SEGMENTS)
    const cut = []
    cut.push(Manifold.sphere(R + CLEAR, SEGMENTS).translate([0, 0, CENTRE]))
    cut.push(Manifold.cube([POCKET.x1 - POCKET.x0, POCKET.y1 - POCKET.y0, BOTTOM + 0.01])
        .translate([POCKET.x0, -POCKET.y1, -0.01]))       // KiCad's y range, flipped
    for (const [x, y] of HOLES) {
        cut.push(Manifold.cylinder(TOP + 0.2, SCREW / 2, SCREW / 2, 32).translate([x, -y, -0.1]))
    }
    // each support ball's seat: a hole along the line to the ball's centre, from inside the cup down to where the
    // support ball, touching the ball, has its far side
    const reach = R + SUPPORT                           // from the ball's centre to the seat's bottom
    for (const azimuth of AZIMUTHS) {
        const start = R - 0.5
        const seat = Manifold.cylinder(reach - start, SEAT / 2, SEAT / 2, 32)
            .rotate([0, 180 - TILT, 0])                  // +z onto (sin TILT, 0, -cos TILT)
            .translate([start * Math.sin(TILT * Math.PI / 180), 0, -start * Math.cos(TILT * Math.PI / 180)])
            .rotate([0, 0, azimuth])
            .translate([0, 0, CENTRE])
        cut.push(seat)
    }
    for (const c of cut) cup = cup.subtract(c)

    const supports = AZIMUTHS.map(a => {
        const d = R + SUPPORT / 2, t = TILT * Math.PI / 180, p = a * Math.PI / 180
        return [d * Math.sin(t) * Math.cos(p), d * Math.sin(t) * Math.sin(p), CENTRE - d * Math.cos(t)]
    })
    fs.writeFileSync(OUT, stl(cup))
    const box = cup.boundingBox()
    console.log(`${OUT}: ${(cup.volume() / 1000).toFixed(2)} cm3, z ${box.min[2].toFixed(2)}..${box.max[2].toFixed(2)}, ` +
                `ball ${BALL} mm, its bottom ${BOTTOM.toFixed(2)} mm over the board (lens ${LENS} + ${Z_GAP}), ` +
                `centre ${CENTRE.toFixed(2)}; support balls at ` + supports.map(s => `(${s.map(v => v.toFixed(2)).join(', ')})`).join(' '))
}

// binary STL, as ergogen writes its cases
const stl = (solid) => {
    const {numProp, vertProperties: v, triVerts: t} = solid.getMesh()
    const count = t.length / 3
    const buffer = new ArrayBuffer(84 + 50 * count)
    const view = new DataView(buffer)
    const header = 'ErgoCai PMW3610-pogo ball cup (manifold-3d)'
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

main().catch(e => { console.error(e); process.exit(1) })
