import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import BannerAdComponent from '@/components/ads/BannerAdComponent';

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
    imageUrl: '/images/tic-tac-toe.png',
    route: '/games/tictactoe',
  },
  {
    id: '2048',
    title: '2048',
    description: 'Join the numbers to get to 2048!',
    imageUrl: '/images/2048.png',
    route: '/games/2048',
  },
  {
    id: 'sudoku',
    title: 'Sudoku',
    description: 'A number-placing puzzle.',
    imageUrl: '/images/sudoku.png',
    route: '/games/sudoku',
  },
  {
    id: 'mathchallenge',
    title: 'Math Challenge',
    description: 'Test your math skills.',
    imageUrl: '/images/math.png',
    route: '/games/mathchallenge',
  },
  {
    id: 'blockpuzzle',
    title: 'Block Puzzle',
    description: 'Fit the blocks together.',
    imageUrl: '/images/block-puzzle.png',
    route: '/games/blockpuzzle',
  },
  {
    id: 'memorymatch',
    title: 'Memory Match',
    description: 'Match the pairs.',
    imageUrl: '/images/memory-match.png',
    route: '/games/memorymatch',
  },
];

const GamesPage = () => {
  const navigate = useNavigate();
  
  const featuredGame = gameList[0];

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-6 text-white">Games</h1>
      
      {/* Banner Ad at top of games page */}
      <BannerAdComponent className="mb-4" />
      
      {/* Featured Game */}
      <Card className="game-card mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="game-card-header">Featured Game</h2>
        </div>
        <div className="flex flex-col md:flex-row items-center">
          <img
            src={featuredGame.imageUrl}
            alt={featuredGame.title}
            className="w-full md:w-1/2 rounded-lg mb-3 md:mb-0 md:mr-4"
          />
          <div>
            <h3 className="text-lg font-semibold mb-2 text-white">{featuredGame.title}</h3>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              {featuredGame.description}
            </p>
            <button
              className="bg-game-purple text-white px-4 py-2 rounded-full"
              onClick={() => navigate(featuredGame.route)}
            >
              Play Now
            </button>
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
              onClick={() => navigate(game.route)}
            />
          ))}
        </div>
      </div>
      
      {/* Banner Ad at bottom of games page */}
      <BannerAdComponent className="mt-6" />
    </div>
  );
};

interface GameCardProps {
  game: Game;
  onClick: () => void;
}

const GameCard: React.FC<GameCardProps> = ({ game, onClick }) => {
  return (
    <Card className="game-card cursor-pointer" onClick={onClick}>
      <img
        src={game.imageUrl}
        alt={game.title}
        className="w-full h-24 object-cover rounded-t-lg mb-2"
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
