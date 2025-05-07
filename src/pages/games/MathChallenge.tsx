
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, Timer, CircleCheck, CircleX } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card } from '@/components/ui/card';
import CoinDisplay from '@/components/ui/CoinDisplay';

type Operator = '+' | '-' | '*' | '/';
type Difficulty = 'easy' | 'medium' | 'hard';

interface Question {
  num1: number;
  num2: number;
  operator: Operator;
  answer: number;
  options: number[];
}

const MathChallenge = () => {
  const navigate = useNavigate();
  const { user, updateUserCoins } = useAuth();
  const { toast } = useToast();

  const [gameActive, setGameActive] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');
  const [earnedCoins, setEarnedCoins] = useState(0);

  // Generate a random number within a range based on difficulty
  const getRandomNumber = (min: number, max: number): number => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  };

  // Generate a random operator based on difficulty
  const getRandomOperator = (difficulty: Difficulty): Operator => {
    const operators: Operator[] = ['+', '-'];
    
    if (difficulty === 'medium' || difficulty === 'hard') {
      operators.push('*');
    }
    
    if (difficulty === 'hard') {
      operators.push('/');
    }
    
    return operators[Math.floor(Math.random() * operators.length)];
  };

  // Generate a question based on difficulty
  const generateQuestion = useCallback((): Question => {
    let num1, num2, answer, operator;
    
    // Different ranges based on difficulty
    switch (difficulty) {
      case 'easy':
        operator = getRandomOperator(difficulty);
        
        if (operator === '+' || operator === '-') {
          num1 = getRandomNumber(1, 20);
          num2 = getRandomNumber(1, 20);
        } else {
          num1 = getRandomNumber(1, 10);
          num2 = getRandomNumber(1, 10);
        }
        break;
      case 'medium':
        operator = getRandomOperator(difficulty);
        
        if (operator === '+' || operator === '-') {
          num1 = getRandomNumber(10, 50);
          num2 = getRandomNumber(10, 50);
        } else if (operator === '*') {
          num1 = getRandomNumber(2, 12);
          num2 = getRandomNumber(2, 12);
        } else {
          // Ensure clean division for medium
          num2 = getRandomNumber(2, 10);
          answer = getRandomNumber(1, 10);
          num1 = num2 * answer;
          return {
            num1,
            num2,
            operator,
            answer,
            options: generateOptions(answer),
          };
        }
        break;
      case 'hard':
      default:
        operator = getRandomOperator(difficulty);
        
        if (operator === '+' || operator === '-') {
          num1 = getRandomNumber(25, 100);
          num2 = getRandomNumber(25, 100);
        } else if (operator === '*') {
          num1 = getRandomNumber(5, 20);
          num2 = getRandomNumber(5, 20);
        } else {
          // Ensure clean division for hard
          num2 = getRandomNumber(2, 20);
          answer = getRandomNumber(1, 15);
          num1 = num2 * answer;
          return {
            num1,
            num2,
            operator,
            answer,
            options: generateOptions(answer),
          };
        }
        break;
    }
    
    // Calculate the answer based on the operator
    switch (operator) {
      case '+': answer = num1 + num2; break;
      case '-': answer = num1 - num2; break;
      case '*': answer = num1 * num2; break;
      case '/': answer = num1 / num2; break;
      default: answer = 0;
    }
    
    return {
      num1,
      num2,
      operator,
      answer: Math.round(answer), // Round to avoid floating point issues
      options: generateOptions(Math.round(answer)),
    };
  }, [difficulty]);

  // Generate options for multiple choice including the correct answer
  const generateOptions = (correctAnswer: number): number[] => {
    const options = [correctAnswer];
    
    // Generate 3 other unique options
    while (options.length < 4) {
      // Offset by -10 to +10 but ensure it's not the correct answer
      let offset = getRandomNumber(-10, 10);
      if (offset === 0) offset = getRandomNumber(1, 10);
      
      const option = correctAnswer + offset;
      
      // Ensure option is unique and not negative
      if (!options.includes(option) && option >= 0) {
        options.push(option);
      }
    }
    
    // Shuffle options
    return options.sort(() => Math.random() - 0.5);
  };

  // Handle user's answer choice
  const handleAnswerClick = (selectedAnswer: number) => {
    if (!currentQuestion || gameOver) return;
    
    const isCorrect = selectedAnswer === currentQuestion.answer;
    
    if (isCorrect) {
      // Update streak and score
      const newStreak = streak + 1;
      setStreak(newStreak);
      setMaxStreak(Math.max(maxStreak, newStreak));
      setScore(score + (10 * (difficulty === 'easy' ? 1 : difficulty === 'medium' ? 2 : 3)));
      
      // Adjust difficulty based on streak
      if (newStreak % 5 === 0) {
        if (difficulty === 'easy') setDifficulty('medium');
        else if (difficulty === 'medium') setDifficulty('hard');
      }
      
      // Show success toast
      toast({
        title: "Correct!",
        description: `+${10 * (difficulty === 'easy' ? 1 : difficulty === 'medium' ? 2 : 3)} points`,
      });
      
      // Generate new question
      setCurrentQuestion(generateQuestion());
    } else {
      // Reset streak on wrong answer
      setStreak(0);
      
      // Show error toast
      toast({
        title: "Incorrect!",
        description: `The correct answer was ${currentQuestion.answer}`,
        variant: "destructive",
      });
      
      // Generate new question
      setCurrentQuestion(generateQuestion());
    }
  };

  // Start the game
  const startGame = () => {
    setGameActive(true);
    setGameOver(false);
    setScore(0);
    setStreak(0);
    setMaxStreak(0);
    setTimeLeft(60);
    setDifficulty('easy');
    setCurrentQuestion(generateQuestion());
  };

  // End the game and save results
  const endGame = async () => {
    setGameActive(false);
    setGameOver(true);
    
    // Calculate coins earned based on score and max streak
    const coinsEarned = Math.floor(score / 10) + Math.floor(maxStreak / 3);
    setEarnedCoins(coinsEarned);
    
    try {
      // Save game session to Supabase if user is logged in
      if (user && !user.isGuest) {
        await supabase
          .from('game_sessions')
          .insert({
            user_id: user.id,
            game_name: 'math_challenge',
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

  // Countdown timer effect
  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    
    if (gameActive && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && gameActive) {
      endGame();
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
        <h1 className="text-2xl font-bold text-white">Math Challenge</h1>
        <CoinDisplay />
      </div>

      {!gameActive && !gameOver ? (
        <Card className="p-6 text-center bg-white/10 backdrop-blur-md border-white/20">
          <h2 className="text-xl font-bold mb-4">Math Challenge</h2>
          <p className="mb-6">Test your math skills! Answer as many questions as you can in 60 seconds.</p>
          <div className="flex flex-col items-center gap-4 mb-6">
            <div className="flex items-center gap-2">
              <Clock className="text-game-gold" />
              <span>60 second time limit</span>
            </div>
            <div className="flex items-center gap-2">
              <Timer className="text-game-gold" />
              <span>Difficulty increases with your streak</span>
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
          <div className="flex justify-between mb-4 px-2">
            <div className="flex items-center space-x-2">
              <Timer className="h-5 w-5 text-white" />
              <span className="text-lg font-semibold text-white">{timeLeft}s</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-lg font-semibold text-white">Score: {score}</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-lg font-semibold text-white">Streak: {streak}</span>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 mb-6 border border-white/20">
            <div className="mb-4">
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-white/20 text-white">
                {difficulty === 'easy' ? 'Easy' : difficulty === 'medium' ? 'Medium' : 'Hard'}
              </span>
            </div>
            <div className="text-4xl font-bold text-center mb-6 text-white">
              {currentQuestion?.num1} {currentQuestion?.operator} {currentQuestion?.num2} = ?
            </div>
            <div className="grid grid-cols-2 gap-3">
              {currentQuestion?.options.map((option, index) => (
                <button
                  key={index}
                  onClick={() => handleAnswerClick(option)}
                  className="py-4 px-4 bg-white/20 hover:bg-white/30 border border-white/30 rounded-lg text-xl font-semibold text-white transition"
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-auto">
            <button
              onClick={endGame}
              className="w-full py-2 px-6 bg-white/20 text-white font-semibold rounded-lg hover:bg-white/30 transition"
            >
              End Game
            </button>
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
              <span>Max Streak:</span>
              <span className="font-bold">{maxStreak}</span>
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

export default MathChallenge;
