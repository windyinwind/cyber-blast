import { AudioEngine } from './AudioEngine';

export class BasketballSound {
  private swishBuffer: AudioBuffer | null = null;
  private applauseBuffer: AudioBuffer | null = null;

  constructor(private audioEngine: AudioEngine) {
    this.loadSounds();
  }

  private async loadSounds(): Promise<void> {
    try {
      // Load swish sound
      const swishResponse = await fetch('/sound_effects/mixkit-basketball-ball-hitting-the-net-2084.wav');
      const swishArrayBuffer = await swishResponse.arrayBuffer();
      this.swishBuffer = await this.audioEngine.getContext().decodeAudioData(swishArrayBuffer);
      console.log('Basketball swish sound loaded successfully');

      // Load applause sound
      const applauseResponse = await fetch('/sound_effects/mixkit-girls-audience-applause-510.wav');
      const applauseArrayBuffer = await applauseResponse.arrayBuffer();
      this.applauseBuffer = await this.audioEngine.getContext().decodeAudioData(applauseArrayBuffer);
      console.log('Basketball applause sound loaded successfully');
    } catch (error) {
      console.error('Failed to load basketball sounds:', error);
    }
  }

  playThrow(): void {
    if (!this.swishBuffer) {
      console.warn('Basketball sound not loaded yet');
      return;
    }

    const ctx = this.audioEngine.getContext();
    const source = ctx.createBufferSource();
    source.buffer = this.swishBuffer;

    const gainNode = ctx.createGain();
    gainNode.gain.value = 0.5; // Slightly quieter for throw

    source.connect(gainNode);
    gainNode.connect(this.audioEngine.getMasterGain());

    source.start(0);
  }

  playSwish(): void {
    if (!this.swishBuffer) {
      console.warn('Basketball sound not loaded yet');
      return;
    }

    const ctx = this.audioEngine.getContext();
    const source = ctx.createBufferSource();
    source.buffer = this.swishBuffer;

    const gainNode = ctx.createGain();
    gainNode.gain.value = 0.6;

    source.connect(gainNode);
    gainNode.connect(this.audioEngine.getMasterGain());

    source.start(0);
  }

  playBounce(): void {
    // Not used currently
  }

  playApplause(): void {
    if (!this.applauseBuffer) {
      console.warn('Basketball applause sound not loaded yet');
      return;
    }

    const ctx = this.audioEngine.getContext();
    const source = ctx.createBufferSource();
    source.buffer = this.applauseBuffer;

    const gainNode = ctx.createGain();
    gainNode.gain.value = 0.5;

    source.connect(gainNode);
    gainNode.connect(this.audioEngine.getMasterGain());

    source.start(0);
  }
}
