import { useState, useEffect } from 'react';
import { Building2, Home, Ban, Plus, Trash2, ChevronUp, ChevronDown } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
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
    activeClass: 'bg-muted/60 border-muted shadow-md',
  },
  {
    type: 'office' as StatusType,
    icon: Building2,
    label: 'Kontor',
    bgClass: 'bg-status-office/20 hover:bg-status-office/30 border-status-office/40',
    activeClass: 'bg-status-office/40 border-status-office shadow-md',
  },
  {
    type: 'home' as StatusType,
    icon: Home,
    label: 'Hemarbete',
    bgClass: 'bg-status-home/20 hover:bg-status-home/30 border-status-home/40',
    activeClass: 'bg-status-home/40 border-status-home shadow-md',
  },
  {
    type: 'absent' as StatusType,
    icon: Ban,
    label: 'Frånvarande',
    bgClass: 'bg-status-absent/20 hover:bg-status-absent/30 border-status-absent/40',
    activeClass: 'bg-status-absent/40 border-status-absent shadow-md',
  },
];

const offices = ['Solna', 'Sundsvall', 'Enköping', 'Nyköping'];

const StatusModal = ({
  isOpen,
  onClose,
  currentStatus,
  employeeName,
  dayName,
  onSave,
}: StatusModalProps) => {
  const [segments, setSegments] = useState<StatusSegment[]>(currentStatus.segments);
  const [defaultOffice, setDefaultOffice] = useState<string>('');

  // Load default office from profile
  useEffect(() => {
    const loadDefaultOffice = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('default_office')
        .eq('id', session.user.id)
        .single();

      if (profile?.default_office) {
        setDefaultOffice(profile.default_office);
      }
    };
    loadDefaultOffice();
  }, []);

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
    
    // Auto-select default office when switching to office status
    if (field === 'status' && value === 'office' && defaultOffice && !newSegments[index].office) {
      newSegments[index].office = defaultOffice;
    }
    
    setSegments(newSegments);
  };

  const handleMoveSegment = (index: number, direction: 'up' | 'down') => {
    const newSegments = [...segments];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    [newSegments[index], newSegments[newIndex]] = [newSegments[newIndex], newSegments[index]];
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
          <DialogTitle className="text-primary font-display text-xl">Ändra status</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {employeeName} • {dayName}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {segments.map((segment, index) => (
            <div key={index} className="space-y-3 p-3 border-2 border-primary/10 rounded-lg bg-gradient-to-br from-muted/40 to-muted/20 shadow-sm">
              <div className="flex items-center justify-between">
                <Label className="text-primary text-sm font-semibold font-display">
                  {segments.length > 1 ? `Del ${index + 1}` : 'Status'}
                </Label>
                {segments.length > 1 && (
                  <div className="flex gap-1">
                    {index > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleMoveSegment(index, 'up')}
                        className="h-7 w-7 p-0"
                      >
                        <ChevronUp className="h-4 w-4" />
                      </Button>
                    )}
                    {index < segments.length - 1 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleMoveSegment(index, 'down')}
                        className="h-7 w-7 p-0"
                      >
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveSegment(index)}
                      className="h-7 w-7 p-0"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
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
                          'flex flex-col items-center justify-center gap-1 p-3 rounded-lg border-2 transition-all duration-200 hover:scale-[1.02]',
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

              {segment.status === 'office' && (
                <div className="space-y-2">
                  <Label className="text-foreground text-xs">Välj kontor</Label>
                  <RadioGroup
                    value={segment.office || ''}
                    onValueChange={(value) => handleUpdateSegment(index, 'office', value)}
                  >
                    <div className="grid grid-cols-2 gap-2">
                      {offices.map((office) => (
                        <div key={office} className="flex items-center space-x-2">
                          <RadioGroupItem value={office} id={`${office}-${index}`} />
                          <Label
                            htmlFor={`${office}-${index}`}
                            className="text-sm cursor-pointer"
                          >
                            {office}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </RadioGroup>
                  <p className="text-xs text-muted-foreground mt-1.5 italic">
                    💡 Du kan ange standardkontor i inställningarna
                  </p>
                </div>
              )}

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
          <Button 
            onClick={handleSave}
            className="bg-accent hover:bg-accent/90 text-accent-foreground transition-all duration-200"
          >
            Spara
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default StatusModal;
