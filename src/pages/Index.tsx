import { useState } from 'react';
import WeekHeader from '@/components/WeekHeader';
import WeekTable from '@/components/WeekTable';
import { mockEmployees } from '@/data/mockData';
import { navigateWeek } from '@/utils/dateUtils';
import { Employee, DayStatus } from '@/types/schedule';

const Index = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [employees, setEmployees] = useState<Employee[]>(mockEmployees);

  const handleNavigate = (direction: 'prev' | 'next') => {
    setCurrentDate(navigateWeek(currentDate, direction));
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
      <WeekHeader currentDate={currentDate} onNavigate={handleNavigate} />
      <WeekTable
        currentDate={currentDate}
        employees={employees}
        onUpdateStatus={handleUpdateStatus}
      />
    </div>
  );
};

export default Index;
