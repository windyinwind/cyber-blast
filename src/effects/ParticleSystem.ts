import * as THREE from 'three';

export class ParticleSystem {
  private particles: THREE.Points;
  private velocities: THREE.Vector3[] = [];
  private lifetimes: number[] = [];
  private maxLifetime = 1.0;
  private particleCount: number;
  private geometry: THREE.BufferGeometry;
  private positions: Float32Array;

  constructor(
    count: number,
    color: number,
    size: number = 0.05
  ) {
    this.particleCount = count;
    this.positions = new Float32Array(count * 3);

    this.geometry = new THREE.BufferGeometry();
    this.geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));

    // Create a circular texture for round particles
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d')!;

    // Draw a soft circular gradient
    const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
    gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.5)');
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 64, 64);

    const texture = new THREE.CanvasTexture(canvas);

    const material = new THREE.PointsMaterial({
      color,
      size,
      map: texture,
      transparent: true,
      opacity: 1.0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true
    });

    this.particles = new THREE.Points(this.geometry, material);
    this.particles.visible = false;
  }

  burst(position: THREE.Vector3, velocity: number = 5): void {
    for (let i = 0; i < this.particleCount; i++) {
      const i3 = i * 3;
      // Add random spread to starting position for wider coverage
      const spreadRadius = 0.5;
      this.positions[i3] = position.x + (Math.random() - 0.5) * spreadRadius;
      this.positions[i3 + 1] = position.y + (Math.random() - 0.5) * spreadRadius;
      this.positions[i3 + 2] = position.z + (Math.random() - 0.5) * spreadRadius;

      // Create explosive burst in all directions with higher velocity
      const vel = new THREE.Vector3(
        (Math.random() - 0.5) * 2,
        (Math.random() - 0.5) * 2,
        (Math.random() - 0.5) * 2
      ).normalize().multiplyScalar(velocity * (0.5 + Math.random() * 1.5));

      this.velocities[i] = vel;
      this.lifetimes[i] = this.maxLifetime;
    }

    this.geometry.attributes.position.needsUpdate = true;
    this.particles.visible = true;
  }

  update(deltaTime: number): void {
    let allDead = true;

    for (let i = 0; i < this.particleCount; i++) {
      if (this.lifetimes[i] > 0) {
        allDead = false;

        const i3 = i * 3;
        const vel = this.velocities[i];

        this.positions[i3] += vel.x * deltaTime;
        this.positions[i3 + 1] += vel.y * deltaTime;
        this.positions[i3 + 2] += vel.z * deltaTime;

        vel.y -= 5 * deltaTime;

        this.lifetimes[i] -= deltaTime;
      }
    }

    if (allDead) {
      this.particles.visible = false;
    } else {
      this.geometry.attributes.position.needsUpdate = true;

      const mat = this.particles.material as THREE.PointsMaterial;
      const avgLife = this.lifetimes.reduce((a, b) => a + b, 0) / this.particleCount;
      mat.opacity = avgLife / this.maxLifetime;
    }
  }

  getObject(): THREE.Points {
    return this.particles;
  }
}
