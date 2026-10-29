# models folder

Put your 3D model files here, for example:

    models/gearbox-preview.glb
    models/IEM/glb files/IEM Assembly.glb

## Getting models ready (from SolidWorks / Fusion 360 / ANSYS)

Browsers can't read STEP or SolidWorks files directly. Convert them first:

1. Export the part or assembly as **STL** or **STEP** from your CAD software.
2. Open it in **Blender** (free, blender.org) and export as **GLB** (File > Export > glTF 2.0 (.glb)).
3. Keep each file small. Under about 5 MB each is a good target.

## Using a model in the site

Set the GLB path in the project's `model` field in `js/projects.js`. GLB files
are used only for the on-page preview. List actual STEP and STL files in the
project's `downloads` field to make them downloadable.

For an assembly preview, export its components as separate objects while
preserving their assembled positions. The site uses those separate objects
for the hover exploded view.

Keep your original CAD files (STEP, SLDPRT, F3D) somewhere safe too.
