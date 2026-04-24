import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import WeekHeader from '@/components/WeekHeader';
import WeekTable from '@/components/WeekTable';
import EmployeeModal from '@/components/EmployeeModal';
import { WeekCarousel } from '@/components/WeekCarousel';
import { OfficeWeekReminder } from '@/components/OfficeWeekReminder';
import { navigateWeek, getWeekNumber, getWeekYear, getDayKey } from '@/utils/dateUtils';
import { Employee, DayStatus, OfficeWeek } from '@/types/schedule';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useSwipe } from '@/hooks/use-swipe';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import { LogOut, Settings } from 'lucide-react';
import { User } from '@supabase/supabase-js';

const Index = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [prevWeekEmployees, setPrevWeekEmployees] = useState<Employee[]>([]);
  const [nextWeekEmployees, setNextWeekEmployees] = useState<Employee[]>([]);
  const [todayWeekEmployees, setTodayWeekEmployees] = useState<Employee[]>([]);
  const [currentWeekOfficeWeeks, setCurrentWeekOfficeWeeks] = useState<OfficeWeek[]>([]);
  const [prevWeekOfficeWeeks, setPrevWeekOfficeWeeks] = useState<OfficeWeek[]>([]);
  const [nextWeekOfficeWeeks, setNextWeekOfficeWeeks] = useState<OfficeWeek[]>([]);
  const [loading, setLoading] = useState(true);
  const [editModalState, setEditModalState] = useState<{ isOpen: boolean; employeeId: string; currentName: string } | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [copiedWeek, setCopiedWeek] = useState<{ [key: string]: DayStatus } | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();
  const isMobile = useIsMobile();

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
    if (user) {
      fetchEmployeesAndSchedules();
      if (!isMobile) {
        fetchAdjacentWeeks();
      }
    }
  }, [currentDate, user]);

  // Hämta alltid innevarande veckas scheman separat så todayStats fungerar oavsett vald vecka
  useEffect(() => {
    if (!user) return;
    const fetchTodayWeek = async () => {
      const today = new Date();
      const weekNumber = getWeekNumber(today);
      const year = getWeekYear(today);

      const { data: profilesData } = await supabase
        .from('profiles')
        .select('*')
        .eq('is_hidden', false)
        .order('name');

      const { data: schedulesData } = await supabase
        .from('employee_schedules')
        .select('*')
        .eq('week_number', weekNumber)
        .eq('year', year);

      const schedulesMap = new Map<string, Map<string, DayStatus>>();
      schedulesData?.forEach((schedule) => {
        if (!schedulesMap.has(schedule.user_id)) {
          schedulesMap.set(schedule.user_id, new Map());
        }
        const statusData = typeof schedule.status === 'string'
          ? JSON.parse(schedule.status)
          : schedule.status;
        schedulesMap.get(schedule.user_id)?.set(schedule.day_key, statusData as DayStatus);
      });

      const built: Employee[] = (profilesData || []).map(profile => ({
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

      setTodayWeekEmployees(built);
    };

    fetchTodayWeek();
  }, [user, currentDate]);

  const fetchEmployeesAndSchedules = async () => {
    setLoading(true);
    try {
      const weekNumber = getWeekNumber(currentDate);
      const year = getWeekYear(currentDate);

      // Fetch profiles (which now contain all employee data)
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .eq('is_hidden', false)
        .order('name');

      if (profilesError) throw profilesError;

      // Fetch schedules for this week
      const { data: schedulesData, error: schedulesError } = await supabase
        .from('employee_schedules')
        .select('*')
        .eq('week_number', weekNumber)
        .eq('year', year);

      if (schedulesError) throw schedulesError;

      // Fetch office weeks for current week
      const { data: officeWeeksData } = await supabase
        .from('office_weeks')
        .select('*')
        .eq('week_number', weekNumber)
        .eq('year', year);

      setCurrentWeekOfficeWeeks(officeWeeksData || []);

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

      // Sort so current user is first
      const sortedEmployees = employeesWithSchedules.sort((a, b) => {
        if (a.id === user?.id) return -1;
        if (b.id === user?.id) return 1;
        return a.name.localeCompare(b.name);
      });

      setEmployees(sortedEmployees);
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

  // Get office responsible people for current week
  const getOfficeResponsible = (): string[] => {
    if (!currentWeekOfficeWeeks.length) return [];
    
    const responsibleIds = currentWeekOfficeWeeks
      .filter(week => week.user_id && !week.is_closed)
      .map(week => week.user_id);
    
    return employees
      .filter(emp => responsibleIds.includes(emp.id))
      .map(emp => emp.name);
  };

  const fetchAdjacentWeeks = async () => {
    if (!user) return;

    const prevWeekDate = navigateWeek(currentDate, 'prev');
    const nextWeekDate = navigateWeek(currentDate, 'next');

    try {
      // Fetch prev week
      const prevWeekNumber = getWeekNumber(prevWeekDate);
      const prevYear = getWeekYear(prevWeekDate);
      
      const { data: prevProfiles } = await supabase
        .from('profiles')
        .select('*')
        .eq('is_hidden', false)
        .order('name');

      const { data: prevSchedules } = await supabase
        .from('employee_schedules')
        .select('*')
        .eq('week_number', prevWeekNumber)
        .eq('year', prevYear);

      // Fetch office weeks for prev week
      const { data: prevOfficeWeeks } = await supabase
        .from('office_weeks')
        .select('*')
        .eq('week_number', prevWeekNumber)
        .eq('year', prevYear);

      setPrevWeekOfficeWeeks(prevOfficeWeeks || []);

      const prevSchedulesMap = new Map<string, Map<string, DayStatus>>();
      prevSchedules?.forEach(schedule => {
        if (!prevSchedulesMap.has(schedule.user_id)) {
          prevSchedulesMap.set(schedule.user_id, new Map());
        }
        const statusData = typeof schedule.status === 'string' 
          ? JSON.parse(schedule.status) 
          : schedule.status;
        prevSchedulesMap.get(schedule.user_id)?.set(schedule.day_key, statusData as DayStatus);
      });

      const prevWeekData: Employee[] = (prevProfiles || []).map(profile => ({
        id: profile.id,
        name: profile.name,
        week: {
          mon: prevSchedulesMap.get(profile.id)?.get('mon') || { segments: [{ status: 'unset' }] },
          tue: prevSchedulesMap.get(profile.id)?.get('tue') || { segments: [{ status: 'unset' }] },
          wed: prevSchedulesMap.get(profile.id)?.get('wed') || { segments: [{ status: 'unset' }] },
          thu: prevSchedulesMap.get(profile.id)?.get('thu') || { segments: [{ status: 'unset' }] },
          fri: prevSchedulesMap.get(profile.id)?.get('fri') || { segments: [{ status: 'unset' }] },
        },
      }));

      // Fetch next week
      const nextWeekNumber = getWeekNumber(nextWeekDate);
      const nextYear = getWeekYear(nextWeekDate);
      
      const { data: nextProfiles } = await supabase
        .from('profiles')
        .select('*')
        .eq('is_hidden', false)
        .order('name');

      const { data: nextSchedules } = await supabase
        .from('employee_schedules')
        .select('*')
        .eq('week_number', nextWeekNumber)
        .eq('year', nextYear);

      // Fetch office weeks for next week
      const { data: nextOfficeWeeks } = await supabase
        .from('office_weeks')
        .select('*')
        .eq('week_number', nextWeekNumber)
        .eq('year', nextYear);

      setNextWeekOfficeWeeks(nextOfficeWeeks || []);

      const nextSchedulesMap = new Map<string, Map<string, DayStatus>>();
      nextSchedules?.forEach(schedule => {
        if (!nextSchedulesMap.has(schedule.user_id)) {
          nextSchedulesMap.set(schedule.user_id, new Map());
        }
        const statusData = typeof schedule.status === 'string' 
          ? JSON.parse(schedule.status) 
          : schedule.status;
        nextSchedulesMap.get(schedule.user_id)?.set(schedule.day_key, statusData as DayStatus);
      });

      const nextWeekData: Employee[] = (nextProfiles || []).map(profile => ({
        id: profile.id,
        name: profile.name,
        week: {
          mon: nextSchedulesMap.get(profile.id)?.get('mon') || { segments: [{ status: 'unset' }] },
          tue: nextSchedulesMap.get(profile.id)?.get('tue') || { segments: [{ status: 'unset' }] },
          wed: nextSchedulesMap.get(profile.id)?.get('wed') || { segments: [{ status: 'unset' }] },
          thu: nextSchedulesMap.get(profile.id)?.get('thu') || { segments: [{ status: 'unset' }] },
          fri: nextSchedulesMap.get(profile.id)?.get('fri') || { segments: [{ status: 'unset' }] },
        },
      }));

      setPrevWeekEmployees(prevWeekData);
      setNextWeekEmployees(nextWeekData);
    } catch (error) {
      console.error('Error fetching adjacent weeks:', error);
    }
  };

  const handleNavigate = (direction: 'prev' | 'next') => {
    setCurrentDate((prevDate) => navigateWeek(prevDate, direction));
  };

  // Enable swipe gestures on mobile with smooth animation
  const { offset: swipeOffset, isSwiping } = useSwipe({
    onSwipeLeft: () => handleNavigate('next'),
    onSwipeRight: () => handleNavigate('prev'),
  });

  const handleSelectWeek = (date: Date) => {
    setCurrentDate(new Date(date));
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

  interface PersonInfo {
    name: string;
    period?: string;
    reason?: string;
  }

  // Calculate today's stats
  const getTodayStats = () => {
    const today = new Date();
    const todayKey = getDayKey(today);

    // Statistiken gäller alltid dagens datum.
    // När man tittar på en annan vecka använder vi `employees` om man råkar
    // vara på innevarande vecka, annars saknas data och vi returnerar tomma värden.
    const currentWeekNum = getWeekNumber(today);
    const currentYear = getWeekYear(today);
    const viewingWeekNum = getWeekNumber(currentDate);
    const viewingYear = getWeekYear(currentDate);
    const isViewingCurrentWeek =
      currentWeekNum === viewingWeekNum && currentYear === viewingYear;

    let office = 0;
    let home = 0;
    let absent = 0;
    const officeByLocation: { [office: string]: PersonInfo[] } = {};
    const homeNames: PersonInfo[] = [];
    const absentNames: PersonInfo[] = [];

    const sourceEmployees = isViewingCurrentWeek ? employees : [];

    sourceEmployees.forEach((employee) => {
      const dayStatus = employee.week[todayKey];
      if (dayStatus && dayStatus.segments) {
        dayStatus.segments.forEach((segment) => {
          if (segment.status === 'office') {
            office++;
            const location = segment.office || 'Okänt kontor';
            if (!officeByLocation[location]) {
              officeByLocation[location] = [];
            }
            const personInfo: PersonInfo = {
              name: employee.name,
              period: segment.period,
              reason: segment.reason
            };
            if (!officeByLocation[location].some(p => p.name === employee.name && p.period === segment.period)) {
              officeByLocation[location].push(personInfo);
            }
          } else if (segment.status === 'home') {
            home++;
            const personInfo: PersonInfo = {
              name: employee.name,
              period: segment.period,
              reason: segment.reason
            };
            if (!homeNames.some(p => p.name === employee.name && p.period === segment.period)) {
              homeNames.push(personInfo);
            }
          } else if (segment.status === 'absent') {
            absent++;
            const personInfo: PersonInfo = {
              name: employee.name,
              period: segment.period,
              reason: segment.reason
            };
            if (!absentNames.some(p => p.name === employee.name && p.period === segment.period)) {
              absentNames.push(personInfo);
            }
          }
        });
      }
    });

    return { 
      office, 
      home, 
      absent, 
      officeByLocation, 
      homeNames, 
      absentNames 
    };
  };

  const todayStats = getTodayStats();

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
      <OfficeWeekReminder userId={user?.id || null} />
      <WeekHeader
        currentDate={currentDate} 
        onNavigate={handleNavigate}
        onSelectWeek={handleSelectWeek}
        employees={employees}
        officeResponsible={getOfficeResponsible()}
        todayStats={todayStats}
        onNavigateSettings={() => navigate('/settings')}
        onLogout={handleLogout}
      />
      
      {isMobile ? (
        <div 
          className="touch-pan-y overflow-hidden"
          style={{
            transform: `translateX(${swipeOffset}px)`,
            transition: isSwiping ? 'none' : 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        >
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
            currentUserId={user?.id || null}
            officeWeeks={currentWeekOfficeWeeks}
            isAdmin={isAdmin}
          />
        </div>
      ) : (
        <WeekCarousel
          prevWeekEmployees={prevWeekEmployees}
          currentWeekEmployees={employees}
          nextWeekEmployees={nextWeekEmployees}
          prevWeekDate={navigateWeek(currentDate, 'prev')}
          currentDate={currentDate}
          nextWeekDate={navigateWeek(currentDate, 'next')}
          onNavigate={handleNavigate}
          onUpdateStatus={handleUpdateStatus}
          onEditEmployee={(employeeId, currentName) =>
            setEditModalState({ isOpen: true, employeeId, currentName })
          }
          onCopyWeek={handleCopyWeek}
          onPasteWeek={handlePasteWeek}
          onClearWeek={handleClearWeek}
          hasCopiedWeek={copiedWeek !== null}
          currentUserId={user?.id || null}
          prevWeekOfficeWeeks={prevWeekOfficeWeeks}
          currentWeekOfficeWeeks={currentWeekOfficeWeeks}
          nextWeekOfficeWeeks={nextWeekOfficeWeeks}
          isAdmin={isAdmin}
        />
      )}
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
