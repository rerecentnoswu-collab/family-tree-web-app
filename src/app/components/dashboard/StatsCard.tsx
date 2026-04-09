import { ArrowUp, ArrowDown, Minus } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: number;
  icon: React.ElementType;
  color: string;
  trend?: 'up' | 'down' | 'stable';
  trendValue?: string;
  subtitle?: string;
  badge?: string;
}

export const StatsCard = ({ 
  title, 
  value, 
  icon: Icon, 
  color, 
  trend, 
  trendValue, 
  subtitle,
  badge 
}: StatsCardProps) => {
  const getColorClasses = (color: string) => {
    const colors = {
      blue: 'from-blue-500 to-blue-600',
      green: 'from-green-500 to-green-600',
      purple: 'from-purple-500 to-purple-600',
      indigo: 'from-indigo-500 to-indigo-600',
      teal: 'from-teal-500 to-teal-600',
      rose: 'from-rose-500 to-rose-600',
      amber: 'from-amber-500 to-amber-600',
      orange: 'from-orange-500 to-orange-600'
    };
    return colors[color as keyof typeof colors] || 'from-gray-500 to-gray-600';
  };

  const getTrendIcon = (trend?: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up': return <ArrowUp className="w-4 h-4" />;
      case 'down': return <ArrowDown className="w-4 h-4" />;
      case 'stable': return <Minus className="w-4 h-4" />;
      default: return null;
    }
  };

  const getTrendColor = (trend?: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up': return 'text-green-600';
      case 'down': return 'text-red-600';
      case 'stable': return 'text-blue-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all duration-200 hover:scale-105">
      <div className="flex items-center justify-between mb-4">
        <div className={`w-12 h-12 bg-gradient-to-br ${getColorClasses(color)} rounded-xl flex items-center justify-center`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        {trend && (
          <div className={`flex items-center text-sm font-medium ${getTrendColor(trend)}`}>
            {getTrendIcon(trend)}
            {trendValue}
          </div>
        )}
      </div>
      <div className="text-3xl font-bold text-gray-900">{value}</div>
      <div className="text-sm text-gray-600 mt-1">{title}</div>
      {badge && (
        <div className="mt-2 text-xs font-medium text-blue-600">{badge}</div>
      )}
      {subtitle && (
        <div className="mt-2 text-xs text-gray-500">{subtitle}</div>
      )}
    </div>
  );
};
