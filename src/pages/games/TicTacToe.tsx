import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft } from 'lucide-react';
import CoinDisplay from '@/components/ui/CoinDisplay';

type Player = 'X' | 'O' | null;
type Board = (Player)[][];

const TicTacToe = () => {
  const [board, setBoard] = useState<Board>(Array(3).fill(null).map(() => Array(3).fill(null)));
  const [currentPlayer, setCurrentPlayer] = useState<'X' | 'O'>('X');
  const [winner, setWinner] = useState<Player>(null);
  const [isDraw, setIsDraw] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [aiThinking, setAiThinking] = useState(false);
  const { user, updateUserCoins } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to login if no user
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  useEffect(() => {
    // AI move
    if (currentPlayer === 'O' && !winner && !isDraw) {
      setAiThinking(true);
      // Simulate AI thinking
      const timeoutId = setTimeout(() => {
        makeAIMove();
        setAiThinking(false);
      }, 700);
      
      return () => clearTimeout(timeoutId);
    }
  }, [currentPlayer, winner, isDraw]);

  const checkWinner = (board: Board): Player => {
    // Check rows
    for (let i = 0; i < 3; i++) {
      if (board[i][0] && board[i][0] === board[i][1] && board[i][0] === board[i][2]) {
        return board[i][0];
      }
    }
    
    // Check columns
    for (let i = 0; i < 3; i++) {
      if (board[0][i] && board[0][i] === board[1][i] && board[0][i] === board[2][i]) {
        return board[0][i];
      }
    }
    
    // Check diagonals
    if (board[0][0] && board[0][0] === board[1][1] && board[0][0] === board[2][2]) {
      return board[0][0];
    }
    
    if (board[0][2] && board[0][2] === board[1][1] && board[0][2] === board[2][0]) {
      return board[0][2];
    }
    
    return null;
  };

  const checkDraw = (board: Board): boolean => {
    return board.every(row => row.every(cell => cell !== null));
  };

  const handleClick = (row: number, col: number) => {
    if (board[row][col] || winner || isDraw || aiThinking) {
      return;
    }

    const newBoard = [...board.map(row => [...row])];
    newBoard[row][col] = currentPlayer;
    setBoard(newBoard);
    
    const newWinner = checkWinner(newBoard);
    const newIsDraw = !newWinner && checkDraw(newBoard);
    
    if (newWinner) {
      setWinner(newWinner);
      setGameOver(true);
      
      if (newWinner === 'X') {
        // Player wins
        const reward = 5;
        updateUserCoins(reward);
        toast({
          title: "You Win!",
          description: `You earned ${reward} coins!`,
        });
      }
    } else if (newIsDraw) {
      setIsDraw(true);
      setGameOver(true);
      // Give a smaller reward for a draw
      const reward = 2;
      updateUserCoins(reward);
      toast({
        title: "It's a Draw!",
        description: `You earned ${reward} coins!`,
      });
    } else {
      setCurrentPlayer(currentPlayer === 'X' ? 'O' : 'X');
    }
  };

  const makeAIMove = () => {
    const emptyCells: [number, number][] = [];
    
    // Find all empty cells
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        if (board[i][j] === null) {
          emptyCells.push([i, j]);
        }
      }
    }
    
    if (emptyCells.length === 0) {
      return;
    }
    
    // Simple AI: choose a winning move or block player's winning move if possible,
    // otherwise choose a random empty cell
    const newBoard = [...board.map(row => [...row])];
    
    // Try to find a winning move
    for (const [i, j] of emptyCells) {
      newBoard[i][j] = 'O';
      if (checkWinner(newBoard) === 'O') {
        setBoard(newBoard);
        setWinner('O');
        setGameOver(true);
        toast({
          title: "AI Wins!",
          description: "Better luck next time!",
          variant: "destructive",
        });
        return;
      }
      newBoard[i][j] = null; // Undo the move
    }
    
    // Try to block player's winning move
    for (const [i, j] of emptyCells) {
      newBoard[i][j] = 'X';
      if (checkWinner(newBoard) === 'X') {
        newBoard[i][j] = 'O';
        setBoard(newBoard);
        setCurrentPlayer('X');
        return;
      }
      newBoard[i][j] = null; // Undo the move
    }
    
    // Choose a random empty cell
    const randomIndex = Math.floor(Math.random() * emptyCells.length);
    const [i, j] = emptyCells[randomIndex];
    newBoard[i][j] = 'O';
    setBoard(newBoard);
    
    // Check if AI's move resulted in a win or draw
    const newWinner = checkWinner(newBoard);
    if (newWinner) {
      setWinner(newWinner);
      setGameOver(true);
      toast({
        title: "AI Wins!",
        description: "Better luck next time!",
        variant: "destructive",
      });
    } else if (checkDraw(newBoard)) {
      setIsDraw(true);
      setGameOver(true);
      // Give a smaller reward for a draw
      const reward = 2;
      updateUserCoins(reward);
      toast({
        title: "It's a Draw!",
        description: `You earned ${reward} coins!`,
      });
    } else {
      setCurrentPlayer('X');
    }
  };

  const resetGame = () => {
    setBoard(Array(3).fill(null).map(() => Array(3).fill(null)));
    setCurrentPlayer('X');
    setWinner(null);
    setIsDraw(false);
    setGameOver(false);
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
          <h1 className="text-2xl font-bold text-white">Tic Tac Toe</h1>
        </div>
        <CoinDisplay />
      </div>
      
      <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-md rounded-xl p-4 shadow-lg">
        <div className="mb-4 text-center">
          {!gameOver ? (
            <div className="text-lg font-medium">
              {aiThinking ? "AI is thinking..." : `Your turn (X)`}
            </div>
          ) : (
            <div className="text-xl font-bold">
              {winner === 'X' ? 'You Win!' : winner === 'O' ? 'AI Wins!' : "It's a Draw!"}
            </div>
          )}
        </div>
        
        <div className="flex justify-center mb-6">
          <div className="grid grid-cols-3 gap-2">
            {board.map((row, rowIndex) => (
              row.map((cell, colIndex) => (
                <button
                  key={`${rowIndex}-${colIndex}`}
                  className={`w-20 h-20 flex items-center justify-center text-2xl font-bold rounded-lg 
                    ${!cell ? 'bg-gray-100 dark:bg-gray-700 cursor-pointer' : 'bg-gray-200 dark:bg-gray-600'} 
                    ${cell === 'X' ? 'text-game-purple' : 'text-game-gold'}`}
                  onClick={() => handleClick(rowIndex, colIndex)}
                  disabled={!!cell || winner !== null || isDraw || currentPlayer === 'O'}
                >
                  {cell}
                </button>
              ))
            ))}
          </div>
        </div>
        
        <div className="flex justify-center">
          <Button 
            className="game-button"
            onClick={resetGame}
          >
            {gameOver ? 'Play Again' : 'Restart Game'}
          </Button>
        </div>
      </div>
      
      <div className="mt-4 text-center text-sm text-white/80">
        <p>Win 5 coins for a victory, 2 coins for a draw!</p>
      </div>
    </div>
  );
};

export default TicTacToe;
