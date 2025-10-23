import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import WeekHeader from '@/components/WeekHeader';
import WeekTable from '@/components/WeekTable';
import EmployeeModal from '@/components/EmployeeModal';
import AdminDashboard from '@/components/AdminDashboard';
import { navigateWeek, getWeekNumber, getWeekYear } from '@/utils/dateUtils';
import { Employee, DayStatus } from '@/types/schedule';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { LogOut, Settings } from 'lucide-react';
import { User } from '@supabase/supabase-js';

const Index = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [editModalState, setEditModalState] = useState<{ isOpen: boolean; employeeId: string; currentName: string } | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [copiedWeek, setCopiedWeek] = useState<{ [key: string]: DayStatus } | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  const checkAdminStatus = async (userId: string) => {
    const { data, error } = await supabase.rpc('has_role', {
      _user_id: userId,
      _role: 'admin'
    });
    
    if (!error && data) {
      setIsAdmin(true);
    } else {
      setIsAdmin(false);
    }
  };

  useEffect(() => {
    // Check authentication
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate('/auth');
      } else {
        setUser(session.user);
        checkAdminStatus(session.user.id);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        navigate('/auth');
      } else {
        setUser(session.user);
        checkAdminStatus(session.user.id);
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

      // Fetch profiles (which now contain all employee data)
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('name');

      if (profilesError) throw profilesError;

      // Fetch schedules for this week
      const { data: schedulesData, error: schedulesError } = await supabase
        .from('employee_schedules')
        .select('*')
        .eq('week_number', weekNumber)
        .eq('year', year);

      if (schedulesError) throw schedulesError;

      // Build schedules map using user_id
      const schedulesMap = new Map<string, Map<string, DayStatus>>();
      schedulesData?.forEach((schedule) => {
        if (!schedulesMap.has(schedule.user_id)) {
          schedulesMap.set(schedule.user_id, new Map());
        }
        // Parse JSONB status data
        const statusData = typeof schedule.status === 'string' 
          ? JSON.parse(schedule.status) 
          : schedule.status;
        schedulesMap.get(schedule.user_id)?.set(schedule.day_key, statusData as DayStatus);
      });

      // Initialize employees with schedules from database or default
      const employeesWithSchedules: Employee[] = (profilesData || []).map(profile => ({
        id: profile.id,
        name: profile.name,
        week: {
          mon: schedulesMap.get(profile.id)?.get('mon') || { segments: [{ status: 'unset' }] },
          tue: schedulesMap.get(profile.id)?.get('tue') || { segments: [{ status: 'unset' }] },
          wed: schedulesMap.get(profile.id)?.get('wed') || { segments: [{ status: 'unset' }] },
          thu: schedulesMap.get(profile.id)?.get('thu') || { segments: [{ status: 'unset' }] },
          fri: schedulesMap.get(profile.id)?.get('fri') || { segments: [{ status: 'unset' }] },
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
      // Update database - user_id instead of employee_id
      const { error } = await supabase
        .from('employee_schedules')
        .upsert(
          {
            user_id: employeeId,
            week_number: weekNumber,
            year: year,
            day_key: dayKey,
            status: status as any,
          },
          {
            onConflict: 'user_id,week_number,year,day_key'
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
      // Update profile name
      const { error } = await supabase
        .from('profiles')
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
      // Delete profile (this will cascade delete schedules)
      const { error } = await supabase
        .from('profiles')
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

  const handleCopyWeek = (employeeId: string) => {
    const employee = employees.find(emp => emp.id === employeeId);
    if (employee) {
      setCopiedWeek({ ...employee.week });
      toast({
        title: 'Vecka kopierad',
        description: `${employee.name}s vecka har kopierats`,
      });
    }
  };

  const handlePasteWeek = async (employeeId: string) => {
    if (!copiedWeek) return;

    const weekNumber = getWeekNumber(currentDate);
    const year = getWeekYear(currentDate);
    const employee = employees.find(emp => emp.id === employeeId);

    try {
      // Update all days for this employee
      const days = ['mon', 'tue', 'wed', 'thu', 'fri'];
      
      for (const dayKey of days) {
        const status = copiedWeek[dayKey];
        if (status) {
          await supabase
            .from('employee_schedules')
            .upsert(
              {
                user_id: employeeId,
                week_number: weekNumber,
                year: year,
                day_key: dayKey,
                status: status as any,
              },
              {
                onConflict: 'user_id,week_number,year,day_key'
              }
            );
        }
      }

      // Update local state
      setEmployees((prev) =>
        prev.map((emp) =>
          emp.id === employeeId
            ? {
                ...emp,
                week: { ...copiedWeek },
              }
            : emp
        )
      );

      toast({
        title: 'Vecka inklistrad',
        description: `Veckan har klistrats in för ${employee?.name}`,
      });
    } catch (error) {
      toast({
        title: 'Fel',
        description: 'Kunde inte klistra in vecka',
        variant: 'destructive',
      });
    }
  };

  const handleClearWeek = async (employeeId: string) => {
    const weekNumber = getWeekNumber(currentDate);
    const year = getWeekYear(currentDate);
    const employee = employees.find(emp => emp.id === employeeId);

    try {
      const emptyStatus: DayStatus = { segments: [{ status: 'unset' }] };
      const days = ['mon', 'tue', 'wed', 'thu', 'fri'];
      
      for (const dayKey of days) {
        await supabase
          .from('employee_schedules')
          .upsert(
            {
              user_id: employeeId,
              week_number: weekNumber,
              year: year,
              day_key: dayKey,
              status: emptyStatus as any,
            },
            {
              onConflict: 'user_id,week_number,year,day_key'
            }
          );
      }

      // Update local state
      setEmployees((prev) =>
        prev.map((emp) =>
          emp.id === employeeId
            ? {
                ...emp,
                week: {
                  mon: emptyStatus,
                  tue: emptyStatus,
                  wed: emptyStatus,
                  thu: emptyStatus,
                  fri: emptyStatus,
                },
              }
            : emp
        )
      );

      toast({
        title: 'Vecka tömd',
        description: `Veckan har tömts för ${employee?.name}`,
      });
    } catch (error) {
      toast({
        title: 'Fel',
        description: 'Kunde inte tömma vecka',
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
        <div className="container mx-auto px-4 py-3 flex justify-end gap-2">
          <Button
            onClick={() => navigate('/settings')}
            variant="ghost"
            size="sm"
            className="hover:bg-accent/10"
          >
            <Settings className="h-4 w-4 mr-2" />
            Inställningar
          </Button>
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
      {isAdmin && <AdminDashboard />}
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
        onCopyWeek={handleCopyWeek}
        onPasteWeek={handlePasteWeek}
        onClearWeek={handleClearWeek}
        hasCopiedWeek={copiedWeek !== null}
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
