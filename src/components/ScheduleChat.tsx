import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MessageSquare, Send, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Employee } from '@/types/schedule';

interface ScheduleChatProps {
  employees: Employee[];
  currentWeek: number;
  currentYear: number;
}

const ScheduleChat = ({ employees, currentWeek, currentYear }: ScheduleChatProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSendMessage = async () => {
    if (!message.trim() || isLoading) return;

    const userMessage = message.trim();
    setMessage('');
    setChatHistory(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('schedule-chat', {
        body: {
          message: userMessage,
          scheduleData: {
            week: currentWeek,
            year: currentYear,
            employees: employees.map(emp => ({
              name: emp.name,
              week: emp.week
            }))
          }
        }
      });

      if (error) throw error;

      setChatHistory(prev => [...prev, { role: 'assistant', content: data.reply }]);
    } catch (error) {
      console.error('Chat error:', error);
      toast({
        title: "Hoppsan!",
        description: "AI:n verkar ha gått på lunch... Försök igen!",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative">
      {!isOpen ? (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2 hover:bg-accent"
        >
          <MessageSquare className="h-4 w-4" />
          <span className="hidden md:inline">Fråga AI</span>
        </Button>
      ) : (
        <div className="absolute right-0 top-0 z-50 w-80 bg-background border border-border rounded-lg shadow-lg">
          <div className="flex items-center justify-between p-3 border-b border-border">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-primary" />
              <span className="font-medium text-sm">Schema Assistent</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(false)}
              className="h-6 w-6 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="h-64 overflow-y-auto p-3 space-y-2">
            {chatHistory.length === 0 && (
              <p className="text-sm text-muted-foreground italic">
                Ställ dina frågor om schemat här
              </p>
            )}
            {chatHistory.map((msg, idx) => (
              <div
                key={idx}
                className={`p-2 rounded text-sm ${
                  msg.role === 'user'
                    ? 'bg-primary text-primary-foreground ml-8'
                    : 'bg-muted mr-8'
                }`}
              >
                {msg.content}
              </div>
            ))}
            {isLoading && (
              <div className="bg-muted p-2 rounded text-sm mr-8 animate-pulse">
                Analyserar...
              </div>
            )}
          </div>

          <div className="p-3 border-t border-border flex gap-2">
            <Input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Skriv din fråga..."
              className="text-sm"
              disabled={isLoading}
            />
            <Button
              size="sm"
              onClick={handleSendMessage}
              disabled={isLoading || !message.trim()}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ScheduleChat;
