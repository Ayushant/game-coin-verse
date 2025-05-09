
import React, { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import BannerAdComponent from '@/components/ads/BannerAdComponent';

interface ScratchCardProps {
  onComplete?: (prize: number) => void;
}

const ScratchCard: React.FC<ScratchCardProps> = ({ onComplete }) => {
  const [isScratched, setIsScratched] = useState(false);
  const [prize, setPrize] = useState(0);
  // Use ref for a stable key that changes only when isScratched changes
  const adKey = useRef(`ad-${Math.random().toString(36).substring(2, 9)}`);
  
  useEffect(() => {
    // Update the ad key when isScratched changes
    adKey.current = `ad-${isScratched ? 'scratched' : 'unscratched'}-${Math.random().toString(36).substring(2, 9)}`;
  }, [isScratched]);
  
  const handleScratch = () => {
    // Generate a random prize (between 5 and 50)
    const randomPrize = Math.floor(Math.random() * 46) + 5;
    setPrize(randomPrize);
    setIsScratched(true);
    
    if (onComplete) {
      onComplete(randomPrize);
    }
  };
  
  const resetCard = () => {
    setIsScratched(false);
    setPrize(0);
  };

  return (
    <Card className="p-4 mb-4">
      <h3 className="text-lg font-bold mb-3 text-center">Scratch Card</h3>
      
      <div className="relative bg-gradient-to-r from-purple-500 to-indigo-600 rounded-lg overflow-hidden">
        {!isScratched ? (
          <div className="p-6 text-center">
            <div className="bg-gray-800 opacity-90 p-8 rounded-lg mb-4">
              <p className="text-white mb-4">Scratch to reveal your prize!</p>
              <Button 
                onClick={handleScratch}
                className="bg-game-gold hover:bg-yellow-500 text-white"
              >
                Scratch Now
              </Button>
            </div>
          </div>
        ) : (
          <div className="p-6 text-center bg-yellow-400">
            <h4 className="text-2xl font-bold mb-2">Congratulations!</h4>
            <p className="text-3xl font-bold mb-6">{prize} Coins</p>
            <Button 
              onClick={resetCard}
              className="bg-game-purple hover:bg-purple-700 text-white"
            >
              Get New Card
            </Button>
          </div>
        )}
      </div>
      
      {/* Ad container with stable key based on scratch state to force proper re-render */}
      <div className="mt-4" key={adKey.current}>
        <BannerAdComponent adSlot="7271840531" />
      </div>
    </Card>
  );
};

export default ScratchCard;
