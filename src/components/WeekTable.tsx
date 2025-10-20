import { useState } from 'react';
import { Employee, DayStatus } from '@/types/schedule';
import { getWeekDays, formatDate, formatDayName, getDayKey } from '@/utils/dateUtils';
import StatusCell from './StatusCell';
import StatusModal from './StatusModal';

interface WeekTableProps {
  currentDate: Date;
  employees: Employee[];
  onUpdateStatus: (employeeId: string, dayKey: string, status: DayStatus) => void;
}

const WeekTable = ({ currentDate, employees, onUpdateStatus }: WeekTableProps) => {
  const weekDays = getWeekDays(currentDate);
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    employeeId: string;
    dayKey: string;
    currentStatus: DayStatus;
    employeeName: string;
    dayName: string;
  } | null>(null);

  const handleCellClick = (
    employee: Employee,
    dayKey: string,
    currentStatus: DayStatus,
    dayName: string
  ) => {
    setModalState({
      isOpen: true,
      employeeId: employee.id,
      dayKey,
      currentStatus,
      employeeName: employee.name,
      dayName,
    });
  };

  const handleSaveStatus = (status: DayStatus) => {
    if (modalState) {
      onUpdateStatus(modalState.employeeId, modalState.dayKey, status);
    }
    setModalState(null);
  };

  return (
    <>
      <div className="container mx-auto px-4 py-6">
        <div className="bg-card rounded-lg shadow-lg border border-border overflow-hidden">
          {/* Desktop view */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-primary/5 border-b border-border">
                  <th className="text-left p-4 font-semibold text-foreground w-48">
                    Medarbetare
                  </th>
                  {weekDays.map((day, index) => (
                    <th key={index} className="text-center p-4 font-semibold text-foreground">
                      <div className="flex flex-col">
                        <span className="text-sm">{formatDayName(day)}</span>
                        <span className="text-xs text-muted-foreground">{formatDate(day)}</span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {employees.map((employee) => (
                  <tr key={employee.id} className="border-b border-border last:border-0">
                    <td className="p-4">
                      <div>
                        <div className="font-medium text-foreground">{employee.name}</div>
                        <div className="text-sm text-muted-foreground">{employee.role}</div>
                      </div>
                    </td>
                    {weekDays.map((day, index) => {
                      const dayKey = getDayKey(day);
                      const status = employee.week[dayKey];
                      return (
                        <td key={index} className="p-2">
                          <StatusCell
                            status={status}
                            onClick={() =>
                              handleCellClick(employee, dayKey, status, formatDayName(day))
                            }
                          />
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile view */}
          <div className="md:hidden">
            {employees.map((employee) => (
              <div key={employee.id} className="border-b border-border last:border-0 p-4">
                <div className="mb-3">
                  <div className="font-medium text-foreground">{employee.name}</div>
                  <div className="text-sm text-muted-foreground">{employee.role}</div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {weekDays.map((day, index) => {
                    const dayKey = getDayKey(day);
                    const status = employee.week[dayKey];
                    return (
                      <div key={index}>
                        <div className="text-xs text-muted-foreground mb-1">
                          {formatDayName(day)} {formatDate(day)}
                        </div>
                        <StatusCell
                          status={status}
                          onClick={() =>
                            handleCellClick(employee, dayKey, status, formatDayName(day))
                          }
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {modalState && (
        <StatusModal
          isOpen={modalState.isOpen}
          onClose={() => setModalState(null)}
          currentStatus={modalState.currentStatus}
          employeeName={modalState.employeeName}
          dayName={modalState.dayName}
          onSave={handleSaveStatus}
        />
      )}
    </>
  );
};

export default WeekTable;
