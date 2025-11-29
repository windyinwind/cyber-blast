import { HandData } from '../types/Hand';

// Use global MediaPipe objects from CDN
declare global {
  interface Window {
    Hands: any;
    Camera: any;
  }
}

export class HandTracker {
  private hands: any;
  private camera: any;
  private videoElement: HTMLVideoElement;
  private canvasElement: HTMLCanvasElement;
  private canvasCtx: CanvasRenderingContext2D;
  private onResultsCallback?: (handData: HandData | null) => void;

  constructor(videoElement: HTMLVideoElement, canvasElement: HTMLCanvasElement) {
    this.videoElement = videoElement;
    this.canvasElement = canvasElement;
    this.canvasCtx = canvasElement.getContext('2d')!;

    // Use MediaPipe from CDN
    const HandsConstructor = (window as any).Hands || window.Hands;
    if (!HandsConstructor) {
      throw new Error('MediaPipe Hands not loaded. Make sure the script tag is included.');
    }

    this.hands = new HandsConstructor({
      locateFile: (file: string) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
      }
    });

    this.hands.setOptions({
      maxNumHands: 1,
      modelComplexity: 1,
      minDetectionConfidence: 0.7,
      minTrackingConfidence: 0.5
    });

    this.hands.onResults(this.onResults.bind(this));

    // Use MediaPipe Camera from CDN
    const CameraConstructor = (window as any).Camera || window.Camera;
    if (!CameraConstructor) {
      throw new Error('MediaPipe Camera not loaded. Make sure the script tag is included.');
    }

    this.camera = new CameraConstructor(this.videoElement, {
      onFrame: async () => {
        await this.hands.send({ image: this.videoElement });
      },
      width: 640,
      height: 480
    });
  }

  async start(): Promise<void> {
    try {
      console.log('Requesting camera access...');
      await this.camera.start();
      console.log('Camera started successfully');
    } catch (error) {
      console.error('Failed to start camera:', error);
      alert('Please allow camera access to use this application');
    }
  }

  private onResults(results: any): void {
    this.canvasCtx.save();
    this.canvasCtx.clearRect(0, 0, this.canvasElement.width, this.canvasElement.height);

    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
      const landmarks = results.multiHandLandmarks[0];
      const handedness = results.multiHandedness[0].label as 'Left' | 'Right';

      this.drawHand(landmarks);

      const handData: HandData = {
        landmarks: landmarks.map((lm: any) => ({ x: 1 - lm.x, y: lm.y, z: lm.z })),
        handedness,
        confidence: results.multiHandedness[0].score
      };

      if (this.onResultsCallback) {
        this.onResultsCallback(handData);
      }
    } else {
      if (this.onResultsCallback) {
        this.onResultsCallback(null);
      }
    }

    this.canvasCtx.restore();
  }

  private drawHand(landmarks: any[]): void {
    const ctx = this.canvasCtx;

    const connections = [
      [0, 1], [1, 2], [2, 3], [3, 4],
      [0, 5], [5, 6], [6, 7], [7, 8],
      [0, 9], [9, 10], [10, 11], [11, 12],
      [0, 13], [13, 14], [14, 15], [15, 16],
      [0, 17], [17, 18], [18, 19], [19, 20],
      [5, 9], [9, 13], [13, 17]
    ];

    ctx.strokeStyle = '#00FFFF';
    ctx.lineWidth = 3;
    ctx.shadowBlur = 15;
    ctx.shadowColor = '#00FFFF';

    connections.forEach(([start, end]) => {
      ctx.beginPath();
      ctx.moveTo(
        landmarks[start].x * this.canvasElement.width,
        landmarks[start].y * this.canvasElement.height
      );
      ctx.lineTo(
        landmarks[end].x * this.canvasElement.width,
        landmarks[end].y * this.canvasElement.height
      );
      ctx.stroke();
    });

    ctx.fillStyle = '#FF00FF';
    ctx.shadowColor = '#FF00FF';
    landmarks.forEach(lm => {
      ctx.beginPath();
      ctx.arc(
        lm.x * this.canvasElement.width,
        lm.y * this.canvasElement.height,
        5,
        0,
        2 * Math.PI
      );
      ctx.fill();
    });
  }

  onHandData(callback: (handData: HandData | null) => void): void {
    this.onResultsCallback = callback;
  }
}
