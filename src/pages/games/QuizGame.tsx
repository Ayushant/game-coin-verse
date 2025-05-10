
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import CoinDisplay from '@/components/ui/CoinDisplay';
import { quizQuestions, quizConfig } from '@/data/quizQuestions';
import { QuizQuestion } from '@/types/quiz';
import { CoinService } from '@/services/CoinService';
import { Timer, Star, SkipForward, Check, X, HelpCircle } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

const QuizGame = () => {
  const { user, updateUserCoins } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(quizConfig.timePerQuestion);
  const [score, setScore] = useState(0);
  const [coins, setCoins] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [usedHint, setUsedHint] = useState(false);
  const [isHintDialogOpen, setIsHintDialogOpen] = useState(false);
  const [isQuitDialogOpen, setIsQuitDialogOpen] = useState(false);
  const [wrongOptions, setWrongOptions] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Shuffle questions when starting the game
  const [questions, setQuestions] = useState<QuizQuestion[]>(() => {
    return [...quizQuestions].sort(() => Math.random() - 0.5).slice(0, 10);
  });
  
  const currentQuestion = questions[currentQuestionIndex];
  
  // Initialize coin count from user data
  useEffect(() => {
    if (user) {
      setCoins(user.coins);
    }
  }, [user]);

  // Timer effect
  useEffect(() => {
    if (gameOver || isAnswered) return;

    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleTimeout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [currentQuestionIndex, isAnswered, gameOver]);

  // Handle timeout when user doesn't answer in time
  const handleTimeout = useCallback(() => {
    setIsAnswered(true);
    toast({
      title: "Time's up!",
      description: "You ran out of time for this question.",
      variant: "destructive",
    });
    
    setTimeout(() => {
      moveToNextQuestion();
    }, 2000);
  }, [toast]);

  // Check answer
  const checkAnswer = useCallback(async (optionIndex: number) => {
    if (isAnswered || gameOver || isLoading) return;
    
    setSelectedOption(optionIndex);
    setIsAnswered(true);
    
    const isCorrect = optionIndex === currentQuestion.correctAnswer;
    
    if (isCorrect) {
      setScore(prev => prev + 1);
      
      // Update coins in Supabase
      setIsLoading(true);
      try {
        if (user && !user.isGuest) {
          // Update via Supabase for registered users
          const result = await CoinService.updateUserCoins({
            userId: user.id,
            amount: quizConfig.rewards.correct,
            action: 'quiz_correct_answer'
          });
          
          if (!result.success) {
            throw new Error('Failed to update coins');
          }
          
          // Update local state to show the updated coins
          await updateUserCoins(quizConfig.rewards.correct);
        } else if (user?.isGuest) {
          // For guest users, just update local state directly
          await updateUserCoins(quizConfig.rewards.correct);
        }
        
        setCoins(prev => prev + quizConfig.rewards.correct);
        
        toast({
          title: "Correct!",
          description: `+${quizConfig.rewards.correct} coins added to your wallet.`,
          variant: "default",
        });
      } catch (error) {
        console.error("Error updating coins:", error);
        toast({
          title: "Error updating coins",
          description: "There was a problem adding coins to your wallet.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    } else {
      toast({
        title: "Incorrect!",
        description: "That's not the right answer.",
        variant: "destructive",
      });
    }
    
    // Move to next question after a delay
    setTimeout(() => {
      moveToNextQuestion();
    }, 2000);
  }, [currentQuestion, isAnswered, gameOver, user, toast, updateUserCoins, isLoading]);

  // Move to next question
  const moveToNextQuestion = useCallback(() => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedOption(null);
      setIsAnswered(false);
      setTimeRemaining(quizConfig.timePerQuestion);
      setUsedHint(false);
      setWrongOptions([]);
    } else {
      // Game over
      setGameOver(true);
    }
  }, [currentQuestionIndex, questions.length]);

  // Skip question
  const handleSkipQuestion = useCallback(async () => {
    if (isAnswered || gameOver || isLoading) return;
    
    setIsLoading(true);
    try {
      if (user && !user.isGuest) {
        const result = await CoinService.updateUserCoins({
          userId: user.id,
          amount: quizConfig.rewards.skip,
          action: 'quiz_skip_question'
        });
        
        if (!result.success) {
          throw new Error('Failed to update coins');
        }
        
        await updateUserCoins(quizConfig.rewards.skip);
      } else if (user?.isGuest) {
        await updateUserCoins(quizConfig.rewards.skip);
      }
      
      setCoins(prev => prev + quizConfig.rewards.skip); // This will be negative
      
      toast({
        title: "Question skipped",
        description: `${quizConfig.rewards.skip} coins from your wallet.`,
        variant: "default",
      });
      
      moveToNextQuestion();
    } catch (error) {
      console.error("Error updating coins:", error);
      toast({
        title: "Not enough coins",
        description: "You need more coins to skip this question.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [isAnswered, gameOver, user, updateUserCoins, moveToNextQuestion, toast, isLoading]);

  // Get hint
  const handleGetHint = useCallback(async () => {
    if (usedHint || isAnswered || gameOver || isLoading) return;
    setIsHintDialogOpen(false);
    
    setIsLoading(true);
    try {
      if (user && !user.isGuest) {
        const result = await CoinService.updateUserCoins({
          userId: user.id,
          amount: quizConfig.rewards.hint,
          action: 'quiz_use_hint'
        });
        
        if (!result.success) {
          throw new Error('Failed to update coins');
        }
        
        await updateUserCoins(quizConfig.rewards.hint);
      } else if (user?.isGuest) {
        await updateUserCoins(quizConfig.rewards.hint);
      }
      
      setCoins(prev => prev + quizConfig.rewards.hint); // This will be negative
      
      // Generate a hint by eliminating wrong answers
      const correctAnswerIndex = currentQuestion.correctAnswer;
      const wrongAnswerIndices = currentQuestion.options
        .map((_, index) => index)
        .filter(index => index !== correctAnswerIndex);
      
      // Pick two wrong answers to reveal
      const randomWrongIndices = wrongAnswerIndices
        .sort(() => Math.random() - 0.5)
        .slice(0, Math.min(2, wrongAnswerIndices.length));
      
      setWrongOptions(randomWrongIndices);
      setUsedHint(true);
      
      toast({
        title: "Hint used",
        description: `${quizConfig.rewards.hint} coins from your wallet.`,
        variant: "default",
      });
    } catch (error) {
      console.error("Error updating coins:", error);
      toast({
        title: "Not enough coins",
        description: "You need more coins to get a hint.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [usedHint, isAnswered, gameOver, currentQuestion, user, updateUserCoins, toast, isLoading]);

  // Handle restart game
  const handleRestartGame = () => {
    setQuestions([...quizQuestions].sort(() => Math.random() - 0.5).slice(0, 10));
    setCurrentQuestionIndex(0);
    setSelectedOption(null);
    setIsAnswered(false);
    setTimeRemaining(quizConfig.timePerQuestion);
    setScore(0);
    setGameOver(false);
    setUsedHint(false);
    setWrongOptions([]);
  };

  // Calculate progress
  const progressPercentage = (currentQuestionIndex / questions.length) * 100;

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Card className="p-6">
          <h2 className="text-2xl font-bold mb-4">Please login to play</h2>
          <Button onClick={() => navigate('/login')}>Login</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">Quiz Game</h1>
        <CoinDisplay showBalance={true} coins={user.coins} />
      </div>
      
      {!gameOver ? (
        <>
          {/* Game information bar */}
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <Timer className="text-game-gold" />
              <span className="text-white">{timeRemaining}s</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-white">Question {currentQuestionIndex + 1} of {questions.length}</span>
            </div>
            <div className="flex items-center gap-2">
              <Star className="text-game-gold" />
              <span className="text-white">Score: {score}</span>
            </div>
          </div>
          
          {/* Progress bar */}
          <Progress value={progressPercentage} className="h-2 mb-6" />
          
          {/* Question card */}
          <Card className="game-card mb-6 p-6">
            <div className="mb-8">
              <span className="text-sm font-medium text-game-gold-light mb-2 block">
                {currentQuestion.category} • {currentQuestion.difficulty}
              </span>
              <h3 className="text-xl font-bold text-white">{currentQuestion.question}</h3>
            </div>
            
            {/* Answer options */}
            <div className="grid gap-3">
              {currentQuestion.options.map((option, index) => (
                <button
                  key={index}
                  onClick={() => checkAnswer(index)}
                  disabled={isAnswered || wrongOptions.includes(index)}
                  className={`p-4 rounded-lg border text-left transition-colors ${
                    isAnswered && index === currentQuestion.correctAnswer
                      ? 'bg-green-600 border-green-400 text-white'
                      : isAnswered && index === selectedOption
                      ? 'bg-red-600 border-red-400 text-white'
                      : wrongOptions.includes(index)
                      ? 'bg-gray-700 border-gray-600 text-gray-400 line-through'
                      : 'bg-gray-800 border-gray-700 text-white hover:bg-gray-700'
                  }`}
                >
                  <div className="flex items-center">
                    <span className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center mr-3">
                      {String.fromCharCode(65 + index)}
                    </span>
                    <span className="flex-1">{option}</span>
                    {isAnswered && index === currentQuestion.correctAnswer && (
                      <Check className="text-white ml-2" />
                    )}
                    {isAnswered && index === selectedOption && index !== currentQuestion.correctAnswer && (
                      <X className="text-white ml-2" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          </Card>
          
          {/* Action buttons */}
          <div className="flex justify-between gap-4 mb-6">
            <Button 
              variant="outline" 
              onClick={() => setIsQuitDialogOpen(true)}
              className="flex-1"
            >
              Quit
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setIsHintDialogOpen(true)}
              disabled={usedHint || isAnswered}
              className="flex-1"
            >
              <HelpCircle className="mr-2 h-4 w-4" />
              Hint ({Math.abs(quizConfig.rewards.hint)} coins)
            </Button>
            <Button 
              variant="outline" 
              onClick={handleSkipQuestion}
              disabled={isAnswered}
              className="flex-1"
            >
              <SkipForward className="mr-2 h-4 w-4" />
              Skip ({Math.abs(quizConfig.rewards.skip)} coins)
            </Button>
          </div>
        </>
      ) : (
        // Game over screen
        <Card className="game-card p-6 text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Quiz Complete!</h2>
          <div className="text-6xl font-bold text-game-gold mb-6">{score} / {questions.length}</div>
          
          <div className="mb-8">
            <p className="text-white text-lg mb-2">
              You earned: <span className="text-game-gold-light font-bold">{score * quizConfig.rewards.correct} coins</span>
            </p>
          </div>
          
          <div className="flex gap-4 justify-center">
            <Button variant="outline" onClick={() => navigate('/games')}>
              Back to Games
            </Button>
            <Button onClick={handleRestartGame}>
              Play Again
            </Button>
          </div>
        </Card>
      )}
      
      {/* Hint Dialog */}
      <AlertDialog open={isHintDialogOpen} onOpenChange={setIsHintDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Use Hint</AlertDialogTitle>
            <AlertDialogDescription>
              Using a hint will cost you {Math.abs(quizConfig.rewards.hint)} coins. 
              Two wrong answers will be eliminated. Do you want to continue?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleGetHint}>Use Hint</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Quit Dialog */}
      <AlertDialog open={isQuitDialogOpen} onOpenChange={setIsQuitDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Quit Game</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to quit? Your progress will be lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => navigate('/games')}>Quit</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default QuizGame;
