import { useState, useEffect } from 'react';
import WeekHeader from '@/components/WeekHeader';
import WeekTable from '@/components/WeekTable';
import { navigateWeek } from '@/utils/dateUtils';
import { Employee, DayStatus } from '@/types/schedule';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const Index = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .order('name');

      if (error) throw error;

      // Initialize employees with empty week schedules
      const employeesWithSchedules: Employee[] = (data || []).map(emp => ({
        id: emp.id,
        name: emp.name,
        week: {
          mon: { segments: [{ status: 'office' }] },
          tue: { segments: [{ status: 'office' }] },
          wed: { segments: [{ status: 'office' }] },
          thu: { segments: [{ status: 'office' }] },
          fri: { segments: [{ status: 'office' }] },
        },
      }));

      setEmployees(employeesWithSchedules);
    } catch (error) {
      console.error('Error fetching employees:', error);
      toast({
        title: 'Fel',
        description: 'Kunde inte hämta medarbetare',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleNavigate = (direction: 'prev' | 'next') => {
    setCurrentDate(navigateWeek(currentDate, direction));
  };

  const handleSelectWeek = (date: Date) => {
    setCurrentDate(date);
  };

  const handleUpdateStatus = (employeeId: string, dayKey: string, status: DayStatus) => {
    setEmployees((prev) =>
      prev.map((emp) =>
        emp.id === employeeId
          ? {
              ...emp,
              week: {
                ...emp.week,
                [dayKey]: status,
              },
            }
          : emp
      )
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <WeekHeader 
        currentDate={currentDate} 
        onNavigate={handleNavigate}
        onSelectWeek={handleSelectWeek}
      />
      <WeekTable
        currentDate={currentDate}
        employees={employees}
        onUpdateStatus={handleUpdateStatus}
      />
    </div>
  );
};

export default Index;
