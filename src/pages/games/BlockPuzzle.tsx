
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, RefreshCw, Trash, Plus } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card } from '@/components/ui/card';
import CoinDisplay from '@/components/ui/CoinDisplay';

interface Block {
  id: number;
  shape: boolean[][];
  color: string;
}

// Grid size
const GRID_SIZE = 10;

// Block colors
const BLOCK_COLORS = [
  'bg-blue-500',
  'bg-green-500',
  'bg-yellow-500',
  'bg-purple-500', 
  'bg-pink-500',
  'bg-red-500',
  'bg-indigo-500',
  'bg-orange-500',
];

const BlockPuzzle = () => {
  const navigate = useNavigate();
  const { user, updateUserCoins } = useAuth();
  const { toast } = useToast();
  
  // Game state
  const [gameActive, setGameActive] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [earnedCoins, setEarnedCoins] = useState(0);
  const [highScore, setHighScore] = useState(0);
  
  // Board state
  const [grid, setGrid] = useState<string[][]>(
    Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(''))
  );
  
  // Available blocks
  const [availableBlocks, setAvailableBlocks] = useState<Block[]>([]);
  
  // Selected block for placement
  const [selectedBlockIndex, setSelectedBlockIndex] = useState<number | null>(null);
  
  // Create shapes for blocks
  const createShapes = useCallback(() => {
    const shapes = [
      // 1x1
      [[true]],
      
      // 2x2
      [
        [true, true],
        [true, true]
      ],
      
      // Horizontal lines
      [[true, true, true]],
      [[true, true, true, true]],
      [[true, true, true, true, true]],
      
      // Vertical lines
      [[true], [true], [true]],
      [[true], [true], [true], [true]],
      [[true], [true], [true], [true], [true]],
      
      // L shapes
      [
        [true, false],
        [true, false],
        [true, true]
      ],
      [
        [false, true],
        [false, true],
        [true, true]
      ],
      [
        [true, true, true],
        [true, false, false]
      ],
      [
        [true, true, true],
        [false, false, true]
      ],
      
      // T shapes
      [
        [true, true, true],
        [false, true, false]
      ],
      [
        [false, true, false],
        [true, true, true]
      ],
      [
        [true, false],
        [true, true],
        [true, false]
      ],
      [
        [false, true],
        [true, true],
        [false, true]
      ],
      
      // Z shapes
      [
        [true, true, false],
        [false, true, true]
      ],
      [
        [false, true, true],
        [true, true, false]
      ],
      [
        [true, false],
        [true, true],
        [false, true]
      ],
      [
        [false, true],
        [true, true],
        [true, false]
      ]
    ];
    
    return shapes;
  }, []);
  
  // Generate a new block
  const generateBlock = useCallback((): Block => {
    const shapes = createShapes();
    const randomShape = shapes[Math.floor(Math.random() * shapes.length)];
    const randomColor = BLOCK_COLORS[Math.floor(Math.random() * BLOCK_COLORS.length)];
    
    return {
      id: Date.now() + Math.floor(Math.random() * 1000),
      shape: randomShape,
      color: randomColor
    };
  }, [createShapes]);
  
  // Generate 3 new blocks
  const generateNewBlocks = useCallback(() => {
    return [generateBlock(), generateBlock(), generateBlock()];
  }, [generateBlock]);
  
  // Check if a block can be placed at a specific position
  const canPlaceBlock = (block: Block, rowStart: number, colStart: number): boolean => {
    const { shape } = block;
    
    for (let row = 0; row < shape.length; row++) {
      for (let col = 0; col < shape[0].length; col++) {
        if (shape[row][col]) {
          const newRow = rowStart + row;
          const newCol = colStart + col;
          
          // Check if out of bounds
          if (newRow >= GRID_SIZE || newCol >= GRID_SIZE) {
            return false;
          }
          
          // Check if cell is already occupied
          if (grid[newRow][newCol] !== '') {
            return false;
          }
        }
      }
    }
    
    return true;
  };
  
  // Place a block on the grid
  const placeBlock = (block: Block, rowStart: number, colStart: number) => {
    const { shape, color } = block;
    const newGrid = [...grid.map(row => [...row])];
    let cellsPlaced = 0;
    
    for (let row = 0; row < shape.length; row++) {
      for (let col = 0; col < shape[0].length; col++) {
        if (shape[row][col]) {
          newGrid[rowStart + row][colStart + col] = color;
          cellsPlaced++;
        }
      }
    }
    
    setGrid(newGrid);
    return cellsPlaced;
  };
  
  // Check and clear completed rows and columns
  const checkAndClearLines = () => {
    const newGrid = [...grid.map(row => [...row])];
    let linesCleared = 0;
    
    // Check rows
    for (let row = 0; row < GRID_SIZE; row++) {
      if (newGrid[row].every(cell => cell !== '')) {
        // Clear row
        newGrid[row] = Array(GRID_SIZE).fill('');
        linesCleared++;
      }
    }
    
    // Check columns
    for (let col = 0; col < GRID_SIZE; col++) {
      if (Array.from({ length: GRID_SIZE }, (_, i) => newGrid[i][col]).every(cell => cell !== '')) {
        // Clear column
        for (let row = 0; row < GRID_SIZE; row++) {
          newGrid[row][col] = '';
        }
        linesCleared++;
      }
    }
    
    if (linesCleared > 0) {
      setGrid(newGrid);
      
      // Update score - more points for multiple lines
      const pointsEarned = linesCleared * 10 * (linesCleared > 1 ? 1.5 : 1);
      setScore(prev => prev + pointsEarned);
      
      // Show toast for cleared lines
      toast({
        title: `${linesCleared} line${linesCleared > 1 ? 's' : ''} cleared!`,
        description: `+${pointsEarned} points`,
      });
    }
    
    return linesCleared;
  };
  
  // Handle selecting a block
  const handleSelectBlock = (index: number) => {
    setSelectedBlockIndex(index === selectedBlockIndex ? null : index);
  };
  
  // Handle placing a block on the grid
  const handlePlaceBlock = (rowStart: number, colStart: number) => {
    if (selectedBlockIndex === null) return;
    
    const block = availableBlocks[selectedBlockIndex];
    if (!canPlaceBlock(block, rowStart, colStart)) return;
    
    // Place the block
    const cellsPlaced = placeBlock(block, rowStart, colStart);
    
    // Update score
    setScore(prev => prev + cellsPlaced);
    
    // Check and clear lines
    const linesCleared = checkAndClearLines();
    
    // Remove the used block and generate a replacement
    const newBlocks = [...availableBlocks];
    newBlocks[selectedBlockIndex] = generateBlock();
    setAvailableBlocks(newBlocks);
    setSelectedBlockIndex(null);
    
    // Check if game over
    checkGameOver(newBlocks);
  };
  
  // Check if the game is over (no more moves possible)
  const checkGameOver = (blocks: Block[]) => {
    // Check if any of the available blocks can be placed anywhere on the grid
    const hasMoves = blocks.some(block => {
      for (let row = 0; row < GRID_SIZE; row++) {
        for (let col = 0; col < GRID_SIZE; col++) {
          if (canPlaceBlock(block, row, col)) {
            return true;
          }
        }
      }
      return false;
    });
    
    if (!hasMoves) {
      endGame();
    }
  };
  
  // Start a new game
  const startGame = () => {
    // Reset game state
    setGrid(Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill('')));
    setScore(0);
    setAvailableBlocks(generateNewBlocks());
    setSelectedBlockIndex(null);
    setGameActive(true);
    setGameOver(false);
  };
  
  // End the game
  const endGame = async () => {
    setGameActive(false);
    setGameOver(true);
    
    // Check if this is a new high score
    if (score > highScore) {
      setHighScore(score);
    }
    
    // Calculate coins earned - 1 coin per 10 points
    const coinsEarned = Math.floor(score / 10);
    setEarnedCoins(coinsEarned);
    
    try {
      // Save game session to Supabase
      if (user && !user.isGuest) {
        await supabase
          .from('game_sessions')
          .insert({
            user_id: user.id,
            game_name: 'block_puzzle',
            score: score,
            coins_earned: coinsEarned,
          });
      }
      
      // Update user's coins
      await updateUserCoins(coinsEarned);
      
      toast({
        title: "Game Over!",
        description: `You earned ${coinsEarned} coins!`,
      });
    } catch (error) {
      console.error('Error saving game session:', error);
      toast({
        title: "Error saving results",
        description: "Please try again later",
        variant: "destructive",
      });
    }
  };
  
  // Handle trash (skip) block
  const handleTrashBlock = () => {
    if (selectedBlockIndex === null) return;
    
    // Remove the selected block and generate a replacement
    const newBlocks = [...availableBlocks];
    newBlocks[selectedBlockIndex] = generateBlock();
    setAvailableBlocks(newBlocks);
    setSelectedBlockIndex(null);
    
    // Penalty for trashing a block
    setScore(prev => Math.max(0, prev - 5));
    
    toast({
      title: "Block skipped",
      description: "-5 points penalty",
      variant: "destructive",
    });
    
    // Check if game over with new blocks
    checkGameOver(newBlocks);
  };
  
  // Render the game grid cell
  const renderGridCell = (rowIndex: number, colIndex: number) => {
    const cellContent = grid[rowIndex][colIndex];
    
    // Preview of selected block placement
    let isValidPlacement = false;
    let isPreview = false;
    
    if (selectedBlockIndex !== null) {
      const block = availableBlocks[selectedBlockIndex];
      if (block) {
        isValidPlacement = canPlaceBlock(block, rowIndex, colIndex);
        
        // Check if this cell would be part of the placed block
        isPreview = block.shape.some((row, r) => 
          row.some((cell, c) => {
            const newRow = rowIndex + r;
            const newCol = colIndex + c;
            return (
              cell && 
              newRow < GRID_SIZE && 
              newCol < GRID_SIZE && 
              rowIndex <= newRow && 
              colIndex <= newCol
            );
          })
        );
      }
    }
    
    return (
      <div
        key={`${rowIndex}-${colIndex}`}
        onClick={() => handlePlaceBlock(rowIndex, colIndex)}
        className={`
          w-full aspect-square border border-white/10
          ${cellContent || 'bg-white/5 hover:bg-white/10'}
          ${cellContent ? cellContent : ''}
          ${isValidPlacement && isPreview && selectedBlockIndex !== null ? 'bg-white/20 cursor-pointer' : ''}
          ${!isValidPlacement && isPreview && selectedBlockIndex !== null ? 'bg-red-500/20 cursor-not-allowed' : ''}
          transition-all
        `}
      />
    );
  };
  
  // Render a block in the selection area
  const renderBlock = (block: Block, index: number) => {
    const { shape, color } = block;
    const isSelected = selectedBlockIndex === index;
    
    return (
      <div
        key={block.id}
        onClick={() => handleSelectBlock(index)}
        className={`
          relative flex items-center justify-center p-1 rounded-lg
          ${isSelected ? 'ring-2 ring-white scale-105' : ''}
          transition-all cursor-pointer
        `}
      >
        <div className="grid gap-0.5" style={{ 
          gridTemplateRows: `repeat(${shape.length}, 1fr)`,
          gridTemplateColumns: `repeat(${shape[0].length}, 1fr)`
        }}>
          {shape.flatMap((row, rowIndex) => 
            row.map((cell, colIndex) => (
              <div
                key={`${rowIndex}-${colIndex}`}
                className={`
                  w-6 h-6 rounded-sm
                  ${cell ? color : 'bg-transparent'}
                `}
              />
            ))
          )}
        </div>
      </div>
    );
  };
  
  return (
    <div className="p-4 min-h-screen flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <button 
          onClick={() => navigate('/games')} 
          className="text-white hover:text-gray-200"
        >
          <ArrowLeft />
        </button>
        <h1 className="text-2xl font-bold text-white">Block Puzzle</h1>
        <CoinDisplay />
      </div>
      
      {!gameActive && !gameOver ? (
        <Card className="p-6 text-center bg-white/10 backdrop-blur-md border-white/20">
          <h2 className="text-xl font-bold mb-4">Block Puzzle</h2>
          <p className="mb-6">Place blocks on the grid to complete rows and columns. Clear as many lines as possible!</p>
          
          <div className="flex flex-col items-center gap-4 mb-6">
            <div className="flex items-center gap-2">
              <Plus className="text-game-gold" />
              <span>Complete rows or columns to clear them</span>
            </div>
            <div className="flex items-center gap-2">
              <Trash className="text-game-gold" />
              <span>Skip blocks you can't place (costs points)</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="h-5 w-5 text-game-gold" viewBox="0 0 24 24" fill="currentColor">
                <circle cx="12" cy="12" r="10" />
              </svg>
              <span>Earn coins based on your score</span>
            </div>
          </div>
          
          <button
            onClick={startGame}
            className="w-full py-3 px-6 bg-gradient-to-r from-game-purple to-game-purple-dark text-white font-bold rounded-lg shadow-lg hover:shadow-xl transition duration-300 transform hover:-translate-y-0.5"
          >
            Start Game
          </button>
        </Card>
      ) : gameActive ? (
        <div className="flex-1 flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <div className="text-white font-semibold">
              Score: {score}
            </div>
            <button
              onClick={() => setGameActive(false)}
              className="text-white/70 hover:text-white"
            >
              End Game
            </button>
          </div>
          
          {/* Game Grid */}
          <div className="grid grid-cols-10 gap-0.5 mb-4 bg-white/5 p-1 rounded-lg">
            {Array.from({ length: GRID_SIZE }).map((_, rowIndex) => (
              Array.from({ length: GRID_SIZE }).map((_, colIndex) => (
                renderGridCell(rowIndex, colIndex)
              ))
            ))}
          </div>
          
          {/* Block Selection */}
          <div className="mt-auto">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-white font-semibold">Available Blocks</h3>
              <button
                onClick={handleTrashBlock}
                disabled={selectedBlockIndex === null}
                className={`p-2 rounded-full 
                  ${selectedBlockIndex !== null 
                    ? 'bg-white/20 hover:bg-white/30 text-white' 
                    : 'bg-white/10 text-white/50 cursor-not-allowed'}
                `}
              >
                <Trash className="h-5 w-5" />
              </button>
            </div>
            
            <div className="flex justify-around bg-white/10 backdrop-blur-md p-4 rounded-lg">
              {availableBlocks.map((block, index) => renderBlock(block, index))}
            </div>
          </div>
        </div>
      ) : (
        <Card className="p-6 text-center bg-white/10 backdrop-blur-md border-white/20">
          <h2 className="text-xl font-bold mb-4">Game Over</h2>
          
          <div className="space-y-4 mb-6">
            <div className="flex justify-between items-center px-4 py-3 bg-white/10 rounded-lg">
              <span>Final Score:</span>
              <span className="font-bold">{score}</span>
            </div>
            
            <div className="flex justify-between items-center px-4 py-3 bg-white/10 rounded-lg">
              <span>High Score:</span>
              <span className="font-bold">{Math.max(score, highScore)}</span>
            </div>
            
            <div className="flex justify-between items-center px-4 py-3 bg-game-gold/20 rounded-lg">
              <span>Coins Earned:</span>
              <span className="font-bold flex items-center">
                <svg className="h-5 w-5 text-game-gold mr-1" viewBox="0 0 24 24" fill="currentColor">
                  <circle cx="12" cy="12" r="10" />
                </svg>
                {earnedCoins}
              </span>
            </div>
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={startGame}
              className="flex-1 py-3 px-6 bg-gradient-to-r from-game-purple to-game-purple-dark text-white font-bold rounded-lg shadow-lg hover:shadow-xl transition"
            >
              Play Again
            </button>
            
            <button
              onClick={() => navigate('/games')}
              className="flex-1 py-3 px-6 bg-white/20 text-white font-bold rounded-lg hover:bg-white/30 transition"
            >
              Back to Games
            </button>
          </div>
        </Card>
      )}
    </div>
  );
};

export default BlockPuzzle;
