import { useState } from 'react';
import { Employee, DayStatus } from '@/types/schedule';
import { getWeekDays, formatDate, formatDayName, getDayKey } from '@/utils/dateUtils';
import StatusCell from './StatusCell';
import StatusModal from './StatusModal';
import { Pencil } from 'lucide-react';
import { cn } from '@/lib/utils';

interface WeekTableProps {
  currentDate: Date;
  employees: Employee[];
  onUpdateStatus: (employeeId: string, dayKey: string, status: DayStatus) => void;
  onEditEmployee: (employeeId: string, currentName: string) => void;
}

const WeekTable = ({ currentDate, employees, onUpdateStatus, onEditEmployee }: WeekTableProps) => {
  const weekDays = getWeekDays(currentDate);
  const [hoveredEmployeeId, setHoveredEmployeeId] = useState<string | null>(null);
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
            <table className="w-full table-fixed">
              <colgroup>
                <col className="w-44" />
                {weekDays.map((_, index) => (
                  <col key={index} className="w-[calc((100%-11rem)/5)]" />
                ))}
              </colgroup>
              <thead>
                <tr className="bg-primary/5 border-b border-border">
                  <th className="text-left p-3 font-semibold text-foreground">
                    Medarbetare
                  </th>
                  {weekDays.map((day, index) => (
                    <th key={index} className="text-center p-2 font-semibold text-foreground">
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
                    <td 
                      className="p-3"
                      onMouseEnter={() => setHoveredEmployeeId(employee.id)}
                      onMouseLeave={() => setHoveredEmployeeId(null)}
                    >
                      <div className="flex items-center gap-2 group">
                        <div className="font-medium text-foreground text-sm">{employee.name}</div>
                        <button
                          onClick={() => onEditEmployee(employee.id, employee.name)}
                          className={cn(
                            "p-1 rounded hover:bg-muted transition-all",
                            hoveredEmployeeId === employee.id ? "opacity-100" : "opacity-0"
                          )}
                        >
                          <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                        </button>
                      </div>
                    </td>
                    {weekDays.map((day, index) => {
                      const dayKey = getDayKey(day);
                      const status = employee.week[dayKey];
                      return (
                        <td key={index} className="p-1.5">
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
                <div className="mb-3 flex items-center gap-2">
                  <div className="font-medium text-foreground flex-1">{employee.name}</div>
                  <button
                    onClick={() => onEditEmployee(employee.id, employee.name)}
                    className="p-1.5 rounded hover:bg-muted transition-all"
                  >
                    <Pencil className="h-4 w-4 text-muted-foreground" />
                  </button>
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
