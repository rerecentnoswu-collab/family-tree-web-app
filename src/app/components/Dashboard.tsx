import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Person } from '../types/Person';
import { DashboardSkeleton } from './ui/SkeletonLoader';
import { 
  Users, 
  Plus,
  GitBranch, 
  Camera, 
  Dna, 
  TrendingUp, 
  Search, 
  Clock, 
  Activity, 
  Calendar, 
  MapPin, 
  Heart, 
  BarChart3, 
  X, 
  ArrowUp, 
  Eye,
  Grid,
  List
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

export function Dashboard({ persons, onPersonAdded: _ }: DashboardProps) {
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
  const [_uploadingPhoto, setUploadingPhoto] = useState(false);
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
        growthRate: stats.growthRate,
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

  // Enhanced stats calculation with growth rate and additional metrics
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

    const realStats = calculateRealStats();
    const realActivities = generateRealActivities();

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
      case 'dna_completed':
        return <Dna className="w-4 h-4 text-indigo-600" />;
      case 'research_started':
        return <Search className="w-4 h-4 text-teal-600" />;
      default:
        return <Activity className="w-4 h-4 text-gray-600" />;
    }
  };

  const getPriorityColor = (priority?: 'high' | 'medium' | 'low') => {
    switch (priority) {
      case 'high':
        return 'text-red-600 bg-red-50';
      case 'medium':
        return 'text-yellow-600 bg-yellow-50';
      case 'low':
        return 'text-green-600 bg-green-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getLightColorClasses = (color: string) => {
    const colors: Record<string, string> = {
      blue: 'bg-blue-50 text-blue-700 border-blue-200',
      green: 'bg-green-50 text-green-700 border-green-200',
      purple: 'bg-purple-50 text-purple-700 border-purple-200',
      indigo: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      orange: 'bg-orange-50 text-orange-700 border-orange-200',
      teal: 'bg-teal-50 text-teal-700 border-teal-200'
    };
    return colors[color] || 'bg-gray-50 text-gray-700 border-gray-200';
  };

  const handleQuickAction = (actionId: string) => {
    console.log('🔥 Quick Action clicked:', actionId);
    
    switch (actionId) {
      case 'add-member':
        console.log('📍 Navigating to /persons');
        navigate('/persons');
        break;
      case 'upload-photo':
        console.log('📷 Opening photo upload');
        setShowPhotoUpload(true);
        break;
      case 'dna-analysis':
        console.log('🧬 Opening DNA analysis');
        setShowDNAAnalysis(true);
        break;
      case 'generate-story':
        console.log('📖 Navigating to /stories');
        navigate('/stories');
        break;
      case 'view-tree':
        console.log('🌳 Navigating to /tree');
        navigate('/tree');
        break;
      case 'analytics':
        console.log('📊 Opening analytics');
        setShowAnalytics(true);
        break;
      case 'research':
        console.log('🔍 Navigating to /research');
        navigate('/research');
        break;
      default:
        console.log('❓ Unknown action:', actionId);
    }
  };

  if (loading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Enhanced Header with Time Range Selector */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Family Dashboard</h2>
            <p className="text-gray-600">Welcome back! Here's your family tree overview</p>
          </div>
          <div className="flex items-center space-x-4">
            <select
              value={selectedTimeRange}
              onChange={(e) => setSelectedTimeRange(e.target.value as 'week' | 'month' | 'year')}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="week">Last Week</option>
              <option value="month">Last Month</option>
              <option value="year">Last Year</option>
            </select>
            <button
              onClick={() => setShowInsights(!showInsights)}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <Eye className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Enhanced Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all duration-200 hover:scale-105">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div className="flex items-center space-x-2">
              {stats.growthRate > 0 && (
                <div className="flex items-center text-green-600 text-sm font-medium">
                  <ArrowUp className="w-4 h-4 mr-1" />
                  {stats.growthRate}%
                </div>
              )}
            </div>
          </div>
          <div className="text-3xl font-bold text-gray-900">{stats.totalMembers}</div>
          <div className="text-sm text-gray-600">Total Members</div>
          <div className="mt-2 text-xs text-blue-600 font-medium">+2 this month</div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all duration-200 hover:scale-105">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center">
              <GitBranch className="w-6 h-6 text-white" />
            </div>
            <div className="flex items-center text-green-600 text-sm font-medium">
              <ArrowUp className="w-4 h-4 mr-1" />
              8%
            </div>
          </div>
          <div className="text-3xl font-bold text-gray-900">{stats.completeFamilies}</div>
          <div className="text-sm text-gray-600">Complete Families</div>
          <div className="mt-2 text-xs text-green-600 font-medium">+1 this month</div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all duration-200 hover:scale-105">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div className="flex items-center text-green-600 text-sm font-medium">
              <ArrowUp className="w-4 h-4 mr-1" />
              5%
            </div>
          </div>
          <div className="text-3xl font-bold text-gray-900">{stats.rootMembers}</div>
          <div className="text-sm text-gray-600">Root Members</div>
          <div className="mt-2 text-xs text-purple-600 font-medium">Found 3 new</div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all duration-200 hover:scale-105">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center">
              <Clock className="w-6 h-6 text-white" />
            </div>
            <div className="flex items-center text-green-600 text-sm font-medium">
              <ArrowUp className="w-4 h-4 mr-1" />
              15%
            </div>
          </div>
          <div className="text-3xl font-bold text-gray-900">{stats.averageAge}</div>
          <div className="text-sm text-gray-600">Average Age</div>
          <div className="mt-2 text-xs text-orange-600 font-medium">Updated</div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all duration-200 hover:scale-105">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center">
              <MapPin className="w-6 h-6 text-white" />
            </div>
            <div className="flex items-center text-green-600 text-sm font-medium">
              <ArrowUp className="w-4 h-4 mr-1" />
              3%
            </div>
          </div>
          <div className="text-3xl font-bold text-gray-900">{stats.countries}</div>
          <div className="text-sm text-gray-600">Countries</div>
          <div className="mt-2 text-xs text-indigo-600 font-medium">+1 new</div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all duration-200 hover:scale-105">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-teal-600 rounded-xl flex items-center justify-center">
              <Camera className="w-6 h-6 text-white" />
            </div>
            <div className="flex items-center text-green-600 text-sm font-medium">
              <ArrowUp className="w-4 h-4 mr-1" />
              12%
            </div>
          </div>
          <div className="text-3xl font-bold text-gray-900">{stats.photos}</div>
          <div className="text-sm text-gray-600">Photos</div>
          <div className="mt-2 text-xs text-teal-600 font-medium">23 new uploads</div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all duration-200 hover:scale-105">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-rose-500 to-rose-600 rounded-xl flex items-center justify-center">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <div className="flex items-center text-green-600 text-sm font-medium">
              <ArrowUp className="w-4 h-4 mr-1" />
              Active
            </div>
          </div>
          <div className="text-3xl font-bold text-gray-900">{stats.activeResearchers}</div>
          <div className="text-sm text-gray-600">Researchers</div>
          <div className="mt-2 text-xs text-rose-600 font-medium">Online now</div>
        </div>
      </div>

      {/* Enhanced Quick Actions */}
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
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.id}
                onClick={() => handleQuickAction(action.id)}
                className={getLightColorClasses(action.color) + ' p-4 text-left hover:shadow-lg transition-all duration-200 group'}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Icon className="w-6 h-6 text-gray-700" />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">{action.title}</div>
                      <div className="text-sm text-gray-600">{action.description}</div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end space-y-1">
                    {action.count && (
                      <div className="text-2xl font-bold text-gray-900">{action.count}</div>
                    )}
                    {action.badge && (
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                        {action.badge}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Enhanced Recent Activity Feed */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
          <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
            View All
          </button>
        </div>
        <div className="space-y-4">
          {recentActivities.slice(0, 5).map((activity) => {
            const Icon = getActivityIcon(activity.type);
            return (
              <div key={activity.id} className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm">
                  {Icon}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{activity.personName}</p>
                      <p className="text-sm text-gray-600">{activity.details}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      {activity.priority && (
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(activity.priority)}`}>
                          {activity.priority}
                        </span>
                      )}
                      <span className="text-xs text-gray-500">{formatTimeAgo(activity.timestamp)}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Family Insights Section */}
      {showInsights && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Family Insights</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              {
                id: 'milestone',
                title: 'Family Growing',
                description: `Added ${stats.growthRate}% new members this month`,
                icon: TrendingUp,
                color: 'green'
              },
              {
                id: 'research',
                title: 'Research Progress',
                description: `${stats.pendingTasks} research tasks pending`,
                icon: Search,
                color: 'blue'
              },
              {
                id: 'connections',
                title: 'New Connections',
                description: '3 potential family relationships found',
                icon: Heart,
                color: 'purple'
              },
              {
                id: 'photos',
                title: 'Photo Updates',
                description: '23 new photos uploaded this week',
                icon: Camera,
                color: 'orange'
              }
            ].map((insight) => {
              const Icon = insight.icon;
              return (
                <div key={insight.id} className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 bg-${insight.color}-100 rounded-lg flex items-center justify-center`}>
                      <Icon className={`w-5 h-5 text-${insight.color}-600`} />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{insight.title}</p>
                      <p className="text-sm text-gray-600">{insight.description}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Photo Upload Modal */}
      {showPhotoUpload && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-gray-900">Upload Family Photos</h3>
                <button
                  onClick={() => setShowPhotoUpload(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors">
                <Camera className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h4 className="text-lg font-medium text-gray-900 mb-2">Upload Photos</h4>
                <p className="text-gray-600 mb-4">Drag and drop photos here, or click to browse</p>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  className="hidden"
                  id="photo-upload"
                  onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) {
                      handlePhotoUpload(e.target.files);
                    }
                  }}
                />
                <label
                  htmlFor="photo-upload"
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Select Photos
                </label>
              </div>
              
              {uploadedPhotos.length > 0 && (
                <div className="mt-6">
                  <h4 className="font-medium text-gray-900 mb-3">Recently Uploaded</h4>
                  <div className="grid grid-cols-3 gap-4">
                    {uploadedPhotos.slice(-6).map((photo) => (
                      <div key={photo.id} className="relative group">
                        <img
                          src={photo.url}
                          alt={photo.name}
                          className="w-full h-24 object-cover rounded-lg"
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                          <span className="text-white text-xs">{photo.name}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* DNA Analysis Modal */}
      {showDNAAnalysis && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-gray-900">DNA Analysis</h3>
                <button
                  onClick={() => setShowDNAAnalysis(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <div className="text-center py-8">
                <Dna className="w-16 h-16 text-blue-600 mx-auto mb-4" />
                <h4 className="text-lg font-medium text-gray-900 mb-2">Discover Genetic Relationships</h4>
                <p className="text-gray-600 mb-6">
                  Analyze DNA data to find genetic connections between family members
                </p>
                
                {dnaAnalyses.length > 0 && (
                  <div className="mb-6">
                    <h4 className="font-medium text-gray-900 mb-3">Previous Analyses</h4>
                    <div className="space-y-3">
                      {dnaAnalyses.slice(-3).map((analysis) => (
                        <div key={analysis.id} className="p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium text-gray-900">
                                {analysis.relationships.length} Relationships Found
                              </p>
                              <p className="text-sm text-gray-600">
                                Confidence: {Math.round(analysis.confidence * 100)}%
                              </p>
                            </div>
                            <div className="text-sm text-gray-500">
                              {new Date(analysis.completedAt).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                <button
                  onClick={handleDNAAnalysis}
                  disabled={analyzingDNA}
                  className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {analyzingDNA ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Dna className="w-4 h-4 mr-2" />
                      Start Analysis
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Analytics Modal */}
      {showAnalytics && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-gray-900">Family Analytics</h3>
                <button
                  onClick={() => setShowAnalytics(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>
            
            <div className="p-6">
              {analyticsData ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">{analyticsData.totalMembers}</div>
                      <div className="text-sm text-blue-700">Total Members</div>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">{analyticsData.averageAge}</div>
                      <div className="text-sm text-green-700">Average Age</div>
                    </div>
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">{analyticsData.countries}</div>
                      <div className="text-sm text-purple-700">Countries</div>
                    </div>
                    <div className="text-center p-4 bg-orange-50 rounded-lg">
                      <div className="text-2xl font-bold text-orange-600">{analyticsData.photos}</div>
                      <div className="text-sm text-orange-700">Photos</div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Gender Distribution</h4>
                    <div className="space-y-2">
                      <div className="flex items-center">
                        <span className="w-20 text-sm text-gray-600">Male</span>
                        <div className="flex-1 bg-gray-200 rounded-full h-4 ml-2">
                          <div 
                            className="bg-blue-500 h-4 rounded-full" 
                            style={{ width: `${(analyticsData.genderDistribution.male / analyticsData.totalMembers) * 100}%` }}
                          ></div>
                        </div>
                        <span className="ml-2 text-sm text-gray-900">{analyticsData.genderDistribution.male}</span>
                      </div>
                      <div className="flex items-center">
                        <span className="w-20 text-sm text-gray-600">Female</span>
                        <div className="flex-1 bg-gray-200 rounded-full h-4 ml-2">
                          <div 
                            className="bg-pink-500 h-4 rounded-full" 
                            style={{ width: `${(analyticsData.genderDistribution.female / analyticsData.totalMembers) * 100}%` }}
                          ></div>
                        </div>
                        <span className="ml-2 text-sm text-gray-900">{analyticsData.genderDistribution.female}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Age Groups</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {analyticsData.ageGroups.map((group) => (
                        <div key={group.range} className="p-3 bg-gray-50 rounded-lg text-center">
                          <div className="text-lg font-semibold text-gray-900">{group.count}</div>
                          <div className="text-sm text-gray-600">{group.range}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h4 className="text-lg font-medium text-gray-900 mb-2">No Analytics Data</h4>
                  <p className="text-gray-600 mb-4">
                    Generate family analytics to see detailed statistics
                  </p>
                  <button
                    onClick={loadAnalytics}
                    disabled={loadingAnalytics}
                    className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loadingAnalytics ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                        Loading...
                      </>
                    ) : (
                      <>
                        <BarChart3 className="w-4 h-4 mr-2" />
                        Generate Analytics
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Toast Notifications */}
      <div className="fixed bottom-4 right-4 space-y-2 z-50">
        {toasts.map((toast) => {
          const Icon = toast.icon;
          return (
            <div
              key={toast.id}
              className={`p-4 rounded-lg shadow-lg border max-w-sm transform transition-all duration-300 ${
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
