
import { useState, useRef, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Coins } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

// Define the prize segments for the wheel
const segments = [
  { text: '5', value: 5, color: '#EF4444' },
  { text: '10', value: 10, color: '#F59E0B' },
  { text: '15', value: 15, color: '#10B981' },
  { text: '20', value: 20, color: '#3B82F6' },
  { text: '25', value: 25, color: '#8B5CF6' },
  { text: '30', value: 30, color: '#EC4899' },
  { text: '50', value: 50, color: '#6366F1' },
  { text: '0', value: 0, color: '#6B7280' },
];

const SpinWheel = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [showWheel, setShowWheel] = useState(false);
  const [spinAngle, setSpinAngle] = useState(0);
  const { user, updateUserCoins } = useAuth();
  const { toast } = useToast();
  
  // Initialize the wheel when it becomes visible
  useEffect(() => {
    if (showWheel && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      
      if (ctx) {
        drawWheel(ctx, canvas.width, canvas.height, spinAngle);
      }
    }
  }, [showWheel, spinAngle]);
  
  // Draw the wheel with all segments
  const drawWheel = (ctx: CanvasRenderingContext2D, width: number, height: number, rotationAngle: number) => {
    ctx.clearRect(0, 0, width, height);
    
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) / 2 - 10;
    const segmentAngle = (Math.PI * 2) / segments.length;
    
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(rotationAngle);
    
    // Draw segments
    segments.forEach((segment, index) => {
      const startAngle = index * segmentAngle;
      const endAngle = startAngle + segmentAngle;
      
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, radius, startAngle, endAngle);
      ctx.closePath();
      
      ctx.fillStyle = segment.color;
      ctx.fill();
      
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#FFFFFF';
      ctx.stroke();
      
      // Add text
      ctx.save();
      ctx.rotate(startAngle + segmentAngle / 2);
      ctx.textAlign = 'right';
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 18px Arial';
      ctx.fillText(segment.text, radius - 20, 5);
      ctx.restore();
    });
    
    // Draw center circle
    ctx.beginPath();
    ctx.arc(0, 0, 15, 0, Math.PI * 2);
    ctx.fillStyle = '#FFFFFF';
    ctx.fill();
    
    ctx.restore();
    
    // Draw arrow
    ctx.beginPath();
    ctx.moveTo(centerX, centerY - radius - 15);
    ctx.lineTo(centerX - 10, centerY - radius + 10);
    ctx.lineTo(centerX + 10, centerY - radius + 10);
    ctx.closePath();
    ctx.fillStyle = '#FF4500';
    ctx.fill();
  };
  
  // Spin the wheel
  const spinWheel = async () => {
    if (isSpinning || !user) return;
    
    setIsSpinning(true);
    
    // Random number of full rotations (between 3 and 5)
    const rotations = 3 + Math.random() * 2;
    
    // Random stopping angle (determines the prize)
    const stopAngle = Math.random() * Math.PI * 2;
    
    // Calculate winning segment
    const segmentAngle = (Math.PI * 2) / segments.length;
    const winningIndex = Math.floor(((Math.PI * 2) - (stopAngle % (Math.PI * 2))) / segmentAngle);
    const prize = segments[winningIndex % segments.length];
    
    // Calculate total rotation (rotations + stopAngle)
    const totalRotation = (rotations * Math.PI * 2) + stopAngle;
    
    // Animate the spin
    let currentRotation = 0;
    const spinSpeed = 0.2;
    const deceleration = 0.991;
    let currentSpeed = spinSpeed;
    
    const animate = () => {
      currentRotation += currentSpeed;
      currentSpeed *= deceleration;
      setSpinAngle(currentRotation);
      
      if (currentSpeed > 0.0001 && currentRotation < totalRotation) {
        requestAnimationFrame(animate);
      } else {
        // Animation complete
        setIsSpinning(false);
        
        // Award coins to user
        if (prize.value > 0) {
          awardCoins(prize.value);
        } else {
          toast({
            title: "Better luck next time!",
            description: "Spin again for a chance to win coins",
          });
        }
      }
    };
    
    animate();
  };
  
  // Award coins to the user
  const awardCoins = async (amount: number) => {
    try {
      // Update user coins
      await updateUserCoins(amount);
      
      // Record the spin reward
      if (user && !user.isGuest) {
        await supabase.from('rewards').insert([
          {
            user_id: user.id,
            action: 'spin_wheel',
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
    if (!showWheel) {
      setShowWheel(true);
    } else if (!isSpinning) {
      spinWheel();
    }
  };
  
  return (
    <Card 
      className="game-card p-4 flex flex-col"
      onClick={handleClick}
    >
      {!showWheel ? (
        <>
          <h3 className="game-card-header">Spin Wheel</h3>
          <div className="flex justify-between items-end mt-auto">
            <p className="text-xs text-gray-500 dark:text-gray-400">Spin & Earn</p>
            <div className="bg-game-purple/20 p-2 rounded-full">
              <svg className="h-8 w-8 text-game-purple" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                <path d="M2 12h20" />
              </svg>
            </div>
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center">
          <div className="mb-4 relative">
            <canvas 
              ref={canvasRef} 
              width={200} 
              height={200}
              className="select-none"
            />
          </div>
          <Button
            onClick={(e) => {
              e.stopPropagation();
              if (!isSpinning) spinWheel();
            }}
            disabled={isSpinning}
            className="mt-2"
          >
            {isSpinning ? (
              <>Spinning...</>
            ) : (
              <>
                <Coins className="h-4 w-4 mr-2" />
                Spin Now
              </>
            )}
          </Button>
        </div>
      )}
    </Card>
  );
};

export default SpinWheel;
