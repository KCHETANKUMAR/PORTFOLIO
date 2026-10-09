import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";

/**
 * Portrait studio lighting. Lights are fixed in world space while the subject
 * rotates, exactly like a subject on a turntable in a photo studio.
 *
 *   key  — large, soft, warm-neutral, front-left, slightly above
 *   fill — cool, low intensity, front-right (keeps the suit readable)
 *   rim  — cyan edge light, back-right  (the brand accent)
 *   kick — cold white edge light, back-left
 *   top  — faint hair light
 */
export function buildStudio(scene, renderer) {
  const rig = new THREE.Group();
  rig.name = "studio-rig";

  const key = new THREE.DirectionalLight(0xfff3e6, 2.35);
  key.position.set(-1.6, 1.7, 2.4);

  const fill = new THREE.DirectionalLight(0xcfe0ff, 0.62);
  fill.position.set(2.2, 0.5, 1.9);

  const rim = new THREE.DirectionalLight(0x38c6ff, 2.5);
  rim.position.set(2.3, 1.2, -2.1);

  const kick = new THREE.DirectionalLight(0xa9c4ff, 1.15);
  kick.position.set(-2.4, 0.9, -1.8);

  const top = new THREE.DirectionalLight(0xffffff, 0.55);
  top.position.set(0, 3, -0.4);

  const ambient = new THREE.HemisphereLight(0x8aa4c8, 0x06080c, 0.35);

  rig.add(key, fill, rim, kick, top, ambient);
  scene.add(rig);

  // Subtle image-based light for believable cloth/skin response.
  const pmrem = new THREE.PMREMGenerator(renderer);
  const envScene = new RoomEnvironment();
  const envRT = pmrem.fromScene(envScene, 0.04);
  scene.environment = envRT.texture;
  scene.environmentIntensity = 0.22;
  envScene.traverse((o) => {
    if (o.geometry) o.geometry.dispose();
    if (o.material) o.material.dispose();
  });
  pmrem.dispose();

  return {
    rig,
    lights: { key, fill, rim, kick, top, ambient },
    dispose() {
      envRT.dispose();
      scene.environment = null;
      scene.remove(rig);
      rig.traverse((o) => o.dispose && o.dispose());
    },
  };
}
