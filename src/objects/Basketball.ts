import * as THREE from 'three';
import { CyberColors } from '../utils/Colors';

export class Basketball extends THREE.Mesh {
  private velocity: THREE.Vector3;
  private gravity = -9.8;
  private active = false;

  constructor() {
    const geometry = new THREE.SphereGeometry(0.25, 32, 32);
    const material = new THREE.MeshStandardMaterial({
      color: CyberColors.YELLOW,
      emissive: CyberColors.YELLOW,
      emissiveIntensity: 0.7,
      roughness: 0.5,
      metalness: 0.3
    });

    super(geometry, material);
    this.velocity = new THREE.Vector3();
    this.visible = false;
  }

  shoot(startPos: THREE.Vector3, direction: THREE.Vector3, power: number): void {
    this.position.copy(startPos);
    this.velocity.copy(direction).multiplyScalar(power);
    this.active = true;
    this.visible = true;
  }

  update(deltaTime: number): void {
    if (!this.active) return;

    this.velocity.y += this.gravity * deltaTime;

    this.position.x += this.velocity.x * deltaTime;
    this.position.y += this.velocity.y * deltaTime;
    this.position.z += this.velocity.z * deltaTime;

    this.rotation.x += 0.1;
    this.rotation.y += 0.05;

    if (this.position.y < 0) {
      this.reset();
    }
  }

  reset(): void {
    this.active = false;
    this.visible = false;
    this.velocity.set(0, 0, 0);
  }

  isActive(): boolean {
    return this.active;
  }
}
