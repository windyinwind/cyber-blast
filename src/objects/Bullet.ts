import * as THREE from 'three';
import { CyberColors } from '../utils/Colors';

export class Bullet extends THREE.Mesh {
  velocity: THREE.Vector3;
  active = false;
  private readonly speed = 20;

  constructor() {
    const geometry = new THREE.SphereGeometry(0.05, 8, 8);
    const material = new THREE.MeshStandardMaterial({
      color: CyberColors.YELLOW,
      emissive: CyberColors.YELLOW,
      emissiveIntensity: 2.0
    });

    super(geometry, material);
    this.velocity = new THREE.Vector3();
    this.visible = false;
  }

  shoot(startPos: THREE.Vector3, direction: THREE.Vector3): void {
    console.log('Bullet.shoot() - pos:', startPos, 'dir:', direction);
    this.position.copy(startPos);
    this.velocity.copy(direction).normalize().multiplyScalar(this.speed);
    this.active = true;
    this.visible = true;
    console.log('Bullet active, velocity:', this.velocity);
  }

  update(deltaTime: number): void {
    if (!this.active) return;

    this.position.add(this.velocity.clone().multiplyScalar(deltaTime));

    if (this.position.length() > 50) {
      this.reset();
    }
  }

  reset(): void {
    this.active = false;
    this.visible = false;
  }
}
