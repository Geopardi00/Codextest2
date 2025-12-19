
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GameState } from './types';
import GameCanvas from './components/GameCanvas';
import UIOverlay from './components/UIOverlay';
import { getFestiveRoast, getWelcomeMessage } from './services/geminiService';
import { TARGET_WORD, PRIZE_INTERVAL, BGM_URL } from './constants';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(GameState.START);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => {
    const saved = localStorage.getItem('sleighDashHighScore');
    return saved ? parseInt(saved, 10) : 0;
  });
  const [attempts, setAttempts] = useState(1);
  const [festiveMessage, setFestiveMessage] = useState('Loading festive greetings...');
  const [collectedLetters, setCollectedLetters] = useState<string[]>([]);
  const [isMuted, setIsMuted] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const fetchWelcome = async () => {
      const msg = await getWelcomeMessage();
      setFestiveMessage(msg);
    };
    fetchWelcome();

    // Initialize Audio
    const audio = new Audio(BGM_URL);
    audio.loop = true;
    audio.volume = 0.4;
    audioRef.current = audio;

    return () => {
      audio.pause();
      audioRef.current = null;
    };
  }, []);

  // Sync audio with game state
  useEffect(() => {
    if (!audioRef.current) return;

    if (gameState === GameState.PLAYING && !isMuted) {
      audioRef.current.play().catch(e => console.log("Audio play blocked:", e));
    } else if (gameState === GameState.GAMEOVER || gameState === GameState.WIN || gameState === GameState.START) {
      audioRef.current.pause();
      if (gameState === GameState.GAMEOVER) {
        audioRef.current.currentTime = 0; // Restart track for next attempt
      }
    }
  }, [gameState, isMuted]);

  const toggleMute = useCallback(() => {
    setIsMuted(prev => {
      const newMuted = !prev;
      if (audioRef.current) {
        if (newMuted) audioRef.current.pause();
        else if (gameState === GameState.PLAYING) audioRef.current.play();
      }
      return newMuted;
    });
  }, [gameState]);

  const handleStart = useCallback(() => {
    setGameState(GameState.PLAYING);
    setScore(0);
    setCollectedLetters([]);
  }, []);

  const handleGameOver = useCallback(async (finalScore: number) => {
    if (gameState === GameState.WIN) return;

    setGameState(GameState.GAMEOVER);
    setAttempts(prev => prev + 1);
    
    if (finalScore > highScore) {
      setHighScore(finalScore);
      localStorage.setItem('sleighDashHighScore', finalScore.toString());
    }

    setFestiveMessage("Checking the Naughty List...");
    const roast = await getFestiveRoast(finalScore, attempts);
    setFestiveMessage(roast);
  }, [highScore, attempts, gameState]);

  const handleScoreUpdate = useCallback((newScore: number) => {
    setScore(newScore);
    const targetCount = Math.floor(newScore / PRIZE_INTERVAL);
    
    if (targetCount > collectedLetters.length && collectedLetters.length < TARGET_WORD.length) {
      const nextLetter = TARGET_WORD[collectedLetters.length];
      setCollectedLetters(prev => {
        const updated = [...prev, nextLetter];
        if (updated.length === TARGET_WORD.length) {
          setGameState(GameState.WIN);
        }
        return updated;
      });
    }
  }, [collectedLetters.length]);

  return (
    <div className="w-full h-screen bg-slate-950 flex flex-col relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-green-500/10 via-transparent to-transparent pointer-events-none"></div>

      {/* Mute Toggle UI */}
      <button 
        onClick={toggleMute}
        className="fixed top-6 right-6 z-[60] w-12 h-12 flex items-center justify-center bg-slate-900/50 hover:bg-slate-800/80 backdrop-blur-md rounded-full border border-white/10 text-white transition-all shadow-xl"
      >
        <i className={`fa-solid ${isMuted ? 'fa-volume-xmark text-red-400' : 'fa-volume-high text-green-400 animate-pulse'}`}></i>
      </button>

      <GameCanvas 
        gameState={gameState} 
        onGameOver={handleGameOver} 
        onScoreUpdate={handleScoreUpdate}
      />
      
      <UIOverlay 
        gameState={gameState} 
        score={score} 
        highScore={highScore}
        attempts={attempts}
        festiveMessage={festiveMessage}
        collectedLetters={collectedLetters}
        onStart={handleStart}
      />

      <div className="fixed bottom-16 left-1/2 -translate-x-1/2 z-40 flex gap-2 p-3 bg-slate-900/80 backdrop-blur-md rounded-2xl border border-white/10 shadow-2xl min-h-[64px] min-w-[64px] items-center justify-center transition-all duration-500">
        {collectedLetters.length > 0 ? (
          collectedLetters.map((letter, idx) => (
            <div 
              key={idx}
              className="w-10 h-10 flex items-center justify-center rounded-lg font-game text-xl transition-all duration-500 bg-yellow-500 text-slate-900 shadow-[0_0_15px_rgba(234,179,8,0.5)] scale-110 animate-bounce"
            >
              {letter}
            </div>
          ))
        ) : (
          <div className="text-slate-500 text-[10px] uppercase font-bold tracking-[0.2em] px-4 animate-pulse">
            Collect {TARGET_WORD.length} Letters
          </div>
        )}
      </div>

      <div className="fixed bottom-4 right-4 z-50 pointer-events-none">
        <div className="bg-slate-900/90 px-4 py-2 rounded-full border border-white/10 text-white flex items-center gap-3 text-xs backdrop-blur-md shadow-2xl">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-ping"></div>
          <span className="font-bold tracking-widest uppercase">Xmas Vibes High</span>
          <i className="fa-solid fa-snowflake text-blue-300"></i>
        </div>
      </div>
    </div>
  );
};

export default App;
