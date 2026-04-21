import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Lock, Building2, UserPlus, Trash2, Users } from 'lucide-react';
import { z } from 'zod';
import logo from '@/assets/nordiska-brand-logo-primary.png';
import { OfficeWeeksManager } from '@/components/OfficeWeeksManager';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

const offices = ['Solna', 'Sundsvall', 'Enköping', 'Nyköping'];

const passwordSchema = z.object({
  newPassword: z.string()
    .min(8, 'Lösenordet måste vara minst 8 tecken')
    .max(128, 'Lösenordet får vara högst 128 tecken'),
  confirmPassword: z.string()
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Lösenorden matchar inte",
  path: ["confirmPassword"],
});

const Settings = () => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [defaultOffice, setDefaultOffice] = useState('');
  const [profileLoading, setProfileLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [creatingUser, setCreatingUser] = useState(false);
  const [users, setUsers] = useState<Array<{ id: string; name: string; email: string }>>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  const loadUsers = async () => {
    setUsersLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('id, name, email, is_hidden')
      .order('name');
    if (!error && data) setUsers(data as any);
    setUsersLoading(false);
  };

  useEffect(() => {
    // Check authentication and load profile
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) {
        navigate('/auth');
        return;
      }

      // Load user profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('default_office')
        .eq('id', session.user.id)
        .single();

      if (profile) {
        setDefaultOffice(profile.default_office || '');
      }

      // Check if user is admin
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', session.user.id)
        .eq('role', 'admin')
        .maybeSingle();

      setIsAdmin(!!roleData);
      setCurrentUserId(session.user.id);
      if (roleData) {
        loadUsers();
      }
      setProfileLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        navigate('/auth');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = passwordSchema.safeParse({ newPassword, confirmPassword });
      
      if (!result.success) {
        const error = result.error.errors[0];
        toast({
          title: 'Valideringsfel',
          description: error.message,
          variant: 'destructive',
        });
        return;
      }

      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      toast({
        title: 'Lösenord uppdaterat',
        description: 'Ditt lösenord har ändrats',
      });

      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      toast({
        title: 'Fel',
        description: error.message || 'Kunde inte uppdatera lösenord',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDefaultOffice = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { error } = await supabase
        .from('profiles')
        .update({ default_office: defaultOffice || null })
        .eq('id', session.user.id);

      if (error) throw error;

      toast({
        title: 'Standardkontor sparat',
        description: defaultOffice 
          ? `${defaultOffice} är nu ditt standardkontor` 
          : 'Standardkontor borttaget',
      });
    } catch (error: any) {
      toast({
        title: 'Fel',
        description: error.message || 'Kunde inte spara standardkontor',
        variant: 'destructive',
      });
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingUser(true);

    try {
      const { data, error } = await supabase.functions.invoke('create-user', {
        body: { email: newUserEmail, password: newUserPassword }
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: 'Användare skapad',
          description: `${data.user.name} (${data.user.email}) har skapats. Ett återställningsmail för lösenord har skickats.`,
        });
        setNewUserEmail('');
        setNewUserPassword('');
        loadUsers();
      }
    } catch (error: any) {
      toast({
        title: 'Fel',
        description: error.message || 'Kunde inte skapa användare',
        variant: 'destructive',
      });
    } finally {
      setCreatingUser(false);
    }
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    setDeletingUserId(userId);
    try {
      const { data, error } = await supabase.functions.invoke('delete-user', {
        body: { userId }
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast({
        title: 'Användare borttagen',
        description: `${userName} har tagits bort.`,
      });
      setUsers((prev) => prev.filter((u) => u.id !== userId));
    } catch (error: any) {
      toast({
        title: 'Fel',
        description: error.message || 'Kunde inte ta bort användare',
        variant: 'destructive',
      });
    } finally {
      setDeletingUserId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={() => navigate('/')}
              className="hover:bg-accent/10"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Tillbaka
            </Button>
            <img 
              src={logo} 
              alt="Nordiska Brand" 
              className="h-12 w-auto object-contain"
            />
          </div>

          <div className="text-center">
            <h1 className="text-3xl font-bold text-primary font-display">Inställningar</h1>
            <p className="text-muted-foreground mt-2">Hantera ditt konto</p>
          </div>

          <Card className="shadow-lg border-primary/10">
            <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent">
              <CardTitle className="flex items-center gap-2 font-display text-primary">
                <Building2 className="h-5 w-5 text-accent" />
                Standardkontor
              </CardTitle>
              <CardDescription>
                Välj ditt standardkontor för att slippa välja varje gång
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              {profileLoading ? (
                <div className="text-center py-4 text-muted-foreground">Laddar...</div>
              ) : (
                <div className="space-y-4">
                  <RadioGroup value={defaultOffice} onValueChange={setDefaultOffice}>
                    <div className="grid grid-cols-2 gap-3">
                      {offices.map((office) => (
                        <div key={office} className="flex items-center space-x-2">
                          <RadioGroupItem value={office} id={office} />
                          <Label htmlFor={office} className="cursor-pointer">
                            {office}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </RadioGroup>
                  <div className="flex gap-2">
                    <Button 
                      onClick={handleSaveDefaultOffice}
                      className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
                    >
                      Spara standardkontor
                    </Button>
                    {defaultOffice && (
                      <Button 
                        variant="outline"
                        onClick={() => {
                          setDefaultOffice('');
                          handleSaveDefaultOffice();
                        }}
                      >
                        Rensa
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {isAdmin && (
            <>
              <Card className="shadow-lg border-primary/10">
                <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent">
                  <CardTitle className="flex items-center gap-2 font-display text-primary">
                    <UserPlus className="h-5 w-5 text-accent" />
                    Skapa ny användare
                  </CardTitle>
                  <CardDescription>
                    Skapa en ny användare med e-post och ett tillfälligt lösenord. Användarens namn skapas automatiskt från e-postadressen.
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <form onSubmit={handleCreateUser} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="newUserEmail">E-postadress</Label>
                      <Input
                        id="newUserEmail"
                        type="email"
                        placeholder="fornamn.efternamn@nordiskabrand.se"
                        value={newUserEmail}
                        onChange={(e) => setNewUserEmail(e.target.value)}
                        required
                        disabled={creatingUser}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="newUserPassword">Tillfälligt lösenord</Label>
                      <Input
                        id="newUserPassword"
                        type="password"
                        placeholder="Ange ett tillfälligt lösenord"
                        value={newUserPassword}
                        onChange={(e) => setNewUserPassword(e.target.value)}
                        required
                        disabled={creatingUser}
                      />
                      <p className="text-sm text-muted-foreground">
                        Användaren kommer få ett mail för att återställa lösenordet.
                      </p>
                    </div>
                    <Button 
                      type="submit" 
                      disabled={creatingUser}
                      className="w-full bg-primary hover:bg-primary/90 text-primary-foreground transition-all duration-200"
                    >
                      {creatingUser ? 'Skapar...' : 'Skapa användare'}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              <Card className="shadow-lg border-primary/10">
                <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent">
                  <CardTitle className="flex items-center gap-2 font-display text-primary">
                    <Users className="h-5 w-5 text-accent" />
                    Hantera användare
                  </CardTitle>
                  <CardDescription>
                    Ta bort användare från systemet. Detta tar även bort deras schema och kontorsveckor.
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  {usersLoading ? (
                    <div className="text-center py-4 text-muted-foreground">Laddar användare...</div>
                  ) : users.length === 0 ? (
                    <div className="text-center py-4 text-muted-foreground">Inga användare hittades</div>
                  ) : (
                    <div className="space-y-2">
                      {users.map((u) => (
                        <div
                          key={u.id}
                          className="flex items-center justify-between p-3 rounded-md border border-border bg-card"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="font-medium truncate">{u.name}</div>
                            <div className="text-sm text-muted-foreground truncate">{u.email}</div>
                          </div>
                          {u.id !== currentUserId && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  disabled={deletingUserId === u.id}
                                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Ta bort {u.name}?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Detta tar permanent bort användaren, deras schema och eventuella kontorsveckor. Åtgärden kan inte ångras.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Avbryt</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDeleteUser(u.id, u.name)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    Ta bort
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="shadow-lg border-primary/10">
                <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent">
                  <CardTitle className="flex items-center gap-2 font-display text-primary">
                    <Building2 className="h-5 w-5 text-accent" />
                    Kontorveckor
                  </CardTitle>
                  <CardDescription>
                    Hantera vilka användare som har kontorsvecka för varje vecka
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <OfficeWeeksManager />
                </CardContent>
              </Card>
            </>
          )}

          <Card className="shadow-lg border-primary/10">
            <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent">
              <CardTitle className="flex items-center gap-2 font-display text-primary">
                <Lock className="h-5 w-5 text-accent" />
                Byt lösenord
              </CardTitle>
              <CardDescription>
                Uppdatera ditt lösenord för att hålla ditt konto säkert
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={handleChangePassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="newPassword">Nytt lösenord</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    placeholder="Minst 8 tecken"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Bekräfta nytt lösenord</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Ange lösenordet igen"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>
                <Button 
                  type="submit" 
                  disabled={loading}
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground transition-all duration-200"
                >
                  {loading ? 'Uppdaterar...' : 'Uppdatera lösenord'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Settings;
