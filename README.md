# Volcano scene prototype

First-stage visual and tablet-performance prototype for the basalt/granite learning app.

## Run

Double-click `실행하기.bat`. It opens the prototype at:

`http://127.0.0.1:4173`

Do not open `index.html` directly through `file://`. Browser security rules block
JavaScript modules and texture files loaded that way.

## Asset license

- `gray_rocks_*_1k.jpg`: Poly Haven, CC0
  - Source: https://polyhaven.com/a/gray_rocks
- `assets/lava002/*`: ambientCG Lava002, CC0
  - Source: https://ambientcg.com/view?id=Lava002
- `assets/lava004/*`: ambientCG Lava004, CC0
  - Source: https://ambientcg.com/view?id=Lava004
- `assets/basalt/*`: ambientCG Rock041, CC0
  - Source: https://ambientcg.com/view?id=Rock041

## Performance strategy

- One shared tablet-safe quality level on both PC and tablet
- Procedural crater terrain: 112 segments
- 1K PBR textures
- Pixel ratio capped at 1.25 and animated particles capped at 100 total
- One active WebGL scene
- Lava002 uses Color, Emission, NormalGL, and Roughness maps. The crater stays
  procedural and hot; the photographed cooled crust blends in farther downhill.
- Lava paths, widths, and one small branch are calculated once at startup by
  following the terrain slope. No per-frame fluid simulation is used.
- Four lava paths use deliberately different widths. One main path is broad,
  while secondary paths and the branch remain narrower.
- Surface bubbles and rising volcanic gas share two lightweight point-cloud
  draw calls. They fade as cooling completes.
- At full cooling, Rock041 Color, NormalGL, and Roughness maps blend over the
  lava surface. A shader adds sparse pores without extra geometry.
- The scene starts without lava. Each click creates one finite eruption with
  3-5 newly calculated downhill paths.
- Each point changes automatically from Lava004 to Lava002 and then Rock041
  according to the time since lava reached that point.
- Once an eruption fully solidifies, its meshes merge into one accumulated
  basalt geometry. Existing basalt remains visible during later eruptions.
