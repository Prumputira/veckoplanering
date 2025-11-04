import { ChevronLeft, ChevronRight, Building2, Home, Ban, Settings, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getWeekNumber, getWeekYear, formatDate, getWeekDays } from '@/utils/dateUtils';
import WeekPicker from './WeekPicker';
import ScheduleChat from './ScheduleChat';
import logo from '@/assets/nordiska-brand-logo-primary.png';
import { Employee } from '@/types/schedule';
import { HoverCard, HoverCardTrigger, HoverCardContent } from '@/components/ui/hover-card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface PersonInfo {
  name: string;
  period?: string;
  reason?: string;
}

interface WeekHeaderProps {
  currentDate: Date;
  onNavigate: (direction: 'prev' | 'next') => void;
  onSelectWeek: (date: Date) => void;
  employees: Employee[];
  officeResponsible?: string[];
  todayStats?: {
    office: number;
    home: number;
    absent: number;
    officeByLocation?: { [office: string]: PersonInfo[] };
    homeNames?: PersonInfo[];
    absentNames?: PersonInfo[];
  };
  onNavigateSettings: () => void;
  onLogout: () => void;
}

const WeekHeader = ({ currentDate, onNavigate, onSelectWeek, employees, officeResponsible, todayStats, onNavigateSettings, onLogout }: WeekHeaderProps) => {
  const weekNumber = getWeekNumber(currentDate);
  const year = getWeekYear(currentDate);
  const weekDays = getWeekDays(currentDate);

  return (
    <TooltipProvider>
      <div className="bg-gradient-to-r from-background to-background/95 border-b border-primary/10 sticky top-0 z-10 shadow-md backdrop-blur-sm">
        <div className="container mx-auto px-2 sm:px-4 py-2 sm:py-3">
        {/* Mobile: Two-level header */}
        <div className="md:hidden space-y-2">
          {/* First row: Logo */}
          <div className="flex items-center justify-center">
            <img 
              src={logo} 
              alt="Nordiska Brand" 
              className="h-10 xs:h-12 w-auto object-contain"
            />
          </div>

          {/* Second row: Title + Week info */}
          <div className="text-center">
            <h1 className="text-base font-bold text-primary font-display">
              Veckoplanering
            </h1>
            {officeResponsible && officeResponsible.length > 0 && (
              <p className="text-xs font-medium text-foreground mt-1">
                Kontorsansvariga vecka {weekNumber}: <span className="text-primary">{officeResponsible.join(', ')}</span>
              </p>
            )}
          </div>

          {/* Third row: Week navigation */}
          <div className="flex items-center justify-center gap-1.5">
            <Button
              variant="outline"
              size="icon"
              onClick={() => onNavigate('prev')}
              className="h-8 w-8 hover:bg-accent hover:text-accent-foreground hover:border-accent"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <WeekPicker currentDate={currentDate} onSelectWeek={onSelectWeek} />
            <Button
              variant="outline"
              size="icon"
              onClick={() => onNavigate('next')}
              className="h-8 w-8 hover:bg-accent hover:text-accent-foreground hover:border-accent"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Fourth row: Stats + Actions */}
          <div className="flex items-center justify-between gap-2">
            {todayStats && (
              <div className="flex gap-2 text-xs">
                <HoverCard>
                  <HoverCardTrigger asChild>
                    <div className="flex items-center gap-1 text-muted-foreground cursor-pointer hover:text-foreground transition-colors">
                      <Building2 className="h-3.5 w-3.5 text-blue-500" />
                      <span className="font-medium">{todayStats.office}</span>
                    </div>
                  </HoverCardTrigger>
                  <HoverCardContent className="w-72">
                    <div className="space-y-2.5">
                      <h4 className="font-semibold text-xs">På kontoret idag</h4>
                      {todayStats.officeByLocation && Object.entries(todayStats.officeByLocation)
                        .sort(([a], [b]) => a.localeCompare(b))
                        .map(([office, persons]) => (
                          <div key={office} className="space-y-1.5">
                            <span className="font-medium text-xs text-blue-600">{office}</span>
                            <div className="flex flex-wrap gap-1.5">
                              {persons.map((person, i) => (
                                <span key={i} className="px-2 py-0.5 bg-primary/10 text-foreground text-xs rounded-md border border-primary/20">
                                  <span className="font-medium">{person.name}</span>
                                  {person.period && (
                                    <span className="text-[10px] text-muted-foreground ml-1">({person.period})</span>
                                  )}
                                </span>
                              ))}
                            </div>
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
                  <HoverCardContent className="w-72">
                    <div className="space-y-2">
                      <h4 className="font-semibold text-xs">Hemma idag</h4>
                      {todayStats.homeNames && todayStats.homeNames.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {todayStats.homeNames.map((person, i) => (
                            <span key={i} className="px-2 py-0.5 bg-primary/10 text-foreground text-xs rounded-md border border-primary/20">
                              <span className="font-medium">{person.name}</span>
                              {person.period && (
                                <span className="text-[10px] text-muted-foreground ml-1">({person.period})</span>
                              )}
                            </span>
                          ))}
                        </div>
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
                  <HoverCardContent className="w-72">
                    <div className="space-y-2">
                      <h4 className="font-semibold text-xs">Frånvarande idag</h4>
                      {todayStats.absentNames && todayStats.absentNames.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {todayStats.absentNames.map((person, i) => (
                            <span key={i} className="px-2 py-0.5 bg-primary/10 text-foreground text-xs rounded-md border border-primary/20">
                              <span className="font-medium">{person.name}</span>
                              {person.period && (
                                <span className="text-[10px] text-muted-foreground ml-1">({person.period})</span>
                              )}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground">Ingen frånvarande idag</p>
                      )}
                    </div>
                  </HoverCardContent>
                </HoverCard>
              </div>
            )}
            <div className="flex items-center gap-1.5">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={onNavigateSettings}
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                  >
                    <Settings className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Inställningar</p>
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={onLogout}
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                  >
                    <LogOut className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Logga ut</p>
                </TooltipContent>
              </Tooltip>
              <ScheduleChat 
                employees={employees}
                currentWeek={weekNumber}
                currentYear={year}
              />
            </div>
          </div>
        </div>

        {/* Desktop: Single row layout */}
        <div className="hidden md:grid md:grid-cols-3 gap-3 items-center">
          {/* Left column: logo and stats */}
          <div className="flex flex-col items-start justify-center">
            <img 
              src={logo} 
              alt="Nordiska Brand" 
              className="h-14 w-auto object-contain mb-2"
            />
            
            {todayStats && (
              <div className="flex gap-3 text-sm">
                <HoverCard>
                  <HoverCardTrigger asChild>
                    <div className="flex items-center gap-1.5 text-muted-foreground cursor-pointer hover:text-foreground transition-colors">
                      <Building2 className="h-4 w-4 text-blue-500" />
                      <span className="font-medium">{todayStats.office}</span>
                      <span>på kontoret</span>
                    </div>
                  </HoverCardTrigger>
                  <HoverCardContent className="w-96">
                    <div className="space-y-3">
                      <h4 className="font-semibold text-sm">På kontoret idag</h4>
                      {todayStats.officeByLocation && Object.entries(todayStats.officeByLocation)
                        .sort(([a], [b]) => a.localeCompare(b))
                        .map(([office, persons]) => (
                          <div key={office} className="space-y-2">
                            <span className="font-medium text-sm text-blue-600">{office}</span>
                            <div className="flex flex-wrap gap-2">
                              {persons.map((person, i) => (
                                <span key={i} className="px-2.5 py-1 bg-primary/10 text-foreground text-sm rounded-md border border-primary/20">
                                  <span className="font-medium">{person.name}</span>
                                  {person.period && (
                                    <span className="text-xs text-muted-foreground ml-1.5">({person.period})</span>
                                  )}
                                </span>
                              ))}
                            </div>
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
                  <HoverCardContent className="w-96">
                    <div className="space-y-2.5">
                      <h4 className="font-semibold text-sm">Hemma idag</h4>
                      {todayStats.homeNames && todayStats.homeNames.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {todayStats.homeNames.map((person, i) => (
                            <span key={i} className="px-2.5 py-1 bg-primary/10 text-foreground text-sm rounded-md border border-primary/20">
                              <span className="font-medium">{person.name}</span>
                              {person.period && (
                                <span className="text-xs text-muted-foreground ml-1.5">({person.period})</span>
                              )}
                            </span>
                          ))}
                        </div>
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
                  <HoverCardContent className="w-96">
                    <div className="space-y-2.5">
                      <h4 className="font-semibold text-sm">Frånvarande idag</h4>
                      {todayStats.absentNames && todayStats.absentNames.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {todayStats.absentNames.map((person, i) => (
                            <span key={i} className="px-2.5 py-1 bg-primary/10 text-foreground text-sm rounded-md border border-primary/20">
                              <span className="font-medium">{person.name}</span>
                              {person.period && (
                                <span className="text-xs text-muted-foreground ml-1.5">({person.period})</span>
                              )}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">Ingen frånvarande idag</p>
                      )}
                    </div>
                  </HoverCardContent>
                </HoverCard>
              </div>
            )}
          </div>
          
          {/* Center: Title and week navigation */}
          <div className="flex flex-col items-center justify-center gap-2">
            <h1 className="text-xl font-bold text-primary font-display">
              Veckoplanering
            </h1>
            <div className="flex gap-1.5 items-center">
              <Button
                variant="outline"
                size="icon"
                onClick={() => onNavigate('prev')}
                className="hover:bg-accent hover:text-accent-foreground hover:border-accent transition-all duration-200"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <WeekPicker currentDate={currentDate} onSelectWeek={onSelectWeek} />
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
          
          {/* Right column: actions and office responsible */}
          <div className="flex flex-col items-end justify-center gap-2">
            <div className="flex items-center gap-1.5">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={onNavigateSettings}
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9"
                  >
                    <Settings className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Inställningar</p>
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={onLogout}
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9"
                  >
                    <LogOut className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Logga ut</p>
                </TooltipContent>
              </Tooltip>
              <ScheduleChat 
                employees={employees}
                currentWeek={weekNumber}
                currentYear={year}
              />
            </div>
            {officeResponsible && officeResponsible.length > 0 && (
              <div className="text-right">
                <p className="text-sm font-medium text-foreground">
                  Kontorsansvariga vecka {weekNumber}:
                </p>
                <p className="text-sm font-medium text-primary mt-0.5">
                  {officeResponsible.join(', ')}
                </p>
              </div>
            )}
          </div>
        </div>
        </div>
      </div>
    </TooltipProvider>
  );
};

export default WeekHeader;
