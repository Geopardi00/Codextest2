
import React, { useEffect, useRef, useCallback } from 'react';
import { GameState, Obstacle, Vector2D } from '../types';
import { 
  GAME_WIDTH, 
  GAME_HEIGHT, 
  GROUND_Y, 
  GRAVITY, 
  JUMP_FORCE, 
  DOUBLE_JUMP_FORCE,
  PLAYER_SIZE, 
  INITIAL_SCROLL_SPEED,
  MAX_SCROLL_SPEED,
  SPEED_INCREMENT,
  COLORS,
  INITIAL_OBSTACLE_SPAWN,
  PRIZE_INTERVAL
} from '../constants';
import { ParticleManager } from './ParticleSystem';

interface GameCanvasProps {
  gameState: GameState;
  onGameOver: (score: number) => void;
  onScoreUpdate: (score: number) => void;
}

const GameCanvas: React.FC<GameCanvasProps> = ({ gameState, onGameOver, onScoreUpdate }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const playerRef = useRef({ 
    y: GROUND_Y - PLAYER_SIZE, 
    vy: 0, 
    rotation: 0,
    onGround: true,
    jumpsUsed: 0
  });
  const obstaclesRef = useRef<Obstacle[]>([]);
  const frameRef = useRef<number>(0);
  const scoreRef = useRef<number>(0);
  const particlesRef = useRef(new ParticleManager());
  const distanceRef = useRef<number>(0);
  const currentSpeedRef = useRef<number>(INITIAL_SCROLL_SPEED);
  const lastMilestoneRef = useRef<number>(0);

  const parallaxRef = useRef({
    mountains: 0,
    forest: 0,
    aurora: 0
  });

  const spawnObstacle = useCallback(() => {
    const lastObstacle = obstaclesRef.current[obstaclesRef.current.length - 1];
    const spawnX = lastObstacle ? Math.max(lastObstacle.pos.x + 450 + Math.random() * 400, GAME_WIDTH) : INITIAL_OBSTACLE_SPAWN;
    
    const randomValue = Math.random();
    let newObstacles: Obstacle[] = [];

    if (randomValue < 0.35) {
      newObstacles.push({
        pos: { x: spawnX, y: GROUND_Y - 45 },
        size: { x: 40, y: 45 },
        color: COLORS.BLOCK,
        type: 'SPIKE'
      });
    } else if (randomValue < 0.65) {
      newObstacles.push({
        pos: { x: spawnX, y: GROUND_Y - 65 },
        size: { x: 50, y: 65 },
        color: COLORS.BLOCK,
        type: 'BLOCK'
      });
    } else if (randomValue < 0.85) {
      newObstacles.push({
        pos: { x: spawnX, y: GROUND_Y - 110 },
        size: { x: 60, y: 110 },
        color: COLORS.BLOCK,
        type: 'BLOCK'
      });
    } else {
      newObstacles.push({
        pos: { x: spawnX, y: GROUND_Y - 180 },
        size: { x: 80, y: 40 }, 
        color: COLORS.BLOCK,
        type: 'BLOCK'
      });
      newObstacles.push({
        pos: { x: spawnX + 20, y: GROUND_Y - 45 },
        size: { x: 40, y: 45 },
        color: COLORS.BLOCK,
        type: 'SPIKE'
      });
    }
    
    obstaclesRef.current.push(...newObstacles);
  }, []);

  const resetGame = useCallback(() => {
    playerRef.current = { y: GROUND_Y - PLAYER_SIZE, vy: 0, rotation: 0, onGround: true, jumpsUsed: 0 };
    obstaclesRef.current = [];
    scoreRef.current = 0;
    distanceRef.current = 0;
    currentSpeedRef.current = INITIAL_SCROLL_SPEED;
    lastMilestoneRef.current = 0;
    particlesRef.current = new ParticleManager();
    for(let i=0; i<3; i++) spawnObstacle();
  }, [spawnObstacle]);

  const jump = useCallback(() => {
    if (gameState === GameState.PLAYING) {
      const p = playerRef.current;
      if (p.onGround) {
        p.vy = JUMP_FORCE;
        p.onGround = false;
        p.jumpsUsed = 1;
      } else if (p.jumpsUsed < 2) {
        p.vy = DOUBLE_JUMP_FORCE;
        p.jumpsUsed = 2;
        particlesRef.current.createExplosion(100 + PLAYER_SIZE / 2, p.y + PLAYER_SIZE / 2, '#ffffff', 12);
      }
    }
  }, [gameState]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'ArrowUp') jump();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [jump]);

  useEffect(() => {
    if (gameState === GameState.PLAYING) resetGame();
  }, [gameState, resetGame]);

  const update = useCallback(() => {
    if (gameState !== GameState.PLAYING && gameState !== GameState.WIN) {
      particlesRef.current.createSnow(GAME_WIDTH, GAME_HEIGHT);
      particlesRef.current.update(GAME_WIDTH, GAME_HEIGHT);
      return;
    }

    if (gameState === GameState.WIN) {
      // Celebratory particles for win state
      if (Math.random() > 0.9) {
        particlesRef.current.createExplosion(Math.random() * GAME_WIDTH, Math.random() * GAME_HEIGHT / 2, COLORS.GOLD, 10);
      }
      particlesRef.current.createSnow(GAME_WIDTH, GAME_HEIGHT);
      particlesRef.current.update(GAME_WIDTH, GAME_HEIGHT);
      return;
    }

    currentSpeedRef.current = Math.min(MAX_SCROLL_SPEED, currentSpeedRef.current + SPEED_INCREMENT);
    const speed = currentSpeedRef.current;

    const p = playerRef.current;
    p.vy += GRAVITY;
    p.y += p.vy;

    if (p.y >= GROUND_Y - PLAYER_SIZE) {
      p.y = GROUND_Y - PLAYER_SIZE;
      p.vy = 0;
      if (!p.onGround) {
        p.onGround = true;
        p.jumpsUsed = 0;
        p.rotation = Math.round(p.rotation / 90) * 90;
      }
    } else {
      p.rotation += (p.jumpsUsed === 2 ? 8 : 6);
    }

    parallaxRef.current.mountains -= speed * 0.1;
    parallaxRef.current.forest -= speed * 0.3;
    parallaxRef.current.aurora += 0.2;

    distanceRef.current += speed;
    const newScore = Math.floor(distanceRef.current / 100);
    if (newScore > scoreRef.current) {
      scoreRef.current = newScore;
      onScoreUpdate(scoreRef.current);
      
      // Check for prize milestone
      if (Math.floor(newScore / PRIZE_INTERVAL) > lastMilestoneRef.current) {
        lastMilestoneRef.current = Math.floor(newScore / PRIZE_INTERVAL);
        particlesRef.current.createExplosion(100 + PLAYER_SIZE/2, p.y + PLAYER_SIZE/2, COLORS.GOLD, 40);
      }
    }

    obstaclesRef.current.forEach(obs => {
      obs.pos.x -= speed;

      const playerRect = { x: 100, y: p.y, w: PLAYER_SIZE, h: PLAYER_SIZE };
      const obsRect = { x: obs.pos.x, y: obs.pos.y, w: obs.size.x, h: obs.size.y };

      const margin = 8;
      
      if (
        playerRect.x + margin < obsRect.x + obsRect.w - margin &&
        playerRect.x + playerRect.w - margin > obsRect.x + margin &&
        playerRect.y + margin < obsRect.y + obsRect.h - margin &&
        playerRect.y + playerRect.h - margin > obsRect.y + margin
      ) {
        particlesRef.current.createExplosion(playerRect.x + 20, playerRect.y + 20, COLORS.PLAYER, 30);
        onGameOver(scoreRef.current);
      }
    });

    obstaclesRef.current = obstaclesRef.current.filter(obs => obs.pos.x + obs.size.x > -200);
    if (obstaclesRef.current.length < 6) spawnObstacle();

    particlesRef.current.createSnow(GAME_WIDTH, GAME_HEIGHT);
    particlesRef.current.update(GAME_WIDTH, GAME_HEIGHT);
  }, [gameState, onGameOver, onScoreUpdate, spawnObstacle]);

  const drawChristmasTree = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) => {
    ctx.save();
    ctx.translate(x, y);

    ctx.fillStyle = '#78350f'; 
    const trunkW = w * 0.2;
    const trunkH = h * 0.15;
    ctx.fillRect(w / 2 - trunkW / 2, h - trunkH, trunkW, trunkH);

    const tiers = 3;
    ctx.fillStyle = COLORS.BLOCK;
    ctx.shadowBlur = 5;
    ctx.shadowColor = 'rgba(22, 101, 52, 0.5)';

    for (let i = 0; i < tiers; i++) {
      const tierYStart = (h - trunkH) * (i / tiers);
      const tierHeight = (h - trunkH) / tiers * 1.5;
      const tierWidth = w * (1 - (i * 0.2));
      const tierX = (w - tierWidth) / 2;

      ctx.beginPath();
      ctx.moveTo(w / 2, tierYStart);
      ctx.lineTo(tierX, tierYStart + tierHeight);
      ctx.lineTo(tierX + tierWidth, tierYStart + tierHeight);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.beginPath();
      ctx.arc(tierX, tierYStart + tierHeight, 3, 0, Math.PI * 2);
      ctx.arc(tierX + tierWidth, tierYStart + tierHeight, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = COLORS.BLOCK;
    }

    ctx.fillStyle = '#fbbf24'; 
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#fbbf24';
    const starSize = 10;
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
      ctx.lineTo(Math.cos((18 + i * 72) / 180 * Math.PI) * starSize + w / 2,
                 Math.sin((18 + i * 72) / 180 * Math.PI) * starSize);
      ctx.lineTo(Math.cos((54 + i * 72) / 180 * Math.PI) * (starSize / 2) + w / 2,
                 Math.sin((54 + i * 72) / 180 * Math.PI) * (starSize / 2));
    }
    ctx.closePath();
    ctx.fill();

    const time = Date.now() / 300;
    const colors = ['#ef4444', '#fbbf24', '#3b82f6'];
    for (let i = 0; i < 6; i++) {
      ctx.shadowBlur = 4;
      ctx.fillStyle = colors[(i + Math.floor(time)) % colors.length];
      const ox = (w * 0.2) + (Math.sin(i * 1.5) * w * 0.3) + w/2 - (w*0.2);
      const oy = (h * 0.2) + (i * (h * 0.12));
      if (oy < h - trunkH) {
          ctx.beginPath();
          ctx.arc(ox, oy, 3, 0, Math.PI * 2);
          ctx.fill();
      }
    }

    ctx.restore();
  };

  const drawBackground = (ctx: CanvasRenderingContext2D) => {
    const skyGrad = ctx.createLinearGradient(0, 0, 0, GAME_HEIGHT);
    skyGrad.addColorStop(0, '#020617');
    skyGrad.addColorStop(1, '#1e1b4b');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = COLORS.AURORA;
    for(let i=0; i<3; i++) {
        const offset = (parallaxRef.current.aurora + i * 400) % 1600;
        ctx.beginPath();
        ctx.moveTo(offset - 400, 0);
        ctx.bezierCurveTo(offset - 200, 100, offset + 200, 50, offset + 400, 0);
        ctx.fill();
    }
    ctx.restore();

    ctx.fillStyle = '#0f172a';
    for (let i = 0; i < 3; i++) {
      const x = (parallaxRef.current.mountains + i * 600) % 1800;
      ctx.beginPath();
      ctx.moveTo(x - 600, GROUND_Y);
      ctx.lineTo(x - 300, 150);
      ctx.lineTo(x, GROUND_Y);
      ctx.fill();
    }

    ctx.fillStyle = '#064e3b';
    for (let i = 0; i < 10; i++) {
      const x = (parallaxRef.current.forest + i * 200) % 2000;
      ctx.beginPath();
      ctx.moveTo(x - 200, GROUND_Y);
      ctx.lineTo(x - 100, 300);
      ctx.lineTo(x, GROUND_Y);
      ctx.fill();
    }
  };

  const drawSanta = (ctx: CanvasRenderingContext2D) => {
    const p = playerRef.current;
    ctx.save();
    ctx.translate(100 + PLAYER_SIZE / 2, p.y + PLAYER_SIZE / 2);
    ctx.rotate((p.rotation * Math.PI) / 180);
    
    ctx.fillStyle = COLORS.PLAYER;
    ctx.fillRect(-PLAYER_SIZE / 2, -PLAYER_SIZE / 2, PLAYER_SIZE, PLAYER_SIZE);
    
    ctx.fillStyle = COLORS.BEARD;
    ctx.beginPath();
    ctx.arc(0, PLAYER_SIZE/4, PLAYER_SIZE/2.2, 0, Math.PI);
    ctx.fill();
    
    ctx.fillStyle = '#fecaca';
    ctx.fillRect(-PLAYER_SIZE/4, -PLAYER_SIZE/4, PLAYER_SIZE/2, PLAYER_SIZE/3);

    ctx.fillStyle = '#000000';
    ctx.beginPath(); ctx.arc(-PLAYER_SIZE/8, -PLAYER_SIZE/8, 3, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(PLAYER_SIZE/8, -PLAYER_SIZE/8, 3, 0, Math.PI*2); ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-PLAYER_SIZE/2, -PLAYER_SIZE/2 - 2, PLAYER_SIZE, 10);
    
    ctx.fillStyle = COLORS.PLAYER;
    ctx.beginPath();
    ctx.moveTo(-PLAYER_SIZE/2, -PLAYER_SIZE/2);
    ctx.lineTo(0, -PLAYER_SIZE - 5);
    ctx.lineTo(PLAYER_SIZE/2, -PLAYER_SIZE/2);
    ctx.fill();
    
    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.arc(0, -PLAYER_SIZE - 7, 8, 0, Math.PI*2); ctx.fill();

    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-PLAYER_SIZE/2 - 10, PLAYER_SIZE/2 + 2);
    ctx.lineTo(PLAYER_SIZE/2 + 10, PLAYER_SIZE/2 + 2);
    ctx.stroke();

    ctx.restore();
  };

  const draw = useCallback((ctx: CanvasRenderingContext2D) => {
    ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    drawBackground(ctx);

    ctx.fillStyle = COLORS.GROUND;
    ctx.fillRect(0, GROUND_Y, GAME_WIDTH, GAME_HEIGHT - GROUND_Y);
    ctx.fillStyle = '#cbd5e1';
    ctx.fillRect(0, GROUND_Y, GAME_WIDTH, 6);

    obstaclesRef.current.forEach(obs => {
      drawChristmasTree(ctx, obs.pos.x, obs.pos.y, obs.size.x, obs.size.y);
    });

    particlesRef.current.draw(ctx);

    if (gameState === GameState.PLAYING || gameState === GameState.START || gameState === GameState.WIN) {
      drawSanta(ctx);
    }
  }, [gameState]);

  const loop = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    update();
    draw(ctx);
    frameRef.current = requestAnimationFrame(loop);
  }, [update, draw]);

  useEffect(() => {
    frameRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frameRef.current);
  }, [loop]);

  return (
    <div className="relative w-full h-full flex items-center justify-center bg-slate-950 overflow-hidden" onClick={jump}>
      <canvas
        ref={canvasRef}
        width={GAME_WIDTH}
        height={GAME_HEIGHT}
        className="max-w-full max-h-full object-contain cursor-pointer shadow-inner rounded-xl border-4 border-slate-800"
      />
    </div>
  );
};

export default GameCanvas;
