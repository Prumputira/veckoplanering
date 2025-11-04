import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useOfficeWeeks } from "@/hooks/use-office-weeks";
import { useToast } from "@/hooks/use-toast";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Building2 } from "lucide-react";
import { getWeekNumber } from "@/utils/dateUtils";

interface Profile {
  id: string;
  name: string;
  email: string;
}

export const OfficeWeeksManager = () => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [officeWeeks, setOfficeWeeks] = useState<Map<string, boolean>>(new Map());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(true);
  const { fetchOfficeWeeks, toggleOfficeWeek } = useOfficeWeeks();
  const { toast } = useToast();
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
        .order('name');

      if (profilesError) throw profilesError;
      setProfiles(profilesData || []);

      // Fetch office weeks for current year
      const weeks = await fetchOfficeWeeks(currentYear);
      const weeksMap = new Map<string, boolean>();
      weeks.forEach(week => {
        const key = `${week.user_id}-${week.week_number}`;
        weeksMap.set(key, true);
      });
      setOfficeWeeks(weeksMap);
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

  const handleToggleWeek = async (userId: string, weekNumber: number) => {
    const key = `${userId}-${weekNumber}`;
    const newValue = !officeWeeks.get(key);
    
    // Optimistic update
    const newMap = new Map(officeWeeks);
    if (newValue) {
      newMap.set(key, true);
    } else {
      newMap.delete(key);
    }
    setOfficeWeeks(newMap);

    try {
      await toggleOfficeWeek(userId, weekNumber, currentYear);
      toast({
        title: "Sparat",
        description: `Kontorsvecka ${newValue ? 'tillagd' : 'borttagen'}`,
      });
    } catch (error) {
      console.error('Error toggling office week:', error);
      // Revert on error
      setOfficeWeeks(officeWeeks);
      toast({
        title: "Fel",
        description: "Kunde inte spara ändringen",
        variant: "destructive",
      });
    }
  };

  const getWeeksInYear = () => {
    // Generate weeks 1-52 for the current year
    return Array.from({ length: 52 }, (_, i) => i + 1);
  };

  const getMonthForWeek = (weekNumber: number) => {
    // Approximate month based on week number
    return Math.ceil(weekNumber / 4.33);
  };

  const groupWeeksByMonth = () => {
    const weeks = getWeeksInYear();
    const grouped: { [key: number]: number[] } = {};
    
    weeks.forEach(week => {
      const month = getMonthForWeek(week);
      if (!grouped[month]) {
        grouped[month] = [];
      }
      grouped[month].push(week);
    });
    
    return grouped;
  };

  const monthNames = [
    "Januari", "Februari", "Mars", "April", "Maj", "Juni",
    "Juli", "Augusti", "September", "Oktober", "November", "December"
  ];

  if (loading) {
    return <div className="text-center py-8">Laddar...</div>;
  }

  const groupedWeeks = groupWeeksByMonth();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Building2 className="h-5 w-5 text-accent" />
          <h3 className="text-lg font-semibold">Hantera kontorveckor</h3>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentYear(currentYear - 1)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-lg font-semibold min-w-[80px] text-center">
            {currentYear}
          </span>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentYear(currentYear + 1)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="space-y-6">
        {Object.entries(groupedWeeks).map(([month, weeks]) => (
          <div key={month} className="border rounded-lg p-4">
            <h4 className="font-medium mb-3">{monthNames[parseInt(month) - 1]}</h4>
            <div className="space-y-3">
              {profiles.map(profile => (
                <div key={profile.id} className="flex items-center gap-3">
                  <span className="text-sm font-medium min-w-[150px] truncate">
                    {profile.name}
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {weeks.map(weekNumber => {
                      const key = `${profile.id}-${weekNumber}`;
                      const isChecked = officeWeeks.get(key) || false;
                      const isCurrentWeek = currentYear === new Date().getFullYear() && 
                                          weekNumber === currentWeekNumber;
                      
                      return (
                        <div
                          key={weekNumber}
                          className={`flex items-center gap-1 ${
                            isCurrentWeek ? 'bg-accent/20 rounded px-1' : ''
                          }`}
                        >
                          <Checkbox
                            id={key}
                            checked={isChecked}
                            onCheckedChange={() => handleToggleWeek(profile.id, weekNumber)}
                          />
                          <label
                            htmlFor={key}
                            className={`text-xs cursor-pointer ${
                              isCurrentWeek ? 'font-semibold' : ''
                            }`}
                          >
                            v{weekNumber}
                          </label>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
