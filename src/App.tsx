import * as React from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from '@/contexts/AuthContext';
import { AdminProvider } from '@/contexts/AdminContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import AppLayout from "./components/layout/AppLayout";
import AdService from "./services/AdService";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import ResetPassword from "./pages/auth/ResetPassword";
import Dashboard from "./pages/Dashboard";
import GamesPage from "./pages/GamesPage";
import TicTacToe from "./pages/games/TicTacToe";
import Game2048 from "./pages/games/Game2048";
import Sudoku from "./pages/games/Sudoku";
import MathChallenge from "./pages/games/MathChallenge";
import BlockPuzzle from "./pages/games/BlockPuzzle";
import MemoryMatch from "./pages/games/MemoryMatch";
import QuizGame from "./pages/games/QuizGame";
import WalletPage from "./pages/WalletPage";
import WithdrawalPage from "./pages/WithdrawalPage";
import ProfilePage from "./pages/ProfilePage";
import SettingsPage from "./pages/SettingsPage";
import NotFound from "./pages/NotFound";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminWithdrawals from "./pages/admin/AdminWithdrawals";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminApps from "./pages/admin/AdminApps";
import AdminPayments from "./pages/admin/AdminPayments";
import AdminSettings from "./pages/admin/AdminSettings";
import AppStorePage from "./pages/AppStorePage";
import AppDetailPage from "./pages/AppDetailPage";
import ManualPaymentPage from "./pages/ManualPaymentPage";
import TechDocumentation from "./pages/TechDocumentation";
import Index from "./pages/Index";
import { useEffect, useState } from 'react';

// Create a new QueryClient instance with explicit configuration
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30000,
    },
  },
});

const AppContent = () => {
  const [appReady, setAppReady] = useState(false);
  
  // Initialize AdMob when app starts, but don't show ads yet
  useEffect(() => {
    // Add a small delay before initializing to ensure device is ready
    const initTimer = setTimeout(async () => {
      try {
        await AdService.initialize();
      } catch (error) {
        console.warn('AdMob initialization failed:', error);
      } finally {
        // Always continue with the app regardless of ad initialization
        setAppReady(true);
      }
    }, 1000);
    
    // Set a fallback timeout in case initialization takes too long
    const fallbackTimer = setTimeout(() => {
      if (!appReady) {
        console.warn('App initialization taking too long, proceeding anyway');
        setAppReady(true);
      }
    }, 3000);
    
    return () => {
      clearTimeout(initTimer);
      clearTimeout(fallbackTimer);
    };
  }, []);
  
  if (!appReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-game-purple to-game-purple-dark text-white">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-white border-t-transparent"></div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* Auth Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        
        {/* App Routes */}
        <Route path="/" element={<AppLayout />}>
          <Route index element={<Index />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="games" element={<GamesPage />} />
          <Route path="games/tictactoe" element={<TicTacToe />} />
          <Route path="games/2048" element={<Game2048 />} />
          <Route path="games/sudoku" element={<Sudoku />} />
          <Route path="games/mathchallenge" element={<MathChallenge />} />
          <Route path="games/blockpuzzle" element={<BlockPuzzle />} />
          <Route path="games/memorymatch" element={<MemoryMatch />} />
          <Route path="games/quiz" element={<QuizGame />} />
          <Route path="wallet" element={<WalletPage />} />
          <Route path="withdraw" element={<WithdrawalPage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="documentation" element={<TechDocumentation />} />
          
          {/* App Store Routes */}
          <Route path="store" element={<AppStorePage />} />
          <Route path="store/app/:id" element={<AppDetailPage />} />
          <Route path="store/payment/:appId" element={<ManualPaymentPage />} />
          
          {/* Admin Routes */}
          <Route path="admin" element={<AdminDashboard />} />
          <Route path="admin/withdrawals" element={<AdminWithdrawals />} />
          <Route path="admin/users" element={<AdminUsers />} />
          <Route path="admin/apps" element={<AdminApps />} />
          <Route path="admin/payments" element={<AdminPayments />} />
          <Route path="admin/settings" element={<AdminSettings />} />
        </Route>
        
        {/* Catch-all */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

const App = () => {
  return (
    <React.StrictMode>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <AuthProvider>
            <AdminProvider>
              <TooltipProvider>
                <Toaster />
                <Sonner />
                <AppContent />
              </TooltipProvider>
            </AdminProvider>
          </AuthProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </React.StrictMode>
  );
};

export default App;
