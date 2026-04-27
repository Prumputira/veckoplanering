import { useState } from 'react';
import { Employee, DayStatus, OfficeWeek } from '@/types/schedule';
import { getWeekDays, formatDate, formatDayName, getDayKey, getWeekNumber } from '@/utils/dateUtils';
import { getSwedishHolidays } from '@/utils/swedishHolidays';
import StatusCell from './StatusCell';
import StatusModal from './StatusModal';
import { Pencil, Copy, Clipboard, Trash2, MoreVertical, Building2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
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
  onUpdateStatus: (employeeId: string, dayKey: string, status: DayStatus, date: Date) => void;
  onEditEmployee: (employeeId: string, currentName: string) => void;
  onCopyWeek: (employeeId: string, date: Date) => void;
  onPasteWeek: (employeeId: string, date: Date) => void;
  onClearWeek: (employeeId: string, date: Date) => void;
  hasCopiedWeek: boolean;
  currentUserId: string | null;
  officeWeeks?: OfficeWeek[];
  isAdmin?: boolean;
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
  currentUserId,
  officeWeeks = [],
  isAdmin = false,
}: WeekTableProps) => {
  const weekDays = getWeekDays(currentDate);
  const [hoveredEmployeeId, setHoveredEmployeeId] = useState<string | null>(null);
  const currentWeekNumber = getWeekNumber(currentDate);
  const currentYear = currentDate.getFullYear();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const isToday = (date: Date) => {
    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);
    return checkDate.getTime() === today.getTime();
  };

  const holidayMap = new Map<string, string>();
  weekDays.forEach((d) => {
    const yearHolidays = getSwedishHolidays(d.getFullYear());
    yearHolidays.forEach((h) => {
      const key = `${h.date.getFullYear()}-${h.date.getMonth()}-${h.date.getDate()}`;
      holidayMap.set(key, h.name);
    });
  });
  const isRedDay = (date: Date) => {
    const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
    return date.getDay() === 0 || holidayMap.has(key);
  };
  const getHolidayName = (date: Date) => {
    const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
    return holidayMap.get(key);
  };

  const officeWeekMap = new Map(
    officeWeeks.map((ow) => [`${ow.user_id}-${ow.week_number}-${ow.year}`, true])
  );

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
    if (employee.id !== currentUserId && !isAdmin) {
      toast({
        title: 'Inte tillåtet',
        description: 'Du kan bara redigera dina egna celler',
        variant: 'destructive',
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
      onUpdateStatus(modalState.employeeId, modalState.dayKey, status, currentDate);
    }
    setModalState(null);
  };

  return (
    <>
      <div className="container mx-auto px-4 py-6">
        <div className="bg-card rounded-lg shadow-lg border border-border overflow-hidden">
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full table-fixed">
              <colgroup>
                <col className="w-[calc((100%-5rem)/6)]" />
                {weekDays.map((_, index) => (
                  <col key={index} className="w-[calc((100%-5rem)/6)]" />
                ))}
                <col className="w-20" />
              </colgroup>
              <thead>
                <tr className="bg-primary/5 border-b border-border">
                  <th className="text-left px-3 py-1.5 font-semibold text-foreground">
                    Medarbetare
                  </th>
                  {weekDays.map((day, index) => {
                    const isTodayColumn = isToday(day);
                    const redDay = isRedDay(day);
                    const holidayName = getHolidayName(day);
                    return (
                      <th
                        key={index}
                        className={cn(
                          'text-center px-2 py-1.5 font-semibold text-foreground',
                          isTodayColumn && 'bg-primary/10'
                        )}
                        title={holidayName}
                      >
                        <div className="flex flex-col">
                          <span
                            className={cn(
                              'text-sm',
                              isTodayColumn && 'text-primary font-bold',
                              redDay && !isTodayColumn && 'text-red-600 dark:text-red-400'
                            )}
                          >
                            {formatDayName(day)}
                          </span>
                          <span
                            className={cn(
                              'text-xs',
                              isTodayColumn
                                ? 'text-primary/70 font-semibold'
                                : redDay
                                ? 'text-red-600 dark:text-red-400'
                                : 'text-muted-foreground'
                            )}
                          >
                            {formatDate(day)}
                          </span>
                        </div>
                      </th>
                    );
                  })}
                  <th className="text-center px-2 py-1.5 font-semibold text-foreground">
                    Åtgärder
                  </th>
                </tr>
              </thead>
              <tbody>
                {employees.map((employee) => {
                  const isCurrentUser = employee.id === currentUserId;
                  const hasOfficeWeek = officeWeekMap.has(`${employee.id}-${currentWeekNumber}-${currentYear}`);

                  return (
                    <tr
                      key={employee.id}
                      className={cn(
                        'border-b border-border last:border-0',
                        isCurrentUser && 'bg-accent/10',
                        hasOfficeWeek && 'border-2 border-green-500/40 bg-green-50 dark:bg-green-950/30 shadow-md'
                      )}
                    >
                      <td
                        className="px-3 py-1.5"
                        onMouseEnter={() => setHoveredEmployeeId(employee.id)}
                        onMouseLeave={() => setHoveredEmployeeId(null)}
                      >
                        <div className="flex min-w-0 items-center gap-2">
                          {hasOfficeWeek && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger>
                                  <Building2 className="h-4 w-4 shrink-0 text-green-600 dark:text-green-400" />
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Kontorsvecka</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                          <div
                            className={cn(
                              'min-w-0 flex-1 truncate whitespace-nowrap text-sm font-medium',
                              isCurrentUser ? 'text-accent font-semibold' : 'text-foreground'
                            )}
                            title={employee.name}
                          >
                            {employee.name}
                          </div>
                          {(isCurrentUser || isAdmin) && (
                            <button
                              onClick={() => onEditEmployee(employee.id, employee.name)}
                              className={cn(
                                'shrink-0 rounded p-1 transition-all hover:bg-muted',
                                hoveredEmployeeId === employee.id ? 'opacity-100' : 'opacity-0'
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
                        const isTodayColumn = isToday(day);

                        return (
                          <td
                            key={index}
                            className={cn(
                              'p-1',
                              isTodayColumn && 'bg-primary/10'
                            )}
                          >
                            <StatusCell
                              status={status}
                              onClick={() => handleCellClick(employee, dayKey, status, formatDayName(day))}
                              isToday={isTodayColumn}
                            />
                          </td>
                        );
                      })}
                      <td className="p-1 text-center">
                        {(isCurrentUser || isAdmin) && (
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
                              <DropdownMenuItem onClick={() => onCopyWeek(employee.id, currentDate)}>
                                <Copy className="h-4 w-4 mr-2" />
                                Kopiera vecka
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => onPasteWeek(employee.id, currentDate)}
                                disabled={!hasCopiedWeek}
                              >
                                <Clipboard className="h-4 w-4 mr-2" />
                                Klistra in vecka
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => onClearWeek(employee.id, currentDate)}
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
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="md:hidden">
            {employees.map((employee) => {
              const isCurrentUser = employee.id === currentUserId;
              const hasOfficeWeek = officeWeekMap.has(`${employee.id}-${currentWeekNumber}-${currentYear}`);

              return (
                <div
                  key={employee.id}
                  className={cn(
                    'border-b border-border last:border-0 p-4',
                    isCurrentUser && 'bg-accent/10',
                    hasOfficeWeek && 'border-2 border-green-500/40 bg-green-50 dark:bg-green-950/30 shadow-md'
                  )}
                >
                  <div className="mb-3 flex min-w-0 items-center gap-2">
                    {hasOfficeWeek && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <Building2 className="h-5 w-5 shrink-0 text-green-600 dark:text-green-400" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Kontorsvecka</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                    <div
                      className={cn(
                        'min-w-0 flex-1 truncate whitespace-nowrap text-base font-semibold',
                        isCurrentUser ? 'text-accent' : 'text-foreground'
                      )}
                      title={employee.name}
                    >
                      {employee.name}
                    </div>
                    {(isCurrentUser || isAdmin) && (
                      <div className="flex shrink-0 items-center gap-1">
                        <button
                          onClick={() => onEditEmployee(employee.id, employee.name)}
                          className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded p-2 transition-all hover:bg-muted"
                        >
                          <Pencil className="h-4 w-4 text-muted-foreground" />
                        </button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-11 w-11 p-0 hover:bg-accent/20"
                            >
                              <MoreVertical className="h-5 w-5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem onClick={() => onCopyWeek(employee.id, currentDate)} className="py-3">
                              <Copy className="h-4 w-4 mr-2" />
                              Kopiera vecka
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => onPasteWeek(employee.id, currentDate)}
                              disabled={!hasCopiedWeek}
                              className="py-3"
                            >
                              <Clipboard className="h-4 w-4 mr-2" />
                              Klistra in vecka
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => onClearWeek(employee.id, currentDate)}
                              className="text-destructive focus:text-destructive py-3"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Töm vecka
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    {weekDays.map((day, index) => {
                      const dayKey = getDayKey(day);
                      const status = employee.week[dayKey];
                      const isTodayColumn = isToday(day);
                      const redDay = isRedDay(day);
                      const holidayName = getHolidayName(day);

                      return (
                        <div
                          key={index}
                          className={cn(
                            'flex items-center gap-3 p-2 rounded-md',
                            isTodayColumn && 'bg-primary/10'
                          )}
                          title={holidayName}
                        >
                          <div className="min-w-[90px] text-sm font-medium">
                            <span
                              className={cn(
                                isTodayColumn && 'text-primary font-bold',
                                redDay && !isTodayColumn && 'text-red-600 dark:text-red-400'
                              )}
                            >
                              {formatDayName(day)}
                            </span>
                            <span
                              className={cn(
                                'text-xs ml-1',
                                isTodayColumn
                                  ? 'text-primary/70 font-semibold'
                                  : redDay
                                  ? 'text-red-600 dark:text-red-400'
                                  : 'text-muted-foreground'
                              )}
                            >
                              {formatDate(day)}
                            </span>
                          </div>
                          <div className="flex-1">
                            <StatusCell
                              status={status}
                              onClick={() => handleCellClick(employee, dayKey, status, formatDayName(day))}
                              isToday={isTodayColumn}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
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
