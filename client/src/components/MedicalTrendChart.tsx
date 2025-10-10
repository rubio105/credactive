import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart, ReferenceArea } from 'recharts';
import { TrendingUp } from "lucide-react";
import { format } from "date-fns";
import { it } from "date-fns/locale";

interface DataPoint {
  date: string;
  value: number;
  normalMin?: number;
  normalMax?: number;
}

interface MedicalTrendChartProps {
  title: string;
  unit: string;
  data: DataPoint[];
  referenceRange?: { min: number; max: number };
}

export function MedicalTrendChart({ title, unit, data, referenceRange }: MedicalTrendChartProps) {
  const chartData = data.map(d => ({
    ...d,
    displayDate: format(new Date(d.date), "dd/MM", { locale: it }),
  }));

  const isValueAbnormal = (value: number) => {
    if (!referenceRange) return false;
    return value < referenceRange.min || value > referenceRange.max;
  };

  const latestValue = data[data.length - 1]?.value;
  const previousValue = data[data.length - 2]?.value;
  const trend = latestValue !== undefined && previousValue !== undefined ? 
    (latestValue > previousValue ? 'up' : latestValue < previousValue ? 'down' : 'stable') : 
    'stable';

  return (
    <Card className="shadow-lg" data-testid={`trend-chart-${title.toLowerCase().replace(/\s/g, '-')}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
            <TrendingUp className="w-5 h-5" />
            {title}
          </CardTitle>
          {latestValue !== undefined && (
            <div className="text-right" data-testid="latest-value-display">
              <p className={`text-2xl font-bold ${
                isValueAbnormal(latestValue) ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'
              }`}>
                {latestValue} {unit}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {trend === 'up' && '↑ In aumento'}
                {trend === 'down' && '↓ In diminuzione'}
                {trend === 'stable' && '→ Stabile'}
              </p>
            </div>
          )}
        </div>
        {referenceRange && (
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Range normale: {referenceRange.min} - {referenceRange.max} {unit}
          </p>
        )}
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-gray-700" />
            <XAxis 
              dataKey="displayDate" 
              stroke="#6b7280"
              tick={{ fontSize: 12, fill: '#6b7280' }}
              className="dark:stroke-gray-400"
            />
            <YAxis 
              stroke="#6b7280"
              tick={{ fontSize: 12, fill: '#6b7280' }}
              label={{ value: unit, angle: -90, position: 'insideLeft', style: { fontSize: 12, fill: '#6b7280' } }}
              className="dark:stroke-gray-400"
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '14px',
              }}
              wrapperClassName="dark:bg-gray-800 dark:border-gray-700"
              formatter={(value: number) => [`${value} ${unit}`, title]}
              labelFormatter={(label) => `Data: ${label}`}
            />
            
            {/* Reference Range - proper bounded area */}
            {referenceRange && (
              <ReferenceArea
                y1={referenceRange.min}
                y2={referenceRange.max}
                fill="#86efac"
                fillOpacity={0.2}
                stroke="none"
              />
            )}
            
            {/* Actual Value Line */}
            <Area
              type="monotone"
              dataKey="value"
              stroke="#3b82f6"
              strokeWidth={3}
              fill="url(#colorValue)"
              dot={{ fill: '#3b82f6', r: 5 }}
              activeDot={{ r: 7 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
