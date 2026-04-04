import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  Home, 
  Users, 
  GitBranch, 
  BookOpen, 
  Clock, 
  Camera, 
  Dna, 
  FileText, 
  BarChart3, 
  Network, 
  Search, 
  Shield, 
  Library, 
  Archive, 
  Menu, 
  X, 
  Bell, 
  Settings, 
  User, 
  LogOut,
  ChevronDown,
  Sparkles
} from 'lucide-react';

interface AppLayoutProps {
  children: React.ReactNode;
  signOut: () => void;
  user: any;
}

interface NavigationItem {
  id: string;
  label: string;
  icon: React.ElementType;
  path: string;
  badge?: number;
  description?: string;
  category?: 'main' | 'tools' | 'settings';
}

export function AppLayout({ children, signOut, user }: AppLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const navigationItems: NavigationItem[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: Home,
      path: '/dashboard',
      description: 'Overview and insights',
      category: 'main'
    },
    {
      id: 'persons',
      label: 'Family Members',
      icon: Users,
      path: '/persons',
      description: 'Manage family records',
      category: 'main'
    },
    {
      id: 'tree',
      label: 'Family Tree',
      icon: GitBranch,
      path: '/tree',
      description: 'Visualize connections',
      category: 'main'
    },
    {
      id: 'timeline',
      label: 'Timeline',
      icon: Clock,
      path: '/timeline',
      description: 'Historical events',
      category: 'main'
    },
    {
      id: 'photos',
      label: 'Photos',
      icon: Camera,
      path: '/photos',
      description: 'Family memories',
      category: 'main'
    },
    {
      id: 'stories',
      label: 'Stories',
      icon: BookOpen,
      path: '/stories',
      description: 'Family narratives',
      category: 'main'
    },
    {
      id: 'dna',
      label: 'DNA Analysis',
      icon: Dna,
      path: '/dna',
      description: 'Genetic insights',
      category: 'tools'
    },
    {
      id: 'documents',
      label: 'Documents',
      icon: FileText,
      path: '/documents',
      description: 'Important records',
      category: 'tools'
    },
    {
      id: 'analytics',
      label: 'Analytics',
      icon: BarChart3,
      path: '/analytics',
      description: 'Data insights',
      category: 'tools'
    },
    {
      id: 'relationships',
      label: 'Relationships',
      icon: Network,
      path: '/relationships',
      description: 'Connection mapping',
      category: 'tools'
    },
    {
      id: 'research',
      label: 'Research',
      icon: Search,
      path: '/research',
      description: 'Genealogy tools',
      category: 'tools'
    },
    {
      id: 'privacy',
      label: 'Privacy',
      icon: Shield,
      path: '/privacy',
      description: 'Security settings',
      category: 'settings'
    },
    {
      id: 'sources',
      label: 'Sources',
      icon: Library,
      path: '/sources',
      description: 'Citations & records',
      category: 'settings'
    },
    {
      id: 'backup',
      label: 'Backup',
      icon: Archive,
      path: '/backup',
      description: 'Data protection',
      category: 'settings'
    }
  ];

  const currentPage = navigationItems.find(item => item.path === location.pathname) || navigationItems[0];

  const handleNavigation = (path: string) => {
    navigate(path);
    setMobileSidebarOpen(false);
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuOpen) setUserMenuOpen(false);
      if (notificationsOpen) setNotificationsOpen(false);
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [userMenuOpen, notificationsOpen]);

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile Sidebar Overlay */}
      {mobileSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        ${sidebarOpen ? 'w-64' : 'w-20'} 
        ${mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'} 
        lg:translate-x-0
        fixed lg:relative 
        bg-white border-r border-gray-200 
        transition-all duration-300 ease-in-out 
        z-50 
        h-screen 
        flex flex-col
      `}>
        {/* Sidebar Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className={`flex items-center ${!sidebarOpen && 'justify-center'}`}>
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <GitBranch className="w-5 h-5 text-white" />
            </div>
            {sidebarOpen && (
              <span className="ml-3 text-xl font-bold text-gray-900">FamilyTree</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {/* Mobile Close Button */}
            <button
              onClick={() => setMobileSidebarOpen(false)}
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
              aria-label="Close sidebar"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
            {/* Desktop Toggle Button */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="hidden lg:block p-2 rounded-lg hover:bg-gray-100 transition-colors"
              aria-label="Toggle sidebar"
            >
              <Menu className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4">
          {sidebarOpen ? (
            <div className="space-y-6">
              {/* Main Navigation */}
              <div>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Main</h3>
                <div className="space-y-1">
                  {navigationItems
                    .filter(item => item.category === 'main')
                    .map((item) => {
                      const Icon = item.icon;
                      const isActive = location.pathname === item.path;
                      return (
                        <button
                          key={item.id}
                          onClick={() => handleNavigation(item.path)}
                          className={`w-full flex items-center px-3 py-2.5 rounded-lg transition-all duration-200 ${
                            isActive
                              ? 'bg-blue-50 text-blue-700 border border-blue-200 shadow-sm'
                              : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                          }`}
                        >
                          <Icon className="w-5 h-5" />
                          <div className="ml-3 flex-1 text-left">
                            <div className="font-medium">{item.label}</div>
                            <div className="text-xs text-gray-500">{item.description}</div>
                          </div>
                          {item.badge && (
                            <span className="ml-2 px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded-full">
                              {item.badge}
                            </span>
                          )}
                        </button>
                      );
                    })}
                </div>
              </div>

              {/* Tools */}
              <div>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Tools</h3>
                <div className="space-y-1">
                  {navigationItems
                    .filter(item => item.category === 'tools')
                    .map((item) => {
                      const Icon = item.icon;
                      const isActive = location.pathname === item.path;
                      return (
                        <button
                          key={item.id}
                          onClick={() => handleNavigation(item.path)}
                          className={`w-full flex items-center px-3 py-2.5 rounded-lg transition-all duration-200 ${
                            isActive
                              ? 'bg-purple-50 text-purple-700 border border-purple-200 shadow-sm'
                              : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                          }`}
                        >
                          <Icon className="w-5 h-5" />
                          <div className="ml-3 flex-1 text-left">
                            <div className="font-medium">{item.label}</div>
                            <div className="text-xs text-gray-500">{item.description}</div>
                          </div>
                        </button>
                      );
                    })}
                </div>
              </div>

              {/* Settings */}
              <div>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Settings</h3>
                <div className="space-y-1">
                  {navigationItems
                    .filter(item => item.category === 'settings')
                    .map((item) => {
                      const Icon = item.icon;
                      const isActive = location.pathname === item.path;
                      return (
                        <button
                          key={item.id}
                          onClick={() => handleNavigation(item.path)}
                          className={`w-full flex items-center px-3 py-2.5 rounded-lg transition-all duration-200 ${
                            isActive
                              ? 'bg-gray-100 text-gray-900 border border-gray-300 shadow-sm'
                              : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                          }`}
                        >
                          <Icon className="w-5 h-5" />
                          <div className="ml-3 flex-1 text-left">
                            <div className="font-medium">{item.label}</div>
                            <div className="text-xs text-gray-500">{item.description}</div>
                          </div>
                        </button>
                      );
                    })}
                </div>
              </div>
            </div>
          ) : (
            // Collapsed Sidebar
            <div className="space-y-2">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavigation(item.path)}
                    className={`w-full flex items-center justify-center p-3 rounded-lg transition-all duration-200 ${
                      isActive
                        ? 'bg-blue-50 text-blue-700 border border-blue-200 shadow-sm'
                        : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                    title={item.label}
                  >
                    <Icon className="w-5 h-5" />
                    {item.badge && (
                      <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full"></span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </nav>

        {/* Sidebar Footer */}
        {sidebarOpen && (
          <div className="p-4 border-t border-gray-200">
            <div className="flex items-center mb-4">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
              </div>
              <div className="ml-3 flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user?.email || 'User'}
                </p>
                <p className="text-xs text-gray-500">Free Plan</p>
              </div>
            </div>
            <button 
              onClick={signOut}
              className="w-full flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-red-50 hover:text-red-700 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4 mr-3" />
              Sign Out
            </button>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navigation */}
        <header className="bg-white border-b border-gray-200 px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            {/* Mobile Menu Button & Page Title */}
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setMobileSidebarOpen(true)}
                className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
                aria-label="Open sidebar"
              >
                <Menu className="w-5 h-5 text-gray-500" />
              </button>
              <div>
                <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  {currentPage && <currentPage.icon className="w-5 h-5 text-blue-600" />}
                  {currentPage?.label || 'Dashboard'}
                </h1>
                {sidebarOpen && (
                  <p className="text-sm text-gray-500 mt-1">
                    {currentPage?.description}
                  </p>
                )}
              </div>
            </div>
            
            {/* Right Side Actions */}
            <div className="flex items-center space-x-4">
              {/* Quick Actions */}
              <button className="hidden sm:flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                <Sparkles className="w-4 h-4 mr-2" />
                Quick Actions
              </button>
              
              {/* Notifications */}
              <div className="relative">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setNotificationsOpen(!notificationsOpen);
                  }}
                  className="relative p-2 text-gray-500 hover:text-gray-700 transition-colors"
                  aria-label="Notifications"
                >
                  <Bell className="w-5 h-5" />
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                </button>
                
                {notificationsOpen && (
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                    <div className="px-4 py-3 border-b border-gray-200">
                      <h3 className="font-semibold text-gray-900">Notifications</h3>
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                      <div className="px-4 py-3 hover:bg-gray-50 cursor-pointer">
                        <div className="flex items-start gap-3">
                          <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">New family member added</p>
                            <p className="text-xs text-gray-500">2 minutes ago</p>
                          </div>
                        </div>
                      </div>
                      <div className="px-4 py-3 hover:bg-gray-50 cursor-pointer">
                        <div className="flex items-start gap-3">
                          <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">DNA analysis completed</p>
                            <p className="text-xs text-gray-500">1 hour ago</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="px-4 py-2 border-t border-gray-200">
                      <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                        View all notifications
                      </button>
                    </div>
                  </div>
                )}
              </div>
              
              {/* User Menu */}
              <div className="relative">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setUserMenuOpen(!userMenuOpen);
                  }}
                  className="flex items-center p-2 rounded-lg hover:bg-gray-100 transition-colors"
                  aria-label="User menu"
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-white" />
                  </div>
                  <ChevronDown className="w-4 h-4 text-gray-500 ml-2 hidden sm:block" />
                </button>
                
                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                    <div className="px-4 py-2 border-b border-gray-200">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {user?.email || 'User'}
                      </p>
                      <p className="text-xs text-gray-500">Free Plan</p>
                    </div>
                    <button className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100">
                      <Settings className="w-4 h-4 mr-2 inline" />
                      Settings
                    </button>
                    <button 
                      onClick={signOut}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-red-50 hover:text-red-700"
                    >
                      <LogOut className="w-4 h-4 mr-2 inline" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto">
          <div className="px-4 sm:px-6 lg:px-8 py-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
