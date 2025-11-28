import { ParticleSystem } from './ParticleSystem';
import { CyberColors } from '../utils/Colors';

export class ExplosionEffect extends ParticleSystem {
  constructor() {
    super(50, CyberColors.CYAN, 0.05);
  }
}
