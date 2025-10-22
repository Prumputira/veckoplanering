import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import WeekHeader from '@/components/WeekHeader';
import WeekTable from '@/components/WeekTable';
import EmployeeModal from '@/components/EmployeeModal';
import { navigateWeek, getWeekNumber, getWeekYear } from '@/utils/dateUtils';
import { Employee, DayStatus } from '@/types/schedule';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';
import { User } from '@supabase/supabase-js';

const Index = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [editModalState, setEditModalState] = useState<{ isOpen: boolean; employeeId: string; currentName: string } | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Check authentication
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate('/auth');
      } else {
        setUser(session.user);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        navigate('/auth');
      } else {
        setUser(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

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
      toast({
        title: 'Fel',
        description: 'Kunde inte spara status',
        variant: 'destructive',
      });
    }
  };


  const handleEditEmployee = async (newName: string) => {
    if (!editModalState) return;

    try {
      const { error } = await supabase
        .from('employees')
        .update({ name: newName })
        .eq('id', editModalState.employeeId);

      if (error) throw error;

      setEmployees((prev) =>
        prev.map((emp) =>
          emp.id === editModalState.employeeId ? { ...emp, name: newName } : emp
        )
      );

      toast({
        title: 'Namn uppdaterat',
        description: `Namnet har ändrats till ${newName}`,
      });
    } catch (error) {
      toast({
        title: 'Fel',
        description: 'Kunde inte uppdatera namn',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteEmployee = async () => {
    if (!editModalState) return;

    try {
      const { error } = await supabase
        .from('employees')
        .delete()
        .eq('id', editModalState.employeeId);

      if (error) throw error;

      setEmployees((prev) => prev.filter((emp) => emp.id !== editModalState.employeeId));

      toast({
        title: 'Anställd borttagen',
        description: 'Anställd och all schemahistorik har raderats',
      });
    } catch (error) {
      toast({
        title: 'Fel',
        description: 'Kunde inte ta bort anställd',
        variant: 'destructive',
      });
    }
  };

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      toast({
        title: 'Utloggad',
        description: 'Du har loggats ut',
      });
    } catch (error) {
      toast({
        title: 'Fel',
        description: 'Kunde inte logga ut',
        variant: 'destructive',
      });
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-3 flex justify-end">
          <Button
            onClick={handleLogout}
            variant="ghost"
            size="sm"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Logga ut
          </Button>
        </div>
      </div>
      <WeekHeader 
        currentDate={currentDate} 
        onNavigate={handleNavigate}
        onSelectWeek={handleSelectWeek}
      />
      <WeekTable
        currentDate={currentDate}
        employees={employees}
        onUpdateStatus={handleUpdateStatus}
        onEditEmployee={(employeeId, currentName) =>
          setEditModalState({ isOpen: true, employeeId, currentName })
        }
      />
      {editModalState && (
        <EmployeeModal
          isOpen={editModalState.isOpen}
          onClose={() => setEditModalState(null)}
          onSave={handleEditEmployee}
          onDelete={handleDeleteEmployee}
          initialName={editModalState.currentName}
          title="Redigera anställd"
          description="Ändra namn på anställd"
        />
      )}
    </div>
  );
};

export default Index;
