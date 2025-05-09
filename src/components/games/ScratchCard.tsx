
import { useState, useRef, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles, Gift } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

// Possible coin rewards - between 1 and 25
const rewards = [1, 2, 5, 8, 10, 12, 15, 18, 20, 25];

const ScratchCard = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isActive, setIsActive] = useState(false);
  const [isRevealed, setIsRevealed] = useState(false);
  const [reward, setReward] = useState(0);
  const [percentScratched, setPercentScratched] = useState(0);
  const { user, updateUserCoins } = useAuth();
  const { toast } = useToast();
  const [lastScratchDate, setLastScratchDate] = useState<string | null>(null);
  const [canScratch, setCanScratch] = useState(false);
  
  // Set up the scratch card when it becomes active
  useEffect(() => {
    if (isActive && canvasRef.current && !isRevealed) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      
      if (ctx) {
        // Create foil texture
        const foilPattern = createFoilPattern(ctx);
        
        // Draw overlay (foil layer that will be scratched)
        ctx.fillStyle = foilPattern || '#374151';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw decorative elements
        for (let i = 0; i < 20; i++) {
          const x = Math.random() * canvas.width;
          const y = Math.random() * canvas.height;
          ctx.beginPath();
          ctx.arc(x, y, 2, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
          ctx.fill();
        }
        
        // Draw text
        ctx.font = '16px Arial';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.textAlign = 'center';
        ctx.fillText('Scratch here to reveal your prize!', canvas.width / 2, canvas.height / 2);
        
        setupScratchEvents(canvas, ctx);
      }
    }
  }, [isActive, isRevealed]);

  // Check when the user last used a scratch card
  useEffect(() => {
    if (user && !user.isGuest) {
      checkLastScratchDate();
    } else if (user && user.isGuest) {
      // Guest users can always scratch
      setCanScratch(true);
    }
  }, [user]);

  const checkLastScratchDate = async () => {
    try {
      if (!user) return;
      
      const { data, error } = await supabase
        .from('rewards')
        .select('created_at')
        .eq('user_id', user.id)
        .eq('action', 'scratch_card')
        .order('created_at', { ascending: false })
        .limit(1);
        
      if (error) {
        console.error("Error checking last scratch date:", error);
        return;
      }
      
      if (data && data.length > 0) {
        const lastScratch = new Date(data[0].created_at);
        setLastScratchDate(lastScratch.toLocaleDateString());
        
        const currentDate = new Date();
        const nextAllowedScratch = new Date(lastScratch);
        nextAllowedScratch.setDate(nextAllowedScratch.getDate() + 7); // Add 7 days
        
        if (currentDate >= nextAllowedScratch) {
          setCanScratch(true);
        } else {
          setCanScratch(false);
        }
      } else {
        // First time user can scratch
        setCanScratch(true);
      }
    } catch (error) {
      console.error("Error checking scratch eligibility:", error);
    }
  };
  
  // Create foil texture pattern
  const createFoilPattern = (ctx: CanvasRenderingContext2D) => {
    const patternCanvas = document.createElement('canvas');
    patternCanvas.width = 100;
    patternCanvas.height = 100;
    const patternCtx = patternCanvas.getContext('2d');
    
    if (!patternCtx) return null;
    
    // Create gradient background
    const gradient = patternCtx.createLinearGradient(0, 0, 100, 100);
    gradient.addColorStop(0, '#6366F1');
    gradient.addColorStop(0.5, '#8B5CF6');
    gradient.addColorStop(1, '#EC4899');
    
    patternCtx.fillStyle = gradient;
    patternCtx.fillRect(0, 0, 100, 100);
    
    // Add a noise texture
    for (let i = 0; i < 1000; i++) {
      const x = Math.random() * 100;
      const y = Math.random() * 100;
      const r = Math.random() * 1;
      patternCtx.beginPath();
      patternCtx.arc(x, y, r, 0, Math.PI * 2);
      patternCtx.fillStyle = 'rgba(255, 255, 255, 0.2)';
      patternCtx.fill();
    }
    
    // Add some diagonal lines
    for (let i = 0; i < 10; i++) {
      patternCtx.beginPath();
      patternCtx.moveTo(i * 20, 0);
      patternCtx.lineTo((i * 20) + 100, 100);
      patternCtx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      patternCtx.lineWidth = 5;
      patternCtx.stroke();
    }
    
    return ctx.createPattern(patternCanvas, 'repeat');
  };
  
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
    
    // Add sparkle pattern
    for (let i = 0; i < 100; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      const size = Math.random() * 3 + 1;
      
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.fill();
    }
    
    // Draw coin icon
    const coinSize = 50;
    const coinX = (width / 2) - (coinSize / 2);
    const coinY = (height / 2) - (coinSize / 2) - 20;
    
    // Gold circle
    ctx.beginPath();
    ctx.arc(width / 2, height / 2 - 20, coinSize / 2, 0, Math.PI * 2);
    const coinGradient = ctx.createRadialGradient(
      width / 2, height / 2 - 20, coinSize / 4,
      width / 2, height / 2 - 20, coinSize / 2
    );
    coinGradient.addColorStop(0, '#FFC107');
    coinGradient.addColorStop(1, '#FF8F00');
    ctx.fillStyle = coinGradient;
    ctx.fill();
    
    // Highlight
    ctx.beginPath();
    ctx.arc(width / 2 - 10, height / 2 - 30, coinSize / 4, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.fill();
    
    // Draw reward text
    ctx.font = 'bold 30px Arial';
    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${reward}`, width / 2, height / 2 - 20);
    
    // Draw "coins" text
    ctx.font = 'bold 22px Arial';
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText('COINS', width / 2, height / 2 + 30);
    
    // Add glow effect
    ctx.shadowColor = 'rgba(255, 255, 255, 0.8)';
    ctx.shadowBlur = 20;
    ctx.beginPath();
    ctx.arc(width / 2, height / 2 - 20, coinSize / 2 + 5, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.shadowBlur = 0;
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
      ctx.lineWidth = 40;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      
      ctx.beginPath();
      ctx.moveTo(lastX, lastY);
      ctx.lineTo(offsetX, offsetY);
      ctx.stroke();
      
      // Add some particle effects around cursor
      ctx.globalCompositeOperation = 'source-over';
      for (let i = 0; i < 3; i++) {
        const particleX = offsetX + (Math.random() * 30) - 15;
        const particleY = offsetY + (Math.random() * 30) - 15;
        ctx.beginPath();
        ctx.arc(particleX, particleY, Math.random() * 2 + 1, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 215, 0, 0.6)';
        ctx.fill();
      }
      ctx.globalCompositeOperation = 'destination-out';
      
      // Mark scratched area
      const lineWidth = 40;
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
        endScratch(e);
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
        // Add reveal animation
        const revealDuration = 1000; // ms
        const startTime = Date.now();
        
        const animateReveal = () => {
          if (!canvasRef.current) return;
          
          const canvas = canvasRef.current;
          const ctx = canvas.getContext('2d');
          if (!ctx) return;
          
          const elapsed = Date.now() - startTime;
          const progress = Math.min(elapsed / revealDuration, 1);
          
          ctx.globalAlpha = progress;
          drawReward(ctx, canvas.width, canvas.height);
          
          if (progress < 1) {
            requestAnimationFrame(animateReveal);
          } else {
            // Animation complete
            ctx.globalAlpha = 1;
            drawReward(ctx, canvas.width, canvas.height);
            
            // Award the coins
            if (selectedReward > 0) {
              awardCoins(selectedReward);
            }
          }
        };
        
        animateReveal();
      }
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
        
        // Update local state to prevent further scratches
        setCanScratch(false);
        setLastScratchDate(new Date().toLocaleDateString());
      }
      
      // Fix: Remove the variant parameter from toast call
      toast({
        title: "Congratulations! 🎉",
        description: `You won ${amount} coins!`
      });
      
      // Create a burst of particles from the center of the canvas
      if (canvasRef.current) {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        
        if (ctx) {
          // Create particle burst
          const particles: Array<{
            x: number;
            y: number;
            vx: number;
            vy: number;
            color: string;
            size: number;
            life: number;
          }> = [];
          
          const colors = ['#FFD700', '#FFC107', '#FFEB3B', '#FF9800', '#FFFFFF'];
          
          // Create particles
          for (let i = 0; i < 100; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 5 + 2;
            
            particles.push({
              x: canvas.width / 2,
              y: canvas.height / 2,
              vx: Math.cos(angle) * speed,
              vy: Math.sin(angle) * speed,
              color: colors[Math.floor(Math.random() * colors.length)],
              size: Math.random() * 4 + 1,
              life: Math.random() * 50 + 50
            });
          }
          
          // Animate particles
          const animateParticles = () => {
            if (!canvasRef.current) return;
            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d');
            if (!ctx) return;
            
            // Draw reward first
            drawReward(ctx, canvas.width, canvas.height);
            
            // Update and draw particles
            let alive = false;
            for (let i = 0; i < particles.length; i++) {
              const p = particles[i];
              
              p.x += p.vx;
              p.y += p.vy;
              p.vy += 0.1; // gravity
              p.life--;
              
              if (p.life > 0) {
                alive = true;
                ctx.globalAlpha = p.life / 100;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fillStyle = p.color;
                ctx.fill();
              }
            }
            
            ctx.globalAlpha = 1;
            
            // Continue animation if particles are still alive
            if (alive) {
              requestAnimationFrame(animateParticles);
            }
          };
          
          // Start animation
          animateParticles();
        }
      }
      
    } catch (error) {
      console.error("Error awarding coins:", error);
      // Fix: Remove the variant parameter from toast call
      toast({
        title: "Error",
        description: "Failed to award coins"
      });
    }
  };
  
  const handleClick = () => {
    if (!isActive && canScratch) {
      setIsActive(true);
    }
  };
  
  const getNextAvailableDate = () => {
    if (!lastScratchDate) return null;
    
    const lastDate = new Date(lastScratchDate);
    lastDate.setDate(lastDate.getDate() + 7);
    return lastDate.toLocaleDateString();
  };
  
  return (
    <Card 
      className="game-card p-4 flex flex-col overflow-hidden"
      onClick={!isActive ? handleClick : undefined}
    >
      {!isActive ? (
        <div className="relative overflow-hidden h-full">
          <div className="bg-gradient-to-br from-indigo-500/20 to-pink-500/20 absolute inset-0 rounded-xl z-0"></div>
          <h3 className="game-card-header relative z-10 flex items-center">
            <Gift className="mr-2 h-5 w-5 text-game-purple animate-pulse" />
            Scratch Card
          </h3>
          <div className="flex justify-between items-end mt-auto relative z-10">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Scratch & Win up to <span className="text-game-gold font-bold">25</span> coins
            </p>
            <div className="bg-gradient-to-br from-indigo-500/30 to-indigo-600/30 p-2 rounded-full">
              <svg className="h-8 w-8 text-game-purple" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="5" width="18" height="14" rx="2" />
                <path d="M3 10h18" />
                <path d="M7 15h2" />
                <path d="M11 15h6" />
              </svg>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center">
          <div className="relative mb-4">
            <canvas 
              ref={canvasRef} 
              width={240} 
              height={160}
              className="rounded-lg select-none cursor-pointer shadow-lg"
              style={{ 
                boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)",
              }}
            />
            
            {!isRevealed && canScratch && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <p className="text-white text-opacity-50 animate-pulse text-sm font-medium">
                  Scratch to reveal your prize!
                </p>
              </div>
            )}
          </div>
          
          {isRevealed && (
            <Button
              onClick={() => {
                setIsActive(false);
                setIsRevealed(false);
                setPercentScratched(0);
              }}
              className="mt-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              New Card
            </Button>
          )}
          
          {!canScratch && lastScratchDate && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
              You've used your scratch card on {lastScratchDate}.<br/>
              Available again on {getNextAvailableDate()}
            </p>
          )}
          
          {!isActive && !canScratch && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              You've used your weekly scratch. Try again next week!
            </p>
          )}
        </div>
      )}
    </Card>
  );
};

export default ScratchCard;
