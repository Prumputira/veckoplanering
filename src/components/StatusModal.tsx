import { useState } from 'react';
import { Building2, Home, Ban, Plus, Trash2 } from 'lucide-react';
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
import { StatusType, DayStatus, StatusSegment } from '@/types/schedule';
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
    type: 'unset' as StatusType,
    icon: Building2,
    label: 'Välj Plats',
    bgClass: 'bg-muted/30 hover:bg-muted/50 border-muted/50',
    activeClass: 'bg-muted/50 border-muted',
  },
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
  const [segments, setSegments] = useState<StatusSegment[]>(currentStatus.segments);

  const handleAddSegment = () => {
    setSegments([...segments, { status: 'unset', period: '' }]);
  };

  const handleRemoveSegment = (index: number) => {
    if (segments.length > 1) {
      setSegments(segments.filter((_, i) => i !== index));
    }
  };

  const handleUpdateSegment = (index: number, field: keyof StatusSegment, value: string) => {
    const newSegments = [...segments];
    newSegments[index] = { ...newSegments[index], [field]: value };
    setSegments(newSegments);
  };

  const handleSave = () => {
    onSave({ segments });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] bg-card max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-foreground">Ändra status</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {employeeName} • {dayName}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {segments.map((segment, index) => (
            <div key={index} className="space-y-3 p-3 border rounded-lg bg-background/50">
              <div className="flex items-center justify-between">
                <Label className="text-foreground text-sm font-semibold">
                  {segments.length > 1 ? `Del ${index + 1}` : 'Status'}
                </Label>
                {segments.length > 1 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveSegment(index)}
                    className="h-7 w-7 p-0"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
              
              <div className="space-y-2">
                <Label className="text-foreground text-xs">Välj status</Label>
                <div className="grid grid-cols-4 gap-2">
                  {statusOptions.map((option) => {
                    const Icon = option.icon;
                    const isActive = segment.status === option.type;
                    return (
                      <button
                        key={option.type}
                        onClick={() => handleUpdateSegment(index, 'status', option.type)}
                        className={cn(
                          'flex flex-col items-center justify-center gap-1 p-3 rounded-lg border-2 transition-all',
                          isActive ? option.activeClass : option.bgClass
                        )}
                      >
                        <Icon className="h-5 w-5" />
                        <span className="text-[10px] font-medium">{option.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {segments.length > 1 && (
                <div className="space-y-2">
                  <Label htmlFor={`period-${index}`} className="text-foreground text-xs">
                    Tidsperiod (t.ex. FM, EM, 08-12)
                  </Label>
                  <Input
                    id={`period-${index}`}
                    placeholder="FM"
                    value={segment.period || ''}
                    onChange={(e) => handleUpdateSegment(index, 'period', e.target.value)}
                    className="bg-background h-8 text-sm"
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor={`reason-${index}`} className="text-foreground text-xs">
                  Kommentar (valfritt)
                </Label>
                <Input
                  id={`reason-${index}`}
                  placeholder="T.ex. Semester, Kundmöte..."
                  value={segment.reason || ''}
                  onChange={(e) => handleUpdateSegment(index, 'reason', e.target.value)}
                  className="bg-background h-8 text-sm"
                />
              </div>
            </div>
          ))}
          
          <Button
            variant="outline"
            onClick={handleAddSegment}
            className="w-full"
            size="sm"
          >
            <Plus className="h-4 w-4 mr-2" />
            Lägg till del av dagen
          </Button>
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
