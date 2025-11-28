import * as THREE from 'three';
import { BaseMode } from './BaseMode';
import { GestureData, GestureType } from '../types/Gesture';
import { Basketball } from '../objects/Basketball';
import { Hoop } from '../objects/Hoop';
import { BasketballSound } from '../audio/BasketballSound';
import { AudioEngine } from '../audio/AudioEngine';
import { ParticleSystem } from '../effects/ParticleSystem';
import { CyberColors } from '../utils/Colors';
import { isMobile } from '../utils/DeviceDetector';

export class BasketballMode extends BaseMode {
  private hoop: Hoop;
  private basketball: Basketball;
  private basketballSound: BasketballSound;
  private scoreEffect: ParticleSystem;
  private ballTrailEffect: ParticleSystem;
  private additionalScoreEffects: ParticleSystem[] = [];
  private previousBallPos: THREE.Vector3;
  private canThrow = true;

  constructor(scene: THREE.Scene, camera: THREE.Camera, audioEngine: AudioEngine) {
    super(scene, camera);
    this.basketballSound = new BasketballSound(audioEngine);

    this.hoop = new Hoop(new THREE.Vector3(0, 2.2, -6));

    this.basketball = new Basketball();
    this.previousBallPos = new THREE.Vector3();

    // Optimize for mobile: reduce particle counts
    const mobile = isMobile();
    const mainParticles = mobile ? 400 : 800;
    const trailParticles = mobile ? 200 : 400;
    const additionalParticles = mobile ? 300 : 600;

    // Main score explosion - RAINBOW COLORS
    this.scoreEffect = new ParticleSystem(mainParticles, CyberColors.YELLOW, 0.35);

    // Ball trail - thick and sparkling
    this.ballTrailEffect = new ParticleSystem(trailParticles, CyberColors.CYAN, 0.15);

    // Additional RAINBOW explosions for scoring - MAXIMUM COLORFUL
    // Mobile: 6 effects, Desktop: 12 effects
    const effectCount = mobile ? 6 : 12;
    const rainbowColors = [
      CyberColors.MAGENTA,
      CyberColors.CYAN,
      CyberColors.PURPLE,
      CyberColors.YELLOW,
      0xFF0080, // Hot pink
      0x00FF80, // Spring green
      0xFF8000, // Orange
      0x0080FF, // Light blue
      0xFF00FF, // Bright magenta
      0x00FFFF, // Bright cyan
      0x80FF00, // Lime green
      0xFF0040  // Red-pink
    ];

    for (let i = 0; i < effectCount; i++) {
      const effect = new ParticleSystem(additionalParticles, rainbowColors[i], 0.3);
      this.additionalScoreEffects.push(effect);
    }
  }

  activate(): void {
    this.scene.add(this.hoop);
    this.scene.add(this.basketball);
    this.scene.add(this.scoreEffect.getObject());
    this.scene.add(this.ballTrailEffect.getObject());
    this.additionalScoreEffects.forEach(effect => {
      this.scene.add(effect.getObject());
    });
  }

  deactivate(): void {
    this.scene.remove(this.hoop);
    this.scene.remove(this.basketball);
    this.scene.remove(this.scoreEffect.getObject());
    this.scene.remove(this.ballTrailEffect.getObject());
    this.additionalScoreEffects.forEach(effect => {
      this.scene.remove(effect.getObject());
      effect.getObject().visible = false;
    });

    // Reset basketball and effects
    this.basketball.reset();
    this.scoreEffect.getObject().visible = false;
    this.ballTrailEffect.getObject().visible = false;
  }

  update(deltaTime: number, gestureData: GestureData | null): void {
    if (this.basketball.isActive()) {
      this.previousBallPos.copy(this.basketball.position);
      this.basketball.update(deltaTime);

      // Add THICK sparkling trail particles as ball moves
      this.ballTrailEffect.burst(this.basketball.position, 8);

      if (this.hoop.checkScore(this.basketball.position, this.previousBallPos)) {
        this.onScore();
      }
    }

    this.scoreEffect.update(deltaTime);
    this.ballTrailEffect.update(deltaTime);
    this.additionalScoreEffects.forEach(effect => effect.update(deltaTime));

    if (gestureData && gestureData.type === GestureType.THROW && this.canThrow) {
      this.throwBall(gestureData);
    }

    if (!this.basketball.isActive()) {
      this.canThrow = true;
    }
  }

  private throwBall(gestureData: GestureData): void {
    if (this.basketball.isActive()) return;

    const startPos = this.camera.position.clone();
    startPos.y -= 0.3;

    const toHoop = new THREE.Vector3()
      .subVectors(this.hoop.position, startPos)
      .normalize();

    toHoop.y += 0.5;
    toHoop.normalize();

    // Calculate power based on hand speed
    // Mobile: more forgiving power calculation with higher base power
    const mobile = isMobile();
    const handSpeed = Math.abs(gestureData.velocity.vy) + gestureData.velocity.speed;

    let power: number;
    if (mobile) {
      // Mobile: base power 8 (higher), range 8-14
      power = 8 + Math.min(handSpeed * 2.5, 6);
    } else {
      // Desktop: base power 6, range 6-14
      power = 6 + Math.min(handSpeed * 3, 8);
    }

    console.log('🏀 Throwing with speed:', handSpeed, 'power:', power, 'mobile:', mobile);

    this.basketball.shoot(startPos, toHoop, power);
    this.basketballSound.playThrow();
    this.canThrow = false;
  }

  private onScore(): void {
    this.basketballSound.playSwish();
    this.basketballSound.playApplause();

    this.hoop.animate();

    const hoopPos = this.hoop.position.clone();

    // INSTANT - MASSIVE RAINBOW CENTER EXPLOSION
    this.scoreEffect.burst(hoopPos, 30); // Yellow

    // INSTANT - Colorful side explosions
    const leftPos = hoopPos.clone();
    leftPos.x -= 0.7;
    this.additionalScoreEffects[0].burst(leftPos, 25); // Magenta

    const rightPos = hoopPos.clone();
    rightPos.x += 0.7;
    this.additionalScoreEffects[1].burst(rightPos, 25); // Cyan

    // Stage 1 (50ms) - Vertical RAINBOW explosions
    setTimeout(() => {
      const topPos = hoopPos.clone();
      topPos.y += 0.8;
      this.additionalScoreEffects[2].burst(topPos, 28); // Purple

      const bottomPos = hoopPos.clone();
      bottomPos.y -= 0.8;
      this.additionalScoreEffects[3].burst(bottomPos, 28); // Yellow
    }, 50);

    // Stage 2 (100ms) - RAINBOW diagonal explosions
    setTimeout(() => {
      const diagPos1 = hoopPos.clone();
      diagPos1.x -= 1.0;
      diagPos1.y += 0.6;
      this.additionalScoreEffects[4].burst(diagPos1, 22); // Hot pink

      const diagPos2 = hoopPos.clone();
      diagPos2.x += 1.0;
      diagPos2.y += 0.6;
      this.additionalScoreEffects[5].burst(diagPos2, 22); // Spring green

      const diagPos3 = hoopPos.clone();
      diagPos3.x -= 1.0;
      diagPos3.y -= 0.6;
      this.additionalScoreEffects[6].burst(diagPos3, 22); // Orange

      const diagPos4 = hoopPos.clone();
      diagPos4.x += 1.0;
      diagPos4.y -= 0.6;
      this.additionalScoreEffects[7].burst(diagPos4, 22); // Light blue
    }, 100);

    // Stage 3 (150ms) - OUTER RING MASSIVE RAINBOW EXPLOSION
    setTimeout(() => {
      const outerTop = hoopPos.clone();
      outerTop.y += 1.2;
      this.additionalScoreEffects[8].burst(outerTop, 35); // Bright magenta

      const outerLeft = hoopPos.clone();
      outerLeft.x -= 1.5;
      this.additionalScoreEffects[9].burst(outerLeft, 30); // Bright cyan

      const outerRight = hoopPos.clone();
      outerRight.x += 1.5;
      this.additionalScoreEffects[10].burst(outerRight, 30); // Lime green

      const outerBottom = hoopPos.clone();
      outerBottom.y -= 1.2;
      this.additionalScoreEffects[11].burst(outerBottom, 32); // Red-pink

      // Extra center burst for maximum color
      this.scoreEffect.burst(hoopPos, 28);
    }, 150);

    // INTENSE Camera shake like gun mode
    this.addCameraShake();

    setTimeout(() => {
      this.basketball.reset();
    }, 500);
  }

  private addCameraShake(): void {
    const originalPos = this.camera.position.clone();
    const shakeIntensity = 0.2; // INTENSE shake like gun mode
    const shakeDuration = 500;
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
    this.basketball.geometry.dispose();
    (this.basketball.material as THREE.Material).dispose();
  }
}
