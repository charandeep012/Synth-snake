import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, SkipForward, SkipBack, Volume2, VolumeX, Gamepad2 } from 'lucide-react';

// --- Types & Constants ---
type Point = { x: number; y: number };
const GRID_SIZE = 20;
const CELL_SIZE = 20; // px
const INITIAL_SNAKE: Point[] = [
  { x: 10, y: 10 },
  { x: 10, y: 11 },
  { x: 10, y: 12 },
];
const INITIAL_DIRECTION: Point = { x: 0, y: -1 };
const GAME_SPEED = 120;

const TRACKS = [
  {
    id: 1,
    title: "Neon Dreams",
    artist: "Cyber AI",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
    cover: "https://picsum.photos/seed/neon1/200/200"
  },
  {
    id: 2,
    title: "Synthwave City",
    artist: "Neural Net",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
    cover: "https://picsum.photos/seed/neon2/200/200"
  },
  {
    id: 3,
    title: "Digital Horizon",
    artist: "Algorithm",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
    cover: "https://picsum.photos/seed/neon3/200/200"
  }
];

export default function App() {
  // --- Game State ---
  const [snake, setSnake] = useState<Point[]>(INITIAL_SNAKE);
  const [direction, setDirection] = useState<Point>(INITIAL_DIRECTION);
  const [food, setFood] = useState<Point>({ x: 5, y: 5 });
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => {
    try {
      const saved = localStorage.getItem('synthSnakeHighScore');
      return saved ? parseInt(saved, 10) : 0;
    } catch (e) {
      return 0;
    }
  });
  const [isPaused, setIsPaused] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);

  // Refs for game loop
  const snakeRef = useRef(snake);
  const directionRef = useRef(direction);
  const foodRef = useRef(food);
  const gameOverRef = useRef(gameOver);
  const isPausedRef = useRef(isPaused);
  const hasStartedRef = useRef(hasStarted);

  useEffect(() => { snakeRef.current = snake; }, [snake]);
  useEffect(() => { directionRef.current = direction; }, [direction]);
  useEffect(() => { foodRef.current = food; }, [food]);
  useEffect(() => { gameOverRef.current = gameOver; }, [gameOver]);
  useEffect(() => { isPausedRef.current = isPaused; }, [isPaused]);
  useEffect(() => { hasStartedRef.current = hasStarted; }, [hasStarted]);

  // --- Music Player State ---
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);

  const currentTrack = TRACKS[currentTrackIndex];

  // --- Game Logic ---
  const generateFood = useCallback(() => {
    let newFood;
    while (true) {
      newFood = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE),
      };
      const onSnake = snakeRef.current.some(segment => segment.x === newFood.x && segment.y === newFood.y);
      if (!onSnake) break;
    }
    setFood(newFood);
  }, []);

  const resetGame = () => {
    setSnake(INITIAL_SNAKE);
    setDirection(INITIAL_DIRECTION);
    setScore(0);
    setGameOver(false);
    setHasStarted(true);
    generateFood();
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLButtonElement || e.target instanceof HTMLInputElement) {
        return;
      }

      // Prevent default scrolling for arrow keys and space
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault();
      }

      if (gameOverRef.current) return;
      
      if (!hasStartedRef.current && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'a', 's', 'd'].includes(e.key)) {
        setHasStarted(true);
      }

      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          if (directionRef.current.y !== 1) setDirection({ x: 0, y: -1 });
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          if (directionRef.current.y !== -1) setDirection({ x: 0, y: 1 });
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          if (directionRef.current.x !== 1) setDirection({ x: -1, y: 0 });
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          if (directionRef.current.x !== -1) setDirection({ x: 1, y: 0 });
          break;
        case ' ':
          if (hasStartedRef.current) {
            setIsPaused(p => !p);
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown, { passive: false });
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    const moveSnake = () => {
      if (gameOverRef.current || isPausedRef.current || !hasStartedRef.current) return;

      const currentSnake = [...snakeRef.current];
      const head = { ...currentSnake[0] };
      const dir = directionRef.current;

      head.x += dir.x;
      head.y += dir.y;

      const triggerGameOver = () => {
        setGameOver(true);
        setScore(s => {
          setHighScore(prev => {
            const newHigh = Math.max(prev, s);
            try { localStorage.setItem('synthSnakeHighScore', newHigh.toString()); } catch(e) {}
            return newHigh;
          });
          return s;
        });
      };

      // Check collision with walls
      if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) {
        triggerGameOver();
        return;
      }

      // Check collision with self
      if (currentSnake.some(segment => segment.x === head.x && segment.y === head.y)) {
        triggerGameOver();
        return;
      }

      currentSnake.unshift(head);

      // Check food
      if (head.x === foodRef.current.x && head.y === foodRef.current.y) {
        setScore(s => s + 10);
        generateFood();
      } else {
        currentSnake.pop();
      }

      setSnake(currentSnake);
    };

    const gameInterval = setInterval(moveSnake, GAME_SPEED);
    return () => clearInterval(gameInterval);
  }, [generateFood]);

  // --- Music Player Logic ---
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        const playPromise = audioRef.current.play();
        if (playPromise !== undefined) {
          playPromise.catch((error) => {
            console.error("Audio playback failed:", error);
            setIsPlaying(false);
          });
        }
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying, currentTrackIndex]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateProgress = () => {
      setProgress((audio.currentTime / audio.duration) * 100 || 0);
    };

    audio.addEventListener('timeupdate', updateProgress);
    return () => audio.removeEventListener('timeupdate', updateProgress);
  }, []);

  const togglePlay = () => setIsPlaying(!isPlaying);

  const nextTrack = () => {
    setCurrentTrackIndex((prev) => (prev + 1) % TRACKS.length);
    setIsPlaying(true);
  };

  const prevTrack = () => {
    setCurrentTrackIndex((prev) => (prev - 1 + TRACKS.length) % TRACKS.length);
    setIsPlaying(true);
  };

  const handleEnded = () => {
    nextTrack();
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    audioRef.current.currentTime = percentage * audioRef.current.duration;
  };

  return (
    <div className="min-h-screen bg-[#050505] text-cyan-50 font-sans flex flex-col items-center justify-between p-4 sm:p-8 overflow-hidden selection:bg-fuchsia-500/30">
      <div className="fixed inset-0 pointer-events-none scanlines z-50 opacity-50"></div>
      {/* Header */}
      <header className="w-full max-w-4xl flex flex-col sm:flex-row justify-between items-center mb-6 sm:mb-8 gap-4 border-b-2 border-fuchsia-500/50 pb-4 relative z-10">
        <div className="flex items-center gap-3">
          <Gamepad2 className="w-10 h-10 text-cyan-400 drop-shadow-[0_0_10px_rgba(0,255,255,0.8)]" />
          <h1 
            className="text-4xl sm:text-5xl font-black tracking-widest uppercase text-white glitch drop-shadow-[0_0_10px_rgba(255,0,255,0.8)]"
            data-text="SYNTH_SNAKE"
          >
            SYNTH_SNAKE
          </h1>
        </div>
        <div className="flex flex-col items-end border-l-2 border-cyan-400/50 pl-4">
          <div className="text-2xl sm:text-3xl font-bold text-fuchsia-400 drop-shadow-[0_0_8px_rgba(255,0,255,0.6)] font-mono">
            SCORE: {score.toString().padStart(4, '0')}
          </div>
          <div className="text-sm sm:text-base font-bold text-cyan-400 drop-shadow-[0_0_8px_rgba(0,255,255,0.6)] font-mono">
            HI-SCORE: {highScore.toString().padStart(4, '0')}
          </div>
        </div>
      </header>

      {/* Main Game Area */}
      <main className="flex-1 flex items-center justify-center w-full relative z-10">
        <div 
          className="relative bg-[#050505] border-2 border-fuchsia-500 shadow-[0_0_30px_rgba(255,0,255,0.2)]"
          style={{ 
            width: `${GRID_SIZE * CELL_SIZE}px`, 
            height: `${GRID_SIZE * CELL_SIZE}px` 
          }}
        >
          {/* Grid Background */}
          <div className="absolute inset-0 opacity-20" style={{
            backgroundImage: 'linear-gradient(to right, #0ff 1px, transparent 1px), linear-gradient(to bottom, #0ff 1px, transparent 1px)',
            backgroundSize: `${CELL_SIZE}px ${CELL_SIZE}px`
          }}></div>

          {/* Food */}
          <div 
            className="absolute bg-yellow-400 shadow-[0_0_15px_rgba(255,255,0,0.8)]"
            style={{ 
              width: `${CELL_SIZE - 2}px`, 
              height: `${CELL_SIZE - 2}px`,
              left: `${food.x * CELL_SIZE + 1}px`, 
              top: `${food.y * CELL_SIZE + 1}px`,
            }}
          />

          {/* Snake */}
          {snake.map((segment, index) => {
            const isHead = index === 0;
            return (
              <div
                key={`${segment.x}-${segment.y}-${index}`}
                className={`absolute ${isHead ? 'bg-cyan-400 shadow-[0_0_15px_rgba(0,255,255,0.8)] z-10' : 'bg-fuchsia-500 shadow-[0_0_10px_rgba(255,0,255,0.5)]'}`}
                style={{ 
                  width: `${CELL_SIZE - 2}px`, 
                  height: `${CELL_SIZE - 2}px`,
                  left: `${segment.x * CELL_SIZE + 1}px`, 
                  top: `${segment.y * CELL_SIZE + 1}px`,
                }}
              />
            )
          })}

          {/* Start Screen Overlay */}
          {!hasStarted && !gameOver && (
            <div className="absolute inset-0 bg-[#050505]/90 flex flex-col items-center justify-center z-20 backdrop-blur-sm">
              <Gamepad2 className="w-16 h-16 text-fuchsia-500 mb-4 drop-shadow-[0_0_15px_rgba(255,0,255,0.8)] animate-pulse" />
              <h2 className="text-2xl font-bold text-white glitch tracking-widest text-center px-4" data-text="AWAITING_INPUT">
                AWAITING_INPUT
              </h2>
              <p className="mt-4 text-cyan-400 font-mono text-sm uppercase drop-shadow-[0_0_5px_rgba(0,255,255,0.8)]">Initialize sequence via arrow keys</p>
            </div>
          )}

          {/* Game Over Overlay */}
          {gameOver && (
            <div className="absolute inset-0 bg-[#050505]/90 flex flex-col items-center justify-center z-20 backdrop-blur-sm">
              <h2 className="text-4xl font-black text-white mb-2 glitch tracking-widest text-center" data-text="FATAL_ERROR">FATAL_ERROR</h2>
              <p className="text-cyan-400 mb-8 text-xl font-mono bg-fuchsia-900/30 px-4 py-2 border-l-2 border-cyan-400 shadow-[0_0_15px_rgba(0,255,255,0.2)]">FINAL_SCORE: {score}</p>
              <button 
                onClick={resetGame}
                className="px-6 py-3 bg-transparent border-2 border-cyan-400 text-cyan-400 font-black tracking-widest uppercase hover:bg-cyan-400 hover:text-[#050505] transition-all duration-300 shadow-[0_0_15px_rgba(0,255,255,0.4)] hover:shadow-[0_0_25px_rgba(0,255,255,0.8)] cursor-pointer"
              >
                EXECUTE_REBOOT
              </button>
            </div>
          )}

          {/* Paused Overlay */}
          {isPaused && !gameOver && hasStarted && (
            <div className="absolute inset-0 bg-[#050505]/80 flex items-center justify-center z-20 backdrop-blur-sm">
              <h2 className="text-4xl font-black text-white glitch tracking-widest" data-text="SYSTEM_HALTED">SYSTEM_HALTED</h2>
            </div>
          )}
        </div>
      </main>

      {/* Footer Music Player */}
      <footer className="w-full max-w-4xl mt-6 sm:mt-8 bg-[#0a0a0a]/80 border-2 border-cyan-500 p-4 sm:p-6 shadow-[0_0_20px_rgba(0,255,255,0.15)] flex flex-col sm:flex-row items-center gap-4 sm:gap-6 relative z-10 backdrop-blur-md rounded-xl">
        <audio 
          ref={audioRef} 
          src={currentTrack.url} 
          onEnded={handleEnded}
        />
        
        {/* Track Info */}
        <div className="flex items-center gap-4 w-full sm:w-1/3">
          <div className="relative w-14 h-14 sm:w-16 sm:h-16 shrink-0 border border-fuchsia-500 shadow-[0_0_10px_rgba(255,0,255,0.4)] group overflow-hidden rounded-md">
            <img src={currentTrack.cover} alt="Cover" className={`w-full h-full object-cover transition-transform duration-1000 ${isPlaying ? 'scale-110' : 'scale-100'} filter contrast-125 saturate-150`} />
            {isPlaying && (
              <div className="absolute inset-0 bg-fuchsia-500/20 mix-blend-color-burn animate-pulse"></div>
            )}
          </div>
          <div className="flex flex-col min-w-0 border-l-2 border-cyan-400/50 pl-3">
            <span className="font-bold text-white truncate uppercase tracking-widest drop-shadow-[0_0_5px_rgba(255,0,255,0.8)]">{currentTrack.title}</span>
            <span className="text-sm text-cyan-400 truncate font-mono uppercase">{currentTrack.artist}</span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex-1 w-full flex flex-col items-center gap-4">
          <div className="flex items-center gap-6 sm:gap-8">
            <button onClick={prevTrack} className="text-cyan-400 hover:text-cyan-200 transition-colors drop-shadow-[0_0_5px_rgba(0,255,255,0.8)] cursor-pointer">
              <SkipBack className="w-6 h-6 sm:w-7 sm:h-7" />
            </button>
            <button 
              onClick={togglePlay} 
              className="w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center bg-transparent border-2 border-fuchsia-500 text-fuchsia-500 rounded-full hover:bg-fuchsia-500 hover:text-[#050505] transition-all shadow-[0_0_15px_rgba(255,0,255,0.4)] hover:shadow-[0_0_25px_rgba(255,0,255,0.8)] cursor-pointer"
            >
              {isPlaying ? <Pause className="w-6 h-6 sm:w-7 sm:h-7" /> : <Play className="w-6 h-6 sm:w-7 sm:h-7 ml-1" />}
            </button>
            <button onClick={nextTrack} className="text-cyan-400 hover:text-cyan-200 transition-colors drop-shadow-[0_0_5px_rgba(0,255,255,0.8)] cursor-pointer">
              <SkipForward className="w-6 h-6 sm:w-7 sm:h-7" />
            </button>
          </div>
          
          {/* Progress Bar */}
          <div 
            className="w-full max-w-md h-2 bg-gray-900 rounded-full overflow-hidden cursor-pointer relative group border border-cyan-900" 
            onClick={handleProgressClick}
          >
            <div 
              className="absolute top-0 left-0 h-full bg-gradient-to-r from-cyan-500 to-fuchsia-500 transition-all duration-100 ease-linear shadow-[0_0_10px_rgba(255,0,255,0.8)]" 
              style={{ width: `${progress}%` }}
            >
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 bg-white rounded-full shadow-[0_0_5px_#fff] opacity-0 group-hover:opacity-100 transition-opacity"></div>
            </div>
          </div>
        </div>

        {/* Volume */}
        <div className="hidden sm:flex w-1/3 items-center justify-end gap-3">
          <button onClick={() => setIsMuted(!isMuted)} className="text-cyan-400 hover:text-cyan-200 transition-colors drop-shadow-[0_0_5px_rgba(0,255,255,0.8)] cursor-pointer">
            {isMuted || volume === 0 ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          </button>
          <input 
            type="range" 
            min="0" 
            max="1" 
            step="0.01" 
            value={isMuted ? 0 : volume}
            onChange={(e) => {
              setVolume(parseFloat(e.target.value));
              if (isMuted) setIsMuted(false);
            }}
            className="w-24 accent-fuchsia-500 bg-gray-800 h-1 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-fuchsia-500 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:shadow-[0_0_10px_rgba(255,0,255,0.8)]"
          />
        </div>
      </footer>
    </div>
  );
}
