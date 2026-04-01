import React, { useState, useEffect, useMemo } from 'react';
import { Wifi, WifiOff, Download, Upload, Cloud, CloudOff, Smartphone, Monitor, RefreshCw, CheckCircle, AlertTriangle, Clock, Database, Shield, Settings, Bell, Home, Users, FileText, Search, Filter } from 'lucide-react';

interface OfflineData {
  persons: any[];
  sources: any[];
  evidence: any[];
  citations: any[];
  lastSync: string;
  version: string;
}

interface SyncStatus {
  isOnline: boolean;
  lastSyncTime: string;
  pendingChanges: number;
  syncInProgress: boolean;
  conflicts: SyncConflict[];
}

interface SyncConflict {
  id: string;
  type: 'person' | 'source' | 'evidence' | 'citation';
  itemId: string;
  localVersion: any;
  remoteVersion: any;
  timestamp: string;
  resolved: boolean;
}

interface CacheStatus {
  totalSize: number;
  usedSize: number;
  availableSize: number;
  cachedFiles: string[];
  lastCleanup: string;
}

interface PWAInstallStatus {
  isInstallable: boolean;
  isInstalled: boolean;
  installPrompt: any;
}

export function OfflinePWA({ persons }: { persons: any[] }) {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    isOnline: navigator.onLine,
    lastSyncTime: new Date().toISOString(),
    pendingChanges: 0,
    syncInProgress: false,
    conflicts: []
  });

  const [cacheStatus, setCacheStatus] = useState<CacheStatus>({
    totalSize: 100 * 1024 * 1024, // 100MB
    usedSize: 25 * 1024 * 1024,  // 25MB
    availableSize: 75 * 1024 * 1024, // 75MB
    cachedFiles: ['persons.json', 'sources.json', 'photos/', 'documents/'],
    lastCleanup: new Date().toISOString()
  });

  const [pwaStatus, setPwaStatus] = useState<PWAInstallStatus>({
    isInstallable: false,
    isInstalled: false,
    installPrompt: null
  });

  const [activeTab, setActiveTab] = useState<'sync' | 'cache' | 'pwa' | 'settings'>('sync');
  const [syncProgress, setSyncProgress] = useState(0);
  const [autoSync, setAutoSync] = useState(true);
  const [offlineMode, setOfflineMode] = useState(false);
  const [backgroundSync, setBackgroundSync] = useState(true);

  // Generate mock sync conflicts
  const generateMockConflicts = useMemo(() => {
    const conflicts: SyncConflict[] = [
      {
        id: 'conflict-1',
        type: 'person',
        itemId: 'person-1',
        localVersion: {
          name: 'John Smith',
          birthDate: '1892-03-15',
          lastModified: '2024-01-20T10:30:00Z'
        },
        remoteVersion: {
          name: 'John William Smith',
          birthDate: '1892-03-15',
          lastModified: '2024-01-20T15:45:00Z'
        },
        timestamp: '2024-01-20T16:00:00Z',
        resolved: false
      },
      {
        id: 'conflict-2',
        type: 'source',
        itemId: 'source-1',
        localVersion: {
          title: 'Family Bible Records',
          verified: false,
          lastModified: '2024-01-19T14:20:00Z'
        },
        remoteVersion: {
          title: 'Family Bible Records',
          verified: true,
          lastModified: '2024-01-19T16:30:00Z'
        },
        timestamp: '2024-01-20T09:15:00Z',
        resolved: false
      }
    ];

    return conflicts;
  }, []);

  // Check online status
  useEffect(() => {
    const handleOnline = () => {
      setSyncStatus(prev => ({ ...prev, isOnline: true }));
      if (autoSync && !offlineMode) {
        startSync();
      }
    };

    const handleOffline = () => {
      setSyncStatus(prev => ({ ...prev, isOnline: false }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check for PWA installability
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      setPwaStatus(prev => ({
        ...prev,
        isInstallable: true,
        installPrompt: e
      }));
    });

    // Check if PWA is installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setPwaStatus(prev => ({ ...prev, isInstalled: true }));
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [autoSync, offlineMode]);

  // Simulate sync progress
  const startSync = () => {
    setSyncStatus(prev => ({ ...prev, syncInProgress: true }));
    setSyncProgress(0);

    const interval = setInterval(() => {
      setSyncProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setSyncStatus(prevStatus => ({
            ...prevStatus,
            syncInProgress: false,
            lastSyncTime: new Date().toISOString(),
            pendingChanges: 0,
            conflicts: generateMockConflicts
          }));
          return 100;
        }
        return prev + 10;
      });
    }, 200);
  };

  // Install PWA
  const installPWA = async () => {
    if (pwaStatus.installPrompt) {
      const result = await pwaStatus.installPrompt.prompt();
      if (result.outcome === 'accepted') {
        setPwaStatus(prev => ({
          ...prev,
          isInstalled: true,
          isInstallable: false,
          installPrompt: null
        }));
      }
    }
  };

  // Clear cache
  const clearCache = async () => {
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map(name => caches.delete(name)));
      
      setCacheStatus(prev => ({
        ...prev,
        usedSize: 0,
        availableSize: prev.totalSize,
        cachedFiles: [],
        lastCleanup: new Date().toISOString()
      }));
    }
  };

  // Get connection status color
  const getConnectionColor = () => {
    if (!syncStatus.isOnline) return 'text-red-600 bg-red-50';
    if (syncStatus.syncInProgress) return 'text-yellow-600 bg-yellow-50';
    if (syncStatus.pendingChanges > 0) return 'text-orange-600 bg-orange-50';
    return 'text-green-600 bg-green-50';
  };

  // Get cache usage percentage
  const getCacheUsagePercentage = () => {
    return Math.round((cacheStatus.usedSize / cacheStatus.totalSize) * 100);
  };

  // Format bytes
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-blue-100 rounded-lg">
            {syncStatus.isOnline ? <Wifi className="w-6 h-6 text-blue-600" /> : <WifiOff className="w-6 h-6 text-gray-600" />}
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Offline & PWA Features</h2>
            <p className="text-gray-600">Progressive Web App with offline capabilities</p>
          </div>
        </div>

        {/* Connection Status */}
        <div className={`flex items-center gap-3 p-4 rounded-lg ${getConnectionColor()}`}>
          {syncStatus.isOnline ? (
            <>
              <Wifi className="w-5 h-5" />
              <span className="font-medium">Online</span>
            </>
          ) : (
            <>
              <WifiOff className="w-5 h-5" />
              <span className="font-medium">Offline</span>
            </>
          )}
          <span className="text-sm">
            Last sync: {new Date(syncStatus.lastSyncTime).toLocaleString()}
          </span>
          {syncStatus.pendingChanges > 0 && (
            <span className="text-sm">
              {syncStatus.pendingChanges} pending changes
            </span>
          )}
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
          <div className="bg-blue-50 rounded-lg p-4">
            <Database className="w-6 h-6 text-blue-600 mb-2" />
            <h3 className="font-semibold text-blue-900 mb-1">Cache Usage</h3>
            <p className="text-sm text-blue-700">{getCacheUsagePercentage()}% used</p>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <Cloud className="w-6 h-6 text-green-600 mb-2" />
            <h3 className="font-semibold text-green-900 mb-1">Sync Status</h3>
            <p className="text-sm text-green-700">{syncStatus.syncInProgress ? 'In Progress' : 'Ready'}</p>
          </div>
          <div className="bg-purple-50 rounded-lg p-4">
            <Smartphone className="w-6 h-6 text-purple-600 mb-2" />
            <h3 className="font-semibold text-purple-900 mb-1">PWA Status</h3>
            <p className="text-sm text-purple-700">{pwaStatus.isInstalled ? 'Installed' : 'Available'}</p>
          </div>
          <div className="bg-orange-50 rounded-lg p-4">
            <Shield className="w-6 h-6 text-orange-600 mb-2" />
            <h3 className="font-semibold text-orange-900 mb-1">Data Safety</h3>
            <p className="text-sm text-orange-700">Protected</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 mt-6">
          <button
            onClick={() => setActiveTab('sync')}
            className={`flex items-center gap-2 px-6 py-3 font-medium transition-colors ${
              activeTab === 'sync'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Cloud className="w-4 h-4" />
            Sync
          </button>
          <button
            onClick={() => setActiveTab('cache')}
            className={`flex items-center gap-2 px-6 py-3 font-medium transition-colors ${
              activeTab === 'cache'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Database className="w-4 h-4" />
            Cache
          </button>
          <button
            onClick={() => setActiveTab('pwa')}
            className={`flex items-center gap-2 px-6 py-3 font-medium transition-colors ${
              activeTab === 'pwa'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            PWA
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`flex items-center gap-2 px-6 py-3 font-medium transition-colors ${
              activeTab === 'settings'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Settings className="w-4 h-4" />
            Settings
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        {activeTab === 'sync' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Synchronization</h3>
              <button
                onClick={startSync}
                disabled={!syncStatus.isOnline || syncStatus.syncInProgress}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RefreshCw className={`w-4 h-4 ${syncStatus.syncInProgress ? 'animate-spin' : ''}`} />
                {syncStatus.syncInProgress ? 'Syncing...' : 'Sync Now'}
              </button>
            </div>

            {/* Sync Progress */}
            {syncStatus.syncInProgress && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Sync Progress</span>
                  <span>{syncProgress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${syncProgress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Sync Conflicts */}
            {syncStatus.conflicts.length > 0 && (
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">Sync Conflicts</h4>
                {syncStatus.conflicts.map(conflict => (
                  <div key={conflict.id} className="border border-red-200 rounded-lg p-4 bg-red-50">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h5 className="font-medium text-red-900 capitalize">
                          {conflict.type} Conflict
                        </h5>
                        <p className="text-sm text-red-700">Item ID: {conflict.itemId}</p>
                      </div>
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-600">
                        Unresolved
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-1">Local Version</p>
                        <div className="bg-white rounded p-3 text-sm">
                          <pre className="text-xs text-gray-600 whitespace-pre-wrap">
                            {JSON.stringify(conflict.localVersion, null, 2)}
                          </pre>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-1">Remote Version</p>
                        <div className="bg-white rounded p-3 text-sm">
                          <pre className="text-xs text-gray-600 whitespace-pre-wrap">
                            {JSON.stringify(conflict.remoteVersion, null, 2)}
                          </pre>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex gap-2 mt-4">
                      <button className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700">
                        Use Local
                      </button>
                      <button className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700">
                        Use Remote
                      </button>
                      <button className="px-3 py-1 text-sm bg-gray-600 text-white rounded hover:bg-gray-700">
                        Merge
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Sync History */}
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Recent Activity</h4>
              <div className="space-y-2">
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">Sync completed successfully</p>
                    <p className="text-xs text-gray-600">2 minutes ago</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded">
                  <Download className="w-4 h-4 text-blue-600" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">Downloaded 15 family photos</p>
                    <p className="text-xs text-gray-600">1 hour ago</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded">
                  <Upload className="w-4 h-4 text-purple-600" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">Uploaded 3 new sources</p>
                    <p className="text-xs text-gray-600">3 hours ago</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'cache' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Cache Management</h3>
              <button
                onClick={clearCache}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                <Trash2 className="w-4 h-4" />
                Clear Cache
              </button>
            </div>

            {/* Cache Usage */}
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Storage Usage</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Used: {formatBytes(cacheStatus.usedSize)}</span>
                  <span>Available: {formatBytes(cacheStatus.availableSize)}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-4">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-purple-500 h-4 rounded-full transition-all duration-300"
                    style={{ width: `${getCacheUsagePercentage()}%` }}
                  />
                </div>
                <p className="text-xs text-gray-600">
                  Total: {formatBytes(cacheStatus.totalSize)} ({getCacheUsagePercentage()}% used)
                </p>
              </div>
            </div>

            {/* Cached Files */}
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Cached Files</h4>
              <div className="space-y-2">
                {cacheStatus.cachedFiles.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                    <div className="flex items-center gap-3">
                      <FileText className="w-4 h-4 text-gray-600" />
                      <span className="text-sm font-medium text-gray-900">{file}</span>
                    </div>
                    <button className="text-sm text-blue-600 hover:text-blue-800">
                      View
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Offline Data */}
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Available Offline</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg">
                  <Users className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="font-medium text-green-900">Family Members</p>
                    <p className="text-sm text-green-700">{persons.length} persons</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg">
                  <FileText className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="font-medium text-blue-900">Documents</p>
                    <p className="text-sm text-blue-700">12 sources</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-purple-50 rounded-lg">
                  <Camera className="w-5 h-5 text-purple-600" />
                  <div>
                    <p className="font-medium text-purple-900">Photos</p>
                    <p className="text-sm text-purple-700">48 images</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-orange-50 rounded-lg">
                  <Link className="w-5 h-5 text-orange-600" />
                  <div>
                    <p className="font-medium text-orange-900">Citations</p>
                    <p className="text-sm text-orange-700">8 formatted</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'pwa' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Progressive Web App</h3>
              {pwaStatus.isInstallable && !pwaStatus.isInstalled && (
                <button
                  onClick={installPWA}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <Download className="w-4 h-4" />
                  Install App
                </button>
              )}
            </div>

            {/* PWA Status */}
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Installation Status</h4>
              <div className={`p-4 rounded-lg ${
                pwaStatus.isInstalled 
                  ? 'bg-green-50 border border-green-200' 
                  : pwaStatus.isInstallable 
                    ? 'bg-blue-50 border border-blue-200'
                    : 'bg-gray-50 border border-gray-200'
              }`}>
                <div className="flex items-center gap-3">
                  {pwaStatus.isInstalled ? (
                    <>
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <div>
                        <p className="font-medium text-green-900">App Installed</p>
                        <p className="text-sm text-green-700">Available offline with full features</p>
                      </div>
                    </>
                  ) : pwaStatus.isInstallable ? (
                    <>
                      <Download className="w-5 h-5 text-blue-600" />
                      <div>
                        <p className="font-medium text-blue-900">Ready to Install</p>
                        <p className="text-sm text-blue-700">Install for offline access and better performance</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <Monitor className="w-5 h-5 text-gray-600" />
                      <div>
                        <p className="font-medium text-gray-900">Browser Mode</p>
                        <p className="text-sm text-gray-700">Using in browser with limited offline features</p>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* PWA Features */}
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">PWA Features</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                  <WifiOff className="w-5 h-5 text-blue-600 mt-1" />
                  <div>
                    <p className="font-medium text-gray-900">Offline Access</p>
                    <p className="text-sm text-gray-600">Work without internet connection</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                  <Smartphone className="w-5 h-5 text-green-600 mt-1" />
                  <div>
                    <p className="font-medium text-gray-900">Native Experience</p>
                    <p className="text-sm text-gray-600">App-like interface and navigation</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                  <Bell className="w-5 h-5 text-purple-600 mt-1" />
                  <div>
                    <p className="font-medium text-gray-900">Push Notifications</p>
                    <p className="text-sm text-gray-600">Get updates and reminders</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                  <RefreshCw className="w-5 h-5 text-orange-600 mt-1" />
                  <div>
                    <p className="font-medium text-gray-900">Background Sync</p>
                    <p className="text-sm text-gray-600">Auto-sync data when online</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Device Compatibility */}
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Device Compatibility</h4>
              <div className="space-y-2">
                <div className="flex items-center gap-3 p-3 bg-green-50 rounded">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-gray-900">Chrome/Edge: Full support</span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-green-50 rounded">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-gray-900">Firefox: Full support</span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-yellow-50 rounded">
                  <AlertTriangle className="w-4 h-4 text-yellow-600" />
                  <span className="text-sm text-gray-900">Safari: Limited support</span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-green-50 rounded">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-gray-900">Mobile browsers: Full support</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">Offline Settings</h3>

            {/* Sync Settings */}
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Synchronization</h4>
              <div className="space-y-3">
                <label className="flex items-center justify-between p-3 bg-gray-50 rounded cursor-pointer">
                  <div>
                    <p className="font-medium text-gray-900">Auto-sync</p>
                    <p className="text-sm text-gray-600">Automatically sync when online</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={autoSync}
                    onChange={(e) => setAutoSync(e.target.checked)}
                    className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                  />
                </label>
                <label className="flex items-center justify-between p-3 bg-gray-50 rounded cursor-pointer">
                  <div>
                    <p className="font-medium text-gray-900">Background Sync</p>
                    <p className="text-sm text-gray-600">Sync data in background</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={backgroundSync}
                    onChange={(e) => setBackgroundSync(e.target.checked)}
                    className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                  />
                </label>
                <label className="flex items-center justify-between p-3 bg-gray-50 rounded cursor-pointer">
                  <div>
                    <p className="font-medium text-gray-900">Offline Mode</p>
                    <p className="text-sm text-gray-600">Work completely offline</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={offlineMode}
                    onChange={(e) => setOfflineMode(e.target.checked)}
                    className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                  />
                </label>
              </div>
            </div>

            {/* Cache Settings */}
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Cache Management</h4>
              <div className="space-y-3">
                <div className="p-3 bg-gray-50 rounded">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-medium text-gray-900">Cache Size Limit</p>
                    <span className="text-sm text-gray-600">100 MB</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="500"
                    value="100"
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-600">
                    <span>10 MB</span>
                    <span>500 MB</span>
                  </div>
                </div>
                <div className="p-3 bg-gray-50 rounded">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-medium text-gray-900">Auto Cleanup</p>
                    <span className="text-sm text-gray-600">Weekly</span>
                  </div>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    <option>Daily</option>
                    <option>Weekly</option>
                    <option>Monthly</option>
                    <option>Never</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Data Preferences */}
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Data Preferences</h4>
              <div className="space-y-3">
                <label className="flex items-center justify-between p-3 bg-gray-50 rounded cursor-pointer">
                  <div>
                    <p className="font-medium text-gray-900">Cache Photos</p>
                    <p className="text-sm text-gray-600">Download images for offline use</p>
                  </div>
                  <input
                    type="checkbox"
                    defaultChecked
                    className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                  />
                </label>
                <label className="flex items-center justify-between p-3 bg-gray-50 rounded cursor-pointer">
                  <div>
                    <p className="font-medium text-gray-900">Cache Documents</p>
                    <p className="text-sm text-gray-600">Store documents offline</p>
                  </div>
                  <input
                    type="checkbox"
                    defaultChecked
                    className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                  />
                </label>
                <label className="flex items-center justify-between p-3 bg-gray-50 rounded cursor-pointer">
                  <div>
                    <p className="font-medium text-gray-900">Compress Data</p>
                    <p className="text-sm text-gray-600">Reduce storage usage</p>
                  </div>
                  <input
                    type="checkbox"
                    defaultChecked
                    className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                  />
                </label>
              </div>
            </div>

            {/* Reset Options */}
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Reset Options</h4>
              <div className="space-y-3">
                <button className="w-full px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700">
                  Reset Sync Settings
                </button>
                <button className="w-full px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700">
                  Clear Offline Data
                </button>
                <button className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
                  Factory Reset
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
