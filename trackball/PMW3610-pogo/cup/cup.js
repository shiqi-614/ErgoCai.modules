// The ball cup of the trackball module (trackball/PMW3610-pogo): printed, it snaps onto the module board's front and
// holds the ball over the sensor's lens on three small support balls. It stays inside the case's opening for the
// joystick mount (the mount's courtyard, -14.6..14.6 by -13.1..13.1, grown by 1.5): 28.4 mm round, with a plate over
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
// The trackballs in use are --style seat, on a 20 mm ball (--ball 20), both turned half a turn on the keyboard:
//   PMW3610-pogo:  node cup.js --fix cartridge --style seat --support 2 --ball 20 --step <...>/TrackballCup_PMW3610-pogo.step
//   PMW3610:       node cup.js --fix screws --style seat --support 2 --ball 20 --out ../../PMW3610/cup/cup.stl ... 
//                  --step <...>/TrackballCup_PMW3610.step
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
// how the cup holds on: tabs, snapped under the edges of the module board (trackball/PMW3610-pogo); screws, four M2
// through its plate's corners and the keyboard board it sits on (trackball/PMW3610, part of that board), nuts under it
// cartridge, as joystick/Alpsalpine-pogo's retainer: the cup one print with a frame round the module board, whose two
// hook arms snap under the case's top layer; a printed base under the board, screwed to the cup through the board's
// corner holes, puts the module's pins on the mount's pads (--style seat)
const FIX = arg('fix', 'tabs')
if (!['tabs', 'screws', 'cartridge'].includes(FIX)) throw new Error(`--fix tabs, screws or cartridge, not ${FIX}`)
const BASE_OUT = arg('base-out', '')
// its look: round, a straight wall to the rim, six slits for fingers; petals, after htx-studio's One-Handed
// Keyboard trackball seat (MIT): the wall rounds in over the equator, cut down to four petals that hold the ball, the
// plate a round one with a lobe for each screw boss
// seat, after the same seat as its makers build it (its exploded view, docs 374.jpg): the ball on three small balls
// set half into the wall, and held down by three more in vertical holes in three lugs over the equator, the wall cut
// down to the equator between the lugs; M2 heat-set inserts in four bosses under it, screwed from under the board
const STYLE = arg('style', 'round')
if (!['round', 'petals', 'seat'].includes(STYLE)) throw new Error(`--style round, petals or seat, not ${STYLE}`)
if (STYLE !== 'round' && FIX === 'tabs') throw new Error(`--style ${STYLE} has no skirts for the tabs: --fix screws or cartridge`)
if (FIX === 'cartridge' && STYLE !== 'seat') throw new Error('--fix cartridge is for --style seat')

const Z_GAP = 2.4                                // reference plane to the ball's surface
// between the ball and the cup: --style seat leaves the ball the support balls' half that stands out of the wall
const CLEAR = STYLE === 'seat' ? SUPPORT / 2 : 0.5
const SEAT = SUPPORT - 0.05                      // a support ball's hole: a press fit (enlarge for a loose printer)
const TILT = 50                                  // support balls, degrees off the ball's bottom
const AZIMUTHS = [90, 210, 330]                  // and round the axis (90: +y, away from the lens's long side)
// the cup's outside, 0.4 inside the case's opening each way; --style seat's, 1.5 mm of wall round its wider cavity
const OUTER = STYLE === 'seat' ? BALL / 2 + CLEAR + 1.5 : 14.2
const LIP = {mouth: 12.2, fingers: 6, slit: 0.8, below: 2}   // the rim's radius; slits from 2 mm under the equator
// the module board: its outline (KiCad's frame, round the holes' centres at the corners) and thickness
const BOARD = {x0: -14.5, x1: 14.5, y0: -13.0, y1: 13.0, r: 2.15, t: 1.6}
// the screws' holes: the module board's (tabs, cartridge: the mount's, ErgoCaiLib Pogo_ModuleMount_1x6_P2.54mm), or the cup's own
// in the keyboard board (screws); where an M2 head (3.8 mm) and its driver stay clear of the seat's wall (OUTER): 16.4 mm
// or more from the axis
const HOLES = FIX === 'screws' ? [[-11.8, 11.8], [12.35, 11.8], [-11.8, -11.8], [12.35, -11.8]]
                               : [[-12.35, 10.85], [12.35, 10.85], [-12.35, -10.85], [12.35, -10.85]]
// --fix cartridge, as joystick/Alpsalpine-pogo/retainer/retainer.js has it (its comments say what each rests on): the
// keyboard board's top over the case's bottom, the board 3.8 mm over it on the base's spacers (the pins at 3.8 mm),
// the case's top layer 18..21 and its opening, the mount's courtyard the case cuts round
const CART = {
    keyboardTop: 8.0, spacer: 3.8, clamp: 0.1, caseTop: 21.0, ledge: 18.0,
    opening: {x0: -16.1, x1: 16.1, y: 14.6}, courtyard: {x0: -14.6, x1: 14.6, y: 13.1, grown: 1.5},
    spacerD: 5.2, spigot: 2.15, spigotH: 1.2, chamfer: 0.2,
    insert: {length: 3.0, hole: 3.2, extra: 0.2},               // M2 x 3 x 3.2, in the spacers' tops
    plate: {t: 1.0, inset: 0.3, r: 2.15, pads: {x0: 9.4, x1: 12.6, y: 8.0}},
    rim: {gap: 0.15, wall: 1.0, z0: -1.6},
    arm: {root: 9.0, free: -7.0, z0: 0.4, post: 1.5}, hook: {length: 4.0, reach: 1.0, ramp: 0.7, flat: 0.5},
    lever: {length: 4.0, t: 1.5, over: 1.5}, slot: 0.5, grip: {ribs: 2, rib: 0.2, pitch: 0.35, depth: 0.3},
    bend: 1.2,                                                   // the arms' room to bend in, past the rim's inside
    solder: {x0: 9.4, x1: 12.6, y: 8.0, h: 1.0},                // the pogo pins' solder on the board's top
    // the screws: all four (16.4 mm off the ball's axis, past the shell) countersunk down through the cup's bosses
    // and the board into the inserts in the spacers, as the retainer's
    top: {length: 12, clear: 2.3, head: 3.8, way: 0.4},
}
const HEAD = {d: 4.4, h: 2.0}                    // pockets for the screw heads (M2 pan or DIN 965 heads)
const STANDOFF = 3.0                             // the skirts keep this far from the holes' centres (standoffs 2.51)
const PLATE = 1.0                                // over the board's top
const SKIRT = {gap: 0.1, wall: 1.2, down: 1.0}   // round the board's left and right edges
const TAB = {width: 5, thick: 1.0, top: 8, slot: 0.5, hook: 0.4, hookT: 0.5}   // the snap tabs, top and bottom edges
const BOSS = {d: 5.0, h: 2.0, hole: 2.3}         // --fix screws: the plate's corners, under the screw heads
// --style petals: the cuts between the petals, at 0, 90, 180 and 270 degrees (between the screws), U-shaped, down to
// 2 mm under the equator like the slits; four petals of about 8 mm at the rim, against the slits' 13 mm fingers
const PETAL = {gap: 12, below: 2}
// --style seat: the three balls that hold the ball down, as many and as big as the supports, 15 degrees over the
// equator, between the supports in azimuth; each in a vertical hole down a lug, from the lug's top, whose side opens
// into the cavity: the hole's axis `out` (0.3 mm) outside the cavity's wall, so the ball stands that much short of the
// trackball (it stops the trackball lifting, it does not press on it) and the window it shows in (1.85 mm) is too
// narrow to let it into the cavity. The lugs `lug` wide; between them the wall comes down to `below` under the equator
const RETAIN = {elevation: 15, out: 0.3, azimuths: [30, 150, 270], lug: 4.6, over: 0.6, below: 1}
// --fix cartridge: on thinner lugs, clear of the hook arms bending in at the short ends (from x +-11.95) and inside the
// case's opening (|y| under 14.15); for a ball over 20 mm, four, where a lug stays inside it
if (FIX === 'cartridge') Object.assign(RETAIN, BALL > 20 ? {azimuths: [55, 125, 235, 305], lug: 3.4} : {lug: 3.4})
// ... its plinth's top: 1 mm over the ball's bottom, round the lens's pocket
const SEAT_PLINTH_OVER = 1.0
// --style seat's bosses: M2 heat-set inserts (M2 x 3 x 3.2) from below, 0.2 mm deeper than they are long
const INSERT = {d: 6.0, h: 4.5, hole: 3.2, depth: 3.2}
// the pocket: the lens (the board's x -4.7..4.7, y -6.46..11.5 in KiCad's frame, the sensor turned 90) and the leads
// (x +-5.35), 1 mm round them
const POCKET = {x0: -6.4, x1: 6.4, y0: -7.5, y1: 12.5}

const R = BALL / 2
const BOTTOM = LENS + Z_GAP                      // the ball's lowest point
const CENTRE = BOTTOM + R
// where the cavity narrows to the rim; --style seat's lugs' tops
const SEAT_PLINTH = LENS + Z_GAP + SEAT_PLINTH_OVER
const RETAIN_Z = CENTRE + (R + CLEAR) * Math.sin(RETAIN.elevation * Math.PI / 180)
const TOP = STYLE === 'seat' ? RETAIN_Z + SUPPORT / 2 + RETAIN.over : CENTRE + Math.sqrt((R + CLEAR) ** 2 - LIP.mouth ** 2)
const SEGMENTS = 128
// --style seat: a holding ball's hole axis, its distance from the ball's axis at RETAIN_Z: the cavity's wall there,
// and RETAIN.out more
const retainAxis = () => (R + CLEAR) * Math.cos(RETAIN.elevation * Math.PI / 180) + RETAIN.out
const retainers = () => RETAIN.azimuths.map(a => [retainAxis() * Math.cos(a * Math.PI / 180), retainAxis() * Math.sin(a * Math.PI / 180), RETAIN_Z])

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
    let cup
    if (STYLE === 'seat') {
        // a plinth on the board, round with a lobe for each insert's boss, up to just over the ball's bottom (it holds
        // the lens's pocket); on it a shell that follows the ball, a sphere OUTER round its centre, up to the lugs
        const plinth = CrossSection.union([CrossSection.circle(OUTER, SEGMENTS),
            ...HOLES.map(([x, y]) => CrossSection.hull([CrossSection.circle(INSERT.d / 2, 48).translate([x, -y]),
                                                       CrossSection.circle(INSERT.d / 2, 48).translate([x * 0.8, -y * 0.8])]))])
        cup = Manifold.union([slab(plinth, 0, SEAT_PLINTH),
                              Manifold.sphere(OUTER, SEGMENTS).translate([0, 0, CENTRE])
                                  .intersect(Manifold.cylinder(TOP - SEAT_PLINTH + 0.01, OUTER + 1, OUTER + 1, SEGMENTS).translate([0, 0, SEAT_PLINTH - 0.01]))])
        // each lug: a round column round its ball's hole, over the shell's outside; what of it reaches into the cavity
        // goes with the cavity, but for the hole's window
        for (const [x, y] of retainers()) {
            cup = cup.add(Manifold.cylinder(TOP - (RETAIN_Z - 3), RETAIN.lug / 2, RETAIN.lug / 2, 48).translate([x, y, RETAIN_Z - 3]))
        }
    } else if (STYLE === 'round') {
        cup = Manifold.union([Manifold.cylinder(TOP, OUTER, OUTER, SEGMENTS), slab(board(SKIRT.gap + SKIRT.wall), 0, PLATE)])
    } else {
        // straight up to the equator, a sphere of the same radius over it; the plate round, a lobe out to each boss
        const disc = CrossSection.circle(OUTER, SEGMENTS)
        const lobes = HOLES.map(([x, y]) => CrossSection.hull([disc, CrossSection.circle(BOSS.d / 2, 48).translate([x, -y])]))
        cup = Manifold.union([Manifold.cylinder(CENTRE, OUTER, OUTER, SEGMENTS),
                              Manifold.sphere(OUTER, SEGMENTS).translate([0, 0, CENTRE])
                                  .intersect(Manifold.cylinder(TOP - CENTRE, OUTER + 1, OUTER + 1, SEGMENTS).translate([0, 0, CENTRE])),
                              slab(CrossSection.union(lobes), 0, PLATE)])
    }
    let skirt = slab(board(SKIRT.gap + SKIRT.wall).subtract(board(SKIRT.gap)), -SKIRT.down, PLATE / 2)
        .intersect(Manifold.cube([BOARD.x1 - BOARD.x0 + 10, 2 * (BOARD.y1 - BOARD.r - STANDOFF + BOARD.r), 20], true))
    if (FIX === 'tabs') cup = cup.add(skirt)
    else if (STYLE !== 'seat') for (const [x, y] of HOLES) cup = cup.add(near(BOSS.d, x, y, 0, BOSS.h))
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
    if (FIX === 'tabs') cup = cup.subtract(Manifold.union(frees)).add(Manifold.union(tabs))

    const cut = []
    cut.push(Manifold.sphere(R + CLEAR, SEGMENTS).translate([0, 0, CENTRE]))
    cut.push(Manifold.cube([POCKET.x1 - POCKET.x0, POCKET.y1 - POCKET.y0, BOTTOM + 0.01])
        .translate([POCKET.x0, -POCKET.y1, -0.01]))       // KiCad's y range, flipped
    if (FIX !== 'screws') cut.push(slab(board(SKIRT.gap), -BOARD.t - SKIRT.gap, 0))   // the module board, and room round it
    // the module's screw heads under the plate (tabs), or the cup's own screws through it (screws), or its inserts
    // (cartridge: the screws' clearance and countersinks below)
    if (FIX !== 'cartridge') for (const [x, y] of HOLES) cut.push(FIX === 'tabs' ? near(HEAD.d, x, y, -0.1, HEAD.h)
        : STYLE === 'seat' ? near(INSERT.hole, x, y, -0.1, INSERT.depth)
        : near(BOSS.hole, x, y, -0.1, BOSS.h + 0.1))
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
    // the rim's fingers: slits through the wall from above the cut-free tabs to the top; or the cuts between the
    // petals, a round bottom under a straight-sided slot
    if (STYLE === 'seat') {
        // the holding balls' holes, down each lug from its top to where the ball sits; and between the lugs, the
        // wall cut down to under the equator, a round bottom under a straight-sided slot as wide as the lugs leave
        for (const a of RETAIN.azimuths) {
            const z0 = RETAIN_Z - SUPPORT / 2
            cut.push(Manifold.cylinder(TOP - z0 + 1, SEAT / 2, SEAT / 2, 32).translate([retainAxis(), 0, z0]).rotate([0, 0, a]))
        }
        const lugs = [...RETAIN.azimuths].sort((p, q) => p - q)
        lugs.forEach((a, i) => {
            const next = i + 1 < lugs.length ? lugs[i + 1] : lugs[0] + 360, gap = next - a
            const width = 2 * (R + CLEAR) * Math.sin(gap * Math.PI / 360) - RETAIN.lug - 1.4
            const r = width / 2, z0 = CENTRE - RETAIN.below
            cut.push(Manifold.union([
                Manifold.cylinder(OUTER + 3, r, r, 64).rotate([0, 90, 0]).translate([0, 0, z0 + r]),
                Manifold.cube([OUTER + 3, width, TOP - z0 + 1]).translate([0, -r, z0 + r])]).rotate([0, 0, a + gap / 2]))
        })
    }
    else if (STYLE === 'petals') for (let k = 0; k < 4; k++) {
        const r = PETAL.gap / 2, z0 = CENTRE - PETAL.below
        cut.push(Manifold.union([
            Manifold.cylinder(OUTER + 2, r, r, 64).rotate([0, 90, 0]).translate([0, 0, z0 + r]),
            Manifold.cube([OUTER + 2, PETAL.gap, TOP - z0]).translate([0, -r, z0 + r])]).rotate([0, 0, 90 * k]))
    }
    else for (let k = 0; k < LIP.fingers; k++) {
        cut.push(Manifold.cube([OUTER + 2, LIP.slit, TOP - (CENTRE - LIP.below) + 1])
            .translate([0, -LIP.slit / 2, CENTRE - LIP.below]).rotate([0, 0, 30 + 360 * k / LIP.fingers]))
    }
    if (FIX === 'cartridge') {
        // the bosses: the screws' clearance, countersunk at the top
        for (const [x, y] of HOLES) {
            cut.push(near(CART.top.clear, x, y, -0.1, SEAT_PLINTH + 0.1))
            const sink = CART.top.head / 2 + 0.1
            cut.push(Manifold.cylinder(sink - CART.top.clear / 2 + 0.01, CART.top.clear / 2, sink + 0.01, 48)
                .translate([x, -y, SEAT_PLINTH - (sink - CART.top.clear / 2)]))
            // and over it a way down for the head and the driver, past the shell's bulge at the equator (the head's
            // edge 14.5 mm off the axis, the shell's outside 15): a groove up its outside
            cut.push(near(CART.top.head + CART.top.way, x, y, SEAT_PLINTH, TOP + 1))
        }
        // the pins' solder on the board's top
        cut.push(Manifold.cube([CART.solder.x1 - CART.solder.x0, 2 * CART.solder.y, CART.solder.h + 0.1])
            .translate([CART.solder.x0, -CART.solder.y, -0.1]))
    }
    cup = cup.subtract(Manifold.union(cut))
    let base = null
    if (FIX === 'cartridge') ({cup, base} = cartridge(wasm, cup))

    const supports = AZIMUTHS.map(a => {
        const d = R + SUPPORT / 2, t = TILT * Math.PI / 180, p = a * Math.PI / 180
        return [d * Math.sin(t) * Math.cos(p), d * Math.sin(t) * Math.sin(p), CENTRE - d * Math.cos(t)]
    })
    if (STYLE === 'seat') supports.push(...retainers())     // and the balls that hold the ball down
    fs.writeFileSync(OUT, stl(cup))
    if (base) fs.writeFileSync(BASE_OUT || path.join(path.dirname(OUT), 'base.stl'), stl(base.translate([0, 0, CART.spacer + BOARD.t + CART.spigotH])))
    const ball = Manifold.sphere(R, 96).translate([0, 0, CENTRE])
    const supportBalls = Manifold.union(supports.map(s => Manifold.sphere(SUPPORT / 2, 24).translate(s)))
    const boardSolid = slab(board(0), -BOARD.t, 0)
    fs.writeFileSync(SECTIONS, sections({cup: base ? cup.add(base) : cup, ball, supports: supportBalls, board: boardSolid}))
    fs.writeFileSync(PARTS, partsList())
    if (STEP) {
        // the 3D view's cup: printed white, a red ball (a mini billiard ball is 25 mm), grey ceramic support balls
        const parts = [{name: 'cup', solid: cup, rgb: [0.92, 0.92, 0.9]}, ...(base ? [{name: 'base', solid: base, rgb: [0.3, 0.55, 0.9]}] : []),
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

// --fix cartridge: the frame round the module board, one with the cup, and the base under the board, as
// joystick/Alpsalpine-pogo/retainer/retainer.js makes them (there without the cover, which the cup takes the place of,
// and the post under the stick, where the sensor is): {cup: the cup and the frame, base}. The cup's frame: x as the
// board's, y as its -y, the board's top at z = 0.
const cartridge = (wasm, seat) => {
    const {Manifold, CrossSection} = wasm
    const C = CART
    const boardTop = C.keyboardTop + C.spacer + BOARD.t
    const ledge = C.ledge - boardTop, caseTop = C.caseTop - boardTop
    const box = (x0, x1, y0, y1, z0, z1) => Manifold.cube([x1 - x0, y1 - y0, z1 - z0]).translate([x0, -y1, z0])
    const disc = (d, x, y, z0, z1) => Manifold.cylinder(z1 - z0, d / 2, d / 2, 48).translate([x, -y, z0])
    const rounded = (by, z0, z1) => CrossSection.square([C.courtyard.x1 - C.courtyard.x0, 2 * C.courtyard.y])
        .translate([C.courtyard.x0, -C.courtyard.y]).offset(by, 'Round', 2, 64).extrude(z1 - z0).translate([0, 0, z0])
    const inner = {x0: BOARD.x0 - C.rim.gap, x1: BOARD.x1 + C.rim.gap, y: BOARD.y1 + C.rim.gap}
    const outer = {x0: inner.x0 - C.rim.wall, x1: inner.x1 + C.rim.wall, y: inner.y + C.rim.wall}
    const holdTop = ledge + C.clamp
    const parts = []
    // the rim, the board's bottom to the hooks' tops, open over the arms
    parts.push(box(outer.x0, outer.x1, -outer.y, outer.y, C.rim.z0, holdTop).subtract(box(inner.x0, inner.x1, -inner.y, inner.y, C.rim.z0 - 1, holdTop + 1)))
    const sides = [{out: -1, x0: outer.x0, x1: inner.x0}, {out: 1, x0: inner.x1, x1: outer.x1}]
    const openings = sides.map(({x0, x1}) => box(x0 - 0.1, x1 + 0.1, C.arm.free - C.slot, C.arm.root - C.arm.post, 0, holdTop + 1))
    parts[0] = parts[0].subtract(Manifold.union(openings))
    // the arms, their hooks and levers
    const tabs = []
    for (const {out, x0, x1} of sides) {
        parts.push(box(x0, x1, C.arm.root - C.arm.post, C.arm.root, C.rim.z0, holdTop))
        parts.push(box(x0, x1, C.arm.free, C.arm.root, C.arm.z0, holdTop))
        const face = out > 0 ? x1 : x0, reach = out * C.hook.reach
        const z1 = holdTop, zFlat = z1 - C.hook.flat, z0 = zFlat - C.hook.ramp
        const hy0 = C.arm.free, hy1 = C.arm.free + C.hook.length
        const corners = [[face, z0], [face, z1], [face + reach, z1], [face + reach, zFlat]]
        tabs.push(Manifold.hull(corners.flatMap(([x, z]) => [[x, -hy0, z], [x, -hy1, z]])))
        const lx0 = out > 0 ? x1 - C.lever.t : x0, lx1 = out > 0 ? x1 : x0 + C.lever.t
        const r = C.lever.t / 2, top = caseTop + C.lever.over
        tabs.push(box(lx0, lx1, C.arm.free, C.arm.free + C.lever.length, C.arm.z0, top - r))
        tabs.push(Manifold.cylinder(C.lever.length, r, r, 48).rotate([90, 0, 0]).translate([(lx0 + lx1) / 2, -C.arm.free, top - r]))
        for (let k = 0; k < C.grip.ribs; k++) {
            const z = caseTop + 0.15 + C.grip.pitch * k
            tabs.push(box(out > 0 ? x1 : x0 - C.grip.depth, out > 0 ? x1 + C.grip.depth : x0, C.arm.free, C.arm.free + C.lever.length, z, z + C.grip.rib))
        }
    }
    // the cup inside the opening (less the frame's own clearance), and clear of the arms and levers bending in
    const fit = rounded(C.courtyard.grown - (C.opening.y - outer.y), -2, TOP + 1)
    let cup = seat.intersect(fit)
    for (const {out, x0, x1} of sides) {
        const room = out > 0 ? [inner.x1 - C.lever.t - C.bend, outer.x1 + 1] : [outer.x0 - 1, inner.x0 + C.lever.t + C.bend]
        cup = cup.subtract(box(room[0], room[1], C.arm.free - C.slot, C.arm.root - C.arm.post + C.slot, -0.1, caseTop + C.lever.over + 1))
    }
    const frame = Manifold.union([Manifold.union(parts).intersect(rounded(C.courtyard.grown - (C.opening.y - outer.y), C.rim.z0 - 1, holdTop + 0.02)),
                                  cup, ...tabs])
    // the base: the plate on the keyboard board, open over the contact pads; the spacers under the board's holes,
    // each with a spigot into the mount's hole and an insert in its top
    const floor = -BOARD.t - C.spacer
    const plate = CrossSection.square([BOARD.x1 - BOARD.x0 - 2 * C.plate.inset - 2 * C.plate.r, 2 * (BOARD.y1 - C.plate.inset - C.plate.r)])
        .translate([BOARD.x0 + C.plate.inset + C.plate.r, -(BOARD.y1 - C.plate.inset - C.plate.r)]).offset(C.plate.r, 'Round', 2, 64)
        .extrude(C.plate.t).translate([0, 0, floor])
        .subtract(box(C.plate.pads.x0, C.plate.pads.x1, -C.plate.pads.y, C.plate.pads.y, floor - 1, floor + C.plate.t + 1))
    const spacers = HOLES.map(([x, y]) => {
        return disc(C.spacerD, x, y, floor, floor + C.spacer)
            .add(disc(C.spigot, x, y, floor - C.spigotH, floor + 0.01))
            .add(Manifold.cylinder(C.chamfer, C.spigot / 2 - C.chamfer, C.spigot / 2, 48).translate([x, -y, floor - C.spigotH - C.chamfer]))
            .subtract(disc(C.insert.hole, x, y, floor + C.spacer - C.insert.length - C.insert.extra, floor + C.spacer + 0.01))
    })
    const base = Manifold.union([plate, ...spacers])
    const topReach = C.top.length - SEAT_PLINTH - BOARD.t
    if (topReach > C.insert.length) throw new Error(`the screws reach ${(topReach - C.insert.length).toFixed(1)} mm past their inserts`)
    console.log(`cartridge: the board's top ${boardTop.toFixed(1)} over the case's bottom, the hooks ${C.clamp} mm over the ledge at ` +
                `${ledge.toFixed(1)}; screws M2 x ${C.top.length} countersunk, down (${topReach.toFixed(1)} mm into the spacers' inserts)`)
    return {cup: frame, base}
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
    `Written by cup.js${FIX === 'tabs' ? '' : ' --fix ' + FIX}${STYLE === 'round' ? '' : ' --style ' + STYLE} with the cup (cup.stl)` +
        `${FIX === 'cartridge' ? ', the base (base.stl)' : ''} and its drawing (sections.svg); ` +
        'run it again after changing a number.',
    FIX !== 'screws' ? 'The module board itself is in the KiCad BOM of PMW3610-pogo.'
                     : 'The sensor, its lens and the LDO are on the keyboard board, in its KiCad BOM (trackball/PMW3610).',
    '',
    '| Part | Qty | What | Notes |',
    '|---|---|---|---|',
    STYLE === 'seat'
        ? `| Ball | 1 | ${BALL} mm | a PTFE ball as the seat's makers use, a mini billiard ball, or a ${BALL} mm replacement ` +
          `trackball ball; laid in before the holding balls go in, taken out to clean after they come out |`
        : `| Ball | 1 | ${BALL} mm | a mini billiard ball, or a ${BALL} mm replacement trackball ball; pressed in past the ` +
          `rim's fingers (${(2 * LIP.mouth).toFixed(1)} mm across), pried out to clean |`,
    '| Lens | 1 | PixArt LM18-LSI | the PMW3610\'s lens, bought with or beside the sensor; clips into the board\'s ' +
        'aperture from the front, up against the sensor, under the ball (datasheet PMS0039: 5.95 mm from the ' +
        'sensor\'s pin reference plane to its own) |',
    STYLE === 'seat'
        ? `| Small balls | ${3 + RETAIN.azimuths.length} | ${SUPPORT} mm, PTFE (as the seat's makers use them), or ceramic | three supports pressed half into ` +
          `the wall under the ball (holes ${SEAT.toFixed(2)} mm, a press fit), ${RETAIN.azimuths.length === 3 ? 'three' : 'four'} that hold the ball down dropped into ` +
          `the lugs' holes from above once the ball is in (take them out to take the ball out); no glue: PTFE takes none, ` +
          `and the lens is polycarbonate, which CA attacks |`
        : `| Support balls | 3 | ${SUPPORT} mm, silicon nitride (Si3N4) or zirconia (ZrO2) ceramic, or steel | pressed into the ` +
        `seats from inside the cup (holes ${SEAT.toFixed(2)} mm, a press fit: enlarge \`SEAT\` for a loose printer), ` +
        `then a drop of thin CA glue each, left to cure before the cup goes over the lens (the lens is polycarbonate, ` +
        `which CA attacks); they are static, the ball slides on them |`,
    FIX === 'cartridge'
        ? `| Cup and frame | 1 | cup.stl, printed | PETG (the arms bend as the cartridge snaps under the case's top layer), ` +
          `3 or more perimeters; the frame's bottom down, supports under the plinth (the rim goes 1.6 mm further down, round the board) and under the arms |\n` +
          `| Base | 1 | base.stl, printed | PETG or PLA; the plate down, flat: no supports |`
        : STYLE === 'seat'
        ? `| Cup | 1 | cup.stl, printed | PETG or PLA (nothing in it bends), 3 or more perimeters (the wall is ` +
          `${(OUTER - R - CLEAR).toFixed(1)} mm at the equator); the plinth down, flat: no supports |`
        : `| Cup | 1 | cup.stl, printed | PETG (the rim's fingers bend each time the ball goes in or out), 3 or more ` +
          `perimeters (the wall is ${(OUTER - R - CLEAR).toFixed(1)} mm at the equator); rim up` +
          (FIX === 'tabs' ? `, supports only under the plate, between the skirts |` : `, flat on the plate: no supports |`),
    FIX === 'tabs'
        ? '| Module fasteners | 4 | M2 screws and 4 mm M2 standoffs | or M2 locating pins and 4 x 2 mm disc magnets: the mount ' +
          'takes either (ErgoCaiLib Pogo_ModuleMount_1x6_P2.54mm); the module is fastened first, then the cup snaps on |'
        : FIX === 'cartridge'
        ? `| Inserts | 4 | M2 heat-set inserts (M2 x 3 x 3.2) | melted into the base's spacers from above |\n` +
          `| Screws | 4 | M2 x ${CART.top.length} countersunk (DIN 965 / ISO 7046) | the module board in the frame, on the base: ` +
          `down through the cup's corners and the board into the spacers' inserts, their heads flush; the base's spigots go ` +
          `into the keyboard board's mount holes, and the frame's arms snap under the case's top layer: no screws into the ` +
          `keyboard |`
        : STYLE === 'seat'
        ? `| Cup fasteners | 4 + 4 | M2 heat-set inserts (M2 x 3 x 3.2), M2 x 6 screws (pan heads) | the inserts melted into the ` +
          `bosses from below, the screws up through the keyboard board's holes TB_H1..TB_H4 into them |`
        : `| Cup fasteners | 4 | M2 x 6 screws (pan or DIN 965 heads), M2 nuts | down through the plate's corners ` +
          `(${BOSS.h} mm there) and the keyboard board's holes TB_H1..TB_H4, the nuts under the board, in the room ` +
          `over the bottom plate |`,
    '',
    `The ball's bottom sits ${BOTTOM.toFixed(2)} mm over the board: the lens's reference plane at ${LENS} mm plus ` +
        `${Z_GAP} mm, from the lens's datasheet for a 1.6 mm board; for another, or what a caliper says, run ` +
        `\`node cup.js --lens <mm>\`.`,
    '',
    ...(STYLE === 'seat' ? [
        '## Printing',
        '',
        `- Layers 0.12 to 0.16 mm: the cavity is a sphere, and its wall stands ${CLEAR.toFixed(1)} mm off the ball, so ` +
            'coarse layers leave steps the ball can touch; 0.4 mm nozzle, 3 or more perimeters, 30 % infill or more.',
        `- The small balls' holes are ${SEAT.toFixed(2)} mm for ${SUPPORT} mm balls, a press fit: print a test cup and ` +
            'try a ball first. Tight: ream with a 2 mm drill by hand (no glue). Loose: make `SEAT` in cup.js smaller. ' +
            'The supports\' holes print at an angle and the holding balls\' straight down; clear the strings out of both.',
        `- The inserts' holes are ${INSERT.hole} mm across and ${INSERT.depth} mm deep: melt the inserts in square with a ` +
            'soldering iron (about 220 °C for PETG), let them stand proud by no more than 0.1 mm, then file them flush.',
        ...(FIX === 'cartridge' ? [
            '- Cup and frame: frame bottom down, in PETG (PLA is too stiff for the arms and cracks). Supports, touching ' +
                'the build plate only, under the plinth (inside the rim) and under the arms and hooks; tree supports ' +
                'come off cleanest. None in the cavity: its lowest part is the lens pocket, open down.',
            '- The arms bend along the layers: keep them whole, with no seam on them (seam "rear" or painted onto ' +
                'the frame\'s ends), and leave out ironing and fuzzy skin.',
            `- Elephant's foot on the frame bottom makes the rim tight on the board's edge (${CART.rim.gap} mm each ` +
                'side): use the slicer\'s compensation (0.1 to 0.2 mm), or scrape the first layer\'s edge inside.',
            `- The hooks' tops stand ${CART.clamp} mm over the case's ledge: if the cartridge will not snap in, file ` +
                'them down a little; if it rattles, raise `clamp` in cup.js and print again.',
            '- Base: plate down, flat, no supports; PETG or PLA. The spigots at +x go into the keyboard board\'s ' +
                `mount holes (2.2 mm): ${CART.spigot} mm, sand them if they bind.`,
        ] : [
            '- Plinth down, flat: no supports. PETG or PLA.',
        ]),
        '',
    ] : []),
].join('\n')

// The drawing: sections through the ball's axis (x-z at y = 0, y-z at x = 0), plans at a few heights, and one snap
// tab enlarged; the cup grey, the ball red, the support balls dark, the board green. mm, z up.
const sections = ({cup, ball, supports, board}) => {
    const views = []
    // a solid's polygons on a plane: 'xz' (y = 0), 'yz' (x = 0) or a height; in drawing coordinates (right, up)
    const cut = (solid, plane) => {
        if (plane === 'xz') return solid.rotate([90, 0, 0]).slice(0).toPolygons().map(p => p.map(([a, b]) => [a, -b]))
        if (typeof plane === 'string' && plane.startsWith('xz@')) {      // x-z at y = the number
            const y = Number(plane.slice(3))
            return solid.translate([0, -y, 0]).rotate([90, 0, 0]).slice(0).toPolygons().map(p => p.map(([a, b]) => [a, -b]))
        }
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
    const s = 9, cart = FIX === 'cartridge'
    // the cartridge's base is under the module board, and its frame's hooks out past the board's edges
    const side = cart ? [-18, -7, 18, 32] : [-17, -4, 17, 32], plan = cart ? [-18, -16, 19, 16] : [-16, -16, 17, 16]
    view('section x-z through the axis (y = 0)' + (cart ? ': the arms, their hooks' : ''), 'xz', 30, 40, s, side)
    const tabs = FIX === 'tabs'
    view(`section y-z through the axis (x = 0): ${tabs ? 'the tabs, ' : ''}a support seat, the rim`, 'yz', 380, 40, s, side)
    if (tabs) view(`z -2.0: the tabs' hooks`, -2.0, 30, 410, 6, plan)
    else if (cart) view('z 3.0: the frame, the arms', 3.0, 30, 410, 6, plan)
    else view('z 1.5: the screw bosses', 1.5, 30, 410, 6, plan)
    if (cart) view(`z ${(-BOARD.t - CART.spacer + 0.5).toFixed(1)}: the base, the spacers`, -BOARD.t - CART.spacer + 0.5, 260, 410, 6, plan)
    else view('z 0.5: plate, pockets', 0.5, 260, 410, 6, plan)
    const zs = supports.boundingBox().min[2] + SUPPORT / 2          // the lowest balls': the supports
    view(`z ${zs.toFixed(1)}: support balls`, zs, 490, 410, 6, plan)
    view(`z ${(TOP - 0.5).toFixed(1)}: ${STYLE === 'seat' ? 'the lugs' : "the rim's fingers"}`, TOP - 0.5, 720, 410, 6, plan)
    if (tabs) view('the +y tab, x = 0', 'yz', 950, 410, 22, [10.5, -3, 15.5, 6.5])
    else if (cart) view(`the screws, y = ${-HOLES[1][1]}`, 'xz@' + -HOLES[1][1], 950, 410, 7, [-15, -7, 15, 9])
    else view(`a screw boss, y = ${-HOLES[1][1]}`, 'xz@' + -HOLES[1][1], 950, 410, 22, [9.5, -3, 15.5, 6.5])
    const w = cart ? 1170 : 1080, h = 640
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">` +
        `<rect width="${w}" height="${h}" fill="white"/>${views.join('')}` +
        `<text x="30" y="${h - 12}" font-size="11" font-family="sans-serif">trackball/${FIX === 'screws' ? 'PMW3610' : 'PMW3610-pogo'} cup ` +
        `(cup.js${tabs ? '' : ' --fix ' + FIX}${STYLE === 'round' ? '' : ' --style ' + STYLE}): grey the cup${cart ? ', its frame and the base' : ''}, red the ${BALL} mm ball, dark the ${SUPPORT} mm ${STYLE === 'seat' ? '' : 'support '}balls, ` +
        `green the ${FIX === 'screws' ? 'keyboard' : 'module'} board; mm</text></svg>\n`
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
