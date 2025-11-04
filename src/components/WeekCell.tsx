import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface Profile {
  id: string;
  name: string;
}

interface WeekCellProps {
  weekNumber: number;
  assignedUsers: Profile[];
  isClosed: boolean;
  isCurrentWeek: boolean;
  onClick: () => void;
}

export const WeekCell = ({ weekNumber, assignedUsers, isClosed, isCurrentWeek, onClick }: WeekCellProps) => {
  const getBackgroundColor = () => {
    if (isClosed) return 'bg-muted';
    if (assignedUsers.length >= 2) return 'bg-green-500';
    return 'bg-destructive';
  };

  const getTextColor = () => {
    if (isClosed) return 'text-muted-foreground';
    return 'text-white';
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={onClick}
            className={cn(
              "w-full aspect-square rounded-md transition-all hover:scale-105 hover:shadow-md",
              "flex items-center justify-center text-sm font-medium",
              getBackgroundColor(),
              getTextColor(),
              isCurrentWeek && "ring-2 ring-primary ring-offset-2"
            )}
          >
            {weekNumber}
          </button>
        </TooltipTrigger>
        <TooltipContent>
          <div className="text-sm">
            <div className="font-semibold mb-1">Vecka {weekNumber}</div>
            {isClosed ? (
              <div className="text-muted-foreground">Kontoret stängt</div>
            ) : assignedUsers.length > 0 ? (
              <div>
                {assignedUsers.map(user => (
                  <div key={user.id}>{user.name}</div>
                ))}
              </div>
            ) : (
              <div className="text-muted-foreground">Ingen tilldelad</div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
