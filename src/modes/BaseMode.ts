import * as THREE from 'three';
import { GestureData } from '../types/Gesture';

export abstract class BaseMode {
  protected scene: THREE.Scene;
  protected camera: THREE.Camera;

  constructor(scene: THREE.Scene, camera: THREE.Camera) {
    this.scene = scene;
    this.camera = camera;
  }

  abstract activate(): void;

  abstract deactivate(): void;

  abstract update(deltaTime: number, gestureData: GestureData | null): void;

  abstract dispose(): void;
}
