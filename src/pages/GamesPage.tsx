import React, { useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { useGameNavigation } from '@/hooks/useGameNavigation';

interface Game {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  route: string;
}

const gameList: Game[] = [
  {
    id: 'tictactoe',
    title: 'Tic Tac Toe',
    description: 'A classic game of Xs and Os.',
    imageUrl: 'https://images.unsplash.com/photo-1611996575749-79a3a250f948?q=80&w=500&auto=format&fit=crop',
    route: '/games/tictactoe',
  },
  {
    id: '2048',
    title: '2048',
    description: 'Join the numbers to get to 2048!',
    imageUrl: 'https://images.unsplash.com/photo-1640376875207-b31328a4c9d6?q=80&w=500&auto=format&fit=crop',
    route: '/games/2048',
  },
  {
    id: 'sudoku',
    title: 'Sudoku',
    description: 'A number-placing puzzle.',
    imageUrl: 'https://images.unsplash.com/photo-1602029908656-b54d16d783b9?q=80&w=500&auto=format&fit=crop',
    route: '/games/sudoku',
  },
  {
    id: 'mathchallenge',
    title: 'Math Challenge',
    description: 'Test your math skills.',
    imageUrl: 'https://images.unsplash.com/photo-1596495577886-d920f1fb7238?q=80&w=500&auto=format&fit=crop',
    route: '/games/mathchallenge',
  },
  {
    id: 'blockpuzzle',
    title: 'Block Puzzle',
    description: 'Fit the blocks together.',
    imageUrl: 'https://images.unsplash.com/photo-1609710228159-0fa9bd7c0827?q=80&w=500&auto=format&fit=crop',
    route: '/games/blockpuzzle',
  },
  {
    id: 'memorymatch',
    title: 'Memory Match',
    description: 'Match the pairs.',
    imageUrl: 'https://images.unsplash.com/photo-1606167668584-78701c57f13d?q=80&w=500&auto=format&fit=crop',
    route: '/games/memorymatch',
  },
  {
    id: 'quiz',
    title: 'Quiz Game',
    description: 'Test your knowledge and earn coins.',
    imageUrl: 'https://images.unsplash.com/photo-1606326608690-4e0281b1e588?q=80&w=500&auto=format&fit=crop',
    route: '/games/quiz',
  },
];

const GamesPage = () => {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const { navigateToGame, isLoading } = useGameNavigation();
  
  const featuredGame = gameList[6]; // Making the Quiz Game the featured game

  const handleGameSelection = (route: string) => {
    // Show ad before navigating to the game
    navigateToGame(route);
  };
  
  return (
    <div className="p-4 pb-20">
      <h1 className="text-2xl font-bold mb-6 text-white">Games</h1>
      
      {/* Featured Game */}
      <Card className="game-card mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="game-card-header">Featured Game</h2>
        </div>
        <div className="flex flex-col md:flex-row items-center">
          <img
            src={featuredGame.imageUrl}
            alt={featuredGame.title}
            className="w-full md:w-1/2 rounded-lg mb-3 md:mb-0 md:mr-4 object-cover h-48 md:h-64"
          />
          <div>
            <h3 className="text-lg font-semibold mb-2 text-white">{featuredGame.title}</h3>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              {featuredGame.description}
            </p>
            <div className="flex flex-col gap-2">
              <button
                className="bg-game-purple text-white px-4 py-2 rounded-full"
                onClick={() => handleGameSelection(featuredGame.route)}
                disabled={isLoading}
              >
                {isLoading ? 'Loading...' : 'Play Now'}
              </button>
            </div>
          </div>
        </div>
      </Card>
      
      {/* All Games */}
      <div className="mb-4">
        <h2 className="text-lg font-semibold mb-3 text-white">All Games</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {gameList.map((game) => (
            <GameCard
              key={game.id}
              game={game}
              isLoading={isLoading}
              onClick={() => handleGameSelection(game.route)}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

interface GameCardProps {
  game: Game;
  onClick: () => void;
  isLoading: boolean;
}

const GameCard: React.FC<GameCardProps> = ({ game, onClick, isLoading }) => {
  return (
    <Card className={`game-card cursor-pointer overflow-hidden ${isLoading ? 'opacity-70' : ''}`} onClick={onClick}>
      <img
        src={game.imageUrl}
        alt={game.title}
        className="w-full h-32 object-cover rounded-t-lg mb-2"
      />
      <div className="p-3">
        <h3 className="text-md font-semibold text-white">{game.title}</h3>
        <p className="text-sm text-gray-600 dark:text-gray-300">
          {game.description}
        </p>
      </div>
    </Card>
  );
};

export default GamesPage;
