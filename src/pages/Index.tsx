import { useState, useEffect } from 'react';
import WeekHeader from '@/components/WeekHeader';
import WeekTable from '@/components/WeekTable';
import EmployeeModal from '@/components/EmployeeModal';
import { navigateWeek, getWeekNumber, getWeekYear } from '@/utils/dateUtils';
import { Employee, DayStatus } from '@/types/schedule';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

const Index = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalState, setEditModalState] = useState<{ isOpen: boolean; employeeId: string; currentName: string } | null>(null);
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

  const handleAddEmployee = async (name: string) => {
    try {
      const { data, error } = await supabase
        .from('employees')
        .insert({ name })
        .select()
        .single();

      if (error) throw error;

      if (data) {
        const newEmployee: Employee = {
          id: data.id,
          name: data.name,
          week: {
            mon: { segments: [{ status: 'unset' }] },
            tue: { segments: [{ status: 'unset' }] },
            wed: { segments: [{ status: 'unset' }] },
            thu: { segments: [{ status: 'unset' }] },
            fri: { segments: [{ status: 'unset' }] },
          },
        };
        setEmployees((prev) => [...prev, newEmployee]);
        toast({
          title: 'Anställd tillagd',
          description: `${name} har lagts till`,
        });
      }
    } catch (error) {
      console.error('Error adding employee:', error);
      toast({
        title: 'Fel',
        description: 'Kunde inte lägga till anställd',
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
      console.error('Error updating employee:', error);
      toast({
        title: 'Fel',
        description: 'Kunde inte uppdatera namn',
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
        onEditEmployee={(employeeId, currentName) =>
          setEditModalState({ isOpen: true, employeeId, currentName })
        }
      />
      <div className="container mx-auto px-4 pb-6">
        <Button
          onClick={() => setAddModalOpen(true)}
          className="w-full"
          variant="outline"
          size="lg"
        >
          <Plus className="h-5 w-5 mr-2" />
          Lägg till anställd
        </Button>
      </div>

      <EmployeeModal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        onSave={handleAddEmployee}
        title="Lägg till anställd"
        description="Ange namn på den nya anställda"
      />

      {editModalState && (
        <EmployeeModal
          isOpen={editModalState.isOpen}
          onClose={() => setEditModalState(null)}
          onSave={handleEditEmployee}
          initialName={editModalState.currentName}
          title="Redigera anställd"
          description="Ändra namn på anställd"
        />
      )}
    </div>
  );
};

export default Index;
