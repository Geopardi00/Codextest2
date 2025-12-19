
import React from 'react';
import { GameState } from '../types';
import { TARGET_WORD } from '../constants';

interface UIOverlayProps {
  gameState: GameState;
  score: number;
  highScore: number;
  attempts: number;
  festiveMessage: string;
  collectedLetters: string[];
  onStart: () => void;
}

const UIOverlay: React.FC<UIOverlayProps> = ({ 
  gameState, 
  score, 
  highScore, 
  attempts, 
  festiveMessage,
  collectedLetters,
  onStart 
}) => {
  if (gameState === GameState.PLAYING) {
    return (
      <div className="absolute top-8 left-8 flex flex-col pointer-events-none">
        <div className="text-white text-3xl font-game drop-shadow-lg flex items-baseline gap-2">
          SCORE: {score}
          <span className="text-yellow-400 text-sm animate-pulse">
             (Next letter at {(Math.floor(score / 50) + 1) * 50})
          </span>
        </div>
        <div className="text-blue-200 text-sm font-bold opacity-80 uppercase tracking-widest">Attempt #{attempts}</div>
        <div className="text-white/40 text-[10px] mt-2 font-bold uppercase tracking-tighter">Collect letters to save Rudolph!</div>
      </div>
    );
  }

  const isWin = gameState === GameState.WIN;

  return (
    <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-md z-50">
      <div className={`p-10 rounded-3xl border-4 shadow-2xl text-center max-w-md w-full animate-in zoom-in duration-500 overflow-hidden relative ${
        isWin ? 'bg-gradient-to-b from-red-900 to-red-800 border-yellow-500' : 'bg-slate-800/95 border-white/20'
      }`}>
        
        {isWin && (
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 left-0 w-full h-full animate-[ping_3s_linear_infinite] bg-yellow-400/10"></div>
          </div>
        )}

        <h1 className={`font-game mb-4 tracking-wider ${
          isWin ? 'text-6xl text-yellow-400 drop-shadow-[0_0_15px_rgba(234,179,8,1)]' : 'text-5xl text-white'
        }`}>
          {gameState === GameState.START ? 'SLEIGH DASH' : isWin ? 'YOU WON!' : 'CRASHED!'}
        </h1>
        
        {isWin ? (
          <div className="mb-8 space-y-4">
            <div className="text-white text-2xl font-bold italic animate-bounce">
              "HO HO HO! CHRISTMAS IS SAVED!"
            </div>
            <p className="text-blue-100 opacity-90">
              You collected all the letters and found Rudolph. Santa can now deliver all the presents on time!
            </p>
            <div className="flex justify-center gap-1">
               {TARGET_WORD.split('').map((l, i) => (
                 <span key={i} className="text-4xl font-game text-yellow-400">{l}</span>
               ))}
            </div>
          </div>
        ) : (
          gameState === GameState.GAMEOVER && (
            <div className="mb-6 space-y-2">
              <div className="text-red-400 font-bold italic px-4 py-2 bg-red-950/30 rounded-lg">
                "{festiveMessage}"
              </div>
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="bg-slate-700 p-3 rounded-xl">
                  <div className="text-slate-400 text-xs uppercase font-bold">Score</div>
                  <div className="text-white text-2xl font-game">{score}</div>
                </div>
                <div className="bg-slate-700 p-3 rounded-xl">
                  <div className="text-slate-400 text-xs uppercase font-bold">Best</div>
                  <div className="text-white text-2xl font-game">{highScore}</div>
                </div>
              </div>
            </div>
          )
        )}

        {gameState === GameState.START && (
          <div className="text-blue-200 mb-8 italic">
            "{festiveMessage}"
          </div>
        )}

        <button
          onClick={onStart}
          className={`w-full py-4 text-white font-game text-2xl rounded-2xl shadow-lg transform transition active:scale-95 border-b-4 ${
            isWin 
            ? 'bg-gradient-to-r from-yellow-600 to-yellow-500 hover:from-yellow-500 border-yellow-800' 
            : 'bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 border-red-800'
          }`}
        >
          {gameState === GameState.START ? 'START RUN' : isWin ? 'PLAY AGAIN' : 'TRY AGAIN'}
        </button>

        <div className="mt-8 text-slate-400 text-sm space-y-1">
          <p>SPACE / CLICK / UP to Jump</p>
          <p className="text-blue-300 font-bold">Collect all letters to WIN!</p>
          {!isWin && <p className="opacity-60 pt-2">High Score: {highScore}</p>}
        </div>
      </div>
    </div>
  );
};

export default UIOverlay;
