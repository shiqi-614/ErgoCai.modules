// The ball cup of the trackball module (trackball/PMW3610-pogo): printed, it snaps onto the module board's front and
// holds the ball over the sensor's lens on three small support balls. It stays inside the case's opening for the
// joystick mount (the mount's courtyard, -13.1..14.6 by -13.1..13.1, grown by 1.5): 28.4 mm round, with a plate over
// the board and its edges. The module is screwed down first (four M2 screws through H1..H4 into the mount's
// standoffs); the cup clears the screw heads and two tabs hook under the board's top and bottom edges, so it comes
// off again to clean the ball, the lens and the support balls.
// Writes a binary STL in mm: z up, the board's top at z = 0, the ball's axis (the sensor's optical centre) at
// x = y = 0, x as the board's x and y as the board's -y (KiCad's y points down), which is also KiCad's frame for a
// footprint's 3D model. With --step, also a STEP of the cup with its ball and support balls in place, for the
// footprint ErgoCaiLib TrackballCup_PMW3610-pogo that shows them on the module board (3D viewer, the module's .glb):
//   node cup.js --step <ErgoCaiLib>/3dmodels/TrackballCup_PMW3610-pogo.step
//
// usage: node cup.js [--lens <mm>] [--ball <mm>] [--support <mm>] [--out <file.stl>] [--step <file.step>]
//   manifold-3d (npm install in this folder; or MANIFOLD=<a node_modules folder that has it>)
//
// What the numbers rest on:
// - the ball's surface is 2.4 mm (2.2 to 2.6) from the lens's reference plane, its face toward the ball
//   (PMW3610DM-SUDU datasheet, table 2);
// - lens: that plane's height over the board's top. The LM18-LSI lens drawing is not at hand; 3.4 is what Cosmos
//   Keyboards' trackball sockets take for a PMW3610 board with its lens (PMW_LENS_HEIGHT in its trackball-gen.ts).
//   Measure it on the assembled board (a caliper from the board's top to the lens's top face) and build the cup
//   for that height. Every height below follows from it;
// - ball: 25 mm, a mini billiard ball; 0.5 mm round it, so the wall is 1.2 mm at the equator;
// - support: three balls of 2.5 mm (ceramic, Si3N4 or ZrO2, or steel), pressed into their seats from inside the
//   cup, 50 degrees off the bottom, one opposite the lens's long side and two at 120 degrees from it;
// - the pocket in the floor clears the lens, the sensor's leads (trim them to 1.5 mm) and their solder; the pogo
//   pins' tails stay under solder mask, flat, so the plate sits on them;
// - the tabs: 10 mm long and 1 mm thick, cut free from the wall, bend the 0.4 mm their hooks reach under the board
//   (under 1 % strain); the skirts on the left and right edges only locate the cup.
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
const STEP = arg('step', '')

const Z_GAP = 2.4                                // reference plane to the ball's surface
const CLEAR = 0.5                                // between the ball and the cup
const SEAT = SUPPORT - 0.05                      // a support ball's hole: a press fit (enlarge for a loose printer)
const TILT = 50                                  // support balls, degrees off the ball's bottom
const AZIMUTHS = [90, 210, 330]                  // and round the axis (90: +y, away from the lens's long side)
const OUTER = 14.2                               // the cup's outside, 0.4 inside the case's opening each way
const ABOVE = 0.5                                // the rim, over the ball's equator
// the module board: its outline (KiCad's frame, round the holes' centres at the corners) and thickness
const BOARD = {x0: -13.0, x1: 14.5, y0: -13.0, y1: 13.0, r: 2.15, t: 1.6}
const HOLES = [[-10.85, 10.85], [12.35, 10.85], [-10.85, -10.85], [12.35, -10.85]]
const HEAD = {d: 4.4, h: 2.0}                    // pockets for the screw heads (M2 pan or DIN 965 heads)
const STANDOFF = 3.0                             // the skirts keep this far from the holes' centres (standoffs 2.51)
const PLATE = 1.0                                // over the board's top
const SKIRT = {gap: 0.1, wall: 1.2, down: 1.0}   // round the board's left and right edges
const TAB = {width: 5, thick: 1.0, top: 8, slot: 0.5, hook: 0.4, hookT: 0.5}   // the snap tabs, top and bottom edges
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
    const {Manifold, CrossSection} = wasm

    // the board's outline grown by d, as a cross-section (symmetric in y, so the same in both frames)
    const board = (d) => CrossSection.square([BOARD.x1 - BOARD.x0 - 2 * BOARD.r, BOARD.y1 - BOARD.y0 - 2 * BOARD.r])
        .translate([BOARD.x0 + BOARD.r, BOARD.y0 + BOARD.r]).offset(BOARD.r + d, 'Round', 2, SEGMENTS)
    const slab = (section, z0, z1) => section.extrude(z1 - z0).translate([0, 0, z0])
    const near = (w, x, y, z0, z1) => Manifold.cylinder(z1 - z0, w / 2, w / 2, 48).translate([x, -y, z0])

    // the body and the plate over the board; the skirts round its left and right edges, clear of the standoffs
    let cup = Manifold.union([Manifold.cylinder(TOP, OUTER, OUTER, SEGMENTS),
                              slab(board(SKIRT.gap + SKIRT.wall), 0, PLATE)])
    let skirt = slab(board(SKIRT.gap + SKIRT.wall).subtract(board(SKIRT.gap)), -SKIRT.down, PLATE / 2)
        .intersect(Manifold.cube([BOARD.x1 - BOARD.x0 + 10, 2 * (BOARD.y1 - BOARD.r - STANDOFF + BOARD.r), 20], true))
    cup = cup.add(skirt)
    // the snap tabs: a piece of the wall at the top and bottom edges' middles, cut free on three sides and run down
    // past the board, a hook under its bottom face
    const edge = BOARD.y1 + SKIRT.gap                   // the tabs' inner face, off the board's edge
    const tabs = [], frees = []
    for (const s of [1, -1]) {
        const y0 = s > 0 ? edge : -edge - TAB.thick
        const zLow = -BOARD.t - SKIRT.gap - TAB.hookT
        tabs.push(Manifold.cube([TAB.width, TAB.thick, TAB.top + 1 - zLow]).translate([-TAB.width / 2, y0, zLow]))   // 1 into its root
        // the hook, reaching under the board: a wedge, flat on top under the board's bottom face and sloped below it,
        // so the board's edge pushes the tab out as the cup goes down
        const inner = s * (edge - SKIRT.gap - TAB.hook)
        const corners = [[s * edge, zLow], [s * edge, zLow + TAB.hookT], [inner, zLow + TAB.hookT]]
        tabs.push(Manifold.hull(corners.flatMap(([y, z]) => [[-TAB.width / 2, y, z], [TAB.width / 2, y, z]])))
        // what frees it: slots at its sides and behind it, up to its root, and the body round its outside
        const sy0 = s > 0 ? edge - TAB.slot : -edge - TAB.thick - TAB.slot
        frees.push(Manifold.cube([TAB.width + 2 * TAB.slot, TAB.thick + 2 * TAB.slot + 2, TAB.top - zLow + 0.1])
            .translate([-TAB.width / 2 - TAB.slot, s > 0 ? sy0 : sy0 - 2, zLow - 0.05]))
    }
    cup = cup.subtract(Manifold.union(frees)).add(Manifold.union(tabs))

    const cut = []
    cut.push(Manifold.sphere(R + CLEAR, SEGMENTS).translate([0, 0, CENTRE]))
    cut.push(Manifold.cube([POCKET.x1 - POCKET.x0, POCKET.y1 - POCKET.y0, BOTTOM + 0.01])
        .translate([POCKET.x0, -POCKET.y1, -0.01]))       // KiCad's y range, flipped
    cut.push(slab(board(SKIRT.gap), -BOARD.t - SKIRT.gap, 0))   // the board itself, and room round it
    for (const [x, y] of HOLES) cut.push(near(HEAD.d, x, y, -0.1, HEAD.h))
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
    cup = cup.subtract(Manifold.union(cut))

    const supports = AZIMUTHS.map(a => {
        const d = R + SUPPORT / 2, t = TILT * Math.PI / 180, p = a * Math.PI / 180
        return [d * Math.sin(t) * Math.cos(p), d * Math.sin(t) * Math.sin(p), CENTRE - d * Math.cos(t)]
    })
    fs.writeFileSync(OUT, stl(cup))
    if (STEP) {
        // the 3D view's cup: printed white, a red ball (a mini billiard ball is 25 mm), grey ceramic support balls
        const parts = [{name: 'cup', solid: cup, rgb: [0.92, 0.92, 0.9]},
                       {name: 'ball', solid: Manifold.sphere(R, 72).translate([0, 0, CENTRE]), rgb: [0.78, 0.1, 0.1]}]
        supports.forEach((s, i) => parts.push({name: `support ${i + 1}`, solid: Manifold.sphere(SUPPORT / 2, 20).translate(s),
                                               rgb: [0.55, 0.56, 0.6]}))
        fs.writeFileSync(STEP, step(parts, path.basename(STEP, path.extname(STEP))))
        console.log(`${STEP}: ${parts.map(p => p.name).join(', ')}`)
    }
    const box = cup.boundingBox()
    console.log(`${OUT}: ${(cup.volume() / 1000).toFixed(2)} cm3, ${cup.decompose().length} piece(s), ` +
                `x ${box.min[0].toFixed(2)}..${box.max[0].toFixed(2)} y ${box.min[1].toFixed(2)}..${box.max[1].toFixed(2)} ` +
                `z ${box.min[2].toFixed(2)}..${box.max[2].toFixed(2)}; ball ${BALL} mm, its bottom ${BOTTOM.toFixed(2)} mm over ` +
                `the board (lens ${LENS} + ${Z_GAP}), centre ${CENTRE.toFixed(2)}; support balls at ` +
                supports.map(s => `(${s.map(v => v.toFixed(2)).join(', ')})`).join(' '))
}

// STEP (AP242) of tessellated solids: each a TRIANGULATED_FACE of the mesh, in a colour of its own, with normals
// that keep edges over 30 degrees sharp. OCCT (7.7 on) reads these as faces that carry their triangulation, which is
// what KiCad's 3D viewer and its .glb export draw; a faceted B-rep (FACE and POLY_LOOP) comes in without one and is
// left out of the .glb.
const step = (parts, title) => {
    const out = []
    let id = 0
    const e = (text) => { out.push(`#${++id}=${text};`); return `#${id}` }
    const num = (v) => (Math.abs(v) < 5e-5 ? 0 : v).toFixed(4).replace(/0+$/, '')     // REAL: always a point
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
            `FILE_NAME('${title}.step','',(''),(''),'cup.js','manifold-3d','');`,
            `FILE_SCHEMA(('AP242_MANAGED_MODEL_BASED_3D_ENGINEERING_MIM_LF { 1 0 10303 442 1 1 4 }'));`, 'ENDSEC;',
            'DATA;', ...out, 'ENDSEC;', 'END-ISO-10303-21;', ''].join('\n')
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
