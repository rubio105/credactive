interface ColorScore {
  color: string;
  name: string;
  count: number;
  percentage: number;
}

interface InsightColorWheelProps {
  colorScores: ColorScore[];
  dominantColor: ColorScore;
}

const colorMap: Record<string, { bg: string; text: string; border: string }> = {
  red: {
    bg: 'bg-red-500',
    text: 'text-red-700 dark:text-red-300',
    border: 'border-red-500',
  },
  yellow: {
    bg: 'bg-yellow-500',
    text: 'text-yellow-700 dark:text-yellow-300',
    border: 'border-yellow-500',
  },
  green: {
    bg: 'bg-green-500',
    text: 'text-green-700 dark:text-green-300',
    border: 'border-green-500',
  },
  blue: {
    bg: 'bg-blue-500',
    text: 'text-blue-700 dark:text-blue-300',
    border: 'border-blue-500',
  },
};

export function InsightColorWheel({ colorScores, dominantColor }: InsightColorWheelProps) {
  // Calculate positions for the color segments in a circular layout
  const radius = 120;
  const centerX = 150;
  const centerY = 150;

  return (
    <div className="flex flex-col items-center" data-testid="insight-color-wheel">
      {/* SVG Color Wheel */}
      <div className="relative mb-8">
        <svg width="300" height="300" viewBox="0 0 300 300">
          {/* Background circle */}
          <circle
            cx={centerX}
            cy={centerY}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="text-gray-300 dark:text-gray-600"
          />
          
          {/* Color segments */}
          {colorScores.map((score, index) => {
            const startAngle = (index * 90) - 90; // Start from top
            const endAngle = startAngle + 90;
            
            const startRad = (startAngle * Math.PI) / 180;
            const endRad = (endAngle * Math.PI) / 180;
            
            const x1 = centerX + radius * Math.cos(startRad);
            const y1 = centerY + radius * Math.sin(startRad);
            const x2 = centerX + radius * Math.cos(endRad);
            const y2 = centerY + radius * Math.sin(endRad);
            
            // Calculate arc radius based on percentage
            const arcRadius = (radius * score.percentage) / 100;
            
            const largeArcFlag = 0;
            
            const pathData = `
              M ${centerX} ${centerY}
              L ${x1} ${y1}
              A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}
              Z
            `;
            
            const colors: Record<string, string> = {
              red: '#ef4444',
              yellow: '#eab308',
              green: '#22c55e',
              blue: '#3b82f6',
            };
            
            return (
              <path
                key={score.color}
                d={pathData}
                fill={colors[score.color]}
                opacity={0.3 + (score.percentage / 100) * 0.7}
                stroke={colors[score.color]}
                strokeWidth="1"
                data-testid={`color-segment-${score.color}`}
              />
            );
          })}
          
          {/* Center circle with dominant color */}
          <circle
            cx={centerX}
            cy={centerY}
            r={40}
            fill={
              dominantColor.color === 'red' ? '#ef4444' :
              dominantColor.color === 'yellow' ? '#eab308' :
              dominantColor.color === 'green' ? '#22c55e' :
              '#3b82f6'
            }
            opacity="0.9"
          />
          
          {/* Percentage text in center */}
          <text
            x={centerX}
            y={centerY + 5}
            textAnchor="middle"
            className="fill-white font-bold text-2xl"
            data-testid="text-dominant-percentage"
          >
            {dominantColor.percentage}%
          </text>
        </svg>
        
        {/* Dominant color label */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 translate-y-16 text-center">
          <p className="text-sm font-semibold text-muted-foreground" data-testid="text-dominant-color">
            {dominantColor.name}
          </p>
        </div>
      </div>
      
      {/* Color legend */}
      <div className="grid grid-cols-2 gap-4 w-full max-w-md">
        {colorScores.map((score) => (
          <div
            key={score.color}
            className="flex items-center justify-between p-3 rounded-lg border-2 bg-white dark:bg-gray-950"
            style={{
              borderColor: 
                score.color === 'red' ? '#ef4444' :
                score.color === 'yellow' ? '#eab308' :
                score.color === 'green' ? '#22c55e' :
                '#3b82f6'
            }}
            data-testid={`color-legend-${score.color}`}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-4 h-4 rounded-full"
                style={{
                  backgroundColor:
                    score.color === 'red' ? '#ef4444' :
                    score.color === 'yellow' ? '#eab308' :
                    score.color === 'green' ? '#22c55e' :
                    '#3b82f6'
                }}
              />
              <span className="text-sm font-medium">{score.name}</span>
            </div>
            <span className="text-sm font-bold">{score.percentage}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
