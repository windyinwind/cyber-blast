import * as THREE from 'three';
import { BaseMode } from './BaseMode';
import { GestureData, GestureType } from '../types/Gesture';
import { WhipTrail } from '../objects/WhipTrail';
import { HumanTarget } from '../objects/HumanTarget';
import { WhipSound } from '../audio/WhipSound';
import { AudioEngine } from '../audio/AudioEngine';
import { ParticleSystem } from '../effects/ParticleSystem';
import { CyberColors } from '../utils/Colors';
import { isMobile } from '../utils/DeviceDetector';

export class WhipMode extends BaseMode {
  private whipTrail: WhipTrail;
  private targets: HumanTarget[] = [];
  private whipSound: WhipSound;
  private electricEffects: ParticleSystem[] = [];
  private lastWhipTime = 0;
  private readonly whipCooldown = 0.3; // Faster cooldown for easier triggering
  private handPosition: THREE.Vector3;

  constructor(scene: THREE.Scene, camera: THREE.Camera, audioEngine: AudioEngine) {
    super(scene, camera);
    this.whipSound = new WhipSound(audioEngine);
    this.whipTrail = new WhipTrail();
    this.handPosition = new THREE.Vector3();

    // Optimize for mobile: fewer effects and particles
    const mobile = isMobile();
    const effectCount = mobile ? 5 : 10;
    const particleCount = mobile ? 250 : 500;

    for (let i = 0; i < effectCount; i++) {
      const colors = [CyberColors.MAGENTA, CyberColors.CYAN, CyberColors.PURPLE, CyberColors.YELLOW];
      const color = colors[i % colors.length];
      const effect = new ParticleSystem(particleCount, color, 0.2);
      this.electricEffects.push(effect);
      this.scene.add(effect.getObject());
    }
  }

  activate(): void {
    this.scene.add(this.whipTrail);
    const targetCount = isMobile() ? 1 : 3;
    this.spawnTargets(targetCount);
  }

  deactivate(): void {
    this.scene.remove(this.whipTrail);
    this.whipTrail.clear();

    // Force remove all targets including destroyed ones
    this.targets.forEach(target => {
      if (target.parent) {
        this.scene.remove(target);
      }
    });
    this.targets = [];

    // Reset all electric effects
    this.electricEffects.forEach(effect => {
      effect.getObject().visible = false;
    });
  }

  update(deltaTime: number, gestureData: GestureData | null): void {
    this.electricEffects.forEach(effect => effect.update(deltaTime));

    if (gestureData) {
      const x = (gestureData.position.x - 0.5) * 10;
      const y = (1 - gestureData.position.y) * 5;
      const z = gestureData.position.z * -5;
      this.handPosition.set(x, y, z);

      // Add points when hand is moving to create flowing snake-like trail
      if (gestureData.velocity.speed > 0.2) {
        // Only add hand position for natural flowing movement
        this.whipTrail.addPoint(this.handPosition);
      } else {
        // Fade gradually when hand stops moving
        this.whipTrail.fade();
        this.whipTrail.fade();
      }

      // FIST WHIP: Check for closed fist with horizontal movement
      const isFist = gestureData.type === GestureType.NONE && gestureData.velocity.speed > 0.3;
      const hasHorizontalMovement = Math.abs(gestureData.velocity.vx) > 0.4;

      if (isFist && hasHorizontalMovement && this.whipTrail.getTrailLength() > 3) {
        console.log('👊 FIST WHIP detected! vx:', gestureData.velocity.vx, 'speed:', gestureData.velocity.speed, 'Trail points:', this.whipTrail.getTrailLength());
        this.checkWhipCollision();
      }

      if (gestureData.type === GestureType.WHIP) {
        const now = Date.now() / 1000;
        if (now - this.lastWhipTime > this.whipCooldown) {
          this.whip();
          this.lastWhipTime = now;
        }
      }
    } else {
      this.whipTrail.fade();
    }
  }

  private checkWhipCollision(): void {
    const trailPoints = this.whipTrail.getPoints();

    // Create extended virtual whip points for collision detection
    // The whip extends forward toward targets at z=-6
    const extendedPoints: THREE.Vector3[] = [...trailPoints];

    // Extend the whip forward toward the target depth (z=-6)
    if (trailPoints.length >= 1) {
      const lastPoint = trailPoints[trailPoints.length - 1];

      // Calculate how far we need to extend to reach target depth
      const targetZ = -6;
      const currentZ = lastPoint.z;
      const zDelta = targetZ - currentZ;

      // Create extension points that gradually reach toward z=-6
      const steps = 8;
      for (let i = 1; i <= steps; i++) {
        const progress = i / steps;
        const extendedPoint = lastPoint.clone();
        extendedPoint.z = currentZ + (zDelta * progress);
        extendedPoints.push(extendedPoint);
      }
    }

    this.targets.forEach(target => {
      if (!target.isDestroyed()) {
        // Check if any point in the whip trail (including extended points) is close to this target
        for (const point of extendedPoints) {
          const distance = point.distanceTo(target.position);

          if (distance < 2.5) { // Easier triggering - 2.5 units range
            const now = Date.now() / 1000;
            if (now - this.lastWhipTime > this.whipCooldown) {
              console.log('💥 WHIP TRAIL HIT! Distance:', distance.toFixed(2), 'Point:', point, 'Target:', target.position);
              this.triggerWhipEffects(target);
              this.lastWhipTime = now;
              return; // Only hit one target at a time
            }
          }
        }
      }
    });
  }

  private triggerWhipEffects(target: HumanTarget): void {
    console.log('⚡⚡⚡ TRIGGERING WHIP EFFECTS ON TARGET!');
    this.whipSound.play();
    target.hit();

    // Create ULTRA MASSIVE stunning electric shock effects
    const availableEffects = this.electricEffects.filter(e => !e.getObject().visible);
    console.log('Available effects for whip:', availableEffects.length);

    // INSTANT - Main impact at chest (BIGGEST) - HIGH VELOCITY
    if (availableEffects[0]) {
      const chestPos = target.position.clone();
      chestPos.y += 0.7;
      availableEffects[0].burst(chestPos, 15);
    }

    // INSTANT - Head explosion - HIGH VELOCITY
    if (availableEffects[1]) {
      const headPos = target.position.clone();
      headPos.y += 1.4;
      availableEffects[1].burst(headPos, 12);
    }

    // Stage 1 (50ms delay) - Arms electric shock
    setTimeout(() => {
      if (availableEffects[2]) {
        const leftArmPos = target.position.clone();
        leftArmPos.x -= 0.45;
        leftArmPos.y += 0.5;
        availableEffects[2].burst(leftArmPos, 10);
      }

      if (availableEffects[3]) {
        const rightArmPos = target.position.clone();
        rightArmPos.x += 0.45;
        rightArmPos.y += 0.5;
        availableEffects[3].burst(rightArmPos, 10);
      }
    }, 50);

    // Stage 2 (100ms delay) - Waist and legs
    setTimeout(() => {
      if (availableEffects[4]) {
        const waistPos = target.position.clone();
        waistPos.y += 0.2;
        availableEffects[4].burst(waistPos, 11);
      }

      if (availableEffects[5]) {
        const leftLegPos = target.position.clone();
        leftLegPos.x -= 0.2;
        leftLegPos.y -= 0.5;
        availableEffects[5].burst(leftLegPos, 9);
      }

      if (availableEffects[6]) {
        const rightLegPos = target.position.clone();
        rightLegPos.x += 0.2;
        rightLegPos.y -= 0.5;
        availableEffects[6].burst(rightLegPos, 9);
      }
    }, 100);

    // Stage 3 (150ms delay) - Ground impact MASSIVE shockwave
    setTimeout(() => {
      if (availableEffects[7]) {
        const groundPos = target.position.clone();
        groundPos.y -= 1.0;
        availableEffects[7].burst(groundPos, 18);
      }

      if (availableEffects[8]) {
        const groundLeft = target.position.clone();
        groundLeft.x -= 0.8;
        groundLeft.y -= 1.0;
        availableEffects[8].burst(groundLeft, 14);
      }

      if (availableEffects[9]) {
        const groundRight = target.position.clone();
        groundRight.x += 0.8;
        groundRight.y -= 1.0;
        availableEffects[9].burst(groundRight, 14);
      }
    }, 150);

    // INTENSE Camera shake effect
    this.addCameraShake();

    setTimeout(() => {
      this.scene.remove(target);
      const idx = this.targets.indexOf(target);
      if (idx > -1) this.targets.splice(idx, 1);

      if (this.targets.every(t => t.isDestroyed())) {
        const targetCount = isMobile() ? 1 : 3;
        this.spawnTargets(targetCount);
      }
    }, 1000);
  }

  private whip(): void {
    // Old gesture-based whip - kept for compatibility
    // The main whip detection now happens in checkWhipCollision()
  }

  private addCameraShake(): void {
    const originalPos = this.camera.position.clone();
    const shakeIntensity = 0.25; // Much stronger shake
    const shakeDuration = 500; // Longer duration
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

  private spawnTargets(count: number): void {
    const spacing = 3.0;
    const startX = -(count - 1) * spacing / 2;

    for (let i = 0; i < count; i++) {
      const x = startX + i * spacing;
      const y = 0;
      const z = -6;

      const target = new HumanTarget(new THREE.Vector3(x, y, z));
      this.scene.add(target);
      this.targets.push(target);
    }
  }

  dispose(): void {
    this.deactivate();
    this.electricEffects.forEach(effect => {
      this.scene.remove(effect.getObject());
    });
  }
}
