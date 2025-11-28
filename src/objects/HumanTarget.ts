import * as THREE from 'three';
import { CyberColors } from '../utils/Colors';

export class HumanTarget extends THREE.Group {
  private parts: THREE.Mesh[] = [];
  private destroyed = false;

  constructor(position: THREE.Vector3) {
    super();
    this.position.copy(position);
    this.createHumanTarget();
  }

  private createHumanTarget(): void {
    const headGeo = new THREE.SphereGeometry(0.3, 16, 16);
    const headMat = new THREE.MeshStandardMaterial({
      color: CyberColors.CYAN,
      emissive: CyberColors.CYAN,
      emissiveIntensity: 0.7,
      wireframe: true
    });
    const head = new THREE.Mesh(headGeo, headMat);
    head.position.y = 1.4;
    this.add(head);
    this.parts.push(head);

    const bodyGeo = new THREE.BoxGeometry(0.6, 1.0, 0.3);
    const bodyMat = new THREE.MeshStandardMaterial({
      color: CyberColors.MAGENTA,
      emissive: CyberColors.MAGENTA,
      emissiveIntensity: 0.7,
      wireframe: true
    });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 0.5;
    this.add(body);
    this.parts.push(body);

    const leftArmGeo = new THREE.BoxGeometry(0.15, 0.8, 0.15);
    const armMat = new THREE.MeshStandardMaterial({
      color: CyberColors.PURPLE,
      emissive: CyberColors.PURPLE,
      emissiveIntensity: 0.7,
      wireframe: true
    });
    const leftArm = new THREE.Mesh(leftArmGeo, armMat.clone());
    leftArm.position.set(-0.45, 0.5, 0);
    this.add(leftArm);
    this.parts.push(leftArm);

    const rightArm = new THREE.Mesh(leftArmGeo, armMat.clone());
    rightArm.position.set(0.45, 0.5, 0);
    this.add(rightArm);
    this.parts.push(rightArm);

    const leftLegGeo = new THREE.BoxGeometry(0.2, 1.0, 0.2);
    const legMat = new THREE.MeshStandardMaterial({
      color: CyberColors.YELLOW,
      emissive: CyberColors.YELLOW,
      emissiveIntensity: 0.7,
      wireframe: true
    });
    const leftLeg = new THREE.Mesh(leftLegGeo, legMat.clone());
    leftLeg.position.set(-0.2, -0.5, 0);
    this.add(leftLeg);
    this.parts.push(leftLeg);

    const rightLeg = new THREE.Mesh(leftLegGeo, legMat.clone());
    rightLeg.position.set(0.2, -0.5, 0);
    this.add(rightLeg);
    this.parts.push(rightLeg);
  }

  hit(): void {
    if (this.destroyed) return;
    this.destroyed = true;

    let velocity = 0;
    const gravity = 0.02;
    const rotationSpeed = 0.15;
    let explosionForce = new THREE.Vector3(
      (Math.random() - 0.5) * 0.1,
      0,
      (Math.random() - 0.5) * 0.1
    );

    const animate = () => {
      velocity += gravity;
      this.position.y -= velocity;
      this.position.add(explosionForce);

      this.rotation.x += rotationSpeed;
      this.rotation.z += rotationSpeed * 0.7;

      this.parts.forEach(part => {
        const mat = part.material as THREE.MeshStandardMaterial;
        mat.opacity -= 0.01;
        mat.transparent = true;
      });

      if (this.position.y > -5 && this.parts[0]) {
        const mat = this.parts[0].material as THREE.MeshStandardMaterial;
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
