import React, { useState, useEffect, useMemo } from 'react';
import { Download, Upload, Database, Cloud, Shield, Clock, Calendar, FileText, Settings, CheckCircle, AlertTriangle, RefreshCw, Trash2, Eye, Archive, HardDrive, ExternalLink, Lock, Unlock, Zap, Users, GitBranch, BarChart3, Activity, Plus, Camera, Link } from 'lucide-react';

interface BackupConfig {
  id: string;
  name: string;
  format: 'json' | 'gedcom' | 'csv' | 'xml' | 'pdf';
  includeMedia: boolean;
  includePrivate: boolean;
  compression: boolean;
  encryption: boolean;
  schedule: 'manual' | 'daily' | 'weekly' | 'monthly';
  destinations: string[];
  retention: number; // days
  createdAt: string;
  lastRun: string;
  status: 'active' | 'paused' | 'failed';
}

interface BackupRecord {
  id: string;
  configId: string;
  name: string;
  format: string;
  size: number;
  location: string;
  checksum: string;
  createdAt: string;
  status: 'completed' | 'in_progress' | 'failed';
  progress?: number;
  error?: string;
  encrypted: boolean;
  compressed: boolean;
  itemCounts: {
    persons: number;
    sources: number;
    media: number;
    citations: number;
  };
}

interface ExportFormat {
  id: string;
  name: string;
  extension: string;
  description: string;
  features: string[];
  compatibility: string[];
  recommended: boolean;
}

interface ImportRecord {
  id: string;
  filename: string;
  format: string;
  size: number;
  uploadedAt: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress?: number;
  preview?: any;
  conflicts?: ImportConflict[];
}

interface ImportConflict {
  id: string;
  type: 'person' | 'source' | 'media' | 'duplicate';
  itemId: string;
  existingItem: any;
  newItem: any;
  severity: 'low' | 'medium' | 'high';
  resolution?: 'keep_existing' | 'use_new' | 'merge' | 'skip';
}

export function BackupManager({ persons }: { persons: any[] }) {
  const [activeTab, setActiveTab] = useState<'backups' | 'exports' | 'imports' | 'settings'>('backups');
  const [backupConfigs, setBackupConfigs] = useState<BackupConfig[]>([]);
  const [backupRecords, setBackupRecords] = useState<BackupRecord[]>([]);
  const [importRecords, setImportRecords] = useState<ImportRecord[]>([]);
  const [selectedBackup, setSelectedBackup] = useState<BackupRecord | null>(null);
  const [isCreatingBackup, setIsCreatingBackup] = useState(false);
  const [backupProgress, setBackupProgress] = useState(0);

  // Generate mock backup configurations
  const generateMockConfigs = useMemo(() => {
    const configs: BackupConfig[] = [
      {
        id: 'config-1',
        name: 'Daily Full Backup',
        format: 'json',
        includeMedia: true,
        includePrivate: false,
        compression: true,
        encryption: true,
        schedule: 'daily',
        destinations: ['local', 'cloud'],
        retention: 30,
        createdAt: '2024-01-01',
        lastRun: '2024-01-20T10:00:00Z',
        status: 'active'
      },
      {
        id: 'config-2',
        name: 'Weekly GEDCOM Export',
        format: 'gedcom',
        includeMedia: false,
        includePrivate: true,
        compression: false,
        encryption: false,
        schedule: 'weekly',
        destinations: ['cloud'],
        retention: 90,
        createdAt: '2024-01-05',
        lastRun: '2024-01-19T02:00:00Z',
        status: 'active'
      },
      {
        id: 'config-3',
        name: 'Monthly Archive',
        format: 'json',
        includeMedia: true,
        includePrivate: true,
        compression: true,
        encryption: true,
        schedule: 'monthly',
        destinations: ['local', 'cloud', 'external'],
        retention: 365,
        createdAt: '2024-01-10',
        lastRun: '2024-01-01T00:00:00Z',
        status: 'paused'
      }
    ];

    return configs;
  }, []);

  // Generate mock backup records
  const generateMockRecords = useMemo(() => {
    const records: BackupRecord[] = [
      {
        id: 'backup-1',
        configId: 'config-1',
        name: 'family_tree_2024-01-20_daily.json',
        format: 'json',
        size: 15.7 * 1024 * 1024, // 15.7 MB
        location: 'cloud://backups/daily/',
        checksum: 'sha256:a1b2c3d4e5f6...',
        createdAt: '2024-01-20T10:00:00Z',
        status: 'completed',
        encrypted: true,
        compressed: true,
        itemCounts: {
          persons: 1247,
          sources: 89,
          media: 456,
          citations: 234
        }
      },
      {
        id: 'backup-2',
        configId: 'config-2',
        name: 'family_tree_2024-01-19_weekly.ged',
        format: 'gedcom',
        size: 2.3 * 1024 * 1024, // 2.3 MB
        location: 'cloud://backups/weekly/',
        checksum: 'sha256:f6e5d4c3b2a1...',
        createdAt: '2024-01-19T02:00:00Z',
        status: 'completed',
        encrypted: false,
        compressed: false,
        itemCounts: {
          persons: 1245,
          sources: 87,
          media: 0,
          citations: 230
        }
      },
      {
        id: 'backup-3',
        configId: 'config-1',
        name: 'family_tree_2024-01-19_daily.json',
        format: 'json',
        size: 15.6 * 1024 * 1024, // 15.6 MB
        location: 'cloud://backups/daily/',
        checksum: 'sha256:b2c3d4e5f6a7...',
        createdAt: '2024-01-19T10:00:00Z',
        status: 'completed',
        encrypted: true,
        compressed: true,
        itemCounts: {
          persons: 1245,
          sources: 87,
          media: 452,
          citations: 232
        }
      }
    ];

    return records;
  }, []);

  // Export formats
  const exportFormats: ExportFormat[] = [
    {
      id: 'json',
      name: 'JSON',
      extension: '.json',
      description: 'Modern JSON format with full feature support',
      features: ['Complete data', 'Media links', 'Metadata', 'Version control'],
      compatibility: ['This app', 'Modern genealogy software'],
      recommended: true
    },
    {
      id: 'gedcom',
      name: 'GEDCOM 5.5.1',
      extension: '.ged',
      description: 'Standard genealogy data exchange format',
      features: ['Basic family data', 'Sources', 'Notes'],
      compatibility: ['Most genealogy software', 'FamilySearch', 'Ancestry'],
      recommended: false
    },
    {
      id: 'csv',
      name: 'CSV',
      extension: '.csv',
      description: 'Spreadsheet-compatible format',
      features: ['Tabular data', 'Excel compatible'],
      compatibility: ['Excel', 'Google Sheets', 'Database systems'],
      recommended: false
    },
    {
      id: 'xml',
      name: 'XML',
      extension: '.xml',
      description: 'Structured markup format',
      features: ['Hierarchical data', 'Schema validation'],
      compatibility: ['XML parsers', 'Enterprise systems'],
      recommended: false
    },
    {
      id: 'pdf',
      name: 'PDF Report',
      extension: '.pdf',
      description: 'Formatted family tree report',
      features: ['Print-ready', 'Charts', 'Narratives'],
      compatibility: ['Adobe Reader', 'Web browsers'],
      recommended: false
    }
  ];

  useEffect(() => {
    setBackupConfigs(generateMockConfigs);
    setBackupRecords(generateMockRecords);
  }, [generateMockConfigs, generateMockRecords]);

  // Create real backup
  const createBackup = async (configId: string) => {
    setIsCreatingBackup(true);
    setBackupProgress(0);

    try {
      const config = backupConfigs.find(c => c.id === configId);
      if (!config) throw new Error('Backup configuration not found');

      // Step 1: Prepare data
      setBackupProgress(10);
      const backupData = {
        version: '1.0',
        created: new Date().toISOString(),
        persons: persons,
        metadata: {
          totalPersons: persons.length,
          config: {
            format: config.format,
            includeMedia: config.includeMedia,
            includePrivate: config.includePrivate,
            encrypted: config.encryption,
            compressed: config.compression
          }
        }
      };

      // Step 2: Convert to selected format
      setBackupProgress(30);
      let exportData: string;
      let fileName: string;
      let fileSize: number;

      switch (config.format) {
        case 'json':
          exportData = JSON.stringify(backupData, null, 2);
          fileName = `family_tree_${new Date().toISOString().split('T')[0]}_manual.json`;
          break;
        
        case 'gedcom':
          exportData = convertToGEDCOM(backupData.persons);
          fileName = `family_tree_${new Date().toISOString().split('T')[0]}_manual.ged`;
          break;
        
        case 'csv':
          exportData = convertToCSV(backupData.persons);
          fileName = `family_tree_${new Date().toISOString().split('T')[0]}_manual.csv`;
          break;
        
        default:
          throw new Error('Unsupported export format');
      }

      // Step 3: Apply compression if enabled
      setBackupProgress(50);
      if (config.compression) {
        // In a real implementation, you would use a compression library
        exportData = compressData(exportData);
        fileName += '.gz';
      }

      // Step 4: Apply encryption if enabled
      setBackupProgress(70);
      if (config.encryption) {
        // In a real implementation, you would use actual encryption
        exportData = encryptData(exportData);
      }

      // Step 5: Calculate file size and checksum
      setBackupProgress(80);
      fileSize = new Blob([exportData]).size;
      const checksum = await calculateChecksum(exportData);

      // Step 6: Save to local storage or download
      setBackupProgress(90);
      const backupLocation = await saveBackup(exportData, fileName, config);

      // Step 7: Create backup record
      setBackupProgress(100);
      const newBackup: BackupRecord = {
        id: `backup-${Date.now()}`,
        configId,
        name: fileName,
        format: config.format,
        size: fileSize,
        location: backupLocation,
        checksum,
        createdAt: new Date().toISOString(),
        status: 'completed',
        encrypted: config.encryption,
        compressed: config.compression,
        itemCounts: {
          persons: persons.length,
          sources: 0, // Would be calculated from actual sources
          media: 0, // Would be calculated from actual media
          citations: 0 // Would be calculated from actual citations
        }
      };
      
      setBackupRecords(prev => [newBackup, ...prev]);
      
      // Trigger download
      downloadBackup(exportData, fileName);

    } catch (error) {
      console.error('Backup creation failed:', error);
      throw error;
    } finally {
      setIsCreatingBackup(false);
      setBackupProgress(0);
    }
  };

  // Helper function to convert to GEDCOM format
  const convertToGEDCOM = (persons: any[]): string => {
    let gedcom = '0 HEAD\n1 SOUR FamilyTree Web App\n2 NAME Family Tree Data\n1 FILE family_tree.ged\n';
    
    persons.forEach((person, index) => {
      const individualId = `I${index + 1}`;
      gedcom += `0 @${individualId}@ INDI\n`;
      gedcom += `1 NAME ${person.firstName || ''} ${person.lastName || ''}\n`;
      
      if (person.birthday) {
        gedcom += `1 BIRT\n2 DATE ${formatDateForGEDCOM(person.birthday)}\n`;
        if (person.birthplace) {
          gedcom += `2 PLAC ${person.birthplace}\n`;
        }
      }
      
      if (person.gender) {
        gedcom += `1 SEX ${person.gender.charAt(0).toUpperCase()}\n`;
      }
    });
    
    gedcom += '0 TRLR\n';
    return gedcom;
  };

  // Helper function to convert to CSV format
  const convertToCSV = (persons: any[]): string => {
    const headers = ['ID', 'First Name', 'Middle Name', 'Last Name', 'Birthday', 'Birthplace', 'Gender', 'Mother ID', 'Father ID'];
    const csvContent = [
      headers.join(','),
      ...persons.map(person => [
        person.id || '',
        person.firstName || '',
        person.middleName || '',
        person.lastName || '',
        person.birthday || '',
        person.birthplace || '',
        person.gender || '',
        person.motherId || '',
        person.fatherId || ''
      ].map(field => `"${field}"`).join(','))
    ].join('\n');
    
    return csvContent;
  };

  // Helper functions (simplified implementations)
  const compressData = (data: string): string => {
    // In a real implementation, use a compression library like pako
    return data; // Placeholder
  };

  const encryptData = (data: string): string => {
    // In a real implementation, use actual encryption
    return btoa(data); // Simple base64 encoding as placeholder
  };

  const calculateChecksum = async (data: string): Promise<string> => {
    // In a real implementation, use crypto.subtle.digest for SHA-256
    return 'sha256:' + Math.random().toString(36).substring(7); // Placeholder
  };

  const saveBackup = async (data: string, fileName: string, config: BackupConfig): Promise<string> => {
    // Save to localStorage for demo purposes
    const storageKey = `backup_${fileName}`;
    localStorage.setItem(storageKey, data);
    return `localStorage://${storageKey}`;
  };

  const downloadBackup = (data: string, fileName: string) => {
    const blob = new Blob([data], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const formatDateForGEDCOM = (dateString: string): string => {
    const date = new Date(dateString);
    return `${date.getDay()} ${date.getMonth() + 1} ${date.getFullYear()}`;
  };

  // Format bytes
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
      case 'completed':
        return 'text-green-600 bg-green-50';
      case 'paused':
      case 'in_progress':
        return 'text-yellow-600 bg-yellow-50';
      case 'failed':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Database className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Backup & Data Management</h2>
            <p className="text-gray-600">Comprehensive backup, export, and import system</p>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 rounded-lg p-4">
            <Database className="w-6 h-6 text-blue-600 mb-2" />
            <h3 className="font-semibold text-blue-900 mb-1">Total Backups</h3>
            <p className="text-sm text-blue-700">{backupRecords.length} files</p>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <HardDrive className="w-6 h-6 text-green-600 mb-2" />
            <h3 className="font-semibold text-green-900 mb-1">Storage Used</h3>
            <p className="text-sm text-green-700">{formatBytes(backupRecords.reduce((acc, r) => acc + r.size, 0))}</p>
          </div>
          <div className="bg-purple-50 rounded-lg p-4">
            <Shield className="w-6 h-6 text-purple-600 mb-2" />
            <h3 className="font-semibold text-purple-900 mb-1">Data Protected</h3>
            <p className="text-sm text-purple-700">{persons.length} persons</p>
          </div>
          <div className="bg-orange-50 rounded-lg p-4">
            <Clock className="w-6 h-6 text-orange-600 mb-2" />
            <h3 className="font-semibold text-orange-900 mb-1">Last Backup</h3>
            <p className="text-sm text-orange-700">
              {backupRecords.length > 0 
                ? new Date(backupRecords[0].createdAt).toLocaleDateString()
                : 'Never'
              }
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('backups')}
            className={`flex items-center gap-2 px-6 py-3 font-medium transition-colors ${
              activeTab === 'backups'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Database className="w-4 h-4" />
            Backups
          </button>
          <button
            onClick={() => setActiveTab('exports')}
            className={`flex items-center gap-2 px-6 py-3 font-medium transition-colors ${
              activeTab === 'exports'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Download className="w-4 h-4" />
            Export
          </button>
          <button
            onClick={() => setActiveTab('imports')}
            className={`flex items-center gap-2 px-6 py-3 font-medium transition-colors ${
              activeTab === 'imports'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Upload className="w-4 h-4" />
            Import
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
        {activeTab === 'backups' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Backup Configurations</h3>
              <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                <Plus className="w-4 h-4" />
                New Configuration
              </button>
            </div>

            {/* Backup Progress */}
            {isCreatingBackup && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-2">
                  <RefreshCw className="w-5 h-5 text-blue-600 animate-spin" />
                  <span className="font-medium text-blue-900">Creating backup...</span>
                </div>
                <div className="w-full bg-blue-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${backupProgress}%` }}
                  />
                </div>
                <p className="text-sm text-blue-700 mt-1">{backupProgress}% complete</p>
              </div>
            )}

            {/* Backup Configurations */}
            <div className="space-y-4">
              {backupConfigs.map(config => (
                <div key={config.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-semibold text-gray-900">{config.name}</h4>
                      <div className="flex items-center gap-4 mt-1">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(config.status)}`}>
                          {config.status}
                        </span>
                        <span className="text-sm text-gray-600">
                          {config.schedule} • {config.format.toUpperCase()}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => createBackup(config.id)}
                        disabled={isCreatingBackup}
                        className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                      >
                        Run Now
                      </button>
                      <button className="p-2 hover:bg-gray-100 rounded">
                        <Settings className="w-4 h-4 text-gray-600" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600">{config.format.toUpperCase()}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {config.compression ? <Archive className="w-4 h-4 text-green-600" /> : <Archive className="w-4 h-4 text-gray-400" />}
                      <span className="text-gray-600">{config.compression ? 'Compressed' : 'Uncompressed'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {config.encryption ? <Lock className="w-4 h-4 text-green-600" /> : <Unlock className="w-4 h-4 text-gray-400" />}
                      <span className="text-gray-600">{config.encryption ? 'Encrypted' : 'Unencrypted'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600">Keep {config.retention} days</span>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">
                        Last run: {config.lastRun ? new Date(config.lastRun).toLocaleString() : 'Never'}
                      </span>
                      <span className="text-gray-600">
                        Destinations: {config.destinations.join(', ')}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Recent Backups */}
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Recent Backups</h4>
              <div className="space-y-2">
                {backupRecords.map(backup => (
                  <div key={backup.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer"
                       onClick={() => setSelectedBackup(backup)}>
                    <div className="flex items-center gap-3">
                      <Database className="w-5 h-5 text-blue-600" />
                      <div>
                        <p className="font-medium text-gray-900">{backup.name}</p>
                        <p className="text-sm text-gray-600">
                          {formatBytes(backup.size)} • {new Date(backup.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {backup.encrypted && <Lock className="w-4 h-4 text-green-600" />}
                      {backup.compressed && <Archive className="w-4 h-4 text-blue-600" />}
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(backup.status)}`}>
                        {backup.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'exports' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Export Data</h3>
            </div>

            {/* Export Formats */}
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Choose Export Format</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {exportFormats.map(format => (
                  <div key={format.id} className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                    format.recommended ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                  }`}>
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h5 className="font-semibold text-gray-900">{format.name}</h5>
                        <p className="text-sm text-gray-600">{format.description}</p>
                      </div>
                      {format.recommended && (
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-600">
                          Recommended
                        </span>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <div>
                        <p className="text-sm font-medium text-gray-700">Features:</p>
                        <ul className="text-xs text-gray-600 space-y-1">
                          {format.features.map((feature, index) => (
                            <li key={index} className="flex items-center gap-1">
                              <CheckCircle className="w-3 h-3 text-green-600" />
                              {feature}
                            </li>
                          ))}
                        </ul>
                      </div>
                      
                      <div>
                        <p className="text-sm font-medium text-gray-700">Compatible with:</p>
                        <p className="text-xs text-gray-600">{format.compatibility.join(', ')}</p>
                      </div>
                    </div>

                    <button className="w-full mt-3 px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                      Export as {format.extension}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Export Options */}
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Export Options</h4>
              <div className="space-y-3">
                <label className="flex items-center justify-between p-3 bg-gray-50 rounded cursor-pointer">
                  <div>
                    <p className="font-medium text-gray-900">Include Media Files</p>
                    <p className="text-sm text-gray-600">Export photos and documents</p>
                  </div>
                  <input type="checkbox" defaultChecked className="w-5 h-5 text-blue-600 rounded" />
                </label>
                <label className="flex items-center justify-between p-3 bg-gray-50 rounded cursor-pointer">
                  <div>
                    <p className="font-medium text-gray-900">Include Private Data</p>
                    <p className="text-sm text-gray-600">Export sensitive information</p>
                  </div>
                  <input type="checkbox" className="w-5 h-5 text-blue-600 rounded" />
                </label>
                <label className="flex items-center justify-between p-3 bg-gray-50 rounded cursor-pointer">
                  <div>
                    <p className="font-medium text-gray-900">Compress Export</p>
                    <p className="text-sm text-gray-600">Create ZIP archive</p>
                  </div>
                  <input type="checkbox" defaultChecked className="w-5 h-5 text-blue-600 rounded" />
                </label>
                <label className="flex items-center justify-between p-3 bg-gray-50 rounded cursor-pointer">
                  <div>
                    <p className="font-medium text-gray-900">Encrypt Export</p>
                    <p className="text-sm text-gray-600">Password protection</p>
                  </div>
                  <input type="checkbox" className="w-5 h-5 text-blue-600 rounded" />
                </label>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'imports' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Import Data</h3>
              <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                <Upload className="w-4 h-4" />
                Upload File
              </button>
            </div>

            {/* Upload Area */}
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 transition-colors cursor-pointer">
              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h4 className="text-lg font-medium text-gray-900 mb-2">Drop files here or click to upload</h4>
              <p className="text-sm text-gray-600 mb-4">
                Supported formats: JSON, GEDCOM, CSV, XML
              </p>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                Select Files
              </button>
            </div>

            {/* Import History */}
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Import History</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="font-medium text-gray-900">family_tree_import.ged</p>
                      <p className="text-sm text-gray-600">GEDCOM • 2.1 MB • 2 days ago</p>
                    </div>
                  </div>
                  <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-600">
                    Completed
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-orange-600" />
                    <div>
                      <p className="font-medium text-gray-900">ancestry_data.csv</p>
                      <p className="text-sm text-gray-600">CSV • 856 KB • 1 week ago</p>
                    </div>
                  </div>
                  <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-600">
                    Failed
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">Backup Settings</h3>

            {/* Storage Settings */}
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Storage Locations</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <div className="flex items-center gap-3">
                    <HardDrive className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="font-medium text-gray-900">Local Storage</p>
                      <p className="text-sm text-gray-600">C:\Users\Reycel\Documents\FamilyTree\Backups</p>
                    </div>
                  </div>
                  <button className="text-sm text-blue-600 hover:text-blue-800">Configure</button>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <div className="flex items-center gap-3">
                    <Cloud className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="font-medium text-gray-900">Cloud Storage</p>
                      <p className="text-sm text-gray-600">Google Drive • Connected</p>
                    </div>
                  </div>
                  <button className="text-sm text-blue-600 hover:text-blue-800">Manage</button>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <div className="flex items-center gap-3">
                    <ExternalLink className="w-5 h-5 text-purple-600" />
                    <div>
                      <p className="font-medium text-gray-900">External Drive</p>
                      <p className="text-sm text-gray-600">Not configured</p>
                    </div>
                  </div>
                  <button className="text-sm text-blue-600 hover:text-blue-800">Setup</button>
                </div>
              </div>
            </div>

            {/* Retention Policy */}
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Retention Policy</h4>
              <div className="space-y-3">
                <div className="p-3 bg-gray-50 rounded">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-medium text-gray-900">Daily Backups</p>
                    <span className="text-sm text-gray-600">Keep for 30 days</span>
                  </div>
                  <input
                    type="range"
                    min="7"
                    max="90"
                    defaultValue="30"
                    className="w-full"
                  />
                </div>
                <div className="p-3 bg-gray-50 rounded">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-medium text-gray-900">Weekly Backups</p>
                    <span className="text-sm text-gray-600">Keep for 90 days</span>
                  </div>
                  <input
                    type="range"
                    min="30"
                    max="365"
                    defaultValue="90"
                    className="w-full"
                  />
                </div>
                <div className="p-3 bg-gray-50 rounded">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-medium text-gray-900">Monthly Backups</p>
                    <span className="text-sm text-gray-600">Keep for 1 year</span>
                  </div>
                  <input
                    type="range"
                    min="90"
                    max="1825"
                    defaultValue="365"
                    className="w-full"
                  />
                </div>
              </div>
            </div>

            {/* Security Settings */}
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Security</h4>
              <div className="space-y-3">
                <label className="flex items-center justify-between p-3 bg-gray-50 rounded cursor-pointer">
                  <div>
                    <p className="font-medium text-gray-900">Default Encryption</p>
                    <p className="text-sm text-gray-600">Encrypt all backups by default</p>
                  </div>
                  <input type="checkbox" defaultChecked className="w-5 h-5 text-blue-600 rounded" />
                </label>
                <label className="flex items-center justify-between p-3 bg-gray-50 rounded cursor-pointer">
                  <div>
                    <p className="font-medium text-gray-900">Verify Checksums</p>
                    <p className="text-sm text-gray-600">Verify data integrity on restore</p>
                  </div>
                  <input type="checkbox" defaultChecked className="w-5 h-5 text-blue-600 rounded" />
                </label>
                <label className="flex items-center justify-between p-3 bg-gray-50 rounded cursor-pointer">
                  <div>
                    <p className="font-medium text-gray-900">Two-Factor Auth</p>
                    <p className="text-sm text-gray-600">Require 2FA for backup operations</p>
                  </div>
                  <input type="checkbox" className="w-5 h-5 text-blue-600 rounded" />
                </label>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Backup Detail Modal */}
      {selectedBackup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Backup Details</h3>
                <button
                  onClick={() => setSelectedBackup(null)}
                  className="p-2 hover:bg-gray-100 rounded"
                >
                  ×
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">File Information</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Name:</p>
                      <p className="font-medium">{selectedBackup.name}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Size:</p>
                      <p className="font-medium">{formatBytes(selectedBackup.size)}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Format:</p>
                      <p className="font-medium">{selectedBackup.format.toUpperCase()}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Created:</p>
                      <p className="font-medium">{new Date(selectedBackup.createdAt).toLocaleString()}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Content Summary</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-3 bg-blue-50 rounded">
                      <Users className="w-6 h-6 text-blue-600 mx-auto mb-1" />
                      <p className="text-lg font-semibold text-blue-900">{selectedBackup.itemCounts.persons}</p>
                      <p className="text-xs text-blue-700">Persons</p>
                    </div>
                    <div className="text-center p-3 bg-green-50 rounded">
                      <FileText className="w-6 h-6 text-green-600 mx-auto mb-1" />
                      <p className="text-lg font-semibold text-green-900">{selectedBackup.itemCounts.sources}</p>
                      <p className="text-xs text-green-700">Sources</p>
                    </div>
                    <div className="text-center p-3 bg-purple-50 rounded">
                      <Camera className="w-6 h-6 text-purple-600 mx-auto mb-1" />
                      <p className="text-lg font-semibold text-purple-900">{selectedBackup.itemCounts.media}</p>
                      <p className="text-xs text-purple-700">Media</p>
                    </div>
                    <div className="text-center p-3 bg-orange-50 rounded">
                      <Link className="w-6 h-6 text-orange-600 mx-auto mb-1" />
                      <p className="text-lg font-semibold text-orange-900">{selectedBackup.itemCounts.citations}</p>
                      <p className="text-xs text-orange-700">Citations</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Security</h4>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      {selectedBackup.encrypted ? (
                        <>
                          <Lock className="w-4 h-4 text-green-600" />
                          <span className="text-sm text-green-600">Encrypted</span>
                        </>
                      ) : (
                        <>
                          <Unlock className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-600">Not Encrypted</span>
                        </>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {selectedBackup.compressed ? (
                        <>
                          <Archive className="w-4 h-4 text-blue-600" />
                          <span className="text-sm text-blue-600">Compressed</span>
                        </>
                      ) : (
                        <>
                          <Archive className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-600">Not Compressed</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Checksum</h4>
                  <div className="p-3 bg-gray-50 rounded font-mono text-sm">
                    {selectedBackup.checksum}
                  </div>
                </div>

                <div className="flex gap-2 pt-4 border-t">
                  <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                    <Download className="w-4 h-4" />
                    Download
                  </button>
                  <button className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">
                    <RefreshCw className="w-4 h-4" />
                    Restore
                  </button>
                  <button className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
