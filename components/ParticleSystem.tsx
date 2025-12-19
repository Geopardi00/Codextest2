
import { Particle } from '../types';
import { COLORS } from '../constants';

export class ParticleManager {
  private particles: Particle[] = [];

  createExplosion(x: number, y: number, color: string, count: number = 20) {
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 10,
        vy: (Math.random() - 0.5) * 10,
        life: 1,
        maxLife: 1,
        color,
        size: Math.random() * 5 + 2
      });
    }
  }

  createSnow(width: number, height: number) {
    if (Math.random() > 0.8) {
      this.particles.push({
        x: Math.random() * width,
        y: -10,
        vx: (Math.random() - 0.5) * 2,
        vy: Math.random() * 2 + 1,
        life: 1,
        maxLife: 1,
        color: COLORS.SNOW,
        size: Math.random() * 3 + 1
      });
    }
  }

  update(width: number, height: number) {
    this.particles = this.particles.filter(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.life -= 0.02;
      return p.life > 0 && p.y < height + 10 && p.x > -10 && p.x < width + 10;
    });
  }

  draw(ctx: CanvasRenderingContext2D) {
    this.particles.forEach(p => {
      ctx.globalAlpha = p.life;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1.0;
  }
}
