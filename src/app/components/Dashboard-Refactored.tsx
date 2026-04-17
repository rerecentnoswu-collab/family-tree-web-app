import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Person } from '../types/Person';
import { DashboardSkeleton } from './ui/SkeletonLoader';
import { 
  Users, 
  GitBranch, 
  Camera, 
  List,
  Grid,
  MapPin,
  Target,
  Activity
} from 'lucide-react';
import { StatsCard } from './dashboard/StatsCard';
import { QuickAction } from './dashboard/QuickAction';
import { RecentActivity } from './dashboard/RecentActivity';
import { useDashboardData } from './dashboard/DashboardUtils';

interface DashboardProps {
  persons: Person[];
}

export function Dashboard({ persons }: DashboardProps) {
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const navigate = useNavigate();
  
  const { stats, recentActivities, quickActions } = useDashboardData(persons);

  useEffect(() => {
    // Simulate loading time
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);

  const handleQuickAction = (actionId: string) => {
    switch (actionId) {
      case 'add-member':
        navigate('/persons');
        break;
      case 'view-tree':
        navigate('/tree');
        break;
      case 'upload-photo':
        navigate('/photos');
        break;
      case 'dna-analysis':
        navigate('/dna');
        break;
      case 'generate-story':
        navigate('/stories');
        break;
      case 'analytics':
        navigate('/analytics');
        break;
      default:
        console.log('Unknown action:', actionId);
    }
  };

  if (loading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Family Dashboard</h2>
            <p className="text-gray-600">Welcome back! Here's your family tree overview</p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total Members"
          value={stats.totalMembers}
          icon={Users}
          color="blue"
          trend="up"
          trendValue="12%"
          subtitle="Family members in your tree"
        />
        
        <StatsCard
          title="Complete Families"
          value={stats.completeFamilies}
          icon={GitBranch}
          color="green"
          trend="up"
          trendValue="5%"
          subtitle="Families with both parents identified"
        />
        
        <StatsCard
          title="Countries"
          value={stats.countries}
          icon={MapPin}
          color="indigo"
          trend="up"
          trendValue="3%"
          badge="+1 new"
          subtitle="Countries represented in family tree"
        />
        
        <StatsCard
          title="Photos"
          value={stats.photos}
          icon={Camera}
          color="teal"
          trend="up"
          trendValue="12%"
          badge="23 new uploads"
          subtitle="Family photos uploaded"
        />
      </div>

      {/* Additional Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatsCard
          title="Average Age"
          value={stats.averageAge}
          icon={Target}
          color="blue"
          subtitle="years"
        />
        
        <StatsCard
          title="Root Members"
          value={stats.rootMembers}
          icon={Target}
          color="green"
          subtitle="Members without known parents"
        />
        
        <StatsCard
          title="Researchers"
          value={stats.activeResearchers}
          icon={Activity}
          color="rose"
          subtitle="Online now"
        />
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
              className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              {viewMode === 'grid' ? <List className="w-4 h-4" /> : <Grid className="w-4 h-4" />}
            </button>
          </div>
        </div>
        <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 gap-4' : 'space-y-4'}>
          {quickActions.map((action) => (
            <QuickAction
              key={action.id}
              id={action.id}
              title={action.title}
              description={action.description}
              icon={action.icon}
              color={action.color}
              count={action.count}
              badge={action.badge}
              onClick={handleQuickAction}
            />
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <RecentActivity activities={recentActivities} />
    </div>
  );
}
