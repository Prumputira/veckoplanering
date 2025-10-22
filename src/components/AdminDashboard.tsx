import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, UserPlus } from "lucide-react";

export const AdminDashboard = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      toast({
        title: "Fel",
        description: "Ange både e-post och lösenord",
        variant: "destructive",
      });
      return;
    }

    // Validate email format
    const emailRegex = /^[a-z]+\.[a-z]+@nordiskabrand\.se$/i;
    if (!emailRegex.test(email)) {
      toast({
        title: "Fel",
        description: "E-postadressen måste vara i formatet: fornamn.efternamn@nordiskabrand.se",
        variant: "destructive",
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: "Fel",
        description: "Lösenordet måste vara minst 6 tecken",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("create-user", {
        body: { email, password },
      });

      if (error) {
        throw error;
      }

      if (data.error) {
        throw new Error(data.error);
      }

      toast({
        title: "Användare skapad",
        description: `${data.user.name} (${data.user.email}) har skapats. Ett e-postmeddelande för återställning av lösenord har skickats.`,
      });

      // Clear form
      setEmail("");
      setPassword("");
    } catch (error: any) {
      console.error("Error creating user:", error);
      toast({
        title: "Fel",
        description: error.message || "Kunde inte skapa användare",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto mb-8">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserPlus className="h-5 w-5" />
          Admin - Skapa ny användare
        </CardTitle>
        <CardDescription>
          Skapa nya användarkonton. Namnet genereras automatiskt från e-postadressen.
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
              disabled={isLoading}
              required
            />
            <p className="text-sm text-muted-foreground">
              Format: fornamn.efternamn@nordiskabrand.se (t.ex. johan.lemstrom@nordiskabrand.se)
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Temporärt lösenord</Label>
            <Input
              id="password"
              type="password"
              placeholder="Minst 6 tecken"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
              required
              minLength={6}
            />
            <p className="text-sm text-muted-foreground">
              Användaren får ett e-postmeddelande för att byta lösenord
            </p>
          </div>

          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Skapar användare...
              </>
            ) : (
              "Skapa användare"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
