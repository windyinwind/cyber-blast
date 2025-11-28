export enum GestureType {
  GUN = 'gun',
  SHOOT = 'shoot',
  THROW = 'throw',
  WHIP = 'whip',
  ONE_FINGER = 'one',
  TWO_FINGERS = 'two',
  THREE_FINGERS = 'three',
  NONE = 'none'
}

export interface GestureData {
  type: GestureType;
  confidence: number;
  position: { x: number; y: number; z: number };
  velocity: { vx: number; vy: number; vz: number };
}
