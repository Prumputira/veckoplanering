import { useState } from 'react';
import { Employee, DayStatus } from '@/types/schedule';
import { getWeekDays, formatDate, formatDayName, getDayKey } from '@/utils/dateUtils';
import StatusCell from './StatusCell';
import StatusModal from './StatusModal';
import { Pencil, Copy, Clipboard, Trash2, MoreVertical } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface WeekTableProps {
  currentDate: Date;
  employees: Employee[];
  onUpdateStatus: (employeeId: string, dayKey: string, status: DayStatus) => void;
  onEditEmployee: (employeeId: string, currentName: string) => void;
  onCopyWeek: (employeeId: string) => void;
  onPasteWeek: (employeeId: string) => void;
  onClearWeek: (employeeId: string) => void;
  hasCopiedWeek: boolean;
  currentUserId: string | null;
}

const WeekTable = ({ 
  currentDate, 
  employees, 
  onUpdateStatus, 
  onEditEmployee, 
  onCopyWeek, 
  onPasteWeek, 
  onClearWeek,
  hasCopiedWeek,
  currentUserId 
}: WeekTableProps) => {
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
  const { toast } = useToast();

  const handleCellClick = (
    employee: Employee,
    dayKey: string,
    currentStatus: DayStatus,
    dayName: string
  ) => {
    // Only allow editing own cells
    if (employee.id !== currentUserId) {
      toast({
        title: "Inte tillåtet",
        description: "Du kan bara redigera dina egna celler",
        variant: "destructive",
      });
      return;
    }

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
                  <col key={index} className="w-[calc((100%-14rem)/5)]" />
                ))}
                <col className="w-20" />
              </colgroup>
              <thead>
                <tr className="bg-primary/5 border-b border-border">
                  <th className="text-left px-3 py-1.5 font-semibold text-foreground">
                    Medarbetare
                  </th>
                  {weekDays.map((day, index) => (
                    <th key={index} className="text-center px-2 py-1.5 font-semibold text-foreground">
                      <div className="flex flex-col">
                        <span className="text-sm">{formatDayName(day)}</span>
                        <span className="text-xs text-muted-foreground">{formatDate(day)}</span>
                      </div>
                    </th>
                  ))}
                  <th className="text-center px-2 py-1.5 font-semibold text-foreground">
                    Åtgärder
                  </th>
                </tr>
              </thead>
              <tbody>
                {employees.map((employee, index) => {
                  const isCurrentUser = employee.id === currentUserId;
                  return (
                    <>
                      <tr 
                        key={employee.id} 
                        className={cn(
                          "border-b border-border last:border-0",
                          isCurrentUser && "bg-accent/10"
                        )}
                      >
                        <td 
                          className="px-3 py-1.5"
                          onMouseEnter={() => setHoveredEmployeeId(employee.id)}
                          onMouseLeave={() => setHoveredEmployeeId(null)}
                        >
                          <div className="flex items-center gap-2 group">
                            <div className={cn(
                              "font-medium text-sm",
                              isCurrentUser ? "text-accent font-semibold" : "text-foreground"
                            )}>
                              {employee.name}
                              {isCurrentUser && <span className="ml-2 text-xs text-accent/70">(Du)</span>}
                            </div>
                        {isCurrentUser && (
                          <button
                            onClick={() => onEditEmployee(employee.id, employee.name)}
                            className={cn(
                              "p-1 rounded hover:bg-muted transition-all",
                              hoveredEmployeeId === employee.id ? "opacity-100" : "opacity-0"
                            )}
                          >
                            <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                          </button>
                        )}
                      </div>
                    </td>
                    {weekDays.map((day, index) => {
                      const dayKey = getDayKey(day);
                      const status = employee.week[dayKey];
                      return (
                        <td key={index} className="p-1">
                          <StatusCell
                            status={status}
                            onClick={() =>
                              handleCellClick(employee, dayKey, status, formatDayName(day))
                            }
                          />
                        </td>
                      );
                    })}
                    <td className="p-1 text-center">
                      {isCurrentUser && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              className="h-8 w-8 p-0 hover:bg-accent/20"
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => onCopyWeek(employee.id)}>
                              <Copy className="h-4 w-4 mr-2" />
                              Kopiera vecka
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => onPasteWeek(employee.id)}
                              disabled={!hasCopiedWeek}
                            >
                              <Clipboard className="h-4 w-4 mr-2" />
                              Klistra in vecka
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => onClearWeek(employee.id)}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Töm vecka
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </td>
                  </tr>
                  {isCurrentUser && index < employees.length - 1 && (
                    <tr>
                      <td colSpan={7} className="p-0">
                        <div className="border-t-2 border-accent/30 my-1"></div>
                      </td>
                    </tr>
                  )}
                </>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile view */}
          <div className="md:hidden">
            {employees.map((employee, index) => {
              const isCurrentUser = employee.id === currentUserId;
              return (
                <>
                  <div 
                    key={employee.id} 
                    className={cn(
                      "border-b border-border last:border-0 p-3",
                      isCurrentUser && "bg-accent/10"
                    )}
                  >
                    <div className="mb-2 flex items-center gap-2">
                      <div className={cn(
                        "font-medium flex-1",
                        isCurrentUser ? "text-accent font-semibold" : "text-foreground"
                      )}>
                        {employee.name}
                        {isCurrentUser && <span className="ml-2 text-xs text-accent/70">(Du)</span>}
                      </div>
                      {isCurrentUser && (
                        <>
                          <button
                            onClick={() => onEditEmployee(employee.id, employee.name)}
                            className="p-1.5 rounded hover:bg-muted transition-all"
                          >
                            <Pencil className="h-4 w-4 text-muted-foreground" />
                          </button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                className="h-8 w-8 p-0 hover:bg-accent/20"
                              >
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => onCopyWeek(employee.id)}>
                                <Copy className="h-4 w-4 mr-2" />
                                Kopiera vecka
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => onPasteWeek(employee.id)}
                                disabled={!hasCopiedWeek}
                              >
                                <Clipboard className="h-4 w-4 mr-2" />
                                Klistra in vecka
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => onClearWeek(employee.id)}
                                className="text-destructive focus:text-destructive"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Töm vecka
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </>
                      )}
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
                  {isCurrentUser && index < employees.length - 1 && (
                    <div className="border-t-2 border-accent/30 my-2 mx-3"></div>
                  )}
                </>
              );
            })}
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
