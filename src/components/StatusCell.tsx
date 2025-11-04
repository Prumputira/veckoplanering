import { Building2, Home, Ban, MapPin } from 'lucide-react';
import { DayStatus, StatusType } from '@/types/schedule';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface StatusCellProps {
  status: DayStatus;
  onClick: () => void;
  isToday?: boolean;
}

const statusConfig = {
  unset: {
    icon: Building2,
    label: 'Välj Plats',
    bgClass: 'bg-muted/30 hover:bg-muted/50',
    iconClass: 'text-muted-foreground',
    borderClass: 'border-muted/50',
  },
  office: {
    icon: Building2,
    label: 'Kontor',
    bgClass: 'bg-status-office/25 hover:bg-status-office/35',
    iconClass: 'text-status-office',
    borderClass: 'border-status-office/40',
  },
  home: {
    icon: Home,
    label: 'Hemarbete',
    bgClass: 'bg-status-home/25 hover:bg-status-home/35',
    iconClass: 'text-status-home',
    borderClass: 'border-status-home/40',
  },
  site_visit: {
    icon: MapPin,
    label: 'Platsbesök',
    bgClass: 'bg-status-site-visit/25 hover:bg-status-site-visit/35',
    iconClass: 'text-status-site-visit',
    borderClass: 'border-status-site-visit/40',
  },
  absent: {
    icon: Ban,
    label: 'Frånvarande',
    bgClass: 'bg-status-absent/25 hover:bg-status-absent/35',
    iconClass: 'text-status-absent',
    borderClass: 'border-status-absent/40',
  },
};

const StatusCell = ({ status, onClick, isToday = false }: StatusCellProps) => {
  // If only one segment, display as before
  if (status.segments.length === 1) {
    const segment = status.segments[0];
    const config = statusConfig[segment.status];
    const Icon = config.icon;
    
    const tooltipContent = segment.reason || segment.period;

    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={onClick}
              className={cn(
                'w-full h-16 rounded-lg transition-all duration-200 cursor-pointer',
                'flex flex-col items-center justify-center gap-0.5',
                config.bgClass,
                'hover:shadow-md hover:scale-[1.03]',
                isToday ? 'border-2 border-primary/50 ring-2 ring-primary/20' : cn('border-2', config.borderClass)
              )}
            >
              <Icon className={cn('h-5 w-5', config.iconClass)} />
              <span className="text-[10px] font-medium text-foreground">{config.label}</span>
              {segment.office && segment.status === 'office' && (
                <span className="text-[9px] text-muted-foreground px-1 font-semibold">
                  {segment.office}
                </span>
              )}
              {segment.reason && segment.status === 'site_visit' && (
                <span className="text-[9px] text-muted-foreground px-1 font-semibold">
                  {segment.reason}
                </span>
              )}
              {segment.period && (
                <span className="text-[9px] text-muted-foreground px-1">
                  {segment.period}
                </span>
              )}
            </button>
          </TooltipTrigger>
          {tooltipContent && (
            <TooltipContent>
              <p>{tooltipContent}</p>
            </TooltipContent>
          )}
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Multiple segments - split the cell
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={onClick}
            className={cn(
              'w-full h-16 rounded-lg transition-all duration-200 cursor-pointer overflow-hidden',
              'flex',
              'hover:shadow-md hover:scale-[1.03]',
              isToday ? 'border-2 border-primary/50 ring-2 ring-primary/20' : 'border-2'
            )}
          >
            {status.segments.map((segment, idx) => {
              const config = statusConfig[segment.status];
              const Icon = config.icon;
              return (
                <div
                  key={idx}
                  className={cn(
                    'flex-1 flex flex-col items-center justify-center gap-0.5',
                    config.bgClass,
                    idx > 0 && 'border-l-2 border-border'
                  )}
                >
                  <Icon className={cn('h-4 w-4', config.iconClass)} />
                  {segment.office && segment.status === 'office' && (
                    <span className="text-[8px] text-muted-foreground font-semibold">
                      {segment.office}
                    </span>
                  )}
                  {segment.reason && segment.status === 'site_visit' && (
                    <span className="text-[8px] text-muted-foreground font-semibold">
                      {segment.reason}
                    </span>
                  )}
                  {segment.period && (
                    <span className="text-[8px] text-muted-foreground">
                      {segment.period}
                    </span>
                  )}
                </div>
              );
            })}
          </button>
        </TooltipTrigger>
        <TooltipContent>
          <div className="space-y-1">
            {status.segments.map((segment, idx) => {
              const config = statusConfig[segment.status];
              return (
                <div key={idx} className="text-xs">
                  <strong>{segment.period || config.label}:</strong> {config.label}
                  {segment.office && segment.status === 'office' && ` (${segment.office})`}
                  {segment.reason && ` - ${segment.reason}`}
                </div>
              );
            })}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default StatusCell;
