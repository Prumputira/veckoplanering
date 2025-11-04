import { useState } from 'react';
import { Employee, DayStatus, OfficeWeek } from '@/types/schedule';
import { getWeekDays, formatDate, formatDayName, getDayKey, getWeekNumber } from '@/utils/dateUtils';
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
  onUpdateStatus: (employeeId: string, dayKey: string, status: DayStatus) => void;
  onEditEmployee: (employeeId: string, currentName: string) => void;
  onCopyWeek: (employeeId: string) => void;
  onPasteWeek: (employeeId: string) => void;
  onClearWeek: (employeeId: string) => void;
  hasCopiedWeek: boolean;
  currentUserId: string | null;
  officeWeeks?: OfficeWeek[];
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
  officeWeeks = []
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
  
  // Create a map for quick office week lookup
  const officeWeekMap = new Map(
    officeWeeks.map(ow => [`${ow.user_id}-${ow.week_number}-${ow.year}`, true])
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
                  {weekDays.map((day, index) => {
                    const isTodayColumn = isToday(day);
                    return (
                      <th 
                        key={index} 
                        className={cn(
                          "text-center px-2 py-1.5 font-semibold text-foreground",
                          isTodayColumn && "bg-primary/10"
                        )}
                      >
                        <div className="flex flex-col">
                          <span className={cn("text-sm", isTodayColumn && "text-primary font-bold")}>
                            {formatDayName(day)}
                          </span>
                          <span className={cn("text-xs", isTodayColumn ? "text-primary/70 font-semibold" : "text-muted-foreground")}>
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
                {employees.map((employee, index) => {
                  const isCurrentUser = employee.id === currentUserId;
                  const hasOfficeWeek = officeWeekMap.has(`${employee.id}-${currentWeekNumber}-${currentYear}`);
                  
                  return (
                    <>
                      <tr 
                        key={employee.id} 
                        className={cn(
                          "border-b border-border last:border-0",
                          isCurrentUser && "bg-accent/10",
                          hasOfficeWeek && "border-2 border-green-500/40 bg-green-50 dark:bg-green-950/30 shadow-md"
                        )}
                      >
                        <td 
                          className="px-3 py-1.5"
                          onMouseEnter={() => setHoveredEmployeeId(employee.id)}
                          onMouseLeave={() => setHoveredEmployeeId(null)}
                        >
                          <div className="flex items-center gap-2 group">
                            {hasOfficeWeek && (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger>
                                    <Building2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Kontorsvecka</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            )}
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
                      const isTodayColumn = isToday(day);
                      return (
                        <td 
                          key={index} 
                          className={cn(
                            "p-1",
                            isTodayColumn && "bg-primary/10"
                          )}
                        >
                          <StatusCell
                            status={status}
                            onClick={() =>
                              handleCellClick(employee, dayKey, status, formatDayName(day))
                            }
                            isToday={isTodayColumn}
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
              const hasOfficeWeek = officeWeekMap.has(`${employee.id}-${currentWeekNumber}-${currentYear}`);
              
              return (
                <>
                  <div 
                    key={employee.id} 
                    className={cn(
                      "border-b border-border last:border-0 p-4",
                      isCurrentUser && "bg-accent/10",
                      hasOfficeWeek && "border-2 border-green-500/40 bg-green-50 dark:bg-green-950/30 shadow-md"
                    )}
                  >
                    <div className="mb-3 flex items-center gap-2">
                      {hasOfficeWeek && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger>
                              <Building2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Kontorsvecka</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                      <div className={cn(
                        "font-semibold flex-1 text-base",
                        isCurrentUser ? "text-accent" : "text-foreground"
                      )}>
                        {employee.name}
                        {isCurrentUser && <span className="ml-2 text-xs text-accent/70 font-normal">(Du)</span>}
                      </div>
                      {isCurrentUser && (
                        <>
                          <button
                            onClick={() => onEditEmployee(employee.id, employee.name)}
                            className="p-2 rounded hover:bg-muted transition-all min-h-[44px] min-w-[44px] flex items-center justify-center"
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
                              <DropdownMenuItem onClick={() => onCopyWeek(employee.id)} className="py-3">
                                <Copy className="h-4 w-4 mr-2" />
                                Kopiera vecka
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => onPasteWeek(employee.id)}
                                disabled={!hasCopiedWeek}
                                className="py-3"
                              >
                                <Clipboard className="h-4 w-4 mr-2" />
                                Klistra in vecka
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => onClearWeek(employee.id)}
                                className="text-destructive focus:text-destructive py-3"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Töm vecka
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </>
                      )}
                    </div>
                    
                    {/* Vertical list layout for better readability */}
                    <div className="space-y-2">
                    {weekDays.map((day, index) => {
                      const dayKey = getDayKey(day);
                      const status = employee.week[dayKey];
                      const isTodayColumn = isToday(day);
                      return (
                        <div 
                          key={index} 
                          className={cn(
                            "flex items-center gap-3 p-2 rounded-md",
                            isTodayColumn && "bg-primary/10"
                          )}
                        >
                          <div className="min-w-[90px] text-sm font-medium">
                            <span className={cn(isTodayColumn && "text-primary font-bold")}>
                              {formatDayName(day)}
                            </span>
                            <span className={cn("text-xs ml-1", isTodayColumn ? "text-primary/70 font-semibold" : "text-muted-foreground")}>
                              {formatDate(day)}
                            </span>
                          </div>
                          <div className="flex-1">
                            <StatusCell
                              status={status}
                              onClick={() =>
                                handleCellClick(employee, dayKey, status, formatDayName(day))
                              }
                              isToday={isTodayColumn}
                            />
                          </div>
                        </div>
                      );
                    })}
                    </div>
                  </div>
                  {isCurrentUser && index < employees.length - 1 && (
                    <div className="border-t-2 border-accent/30 my-2 mx-4"></div>
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
