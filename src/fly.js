import * as THREE from 'three';

const POS_TRABAJANDO = new THREE.Vector3(0, 0.95, 1.0);
const POS_FUMANDO = new THREE.Vector3(-1.5, 0.95, 1.3);
const ROT_TRABAJANDO = Math.PI; // de espaldas a la cámara, mirando el monitor
const ROT_FUMANDO = Math.PI + Math.PI * 0.35;

function crearAla(lado) {
  const forma = new THREE.Shape();
  forma.moveTo(0, 0);
  forma.quadraticCurveTo(0.35 * lado, 0.1, 0.4 * lado, 0.35);
  forma.quadraticCurveTo(0.2 * lado, 0.3, 0, 0);
  const geo = new THREE.ShapeGeometry(forma);
  const mat = new THREE.MeshPhysicalMaterial({
    color: '#dbeafe',
    transparent: true,
    opacity: 0.35,
    roughness: 0.1,
    transmission: 0.6,
    side: THREE.DoubleSide,
  });
  return new THREE.Mesh(geo, mat);
}

export function crearMosca(scene) {
  const mosca = new THREE.Group();

  const cuerpoMat = new THREE.MeshStandardMaterial({ color: '#374151', roughness: 0.45 });

  const abdomen = new THREE.Mesh(new THREE.CapsuleGeometry(0.17, 0.22, 4, 12), cuerpoMat);
  abdomen.rotation.x = Math.PI / 2.1;
  abdomen.position.set(0, 0.32, 0);
  abdomen.castShadow = true;
  mosca.add(abdomen);

  const cabeza = new THREE.Mesh(new THREE.SphereGeometry(0.15, 16, 16), cuerpoMat);
  cabeza.position.set(0, 0.5, 0.2);
  cabeza.castShadow = true;
  mosca.add(cabeza);

  const ojoMat = new THREE.MeshStandardMaterial({ color: '#dc2626', roughness: 0.2, emissive: '#7f1d1d', emissiveIntensity: 0.3 });
  const ojoGeo = new THREE.SphereGeometry(0.075, 12, 12);
  const ojoIzq = new THREE.Mesh(ojoGeo, ojoMat);
  ojoIzq.position.set(-0.11, 0.52, 0.28);
  mosca.add(ojoIzq);
  const ojoDer = new THREE.Mesh(ojoGeo, ojoMat);
  ojoDer.position.set(0.11, 0.52, 0.28);
  mosca.add(ojoDer);

  const corbataMat = new THREE.MeshStandardMaterial({ color: '#b91c1c', roughness: 0.5 });
  const nudo = new THREE.Mesh(new THREE.ConeGeometry(0.045, 0.05, 8), corbataMat);
  nudo.position.set(0, 0.4, 0.33);
  nudo.rotation.x = Math.PI;
  mosca.add(nudo);
  const cintaCorbata = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.22, 8), corbataMat);
  cintaCorbata.position.set(0, 0.26, 0.3);
  cintaCorbata.rotation.x = Math.PI;
  mosca.add(cintaCorbata);

  const alaIzq = crearAla(1);
  alaIzq.position.set(-0.05, 0.42, -0.05);
  alaIzq.rotation.set(0.3, 0.6, 0.1);
  mosca.add(alaIzq);
  const alaDer = crearAla(-1);
  alaDer.position.set(0.05, 0.42, -0.05);
  alaDer.rotation.set(0.3, -0.6, -0.1);
  mosca.add(alaDer);

  const brazoMat = cuerpoMat;
  const brazoGeo = new THREE.CapsuleGeometry(0.025, 0.22, 4, 8);
  const brazoIzq = new THREE.Mesh(brazoGeo, brazoMat);
  brazoIzq.position.set(-0.12, 0.3, 0.33);
  brazoIzq.rotation.x = Math.PI / 2.3;
  mosca.add(brazoIzq);
  const brazoDer = new THREE.Mesh(brazoGeo, brazoMat);
  brazoDer.position.set(0.12, 0.3, 0.33);
  brazoDer.rotation.x = Math.PI / 2.3;
  mosca.add(brazoDer);

  // Cigarro (oculto salvo cuando fuma)
  const cigarro = new THREE.Group();
  const cigarroCuerpo = new THREE.Mesh(
    new THREE.CylinderGeometry(0.012, 0.012, 0.14, 6),
    new THREE.MeshStandardMaterial({ color: '#f8fafc' })
  );
  cigarro.add(cigarroCuerpo);
  const brasa = new THREE.Mesh(
    new THREE.SphereGeometry(0.014, 6, 6),
    new THREE.MeshStandardMaterial({ color: '#f97316', emissive: '#ea580c', emissiveIntensity: 0.8 })
  );
  brasa.position.y = 0.075;
  cigarro.add(brasa);
  cigarro.rotation.z = Math.PI / 2.5;
  cigarro.position.set(0.16, 0.48, 0.3);
  cigarro.visible = false;
  mosca.add(cigarro);

  // Gotas de sudor (ocultas salvo colapso)
  const gotaMat = new THREE.MeshStandardMaterial({ color: '#38bdf8', roughness: 0.2 });
  const gotas = [0, 1].map((i) => {
    const gota = new THREE.Mesh(new THREE.SphereGeometry(0.025, 8, 8), gotaMat);
    gota.position.set(-0.1 + i * 0.2, 0.58, 0.25);
    gota.visible = false;
    mosca.add(gota);
    return gota;
  });

  mosca.position.copy(POS_TRABAJANDO);
  mosca.rotation.y = ROT_TRABAJANDO;
  scene.add(mosca);

  // --- Humo (partículas simples) ---
  const humoGrupo = new THREE.Group();
  const humoMat = new THREE.MeshStandardMaterial({ color: '#cbd5e1', transparent: true, opacity: 0.5, roughness: 1 });
  const particulasHumo = [];
  for (let i = 0; i < 6; i++) {
    const p = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 8), humoMat.clone());
    p.visible = false;
    p.userData.vida = 0;
    humoGrupo.add(p);
    particulasHumo.push(p);
  }
  scene.add(humoGrupo);
  let acumuladorHumo = 0;

  let t = 0;

  function update(dtReal, juego) {
    t += dtReal;

    const objetivoPos = juego.fumando ? POS_FUMANDO : POS_TRABAJANDO;
    const objetivoRot = juego.fumando ? ROT_FUMANDO : ROT_TRABAJANDO;
    mosca.position.lerp(objetivoPos, Math.min(1, dtReal * 3));
    mosca.rotation.y += (objetivoRot - mosca.rotation.y) * Math.min(1, dtReal * 3);

    const colapsada = juego.nivel === 'Colapsada';
    const tembleque = colapsada ? (Math.random() - 0.5) * 0.02 : 0;
    mosca.position.x += tembleque;

    gotas.forEach((g, i) => {
      g.visible = colapsada;
      if (colapsada) g.position.y = 0.58 - (((t * 1.5 + i) % 1) * 0.3);
    });

    // Tipeo: bob de brazos mientras trabaja y no fuma
    if (!juego.fumando) {
      const bob = Math.sin(t * 14) * 0.03;
      brazoIzq.position.y = 0.3 + bob;
      brazoDer.position.y = 0.3 - bob;
    }

    // Alas: aleteo sutil permanente
    const aleteo = Math.sin(t * 20) * 0.08;
    alaIzq.rotation.y = 0.6 + aleteo;
    alaDer.rotation.y = -0.6 - aleteo;

    cigarro.visible = juego.fumando;

    if (juego.fumando) {
      acumuladorHumo += dtReal;
      if (acumuladorHumo > 0.25) {
        acumuladorHumo = 0;
        const libre = particulasHumo.find((p) => !p.visible);
        if (libre) {
          libre.visible = true;
          libre.userData.vida = 1.6;
          libre.position.copy(mosca.position).add(new THREE.Vector3(0.16, 0.55, 0.3));
          libre.material.opacity = 0.5;
          libre.scale.setScalar(1);
        }
      }
    }
    particulasHumo.forEach((p) => {
      if (!p.visible) return;
      p.userData.vida -= dtReal;
      p.position.y += dtReal * 0.25;
      p.position.x += dtReal * 0.05;
      const vidaFrac = Math.max(p.userData.vida / 1.6, 0);
      p.material.opacity = 0.5 * vidaFrac;
      p.scale.setScalar(1 + (1 - vidaFrac) * 1.5);
      if (p.userData.vida <= 0) p.visible = false;
    });
  }

  return { grupo: mosca, update };
}
