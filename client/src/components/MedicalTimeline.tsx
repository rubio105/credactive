import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Activity, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { format } from "date-fns";
import { it } from "date-fns/locale";

interface TimelineReport {
  id: string;
  title: string;
  reportType: string;
  uploadDate: string;
  summary?: string;
  keyValue?: {
    name: string;
    value: number;
    trend?: 'up' | 'down' | 'stable';
  };
}

export function MedicalTimeline({ reports }: { reports: TimelineReport[] }) {
  const sortedReports = [...reports].sort((a, b) => 
    new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime()
  );

  const getTrendIcon = (trend?: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="w-4 h-4 text-red-500 dark:text-red-400" />;
      case 'down':
        return <TrendingDown className="w-4 h-4 text-green-500 dark:text-green-400" />;
      case 'stable':
        return <Minus className="w-4 h-4 text-blue-500 dark:text-blue-400" />;
      default:
        return null;
    }
  };

  return (
    <Card className="shadow-lg" data-testid="medical-timeline">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-purple-700 dark:text-purple-300">
          <Calendar className="w-5 h-5" />
          Cronologia Medica
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative">
          {/* Timeline Line */}
          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-purple-200 dark:bg-purple-800" />
          
          <div className="space-y-6">
            {sortedReports.map((report, index) => (
              <div key={report.id} className="relative pl-12" data-testid={`timeline-item-${report.id}`}>
                {/* Timeline Dot */}
                <div className="absolute left-0 top-1.5 w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900 border-4 border-purple-500 dark:border-purple-400 flex items-center justify-center">
                  <Activity className="w-4 h-4 text-purple-600 dark:text-purple-300" />
                </div>
                
                {/* Content */}
                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                        {report.title}
                      </h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {format(new Date(report.uploadDate), "d MMMM yyyy", { locale: it })}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-xs" data-testid={`badge-type-${index}`}>
                      {report.reportType}
                    </Badge>
                  </div>
                  
                  {report.summary && (
                    <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                      {report.summary}
                    </p>
                  )}
                  
                  {report.keyValue && (
                    <div className="flex items-center gap-2 mt-3 p-2 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700" data-testid={`key-value-${index}`}>
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {report.keyValue.name}:
                      </span>
                      <span className="text-sm font-bold text-purple-600 dark:text-purple-400">
                        {report.keyValue.value}
                      </span>
                      {getTrendIcon(report.keyValue.trend)}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
