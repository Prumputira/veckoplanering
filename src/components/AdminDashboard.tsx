import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { UserPlus } from 'lucide-react';

const AdminDashboard = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('create-user', {
        body: { email, password }
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: 'Användare skapad',
          description: `${data.user.name} (${data.user.email}) har skapats. Ett återställningsmail för lösenord har skickats.`,
        });
        setEmail('');
        setPassword('');
      }
    } catch (error: any) {
      toast({
        title: 'Fel',
        description: error.message || 'Kunde inte skapa användare',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="shadow-lg border-primary/10">
        <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent">
          <CardTitle className="flex items-center gap-2 font-display text-primary">
            <UserPlus className="h-5 w-5 text-accent" />
            Admin: Skapa ny användare
          </CardTitle>
          <CardDescription>
            Skapa en ny användare med e-post och ett tillfälligt lösenord. Användarens namn skapas automatiskt från e-postadressen.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreateUser} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-postadress</Label>
              <Input
                id="email"
                type="email"
                placeholder="fornamn.efternamn@nordiskabrand.se"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Tillfälligt lösenord</Label>
              <Input
                id="password"
                type="password"
                placeholder="Ange ett tillfälligt lösenord"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
              />
              <p className="text-sm text-muted-foreground">
                Användaren kommer få ett mail för att återställa lösenordet.
              </p>
            </div>
            <Button 
              type="submit" 
              disabled={loading}
              className="bg-primary hover:bg-primary/90 text-primary-foreground transition-all duration-200"
            >
              {loading ? 'Skapar...' : 'Skapa användare'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboard;