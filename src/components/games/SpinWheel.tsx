import { useState, useRef, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Coins, Gift, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

// Define the prize segments for the wheel
const segments = [
  { text: '3', value: 3, color: '#8B5CF6' },
  { text: '10', value: 10, color: '#EC4899' },
  { text: '8', value: 8, color: '#6366F1' },
  { text: '5', value: 5, color: '#10B981' },
  { text: '20', value: 20, color: '#F59E0B' },
  { text: '1', value: 1, color: '#3B82F6' },
  { text: '25', value: 25, color: '#EF4444' },
  { text: '15', value: 15, color: '#9333EA' },
];

const SpinWheel = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [showWheel, setShowWheel] = useState(false);
  const [spinAngle, setSpinAngle] = useState(0);
  const { user, updateUserCoins } = useAuth();
  const { toast } = useToast();
  const [lastSpinDate, setLastSpinDate] = useState<string | null>(null);
  const [canSpin, setCanSpin] = useState(false);
  
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

  // Check when the user last spun the wheel
  useEffect(() => {
    if (user && !user.isGuest) {
      checkLastSpinDate();
    } else if (user && user.isGuest) {
      // Guest users can always spin
      setCanSpin(true);
    }
  }, [user]);

  const checkLastSpinDate = async () => {
    try {
      if (!user) return;
      
      const { data, error } = await supabase
        .from('rewards')
        .select('created_at')
        .eq('user_id', user.id)
        .eq('action', 'spin_wheel')
        .order('created_at', { ascending: false })
        .limit(1);
        
      if (error) {
        console.error("Error checking last spin date:", error);
        return;
      }
      
      if (data && data.length > 0) {
        const lastSpin = new Date(data[0].created_at);
        setLastSpinDate(lastSpin.toLocaleDateString());
        
        const currentDate = new Date();
        const nextAllowedSpin = new Date(lastSpin);
        nextAllowedSpin.setDate(nextAllowedSpin.getDate() + 7); // Add 7 days
        
        if (currentDate >= nextAllowedSpin) {
          setCanSpin(true);
        } else {
          setCanSpin(false);
        }
      } else {
        // First time user can spin
        setCanSpin(true);
      }
    } catch (error) {
      console.error("Error checking spin eligibility:", error);
    }
  };
  
  // Draw the wheel with all segments
  const drawWheel = (ctx: CanvasRenderingContext2D, width: number, height: number, rotationAngle: number) => {
    ctx.clearRect(0, 0, width, height);
    
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) / 2 - 10;
    const segmentAngle = (Math.PI * 2) / segments.length;
    
    // Add gradient background behind wheel
    const bgGradient = ctx.createRadialGradient(
      centerX, centerY, radius * 0.3,
      centerX, centerY, radius * 1.5
    );
    bgGradient.addColorStop(0, "rgba(139, 92, 246, 0.3)");
    bgGradient.addColorStop(1, "rgba(139, 92, 246, 0)");
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, width, height);
    
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(rotationAngle);
    
    // Draw outer ring
    ctx.beginPath();
    ctx.arc(0, 0, radius + 5, 0, Math.PI * 2);
    ctx.strokeStyle = "#8B5CF6";
    ctx.lineWidth = 5;
    ctx.stroke();
    
    // Draw segments
    segments.forEach((segment, index) => {
      const startAngle = index * segmentAngle;
      const endAngle = startAngle + segmentAngle;
      
      // Create gradient for segments
      const gradient = ctx.createLinearGradient(0, 0, radius * Math.cos((startAngle + endAngle) / 2), radius * Math.sin((startAngle + endAngle) / 2));
      gradient.addColorStop(0, segment.color);
      gradient.addColorStop(1, shadeColor(segment.color, 30));
      
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, radius, startAngle, endAngle);
      ctx.closePath();
      
      ctx.fillStyle = gradient;
      ctx.fill();
      
      ctx.lineWidth = 1;
      ctx.strokeStyle = '#FFFFFF';
      ctx.stroke();
      
      // Add text
      ctx.save();
      ctx.rotate(startAngle + segmentAngle / 2);
      ctx.textAlign = 'right';
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 20px Arial';
      ctx.shadowColor = 'rgba(0,0,0,0.5)';
      ctx.shadowBlur = 3;
      ctx.shadowOffsetX = 1;
      ctx.shadowOffsetY = 1;
      ctx.fillText(segment.text, radius - 20, 5);
      ctx.restore();
    });
    
    // Draw center circle
    const centerGradient = ctx.createRadialGradient(0, 0, 5, 0, 0, 20);
    centerGradient.addColorStop(0, '#FFFFFF');
    centerGradient.addColorStop(1, '#8B5CF6');
    
    ctx.beginPath();
    ctx.arc(0, 0, 20, 0, Math.PI * 2);
    ctx.fillStyle = centerGradient;
    ctx.fill();
    
    ctx.beginPath();
    ctx.arc(0, 0, 17, 0, Math.PI * 2);
    ctx.fillStyle = '#FFFFFF';
    ctx.fill();
    
    ctx.restore();
    
    // Draw arrow
    ctx.beginPath();
    ctx.moveTo(centerX, centerY - radius - 15);
    ctx.lineTo(centerX - 10, centerY - radius);
    ctx.lineTo(centerX + 10, centerY - radius);
    ctx.closePath();
    ctx.fillStyle = '#EC4899';
    ctx.fill();
  };

  // Helper function to darken/lighten colors
  const shadeColor = (color: string, percent: number) => {
    let R = parseInt(color.substring(1, 3), 16);
    let G = parseInt(color.substring(3, 5), 16);
    let B = parseInt(color.substring(5, 7), 16);

    R = Math.floor(R * (100 + percent) / 100);
    G = Math.floor(G * (100 + percent) / 100);
    B = Math.floor(B * (100 + percent) / 100);

    R = (R < 255) ? R : 255;
    G = (G < 255) ? G : 255;
    B = (B < 255) ? B : 255;

    const RR = ((R.toString(16).length === 1) ? "0" + R.toString(16) : R.toString(16));
    const GG = ((G.toString(16).length === 1) ? "0" + G.toString(16) : G.toString(16));
    const BB = ((B.toString(16).length === 1) ? "0" + B.toString(16) : B.toString(16));

    return "#" + RR + GG + BB;
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
        
        // Update local state to prevent further spins
        setCanSpin(false);
        setLastSpinDate(new Date().toLocaleDateString());
      }
      
      // Show winning animation
      showWinningAnimation(amount);
      
    } catch (error) {
      console.error("Error awarding coins:", error);
      toast({
        title: "Error",
        description: "Failed to award coins"
      });
    }
  };
  
  const showWinningAnimation = (amount: number) => {
    toast({
      title: "Congratulations! 🎉",
      description: `You won ${amount} coins!`,
      variant: "default",
    });
    
    // Create falling coins animation
    if (typeof document !== 'undefined') {
      const container = document.createElement('div');
      container.style.position = 'fixed';
      container.style.top = '0';
      container.style.left = '0';
      container.style.width = '100%';
      container.style.height = '100%';
      container.style.pointerEvents = 'none';
      container.style.zIndex = '100';
      document.body.appendChild(container);
      
      // Create coins
      for (let i = 0; i < 20; i++) {
        const coin = document.createElement('div');
        coin.innerHTML = '🪙';
        coin.style.position = 'absolute';
        coin.style.left = `${Math.random() * 100}%`;
        coin.style.top = '-20px';
        coin.style.fontSize = `${Math.random() * 15 + 15}px`;
        coin.style.transform = 'rotate(0deg)';
        coin.style.opacity = '1';
        container.appendChild(coin);
        
        // Animate coin
        const duration = Math.random() * 2 + 1;
        const delay = Math.random() * 0.5;
        
        coin.animate([
          { 
            transform: 'translateY(0) rotate(0deg)', 
            opacity: 1 
          },
          { 
            transform: `translateY(${window.innerHeight}px) rotate(${Math.random() * 720 - 360}deg)`, 
            opacity: 0 
          }
        ], {
          duration: duration * 1000,
          delay: delay * 1000,
          easing: 'ease-in',
          fill: 'forwards'
        });
      }
      
      // Remove container after animation
      setTimeout(() => {
        document.body.removeChild(container);
      }, 3000);
    }
  };
  
  const handleClick = () => {
    if (!showWheel) {
      setShowWheel(true);
    } else if (!isSpinning && canSpin) {
      spinWheel();
    }
  };

  const getNextAvailableDate = () => {
    if (!lastSpinDate) return null;
    
    const lastDate = new Date(lastSpinDate);
    lastDate.setDate(lastDate.getDate() + 7);
    return lastDate.toLocaleDateString();
  };
  
  const closeWheel = () => {
    setShowWheel(false);
    setIsSpinning(false);
  };
  
  return (
    <Card 
      className="game-card p-4 flex flex-col overflow-hidden relative"
      onClick={!showWheel ? handleClick : undefined}
    >
      {!showWheel ? (
        <div className="relative overflow-hidden h-full">
          <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 absolute inset-0 rounded-xl z-0"></div>
          <h3 className="game-card-header relative z-10 flex items-center">
            <Gift className="mr-2 h-5 w-5 text-game-purple animate-pulse" />
            Spin Wheel
          </h3>
          <div className="flex justify-between items-end mt-auto relative z-10">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Spin & Earn up to <span className="text-game-gold font-bold">25</span> coins
            </p>
            <div className="bg-gradient-to-br from-purple-500/30 to-purple-600/30 p-2 rounded-full">
              <svg className="h-8 w-8 text-game-purple animate-spin-slow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                <path d="M2 12h20" />
              </svg>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center relative">
          {/* Close button */}
          <button 
            onClick={(e) => {
              e.stopPropagation();
              closeWheel();
            }}
            className="absolute right-0 top-0 p-1 rounded-full bg-white/10 hover:bg-white/20 transition-all hover:scale-110 z-10"
            aria-label="Close spin wheel"
          >
            <X className="h-5 w-5 text-white" />
          </button>
          
          <div className="mb-4 relative">
            <canvas 
              ref={canvasRef} 
              width={240} 
              height={240}
              className="select-none"
            />
          </div>
          
          <Button
            onClick={(e) => {
              e.stopPropagation();
              if (!isSpinning && canSpin) spinWheel();
            }}
            disabled={isSpinning || !canSpin}
            className={`mt-2 ${!canSpin ? 'opacity-50' : 'animate-pulse'} bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white`}
          >
            {isSpinning ? (
              <>Spinning...</>
            ) : canSpin ? (
              <>
                <Coins className="h-4 w-4 mr-2" />
                Spin Now
              </>
            ) : (
              <>Try again next week</>
            )}
          </Button>
          
          {!canSpin && lastSpinDate && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
              You've used your weekly spin on {lastSpinDate}.<br/>
              Available again on {getNextAvailableDate()}
            </p>
          )}
        </div>
      )}
    </Card>
  );
};

export default SpinWheel;
