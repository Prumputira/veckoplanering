import { useEffect, useRef, useState } from 'react';
import confetti from 'canvas-confetti';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useOfficeWeeks } from '@/hooks/use-office-weeks';
import { getWeekNumber, getWeekYear } from '@/utils/dateUtils';

interface OfficeWeekReminderProps {
  userId: string | null;
}

export const OfficeWeekReminder = ({ userId }: OfficeWeekReminderProps) => {
  const [showReminder, setShowReminder] = useState(false);
  const { getOfficeWeeksForUser } = useOfficeWeeks();
  const hasCheckedRef = useRef(false);

  useEffect(() => {
    const checkOfficeWeek = async () => {
      if (!userId || hasCheckedRef.current) return;
      hasCheckedRef.current = true;

      const currentDate = new Date();
      const currentWeek = getWeekNumber(currentDate);
      const currentYear = getWeekYear(currentDate);

      try {
        const officeWeeks = await getOfficeWeeksForUser(userId, currentYear);
        const hasOfficeWeek = officeWeeks.some(
          (week) => week.week_number === currentWeek
        );

        if (hasOfficeWeek) {
          setShowReminder(true);
          // Trigger confetti
          fireConfetti();
        }
      } catch (error) {
        console.error('Error checking office week:', error);
      }
    };

    checkOfficeWeek();
  }, [userId, getOfficeWeeksForUser]);

  const fireConfetti = () => {
    const duration = 3000;
    const animationEnd = Date.now() + duration;

    const randomInRange = (min: number, max: number) => {
      return Math.random() * (max - min) + min;
    };

    const interval = setInterval(() => {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      confetti({
        particleCount: 3,
        angle: randomInRange(55, 125),
        spread: randomInRange(50, 70),
        origin: { x: randomInRange(0.1, 0.9), y: Math.random() - 0.2 },
        colors: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8'],
      });
    }, 50);
  };

  const handleClose = () => {
    setShowReminder(false);
  };

  return (
    <Dialog open={showReminder} onOpenChange={setShowReminder}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl text-center">
            🎉 Grattis! 🎉
          </DialogTitle>
          <DialogDescription className="text-center space-y-4 pt-4">
            <p className="text-lg font-medium">
              Du har vunnit veckans kontorsvecka!
            </p>
            <p className="text-muted-foreground">
              Ja, du hörde rätt. Just DU får äran att ha kontorsvecka denna veckan. 
              Lycka till! ☕️
            </p>
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-center pt-4">
          <Button onClick={handleClose} className="w-full sm:w-auto">
            Tack, jag känner mig speciell nu 🙄
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
