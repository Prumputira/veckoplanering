import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getWeekNumber, getWeekYear, formatDate, getWeekDays } from '@/utils/dateUtils';
import WeekPicker from './WeekPicker';

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
    <div className="bg-card border-b border-border sticky top-0 z-10 shadow-sm">
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Veckoplanering – Nordiska Brand</h1>
            <p className="text-muted-foreground mt-1">
              Vecka {weekNumber}, {year} • {formatDate(weekDays[0])} - {formatDate(weekDays[4])}
            </p>
          </div>
          <div className="flex gap-2 items-center">
            <WeekPicker currentDate={currentDate} onSelectWeek={onSelectWeek} />
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => onNavigate('prev')}
                className="hover:bg-accent transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => onNavigate('next')}
                className="hover:bg-accent transition-colors"
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
