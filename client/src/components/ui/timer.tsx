import { Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface TimerProps {
  timeRemaining: number; // in seconds
  className?: string;
}

export default function Timer({ timeRemaining, className = "" }: TimerProps) {
  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;
  
  const formatTime = `${minutes}:${seconds.toString().padStart(2, '0')}`;
  
  // Change color based on time remaining
  const getTimerVariant = () => {
    if (timeRemaining > 300) return "default"; // More than 5 minutes - normal
    if (timeRemaining > 60) return "secondary"; // 1-5 minutes - warning
    return "destructive"; // Less than 1 minute - danger
  };

  const getTimerClass = () => {
    if (timeRemaining > 300) return "bg-primary/10 text-primary border-primary/20";
    if (timeRemaining > 60) return "bg-warning/10 text-warning border-warning/20";
    return "bg-destructive/10 text-destructive border-destructive/20";
  };

  return (
    <Badge 
      className={`flex items-center space-x-2 px-4 py-2 font-mono font-bold text-base ${getTimerClass()} ${className}`}
      data-testid="quiz-timer"
    >
      <Clock className="w-4 h-4" />
      <span>{formatTime}</span>
    </Badge>
  );
}
