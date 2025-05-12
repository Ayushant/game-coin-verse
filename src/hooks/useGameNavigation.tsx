
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';

/**
 * Hook to handle game navigation without ads
 */
export function useGameNavigation() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const navigateToGame = async (route: string) => {
    setIsLoading(true);
    
    // Short timeout to ensure UI updates before navigation
    setTimeout(() => {
      setIsLoading(false);
      navigate(route);
    }, 100);
  };

  return { navigateToGame, isLoading };
}
