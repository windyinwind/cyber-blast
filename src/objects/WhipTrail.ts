import * as THREE from 'three';
import { CyberColors } from '../utils/Colors';

export class WhipTrail extends THREE.Group {
  private points: THREE.Vector3[] = [];
  private readonly maxPoints = 25; // Fewer points for more snake-like flowing
  private geometry: THREE.BufferGeometry;
  private glowGeometry: THREE.BufferGeometry;
  private outerGlowGeometry: THREE.BufferGeometry;
  private mainLine: THREE.Line;

  constructor() {
    super();

    // Outer glow - very soft and wide like snake skin
    this.outerGlowGeometry = new THREE.BufferGeometry();
    const outerGlowMaterial = new THREE.LineBasicMaterial({
      color: CyberColors.MAGENTA,
      linewidth: 25,
      transparent: true,
      opacity: 0.08,
      blending: THREE.AdditiveBlending
    });
    const outerGlowLine = new THREE.Line(this.outerGlowGeometry, outerGlowMaterial);
    this.add(outerGlowLine);

    // Middle glow - soft flowing
    this.glowGeometry = new THREE.BufferGeometry();
    const glowMaterial = new THREE.LineBasicMaterial({
      color: CyberColors.MAGENTA,
      linewidth: 12,
      transparent: true,
      opacity: 0.25,
      blending: THREE.AdditiveBlending
    });
    const glowLine = new THREE.Line(this.glowGeometry, glowMaterial);
    this.add(glowLine);

    // Main whip line - soft core
    this.geometry = new THREE.BufferGeometry();
    const material = new THREE.LineBasicMaterial({
      color: CyberColors.MAGENTA,
      linewidth: 5,
      transparent: true,
      opacity: 0.5,
      blending: THREE.AdditiveBlending
    });
    this.mainLine = new THREE.Line(this.geometry, material);
    this.add(this.mainLine);
  }

  addPoint(point: THREE.Vector3): void {
    this.points.push(point.clone());

    if (this.points.length > this.maxPoints) {
      this.points.shift();
    }

    this.updateGeometry();
  }

  private updateGeometry(): void {
    if (this.points.length < 2) {
      return;
    }

    // Create very smooth, flowing curve like a snake with high tension
    const curve = new THREE.CatmullRomCurve3(this.points, false, 'catmullrom', 0.3);
    // Much more interpolation points for ultra-smooth snake-like flow
    const smoothPoints = curve.getPoints(Math.max(this.points.length * 5, 100));

    this.geometry.setFromPoints(smoothPoints);
    this.glowGeometry.setFromPoints(smoothPoints);
    this.outerGlowGeometry.setFromPoints(smoothPoints);
  }

  clear(): void {
    this.points = [];
    this.updateGeometry();
  }

  fade(): void {
    if (this.points.length > 0) {
      this.points.shift();
      this.updateGeometry();
    }
  }

  getPoints(): THREE.Vector3[] {
    return this.points;
  }

  getTrailLength(): number {
    return this.points.length;
  }
}
