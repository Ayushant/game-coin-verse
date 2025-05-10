import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Grid3X3 } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import CoinDisplay from '@/components/ui/CoinDisplay';
import { supabase } from '@/integrations/supabase/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  generateSudoku, 
  checkSolution, 
  DIFFICULTY 
} from '@/utils/sudokuUtils';

const Sudoku = () => {
  const [board, setBoard] = useState<number[][]>([]);
  const [initialBoard, setInitialBoard] = useState<number[][]>([]);
  const [selectedCell, setSelectedCell] = useState<[number, number] | null>(null);
  const [difficulty, setDifficulty] = useState<keyof typeof DIFFICULTY>("EASY");
  const [gameStartTime, setGameStartTime] = useState<Date | null>(null);
  const [gameOver, setGameOver] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const { user, updateUserCoins } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  // Initialize game
  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    startNewGame(difficulty);
  }, [user, navigate, difficulty]);

  // Timer logic
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (timerRunning && !gameOver) {
      interval = setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timerRunning, gameOver]);

  const startNewGame = useCallback((selectedDifficulty: keyof typeof DIFFICULTY) => {
    const { puzzle, solution } = generateSudoku(selectedDifficulty);
    setBoard(JSON.parse(JSON.stringify(puzzle)));
    setInitialBoard(JSON.parse(JSON.stringify(puzzle)));
    setSelectedCell(null);
    setGameOver(false);
    setElapsedTime(0);
    setGameStartTime(new Date());
    setTimerRunning(true);
  }, []);

  const handleCellClick = (row: number, col: number) => {
    if (initialBoard[row][col] !== 0 || gameOver) return;
    setSelectedCell([row, col]);
  };

  const handleNumberInput = (num: number) => {
    if (!selectedCell || gameOver) return;
    
    const [row, col] = selectedCell;
    
    // Don't allow changing fixed cells
    if (initialBoard[row][col] !== 0) return;
    
    const newBoard = [...board.map(r => [...r])];
    newBoard[row][col] = num === newBoard[row][col] ? 0 : num; // Toggle number if already selected
    setBoard(newBoard);
    
    // Check if board is complete and correct
    if (checkSolution(newBoard)) {
      handleGameComplete();
    }
  };

  const handleGameComplete = async () => {
    setGameOver(true);
    setTimerRunning(false);
    
    // Calculate time taken and score
    const endTime = new Date();
    const totalSeconds = Math.floor(elapsedTime);
    
    // Calculate coins based on difficulty and time
    let baseCoins = DIFFICULTY[difficulty].coins;
    
    // Time bonus: faster completion = more coins
    const maxTimeBonus = baseCoins * 0.5; // Up to 50% bonus for speed
    const targetTime = DIFFICULTY[difficulty].targetTimeSeconds;
    const timeBonus = Math.max(0, Math.floor(maxTimeBonus * (1 - Math.min(totalSeconds / targetTime, 1))));
    
    const totalCoins = baseCoins + timeBonus;
    
    // Update user coins
    updateUserCoins(totalCoins);
    
    // Show completion message
    toast({
      title: "Sudoku Complete!",
      description: `You solved the ${difficulty} puzzle in ${formatTime(totalSeconds)} and earned ${totalCoins} coins!`,
    });
    
    // Log game session if not a guest user
    if (user && !user.isGuest) {
      try {
        await supabase.from('game_sessions').insert({
          user_id: user.id,
          game_name: 'sudoku',
          score: 100 - Math.min(100, Math.floor(totalSeconds / 10)),
          coins_earned: totalCoins,
        });
      } catch (error) {
        console.error("Error logging game session:", error);
      }
    }
  };

  const formatTime = (totalSeconds: number) => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleErase = () => {
    if (!selectedCell || gameOver) return;
    
    const [row, col] = selectedCell;
    if (initialBoard[row][col] === 0) {
      const newBoard = [...board.map(r => [...r])];
      newBoard[row][col] = 0;
      setBoard(newBoard);
    }
  };

  const checkCellValidity = (row: number, col: number, value: number): boolean => {
    if (value === 0) return true; // Empty cells are valid
    
    // Check row
    for (let c = 0; c < 9; c++) {
      if (c !== col && board[row][c] === value) return false;
    }
    
    // Check column
    for (let r = 0; r < 9; r++) {
      if (r !== row && board[r][col] === value) return false;
    }
    
    // Check 3x3 box
    const boxRow = Math.floor(row / 3) * 3;
    const boxCol = Math.floor(col / 3) * 3;
    
    for (let r = boxRow; r < boxRow + 3; r++) {
      for (let c = boxCol; c < boxCol + 3; c++) {
        if ((r !== row || c !== col) && board[r][c] === value) return false;
      }
    }
    
    return true;
  };

  // Determine cell size based on device
  const getCellSize = () => {
    if (isMobile) {
      return "w-7 h-7 text-sm";
    }
    return "w-8 h-8 sm:w-10 sm:h-10 text-lg";
  };

  if (!user) return null;

  return (
    <div className="p-4 pb-20">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Button 
            variant="ghost" 
            size="icon" 
            className="mr-2 text-white" 
            onClick={() => navigate('/games')}
          >
            <ArrowLeft className="h-6 w-6" />
          </Button>
          <h1 className="text-2xl font-bold text-white">Sudoku</h1>
        </div>
        <CoinDisplay />
      </div>
      
      {/* Adding game image at the top */}
      <div className="flex justify-center mb-4">
        <img 
          src="/lovable-uploads/895ab5f3-acb4-452a-aba4-99b9bef9cde6.png" 
          alt="Pacman ghosts" 
          className="h-16 object-contain"
        />
      </div>
      
      <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-md rounded-xl p-4 shadow-lg">
        <div className="flex justify-between items-center mb-4">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Time</p>
            <p className="text-xl font-bold">{formatTime(elapsedTime)}</p>
          </div>
          <div>
            <Button 
              onClick={() => startNewGame(difficulty)}
              className="game-button"
            >
              New Game
            </Button>
          </div>
        </div>

        <Tabs 
          defaultValue="EASY" 
          onValueChange={(val) => setDifficulty(val as keyof typeof DIFFICULTY)}
          className="mb-4"
        >
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="EASY">Easy</TabsTrigger>
            <TabsTrigger value="MEDIUM">Medium</TabsTrigger>
            <TabsTrigger value="HARD">Hard</TabsTrigger>
          </TabsList>
        </Tabs>
        
        {/* Sudoku Board - adjusted for mobile */}
        <div className="flex justify-center mb-4">
          <div className="grid grid-cols-9 gap-0.5 bg-gray-300 dark:bg-gray-700 p-0.5 border-2 border-gray-800 dark:border-gray-500">
            {board.map((row, rowIndex) =>
              row.map((cell, colIndex) => {
                const isSelected = selectedCell && selectedCell[0] === rowIndex && selectedCell[1] === colIndex;
                const isFixed = initialBoard[rowIndex][colIndex] !== 0;
                const isInvalid = cell !== 0 && !checkCellValidity(rowIndex, colIndex, cell);
                const isSameVal = selectedCell && cell !== 0 && board[selectedCell[0]][selectedCell[1]] === cell;
                
                // Add border styling for 3x3 boxes
                const borderRight = (colIndex + 1) % 3 === 0 && colIndex < 8 ? 'border-r-2 border-gray-800 dark:border-gray-500' : '';
                const borderBottom = (rowIndex + 1) % 3 === 0 && rowIndex < 8 ? 'border-b-2 border-gray-800 dark:border-gray-500' : '';

                return (
                  <div
                    key={`${rowIndex}-${colIndex}`}
                    className={`${getCellSize()} flex items-center justify-center ${borderRight} ${borderBottom}
                      ${isFixed ? 'bg-gray-200 dark:bg-gray-600 font-bold' : 'bg-white dark:bg-gray-800'}
                      ${isSelected ? 'bg-blue-100 dark:bg-blue-900' : ''}
                      ${isSameVal ? 'bg-blue-50 dark:bg-blue-800/50' : ''}
                      ${isInvalid ? 'text-red-500' : 'text-black dark:text-white'}
                      cursor-pointer`}
                    onClick={() => handleCellClick(rowIndex, colIndex)}
                  >
                    {cell !== 0 ? cell : ''}
                  </div>
                );
              })
            )}
          </div>
        </div>
        
        {/* Number Input Pad - adjusted for mobile */}
        <div className="grid grid-cols-9 gap-1 mb-4">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
            <button
              key={num}
              onClick={() => handleNumberInput(num)}
              className={`${isMobile ? 'w-7 h-9' : 'w-8 h-8 sm:w-10 sm:h-10'} bg-gray-200 dark:bg-gray-600 rounded font-bold 
                ${isMobile ? 'text-base' : 'text-lg'}
                hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors`}
              disabled={gameOver}
            >
              {num}
            </button>
          ))}
        </div>
        
        <div className="flex justify-center">
          <Button onClick={handleErase} className="mr-2" disabled={gameOver}>
            Erase
          </Button>
          <Button onClick={() => startNewGame(difficulty)} className="ml-2">
            {gameOver ? 'Play Again' : 'New Game'}
          </Button>
        </div>
        
        {gameOver && (
          <div className="mt-4 text-center animate-fade-in">
            <p className="text-xl font-bold">Puzzle Solved! 🎉</p>
            <p>Time: {formatTime(elapsedTime)}</p>
          </div>
        )}
      </div>
      
      <div className="mt-4 text-center text-sm text-white/80">
        <p>Complete puzzles to earn coins! Harder puzzles = more coins.</p>
        <p>Solving quickly earns bonus coins!</p>
      </div>
    </div>
  );
};

export default Sudoku;
