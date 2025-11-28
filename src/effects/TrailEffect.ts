import { ParticleSystem } from './ParticleSystem';
import { CyberColors } from '../utils/Colors';

export class TrailEffect extends ParticleSystem {
  constructor() {
    super(30, CyberColors.YELLOW, 0.03);
  }
}
