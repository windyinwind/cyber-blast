import './style.css';
import { App } from './core/App';

console.log('Main.ts loaded');

window.addEventListener('DOMContentLoaded', () => {
  console.log('DOM Content Loaded, initializing app...');
  try {
    const app = new App();
    app.start();
  } catch (error) {
    console.error('Failed to initialize app:', error);
  }

  window.addEventListener('error', (e) => {
    console.error('Application error:', e.error);
  });
});
