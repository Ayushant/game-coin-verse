
import React from 'react';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const TechDocumentation = () => {
  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-white">Technical Documentation</h1>
      
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="architecture">Architecture</TabsTrigger>
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
└── types/             # TypeScript type definitions

android/               # Android platform code
ios/                  # iOS platform code
`}
            </pre>
            
            <h3 className="text-lg font-medium mt-4 mb-2">Key Components</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Authentication:</strong> Handled via Supabase Auth and AuthContext</li>
              <li><strong>Game Logic:</strong> Implemented in individual game components</li>
              <li><strong>Reward System:</strong> Managed through CoinService and Supabase RPC functions</li>
            </ul>
          </Card>
        </TabsContent>
        
        <TabsContent value="api" className="mt-4">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">API Reference</h2>
            
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
