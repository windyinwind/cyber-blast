import { AudioEngine } from './AudioEngine';

export class WhipSound {
  private audioBuffer: AudioBuffer | null = null;

  constructor(private audioEngine: AudioEngine) {
    this.loadSound();
  }

  private async loadSound(): Promise<void> {
    try {
      const response = await fetch('/sound_effects/mixkit-lasso-fast-whip-1513.wav');
      const arrayBuffer = await response.arrayBuffer();
      this.audioBuffer = await this.audioEngine.getContext().decodeAudioData(arrayBuffer);
      console.log('Whip sound loaded successfully');
    } catch (error) {
      console.error('Failed to load whip sound:', error);
    }
  }

  play(): void {
    if (!this.audioBuffer) {
      console.warn('Whip sound not loaded yet');
      return;
    }

    const ctx = this.audioEngine.getContext();
    const source = ctx.createBufferSource();
    source.buffer = this.audioBuffer;

    const gainNode = ctx.createGain();
    gainNode.gain.value = 0.8;

    source.connect(gainNode);
    gainNode.connect(this.audioEngine.getMasterGain());

    source.start(0);
  }
}
