
import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Home } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-game-purple to-game-purple-dark p-4">
      <div className="max-w-md w-full text-center bg-white/90 dark:bg-gray-800/90 backdrop-blur-md rounded-xl p-8 shadow-xl">
        <div className="text-9xl font-bold text-game-purple mb-4 opacity-20">404</div>
        <h1 className="text-3xl font-bold mb-4 -mt-16">Page Not Found</h1>
        <p className="text-gray-600 dark:text-gray-300 mb-8">
          Sorry, we couldn't find the page you're looking for. Let's get you back to the game.
        </p>
        <Link to="/">
          <Button className="game-button flex items-center gap-2">
            <Home className="h-5 w-5" />
            Return to Home
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
