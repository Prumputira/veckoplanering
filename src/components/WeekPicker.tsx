import { useState } from 'react';
import { CalendarIcon } from 'lucide-react';
import { format, startOfWeek } from 'date-fns';
import { sv } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { getWeekNumber } from '@/utils/dateUtils';

interface WeekPickerProps {
  currentDate: Date;
  onSelectWeek: (date: Date) => void;
}

const WeekPicker = ({ currentDate, onSelectWeek }: WeekPickerProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const weekNumber = getWeekNumber(currentDate);

  const handleSelect = (date: Date | undefined) => {
    if (date) {
      // Get the Monday of the selected week
      const weekStart = startOfWeek(date, { weekStartsOn: 1 });
      onSelectWeek(weekStart);
      setIsOpen(false);
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            'justify-start text-left font-normal gap-2',
            'hover:bg-accent transition-colors'
          )}
        >
          <CalendarIcon className="h-4 w-4" />
          <span>Vecka {weekNumber}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 bg-popover" align="start">
        <Calendar
          mode="single"
          selected={currentDate}
          onSelect={handleSelect}
          initialFocus
          locale={sv}
        />
      </PopoverContent>
    </Popover>
  );
};

export default WeekPicker;
