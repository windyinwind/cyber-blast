import { EffectComposer } from 'postprocessing';
import { RenderPass } from 'postprocessing';
import { EffectPass } from 'postprocessing';
import { BloomEffect } from 'postprocessing';
import { ChromaticAberrationEffect } from 'postprocessing';
import { VignetteEffect } from 'postprocessing';
import { GlitchEffect } from 'postprocessing';
import * as THREE from 'three';

export class PostProcessing {
  composer: EffectComposer;
  private bloomEffect: BloomEffect;
  private glitchEffect: GlitchEffect;

  constructor(renderer: THREE.WebGLRenderer, scene: THREE.Scene, camera: THREE.Camera) {
    console.log('PostProcessing initializing...');
    this.composer = new EffectComposer(renderer);

    const renderPass = new RenderPass(scene, camera);
    this.composer.addPass(renderPass);

    this.bloomEffect = new BloomEffect({
      intensity: 1.5,
      luminanceThreshold: 0.15,
      luminanceSmoothing: 0.9
    });

    const vignette = new VignetteEffect({
      darkness: 0.5,
      offset: 0.3
    });

    const effectPass = new EffectPass(
      camera,
      this.bloomEffect,
      vignette
    );
    this.composer.addPass(effectPass);

    this.glitchEffect = new GlitchEffect({
      delay: new THREE.Vector2(3, 5),
      duration: new THREE.Vector2(0.1, 0.3),
      strength: new THREE.Vector2(0.1, 0.2)
    });

    const glitchPass = new EffectPass(camera, this.glitchEffect);
    this.composer.addPass(glitchPass);

    console.log('PostProcessing initialized successfully');
  }

  triggerGlitch(): void {
    this.glitchEffect.mode = 1;
    setTimeout(() => {
      this.glitchEffect.mode = 0;
    }, 200);
  }

  render(deltaTime: number): void {
    this.composer.render(deltaTime);
  }

  resize(width: number, height: number): void {
    this.composer.setSize(width, height);
  }
}
