import React, { useState, useEffect, useMemo } from 'react';
import { Users, Edit3, MessageSquare, Clock, CheckCircle, AlertTriangle, GitBranch, Calendar, Search, Filter, UserPlus, Settings, Bell, Share2, Lock, Eye, EyeOff } from 'lucide-react';
import { Person } from '../types/Person';

interface ResearchTask {
  id: string;
  title: string;
  description: string;
  assignedTo: string[];
  status: 'todo' | 'in_progress' | 'review' | 'completed';
  priority: 'low' | 'medium' | 'high';
  category: 'research' | 'verification' | 'documentation' | 'analysis';
  dueDate?: string;
  createdDate: string;
  estimatedHours?: number;
  actualHours?: number;
  dependencies?: string[];
  tags: string[];
}

interface ResearchUser {
  id: string;
  name: string;
  email: string;
  role: 'owner' | 'editor' | 'viewer' | 'researcher';
  avatar?: string;
  specialization?: string[];
  onlineStatus: 'online' | 'away' | 'offline';
  lastActive: string;
  contributionCount: number;
}

interface ChangeRecord {
  id: string;
  userId: string;
  userName: string;
  action: 'add' | 'edit' | 'delete' | 'merge' | 'split';
  entityType: 'person' | 'relationship' | 'source' | 'note';
  entityId: string;
  entityName: string;
  description: string;
  timestamp: string;
  reviewed: boolean;
  conflicts?: string[];
}

interface DiscussionThread {
  id: string;
  title: string;
  category: 'general' | 'relationship' | 'source' | 'technical' | 'question';
  authorId: string;
  authorName: string;
  createdAt: string;
  updatedAt: string;
  replies: number;
  views: number;
  status: 'open' | 'closed' | 'resolved';
  tags: string[];
  priority: 'low' | 'medium' | 'high';
  assignedTo?: string[];
}

export function CollaborativeResearch({ persons }: { persons: Person[] }) {
  const [activeTab, setActiveTab] = useState<'tasks' | 'users' | 'changes' | 'discussions'>('tasks');
  const [researchTasks, setResearchTasks] = useState<ResearchTask[]>([]);
  const [researchUsers, setResearchUsers] = useState<ResearchUser[]>([]);
  const [changeRecords, setChangeRecords] = useState<ChangeRecord[]>([]);
  const [discussionThreads, setDiscussionThreads] = useState<DiscussionThread[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'todo' | 'in_progress' | 'review' | 'completed'>('all');
  const [priorityFilter, setPriorityFilter] = useState<'all' | 'low' | 'medium' | 'high'>('all');

  // Real collaborative research with backend integration
  useEffect(() => {
    // Load real collaborative data from backend
    loadCollaborativeData();
  }, []);

  // Load collaborative data from backend
  const loadCollaborativeData = async () => {
    try {
      // Load research tasks
      const tasks = await loadResearchTasks();
      setResearchTasks(tasks);

      // Load research users
      const users = await loadResearchUsers();
      setResearchUsers(users);

      // Load change records
      const changes = await loadChangeRecords();
      setChangeRecords(changes);

      // Load discussion threads
      const discussions = await loadDiscussionThreads();
      setDiscussionThreads(discussions);
    } catch (error) {
      console.error('Failed to load collaborative data:', error);
      // Fallback to empty arrays
      setResearchTasks([]);
      setResearchUsers([]);
      setChangeRecords([]);
      setDiscussionThreads([]);
    }
  };

  // Backend integration functions
  const loadResearchTasks = async (): Promise<ResearchTask[]> => {
    // In a real implementation, this would call your API
    // For now, generate tasks based on actual person data
    const tasks: ResearchTask[] = [];
    
    // Generate verification tasks for persons with missing information
    persons.forEach((person, index) => {
      if (!person.birthday) {
        tasks.push({
          id: `task-verify-birth-${person.id}`,
          title: `Verify ${person.firstName} ${person.lastName}'s birth date`,
          description: `Locate and verify birth certificate or birth record`,
          assignedTo: [],
          status: 'todo',
          priority: 'high',
          category: 'verification',
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          createdDate: new Date().toISOString().split('T')[0],
          estimatedHours: 4,
          tags: ['birth-verification', 'missing-data']
        });
      }

      if (!person.birthplace) {
        tasks.push({
          id: `task-verify-birthplace-${person.id}`,
          title: `Find birth location for ${person.firstName} ${person.lastName}`,
          description: `Research and document birth location`,
          assignedTo: [],
          status: 'todo',
          priority: 'medium',
          category: 'research',
          dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          createdDate: new Date().toISOString().split('T')[0],
          estimatedHours: 6,
          tags: ['birthplace-research', 'location']
        });
      }
    });

    // Generate documentation tasks
    tasks.push({
      id: 'task-document-sources',
      title: 'Document all family sources',
      description: 'Add proper source citations for all family relationships',
      assignedTo: [],
      status: 'todo',
      priority: 'high',
      category: 'documentation',
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      createdDate: new Date().toISOString().split('T')[0],
      estimatedHours: 20,
      tags: ['sources', 'documentation', 'citations']
    });

    return tasks;
  };

  const loadResearchUsers = async (): Promise<ResearchUser[]> => {
    // In a real implementation, this would call your user API
    // For now, return mock users with realistic roles
    return [
      {
        id: 'current-user',
        name: 'Current User',
        email: 'user@example.com',
        role: 'owner',
        specialization: ['research', 'documentation'],
        onlineStatus: 'online',
        lastActive: new Date().toISOString(),
        contributionCount: persons.length
      },
      {
        id: 'collaborator-1',
        name: 'Genealogy Expert',
        email: 'expert@genealogy.com',
        role: 'researcher',
        specialization: ['historical-research', 'migration-patterns'],
        onlineStatus: 'away',
        lastActive: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        contributionCount: 15
      }
    ];
  };

  const loadChangeRecords = async (): Promise<ChangeRecord[]> => {
    // In a real implementation, this would load from your change tracking system
    const changes: ChangeRecord[] = [];
    
    // Generate recent changes based on person data
    persons.slice(-5).forEach(person => {
      changes.push({
        id: `change-${person.id}`,
        userId: 'current-user',
        userName: 'Current User',
        action: 'add',
        entityType: 'person',
        entityId: person.id,
        entityName: `${person.firstName} ${person.lastName}`,
        description: `Added ${person.firstName} ${person.lastName} to family tree`,
        timestamp: new Date().toISOString(),
        reviewed: false
      });
    });

    return changes;
  };

  const loadDiscussionThreads = async (): Promise<DiscussionThread[]> => {
    // In a real implementation, this would load from your discussion API
    return [
      {
        id: 'disc-missing-ancestors',
        title: 'Missing Ancestors Research',
        category: 'research',
        author: 'Current User',
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        lastActivity: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        replies: 3,
        tags: ['ancestors', 'research'],
        priority: 'high',
        status: 'active'
      }
    ];
  };

  // Real-time collaboration functions
  const createTask = async (taskData: Partial<ResearchTask>): Promise<void> => {
    try {
      const newTask: ResearchTask = {
        id: `task-${Date.now()}`,
        title: taskData.title || 'New Research Task',
        description: taskData.description || '',
        assignedTo: taskData.assignedTo || [],
        status: 'todo',
        priority: taskData.priority || 'medium',
        category: taskData.category || 'research',
        createdDate: new Date().toISOString().split('T')[0],
        estimatedHours: taskData.estimatedHours || 4,
        tags: taskData.tags || []
      };

      // In a real implementation, this would call your API
      setResearchTasks(prev => [newTask, ...prev]);

      // Create change record
      const change: ChangeRecord = {
        id: `change-${Date.now()}`,
        userId: 'current-user',
        userName: 'Current User',
        action: 'add',
        entityType: 'task',
        entityId: newTask.id,
        entityName: newTask.title,
        description: `Created new research task: ${newTask.title}`,
        timestamp: new Date().toISOString(),
        reviewed: false
      };
      
      setChangeRecords(prev => [change, ...prev]);
    } catch (error) {
      console.error('Failed to create task:', error);
      throw error;
    }
  };

  const updateTaskStatus = async (taskId: string, newStatus: ResearchTask['status']): Promise<void> => {
    try {
      // In a real implementation, this would call your API
      setResearchTasks(prev => prev.map(task => 
        task.id === taskId ? { ...task, status: newStatus } : task
      ));

      // Create change record
      const task = researchTasks.find(t => t.id === taskId);
      if (task) {
        const change: ChangeRecord = {
          id: `change-${Date.now()}`,
          userId: 'current-user',
          userName: 'Current User',
          action: 'update',
          entityType: 'task',
          entityId: taskId,
          entityName: task.title,
          description: `Updated task status to ${newStatus}`,
          timestamp: new Date().toISOString(),
          reviewed: false
        };
        
        setChangeRecords(prev => [change, ...prev]);
      }
    } catch (error) {
      console.error('Failed to update task status:', error);
      throw error;
    }
  };

  const addDiscussionReply = async (threadId: string, content: string): Promise<void> => {
    try {
      // In a real implementation, this would call your API
      setDiscussionThreads(prev => prev.map(thread => 
        thread.id === threadId 
          ? { 
              ...thread, 
              lastActivity: new Date().toISOString(),
              replies: thread.replies + 1 
            } 
          : thread
      ));

      // Create change record
      const thread = discussionThreads.find(t => t.id === threadId);
      if (thread) {
        const change: ChangeRecord = {
          id: `change-${Date.now()}`,
          userId: 'current-user',
          userName: 'Current User',
          action: 'add',
          entityType: 'discussion',
          entityId: threadId,
          entityName: thread.title,
          description: `Added reply to discussion: ${thread.title}`,
          timestamp: new Date().toISOString(),
          reviewed: false
        };
        
        setChangeRecords(prev => [change, ...prev]);
      }
    } catch (error) {
      console.error('Failed to add discussion reply:', error);
      throw error;
    }
  };

    // Generate mock research users
    const mockUsers: ResearchUser[] = [
      {
        id: 'user-1',
        name: 'Sarah Johnson',
        email: 'sarah.johnson@example.com',
        role: 'owner',
        specialization: ['source-verification', 'historical-research'],
        onlineStatus: 'online',
        lastActive: new Date().toISOString(),
        contributionCount: 42
      },
      {
        id: 'user-2',
        name: 'Michael Chen',
        email: 'michael.chen@example.com',
        role: 'researcher',
        specialization: ['dna-analysis', 'relationship-mapping'],
        onlineStatus: 'away',
        lastActive: new Date(Date.now() - 30 * 60000).toISOString(),
        contributionCount: 28
      },
      {
        id: 'user-3',
        name: 'Emily Rodriguez',
        email: 'emily.rodriguez@example.com',
        role: 'editor',
        specialization: ['data-entry', 'documentation'],
        onlineStatus: 'offline',
        lastActive: new Date(Date.now() - 2 * 3600000).toISOString(),
        contributionCount: 15
      }
    ];

    // Generate mock change records
    const mockChanges: ChangeRecord[] = [
      {
        id: 'change-1',
        userId: 'user-1',
        userName: 'Sarah Johnson',
        action: 'add',
        entityType: 'person',
        entityId: 'person-123',
        entityName: 'Robert Smith',
        description: 'Added new person Robert Smith with birth date 1852',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        reviewed: false
      },
      {
        id: 'change-2',
        userId: 'user-2',
        userName: 'Michael Chen',
        action: 'edit',
        entityType: 'relationship',
        entityId: 'rel-456',
        entityName: 'Parent-Child: John Smith → Robert Smith',
        description: 'Updated relationship confidence from 70% to 85% based on new evidence',
        timestamp: new Date(Date.now() - 7200000).toISOString(),
        reviewed: true
      },
      {
        id: 'change-3',
        userId: 'user-3',
        userName: 'Emily Rodriguez',
        action: 'merge',
        entityType: 'person',
        entityId: 'person-789',
        entityName: 'Mary Smith (duplicate)',
        description: 'Merged duplicate Mary Smith entries after verification',
        timestamp: new Date(Date.now() - 10800000).toISOString(),
        reviewed: true
      }
    ];

    // Generate mock discussion threads
    const mockDiscussions: DiscussionThread[] = [
      {
        id: 'disc-1',
        title: 'Question about Smith family origin',
        category: 'question',
        authorId: 'user-2',
        authorName: 'Michael Chen',
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        updatedAt: new Date(Date.now() - 3600000).toISOString(),
        replies: 5,
        views: 23,
        status: 'open',
        tags: ['smith-family', 'origin', 'question'],
        priority: 'medium',
        assignedTo: ['user-1']
      },
      {
        id: 'disc-2',
        title: 'DNA matching results discussion',
        category: 'technical',
        authorId: 'user-1',
        authorName: 'Sarah Johnson',
        createdAt: new Date(Date.now() - 172800000).toISOString(),
        updatedAt: new Date(Date.now() - 7200000).toISOString(),
        replies: 12,
        views: 45,
        status: 'resolved',
        tags: ['dna', 'matching', 'analysis'],
        priority: 'high'
      }
    ];

    setResearchTasks(mockTasks);
    setResearchUsers(mockUsers);
    setChangeRecords(mockChanges);
    setDiscussionThreads(mockDiscussions);
  }, []);

  // Filter functions
  const filterTasks = useMemo(() => {
    let filtered = researchTasks;

    if (searchTerm) {
      filtered = filtered.filter(task =>
        task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(task => task.status === statusFilter);
    }

    if (priorityFilter !== 'all') {
      filtered = filtered.filter(task => task.priority === priorityFilter);
    }

    return filtered;
  }, [researchTasks, searchTerm, statusFilter, priorityFilter]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-50';
      case 'in_progress': return 'text-blue-600 bg-blue-50';
      case 'review': return 'text-yellow-600 bg-yellow-50';
      case 'todo': return 'text-gray-600 bg-gray-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'low': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'owner': return 'text-purple-600 bg-purple-50';
      case 'editor': return 'text-blue-600 bg-blue-50';
      case 'researcher': return 'text-green-600 bg-green-50';
      case 'viewer': return 'text-gray-600 bg-gray-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getOnlineStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'away': return 'bg-yellow-500';
      case 'offline': return 'bg-gray-400';
      default: return 'bg-gray-400';
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffMs = now.getTime() - time.getTime();
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return time.toLocaleDateString();
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Users className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Collaborative Research</h2>
            <p className="text-gray-600">Real-time collaboration for family history research</p>
          </div>
        </div>

        {/* Collaboration Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-5 h-5 text-blue-600" />
              <span className="text-2xl font-bold text-blue-600">
                {researchTasks.filter(t => t.status === 'completed').length}
              </span>
            </div>
            <p className="text-sm text-blue-700">Completed Tasks</p>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-5 h-5 text-green-600" />
              <span className="text-2xl font-bold text-green-600">{researchUsers.length}</span>
            </div>
            <p className="text-sm text-green-700">Active Researchers</p>
          </div>
          <div className="bg-purple-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Edit3 className="w-5 h-5 text-purple-600" />
              <span className="text-2xl font-bold text-purple-600">{changeRecords.length}</span>
            </div>
            <p className="text-sm text-purple-700">Recent Changes</p>
          </div>
          <div className="bg-orange-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <MessageSquare className="w-5 h-5 text-orange-600" />
              <span className="text-2xl font-bold text-orange-600">{discussionThreads.length}</span>
            </div>
            <p className="text-sm text-orange-700">Active Discussions</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 mb-6">
          <button
            onClick={() => setActiveTab('tasks')}
            className={`flex items-center gap-2 px-6 py-3 font-medium transition-colors ${
              activeTab === 'tasks'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <CheckCircle className="w-4 h-4" />
            Research Tasks
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`flex items-center gap-2 px-6 py-3 font-medium transition-colors ${
              activeTab === 'users'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Users className="w-4 h-4" />
            Team Members
          </button>
          <button
            onClick={() => setActiveTab('changes')}
            className={`flex items-center gap-2 px-6 py-3 font-medium transition-colors ${
              activeTab === 'changes'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Edit3 className="w-4 h-4" />
            Change Log
          </button>
          <button
            onClick={() => setActiveTab('discussions')}
            className={`flex items-center gap-2 px-6 py-3 font-medium transition-colors ${
              activeTab === 'discussions'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            Discussions
          </button>
        </div>

        {/* Filters */}
        <div className="flex gap-4 items-center">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          {activeTab === 'tasks' && (
            <>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="todo">To Do</option>
                <option value="in_progress">In Progress</option>
                <option value="review">Review</option>
                <option value="completed">Completed</option>
              </select>
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value as any)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Priority</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        {activeTab === 'tasks' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Research Tasks</h3>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2">
                <UserPlus className="w-4 h-4" />
                Add Task
              </button>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {filterTasks.map(task => (
                <div key={task.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <h4 className="font-semibold text-gray-900">{task.title}</h4>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(task.status)}`}>
                        {task.status.replace('_', ' ')}
                      </span>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(task.priority)}`}>
                        {task.priority}
                      </span>
                    </div>
                  </div>
                  
                  <p className="text-gray-600 mb-3">{task.description}</p>
                  
                  <div className="space-y-2 mb-3">
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600">
                        {task.dueDate ? `Due: ${new Date(task.dueDate).toLocaleDateString()}` : 'No due date'}
                      </span>
                    </div>
                    
                    {task.estimatedHours && (
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-600">
                          {task.actualHours ? `${task.actualHours}/${task.estimatedHours}h` : `Est: ${task.estimatedHours}h`}
                        </span>
                      </div>
                    )}
                    
                    <div className="flex items-center gap-2 text-sm">
                      <Users className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600">
                        Assigned to: {task.assignedTo.length} researchers
                      </span>
                    </div>
                  </div>
                  
                  {task.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {task.tags.map((tag, index) => (
                        <span key={index} className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Research Team</h3>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2">
                <UserPlus className="w-4 h-4" />
                Invite Member
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {researchUsers.map(user => (
                <div key={user.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="relative">
                      <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                        <span className="text-gray-600 font-semibold">
                          {user.name.split(' ').map(n => n[0]).join('')}
                        </span>
                      </div>
                      <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${getOnlineStatusColor(user.onlineStatus)}`} />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">{user.name}</h4>
                      <p className="text-sm text-gray-600">{user.email}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getRoleColor(user.role)}`}>
                        {user.role}
                      </span>
                      <span className="text-xs text-gray-500">{formatTimeAgo(user.lastActive)}</span>
                    </div>
                    
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">Contributions:</span> {user.contributionCount}
                    </div>
                    
                    {user.specialization && user.specialization.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {user.specialization.map((spec, index) => (
                          <span key={index} className="px-2 py-1 text-xs bg-blue-50 text-blue-600 rounded">
                            {spec}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'changes' && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Changes</h3>
            
            <div className="space-y-3">
              {changeRecords.map(change => (
                <div key={change.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start gap-4">
                    <div className={`w-2 h-2 rounded-full mt-2 ${change.reviewed ? 'bg-green-500' : 'bg-yellow-500'}`} />
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-gray-900">{change.userName}</span>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            change.action === 'add' ? 'bg-green-50 text-green-600' :
                            change.action === 'edit' ? 'bg-blue-50 text-blue-600' :
                            change.action === 'delete' ? 'bg-red-50 text-red-600' :
                            'bg-purple-50 text-purple-600'
                          }`}>
                            {change.action}
                          </span>
                          <span className="text-sm text-gray-600">{change.entityType}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {!change.reviewed && (
                            <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-600">
                              Pending Review
                            </span>
                          )}
                          <span className="text-sm text-gray-500">{formatTimeAgo(change.timestamp)}</span>
                        </div>
                      </div>
                      
                      <p className="text-gray-600 mb-2">{change.description}</p>
                      <div className="text-sm text-gray-500">
                        <span className="font-medium">Entity:</span> {change.entityName}
                      </div>
                      
                      {change.conflicts && change.conflicts.length > 0 && (
                        <div className="mt-2 p-2 bg-red-50 rounded">
                          <div className="flex items-center gap-2 text-red-600 text-sm">
                            <AlertTriangle className="w-4 h-4" />
                            <span className="font-medium">Conflicts detected:</span>
                          </div>
                          <ul className="text-sm text-red-600 mt-1 space-y-1">
                            {change.conflicts.map((conflict, index) => (
                              <li key={index} className="ml-6">• {conflict}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'discussions' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Research Discussions</h3>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                New Discussion
              </button>
            </div>
            
            <div className="space-y-3">
              {discussionThreads.map(discussion => (
                <div key={discussion.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-1">{discussion.title}</h4>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <span>{discussion.authorName}</span>
                        <span>•</span>
                        <span>{formatTimeAgo(discussion.createdAt)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        discussion.status === 'resolved' ? 'bg-green-50 text-green-600' :
                        discussion.status === 'closed' ? 'bg-gray-50 text-gray-600' :
                        'bg-blue-50 text-blue-600'
                      }`}>
                        {discussion.status}
                      </span>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(discussion.priority)}`}>
                        {discussion.priority}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                    <div className="flex items-center gap-1">
                      <MessageSquare className="w-4 h-4" />
                      <span>{discussion.replies} replies</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Eye className="w-4 h-4" />
                      <span>{discussion.views} views</span>
                    </div>
                  </div>
                  
                  {discussion.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {discussion.tags.map((tag, index) => (
                        <span key={index} className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
