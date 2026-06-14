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

## Performance strategy

- One shared tablet-safe quality level on both PC and tablet
- Procedural crater terrain: 112 segments
- 1K PBR textures
- Pixel ratio capped at 1.25 and smoke capped at 90 particles
- One active WebGL scene
- Lava002 uses Color, Emission, NormalGL, and Roughness maps. The crater stays
  procedural and hot; the photographed cooled crust blends in farther downhill.
- Lava paths, widths, and one small branch are calculated once at startup by
  following the terrain slope. No per-frame fluid simulation is used.
