import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { z } from 'zod';
import logo from '@/assets/nordiska-brand-logo-primary.png';

const loginSchema = z.object({
  email: z.string().trim().email('Ogiltig e-postadress').max(255),
  password: z.string().min(1, 'Lösenord krävs')
});

const Auth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Check if user is already logged in
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate('/');
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        navigate('/');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const result = loginSchema.safeParse({
      email: email,
      password: password
    });

    if (!result.success) {
      toast({
        title: 'Valideringsfel',
        description: result.error.errors[0].message,
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: result.data.email,
        password: result.data.password,
      });

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          toast({
            title: 'Fel',
            description: 'Felaktigt email eller lösenord',
            variant: 'destructive',
          });
        } else {
          toast({
            title: 'Fel',
            description: 'Ett fel uppstod vid inloggning',
            variant: 'destructive',
          });
        }
      } else {
        toast({
          title: 'Inloggad',
          description: 'Du är nu inloggad',
        });
      }
    } catch (error) {
      toast({
        title: 'Fel',
        description: 'Ett fel uppstod vid inloggning',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="flex justify-center">
          <img 
            src={logo} 
            alt="Nordiska Brand" 
            className="h-20 w-auto object-contain"
          />
        </div>
        <Card className="shadow-lg border-primary/10">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-display text-primary text-center">
              Schemahantering
            </CardTitle>
            <CardDescription className="text-center">
              Logga in för att hantera veckoscheman
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">E-postadress</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="din.epost@nordiskabrand.se"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Lösenord</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  required
                />
              </div>
              <Button 
                type="submit" 
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground transition-all duration-200" 
                disabled={isLoading}
              >
                {isLoading ? 'Loggar in...' : 'Logga in'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;
