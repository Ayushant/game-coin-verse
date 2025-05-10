
import React from 'react';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const TechDocumentation = () => {
  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-white">Technical Documentation</h1>
      
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="architecture">Architecture</TabsTrigger>
          <TabsTrigger value="ads">Unity Ads</TabsTrigger>
          <TabsTrigger value="api">API Reference</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="mt-4">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">WinWitty App Overview</h2>
            <p className="mb-4">
              WinWitty is a mobile-first gaming platform that allows users to play various games, 
              earn virtual coins, and potentially withdraw earnings. The platform includes multiple mini-games, 
              a wallet system, and user authentication.
            </p>
            
            <h3 className="text-lg font-medium mt-6 mb-2">Core Technologies</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Frontend:</strong> React, TypeScript, Tailwind CSS, shadcn/ui</li>
              <li><strong>Backend:</strong> Supabase for authentication, database, and edge functions</li>
              <li><strong>Mobile:</strong> Capacitor for cross-platform mobile development</li>
              <li><strong>Monetization:</strong> Unity Ads SDK integration for rewarded ad display</li>
            </ul>
          </Card>
        </TabsContent>
        
        <TabsContent value="architecture" className="mt-4">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Application Architecture</h2>
            
            <h3 className="text-lg font-medium mt-4 mb-2">Directory Structure</h3>
            <pre className="bg-gray-800 text-gray-200 p-4 rounded overflow-x-auto text-sm mb-6">
{`src/
├── components/        # UI components
├── contexts/          # React contexts (Auth, Theme, Admin)
├── hooks/             # Custom React hooks
├── integrations/      # Supabase integration
├── lib/               # Utility functions
├── pages/             # Page components
│   ├── admin/         # Admin pages
│   ├── auth/          # Authentication pages
│   ├── games/         # Game implementations
├── services/          # Service layer (Ads, Coins)
└── types/             # TypeScript type definitions

android/               # Android platform code
├── app/src/main/java/ # Native Java code
`}
            </pre>
            
            <h3 className="text-lg font-medium mt-4 mb-2">Key Components</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Authentication:</strong> Handled via Supabase Auth and AuthContext</li>
              <li><strong>Game Logic:</strong> Implemented in individual game components</li>
              <li><strong>Reward System:</strong> Managed through CoinService and Supabase RPC functions</li>
              <li><strong>Monetization:</strong> Unity Ads integration via Capacitor plugin</li>
            </ul>
          </Card>
        </TabsContent>
        
        <TabsContent value="ads" className="mt-4">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Unity Ads Integration</h2>
            
            <p className="mb-4">
              The app integrates Unity Ads SDK through a custom Capacitor plugin. This enables 
              showing rewarded video ads to users, who earn virtual coins for watching them.
            </p>
            
            <h3 className="text-lg font-medium mt-4 mb-2">Implementation Details</h3>
            <ul className="list-disc pl-6 space-y-3">
              <li>
                <strong>Native Plugin:</strong> Custom Capacitor plugin in <code>android/app/src/main/java/app/lovable/unityads/UnityAdsPlugin.java</code>
              </li>
              <li>
                <strong>JavaScript Interface:</strong> Defined in <code>src/services/AdsService.ts</code>
              </li>
              <li>
                <strong>Game ID:</strong> 5851223 (configured in AndroidManifest.xml and service)
              </li>
              <li>
                <strong>Placement ID:</strong> Rewarded_Android (for rewarded video ads)
              </li>
            </ul>
            
            <h3 className="text-lg font-medium mt-6 mb-2">Usage Flow</h3>
            <ol className="list-decimal pl-6 space-y-2">
              <li>Initialize SDK on app startup (<code>AdsService.initialize()</code>)</li>
              <li>Load rewarded ad before showing (<code>UnityAds.loadRewardedAd()</code>)</li>
              <li>Show ad when user selects a game (<code>AdsService.showRewardedAd()</code>)</li>
              <li>Award coins if ad completed (<code>supabase.rpc('update_user_coins')</code>)</li>
              <li>Log reward in database (<code>supabase.from('rewards').insert()</code>)</li>
            </ol>
            
            <h3 className="text-lg font-medium mt-6 mb-2">Environment Detection</h3>
            <p className="mb-4">
              The app detects whether it's running in a mobile environment using the <code>isMobileApp()</code> function,
              which checks for Capacitor URLs. Ad functionality is skipped in web environments.
            </p>
          </Card>
        </TabsContent>
        
        <TabsContent value="api" className="mt-4">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">API Reference</h2>
            
            <h3 className="text-lg font-medium mb-2">AdsService</h3>
            <pre className="bg-gray-800 text-gray-200 p-4 rounded overflow-x-auto text-sm mb-6">
{`// Initialize Unity Ads
AdsService.initialize(): Promise<boolean>

// Show a rewarded ad
AdsService.showRewardedAd(userId: string): Promise<{
  success: boolean;
  watched: boolean;
}>`}
            </pre>
            
            <h3 className="text-lg font-medium mt-4 mb-2">CoinService</h3>
            <pre className="bg-gray-800 text-gray-200 p-4 rounded overflow-x-auto text-sm mb-6">
{`// Update user coins
CoinService.updateUserCoins({
  userId: string,
  amount: number,
  action?: string
}): Promise<{
  success: boolean;
  error: Error | null;
}>

// Get user's coin balance
CoinService.getUserCoins(userId: string): Promise<number | null>`}
            </pre>
            
            <h3 className="text-lg font-medium mt-4 mb-2">Supabase RPC Functions</h3>
            <pre className="bg-gray-800 text-gray-200 p-4 rounded overflow-x-auto text-sm mb-6">
{`// Update user coins (server-side)
supabase.rpc('update_user_coins', {
  user_id: string,
  coin_amount: number
})`}
            </pre>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TechDocumentation;
