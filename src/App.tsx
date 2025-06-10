
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { AdminProvider } from "@/contexts/AdminContext";
import { SubscriptionProvider } from "@/contexts/SubscriptionContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import AppLayout from "@/components/layout/AppLayout";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import GamesPage from "./pages/GamesPage";
import ProfilePage from "./pages/ProfilePage";
import WalletPage from "./pages/WalletPage";
import SettingsPage from "./pages/SettingsPage";
import WithdrawalPage from "./pages/WithdrawalPage";
import AppStorePage from "./pages/AppStorePage";
import AppDetailPage from "./pages/AppDetailPage";
import ManualPaymentPage from "./pages/ManualPaymentPage";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import ResetPassword from "./pages/auth/ResetPassword";
import TechDocumentation from "./pages/TechDocumentation";
import NotFound from "./pages/NotFound";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminApps from "./pages/admin/AdminApps";
import AdminPayments from "./pages/admin/AdminPayments";
import AdminWithdrawals from "./pages/admin/AdminWithdrawals";
import AdminSettings from "./pages/admin/AdminSettings";
import QuizGame from "./pages/games/QuizGame";
import TicTacToe from "./pages/games/TicTacToe";
import MemoryMatch from "./pages/games/MemoryMatch";
import MathChallenge from "./pages/games/MathChallenge";
import Sudoku from "./pages/games/Sudoku";
import Game2048 from "./pages/games/Game2048";
import BlockPuzzle from "./pages/games/BlockPuzzle";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <TooltipProvider>
        <BrowserRouter>
          <AuthProvider>
            <AdminProvider>
              <SubscriptionProvider>
                <AppLayout>
                  <Routes>
                    <Route path="/" element={<Index />} />
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/games" element={<GamesPage />} />
                    <Route path="/profile" element={<ProfilePage />} />
                    <Route path="/wallet" element={<WalletPage />} />
                    <Route path="/settings" element={<SettingsPage />} />
                    <Route path="/withdraw" element={<WithdrawalPage />} />
                    <Route path="/store" element={<AppStorePage />} />
                    <Route path="/store/app/:id" element={<AppDetailPage />} />
                    <Route path="/manual-payment/:id" element={<ManualPaymentPage />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/reset-password" element={<ResetPassword />} />
                    <Route path="/docs" element={<TechDocumentation />} />
                    <Route path="/admin" element={<AdminDashboard />} />
                    <Route path="/admin/users" element={<AdminUsers />} />
                    <Route path="/admin/apps" element={<AdminApps />} />
                    <Route path="/admin/payments" element={<AdminPayments />} />
                    <Route path="/admin/withdrawals" element={<AdminWithdrawals />} />
                    <Route path="/admin/settings" element={<AdminSettings />} />
                    <Route path="/games/quiz" element={<QuizGame />} />
                    <Route path="/games/tic-tac-toe" element={<TicTacToe />} />
                    <Route path="/games/memory-match" element={<MemoryMatch />} />
                    <Route path="/games/math-challenge" element={<MathChallenge />} />
                    <Route path="/games/sudoku" element={<Sudoku />} />
                    <Route path="/games/2048" element={<Game2048 />} />
                    <Route path="/games/block-puzzle" element={<BlockPuzzle />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </AppLayout>
                <Toaster />
                <Sonner />
              </SubscriptionProvider>
            </AdminProvider>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
