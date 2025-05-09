
import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

const ScratchCard = () => {
  const [isRevealed, setIsRevealed] = useState(false);
  const [reward, setReward] = useState(0);
  const [hasScratched, setHasScratched] = useState(false);
  const [scratchPercentage, setScratchPercentage] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { user, updateUserCoins } = useAuth();
  const { toast } = useToast();
  
  // Generate a random reward between 5 and 50
  useEffect(() => {
    setReward(Math.floor(Math.random() * 46) + 5);
  }, []);

  // Initialize the canvas with the scratch-off overlay
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Fill with a solid color
    ctx.fillStyle = '#6b46c1';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Add some patterns or texture to make it look like a scratch card
    for (let i = 0; i < 100; i++) {
      const x = Math.random() * canvas.width;
      const y = Math.random() * canvas.height;
      const radius = Math.random() * 2 + 0.5;
      
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.fill();
    }
    
    // Add a message
    ctx.font = '16px sans-serif';
    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';
    ctx.fillText('Scratch to reveal', canvas.width / 2, canvas.height / 2);
  }, []);
  
  // Scratch logic
  const handleScratch = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || isRevealed) return;
    
    setHasScratched(true);
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = (e instanceof MouseEvent ? e.clientX : e.touches[0].clientX) - rect.left;
    const y = (e instanceof MouseEvent ? e.clientY : e.touches[0].clientY) - rect.top;
    
    // Create a "scratched" effect by clearing a circular area
    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(x, y, 20, 0, Math.PI * 2);
    ctx.fill();
    
    // Calculate the percentage of scratched area
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixelData = imageData.data;
    let transparentPixels = 0;
    
    for (let i = 3; i < pixelData.length; i += 4) {
      if (pixelData[i] === 0) transparentPixels++;
    }
    
    const percentage = (transparentPixels / (pixelData.length / 4)) * 100;
    setScratchPercentage(percentage);
    
    // If more than 50% is scratched, reveal the prize
    if (percentage > 50 && !isRevealed) {
      setIsRevealed(true);
      if (user) {
        updateUserCoins(user.coins + reward);
        toast({
          title: "You won!",
          description: `${reward} coins have been added to your account.`,
        });
      }
    }
  };
  
  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault(); // Prevent scrolling while scratching
    handleScratch(e);
  };

  return (
    <div className="flex flex-col items-center">
      <h2 className="text-xl font-bold mb-2 text-white">Daily Scratch Card</h2>
      <p className="text-sm text-white/80 mb-4">Scratch to win coins!</p>
      
      <div className="relative w-full max-w-xs aspect-[4/3] bg-gradient-to-br from-purple-700 to-purple-900 rounded-lg overflow-hidden shadow-lg">
        {/* Reward display */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="text-3xl font-bold text-yellow-400">{reward}</div>
            <div className="text-white text-lg">COINS</div>
          </div>
        </div>
        
        {/* Scratch overlay */}
        <canvas
          ref={canvasRef}
          width={300}
          height={225}
          className="absolute inset-0 w-full h-full cursor-pointer"
          onMouseMove={handleScratch}
          onTouchMove={handleTouchMove}
          onTouchStart={handleScratch}
        />
        
        {/* Instructions if not scratched yet */}
        {!hasScratched && (
          <div className="absolute bottom-2 left-0 right-0 text-center">
            <p className="text-xs text-white animate-pulse">Start scratching!</p>
          </div>
        )}
        
        {/* Progress indicator */}
        {hasScratched && !isRevealed && (
          <div className="absolute bottom-2 left-4 right-4">
            <div className="w-full bg-gray-800 h-1 rounded-full overflow-hidden">
              <div 
                className="h-full bg-green-500 transition-all duration-300"
                style={{ width: `${scratchPercentage}%` }}
              />
            </div>
          </div>
        )}
      </div>
      
      {/* Already revealed message */}
      {isRevealed && (
        <p className="mt-4 text-green-400 font-medium">
          Congratulations! You won {reward} coins!
        </p>
      )}
    </div>
  );
};

export default ScratchCard;
