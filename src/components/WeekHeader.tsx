import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getWeekNumber, getWeekYear, formatDate, getWeekDays } from '@/utils/dateUtils';
import WeekPicker from './WeekPicker';
import logo from '@/assets/nordiska-brand-logo-primary.png';

interface WeekHeaderProps {
  currentDate: Date;
  onNavigate: (direction: 'prev' | 'next') => void;
  onSelectWeek: (date: Date) => void;
}

const WeekHeader = ({ currentDate, onNavigate, onSelectWeek }: WeekHeaderProps) => {
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
            </div>
          </div>
          <div className="flex gap-2 items-center">
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
