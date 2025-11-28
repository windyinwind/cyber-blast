import { GameMode, GameState } from '../types/GameState';
import { GestureType } from '../types/Gesture';

export class StateManager {
  private state: GameState;
  private listeners: Map<string, Function[]> = new Map();

  constructor() {
    this.state = {
      currentMode: GameMode.GUN,
      isHandDetected: false,
      lastGesture: GestureType.NONE
    };
  }

  getState(): GameState {
    return { ...this.state };
  }

  setMode(mode: GameMode): void {
    this.state.currentMode = mode;
    this.emit('modeChange', mode);
  }

  setHandDetected(detected: boolean): void {
    this.state.isHandDetected = detected;
    this.emit('handDetectionChange', detected);
  }

  setLastGesture(gesture: GestureType): void {
    this.state.lastGesture = gesture;
    this.emit('gestureChange', gesture);
  }

  on(event: string, callback: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  private emit(event: string, data: any): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach(cb => cb(data));
    }
  }
}
