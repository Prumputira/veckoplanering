import { useEffect, useState } from 'react';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from '@/components/ui/carousel';
import WeekTable from '@/components/WeekTable';
import { Employee, DayStatus } from '@/types/schedule';
import { getWeekNumber, getWeekYear } from '@/utils/dateUtils';

interface WeekCarouselProps {
  prevWeekEmployees: Employee[];
  currentWeekEmployees: Employee[];
  nextWeekEmployees: Employee[];
  prevWeekDate: Date;
  currentDate: Date;
  nextWeekDate: Date;
  onNavigate: (direction: 'prev' | 'next') => void;
  onUpdateStatus: (employeeId: string, dayKey: string, status: DayStatus) => void;
  onEditEmployee: (employeeId: string, currentName: string) => void;
  onCopyWeek: (employeeId: string) => void;
  onPasteWeek: (employeeId: string) => void;
  onClearWeek: (employeeId: string) => void;
  hasCopiedWeek: boolean;
  currentUserId: string | null;
}

export function WeekCarousel({
  prevWeekEmployees,
  currentWeekEmployees,
  nextWeekEmployees,
  prevWeekDate,
  currentDate,
  nextWeekDate,
  onNavigate,
  onUpdateStatus,
  onEditEmployee,
  onCopyWeek,
  onPasteWeek,
  onClearWeek,
  hasCopiedWeek,
  currentUserId,
}: WeekCarouselProps) {
  const [api, setApi] = useState<CarouselApi>();
  const [currentIndex, setCurrentIndex] = useState(1);

  useEffect(() => {
    if (!api) return;

    api.on('select', () => {
      setCurrentIndex(api.selectedScrollSnap());
    });

    // Set initial position to middle (current week)
    api.scrollTo(1, true);
  }, [api]);

  useEffect(() => {
    if (!api) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        api.scrollPrev();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        api.scrollNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [api]);

  const handleScrollPrev = () => {
    if (currentIndex === 1) {
      onNavigate('prev');
    }
  };

  const handleScrollNext = () => {
    if (currentIndex === 1) {
      onNavigate('next');
    }
  };

  return (
    <div className="week-carousel-container relative">
      <Carousel
        setApi={setApi}
        opts={{
          loop: false,
          align: 'center',
          skipSnaps: false,
          dragFree: false,
          duration: 25,
          startIndex: 1,
        }}
        className="w-full"
      >
        <CarouselContent className="week-carousel-content">
          <CarouselItem 
            className="week-carousel-item" 
            data-position={currentIndex === 0 ? 'current' : currentIndex === 1 ? 'prev' : 'far-prev'}
          >
            <div className="w-full">
              <div className="text-center mb-4 opacity-60">
                <span className="text-sm font-medium">
                  Vecka {getWeekNumber(prevWeekDate)}, {getWeekYear(prevWeekDate)}
                </span>
              </div>
              <WeekTable
                currentDate={prevWeekDate}
                employees={prevWeekEmployees}
                onUpdateStatus={onUpdateStatus}
                onEditEmployee={onEditEmployee}
                onCopyWeek={onCopyWeek}
                onPasteWeek={onPasteWeek}
                onClearWeek={onClearWeek}
                hasCopiedWeek={hasCopiedWeek}
                currentUserId={currentUserId}
              />
            </div>
          </CarouselItem>

          <CarouselItem 
            className="week-carousel-item" 
            data-position={currentIndex === 1 ? 'current' : currentIndex === 0 ? 'next' : 'prev'}
          >
            <div className="w-full">
              <WeekTable
                currentDate={currentDate}
                employees={currentWeekEmployees}
                onUpdateStatus={onUpdateStatus}
                onEditEmployee={onEditEmployee}
                onCopyWeek={onCopyWeek}
                onPasteWeek={onPasteWeek}
                onClearWeek={onClearWeek}
                hasCopiedWeek={hasCopiedWeek}
                currentUserId={currentUserId}
              />
            </div>
          </CarouselItem>

          <CarouselItem 
            className="week-carousel-item" 
            data-position={currentIndex === 2 ? 'current' : currentIndex === 1 ? 'next' : 'far-next'}
          >
            <div className="w-full">
              <div className="text-center mb-4 opacity-60">
                <span className="text-sm font-medium">
                  Vecka {getWeekNumber(nextWeekDate)}, {getWeekYear(nextWeekDate)}
                </span>
              </div>
              <WeekTable
                currentDate={nextWeekDate}
                employees={nextWeekEmployees}
                onUpdateStatus={onUpdateStatus}
                onEditEmployee={onEditEmployee}
                onCopyWeek={onCopyWeek}
                onPasteWeek={onPasteWeek}
                onClearWeek={onClearWeek}
                hasCopiedWeek={hasCopiedWeek}
                currentUserId={currentUserId}
              />
            </div>
          </CarouselItem>
        </CarouselContent>

        <CarouselPrevious 
          onClick={handleScrollPrev}
          className="left-4 z-20 bg-background/80 backdrop-blur-sm hover:bg-background"
        />
        <CarouselNext 
          onClick={handleScrollNext}
          className="right-4 z-20 bg-background/80 backdrop-blur-sm hover:bg-background"
        />
      </Carousel>
    </div>
  );
}
