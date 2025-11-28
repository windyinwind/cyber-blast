import * as THREE from 'three';
import { StateManager } from './StateManager';
import { HandTracker } from './HandTracker';
import { GestureRecognizer } from './GestureRecognizer';
import { SceneManager } from '../scene/SceneManager';
import { LightingManager } from '../scene/LightingManager';
import { PostProcessing } from '../scene/PostProcessing';
import { AudioEngine } from '../audio/AudioEngine';
import { UIManager } from '../ui/UIManager';
import { GunMode } from '../modes/GunMode';
import { BasketballMode } from '../modes/BasketballMode';
import { WhipMode } from '../modes/WhipMode';
import { BaseMode } from '../modes/BaseMode';
import { GameMode } from '../types/GameState';
import { GestureType, GestureData } from '../types/Gesture';
import { HandData } from '../types/Hand';

export class App {
  private stateManager: StateManager;
  private handTracker: HandTracker;
  private gestureRecognizer: GestureRecognizer;
  private sceneManager: SceneManager;
  private lightingManager: LightingManager;
  private postProcessing: PostProcessing;
  private audioEngine: AudioEngine;
  private uiManager: UIManager;

  private modes: Map<GameMode, BaseMode> = new Map();
  private currentMode: BaseMode | null = null;

  private clock: THREE.Clock;
  private lastGestureData: GestureData | null = null;

  constructor() {
    this.clock = new THREE.Clock();

    this.stateManager = new StateManager();
    this.audioEngine = new AudioEngine();

    const appContainer = document.getElementById('app')!;
    this.sceneManager = new SceneManager(appContainer);
    this.lightingManager = new LightingManager(this.sceneManager.scene);
    this.postProcessing = new PostProcessing(
      this.sceneManager.renderer,
      this.sceneManager.scene,
      this.sceneManager.camera
    );

    const videoElement = document.getElementById('video') as HTMLVideoElement;
    const canvasElement = document.getElementById('hand-canvas') as HTMLCanvasElement;
    canvasElement.width = window.innerWidth;
    canvasElement.height = window.innerHeight;

    this.handTracker = new HandTracker(videoElement, canvasElement);
    this.gestureRecognizer = new GestureRecognizer();

    this.uiManager = new UIManager(this.stateManager);

    this.modes.set(
      GameMode.GUN,
      new GunMode(this.sceneManager.scene, this.sceneManager.camera, this.audioEngine)
    );
    this.modes.set(
      GameMode.BASKETBALL,
      new BasketballMode(this.sceneManager.scene, this.sceneManager.camera, this.audioEngine)
    );
    this.modes.set(
      GameMode.WHIP,
      new WhipMode(this.sceneManager.scene, this.sceneManager.camera, this.audioEngine)
    );

    this.setupEventListeners();

    console.log('App initialized, starting hand tracker...');
    this.handTracker.start().catch(err => {
      console.error('Hand tracker failed:', err);
    });
  }

  private setupEventListeners(): void {
    this.handTracker.onHandData((handData: HandData | null) => {
      this.stateManager.setHandDetected(!!handData);

      this.lastGestureData = this.gestureRecognizer.recognize(handData);

      if (this.lastGestureData) {
        this.stateManager.setLastGesture(this.lastGestureData.type);
      }
    });

    this.stateManager.on('modeChange', (mode: GameMode) => {
      this.switchMode(mode);
    });

    window.addEventListener('resize', () => {
      const canvas = document.getElementById('hand-canvas') as HTMLCanvasElement;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      this.postProcessing.resize(window.innerWidth, window.innerHeight);
    });
  }

  private switchMode(mode: GameMode): void {
    console.log('Switching to mode:', mode);
    if (this.currentMode) {
      this.currentMode.deactivate();
    }

    this.currentMode = this.modes.get(mode) || null;
    if (this.currentMode) {
      this.currentMode.activate();
      console.log('Mode activated:', mode);
    } else {
      console.error('Mode not found:', mode);
    }
  }

  start(): void {
    console.log('Starting application...');
    this.switchMode(GameMode.GUN);
    console.log('Initial mode activated');

    this.animate();
    console.log('Animation loop started');
  }

  private animate = (): void => {
    requestAnimationFrame(this.animate);

    const deltaTime = this.clock.getDelta();
    const elapsedTime = this.clock.getElapsedTime();

    this.lightingManager.update(elapsedTime);

    if (this.currentMode) {
      this.currentMode.update(deltaTime, this.lastGestureData);
    }

    this.postProcessing.render(deltaTime);
  };

  dispose(): void {
    this.modes.forEach(mode => mode.dispose());
    this.sceneManager.dispose();
  }
}
