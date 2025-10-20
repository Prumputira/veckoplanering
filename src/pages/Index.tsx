import { useState, useEffect } from 'react';
import WeekHeader from '@/components/WeekHeader';
import WeekTable from '@/components/WeekTable';
import { navigateWeek, getWeekNumber, getWeekYear } from '@/utils/dateUtils';
import { Employee, DayStatus } from '@/types/schedule';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const Index = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchEmployeesAndSchedules();
  }, [currentDate]);

  const fetchEmployeesAndSchedules = async () => {
    setLoading(true);
    try {
      const weekNumber = getWeekNumber(currentDate);
      const year = getWeekYear(currentDate);

      // Fetch employees
      const { data: employeesData, error: employeesError } = await supabase
        .from('employees')
        .select('*')
        .order('name');

      if (employeesError) throw employeesError;

      // Fetch schedules for this week
      const { data: schedulesData, error: schedulesError } = await supabase
        .from('employee_schedules')
        .select('*')
        .eq('week_number', weekNumber)
        .eq('year', year);

      if (schedulesError) throw schedulesError;

      // Build schedules map
      const schedulesMap = new Map<string, Map<string, DayStatus>>();
      schedulesData?.forEach((schedule) => {
        if (!schedulesMap.has(schedule.employee_id)) {
          schedulesMap.set(schedule.employee_id, new Map());
        }
        // Parse JSONB status data
        const statusData = typeof schedule.status === 'string' 
          ? JSON.parse(schedule.status) 
          : schedule.status;
        schedulesMap.get(schedule.employee_id)?.set(schedule.day_key, statusData as DayStatus);
      });

      // Initialize employees with schedules from database or default
      const employeesWithSchedules: Employee[] = (employeesData || []).map(emp => ({
        id: emp.id,
        name: emp.name,
        week: {
          mon: schedulesMap.get(emp.id)?.get('mon') || { segments: [{ status: 'unset' }] },
          tue: schedulesMap.get(emp.id)?.get('tue') || { segments: [{ status: 'unset' }] },
          wed: schedulesMap.get(emp.id)?.get('wed') || { segments: [{ status: 'unset' }] },
          thu: schedulesMap.get(emp.id)?.get('thu') || { segments: [{ status: 'unset' }] },
          fri: schedulesMap.get(emp.id)?.get('fri') || { segments: [{ status: 'unset' }] },
        },
      }));

      setEmployees(employeesWithSchedules);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: 'Fel',
        description: 'Kunde inte hämta data',
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

  const handleUpdateStatus = async (employeeId: string, dayKey: string, status: DayStatus) => {
    const weekNumber = getWeekNumber(currentDate);
    const year = getWeekYear(currentDate);

    try {
      // Update database
      const { error } = await supabase
        .from('employee_schedules')
        .upsert(
          {
            employee_id: employeeId,
            week_number: weekNumber,
            year: year,
            day_key: dayKey,
            status: status as any,
          },
          {
            onConflict: 'employee_id,week_number,year,day_key'
          }
        );

      if (error) throw error;

      // Update local state
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

      toast({
        title: 'Sparat',
        description: 'Status uppdaterad',
      });
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: 'Fel',
        description: 'Kunde inte spara status',
        variant: 'destructive',
      });
    }
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
