// The ball cup of the trackball module (trackball/PMW3610-pogo): printed, it snaps onto the module board's front and
// holds the ball over the sensor's lens on three small support balls. It stays inside the case's opening for the
// joystick mount (the mount's courtyard, -13.1..14.6 by -13.1..13.1, grown by 1.5): 28.4 mm round, with a plate over
// the board and its edges. The module is screwed down first (four M2 screws through H1..H4 into the mount's
// standoffs); the cup clears the screw heads and two tabs hook under the board's top and bottom edges, so it comes
// off again to clean the ball, the lens and the support balls.
// Writes a binary STL in mm, sections.svg (the cup cut through the ball's axis both ways, in plan at a few heights,
// and one snap tab, with the ball, the support balls and the board) and parts.md (what to buy besides the print).
// The STL: z up, the board's top at z = 0, the ball's axis (the sensor's optical centre) at
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
// - lens: that plane's height over the board's top. The LM18-LSI datasheet (PixArt PMS0039 R1.03, figure 2;
//   https://github.com/ufan/pmw3610_breakout/blob/9bca482d2f900bf7c481b08167e90c663fe9e129/datasheet/lens-LM18-LSI.pdf) puts
//   the tracking surface 8.35 mm from the sensor's pin reference plane, which rests on the lens through the board's
//   aperture, and 2.4 mm from the lens's: the lens is 5.95 mm from one to the other. The leads' shoulder sits on the
//   board's back, so on the 1.6 mm board the plane is 4.35 mm over the top (Cosmos Keyboards' PMW_LENS_HEIGHT, 3.4,
//   is short of it). A caliper from the board's top to the lens's face checks it. Every height below follows from it;
// - ball: 25 mm, a mini billiard ball; 0.5 mm round it, so the wall is 1.2 mm at the equator. The wall runs on
//   past the equator to a rim 24.4 mm across, 0.6 mm less than the ball, cut into six fingers: the ball is pressed
//   in past them (0.3 mm each, about 1.7 % strain: print it in PETG) and stays in with the keyboard upside down;
//   it is pried out to clean;
// - support: three balls of 2.5 mm (ceramic, Si3N4 or ZrO2, or steel), pressed into their seats from inside the
//   cup, 50 degrees off the bottom, one opposite the lens's long side and two at 120 degrees from it. A seat
//   cannot snap a ball in: its equator is only 0.75 mm (its radius less the ball's 0.5 mm room) inside the wall,
//   which leaves a lip of about 0.1 mm. The seats point down and out, so a loose support ball stays put while the
//   cup stands; a drop of thin CA glue fixes them for good (they slide, they do not turn), cured before the cup goes
//   over the lens: it is polycarbonate, which CA attacks;
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
const LENS = Number(arg('lens', 4.35))           // lens reference plane over the board's top
const BALL = Number(arg('ball', 25))
const SUPPORT = Number(arg('support', 2.5))      // support balls
const OUT = arg('out', path.join(__dirname, 'cup.stl'))
const STEP = arg('step', '')
const SECTIONS = arg('sections', path.join(__dirname, 'sections.svg'))
const PARTS = arg('parts', path.join(__dirname, 'parts.md'))

const Z_GAP = 2.4                                // reference plane to the ball's surface
const CLEAR = 0.5                                // between the ball and the cup
const SEAT = SUPPORT - 0.05                      // a support ball's hole: a press fit (enlarge for a loose printer)
const TILT = 50                                  // support balls, degrees off the ball's bottom
const AZIMUTHS = [90, 210, 330]                  // and round the axis (90: +y, away from the lens's long side)
const OUTER = 14.2                               // the cup's outside, 0.4 inside the case's opening each way
const LIP = {mouth: 12.2, fingers: 6, slit: 0.8, below: 2}   // the rim's radius; slits from 2 mm under the equator
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
const TOP = CENTRE + Math.sqrt((R + CLEAR) ** 2 - LIP.mouth ** 2)   // where the cavity narrows to the rim
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
    // the rim's fingers: slits through the wall from above the cut-free tabs to the top
    for (let k = 0; k < LIP.fingers; k++) {
        cut.push(Manifold.cube([OUTER + 2, LIP.slit, TOP - (CENTRE - LIP.below) + 1])
            .translate([0, -LIP.slit / 2, CENTRE - LIP.below]).rotate([0, 0, 30 + 360 * k / LIP.fingers]))
    }
    cup = cup.subtract(Manifold.union(cut))

    const supports = AZIMUTHS.map(a => {
        const d = R + SUPPORT / 2, t = TILT * Math.PI / 180, p = a * Math.PI / 180
        return [d * Math.sin(t) * Math.cos(p), d * Math.sin(t) * Math.sin(p), CENTRE - d * Math.cos(t)]
    })
    fs.writeFileSync(OUT, stl(cup))
    const ball = Manifold.sphere(R, 96).translate([0, 0, CENTRE])
    const supportBalls = Manifold.union(supports.map(s => Manifold.sphere(SUPPORT / 2, 24).translate(s)))
    const boardSolid = slab(board(0), -BOARD.t, 0)
    fs.writeFileSync(SECTIONS, sections({cup, ball, supports: supportBalls, board: boardSolid}))
    fs.writeFileSync(PARTS, partsList())
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

// What to buy besides the print, from the numbers above
const partsList = () => [
    '# Trackball cup: the parts besides the print',
    '',
    'Written by cup.js with the cup (cup.stl) and its drawing (sections.svg); run it again after changing a number.',
    'The module board itself is in the KiCad BOM of PMW3610-pogo.',
    '',
    '| Part | Qty | What | Notes |',
    '|---|---|---|---|',
    `| Ball | 1 | ${BALL} mm | a mini billiard ball, or a ${BALL} mm replacement trackball ball; pressed in past the ` +
        `rim's fingers (${(2 * LIP.mouth).toFixed(1)} mm across), pried out to clean |`,
    '| Lens | 1 | PixArt LM18-LSI | the PMW3610\'s lens, bought with or beside the sensor; clips into the board\'s ' +
        'aperture from the front, up against the sensor, under the ball (datasheet PMS0039: 5.95 mm from the ' +
        'sensor\'s pin reference plane to its own) |',
    `| Support balls | 3 | ${SUPPORT} mm, silicon nitride (Si3N4) or zirconia (ZrO2) ceramic, or steel | pressed into the ` +
        `seats from inside the cup (holes ${SEAT.toFixed(2)} mm, a press fit: enlarge \`SEAT\` for a loose printer), ` +
        `then a drop of thin CA glue each, left to cure before the cup goes over the lens (the lens is polycarbonate, ` +
        `which CA attacks); they are static, the ball slides on them |`,
    `| Cup | 1 | cup.stl, printed | PETG (the rim's fingers bend each time the ball goes in or out), 3 or more ` +
        `perimeters (the wall is ${(OUTER - R - CLEAR).toFixed(1)} mm at the equator); rim up, supports only under the ` +
        `plate, between the skirts |`,
    '| Module fasteners | 4 | M2 screws and 4 mm M2 standoffs | or M2 locating pins and 4 x 2 mm disc magnets: the mount ' +
        'takes either (ErgoCaiLib Ps4JoystickMount_Pogo); the module is fastened first, then the cup snaps on |',
    '',
    `The ball's bottom sits ${BOTTOM.toFixed(2)} mm over the board: the lens's reference plane at ${LENS} mm plus ` +
        `${Z_GAP} mm, from the lens's datasheet for a 1.6 mm board; for another, or what a caliper says, run ` +
        `\`node cup.js --lens <mm>\`.`,
    '',
].join('\n')

// The drawing: sections through the ball's axis (x-z at y = 0, y-z at x = 0), plans at a few heights, and one snap
// tab enlarged; the cup grey, the ball red, the support balls dark, the board green. mm, z up.
const sections = ({cup, ball, supports, board}) => {
    const views = []
    // a solid's polygons on a plane: 'xz' (y = 0), 'yz' (x = 0) or a height; in drawing coordinates (right, up)
    const cut = (solid, plane) => {
        if (plane === 'xz') return solid.rotate([90, 0, 0]).slice(0).toPolygons().map(p => p.map(([a, b]) => [a, -b]))
        if (plane === 'yz') return solid.rotate([0, 0, -90]).rotate([90, 0, 0]).slice(0).toPolygons().map(p => p.map(([a, b]) => [a, -b]))
        return solid.slice(plane).toPolygons()
    }
    const colours = [['board', '#7c7', 0.7], ['cup', '#bcc4cc', 1], ['supports', '#445', 1], ['ball', '#d33', 0.35]]
    const view = (title, plane, x0, y0, scale, window) => {
        const [wx0, wy0, wx1, wy1] = window                  // the part of the plane shown, mm
        const px = (x) => x0 + (x - wx0) * scale, py = (y) => y0 + (wy1 - y) * scale
        const solids = {cup, ball, supports, board}
        let out = `<g><text x="${x0}" y="${y0 - 8}" font-size="13" font-family="sans-serif">${title}</text>` +
            `<clipPath id="c${views.length}"><rect x="${x0}" y="${y0}" width="${(wx1 - wx0) * scale}" height="${(wy1 - wy0) * scale}"/></clipPath>` +
            `<g clip-path="url(#c${views.length})">`
        for (const [name, fill, opacity] of colours) {
            const polys = cut(solids[name], plane)
            if (!polys.length) continue
            const d = polys.map(p => 'M' + p.map(([x, y]) => `${px(x).toFixed(1)},${py(y).toFixed(1)}`).join('L') + 'Z').join(' ')
            out += `<path d="${d}" fill="${fill}" fill-opacity="${opacity}" stroke="#334" stroke-width="0.5" fill-rule="evenodd"/>`
        }
        if (typeof plane === 'string') {                     // the heights that set the ball's place
            for (const [z, label] of [[0, 'board top'], [LENS, `lens ${LENS}`], [BOTTOM, `ball bottom ${BOTTOM.toFixed(1)}`], [CENTRE, `centre ${CENTRE.toFixed(1)}`]]) {
                if (z < wy0 || z > wy1) continue
                out += `<line x1="${px(wx0)}" x2="${px(wx1)}" y1="${py(z)}" y2="${py(z)}" stroke="#36c" stroke-width="0.6" stroke-dasharray="4 3"/>` +
                    `<text x="${px(wx1) - 4}" y="${py(z) - 3}" font-size="10" font-family="sans-serif" text-anchor="end" fill="#36c">${label}</text>`
            }
        }
        out += '</g></g>'
        views.push(out)
    }
    const s = 9
    view('section x-z through the axis (y = 0)', 'xz', 30, 40, s, [-17, -4, 17, 32])
    view('section y-z through the axis (x = 0): the tabs, a support seat, the rim', 'yz', 380, 40, s, [-17, -4, 17, 32])
    view(`z -2.0: the tabs' hooks`, -2.0, 30, 410, 6, [-16, -16, 17, 16])
    view('z 0.5: plate, pockets', 0.5, 260, 410, 6, [-16, -16, 17, 16])
    const zs = (supports.boundingBox().min[2] + supports.boundingBox().max[2]) / 2
    view(`z ${zs.toFixed(1)}: support balls`, zs, 490, 410, 6, [-16, -16, 17, 16])
    view(`z ${(TOP - 0.5).toFixed(1)}: the rim's fingers`, TOP - 0.5, 720, 410, 6, [-16, -16, 17, 16])
    view('the +y tab, x = 0', 'yz', 950, 410, 22, [10.5, -3, 15.5, 6.5])
    const w = 1080, h = 640
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">` +
        `<rect width="${w}" height="${h}" fill="white"/>${views.join('')}` +
        `<text x="30" y="${h - 12}" font-size="11" font-family="sans-serif">trackball/PMW3610-pogo cup (cup.js): ` +
        `grey the cup, red the ${BALL} mm ball, dark the ${SUPPORT} mm support balls, green the module board; mm</text></svg>\n`
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
