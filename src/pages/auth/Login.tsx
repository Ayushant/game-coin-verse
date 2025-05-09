
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface LoginFormValues {
  email: string;
  password: string;
}

const Login = () => {
  const navigate = useNavigate();
  const { signIn, continueAsGuest, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [guestLoading, setGuestLoading] = useState(false);

  const form = useForm<LoginFormValues>({
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormValues) => {
    try {
      setLoading(true);
      
      // Check if the credentials match the admin account
      const isAdmin = data.email === 'admin75' && data.password === 'projectDB@75';
      
      // For admin login, use the actual email in the database
      const loginEmail = isAdmin ? 'project75database75@gmail.com' : data.email;
      
      const { error } = await signIn(loginEmail, data.password);

      if (error) {
        console.error('Login error details:', error);
        toast({
          title: 'Login Failed',
          description: error.message,
          variant: 'destructive',
        });
        return;
      }

      // Redirect based on user type
      if (isAdmin) {
        navigate('/admin');
        toast({
          title: 'Welcome Admin',
          description: 'You have successfully logged in as admin',
        });
      } else {
        navigate('/');
      }
    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: 'Login Failed',
        description: 'An unexpected error occurred.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleContinueAsGuest = async () => {
    try {
      setGuestLoading(true);
      await continueAsGuest();
      navigate('/');
    } catch (error) {
      console.error('Guest login error:', error);
    } finally {
      setGuestLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-game-purple to-game-purple-dark flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Welcome Back</h1>
          <p className="text-muted-foreground mt-1">Sign in to your account</p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email or Username</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter email or username"
                      type="text"
                      required
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter your password"
                      type="password"
                      required
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="pt-2">
              <Button 
                type="submit" 
                className="w-full game-button" 
                disabled={loading || authLoading}
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </Button>
            </div>
          </form>
        </Form>

        <div className="relative flex items-center justify-center">
          <hr className="w-full border-t border-gray-300 dark:border-gray-600" />
          <span className="absolute bg-white dark:bg-gray-800 px-2 text-xs text-muted-foreground">OR</span>
        </div>

        <Button
          variant="outline"
          onClick={handleContinueAsGuest}
          className="w-full"
          disabled={guestLoading || authLoading}
        >
          {guestLoading ? 'Loading...' : 'Continue as Guest'}
        </Button>

        <div className="text-center text-sm">
          <p className="text-muted-foreground">
            Don't have an account?{' '}
            <Link to="/register" className="text-primary font-medium hover:underline">
              Sign up
            </Link>
          </p>
          <p className="mt-2">
            <Link to="/reset-password" className="text-primary font-medium hover:underline text-sm">
              Forgot password?
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
