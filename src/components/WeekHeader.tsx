import { ChevronLeft, ChevronRight, Building2, Home, Ban } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getWeekNumber, getWeekYear, formatDate, getWeekDays } from '@/utils/dateUtils';
import WeekPicker from './WeekPicker';
import ScheduleChat from './ScheduleChat';
import logo from '@/assets/nordiska-brand-logo-primary.png';
import { Employee } from '@/types/schedule';

interface WeekHeaderProps {
  currentDate: Date;
  onNavigate: (direction: 'prev' | 'next') => void;
  onSelectWeek: (date: Date) => void;
  employees: Employee[];
  todayStats?: {
    office: number;
    home: number;
    absent: number;
  };
}

const WeekHeader = ({ currentDate, onNavigate, onSelectWeek, employees, todayStats }: WeekHeaderProps) => {
  const weekNumber = getWeekNumber(currentDate);
  const year = getWeekYear(currentDate);
  const weekDays = getWeekDays(currentDate);

  return (
    <div className="bg-gradient-to-r from-background to-background/95 border-b border-primary/10 sticky top-0 z-10 shadow-md backdrop-blur-sm">
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-4 gap-4">
          <div className="flex items-center gap-4">
            <img 
              src={logo} 
              alt="Nordiska Brand" 
              className="h-12 w-auto md:h-16 object-contain"
            />
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-primary font-display">
                Veckoplanering
              </h1>
              <p className="text-muted-foreground mt-1 text-sm md:text-base">
                Vecka {weekNumber}, {year} • {formatDate(weekDays[0])} - {formatDate(weekDays[4])}
              </p>
              {todayStats && (
                <div className="flex gap-4 mt-2 text-sm">
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Building2 className="h-4 w-4 text-blue-500" />
                    <span className="font-medium">{todayStats.office}</span>
                    <span className="hidden sm:inline">på kontoret</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Home className="h-4 w-4 text-green-500" />
                    <span className="font-medium">{todayStats.home}</span>
                    <span className="hidden sm:inline">hemma</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Ban className="h-4 w-4 text-orange-500" />
                    <span className="font-medium">{todayStats.absent}</span>
                    <span className="hidden sm:inline">frånvarande</span>
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="flex gap-2 items-center">
            <ScheduleChat 
              employees={employees}
              currentWeek={weekNumber}
              currentYear={year}
            />
            <WeekPicker currentDate={currentDate} onSelectWeek={onSelectWeek} />
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => onNavigate('prev')}
                className="hover:bg-accent hover:text-accent-foreground hover:border-accent transition-all duration-200"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => onNavigate('next')}
                className="hover:bg-accent hover:text-accent-foreground hover:border-accent transition-all duration-200"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WeekHeader;
