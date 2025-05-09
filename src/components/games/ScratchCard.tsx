
import { useState, useRef, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

// Possible coin rewards
const rewards = [5, 10, 15, 20, 25, 50];

const ScratchCard = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isActive, setIsActive] = useState(false);
  const [isRevealed, setIsRevealed] = useState(false);
  const [reward, setReward] = useState(0);
  const [percentScratched, setPercentScratched] = useState(0);
  const { user, updateUserCoins } = useAuth();
  const { toast } = useToast();
  
  // Set up the scratch card when it becomes active
  useEffect(() => {
    if (isActive && canvasRef.current && !isRevealed) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      
      if (ctx) {
        // Draw overlay (gray layer that will be scratched)
        ctx.fillStyle = '#374151'; // Gray overlay color
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw some decorative elements
        for (let i = 0; i < 8; i++) {
          const x = Math.random() * canvas.width;
          const y = Math.random() * canvas.height;
          ctx.beginPath();
          ctx.arc(x, y, 3, 0, Math.PI * 2);
          ctx.fillStyle = '#6B7280';
          ctx.fill();
        }
        
        // Draw text
        ctx.font = '16px Arial';
        ctx.fillStyle = '#9CA3AF';
        ctx.textAlign = 'center';
        ctx.fillText('Scratch here!', canvas.width / 2, canvas.height / 2);
        
        setupScratchEvents(canvas, ctx);
      }
    }
  }, [isActive, isRevealed]);
  
  // Draw the revealed reward
  const drawReward = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Set up gradient background
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, '#8B5CF6'); // Purple
    gradient.addColorStop(1, '#EC4899'); // Pink
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
    
    // Draw reward text
    ctx.font = 'bold 28px Arial';
    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${reward} coins!`, width / 2, height / 2);
    
    // Draw sparkles or decorations
    for (let i = 0; i < 12; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      const size = 2 + Math.random() * 3;
      
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fillStyle = '#FFFFFF';
      ctx.fill();
    }
  };
  
  // Set up scratch card interaction events
  const setupScratchEvents = (canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) => {
    let isDrawing = false;
    let lastX = 0;
    let lastY = 0;
    
    // Track scratched pixels
    const scratchData = new Uint8Array(canvas.width * canvas.height);
    const totalPixels = canvas.width * canvas.height;
    
    // Handle scratch start
    const startScratch = (e: MouseEvent | TouchEvent) => {
      isDrawing = true;
      const { offsetX, offsetY } = getCoordinates(e, canvas);
      lastX = offsetX;
      lastY = offsetY;
    };
    
    // Handle scratching
    const scratch = (e: MouseEvent | TouchEvent) => {
      if (!isDrawing || isRevealed) return;
      
      const { offsetX, offsetY } = getCoordinates(e, canvas);
      
      // Draw scratch line
      ctx.globalCompositeOperation = 'destination-out';
      ctx.lineWidth = 30;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      
      ctx.beginPath();
      ctx.moveTo(lastX, lastY);
      ctx.lineTo(offsetX, offsetY);
      ctx.stroke();
      
      // Mark scratched area
      const lineWidth = 30;
      const dx = offsetX - lastX;
      const dy = offsetY - lastY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const steps = Math.max(Math.floor(distance), 1);
      
      for (let i = 0; i <= steps; i++) {
        const x = Math.round(lastX + dx * (i / steps));
        const y = Math.round(lastY + dy * (i / steps));
        
        // Mark a circle around this point
        for (let rx = -lineWidth / 2; rx < lineWidth / 2; rx++) {
          for (let ry = -lineWidth / 2; ry < lineWidth / 2; ry++) {
            const px = x + rx;
            const py = y + ry;
            
            if (px >= 0 && px < canvas.width && py >= 0 && py < canvas.height) {
              if (rx * rx + ry * ry <= (lineWidth / 2) * (lineWidth / 2)) {
                const index = py * canvas.width + px;
                if (!scratchData[index]) {
                  scratchData[index] = 1;
                }
              }
            }
          }
        }
      }
      
      // Update last position
      lastX = offsetX;
      lastY = offsetY;
      
      // Calculate percentage scratched
      let scratchedPixels = 0;
      for (let i = 0; i < scratchData.length; i++) {
        if (scratchData[i]) scratchedPixels++;
      }
      
      const percent = Math.min((scratchedPixels / totalPixels) * 100, 100);
      setPercentScratched(percent);
      
      // If scratched enough, reveal the reward
      if (percent > 30 && !isRevealed) {
        revealReward();
      }
    };
    
    // Handle scratch end
    const endScratch = () => {
      isDrawing = false;
    };
    
    // Touch event handlers
    canvas.addEventListener('mousedown', startScratch);
    canvas.addEventListener('mousemove', scratch);
    canvas.addEventListener('mouseup', endScratch);
    canvas.addEventListener('mouseleave', endScratch);
    
    // Mobile touch events
    canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      startScratch(e);
    });
    
    canvas.addEventListener('touchmove', (e) => {
      e.preventDefault();
      scratch(e);
    });
    
    canvas.addEventListener('touchend', (e) => {
      e.preventDefault();
      endScratch();
    });
    
    // Clean up
    return () => {
      canvas.removeEventListener('mousedown', startScratch);
      canvas.removeEventListener('mousemove', scratch);
      canvas.removeEventListener('mouseup', endScratch);
      canvas.removeEventListener('mouseleave', endScratch);
      canvas.removeEventListener('touchstart', (e) => {
        e.preventDefault();
        startScratch(e);
      });
      canvas.removeEventListener('touchmove', (e) => {
        e.preventDefault();
        scratch(e);
      });
      canvas.removeEventListener('touchend', (e) => {
        e.preventDefault();
        endScratch();
      });
    };
  };
  
  // Helper to get coordinates from mouse or touch event
  const getCoordinates = (e: MouseEvent | TouchEvent, canvas: HTMLCanvasElement) => {
    let offsetX, offsetY;
    
    if ('touches' in e) {
      // Touch event
      const rect = canvas.getBoundingClientRect();
      offsetX = e.touches[0].clientX - rect.left;
      offsetY = e.touches[0].clientY - rect.top;
    } else {
      // Mouse event
      offsetX = e.offsetX;
      offsetY = e.offsetY;
    }
    
    return { offsetX, offsetY };
  };
  
  // Reveal the reward
  const revealReward = async () => {
    if (isRevealed) return;
    
    setIsRevealed(true);
    
    // Select a random reward
    const selectedReward = rewards[Math.floor(Math.random() * rewards.length)];
    setReward(selectedReward);
    
    // Draw the reward on the canvas
    if (canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      
      if (ctx) {
        drawReward(ctx, canvas.width, canvas.height);
      }
    }
    
    // Award the coins to the user
    if (selectedReward > 0) {
      awardCoins(selectedReward);
    }
  };
  
  // Award coins to the user
  const awardCoins = async (amount: number) => {
    try {
      // Update user coins
      await updateUserCoins(amount);
      
      // Record the scratch card reward
      if (user && !user.isGuest) {
        await supabase.from('rewards').insert([
          {
            user_id: user.id,
            action: 'scratch_card',
            coins: amount
          }
        ]);
      }
      
      toast({
        title: "Congratulations!",
        description: `You won ${amount} coins!`,
      });
    } catch (error) {
      console.error("Error awarding coins:", error);
      toast({
        title: "Error",
        description: "Failed to award coins",
        variant: "destructive"
      });
    }
  };
  
  const handleClick = () => {
    if (!isActive) {
      setIsActive(true);
    }
  };
  
  return (
    <Card 
      className="game-card p-4 flex flex-col"
      onClick={handleClick}
    >
      {!isActive ? (
        <>
          <h3 className="game-card-header">Scratch</h3>
          <div className="flex justify-between items-end mt-auto">
            <p className="text-xs text-gray-500 dark:text-gray-400">Scratch & Earn</p>
            <div className="bg-game-purple/20 p-2 rounded-full">
              <svg className="h-8 w-8 text-game-purple" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="5" width="18" height="14" rx="2" />
                <path d="M3 10h18" />
                <path d="M7 15h2" />
                <path d="M11 15h6" />
              </svg>
            </div>
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center">
          <canvas 
            ref={canvasRef} 
            width={200} 
            height={150}
            className="rounded-lg select-none cursor-pointer"
          />
          
          {isRevealed && (
            <Button
              onClick={() => {
                setIsActive(false);
                setIsRevealed(false);
                setPercentScratched(0);
              }}
              className="mt-4"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              New Card
            </Button>
          )}
        </div>
      )}
    </Card>
  );
};

export default ScratchCard;
