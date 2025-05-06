
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, ArrowUp, ArrowRight, ArrowDown } from 'lucide-react';
import CoinDisplay from '@/components/ui/CoinDisplay';

type Board = number[][];
type Direction = 'up' | 'right' | 'down' | 'left';

const Game2048 = () => {
  const [board, setBoard] = useState<Board>([]);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [gameWon, setGameWon] = useState(false);
  const [highestTile, setHighestTile] = useState(0);
  const { user, updateUserCoins } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to login if no user
    if (!user) {
      navigate('/login');
    } else {
      initGame();
    }
  }, [user, navigate]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (gameOver || gameWon) return;
      
      switch (event.key) {
        case 'ArrowUp':
          move('up');
          break;
        case 'ArrowRight':
          move('right');
          break;
        case 'ArrowDown':
          move('down');
          break;
        case 'ArrowLeft':
          move('left');
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [board, gameOver, gameWon]);

  const initGame = () => {
    const newBoard = Array(4).fill(0).map(() => Array(4).fill(0));
    addRandomTile(newBoard);
    addRandomTile(newBoard);
    setBoard(newBoard);
    setScore(0);
    setGameOver(false);
    setGameWon(false);
    setHighestTile(0);
  };

  const addRandomTile = (board: Board) => {
    const emptyCells = [];
    
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 4; j++) {
        if (board[i][j] === 0) {
          emptyCells.push({ i, j });
        }
      }
    }
    
    if (emptyCells.length > 0) {
      const { i, j } = emptyCells[Math.floor(Math.random() * emptyCells.length)];
      board[i][j] = Math.random() < 0.9 ? 2 : 4;
    }
  };

  const rotateBoard = (board: Board): Board => {
    const newBoard: Board = Array(4).fill(0).map(() => Array(4).fill(0));
    
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 4; j++) {
        newBoard[i][j] = board[3 - j][i];
      }
    }
    
    return newBoard;
  };

  const reverseBoard = (board: Board): Board => {
    return board.map(row => [...row].reverse());
  };

  const move = (direction: Direction) => {
    let newBoard = [...board.map(row => [...row])];
    let boardChanged = false;
    let addedScore = 0;
    let newHighestTile = highestTile;
    
    // Transform the board according to the move direction
    if (direction === 'up') {
      newBoard = rotateBoard(newBoard);
      newBoard = rotateBoard(newBoard);
      newBoard = rotateBoard(newBoard);
    } else if (direction === 'right') {
      // No transformation needed
    } else if (direction === 'down') {
      newBoard = rotateBoard(newBoard);
    } else if (direction === 'left') {
      newBoard = reverseBoard(newBoard);
    }
    
    // Process each row
    for (let i = 0; i < 4; i++) {
      const result = processRow(newBoard[i]);
      newBoard[i] = result.row;
      addedScore += result.score;
      boardChanged = boardChanged || result.changed;
      newHighestTile = Math.max(newHighestTile, ...result.row);
    }
    
    // Transform back
    if (direction === 'up') {
      newBoard = rotateBoard(newBoard);
    } else if (direction === 'right') {
      // No transformation needed
    } else if (direction === 'down') {
      newBoard = rotateBoard(newBoard);
      newBoard = rotateBoard(newBoard);
      newBoard = rotateBoard(newBoard);
    } else if (direction === 'left') {
      newBoard = reverseBoard(newBoard);
    }
    
    if (boardChanged) {
      addRandomTile(newBoard);
      setBoard(newBoard);
      setScore(prevScore => prevScore + addedScore);
      
      // Check for 2048 tile
      if (newHighestTile >= 2048 && !gameWon) {
        setGameWon(true);
        const reward = 10;
        updateUserCoins(reward);
        toast({
          title: "Congratulations!",
          description: `You reached 2048 and earned ${reward} coins!`,
        });
      }
      
      // Update highest tile
      setHighestTile(newHighestTile);
      
      // Check if game is over
      if (isGameOver(newBoard)) {
        setGameOver(true);
        // Give reward based on highest tile
        let reward = 0;
        if (newHighestTile >= 1024) reward = 8;
        else if (newHighestTile >= 512) reward = 6;
        else if (newHighestTile >= 256) reward = 4;
        else if (newHighestTile >= 128) reward = 2;
        
        if (reward > 0) {
          updateUserCoins(reward);
          toast({
            title: "Game Over!",
            description: `You reached ${newHighestTile} and earned ${reward} coins!`,
          });
        } else {
          toast({
            title: "Game Over!",
            description: "Try again to earn coins!",
            variant: "destructive",
          });
        }
      }
    }
  };

  const processRow = (row: number[]): { row: number[]; score: number; changed: boolean; } => {
    // Remove zeros
    let tiles = row.filter(tile => tile !== 0);
    let score = 0;
    let changed = tiles.length < row.length;
    
    // Merge tiles
    for (let i = 0; i < tiles.length - 1; i++) {
      if (tiles[i] === tiles[i + 1]) {
        tiles[i] *= 2;
        tiles[i + 1] = 0;
        score += tiles[i];
        changed = true;
      }
    }
    
    // Remove zeros again
    tiles = tiles.filter(tile => tile !== 0);
    
    // Fill with zeros
    while (tiles.length < 4) {
      tiles.push(0);
    }
    
    return { row: tiles, score, changed };
  };

  const isGameOver = (board: Board): boolean => {
    // Check for empty cells
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 4; j++) {
        if (board[i][j] === 0) {
          return false;
        }
      }
    }
    
    // Check for possible merges
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 3; j++) {
        if (board[i][j] === board[i][j + 1]) {
          return false;
        }
      }
    }
    
    for (let j = 0; j < 4; j++) {
      for (let i = 0; i < 3; i++) {
        if (board[i][j] === board[i + 1][j]) {
          return false;
        }
      }
    }
    
    return true;
  };

  const getTileColor = (value: number) => {
    switch (value) {
      case 2: return 'bg-gray-200 text-gray-800';
      case 4: return 'bg-amber-100 text-gray-800';
      case 8: return 'bg-orange-200 text-white';
      case 16: return 'bg-orange-300 text-white';
      case 32: return 'bg-orange-400 text-white';
      case 64: return 'bg-orange-500 text-white';
      case 128: return 'bg-yellow-300 text-white';
      case 256: return 'bg-yellow-400 text-white';
      case 512: return 'bg-yellow-500 text-white';
      case 1024: return 'bg-yellow-600 text-white';
      case 2048: return 'bg-game-gold text-white';
      default: return 'bg-gray-100 dark:bg-gray-700';
    }
  };

  const getFontSize = (value: number) => {
    return value >= 1000 ? 'text-lg' : 'text-xl';
  };

  if (!user) return null;

  return (
    <div className="p-4">
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
          <h1 className="text-2xl font-bold text-white">2048</h1>
        </div>
        <CoinDisplay />
      </div>
      
      <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-md rounded-xl p-4 shadow-lg">
        <div className="flex justify-between items-center mb-4">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Score</p>
            <p className="text-2xl font-bold">{score}</p>
          </div>
          <Button 
            onClick={initGame}
            className="game-button"
          >
            New Game
          </Button>
        </div>
        
        <div className="grid grid-cols-4 gap-2 bg-gray-300 dark:bg-gray-700 p-2 rounded-lg mb-4">
          {board.map((row, i) => (
            row.map((cell, j) => (
              <div
                key={`${i}-${j}`}
                className={`w-16 h-16 flex items-center justify-center ${getTileColor(cell)} ${getFontSize(cell)} font-bold rounded transition-all`}
              >
                {cell !== 0 ? cell : ''}
              </div>
            ))
          ))}
        </div>
        
        {/* Mobile controls */}
        <div className="grid grid-cols-3 gap-2 max-w-[180px] mx-auto mt-6">
          <div className="col-start-2">
            <Button 
              variant="outline" 
              size="icon" 
              className="w-14 h-14" 
              onClick={() => move('up')}
            >
              <ArrowUp className="h-6 w-6" />
            </Button>
          </div>
          <div className="col-start-1">
            <Button 
              variant="outline" 
              size="icon" 
              className="w-14 h-14" 
              onClick={() => move('left')}
            >
              <ArrowLeft className="h-6 w-6" />
            </Button>
          </div>
          <div className="col-start-3">
            <Button 
              variant="outline" 
              size="icon" 
              className="w-14 h-14" 
              onClick={() => move('right')}
            >
              <ArrowRight className="h-6 w-6" />
            </Button>
          </div>
          <div className="col-start-2">
            <Button 
              variant="outline" 
              size="icon" 
              className="w-14 h-14" 
              onClick={() => move('down')}
            >
              <ArrowDown className="h-6 w-6" />
            </Button>
          </div>
        </div>
      </div>
      
      <div className="mt-4 text-center text-sm text-white/80">
        <p>{gameOver ? 'Game over! Start a new game to continue.' : 'Swipe or use arrow keys to move tiles.'}</p>
      </div>
      
      {(gameOver || gameWon) && (
        <div className="mt-4 text-center">
          <p className="text-white font-medium">
            {gameWon ? 'Congratulations! You reached 2048!' : `Game over! Highest tile: ${highestTile}`}
          </p>
        </div>
      )}
    </div>
  );
};

export default Game2048;
