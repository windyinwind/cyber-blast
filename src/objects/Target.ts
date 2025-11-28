import * as THREE from 'three';
import { CyberColors } from '../utils/Colors';

export class Target extends THREE.Group {
  private rings: THREE.Mesh[] = [];
  private destroyed = false;

  constructor(position: THREE.Vector3) {
    super();
    this.position.copy(position);
    this.createTarget();
  }

  private createTarget(): void {
    const ringCount = 5;
    const scale = 2.0;
    for (let i = 0; i < ringCount; i++) {
      const radius = (0.5 - i * 0.08) * scale;
      const geometry = new THREE.RingGeometry(radius - 0.05 * scale, radius, 32);
      const material = new THREE.MeshStandardMaterial({
        color: i % 2 === 0 ? CyberColors.CYAN : CyberColors.MAGENTA,
        emissive: i % 2 === 0 ? CyberColors.CYAN : CyberColors.MAGENTA,
        emissiveIntensity: 0.5,
        side: THREE.DoubleSide
      });

      const ring = new THREE.Mesh(geometry, material);
      this.add(ring);
      this.rings.push(ring);
    }

    const centerGeo = new THREE.CircleGeometry(0.1 * scale, 32);
    const centerMat = new THREE.MeshStandardMaterial({
      color: CyberColors.YELLOW,
      emissive: CyberColors.YELLOW,
      emissiveIntensity: 1.0
    });
    const center = new THREE.Mesh(centerGeo, centerMat);
    this.add(center);
    this.rings.push(center);
  }

  hit(): void {
    if (this.destroyed) return;
    this.destroyed = true;

    let velocity = 0;
    const gravity = 0.02;
    const rotationSpeed = 0.1;

    const animate = () => {
      velocity += gravity;
      this.position.y -= velocity;

      this.rotation.x += rotationSpeed;
      this.rotation.z += rotationSpeed * 0.5;

      this.rings.forEach(ring => {
        const mat = ring.material as THREE.MeshStandardMaterial;
        mat.opacity -= 0.01;
        mat.transparent = true;
      });

      if (this.position.y > -5 && this.rings[0]) {
        const mat = this.rings[0].material as THREE.MeshStandardMaterial;
        if (mat.opacity > 0.01) {
          requestAnimationFrame(animate);
        } else {
          this.visible = false;
        }
      } else {
        this.visible = false;
      }
    };
    animate();
  }

  isDestroyed(): boolean {
    return this.destroyed;
  }
}
