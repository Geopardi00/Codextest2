
export enum GameState {
  START = 'START',
  PLAYING = 'PLAYING',
  GAMEOVER = 'GAMEOVER',
  WIN = 'WIN',
  PAUSED = 'PAUSED'
}

export interface Vector2D {
  x: number;
  y: number;
}

export interface GameObject {
  pos: Vector2D;
  size: Vector2D;
  color: string;
}

export interface Obstacle extends GameObject {
  type: 'SPIKE' | 'BLOCK' | 'PLATFORM';
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

export interface GameMetrics {
  score: number;
  highScore: number;
  attempts: number;
  distance: number;
}
