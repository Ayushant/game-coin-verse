
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card } from '@/components/ui/card';
import CoinDisplay from '@/components/ui/CoinDisplay';

interface MemoryCard {
  id: number;
  value: string;
  isFlipped: boolean;
  isMatched: boolean;
}

// Emoji cards for matching
const CARD_EMOJIS = [
  '🚀', '🎮', '🎲', '🏆', '💎', '🔥', '⭐', '🎯',
  '🎪', '🎭', '🎨', '🎬', '🎤', '🎧', '🎷', '🎸',
  '🎹', '🥁', '🎺', '🎻', '🎾', '⚽', '🏀', '🏈'
];

// Difficulty levels
const DIFFICULTY_LEVELS = {
  easy: { pairs: 6, timeLimit: 60, baseCoins: 5 },
  medium: { pairs: 12, timeLimit: 120, baseCoins: 10 },
  hard: { pairs: 18, timeLimit: 180, baseCoins: 15 },
};

type Difficulty = 'easy' | 'medium' | 'hard';

const MemoryMatch = () => {
  const navigate = useNavigate();
  const { user, updateUserCoins } = useAuth();
  const { toast } = useToast();
  
  // Game state
  const [gameActive, setGameActive] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');
  const [cards, setCards] = useState<MemoryCard[]>([]);
  const [flippedCards, setFlippedCards] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [matches, setMatches] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [earnedCoins, setEarnedCoins] = useState(0);
  const [gameStartTime, setGameStartTime] = useState<Date | null>(null);
  
  // Initialize game with cards based on difficulty
  const initializeGame = useCallback((level: Difficulty) => {
    const { pairs, timeLimit } = DIFFICULTY_LEVELS[level];
    setTimeLeft(timeLimit);
    
    // Choose random emojis based on the number of pairs
    const selectedEmojis = [...CARD_EMOJIS]
      .sort(() => 0.5 - Math.random())
      .slice(0, pairs);
    
    // Create pairs of cards with the selected emojis
    const cardPairs = [...selectedEmojis, ...selectedEmojis].map((emoji, index) => ({
      id: index,
      value: emoji,
      isFlipped: false,
      isMatched: false,
    }));
    
    // Shuffle the cards
    setCards(cardPairs.sort(() => 0.5 - Math.random()));
    setFlippedCards([]);
    setMoves(0);
    setMatches(0);
    setGameStartTime(new Date());
  }, []);
  
  // Start game with selected difficulty
  const startGame = (level: Difficulty) => {
    setDifficulty(level);
    setGameActive(true);
    setGameOver(false);
    initializeGame(level);
  };
  
  // End game and calculate score
  const endGame = async (completed = false) => {
    setGameActive(false);
    setGameOver(true);
    
    // Calculate elapsed time
    const elapsedSeconds = gameStartTime ? Math.floor((new Date().getTime() - gameStartTime.getTime()) / 1000) : 0;
    
    // Calculate coins based on difficulty, completion, and speed
    const { baseCoins, timeLimit, pairs } = DIFFICULTY_LEVELS[difficulty];
    let coins = 0;
    
    if (completed) {
      // Time bonus - faster completion = more coins
      const timeBonus = Math.floor((timeLimit - elapsedSeconds) / 5);
      
      // Moves bonus - fewer moves = more coins
      const optimalMoves = pairs * 2; // Optimal is 2 moves per pair
      const movesBonus = Math.max(0, Math.floor((optimalMoves * 3 - moves) / 5));
      
      coins = baseCoins + timeBonus + movesBonus;
    } else {
      // Partial completion reward
      const completionRatio = matches / pairs;
      coins = Math.floor(baseCoins * completionRatio);
    }
    
    setEarnedCoins(coins);
    
    try {
      // Save game session to Supabase
      if (user && !user.isGuest) {
        await supabase
          .from('game_sessions')
          .insert({
            user_id: user.id,
            game_name: 'memory_match',
            score: matches,
            coins_earned: coins,
          });
      }
      
      // Update user's coins
      await updateUserCoins(coins);
      
      toast({
        title: completed ? "Well done!" : "Game Over!",
        description: `You earned ${coins} coins!`,
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
  
  // Handle card click
  const handleCardClick = (id: number) => {
    // Prevent clicking if game is over or two cards already flipped
    if (!gameActive || flippedCards.length >= 2) return;
    
    // Find the clicked card
    const clickedCard = cards.find(card => card.id === id);
    
    // Prevent clicking on already flipped or matched card
    if (!clickedCard || clickedCard.isFlipped || clickedCard.isMatched) return;
    
    // Update the flipped status of the clicked card
    const updatedCards = cards.map(card => 
      card.id === id ? { ...card, isFlipped: true } : card
    );
    
    setCards(updatedCards);
    
    // Track flipped cards
    const newFlippedCards = [...flippedCards, id];
    setFlippedCards(newFlippedCards);
    
    // If two cards are flipped, check for a match
    if (newFlippedCards.length === 2) {
      setMoves(moves + 1);
      
      const [firstId, secondId] = newFlippedCards;
      const firstCard = updatedCards.find(card => card.id === firstId);
      const secondCard = updatedCards.find(card => card.id === secondId);
      
      if (firstCard && secondCard && firstCard.value === secondCard.value) {
        // Match found
        setTimeout(() => {
          const matchedCards = updatedCards.map(card => 
            card.id === firstId || card.id === secondId
              ? { ...card, isMatched: true }
              : card
          );
          
          setCards(matchedCards);
          setFlippedCards([]);
          setMatches(matches + 1);
          
          // Check if all pairs are matched
          const { pairs } = DIFFICULTY_LEVELS[difficulty];
          if (matches + 1 === pairs) {
            endGame(true);
          }
          
          toast({
            title: "Match found!",
            description: "+1 pair",
          });
        }, 500);
      } else {
        // No match, flip cards back
        setTimeout(() => {
          const resetCards = updatedCards.map(card => 
            newFlippedCards.includes(card.id)
              ? { ...card, isFlipped: false }
              : card
          );
          
          setCards(resetCards);
          setFlippedCards([]);
        }, 1000);
      }
    }
  };
  
  // Timer effect
  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    
    if (gameActive && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft(time => time - 1);
      }, 1000);
    } else if (timeLeft === 0 && gameActive) {
      endGame(false);
    }
    
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [gameActive, timeLeft]);
  
  return (
    <div className="p-4 min-h-screen flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <button 
          onClick={() => navigate('/games')} 
          className="text-white hover:text-gray-200"
        >
          <ArrowLeft />
        </button>
        <h1 className="text-2xl font-bold text-white">Memory Match</h1>
        <CoinDisplay />
      </div>
      
      {!gameActive && !gameOver ? (
        <Card className="p-6 text-center bg-white/10 backdrop-blur-md border-white/20">
          <h2 className="text-xl font-bold mb-4">Memory Match</h2>
          <p className="mb-6">Match all the pairs before time runs out!</p>
          
          <div className="space-y-4 mb-6">
            <h3 className="font-semibold">Select Difficulty</h3>
            
            <button
              onClick={() => startGame('easy')}
              className="w-full py-3 px-6 mb-3 bg-gradient-to-r from-green-500 to-green-600 text-white font-bold rounded-lg shadow-lg hover:shadow-xl transition"
            >
              Easy (6 pairs, 60s)
            </button>
            
            <button
              onClick={() => startGame('medium')}
              className="w-full py-3 px-6 mb-3 bg-gradient-to-r from-yellow-500 to-yellow-600 text-white font-bold rounded-lg shadow-lg hover:shadow-xl transition"
            >
              Medium (12 pairs, 120s)
            </button>
            
            <button
              onClick={() => startGame('hard')}
              className="w-full py-3 px-6 bg-gradient-to-r from-red-500 to-red-600 text-white font-bold rounded-lg shadow-lg hover:shadow-xl transition"
            >
              Hard (18 pairs, 180s)
            </button>
          </div>
          
          <div className="flex items-center gap-2 justify-center text-sm text-white/80">
            <Clock className="h-4 w-4" />
            <span>Faster completion = more coins!</span>
          </div>
        </Card>
      ) : gameActive ? (
        <div className="flex-1 flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-white" />
              <span className="text-lg font-semibold text-white">{timeLeft}s</span>
            </div>
            
            <div className="flex gap-4">
              <div className="text-white text-sm">
                Matches: <span className="font-bold">{matches}/{DIFFICULTY_LEVELS[difficulty].pairs}</span>
              </div>
              
              <div className="text-white text-sm">
                Moves: <span className="font-bold">{moves}</span>
              </div>
            </div>
          </div>
          
          {/* Card Grid */}
          <div className={`grid gap-2 ${
            difficulty === 'easy' ? 'grid-cols-3 md:grid-cols-4' : 
            difficulty === 'medium' ? 'grid-cols-4 md:grid-cols-6' : 
            'grid-cols-6'
          }`}>
            {cards.map(card => (
              <div
                key={card.id}
                onClick={() => handleCardClick(card.id)}
                className={`aspect-square transition-all duration-300 transform ${
                  card.isFlipped ? 'rotate-y-180' : ''
                } cursor-pointer`}
              >
                <div className={`relative w-full h-full text-center flex items-center justify-center rounded-lg transition-all ${
                  card.isFlipped || card.isMatched 
                    ? 'bg-gradient-to-br from-game-purple to-game-purple-dark text-white text-4xl shadow-lg scale-100' 
                    : 'bg-white/10 text-transparent hover:bg-white/20 scale-95'
                } ${card.isMatched ? 'opacity-60' : 'opacity-100'}`}>
                  {card.value}
                </div>
              </div>
            ))}
          </div>
          
          <button
            onClick={() => endGame(false)}
            className="mt-auto w-full py-2 px-6 bg-white/20 text-white font-semibold rounded-lg hover:bg-white/30 transition"
          >
            End Game
          </button>
        </div>
      ) : (
        <Card className="p-6 text-center bg-white/10 backdrop-blur-md border-white/20">
          <h2 className="text-xl font-bold mb-4">Game Over</h2>
          
          <div className="space-y-4 mb-6">
            <div className="flex justify-between items-center px-4 py-3 bg-white/10 rounded-lg">
              <span>Difficulty:</span>
              <span className="font-bold capitalize">{difficulty}</span>
            </div>
            
            <div className="flex justify-between items-center px-4 py-3 bg-white/10 rounded-lg">
              <span>Matches:</span>
              <span className="font-bold">{matches}/{DIFFICULTY_LEVELS[difficulty].pairs}</span>
            </div>
            
            <div className="flex justify-between items-center px-4 py-3 bg-white/10 rounded-lg">
              <span>Moves:</span>
              <span className="font-bold">{moves}</span>
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
              onClick={() => startGame(difficulty)}
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

export default MemoryMatch;
