
import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useNavigate } from 'react-router-dom';
import { Switch } from '@/components/ui/switch';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Moon, Bell, Volume2, HelpCircle, Shield, LogOut } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import CoinDisplay from '@/components/ui/CoinDisplay';

const SettingsPage = () => {
  const { user, signOut } = useAuth();
  const { theme } = useTheme();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to login if no user
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const handleSettingToggle = (setting: string) => {
    toast({
      title: "Setting Updated",
      description: `${setting} setting has been updated.`,
    });
  };

  if (!user) return null;

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <CoinDisplay />
      </div>

      <Card className="game-card p-4 mb-4">
        <h2 className="text-lg font-semibold mb-4">Display</h2>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Moon className="h-5 w-5 mr-3" />
              <div>
                <div className="font-medium">Dark Mode</div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  Currently using dark theme
                </div>
              </div>
            </div>
            <Switch 
              checked={true} 
              disabled={true}
            />
          </div>
        </div>
      </Card>
      
      <Card className="game-card p-4 mb-4">
        <h2 className="text-lg font-semibold mb-4">Notifications</h2>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Bell className="h-5 w-5 mr-3" />
              <div>
                <div className="font-medium">Push Notifications</div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  Get notified about rewards and games
                </div>
              </div>
            </div>
            <Switch 
              defaultChecked 
              onCheckedChange={() => handleSettingToggle('Push Notifications')}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Volume2 className="h-5 w-5 mr-3" />
              <div>
                <div className="font-medium">Sound Effects</div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  Play sounds for game events
                </div>
              </div>
            </div>
            <Switch 
              defaultChecked
              onCheckedChange={() => handleSettingToggle('Sound Effects')}
            />
          </div>
        </div>
      </Card>
      
      <Card className="game-card p-4 mb-4">
        <h2 className="text-lg font-semibold mb-4">Support</h2>
        
        <div className="space-y-4">
          <Button 
            variant="ghost" 
            className="w-full flex items-center justify-start"
            onClick={() => toast({
              title: "Help & Support",
              description: "Support features will be available soon.",
            })}
          >
            <HelpCircle className="h-5 w-5 mr-3" />
            Help & Support
          </Button>
          
          <Button 
            variant="ghost" 
            className="w-full flex items-center justify-start"
            onClick={() => toast({
              title: "Privacy Policy",
              description: "Privacy policy content will be available soon.",
            })}
          >
            <Shield className="h-5 w-5 mr-3" />
            Privacy Policy
          </Button>
        </div>
      </Card>
      
      <Button
        variant="destructive"
        className="w-full flex items-center justify-center gap-2 mt-6"
        onClick={handleSignOut}
      >
        <LogOut className="h-5 w-5" />
        Sign Out
      </Button>
    </div>
  );
};

export default SettingsPage;
