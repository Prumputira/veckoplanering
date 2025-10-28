import { ChevronLeft, ChevronRight, Building2, Home, Ban } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getWeekNumber, getWeekYear, formatDate, getWeekDays } from '@/utils/dateUtils';
import WeekPicker from './WeekPicker';
import ScheduleChat from './ScheduleChat';
import logo from '@/assets/nordiska-brand-logo-primary.png';
import { Employee } from '@/types/schedule';
import { HoverCard, HoverCardTrigger, HoverCardContent } from '@/components/ui/hover-card';

interface WeekHeaderProps {
  currentDate: Date;
  onNavigate: (direction: 'prev' | 'next') => void;
  onSelectWeek: (date: Date) => void;
  employees: Employee[];
  todayStats?: {
    office: number;
    home: number;
    absent: number;
    officeByLocation?: { [office: string]: string[] };
    homeNames?: string[];
    absentNames?: string[];
  };
}

const WeekHeader = ({ currentDate, onNavigate, onSelectWeek, employees, todayStats }: WeekHeaderProps) => {
  const weekNumber = getWeekNumber(currentDate);
  const year = getWeekYear(currentDate);
  const weekDays = getWeekDays(currentDate);

  return (
    <div className="bg-gradient-to-r from-background to-background/95 border-b border-primary/10 sticky top-0 z-10 shadow-md backdrop-blur-sm">
      <div className="container mx-auto px-2 sm:px-4 py-3 sm:py-4 md:py-4">
        {/* Mobile: Two-level header */}
        <div className="md:hidden space-y-3">
          {/* First row: Logo + Navigation */}
          <div className="flex items-center justify-between">
            <img 
              src={logo} 
              alt="Nordiska Brand" 
              className="h-8 xs:h-10 w-auto object-contain"
            />
            <div className="flex gap-1.5">
              <Button
                variant="outline"
                size="icon"
                onClick={() => onNavigate('prev')}
                className="h-9 w-9 hover:bg-accent hover:text-accent-foreground hover:border-accent"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => onNavigate('next')}
                className="h-9 w-9 hover:bg-accent hover:text-accent-foreground hover:border-accent"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Second row: Title + Week info */}
          <div>
            <h1 className="text-lg font-bold text-primary font-display">
              Veckoplanering
            </h1>
            <p className="text-muted-foreground text-xs">
              V{weekNumber}, {year} • {formatDate(weekDays[0])} - {formatDate(weekDays[4])}
            </p>
          </div>

          {/* Third row: Stats + Actions */}
          <div className="flex items-center justify-between gap-2">
            {todayStats && (
              <div className="flex gap-3 text-xs">
                <HoverCard>
                  <HoverCardTrigger asChild>
                    <div className="flex items-center gap-1 text-muted-foreground cursor-pointer hover:text-foreground transition-colors">
                      <Building2 className="h-3.5 w-3.5 text-blue-500" />
                      <span className="font-medium">{todayStats.office}</span>
                    </div>
                  </HoverCardTrigger>
                  <HoverCardContent className="w-64">
                    <div className="space-y-1.5">
                      <h4 className="font-semibold text-xs">På kontoret idag</h4>
                      {todayStats.officeByLocation && Object.entries(todayStats.officeByLocation)
                        .sort(([a], [b]) => a.localeCompare(b))
                        .map(([office, names]) => (
                          <div key={office} className="text-xs">
                            <span className="font-medium text-blue-600">{office}:</span>{' '}
                            <span className="text-muted-foreground">{names.join(', ')}</span>
                          </div>
                        ))}
                      {(!todayStats.officeByLocation || Object.keys(todayStats.officeByLocation).length === 0) && (
                        <p className="text-xs text-muted-foreground">Ingen på kontoret idag</p>
                      )}
                    </div>
                  </HoverCardContent>
                </HoverCard>
                
                <HoverCard>
                  <HoverCardTrigger asChild>
                    <div className="flex items-center gap-1 text-muted-foreground cursor-pointer hover:text-foreground transition-colors">
                      <Home className="h-3.5 w-3.5 text-green-500" />
                      <span className="font-medium">{todayStats.home}</span>
                    </div>
                  </HoverCardTrigger>
                  <HoverCardContent className="w-64">
                    <div className="space-y-1.5">
                      <h4 className="font-semibold text-xs">Hemma idag</h4>
                      {todayStats.homeNames && todayStats.homeNames.length > 0 ? (
                        <p className="text-xs text-muted-foreground">{todayStats.homeNames.join(', ')}</p>
                      ) : (
                        <p className="text-xs text-muted-foreground">Ingen hemma idag</p>
                      )}
                    </div>
                  </HoverCardContent>
                </HoverCard>
                
                <HoverCard>
                  <HoverCardTrigger asChild>
                    <div className="flex items-center gap-1 text-muted-foreground cursor-pointer hover:text-foreground transition-colors">
                      <Ban className="h-3.5 w-3.5 text-orange-500" />
                      <span className="font-medium">{todayStats.absent}</span>
                    </div>
                  </HoverCardTrigger>
                  <HoverCardContent className="w-64">
                    <div className="space-y-1.5">
                      <h4 className="font-semibold text-xs">Frånvarande idag</h4>
                      {todayStats.absentNames && todayStats.absentNames.length > 0 ? (
                        <p className="text-xs text-muted-foreground">{todayStats.absentNames.join(', ')}</p>
                      ) : (
                        <p className="text-xs text-muted-foreground">Ingen frånvarande idag</p>
                      )}
                    </div>
                  </HoverCardContent>
                </HoverCard>
              </div>
            )}
            <div className="flex gap-1.5">
              <ScheduleChat 
                employees={employees}
                currentWeek={weekNumber}
                currentYear={year}
              />
              <WeekPicker currentDate={currentDate} onSelectWeek={onSelectWeek} />
            </div>
          </div>
        </div>

        {/* Desktop: Single row layout */}
        <div className="hidden md:flex items-center justify-between gap-4">
          {/* Left column: logo, week info, stats */}
          <div className="flex flex-col items-start gap-1.5">
            <img 
              src={logo} 
              alt="Nordiska Brand" 
              className="h-10 md:h-12 w-auto object-contain"
            />
            
            <p className="text-muted-foreground text-sm md:text-base">
              Vecka {weekNumber}, {year} • {formatDate(weekDays[0])} - {formatDate(weekDays[4])}
            </p>
            
            {todayStats && (
              <div className="flex gap-4 text-sm">
                <HoverCard>
                  <HoverCardTrigger asChild>
                    <div className="flex items-center gap-1.5 text-muted-foreground cursor-pointer hover:text-foreground transition-colors">
                      <Building2 className="h-4 w-4 text-blue-500" />
                      <span className="font-medium">{todayStats.office}</span>
                      <span>på kontoret</span>
                    </div>
                  </HoverCardTrigger>
                  <HoverCardContent className="w-80">
                    <div className="space-y-2">
                      <h4 className="font-semibold text-sm">På kontoret idag</h4>
                      {todayStats.officeByLocation && Object.entries(todayStats.officeByLocation)
                        .sort(([a], [b]) => a.localeCompare(b))
                        .map(([office, names]) => (
                          <div key={office} className="text-sm">
                            <span className="font-medium text-blue-600">{office}:</span>{' '}
                            <span className="text-muted-foreground">{names.join(', ')}</span>
                          </div>
                        ))}
                      {(!todayStats.officeByLocation || Object.keys(todayStats.officeByLocation).length === 0) && (
                        <p className="text-sm text-muted-foreground">Ingen på kontoret idag</p>
                      )}
                    </div>
                  </HoverCardContent>
                </HoverCard>
                
                <HoverCard>
                  <HoverCardTrigger asChild>
                    <div className="flex items-center gap-1.5 text-muted-foreground cursor-pointer hover:text-foreground transition-colors">
                      <Home className="h-4 w-4 text-green-500" />
                      <span className="font-medium">{todayStats.home}</span>
                      <span>hemma</span>
                    </div>
                  </HoverCardTrigger>
                  <HoverCardContent className="w-80">
                    <div className="space-y-2">
                      <h4 className="font-semibold text-sm">Hemma idag</h4>
                      {todayStats.homeNames && todayStats.homeNames.length > 0 ? (
                        <p className="text-sm text-muted-foreground">{todayStats.homeNames.join(', ')}</p>
                      ) : (
                        <p className="text-sm text-muted-foreground">Ingen hemma idag</p>
                      )}
                    </div>
                  </HoverCardContent>
                </HoverCard>
                
                <HoverCard>
                  <HoverCardTrigger asChild>
                    <div className="flex items-center gap-1.5 text-muted-foreground cursor-pointer hover:text-foreground transition-colors">
                      <Ban className="h-4 w-4 text-orange-500" />
                      <span className="font-medium">{todayStats.absent}</span>
                      <span>frånvarande</span>
                    </div>
                  </HoverCardTrigger>
                  <HoverCardContent className="w-80">
                    <div className="space-y-2">
                      <h4 className="font-semibold text-sm">Frånvarande idag</h4>
                      {todayStats.absentNames && todayStats.absentNames.length > 0 ? (
                        <p className="text-sm text-muted-foreground">{todayStats.absentNames.join(', ')}</p>
                      ) : (
                        <p className="text-sm text-muted-foreground">Ingen frånvarande idag</p>
                      )}
                    </div>
                  </HoverCardContent>
                </HoverCard>
              </div>
            )}
          </div>
          
          {/* Center: Title */}
          <h1 className="text-2xl md:text-3xl font-bold text-primary font-display">
            Veckoplanering
          </h1>
          
          {/* Right column: actions */}
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
