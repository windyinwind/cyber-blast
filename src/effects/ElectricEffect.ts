import { ParticleSystem } from './ParticleSystem';
import { CyberColors } from '../utils/Colors';

export class ElectricEffect extends ParticleSystem {
  constructor() {
    super(80, CyberColors.MAGENTA, 0.03);
  }
}
