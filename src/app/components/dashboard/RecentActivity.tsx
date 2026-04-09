import { Users, Calendar, GitBranch, Camera, Activity } from 'lucide-react';

interface ActivityItem {
  id: string;
  type: 'added' | 'updated' | 'connected' | 'photo_added' | 'dna_completed' | 'research_started';
  personName: string;
  timestamp: Date;
  details: string;
  priority?: 'high' | 'medium' | 'low';
}

interface RecentActivityProps {
  activities: ActivityItem[];
}

export const RecentActivity = ({ activities }: RecentActivityProps) => {
  const getActivityIcon = (type: ActivityItem['type']) => {
    switch (type) {
      case 'added':
        return <Users className="w-4 h-4 text-green-600" />;
      case 'updated':
        return <Calendar className="w-4 h-4 text-blue-600" />;
      case 'connected':
        return <GitBranch className="w-4 h-4 text-purple-600" />;
      case 'photo_added':
        return <Camera className="w-4 h-4 text-amber-600" />;
      case 'dna_completed':
        return <Activity className="w-4 h-4 text-indigo-600" />;
      case 'research_started':
        return <Activity className="w-4 h-4 text-rose-600" />;
      default:
        return <Activity className="w-4 h-4 text-gray-600" />;
    }
  };

  const getPriorityColor = (priority?: ActivityItem['priority']) => {
    switch (priority) {
      case 'high': return 'border-l-4 border-l-red-500';
      case 'medium': return 'border-l-4 border-l-yellow-500';
      case 'low': return 'border-l-4 border-l-green-500';
      default: return '';
    }
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 60) {
      return `${diffInMinutes} minutes ago`;
    } else if (diffInMinutes < 1440) {
      return `${Math.floor(diffInMinutes / 60)} hours ago`;
    } else {
      return `${Math.floor(diffInMinutes / 1440)} days ago`;
    }
  };

  if (activities.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Recent Activity</h3>
        <div className="text-center py-8 text-gray-500">
          <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No recent activity</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
        <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
          View All
        </button>
      </div>
      <div className="space-y-4">
        {activities.slice(0, 5).map((activity) => (
          <div 
            key={activity.id} 
            className={`flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors ${getPriorityColor(activity.priority)}`}
          >
            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 mt-1">
              {getActivityIcon(activity.type)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900">{activity.personName}</p>
              <p className="text-sm text-gray-600">{activity.details}</p>
              <p className="text-xs text-gray-500 mt-1">{formatTimeAgo(activity.timestamp)}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
