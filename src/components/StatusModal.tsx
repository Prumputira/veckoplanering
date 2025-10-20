import { useState } from 'react';
import { Building2, Home, Ban } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { StatusType, DayStatus } from '@/types/schedule';
import { cn } from '@/lib/utils';

interface StatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentStatus: DayStatus;
  employeeName: string;
  dayName: string;
  onSave: (status: DayStatus) => void;
}

const statusOptions = [
  {
    type: 'office' as StatusType,
    icon: Building2,
    label: 'Kontor',
    bgClass: 'bg-status-office/10 hover:bg-status-office/20 border-status-office/30',
    activeClass: 'bg-status-office/30 border-status-office',
  },
  {
    type: 'home' as StatusType,
    icon: Home,
    label: 'Hemarbete',
    bgClass: 'bg-status-home/10 hover:bg-status-home/20 border-status-home/30',
    activeClass: 'bg-status-home/30 border-status-home',
  },
  {
    type: 'absent' as StatusType,
    icon: Ban,
    label: 'Frånvarande',
    bgClass: 'bg-status-absent/10 hover:bg-status-absent/20 border-status-absent/30',
    activeClass: 'bg-status-absent/30 border-status-absent',
  },
];

const StatusModal = ({
  isOpen,
  onClose,
  currentStatus,
  employeeName,
  dayName,
  onSave,
}: StatusModalProps) => {
  const [selectedStatus, setSelectedStatus] = useState<StatusType>(currentStatus.status);
  const [reason, setReason] = useState(currentStatus.reason || '');

  const handleSave = () => {
    onSave({
      status: selectedStatus,
      reason: selectedStatus === 'absent' ? reason : undefined,
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] bg-card">
        <DialogHeader>
          <DialogTitle className="text-foreground">Ändra status</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {employeeName} • {dayName}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label className="text-foreground">Välj status</Label>
            <div className="grid grid-cols-3 gap-2">
              {statusOptions.map((option) => {
                const Icon = option.icon;
                const isActive = selectedStatus === option.type;
                return (
                  <button
                    key={option.type}
                    onClick={() => setSelectedStatus(option.type)}
                    className={cn(
                      'flex flex-col items-center justify-center gap-2 p-4 rounded-lg border-2 transition-all',
                      isActive ? option.activeClass : option.bgClass
                    )}
                  >
                    <Icon className="h-6 w-6" />
                    <span className="text-xs font-medium">{option.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
          {selectedStatus === 'absent' && (
            <div className="space-y-2">
              <Label htmlFor="reason" className="text-foreground">
                Orsak (valfritt)
              </Label>
              <Input
                id="reason"
                placeholder="T.ex. Semester, VAB, Vårdbesök..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="bg-background"
              />
            </div>
          )}
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Avbryt
          </Button>
          <Button onClick={handleSave}>Spara</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default StatusModal;
