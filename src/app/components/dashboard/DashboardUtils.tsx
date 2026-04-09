import { useMemo } from 'react';
import { Person } from '../../types/Person';

export interface DashboardStats {
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

export interface ActivityItem {
  id: string;
  type: 'added' | 'updated' | 'connected' | 'photo_added' | 'dna_completed' | 'research_started';
  personName: string;
  timestamp: Date;
  details: string;
  priority?: 'high' | 'medium' | 'low';
}

export interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  color: string;
  count?: number;
  badge?: string;
}

export const useDashboardData = (persons: Person[]) => {
  const stats = useMemo((): DashboardStats => {
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

    // Mock other stats
    const growthRate = 12.5;
    const activeResearchers = Math.floor(totalMembers * 0.15);
    const pendingTasks = Math.floor(totalMembers * 0.2);
    const recentActivity = Math.min(totalMembers, 10); // Show up to 10 recent activities

    return {
      totalMembers,
      completeFamilies,
      rootMembers,
      recentActivity,
      averageAge,
      oldestGeneration,
      countries: uniqueBirthplaces,
      photos,
      growthRate,
      activeResearchers,
      pendingTasks
    };
  }, [persons]);

  const recentActivities = useMemo((): ActivityItem[] => {
    if (!persons || persons.length === 0) {
      return [];
    }

    // Generate activities based on actual person data
    const activities: ActivityItem[] = [];
    
    // Add activities for recently added persons (mock recent for demo)
    const recentPersons = persons.slice(-5).reverse();
    
    recentPersons.forEach((person, index) => {
      const activityType = index === 0 ? 'added' : 'connected';
      const timestamp = new Date(Date.now() - (index * 2 * 60 * 60 * 1000)); // Every 2 hours
      
      let details = '';
      if (activityType === 'added') {
        details = `Added to family tree`;
        if (person.motherId || person.fatherId) {
          const parent = persons.find(p => p.id === person.motherId || p.id === person.fatherId);
          if (parent) {
            details += ` as child of ${parent.firstName} ${parent.lastName}`;
          }
        }
      } else {
        details = `Connected to family members`;
      }

      activities.push({
        id: `activity-${person.id}`,
        type: activityType,
        personName: `${person.firstName} ${person.lastName}`,
        timestamp,
        details,
        priority: index === 0 ? 'high' : index < 3 ? 'medium' : 'low'
      });
    });

    return activities;
  }, [persons]);

  const quickActions = useMemo((): QuickAction[] => {
    return [
      {
        id: 'add-member',
        title: 'Add Family Member',
        description: 'Add a new person to your family tree',
        icon: require('lucide-react').Users,
        color: 'blue',
        count: stats.totalMembers
      },
      {
        id: 'view-tree',
        title: 'View Family Tree',
        description: 'Visualize family connections',
        icon: require('lucide-react').GitBranch,
        color: 'green',
        count: stats.completeFamilies
      },
      {
        id: 'upload-photo',
        title: 'Upload Photos',
        description: 'Add and tag family photos',
        icon: require('lucide-react').Camera,
        color: 'purple',
        count: stats.photos,
        badge: 'New'
      },
      {
        id: 'dna-analysis',
        title: 'DNA Analysis',
        description: 'Discover genetic relationships',
        icon: require('lucide-react').Dna,
        color: 'indigo'
      },
      {
        id: 'generate-story',
        title: 'Generate Stories',
        description: 'Create AI-powered family narratives',
        icon: require('lucide-react').Sparkles,
        color: 'amber'
      },
      {
        id: 'analytics',
        title: 'Analytics',
        description: 'View family statistics and insights',
        icon: require('lucide-react').BarChart3,
        color: 'orange'
      }
    ];
  }, [stats]);

  return { stats, recentActivities, quickActions };
};
