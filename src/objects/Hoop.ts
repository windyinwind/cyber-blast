import * as THREE from 'three';
import { CyberColors } from '../utils/Colors';

export class Hoop extends THREE.Group {
  private rim: THREE.Mesh;
  private net: THREE.Line;
  readonly radius = 0.5;

  constructor(position: THREE.Vector3) {
    super();
    this.position.copy(position);

    const rimGeo = new THREE.TorusGeometry(this.radius, 0.05, 16, 32);
    const rimMat = new THREE.MeshStandardMaterial({
      color: CyberColors.CYAN,
      emissive: CyberColors.CYAN,
      emissiveIntensity: 1.0,
      metalness: 0.8,
      roughness: 0.2
    });
    this.rim = new THREE.Mesh(rimGeo, rimMat);
    this.rim.rotation.x = Math.PI / 2;
    this.add(this.rim);

    const netPoints: THREE.Vector3[] = [];
    const segments = 12;
    for (let i = 0; i <= segments; i++) {
      const angle = (i / segments) * Math.PI * 2;
      const x = Math.cos(angle) * this.radius;
      const z = Math.sin(angle) * this.radius;
      netPoints.push(new THREE.Vector3(x, 0, z));
      netPoints.push(new THREE.Vector3(x * 0.5, -0.6, z * 0.5));
    }

    const netGeo = new THREE.BufferGeometry().setFromPoints(netPoints);
    const netMat = new THREE.LineBasicMaterial({
      color: CyberColors.MAGENTA,
      linewidth: 2
    });
    this.net = new THREE.Line(netGeo, netMat);
    this.add(this.net);

    const backboardGeo = new THREE.BoxGeometry(1.6, 1.2, 0.05);
    const backboardMat = new THREE.MeshStandardMaterial({
      color: CyberColors.PURPLE,
      emissive: CyberColors.PURPLE,
      emissiveIntensity: 0.3,
      transparent: true,
      opacity: 0.6
    });
    const backboard = new THREE.Mesh(backboardGeo, backboardMat);
    backboard.position.z = -this.radius;
    backboard.position.y = 0.3;
    this.add(backboard);
  }

  checkScore(ball: THREE.Vector3, previousBall: THREE.Vector3): boolean {
    const rimY = this.position.y;
    const rimCenter = new THREE.Vector2(this.position.x, this.position.z);

    if (previousBall.y > rimY && ball.y <= rimY) {
      const ballPos2D = new THREE.Vector2(ball.x, ball.z);
      const distance = ballPos2D.distanceTo(rimCenter);

      if (distance < this.radius * 0.9) {
        return true;
      }
    }

    return false;
  }

  animate(): void {
    const pulsate = () => {
      let intensity = 1.0;
      let increasing = false;

      const pulse = () => {
        intensity += increasing ? 0.05 : -0.05;
        if (intensity >= 2.0) increasing = false;
        if (intensity <= 1.0) {
          increasing = true;
          return;
        }

        const rimMat = this.rim.material as THREE.MeshStandardMaterial;
        rimMat.emissiveIntensity = intensity;

        requestAnimationFrame(pulse);
      };
      pulse();
    };
    pulsate();
  }
}
