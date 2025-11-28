import { HandData, HandVelocity } from '../types/Hand';
import { GestureType, GestureData } from '../types/Gesture';
import { isMobile } from '../utils/DeviceDetector';

export class GestureRecognizer {
  private previousHand: HandData | null = null;
  private previousTime: number = Date.now();
  private gestureHistory: GestureType[] = [];
  private readonly HISTORY_SIZE = 5;

  recognize(handData: HandData | null): GestureData | null {
    if (!handData) {
      this.previousHand = null;
      return null;
    }

    const velocity = this.calculateVelocity(handData);
    const gestureType = this.detectGesture(handData, velocity);

    this.gestureHistory.push(gestureType);
    if (this.gestureHistory.length > this.HISTORY_SIZE) {
      this.gestureHistory.shift();
    }

    const stableGesture = this.getMostFrequentGesture();

    this.previousHand = handData;
    this.previousTime = Date.now();

    // Use index finger tip (landmark 8) for pointing gestures
    const fingerTip = handData.landmarks[8];
    const handCenter = handData.landmarks[9];

    return {
      type: stableGesture,
      confidence: handData.confidence,
      position: {
        x: stableGesture === GestureType.GUN || stableGesture === GestureType.SHOOT
          ? fingerTip.x
          : handCenter.x,
        y: stableGesture === GestureType.GUN || stableGesture === GestureType.SHOOT
          ? fingerTip.y
          : handCenter.y,
        z: stableGesture === GestureType.GUN || stableGesture === GestureType.SHOOT
          ? fingerTip.z
          : handCenter.z
      },
      velocity
    };
  }

  private calculateVelocity(handData: HandData): HandVelocity {
    if (!this.previousHand) {
      return { vx: 0, vy: 0, vz: 0, speed: 0 };
    }

    const dt = (Date.now() - this.previousTime) / 1000;
    if (dt === 0) return { vx: 0, vy: 0, vz: 0, speed: 0 };

    const current = handData.landmarks[0];
    const previous = this.previousHand.landmarks[0];

    const vx = (current.x - previous.x) / dt;
    const vy = (current.y - previous.y) / dt;
    const vz = (current.z - previous.z) / dt;
    const speed = Math.sqrt(vx * vx + vy * vy + vz * vz);

    return { vx, vy, vz, speed };
  }

  private detectGesture(handData: HandData, velocity: HandVelocity): GestureType {
    const landmarks = handData.landmarks;

    const isIndexStraight = this.isFingerStraight(landmarks, 5, 6, 7, 8);
    const isMiddleStraight = this.isFingerStraight(landmarks, 9, 10, 11, 12);
    const isRingStraight = this.isFingerStraight(landmarks, 13, 14, 15, 16);
    const isPinkyStraight = this.isFingerStraight(landmarks, 17, 18, 19, 20);

    const straightFingers = [
      isIndexStraight,
      isMiddleStraight,
      isRingStraight,
      isPinkyStraight
    ].filter(Boolean).length;

    if (velocity.speed < 0.5) {
      if (straightFingers === 1) return GestureType.ONE_FINGER;
      if (straightFingers === 2) return GestureType.TWO_FINGERS;
      if (straightFingers === 3) return GestureType.THREE_FINGERS;
    }

    if (isIndexStraight && !isMiddleStraight && !isRingStraight && !isPinkyStraight) {
      if (velocity.speed > 0.8) {
        console.log('🔫 SHOOT detected! speed:', velocity.speed);
        return GestureType.SHOOT;
      }
      return GestureType.GUN;
    }

    // THROW: Easier detection on mobile
    const mobile = isMobile();
    const throwFingers = mobile ? 2 : 3; // Mobile: 2+ fingers, Desktop: 3+ fingers
    const throwVelocity = mobile ? -0.3 : -0.5; // Mobile: easier threshold

    if (straightFingers >= throwFingers && velocity.vy < throwVelocity) {
      console.log('🏀 THROW detected! velocity.vy:', velocity.vy, 'fingers:', straightFingers, 'mobile:', mobile);
      return GestureType.THROW;
    }

    if (Math.abs(velocity.vx) > 0.8 || Math.abs(velocity.vy) > 0.8) {
      console.log('WHIP detected! vx:', velocity.vx, 'vy:', velocity.vy);
      return GestureType.WHIP;
    }

    return GestureType.NONE;
  }

  private isFingerStraight(
    landmarks: any[],
    base: number,
    joint1: number,
    joint2: number,
    tip: number
  ): boolean {
    const basePos = landmarks[base];
    const tipPos = landmarks[tip];
    const joint1Pos = landmarks[joint1];

    const directDist = this.distance3D(basePos, tipPos);

    const jointDist =
      this.distance3D(basePos, joint1Pos) +
      this.distance3D(joint1Pos, landmarks[joint2]) +
      this.distance3D(landmarks[joint2], tipPos);

    return directDist / jointDist > 0.85;
  }

  private distance3D(p1: any, p2: any): number {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const dz = p2.z - p1.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  private getMostFrequentGesture(): GestureType {
    if (this.gestureHistory.length === 0) return GestureType.NONE;

    const counts = new Map<GestureType, number>();
    this.gestureHistory.forEach(g => {
      counts.set(g, (counts.get(g) || 0) + 1);
    });

    let maxCount = 0;
    let mostFrequent = GestureType.NONE;
    counts.forEach((count, gesture) => {
      if (count > maxCount) {
        maxCount = count;
        mostFrequent = gesture;
      }
    });

    return mostFrequent;
  }
}
