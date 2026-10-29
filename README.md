# Mrinmoy’s Studio: how this website is organised

Welcome! This guide explains every file, so you can find and change things easily.

## Folder structures

    mrinmoy-studio/
    ├── index.html          The page layout: all the text and where things sit
    ├── css/
    │   └── style.css       Colours, fonts, spacing, and animations of the look
    ├── js/
    │   ├── projects.js     YOUR PROJECT LIST: names, descriptions, downloads
    │   ├── panel.js        Project details pages and downloads
    │   ├── viewer.js       The 3D viewers and project screens
    │   ├── navigation.js   Page changes and the fly-through animation
    │   └── background.js   The moving dots in the background
    ├── models/             Your 3D model files (.glb)
    ├── images/             Pictures
    └── README.md           This file

## What to edit for common changes

| I want to...                         | Edit this file                 |
|--------------------------------------|--------------------------------|
| Change my name, title or About text  | index.html (look for "About")  |
| Change the email / LinkedIn links    | index.html (look for "Contact")|
| Add or change a project              | js/projects.js                 |
| Change a project's 3D preview       | the GLB model in `models/`      |
| Change colours                       | css/style.css (top section)    |
| Add a journal post                   | index.html (copy a `post` block)|
| Change the background dots           | js/background.js (top section) |

## How to open and see the site

1. Open the `mrinmoy-studio` folder in **VS Code** (File > Open Folder).
2. Install the **Live Server** extension (search for it in the Extensions panel).
3. Right-click `index.html` and choose **Open with Live Server**.

Your browser opens the site. To check it in Edge, copy the Live Server URL
(usually `http://127.0.0.1:5500/`) into Edge. Use that same URL instead of
double-clicking `index.html` or opening the page as a `file://` URL. The 3D
previews load GLB files through browser requests, and local-file security
behavior can vary between browsers.

The site needs an internet connection the first time, because the 3D library
(Three.js) and the fonts are loaded from the web.

## Adding a new project (step by step)

1. Open `js/projects.js`.
2. Copy one whole block from `{` to `},` and paste it after the last one.
3. Change `id` to a new short name (for example `gearbox`).
4. Change `name`, `tag` and `text`. Set `model` to the GLB preview file:

       model: 'models/gearbox-preview.glb',

5. Add real STEP/STL files to the `models/` folder, then list downloadable CAD files in
   `downloads`:

       downloads: [
         { label: 'Assembly STEP', url: 'models/gearbox.step' },
         { label: 'Printable component STL', url: 'models/component.stl' }
       ],

   The GLB is never shown as a download. Add an STL only for parts intended
   for 3D printing; if it is printable, offer both STEP and STL when available.
6. For an assembly, add an entry in `parts` for each real component. Give
   each part a `name`, its own `model` GLB preview path, and STEP/STL
   `downloads` for files that actually exist:

       parts: [
         {
           name: 'Rotor',
           model: 'models/rotor-preview.glb',
           downloads: [
             { label: 'Rotor STEP', url: 'models/rotor.step' }
           ]
         }
       ]

   Each part appears with its own 3D preview and download buttons on the
   detail page. Only add paths for files that are actually present.
7. Save and check the page. Click near the center of the project model, within
   the same circular area that activates its hover effect, to open the detail
   page. Use **Back to projects** to return to the same project slide.

The project viewer requires a GLB preview for each listed project. For an
assembly, its GLB must keep components as separate objects for the explode
animation to move them apart.

## Common mistakes and fixes

- **A comma is missing or extra** → the page goes blank. Open the browser
  console (F12) to see the line number in the error.
- **Quotes don't match** → use the same type of quote at the start and end
  (' with ', or " with ").
- **Wrong model path** → confirm the GLB path in `projects.js` matches its location and filename.
- **Nothing shows in 3D** → check your internet connection (Three.js loads from the web).
- **Models show in one browser but not Edge** → open the site through Live Server and
  use the same `http://127.0.0.1:5500/` URL in Edge. If they are still missing,
  open Edge DevTools with F12 and check **Console** and **Network** for errors
  loading the `.glb` files or creating a WebGL context. Check that Edge has
  hardware acceleration enabled, then restart Edge.
- **Change not showing** → save the file (Ctrl+S / Cmd+S) and refresh the browser.

## Putting the site online (later)

GitHub Pages is free:
1. Create a GitHub account and a new repository.
2. Upload everything in this folder.
3. In the repository settings, turn on **Pages**, and choose the main branch.
4. You get a link like `https://yourname.github.io/studio`.

## Words you'll see

- **HTML**: the structure and words of the page.
- **CSS**: how it looks (colours, sizes, positions).
- **JS (JavaScript)**: how it behaves (clicks, animations, 3D).
- **GLB**: a 3D model file format for the web.
- **Live Server**: a tool that refreshes your page as you save.
