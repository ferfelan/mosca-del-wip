// Revisión automática (sólo en desarrollo): ¿alguna pieza atraviesa otra?
// Toma los vértices de las piezas que se mueven (patas, cigarro, colillas) y
// mira si quedan dentro de un objeto sólido (escritorio, teclado, cabeza...).
import * as THREE from 'three';

function visibleDeVerdad(o) {
  for (let n = o; n; n = n.parent) if (!n.visible) return false;
  return true;
}

function dentroDePoligono(r, y, puntos) {
  let dentro = false;
  for (let i = 0, j = puntos.length - 1; i < puntos.length; j = i++) {
    const a = puntos[i];
    const b = puntos[j];
    if (a.y > y !== b.y > y && r < ((b.x - a.x) * (y - a.y)) / (b.y - a.y) + a.x) dentro = !dentro;
  }
  return dentro;
}

// p está en el espacio local del sólido; margen en esas mismas unidades
function estaDentro(geo, p, margen) {
  const prm = geo.parameters || {};
  switch (geo.type) {
    case 'SphereGeometry':
      return p.length() < prm.radius - margen;
    case 'CylinderGeometry': {
      const h = prm.height / 2;
      if (Math.abs(p.y) > h - margen) return false;
      const r = THREE.MathUtils.lerp(prm.radiusBottom, prm.radiusTop, (p.y + h) / prm.height);
      return Math.hypot(p.x, p.z) < r - margen;
    }
    case 'TorusGeometry': {
      const q = Math.hypot(p.x, p.y) - prm.radius;
      return Math.hypot(q, p.z) < prm.tube - margen;
    }
    case 'LatheGeometry':
      return dentroDePoligono(Math.hypot(p.x, p.z), p.y, prm.points);
    default: {
      if (!geo.boundingBox) geo.computeBoundingBox();
      const b = geo.boundingBox;
      return (
        p.x > b.min.x + margen &&
        p.x < b.max.x - margen &&
        p.y > b.min.y + margen &&
        p.y < b.max.y - margen &&
        p.z > b.min.z + margen &&
        p.z < b.max.z - margen
      );
    }
  }
}

function nombre(o) {
  const g = o.geometry?.type?.replace('Geometry', '') ?? '?';
  return `${o.parent?.type === 'Group' ? 'g/' : ''}${g}#${o.id}`;
}

export function revisarChoques(escena, { margenMundo = 0.004 } = {}) {
  escena.updateMatrixWorld(true);
  const solidos = [];
  const moviles = [];
  escena.traverse((o) => {
    if (!o.isMesh || !visibleDeVerdad(o)) return;
    if (o.userData.solido) solidos.push(o);
    if (o.userData.parteMosca || o.userData.colilla || o.userData.movil) moviles.push(o);
  });

  const v = new THREE.Vector3();
  const local = new THREE.Vector3();
  const escalaMundo = new THREE.Vector3();
  const resultados = {};
  const inversas = new Map(solidos.map((s) => [s, s.matrixWorld.clone().invert()]));

  for (const m of moviles) {
    const pos = m.geometry.attributes.position;
    for (const s of solidos) {
      if (s === m) continue;
      const tipo = s.userData.solido;
      if (tipo === m.userData.solido && !m.userData.movil) continue;
      // una pieza que se mueve no choca consigo misma (ej. la taza)
      if (m.userData.movil && s.userData.movil === m.userData.movil) continue;
      if (m.userData.ignorar === s) continue;
      // Las piezas de la mosca sólo se revisan contra su propio cuerpo si
      // son antebrazo, mano o cigarro (lo demás nace dentro del cuerpo).
      if (tipo === 'cuerpo' && !m.userData.revisaCuerpo) continue;
      if (m.userData.colilla && tipo !== 'oficina') continue;
      s.matrixWorld.decompose(new THREE.Vector3(), new THREE.Quaternion(), escalaMundo);
      const margen = margenMundo / Math.max(escalaMundo.x, escalaMundo.y, escalaMundo.z);
      const inv = inversas.get(s);
      let n = 0;
      for (let i = 0; i < pos.count; i++) {
        v.fromBufferAttribute(pos, i).applyMatrix4(m.matrixWorld);
        local.copy(v).applyMatrix4(inv);
        if (estaDentro(s.geometry, local, margen)) n++;
      }
      if (n > 0) {
        const clave = `${nombre(m)} -> ${tipo}:${nombre(s)}`;
        resultados[clave] = n;
      }
    }
  }
  return resultados;
}
