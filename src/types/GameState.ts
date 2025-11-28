import { GestureType } from './Gesture';

export enum GameMode {
  GUN = 'gun',
  BASKETBALL = 'basketball',
  WHIP = 'whip'
}

export interface GameState {
  currentMode: GameMode;
  isHandDetected: boolean;
  lastGesture: GestureType;
  score?: number;
}
