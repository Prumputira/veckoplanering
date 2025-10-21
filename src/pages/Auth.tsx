import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { z } from 'zod';

const signupSchema = z.object({
  name: z.string().trim().min(1, 'Namn krävs').max(100, 'Namn måste vara mindre än 100 tecken'),
  email: z.string().trim().email('Ogiltig e-postadress').max(255, 'E-post måste vara mindre än 255 tecken'),
  password: z.string()
    .min(8, 'Lösenord måste vara minst 8 tecken')
    .max(100, 'Lösenord måste vara mindre än 100 tecken')
    .regex(/[A-Z]/, 'Lösenord måste innehålla minst en stor bokstav')
    .regex(/[a-z]/, 'Lösenord måste innehålla minst en liten bokstav')
    .regex(/[0-9]/, 'Lösenord måste innehålla minst en siffra')
});

const loginSchema = z.object({
  email: z.string().trim().email('Ogiltig e-postadress').max(255),
  password: z.string().min(1, 'Lösenord krävs')
});

const Auth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
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
      email: loginEmail,
      password: loginPassword
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

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const result = signupSchema.safeParse({
      name: signupName,
      email: signupEmail,
      password: signupPassword
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
      const { data, error } = await supabase.auth.signUp({
        email: result.data.email,
        password: result.data.password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            name: result.data.name,
          },
        },
      });

      if (error) {
        if (error.message.includes('already registered')) {
          toast({
            title: 'Fel',
            description: 'En användare med detta email finns redan',
            variant: 'destructive',
          });
        } else {
          toast({
            title: 'Fel',
            description: 'Ett fel uppstod vid registrering',
            variant: 'destructive',
          });
        }
      } else if (data.user) {
        toast({
          title: 'Konto skapat',
          description: 'Du är nu inloggad',
        });
      }
    } catch (error) {
      toast({
        title: 'Fel',
        description: 'Ett fel uppstod vid registrering',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Schemahantering</CardTitle>
          <CardDescription>Logga in eller skapa ett nytt konto</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Logga in</TabsTrigger>
              <TabsTrigger value="signup">Registrera</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email</Label>
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="din@email.com"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    required
                    disabled={isLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password">Lösenord</Label>
                  <Input
                    id="login-password"
                    type="password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    required
                    disabled={isLoading}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? 'Loggar in...' : 'Logga in'}
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="signup">
              <form onSubmit={handleSignup} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-name">Namn</Label>
                  <Input
                    id="signup-name"
                    type="text"
                    placeholder="Ditt namn"
                    value={signupName}
                    onChange={(e) => setSignupName(e.target.value)}
                    required
                    disabled={isLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="din@email.com"
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                    required
                    disabled={isLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Lösenord</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                    required
                    disabled={isLoading}
                    minLength={8}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? 'Skapar konto...' : 'Skapa konto'}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
