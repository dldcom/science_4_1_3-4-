# Volcano asset research

Research date: 2026-06-14

## Selected first-prototype approach

Use procedural terrain geometry with a real CC0 PBR rock material.

- Rock material: [Gray Rocks, Poly Haven](https://polyhaven.com/a/gray_rocks)
- License: CC0
- Runtime texture set: 1K diffuse, OpenGL normal, roughness
- Download size: about 2.8 MB
- Approximate desktop scene complexity: 52K triangles, 6 draw calls
- Tablet mode: lower terrain subdivisions, particles, antialiasing, and pixel ratio

This approach was selected because it gives us full control over the crater, lava
paths, underground cutaway, and cooling animation without depending on a large
third-party model.

## Sketchfab volcano candidates

All candidates below are downloadable and licensed CC Attribution. Sketchfab's
download API requires separate Sketchfab authentication, and downloaded assets
would still need optimization and attribution.

| Candidate | Faces | Materials | Assessment |
| --- | ---: | ---: | --- |
| [volcano by gelmi.com.br](https://sketchfab.com/3d-models/volcano-136292fd63fc43a5b446d868fcaa7751) | 157,203 | 1 | Visually strongest crater, but above the preferred tablet budget before optimization |
| [Volcano V1 by JayT3D](https://sketchfab.com/3d-models/volcano-v1-cf92d35ac0c34b71a44870959ed3abc3) | 80,000 | 1 | Good performance/visual balance, but has baked lava that limits animation control |
| [volcano with magma by sv1nks](https://sketchfab.com/3d-models/volcano-with-magma-590d56ceb7ec467c83b67c3f3a98a773) | 24,900 | 1 | Lightweight, but visually reads as a small display object |
| [Erupting volcano by Walter Araujo](https://sketchfab.com/3d-models/vulcao-em-erupcao-erupting-volcano-fe36561470994889b7f7f6a3e6c1a538) | 22,402 | 1 | Lightweight, but material detail is too stylized |

## Decision

Keep `Volcano V1` as the fallback external-model option. Continue the first
prototype with the CC0 PBR procedural terrain, then compare both approaches only
if the prototype still lacks the desired realism after lighting and lava-shader
work.

## Lava PBR research

### Selected candidate: ambientCG Lava002

- Source: https://ambientcg.com/view?id=Lava002
- License: CC0
- Look: mostly cooled black rope-like crust with visible hot seams
- Best use: hybrid texture + animated shader for the flowing lava ribbons

The 1K JPG package contains:

| Map | Size | Planned use |
| --- | ---: | --- |
| Color | 1.67 MB | Real cooled crust color and fine surface detail |
| Emission | 1.44 MB | Mask showing the hot glowing regions |
| NormalGL | 2.28 MB | Small raised folds and crust detail |
| Roughness | 0.31 MB | Matte black crust response |
| Displacement | 0.40 MB | Not planned for tablet runtime |

Recommended runtime combinations:

- Lowest-cost tablet mode: Color + Emission, about 3.1 MB
- Standard mode: Color + Emission + NormalGL + Roughness, about 5.7 MB
- Do not use Displacement at runtime; it adds geometry cost and is unnecessary
  for the narrow lava ribbons.

### Other ambientCG candidates

All five Lava materials are CC0 and provide Color, Displacement, Normal,
Roughness, and Emission maps.

| Candidate | Assessment |
| --- | --- |
| Lava001 | Strong flowing folds and bright seams; good alternate for close-up scenes |
| Lava002 | Best cooled-crust balance for the basalt lesson |
| Lava003 | Warmer and less cooled; suitable for active lava close-up |
| Lava004 | Mostly molten orange surface; useful before cooling but weak for crust formation |
| Lava005 | Detailed warm folds but fewer clearly glowing cracks |

### Rejected candidate

Poly Haven `Volcanic Rock Tiles` is CC0 and technically lightweight, but it is a
man-made paving material made from volcanic rock. It is unsuitable for depicting
natural flowing or cooling lava.
