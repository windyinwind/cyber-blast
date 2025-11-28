import * as THREE from 'three';
import { CyberColors } from '../utils/Colors';

export class LightingManager {
  private lights: THREE.Light[] = [];

  constructor(scene: THREE.Scene) {
    const ambientLight = new THREE.AmbientLight(CyberColors.PURPLE, 0.3);
    scene.add(ambientLight);
    this.lights.push(ambientLight);

    const mainLight = new THREE.DirectionalLight(CyberColors.CYAN, 1.5);
    mainLight.position.set(5, 10, 5);
    scene.add(mainLight);
    this.lights.push(mainLight);

    const fillLight = new THREE.DirectionalLight(CyberColors.MAGENTA, 0.8);
    fillLight.position.set(-5, 5, -5);
    scene.add(fillLight);
    this.lights.push(fillLight);

    const pointLight1 = new THREE.PointLight(CyberColors.CYAN, 2, 20);
    pointLight1.position.set(0, 3, 0);
    scene.add(pointLight1);
    this.lights.push(pointLight1);

    const pointLight2 = new THREE.PointLight(CyberColors.MAGENTA, 2, 20);
    pointLight2.position.set(0, 3, -5);
    scene.add(pointLight2);
    this.lights.push(pointLight2);
  }

  update(time: number): void {
    if (this.lights.length >= 5) {
      const pointLight1 = this.lights[3] as THREE.PointLight;
      const pointLight2 = this.lights[4] as THREE.PointLight;

      pointLight1.intensity = 2 + Math.sin(time * 2) * 0.5;
      pointLight2.intensity = 2 + Math.cos(time * 2) * 0.5;
    }
  }
}
