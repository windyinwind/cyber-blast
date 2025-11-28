import { StateManager } from '../core/StateManager';
import { GameMode } from '../types/GameState';

export class UIManager {
  private modeButtons: NodeListOf<HTMLButtonElement>;
  private statusDisplay: HTMLElement;
  private stateManager: StateManager;

  constructor(stateManager: StateManager) {
    this.stateManager = stateManager;

    this.modeButtons = document.querySelectorAll('.mode-btn');
    this.statusDisplay = document.getElementById('status-display')!;

    this.setupEventListeners();
    this.updateUI();
  }

  private setupEventListeners(): void {
    this.modeButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const mode = btn.dataset.mode as GameMode;
        this.stateManager.setMode(mode);
      });
    });

    this.stateManager.on('modeChange', this.updateUI.bind(this));
    this.stateManager.on('handDetectionChange', this.updateHandStatus.bind(this));
  }

  private updateUI(): void {
    const state = this.stateManager.getState();

    this.modeButtons.forEach(btn => {
      if (btn.dataset.mode === state.currentMode) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    this.updateStatusText(`Mode: ${state.currentMode.toUpperCase()}`);
  }

  private updateHandStatus(detected: boolean): void {
    const status = detected ? 'Hand Detected ✓' : 'No Hand Detected';
    this.updateStatusText(status);
  }

  private updateStatusText(text: string): void {
    this.statusDisplay.textContent = text;
  }
}
