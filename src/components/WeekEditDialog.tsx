import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Label } from "@/components/ui/label";

interface Profile {
  id: string;
  name: string;
  email: string;
}

interface WeekEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  weekNumber: number;
  year: number;
  profiles: Profile[];
  initialSelectedUsers: string[];
  initialIsClosed: boolean;
  onSave: (userIds: string[], isClosed: boolean) => Promise<void>;
}

export const WeekEditDialog = ({
  open,
  onOpenChange,
  weekNumber,
  year,
  profiles,
  initialSelectedUsers,
  initialIsClosed,
  onSave,
}: WeekEditDialogProps) => {
  const [selectedUsers, setSelectedUsers] = useState<string[]>(initialSelectedUsers);
  const [isClosed, setIsClosed] = useState(initialIsClosed);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setSelectedUsers(initialSelectedUsers);
    setIsClosed(initialIsClosed);
  }, [initialSelectedUsers, initialIsClosed, open]);

  const handleUserToggle = (userId: string, checked: boolean) => {
    if (checked) {
      setSelectedUsers(prev => [...prev, userId]);
    } else {
      setSelectedUsers(prev => prev.filter(id => id !== userId));
    }
  };

  const handleClosedToggle = (checked: boolean) => {
    setIsClosed(checked);
    if (checked) {
      setSelectedUsers([]);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(selectedUsers, isClosed);
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Vecka {weekNumber}, {year}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="closed"
              checked={isClosed}
              onCheckedChange={handleClosedToggle}
            />
            <Label htmlFor="closed" className="text-sm font-medium cursor-pointer">
              Kontoret stängt denna vecka
            </Label>
          </div>

          {!isClosed && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">Ansvariga personer:</Label>
              <ScrollArea className="h-60 rounded-md border p-4">
                <div className="space-y-3">
                  {profiles.map(profile => (
                    <div key={profile.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={profile.id}
                        checked={selectedUsers.includes(profile.id)}
                        onCheckedChange={(checked) => handleUserToggle(profile.id, checked as boolean)}
                      />
                      <Label htmlFor={profile.id} className="text-sm cursor-pointer flex-1">
                        {profile.name}
                      </Label>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Sparar..." : "Spara"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
