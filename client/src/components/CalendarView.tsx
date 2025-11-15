import { useState } from "react";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, User, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek } from "date-fns";
import { it } from "date-fns/locale";

// Import shared types from schema
import type { Appointment } from "@shared/schema";

interface CalendarViewProps {
  appointments: (Appointment & {
    patient?: { firstName: string; lastName: string } | null;
    doctor?: { firstName: string; lastName: string } | null;
  })[];
  onDayClick?: (date: Date, dayAppointments: CalendarViewProps['appointments']) => void;
  onAppointmentClick?: (appointment: CalendarViewProps['appointments'][0]) => void;
  isDoctor?: boolean;
  isLoading?: boolean;
  emptyMessage?: string;
}

export function CalendarView({ 
  appointments, 
  onDayClick, 
  onAppointmentClick, 
  isDoctor = false,
  isLoading = false,
  emptyMessage = "Nessun appuntamento trovato"
}: CalendarViewProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart, { locale: it, weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { locale: it, weekStartsOn: 1 });
  
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const getAppointmentsForDay = (date: Date) => {
    return appointments.filter(apt => 
      isSameDay(new Date(apt.startTime), date)
    );
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      available: "bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300",
      pending: "bg-yellow-50 dark:bg-yellow-950/30 border-yellow-300 dark:border-yellow-700 text-yellow-800 dark:text-yellow-300",
      booked: "bg-blue-50 dark:bg-blue-950/30 border-blue-300 dark:border-blue-700 text-blue-800 dark:text-blue-300",
      confirmed: "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-300",
      completed: "bg-green-50 dark:bg-green-950/30 border-green-300 dark:border-green-700 text-green-800 dark:text-green-300",
      cancelled: "bg-red-50 dark:bg-red-950/30 border-red-300 dark:border-red-700 text-red-800 dark:text-red-300",
      no_show: "bg-orange-50 dark:bg-orange-950/30 border-orange-300 dark:border-orange-700 text-orange-800 dark:text-orange-300",
      rescheduled: "bg-purple-50 dark:bg-purple-950/30 border-purple-300 dark:border-purple-700 text-purple-800 dark:text-purple-300",
    };
    return colors[status] || colors.available;
  };

  const handlePreviousMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  const handleToday = () => {
    setCurrentMonth(new Date());
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">Caricamento calendario...</span>
      </div>
    );
  }

  // Empty state
  if (appointments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <CalendarIcon className="w-12 h-12 text-muted-foreground/50 mb-3" />
        <p className="text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Calendar Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <CalendarIcon className="w-5 h-5" />
          {format(currentMonth, "MMMM yyyy", { locale: it })}
        </h2>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleToday}
            data-testid="button-today"
          >
            Oggi
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={handlePreviousMonth}
            data-testid="button-prev-month"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={handleNextMonth}
            data-testid="button-next-month"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Weekday Headers */}
      <div className="grid grid-cols-7 gap-1 sm:gap-2">
        {["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"].map((day) => (
          <div key={day} className="text-center text-xs sm:text-sm font-semibold text-muted-foreground py-2">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1 sm:gap-2">
        {calendarDays.map((day) => {
          const dayAppointments = getAppointmentsForDay(day);
          const isCurrentMonth = isSameMonth(day, currentMonth);
          const isToday = isSameDay(day, new Date());

          return (
            <div
              key={day.toString()}
              className={`min-h-[80px] sm:min-h-[100px] p-1 sm:p-2 border rounded-lg transition-all cursor-pointer hover:shadow-md ${
                isCurrentMonth 
                  ? "bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800" 
                  : "bg-gray-50 dark:bg-gray-950 border-gray-100 dark:border-gray-900 opacity-40"
              } ${
                isToday ? "ring-2 ring-emerald-500 dark:ring-emerald-600" : ""
              }`}
              onClick={() => onDayClick?.(day, dayAppointments)}
              data-testid={`calendar-day-${format(day, "yyyy-MM-dd")}`}
            >
              <div className={`text-xs sm:text-sm font-semibold mb-1 ${
                isToday ? "text-emerald-600 dark:text-emerald-400" : "text-gray-700 dark:text-gray-300"
              }`}>
                {format(day, "d")}
              </div>
              
              <div className="space-y-0.5 overflow-y-auto max-h-[60px] sm:max-h-[70px]">
                {dayAppointments.slice(0, 3).map((apt) => (
                  <div
                    key={apt.id}
                    className={`text-[10px] sm:text-xs px-1 sm:px-2 py-0.5 sm:py-1 rounded border truncate ${getStatusColor(apt.status || 'available')}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onAppointmentClick?.(apt);
                    }}
                    data-testid={`appointment-${apt.id}`}
                  >
                    <div className="flex items-center gap-1">
                      <Clock className="w-2.5 h-2.5 sm:w-3 sm:h-3 flex-shrink-0" />
                      <span className="truncate">{format(new Date(apt.startTime), "HH:mm")}</span>
                    </div>
                    {apt.title && (
                      <div className="truncate font-medium">
                        {apt.title}
                      </div>
                    )}
                    {isDoctor && apt.patient && (
                      <div className="flex items-center gap-1 truncate text-[9px] sm:text-[10px] opacity-80">
                        <User className="w-2 h-2 sm:w-2.5 sm:h-2.5 flex-shrink-0" />
                        <span className="truncate">{apt.patient.firstName}</span>
                      </div>
                    )}
                    {!isDoctor && apt.doctor && (
                      <div className="flex items-center gap-1 truncate text-[9px] sm:text-[10px] opacity-80">
                        <User className="w-2 h-2 sm:w-2.5 sm:h-2.5 flex-shrink-0" />
                        <span className="truncate">Dr. {apt.doctor.lastName}</span>
                      </div>
                    )}
                  </div>
                ))}
                {dayAppointments.length > 3 && (
                  <div className="text-[9px] sm:text-[10px] text-muted-foreground text-center py-0.5">
                    +{dayAppointments.length - 3} altri
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-2 sm:gap-3 text-xs sm:text-sm pt-4 border-t">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600"></div>
          <span>Disponibile</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-300 dark:border-yellow-700"></div>
          <span>In Attesa</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-blue-50 dark:bg-blue-950/30 border border-blue-300 dark:border-blue-700"></div>
          <span>Prenotata</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-300 dark:border-emerald-700"></div>
          <span>Confermata</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-green-50 dark:bg-green-950/30 border border-green-300 dark:border-green-700"></div>
          <span>Completata</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-red-50 dark:bg-red-950/30 border border-red-300 dark:border-red-700"></div>
          <span>Annullata</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-orange-50 dark:bg-orange-950/30 border border-orange-300 dark:border-orange-700"></div>
          <span>Non Presentato</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-purple-50 dark:bg-purple-950/30 border border-purple-300 dark:border-purple-700"></div>
          <span>Riprogrammata</span>
        </div>
      </div>
    </div>
  );
}
