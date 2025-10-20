import { Building2, Home, Ban } from 'lucide-react';
import { DayStatus, StatusType } from '@/types/schedule';
import { cn } from '@/lib/utils';

interface StatusCellProps {
  status: DayStatus;
  onClick: () => void;
}

const statusConfig = {
  office: {
    icon: Building2,
    label: 'Kontor',
    bgClass: 'bg-status-office/10 hover:bg-status-office/20',
    iconClass: 'text-status-office',
    borderClass: 'border-status-office/30',
  },
  home: {
    icon: Home,
    label: 'Hemarbete',
    bgClass: 'bg-status-home/10 hover:bg-status-home/20',
    iconClass: 'text-status-home',
    borderClass: 'border-status-home/30',
  },
  absent: {
    icon: Ban,
    label: 'Frånvarande',
    bgClass: 'bg-status-absent/10 hover:bg-status-absent/20',
    iconClass: 'text-status-absent',
    borderClass: 'border-status-absent/30',
  },
};

const StatusCell = ({ status, onClick }: StatusCellProps) => {
  const config = statusConfig[status.status];
  const Icon = config.icon;

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full h-24 rounded-lg border-2 transition-all duration-200 cursor-pointer',
        'flex flex-col items-center justify-center gap-1',
        config.bgClass,
        config.borderClass,
        'hover:shadow-md hover:scale-105'
      )}
    >
      <Icon className={cn('h-6 w-6', config.iconClass)} />
      <span className="text-xs font-medium text-foreground">{config.label}</span>
      {status.reason && (
        <span className="text-xs text-muted-foreground px-2 truncate max-w-full">
          {status.reason}
        </span>
      )}
    </button>
  );
};

export default StatusCell;
