import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useOfficeWeeks } from "@/hooks/use-office-weeks";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { WeekCell } from "./WeekCell";
import { WeekEditDialog } from "./WeekEditDialog";
import { getWeekNumber } from "@/utils/dateUtils";

interface Profile {
  id: string;
  name: string;
  email: string;
}

interface WeekData {
  userIds: string[];
  isClosed: boolean;
}

export const OfficeWeeksManager = () => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [weekData, setWeekData] = useState<Map<number, WeekData>>(new Map());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(true);
  const [editingWeek, setEditingWeek] = useState<number | null>(null);
  const { toast } = useToast();
  const { fetchOfficeWeeks, setWeekAssignments } = useOfficeWeeks();

  const currentWeekNumber = getWeekNumber(new Date());

  useEffect(() => {
    loadData();
  }, [currentYear]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Fetch all profiles
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, name, email')
        .eq('is_hidden', false)
        .order('name');

      if (profilesError) throw profilesError;
      setProfiles(profilesData || []);

      // Fetch all office weeks for the current year
      const officeWeeksData = await fetchOfficeWeeks(currentYear);

      // Build week data map
      const weekMap = new Map<number, WeekData>();
      
      for (let week = 1; week <= 52; week++) {
        const weekEntries = officeWeeksData.filter(ow => ow.week_number === week);
        const isClosed = weekEntries.length > 0 && (weekEntries[0] as any).is_closed;
        const userIds = isClosed ? [] : weekEntries.map(ow => ow.user_id);
        
        weekMap.set(week, { userIds, isClosed });
      }

      setWeekData(weekMap);
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: "Fel",
        description: "Kunde inte ladda data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveWeek = async (weekNumber: number, userIds: string[], isClosed: boolean) => {
    try {
      await setWeekAssignments(weekNumber, currentYear, userIds, isClosed);
      
      // Update local state
      setWeekData(prev => {
        const newMap = new Map(prev);
        newMap.set(weekNumber, { userIds, isClosed });
        return newMap;
      });

      toast({
        title: "Sparat",
        description: `Vecka ${weekNumber} uppdaterad`,
      });
    } catch (error) {
      console.error('Error saving week:', error);
      toast({
        title: "Fel",
        description: "Kunde inte spara ändringar",
        variant: "destructive",
      });
    }
  };

  const getAssignedUsers = (weekNumber: number): Profile[] => {
    const data = weekData.get(weekNumber);
    if (!data) return [];
    
    return data.userIds
      .map(userId => profiles.find(p => p.id === userId))
      .filter((p): p is Profile => p !== undefined);
  };

  const isWeekClosed = (weekNumber: number): boolean => {
    return weekData.get(weekNumber)?.isClosed || false;
  };

  const getSelectedUserIds = (weekNumber: number): string[] => {
    return weekData.get(weekNumber)?.userIds || [];
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-64 w-full" />
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Kontorsveckor {currentYear}</h2>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentYear(prev => prev - 1)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-lg font-medium min-w-[80px] text-center">{currentYear}</span>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentYear(prev => prev + 1)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 mb-6 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-500 rounded" />
          <span>Bemanning OK (≥2 personer)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-destructive rounded" />
          <span>Undermanning (0-1 person)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-muted rounded" />
          <span>Kontoret stängt</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-primary rounded" />
          <span>Aktuell vecka</span>
        </div>
      </div>

      {/* Week Grid */}
      <div className="grid grid-cols-6 sm:grid-cols-10 md:grid-cols-13 gap-2">
        {Array.from({ length: 52 }, (_, i) => i + 1).map(weekNumber => (
          <WeekCell
            key={weekNumber}
            weekNumber={weekNumber}
            assignedUsers={getAssignedUsers(weekNumber)}
            isClosed={isWeekClosed(weekNumber)}
            isCurrentWeek={currentYear === new Date().getFullYear() && weekNumber === currentWeekNumber}
            onClick={() => setEditingWeek(weekNumber)}
          />
        ))}
      </div>

      {/* Edit Dialog */}
      {editingWeek !== null && (
        <WeekEditDialog
          open={true}
          onOpenChange={(open) => !open && setEditingWeek(null)}
          weekNumber={editingWeek}
          year={currentYear}
          profiles={profiles}
          initialSelectedUsers={getSelectedUserIds(editingWeek)}
          initialIsClosed={isWeekClosed(editingWeek)}
          onSave={(userIds, isClosed) => handleSaveWeek(editingWeek, userIds, isClosed)}
        />
      )}
    </Card>
  );
};
