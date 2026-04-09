interface QuickActionProps {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  color: string;
  count?: number;
  badge?: string;
  onClick: (id: string) => void;
}

export const QuickAction = ({ 
  id, 
  title, 
  description, 
  icon: Icon, 
  color, 
  count, 
  badge, 
  onClick 
}: QuickActionProps) => {
  const getColorClasses = (color: string) => {
    const colors = {
      blue: 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100',
      green: 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100',
      purple: 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100',
      amber: 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100',
      indigo: 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100',
      orange: 'bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100',
      teal: 'bg-teal-50 text-teal-700 border-teal-200 hover:bg-teal-100',
      rose: 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
    };
    return colors[color as keyof typeof colors] || 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100';
  };

  const getIconColorClasses = (color: string) => {
    const colors = {
      blue: 'bg-blue-500 hover:bg-blue-600',
      green: 'bg-green-500 hover:bg-green-600',
      purple: 'bg-purple-500 hover:bg-purple-600',
      amber: 'bg-amber-500 hover:bg-amber-600',
      indigo: 'bg-indigo-500 hover:bg-indigo-600',
      orange: 'bg-orange-500 hover:bg-orange-600',
      teal: 'bg-teal-500 hover:bg-teal-600',
      rose: 'bg-rose-500 hover:bg-rose-600'
    };
    return colors[color as keyof typeof colors] || 'bg-gray-500 hover:bg-gray-600';
  };

  return (
    <button
      onClick={() => onClick(id)}
      className={`${getColorClasses(color)} p-4 text-left border-2 rounded-xl transition-all duration-200 hover:shadow-lg group`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${getIconColorClasses(color)} transition-transform group-hover:scale-110`}>
            <Icon className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="font-semibold text-gray-900">{title}</div>
            <div className="text-sm opacity-75">{description}</div>
          </div>
        </div>
        <div className="flex flex-col items-end space-y-1">
          {count && (
            <div className="text-2xl font-bold text-gray-900">{count}</div>
          )}
          {badge && (
            <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
              {badge}
            </span>
          )}
        </div>
      </div>
    </button>
  );
};
