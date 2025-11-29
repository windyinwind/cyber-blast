import * as THREE from 'three';
import { BaseMode } from './BaseMode';
import { GestureData, GestureType } from '../types/Gesture';
import { Target } from '../objects/Target';
import { Bullet } from '../objects/Bullet';
import { ParticleSystem } from '../effects/ParticleSystem';
import { GunSound } from '../audio/GunSound';
import { AudioEngine } from '../audio/AudioEngine';
import { CyberColors } from '../utils/Colors';
import { isMobile } from '../utils/DeviceDetector';

export class GunMode extends BaseMode {
  private targets: Target[] = [];
  private bullets: Bullet[] = [];
  private bulletPool: Bullet[] = [];
  private explosions: ParticleSystem[] = [];
  private gunSound: GunSound;
  private lastShootTime = 0;
  private readonly shootCooldown: number;
  private fingerTipPosition: THREE.Vector3 = new THREE.Vector3();
  private respawnTimeouts: number[] = [];
  private isActive = false;

  constructor(scene: THREE.Scene, camera: THREE.Camera, audioEngine: AudioEngine) {
    super(scene, camera);
    this.gunSound = new GunSound(audioEngine);

    // Mobile: easier shooting with shorter cooldown
    this.shootCooldown = isMobile() ? 0.15 : 0.3;

    for (let i = 0; i < 10; i++) {
      const bullet = new Bullet();
      this.bulletPool.push(bullet);
      this.scene.add(bullet);
    }

    // Optimize for mobile: fewer explosions and particles
    const mobile = isMobile();
    const explosionCount = mobile ? 4 : 8;
    const particleCount = mobile ? 200 : 400;

    for (let i = 0; i < explosionCount; i++) {
      const color = i % 2 === 0 ? CyberColors.CYAN : CyberColors.YELLOW;
      const explosion = new ParticleSystem(particleCount, color, 0.25);
      this.explosions.push(explosion);
      this.scene.add(explosion.getObject());
    }
  }

  activate(): void {
    this.isActive = true;
    console.log('GunMode activated, spawning targets...');
    const targetCount = isMobile() ? 1 : 3;
    this.spawnTargets(targetCount);
    console.log('Targets spawned:', this.targets.length);
  }

  deactivate(): void {
    this.isActive = false;

    // Clear all pending respawn timeouts
    this.respawnTimeouts.forEach(timeout => clearTimeout(timeout));
    this.respawnTimeouts = [];

    // Force remove all targets including destroyed ones
    this.targets.forEach(target => {
      if (target.parent) {
        this.scene.remove(target);
      }
    });
    this.targets = [];

    // Reset all bullets
    this.bullets.forEach(bullet => {
      bullet.reset();
    });
    this.bullets = [];

    // Return bullets to pool
    this.bulletPool.forEach(bullet => {
      bullet.reset();
    });
  }

  update(deltaTime: number, gestureData: GestureData | null): void {
    // Update finger tip position for aiming
    if (gestureData && (gestureData.type === GestureType.GUN || gestureData.type === GestureType.SHOOT)) {
      // Convert normalized MediaPipe coordinates to 3D world position
      const x = (gestureData.position.x - 0.5) * 10;
      const y = (1 - gestureData.position.y) * 5 - 0.8; // Lower by 0.8 units
      const z = gestureData.position.z * -5;
      this.fingerTipPosition.set(x, y, z);
    }

    this.bullets.forEach((bullet, index) => {
      bullet.update(deltaTime);

      if (bullet.active) {
        this.targets.forEach(target => {
          if (!target.isDestroyed()) {
            const distance = bullet.position.distanceTo(target.position);
            if (distance < 1.0) {
              target.hit();
              bullet.reset();

              this.triggerExplosion(target.position);

              const timeout = setTimeout(() => {
                this.scene.remove(target);
                const idx = this.targets.indexOf(target);
                if (idx > -1) this.targets.splice(idx, 1);

                if (this.targets.length === 0) {
                  const targetCount = isMobile() ? 1 : 3;
                  this.spawnTargets(targetCount);
                }
              }, 3000);
              this.respawnTimeouts.push(timeout);
            }
          }
        });
      }

      if (!bullet.active) {
        this.bullets.splice(index, 1);
        this.bulletPool.push(bullet);
      }
    });

    this.explosions.forEach(explosion => explosion.update(deltaTime));

    // Mobile: allow both GUN and SHOOT gestures to trigger shooting for easier triggering
    const mobile = isMobile();
    const canShoot = gestureData && (
      gestureData.type === GestureType.SHOOT ||
      (mobile && gestureData.type === GestureType.GUN)
    );

    if (canShoot) {
      const now = Date.now() / 1000;
      if (now - this.lastShootTime > this.shootCooldown) {
        this.shoot();
        this.lastShootTime = now;
      }
    }
  }

  private shoot(): void {
    const bullet = this.bulletPool.pop();
    if (!bullet) return;

    // Calculate direction from camera to finger tip position
    const direction = new THREE.Vector3()
      .subVectors(this.fingerTipPosition, this.camera.position)
      .normalize();

    console.log('Shooting from camera:', this.camera.position, 'toward finger:', this.fingerTipPosition, 'direction:', direction);

    bullet.shoot(this.camera.position.clone(), direction);
    this.bullets.push(bullet);

    this.gunSound.play();
  }

  private spawnTargets(count: number): void {
    if (!this.isActive) {
      console.log('GunMode not active, skipping target spawn');
      return;
    }

    const spacing = 3.0;
    const startX = -(count - 1) * spacing / 2;

    for (let i = 0; i < count; i++) {
      const x = startX + i * spacing;
      const y = 0.8;
      const z = -6;

      const target = new Target(new THREE.Vector3(x, y, z));
      target.lookAt(this.camera.position);
      this.scene.add(target);
      this.targets.push(target);
      console.log(`Target ${i} created at position:`, x, y, z);
    }
  }

  private triggerExplosion(position: THREE.Vector3): void {
    // ULTRA MASSIVE FULL-SCREEN explosions
    const availableExplosions = this.explosions.filter(e => !e.getObject().visible);

    // INSTANT - Center impact (BIGGEST)
    if (availableExplosions[0]) {
      availableExplosions[0].burst(position, 20);
    }

    // INSTANT - Side explosions
    if (availableExplosions[1]) {
      const leftPos = position.clone();
      leftPos.x -= 0.5;
      availableExplosions[1].burst(leftPos, 16);
    }

    if (availableExplosions[2]) {
      const rightPos = position.clone();
      rightPos.x += 0.5;
      availableExplosions[2].burst(rightPos, 16);
    }

    // Stage 1 (50ms) - Vertical explosions
    setTimeout(() => {
      if (availableExplosions[3]) {
        const topPos = position.clone();
        topPos.y += 0.6;
        availableExplosions[3].burst(topPos, 18);
      }

      if (availableExplosions[4]) {
        const bottomPos = position.clone();
        bottomPos.y -= 0.6;
        availableExplosions[4].burst(bottomPos, 18);
      }
    }, 50);

    // Stage 2 (100ms) - Diagonal explosions
    setTimeout(() => {
      if (availableExplosions[5]) {
        const diagPos1 = position.clone();
        diagPos1.x -= 0.7;
        diagPos1.y += 0.4;
        availableExplosions[5].burst(diagPos1, 14);
      }

      if (availableExplosions[6]) {
        const diagPos2 = position.clone();
        diagPos2.x += 0.7;
        diagPos2.y += 0.4;
        availableExplosions[6].burst(diagPos2, 14);
      }
    }, 100);

    // Stage 3 (150ms) - Outer ring explosion
    setTimeout(() => {
      if (availableExplosions[7]) {
        const outerPos = position.clone();
        outerPos.y += 0.8;
        availableExplosions[7].burst(outerPos, 22);
      }
    }, 150);

    // Camera shake for impact
    this.addCameraShake();
  }

  private addCameraShake(): void {
    const originalPos = this.camera.position.clone();
    const shakeIntensity = 0.15;
    const shakeDuration = 400;
    const startTime = Date.now();

    const shake = () => {
      const elapsed = Date.now() - startTime;
      if (elapsed < shakeDuration) {
        const progress = elapsed / shakeDuration;
        const intensity = shakeIntensity * (1 - progress);

        this.camera.position.x = originalPos.x + (Math.random() - 0.5) * intensity;
        this.camera.position.y = originalPos.y + (Math.random() - 0.5) * intensity;
        this.camera.position.z = originalPos.z + (Math.random() - 0.5) * intensity;

        requestAnimationFrame(shake);
      } else {
        this.camera.position.copy(originalPos);
      }
    };
    shake();
  }

  dispose(): void {
    this.deactivate();
    this.bulletPool.forEach(bullet => {
      this.scene.remove(bullet);
      bullet.geometry.dispose();
      (bullet.material as THREE.Material).dispose();
    });
    this.explosions.forEach(exp => {
      this.scene.remove(exp.getObject());
    });
  }
}
