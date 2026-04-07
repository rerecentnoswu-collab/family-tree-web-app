import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Person } from '../types/Person';
import { 
  Users, 
  GitBranch, 
  Camera, 
  Shield, 
  Dna, 
  Brain, 
  TrendingUp, 
  Search, 
  Clock, 
  BookOpen, 
  Database, 
  Sparkles, 
  Archive, 
  Users2, 
  History, 
  Activity, 
  Calendar, 
  MapPin, 
  Heart, 
  Star, 
  ChevronRight, 
  BarChart3, 
  PieChart, 
  Target, 
  X, 
  Info, 
  Calendar as CalendarIcon, 
  TrendingDown, 
  Minus, 
  ArrowUp, 
  ArrowDown, 
  MoreVertical, 
  Filter, 
  Download, 
  RefreshCw, 
  Settings, 
  Bell, 
  User, 
  LogOut, 
  Home, 
  FileText, 
  Image,
  Globe,
  Award,
  Zap,
  Eye,
  Share2,
  Plus,
  ChevronDown,
  AlertCircle,
  CheckCircle
} from 'lucide-react';

interface DashboardProps {
  persons: Person[];
  onPersonAdded: () => void;
}

interface DashboardStats {
  totalMembers: number;
  completeFamilies: number;
  rootMembers: number;
  recentActivity: number;
  averageAge: number;
  oldestGeneration: number;
  countries: number;
  photos: number;
  growthRate: number;
  activeResearchers: number;
  pendingTasks: number;
}

interface RecentActivity {
  id: string;
  type: 'added' | 'updated' | 'connected' | 'photo_added' | 'dna_completed' | 'research_started';
  personName: string;
  timestamp: Date;
  details: string;
  priority?: 'high' | 'medium' | 'low';
}

interface ToastNotification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  icon: React.ElementType;
  duration?: number;
}

interface UploadedPhoto {
  id: string;
  url: string;
  name: string;
  uploadedAt: Date;
  personId?: string;
  tags: string[];
}

interface DNAAnalysis {
  id: string;
  personId: string;
  confidence: number;
  relationships: Array<{
    personId: string;
    relationship: string;
    confidence: number;
  }>;
  completedAt: Date;
}

interface AnalyticsData {
  totalMembers: number;
  averageAge: number;
  oldestGeneration: number;
  countries: number;
  photos: number;
  completeFamilies: number;
  recentActivity: number;
  growthRate: number;
  genderDistribution: { male: number; female: number; other: number };
  ageGroups: { range: string; count: number }[];
}

interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  color: string;
  count?: number;
  trend?: 'up' | 'down' | 'stable';
  badge?: string;
}

interface FamilyInsight {
  id: string;
  type: 'milestone' | 'anniversary' | 'missing_info' | 'connection';
  title: string;
  description: string;
  icon: React.ElementType;
  color: string;
  priority: 'high' | 'medium' | 'low';
}

export function Dashboard({ persons, onPersonAdded }: DashboardProps) {
  const [stats, setStats] = useState<DashboardStats>({
    totalMembers: 0,
    completeFamilies: 0,
    rootMembers: 0,
    recentActivity: 0,
    averageAge: 0,
    oldestGeneration: 0,
    countries: 0,
    photos: 0,
    growthRate: 0,
    activeResearchers: 0,
    pendingTasks: 0
  });
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState<ToastNotification[]>([]);
  const [uploadedPhotos, setUploadedPhotos] = useState<UploadedPhoto[]>([]);
  const [dnaAnalyses, setDnaAnalyses] = useState<DNAAnalysis[]>([]);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [showPhotoUpload, setShowPhotoUpload] = useState(false);
  const [showDNAAnalysis, setShowDNAAnalysis] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [analyzingDNA, setAnalyzingDNA] = useState(false);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);
  const [selectedTimeRange, setSelectedTimeRange] = useState<'week' | 'month' | 'year'>('month');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showInsights, setShowInsights] = useState(true);
  const navigate = useNavigate();

  // Toast notification functions
  const showToast = (notification: Omit<ToastNotification, 'id'>) => {
    const id = Date.now().toString();
    const newToast: ToastNotification = { ...notification, id };
    
    setToasts(prev => [...prev, newToast]);
    
    // Auto-remove after duration
    const duration = notification.duration || 5000;
    setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== id));
    }, duration);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  // Photo Upload Feature
  const handlePhotoUpload = async (files: FileList) => {
    setUploadingPhoto(true);
    try {
      const newPhotos: UploadedPhoto[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        // Simulate upload process
        await new Promise(resolve => setTimeout(resolve, 1000));
        const photo: UploadedPhoto = {
          id: Date.now().toString() + i,
          url: URL.createObjectURL(file),
          name: file.name,
          uploadedAt: new Date(),
          tags: ['family', 'upload']
        };
        newPhotos.push(photo);
      }
      setUploadedPhotos(prev => [...prev, ...newPhotos]);
      setStats(prev => ({ ...prev, photos: prev.photos + newPhotos.length }));
      
      showToast({
        type: 'success',
        title: 'Photos Uploaded',
        message: `Successfully uploaded ${newPhotos.length} photo(s)`,
        icon: Camera,
        duration: 4000
      });
    } catch (error) {
      showToast({
        type: 'error',
        title: 'Upload Failed',
        message: 'Failed to upload photos. Please try again.',
        icon: Camera,
        duration: 5000
      });
    } finally {
      setUploadingPhoto(false);
      setShowPhotoUpload(false);
    }
  };

  // DNA Analysis Feature
  const handleDNAAnalysis = async () => {
    setAnalyzingDNA(true);
    try {
      // Simulate DNA analysis process
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const analysis: DNAAnalysis = {
        id: Date.now().toString(),
        personId: 'sample-person-1',
        confidence: 0.87,
        relationships: [
          { personId: 'person-2', relationship: 'Parent', confidence: 0.92 },
          { personId: 'person-3', relationship: 'Sibling', confidence: 0.78 },
          { personId: 'person-4', relationship: 'Cousin', confidence: 0.65 }
        ],
        completedAt: new Date()
      };
      
      setDnaAnalyses(prev => [...prev, analysis]);
      
      showToast({
        type: 'success',
        title: 'DNA Analysis Complete',
        message: `Found ${analysis.relationships.length} potential relationships with ${Math.round(analysis.confidence * 100)}% confidence`,
        icon: Dna,
        duration: 6000
      });
    } catch (error) {
      showToast({
        type: 'error',
        title: 'Analysis Failed',
        message: 'DNA analysis could not be completed. Please try again.',
        icon: Dna,
        duration: 5000
      });
    } finally {
      setAnalyzingDNA(false);
      setShowDNAAnalysis(false);
    }
  };

  // Analytics Feature
  const loadAnalytics = async () => {
    setLoadingAnalytics(true);
    try {
      // Simulate analytics loading
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const analytics: AnalyticsData = {
        totalMembers: stats.totalMembers,
        averageAge: stats.averageAge,
        oldestGeneration: stats.oldestGeneration,
        countries: stats.countries,
        photos: stats.photos,
        completeFamilies: stats.completeFamilies,
        recentActivity: stats.recentActivity,
        growthRate: 12.5,
        genderDistribution: { male: 48, female: 50, other: 2 },
        ageGroups: [
          { range: '0-18', count: 8 },
          { range: '19-35', count: 15 },
          { range: '36-50', count: 12 },
          { range: '51-70', count: 9 },
          { range: '70+', count: 3 }
        ]
      };
      
      setAnalyticsData(analytics);
      
      showToast({
        type: 'success',
        title: 'Analytics Loaded',
        message: 'Family analytics and insights are now available',
        icon: BarChart3,
        duration: 4000
      });
    } catch (error) {
      showToast({
        type: 'error',
        title: 'Analytics Failed',
        message: 'Could not load analytics data. Please try again.',
        icon: BarChart3,
        duration: 5000
      });
    } finally {
      setLoadingAnalytics(false);
      setShowAnalytics(false);
    }
  };

  // Real analytics calculations based on actual person data
  useEffect(() => {
    const calculateRealStats = (): DashboardStats => {
      if (!persons || persons.length === 0) {
        return {
          totalMembers: 0,
          completeFamilies: 0,
          rootMembers: 0,
          recentActivity: 0,
          averageAge: 0,
          oldestGeneration: 0,
          countries: 0,
          photos: 0,
          growthRate: 0,
          activeResearchers: 0,
          pendingTasks: 0
        };
      }

      // Calculate total members
      const totalMembers = persons.length;

      // Calculate complete families (both parents known)
      const completeFamilies = persons.filter(person => 
        person.motherId && person.fatherId
      ).length;

      // Calculate root members (no parents listed)
      const rootMembers = persons.filter(person => 
        !person.motherId && !person.fatherId
      ).length;

      // Calculate average age from birthdays
      const currentYear = new Date().getFullYear();
      const ages = persons
        .filter(person => person.birthday)
        .map(person => {
          const birthYear = new Date(person.birthday!).getFullYear();
          return currentYear - birthYear;
        })
        .filter(age => age >= 0 && age <= 120); // Filter out invalid ages
      
      const averageAge = ages.length > 0 
        ? Math.round(ages.reduce((sum, age) => sum + age, 0) / ages.length)
        : 0;

      // Calculate oldest generation (simplified - based on birth years)
      const birthYears = persons
        .filter(person => person.birthday)
        .map(person => new Date(person.birthday!).getFullYear())
        .sort((a, b) => a - b);
      
      const oldestGeneration = birthYears.length > 0 
        ? Math.floor((currentYear - birthYears[0]) / 25) + 1 // Rough generation calculation
        : 0;

      // Count unique birthplaces (as proxy for countries)
      const uniqueBirthplaces = new Set(
        persons
          .filter(person => person.birthplace)
          .map(person => person.birthplace!)
      ).size;

      // Count persons with photos (placeholder - would need actual photo data)
      const photos = Math.floor(totalMembers * 0.3); // Estimate 30% have photos

      // Calculate growth rate (mock - would compare with historical data)
      const growthRate = Math.round((totalMembers / Math.max(totalMembers - 5, 1)) * 100) / 100;

      // Mock active researchers and pending tasks
      const activeResearchers = Math.floor(totalMembers * 0.15); // 15% of family members are active researchers
      const pendingTasks = Math.floor(totalMembers * 0.2); // 20% have pending tasks

      return {
        totalMembers,
        completeFamilies,
        rootMembers,
        recentActivity: Math.min(totalMembers, 10), // Show up to 10 recent activities
        averageAge,
        oldestGeneration,
        countries: uniqueBirthplaces,
        photos,
        growthRate,
        activeResearchers,
        pendingTasks
      };
    };

    const generateRealActivities = (): RecentActivity[] => {
      if (!persons || persons.length === 0) {
        return [];
      }

      // Generate activities based on actual person data
      const activities: RecentActivity[] = [];
      
      // Add activities for recently added persons (mock recent for demo)
      const recentPersons = persons.slice(-5).reverse();
      
      recentPersons.forEach((person, index) => {
        const activityTypes: RecentActivity['type'][] = ['added', 'updated', 'connected', 'photo_added', 'dna_completed', 'research_started'];
        const activityType = activityTypes[index % activityTypes.length];
        const timestamp = new Date(Date.now() - (index * 2 * 60 * 60 * 1000)); // Every 2 hours
        
        let details = '';
        let priority: RecentActivity['priority'] = 'medium';
        
        switch (activityType) {
          case 'added':
            details = 'Added to family tree';
            priority = 'high';
            break;
          case 'updated':
            details = 'Profile information updated';
            priority = 'medium';
            break;
          case 'connected':
            details = 'Connected to family members';
            priority = 'high';
            break;
          case 'photo_added':
            details = 'New photos uploaded';
            priority = 'medium';
            break;
          case 'dna_completed':
            details = 'DNA analysis completed';
            priority = 'high';
            break;
          case 'research_started':
            details = 'Research task initiated';
            priority = 'low';
            break;
        }

        activities.push({
          id: `activity-${person.id}`,
          type: activityType,
          personName: `${person.firstName} ${person.lastName}`,
          timestamp,
          details,
          priority
        });
      });

      return activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    };

    // Generate family insights
    const generateFamilyInsights = (): FamilyInsight[] => {
      if (!persons || persons.length === 0) return [];

      const insights: FamilyInsight[] = [];

      // Milestone insight
      if (stats.totalMembers >= 10) {
        insights.push({
          id: 'milestone-1',
          type: 'milestone',
          title: 'Family Milestone Reached!',
          description: `Your family tree now includes ${stats.totalMembers} members`,
          icon: Award,
          color: 'blue',
          priority: 'high'
        });
      }

      // Missing info insight
      const missingBirthdates = persons.filter(p => !p.birthday).length;
      if (missingBirthdates > 0) {
        insights.push({
          id: 'missing-birthdates',
          type: 'missing_info',
          title: `${missingBirthdates} Missing Birthdates`,
          description: 'Complete family profiles by adding birth dates',
          icon: AlertCircle,
          color: 'orange',
          priority: 'medium'
        });
      }

      // Connection insight
      if (stats.completeFamilies > 0) {
        insights.push({
          id: 'family-connections',
          type: 'connection',
          title: 'Strong Family Connections',
          description: `${stats.completeFamilies} complete family units identified`,
          icon: Heart,
          color: 'green',
          priority: 'low'
        });
      }

      return insights;
    };

    const realStats = calculateRealStats();
    const realActivities = generateRealActivities();
    const familyInsights = generateFamilyInsights();

    setTimeout(() => {
      setStats(realStats);
      setRecentActivities(realActivities);
      setLoading(false);
    }, 1000);
  }, [persons]);

  const quickActions: QuickAction[] = [
    {
      id: 'add-member',
      title: 'Add Family Member',
      description: 'Add a new person to your family tree',
      icon: Users,
      color: 'blue',
      count: stats.totalMembers,
      badge: stats.growthRate > 0 ? '+' + stats.growthRate + '%' : undefined
    },
    {
      id: 'upload-photo',
      title: 'Upload Photos',
      description: 'Add family photos and memories',
      icon: Camera,
      color: 'green',
      count: stats.photos,
      badge: stats.photos > 0 ? 'New' : undefined
    },
    {
      id: 'dna-analysis',
      title: 'DNA Analysis',
      description: 'Discover genetic relationships',
      icon: Dna,
      color: 'purple',
      badge: dnaAnalyses.length > 0 ? 'Ready' : undefined
    },
    {
      id: 'view-tree',
      title: 'Family Tree',
      description: 'View complete family tree',
      icon: GitBranch,
      color: 'indigo',
      count: stats.completeFamilies
    },
    {
      id: 'analytics',
      title: 'Analytics',
      description: 'View family statistics',
      icon: BarChart3,
      color: 'orange',
      badge: analyticsData ? 'Updated' : undefined
    },
    {
      id: 'research',
      title: 'Research',
      description: 'Start new research task',
      icon: Search,
      color: 'teal',
      count: stats.activeResearchers
    }
  ];

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

  const getActivityIcon = (type: RecentActivity['type']) => {
    switch (type) {
      case 'added':
        return <Users className="w-4 h-4 text-green-600" />;
      case 'updated':
        return <Calendar className="w-4 h-4 text-blue-600" />;
      case 'connected':
        return <GitBranch className="w-4 h-4 text-purple-600" />;
      case 'photo_added':
        return <Camera className="w-4 h-4 text-amber-600" />;
      default:
        return <Activity className="w-4 h-4 text-gray-600" />;
    }
  };

  const getQuickActions = (color: string) => {
    const colors: Record<string, string> = {
      blue: 'bg-blue-500 hover:bg-blue-600',
      green: 'bg-green-500 hover:bg-green-600',
      purple: 'bg-purple-500 hover:bg-purple-600',
      indigo: 'bg-indigo-500 hover:bg-indigo-600',
      orange: 'bg-orange-500 hover:bg-orange-600'
    };
    return colors[color] || 'bg-gray-500 hover:bg-gray-600';
  };

  const getLightColorClasses = (color: string) => {
    const colors: Record<string, string> = {
      blue: 'bg-blue-50 text-blue-700 border-blue-200',
      green: 'bg-green-50 text-green-700 border-green-200',
      purple: 'bg-purple-50 text-purple-700 border-purple-200',
      indigo: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      orange: 'bg-orange-50 text-orange-700 border-orange-200'
    };
    return colors[color] || 'bg-gray-50 text-gray-700 border-gray-200';
  };

  const handleQuickAction = (actionId: string) => {
    switch (actionId) {
      case 'add-member':
        navigate('/persons');
        break;
      case 'upload-photo':
        setShowPhotoUpload(true);
        break;
      case 'dna-analysis':
        setShowDNAAnalysis(true);
        break;
      case 'generate-story':
        navigate('/stories');
        break;
      case 'view-tree':
        navigate('/tree');
        break;
      case 'analytics':
        setShowAnalytics(true);
        break;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div className="flex items-center text-green-600 text-sm font-medium">
              <ArrowUp className="w-4 h-4 mr-1" />
              12%
            </div>
          </div>
          <div className="text-3xl font-bold text-gray-900">{stats.totalMembers}</div>
          <div className="text-sm text-gray-600">Total Members</div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <GitBranch className="w-6 h-6 text-green-600" />
            </div>
            <div className="flex items-center text-green-600 text-sm font-medium">
              <ArrowUp className="w-4 h-4 mr-1" />
              8%
            </div>
          </div>
          <div className="text-3xl font-bold text-gray-900">{stats.completeFamilies}</div>
          <div className="text-sm text-gray-600">Complete Families</div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
            <div className="flex items-center text-green-600 text-sm font-medium">
              <ArrowUp className="w-4 h-4 mr-1" />
              5%
            </div>
          </div>
          <div className="text-3xl font-bold text-gray-900">{stats.rootMembers}</div>
          <div className="text-sm text-gray-600">Root Members</div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
              <Clock className="w-6 h-6 text-orange-600" />
            </div>
            <div className="flex items-center text-green-600 text-sm font-medium">
              <ArrowUp className="w-4 h-4 mr-1" />
              15%
            </div>
          </div>
          <div className="text-3xl font-bold text-gray-900">{stats.averageAge}</div>
          <div className="text-sm text-gray-600">Average Age</div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center">
              <MapPin className="w-6 h-6 text-indigo-600" />
            </div>
            <div className="flex items-center text-green-600 text-sm font-medium">
              <ArrowUp className="w-4 h-4 mr-1" />
              3%
            </div>
          </div>
          <div className="text-3xl font-bold text-gray-900">{stats.countries}</div>
          <div className="text-sm text-gray-600">Countries</div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.id}
                onClick={() => handleQuickAction(action.id)}
                className={getLightColorClasses(action.color)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center mb-3">
                      <Icon className="w-5 h-5 text-gray-700" />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{action.title}</div>
                      <div className="text-sm text-gray-600">{action.description}</div>
                    </div>
                  </div>
                  {action.count && (
                    <div className="text-2xl font-bold text-gray-900">{action.count}</div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
        <div className="space-y-3">
          {recentActivities.slice(0, 5).map((activity) => {
            const Icon = getActivityIcon(activity.type);
            return (
              <div key={activity.id} className="flex items-start gap-3">
                <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                  {Icon}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{activity.personName}</p>
                  <p className="text-xs text-gray-500">{formatTimeAgo(activity.timestamp)}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Toast Notifications */}
      <div className="fixed bottom-4 right-4 space-y-2 z-50">
        {toasts.map((toast) => {
          const Icon = toast.icon;
          return (
            <div
              key={toast.id}
              className={`p-4 rounded-lg shadow-lg border max-w-sm ${
                toast.type === 'success' ? 'bg-green-50 border-green-200' :
                toast.type === 'error' ? 'bg-red-50 border-red-200' :
                toast.type === 'warning' ? 'bg-yellow-50 border-yellow-200' :
                'bg-blue-50 border-blue-200'
              }`}
            >
              <div className="flex items-start gap-3">
                <Icon className="w-5 h-5 text-gray-600" />
                <div>
                  <p className="font-medium text-gray-900">{toast.title}</p>
                  <p className="text-sm text-gray-600">{toast.message}</p>
                </div>
                <button
                  onClick={() => removeToast(toast.id)}
                  className="ml-auto p-1 hover:bg-black hover:bg-opacity-10 rounded"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
