// ============================================================
// PROJECTS.JS: YOUR PROJECT LIST. This is the file you'll edit most.
//
// Each project below becomes one full-screen 3D page.
// To ADD a project: copy one { ... }, paste it at the end (before
// the last ], and put a comma after the previous project).
// To CHANGE text or download assets, edit the matching project entry.
//
// Rules:
//  - Put text inside single quotes ' ' and keep the commas.
//  - 'id' must be unique and each project must have a GLB 'model' preview.
//  - 'kind' is either 'assembly' (parts pull apart on hover)
//           or 'single' (one part that grows on hover).
//  - Add STEP/STL files to 'downloads' only after putting them in the project.
//    GLB 'model' files are used only for the 3D preview, never as downloads.
//  - For printable parts, include STEP and STL when both are available.
// ============================================================

const PROJECTS = [
  {
    id: 'iem',                                   // unique short name, no spaces
    name: 'IEM shell and acoustic design',       // big title on the screen
    kind: 'assembly',                            // 'assembly' or 'single'
    tag: 'Fusion 360, ANSYS',                    // software shown under the title
    text: 'An in-ear monitor shell assembly made up of the body, faceplate, and upper and lower nozzle components. Explore the complete model, then browse the individual parts and available CAD files.',
    model: 'models/IEM/glb files/IEM Assembly.glb',
    downloads: [
      { label: 'Complete IEM assembly STEP', url: 'models/IEM/step files/IEM Assembly.STEP' }
    ],
    parts: [
      {
        name: 'IEM Body',
        model: 'models/IEM/glb files/IEM Body.glb',
        downloads: [
          { label: 'IEM Body STEP', url: 'models/IEM/step files/IEM Body.STEP' }
        ]
      },
      {
        name: 'IEM Faceplate',
        model: 'models/IEM/glb files/IEM Faceplate.glb',
        downloads: [
          { label: 'IEM Faceplate STEP', url: 'models/IEM/step files/IEM Faceplate.STEP' }
        ]
      },
      {
        name: 'IEM Nozzle Top',
        model: 'models/IEM/glb files/IEM Nozzle Top.glb',
        downloads: [
          { label: 'IEM Nozzle Top STEP', url: 'models/IEM/step files/IEM Nozzle Top.STEP' }
        ]
      },
      {
        name: 'IEM Nozzle Bottom',
        model: 'models/IEM/glb files/IEM Nozzle Bottom.glb',
        downloads: [
          { label: 'IEM Nozzle Bottom STEP', url: 'models/IEM/step files/IEM Nozzle Bottom.STEP' }
        ]
      }
    ]
  },
  {
    id: 'IEC711',
    name: 'IEC711 Internal Geometry',
    kind: 'single',
    tag: 'Fusion 360, ANSYS',
    text: 'An internal geometry for the IEC 711 coupler, used in headphone acoustic testing. The model explores the ear-canal shape at the heart of a standardised measurement setup.',
    downloads: [],
    model: 'models/IEC_711_Coupler_Main.glb'
}
];
