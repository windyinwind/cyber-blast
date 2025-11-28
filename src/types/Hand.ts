export interface HandLandmark {
  x: number;
  y: number;
  z: number;
}

export interface HandData {
  landmarks: HandLandmark[];
  handedness: 'Left' | 'Right';
  confidence: number;
}

export interface HandVelocity {
  vx: number;
  vy: number;
  vz: number;
  speed: number;
}
