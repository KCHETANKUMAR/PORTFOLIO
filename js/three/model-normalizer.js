import * as THREE from "three";

/**
 * Normalises an arbitrary scanned model so that:
 *  - its height is exactly `height` world units, base sitting at y = 0
 *  - it rotates around the vertical axis through the HEAD/NECK (not the bbox
 *    centre, which is pulled sideways by the shoulders)
 *  - we know the largest horizontal radius (for framing at every angle)
 *
 * Returns { pivot, height, radius, report }.
 * `pivot` is an empty Group — rotate THIS, never the mesh.
 */
export function normalizeModel(root, { height = 1 } = {}) {
  root.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(root);
  const size = box.getSize(new THREE.Vector3());
  const scale = height / (size.y || 1);

  // Find the vertical axis through the head: centroid (x,z) of vertices in the top 40%.
  const yCut = box.min.y + size.y * 0.6;
  const v = new THREE.Vector3();
  let sx = 0,
    sz = 0,
    n = 0;
  root.traverse((o) => {
    if (!o.isMesh) return;
    const pos = o.geometry.attributes.position;
    const step = Math.max(1, Math.floor(pos.count / 40000)); // sample, don't scan 160k verts
    for (let i = 0; i < pos.count; i += step) {
      v.fromBufferAttribute(pos, i).applyMatrix4(o.matrixWorld);
      if (v.y >= yCut) {
        sx += v.x;
        sz += v.z;
        n++;
      }
    }
  });
  const cx = n ? sx / n : (box.min.x + box.max.x) / 2;
  const cz = n ? sz / n : (box.min.z + box.max.z) / 2;

  const holder = new THREE.Group(); // applies scale + recentring
  holder.add(root);
  holder.scale.setScalar(scale);
  holder.position.set(-cx * scale, -box.min.y * scale, -cz * scale);

  const pivot = new THREE.Group();
  pivot.name = "rotation-pivot";
  pivot.add(holder);

  // Largest horizontal reach from the axis (post-scale).
  const radius =
    Math.max(
      Math.abs(box.min.x - cx),
      Math.abs(box.max.x - cx),
      Math.abs(box.min.z - cz),
      Math.abs(box.max.z - cz),
    ) * scale;

  return {
    pivot,
    height,
    radius,
    report: {
      originalSize: size.toArray().map((n) => +n.toFixed(4)),
      scale: +scale.toFixed(4),
      headAxis: [+cx.toFixed(4), +cz.toFixed(4)],
      bboxCentre: box.getCenter(new THREE.Vector3()).toArray().map((n) => +n.toFixed(4)),
      radius: +radius.toFixed(4),
    },
  };
}
