# K Chetan Kumar — 3D Portfolio

Static site (no build step). Real Three.js/WebGL rendering of your own GLB.

## Run
```bash
cd portfolio
python3 -m http.server 5173      # or: npx serve .
# open http://localhost:5173
```
ES modules require a web server — opening index.html via file:// will not work.

## Edit your content — `js/config/site-config.js`
Name, tagline, links, education, certifications, training, projects and the model paths all live there.
- Empty strings hide their element automatically (e.g. empty `github` hides every GitHub button).
- Add certification `date` / `credentialUrl`, a GitHub URL, more `projects`, etc.
- `model.yawOffsetDeg` — if 0° is not face-forward on a new model, adjust here.

## 3D model
Your original GLB was 80 MB (900k vertices, three 4K PNG textures) — too heavy for the web.
Optimised copies (same mesh/texture content, reduced) are in `assets/`:
- `chetan-kumar.glb`      2.8 MB — desktop (≈160k verts, 2K WebP textures, Meshopt)
- `chetan-kumar-lite.glb` 1.1 MB — phones / low-memory devices (1K textures)
Re-generate from the original with glTF-Transform:
```bash
npx @gltf-transform/cli simplify in.glb a.glb --ratio 0.12 --error 0.0008
npx @gltf-transform/cli resize a.glb b.glb --width 2048 --height 2048
npx @gltf-transform/cli webp b.glb c.glb --quality 88
npx @gltf-transform/cli meshopt c.glb chetan-kumar.glb --level medium
```

## Structure
```
index.html
css/      tokens · base · glass · nav · loader · hero · sections · responsive
js/
  main.js                 bootstrap
  config/site-config.js   ALL editable content
  three/                  portrait-viewer · rotation-controller · studio · model-normalizer
  ui/                     loader · hud · nav · reveal · pointer-fx · render-sections · modal
  utils/                  env · dom
vendor/three/             three.js r186 (minified, local — works offline)
assets/                   glb ×2 · resume.pdf · portrait.jpg · og-image.jpg · favicon.svg · font
```

## Before deploying
- Add `<link rel="canonical">` and an absolute `og:image` URL in `index.html`.
- Optional: set `seo.siteUrl` in the config.
