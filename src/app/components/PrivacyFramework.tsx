import React, { useState, useCallback } from 'react';
import { Shield, Lock, Eye, EyeOff, Database, Trash2, Download, Settings } from 'lucide-react';

interface PrivacySettings {
  photoProcessing: boolean;
  dnaAnalysis: boolean;
  historicalContext: boolean;
  documentProcessing: boolean;
  dataRetention: '30days' | '1year' | '5years' | 'permanent';
  shareWithFamily: boolean;
  encryptionEnabled: boolean;
  localProcessingOnly: boolean;
}

interface DataActivity {
  type: 'photo' | 'dna' | 'document' | 'profile';
  action: 'created' | 'updated' | 'deleted' | 'processed';
  timestamp: Date;
  description: string;
}

interface PrivacyFrameworkProps {
  settings?: Partial<PrivacySettings>;
  onSettingsChange?: (settings: PrivacySettings) => void;
  onExportData?: () => Promise<void>;
  onDeleteData?: (dataType: string) => Promise<void>;
}

export function PrivacyFramework({ 
  settings = {}, 
  onSettingsChange, 
  onExportData, 
  onDeleteData 
}: PrivacyFrameworkProps) {
  const [currentSettings, setCurrentSettings] = useState<PrivacySettings>({
    photoProcessing: false,
    dnaAnalysis: false,
    historicalContext: false,
    documentProcessing: false,
    dataRetention: '1year',
    shareWithFamily: false,
    encryptionEnabled: true,
    localProcessingOnly: true,
    ...settings
  });

  const [showActivityLog, setShowActivityLog] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Mock activity log (in real app, this would come from backend)
  const [activities] = useState<DataActivity[]>([
    {
      type: 'profile',
      action: 'created',
      timestamp: new Date(Date.now() - 86400000),
      description: 'Family member profile created'
    },
    {
      type: 'photo',
      action: 'processed',
      timestamp: new Date(Date.now() - 3600000),
      description: 'Photo processed for face recognition'
    }
  ]);

  const handleSettingChange = useCallback((key: keyof PrivacySettings, value: any) => {
    const newSettings = { ...currentSettings, [key]: value };
    setCurrentSettings(newSettings);
    onSettingsChange?.(newSettings);
  }, [currentSettings, onSettingsChange]);

  const handleExportData = useCallback(async () => {
    try {
      setIsExporting(true);
      await onExportData?.();
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  }, [onExportData]);

  const handleDeleteData = useCallback(async (dataType: string) => {
    if (!confirm(`Are you sure you want to delete all ${dataType} data? This action cannot be undone.`)) {
      return;
    }

    try {
      setIsDeleting(true);
      await onDeleteData?.(dataType);
    } catch (error) {
      console.error('Deletion failed:', error);
    } finally {
      setIsDeleting(false);
    }
  }, [onDeleteData]);

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2 flex items-center gap-2">
          <Shield className="w-6 h-6 text-blue-600" />
          Privacy & Security Settings
        </h2>
        <p className="text-gray-600">
          Manage your data privacy and security preferences with full control over your family information.
        </p>
      </div>

      {/* Privacy Overview */}
      <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
        <div className="flex items-center gap-3 mb-2">
          <Lock className="w-5 h-5 text-green-600" />
          <h3 className="font-semibold text-green-900">Your Privacy Status</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${currentSettings.encryptionEnabled ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-green-800">Encryption: {currentSettings.encryptionEnabled ? 'Enabled' : 'Disabled'}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${currentSettings.localProcessingOnly ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
            <span className="text-green-800">Processing: {currentSettings.localProcessingOnly ? 'Local Only' : 'Cloud Enabled'}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${currentSettings.shareWithFamily ? 'bg-yellow-500' : 'bg-green-500'}`}></div>
            <span className="text-green-800">Sharing: {currentSettings.shareWithFamily ? 'Family Enabled' : 'Private'}</span>
          </div>
        </div>
      </div>

      {/* Feature Permissions */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">AI Feature Permissions</h3>
        <div className="space-y-3">
          <div className="p-4 border border-gray-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-900">Photo Recognition</h4>
                <p className="text-sm text-gray-600">AI-powered face detection and matching</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={currentSettings.photoProcessing}
                  onChange={(e) => handleSettingChange('photoProcessing', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>

          <div className="p-4 border border-gray-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-900">DNA Analysis</h4>
                <p className="text-sm text-gray-600">Genetic relationship matching and analysis</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={currentSettings.dnaAnalysis}
                  onChange={(e) => handleSettingChange('dnaAnalysis', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>

          <div className="p-4 border border-gray-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-900">Historical Context</h4>
                <p className="text-sm text-gray-600">Historical event correlation and analysis</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={currentSettings.historicalContext}
                  onChange={(e) => handleSettingChange('historicalContext', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>

          <div className="p-4 border border-gray-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-900">Document Processing</h4>
                <p className="text-sm text-gray-600">OCR and text extraction from historical documents</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={currentSettings.documentProcessing}
                  onChange={(e) => handleSettingChange('documentProcessing', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Data Management */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Data Management</h3>
        
        {/* Data Retention */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Data Retention Period
          </label>
          <select
            value={currentSettings.dataRetention}
            onChange={(e) => handleSettingChange('dataRetention', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="30days">30 Days</option>
            <option value="1year">1 Year</option>
            <option value="5years">5 Years</option>
            <option value="permanent">Permanent</option>
          </select>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleExportData}
            disabled={isExporting}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
          >
            <Download className="w-4 h-4" />
            {isExporting ? 'Exporting...' : 'Export All Data'}
          </button>

          <button
            onClick={() => handleDeleteData('photos')}
            disabled={isDeleting}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            {isDeleting ? 'Deleting...' : 'Delete Photo Data'}
          </button>

          <button
            onClick={() => setShowActivityLog(!showActivityLog)}
            className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            {showActivityLog ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            {showActivityLog ? 'Hide' : 'Show'} Activity Log
          </button>
        </div>
      </div>

      {/* Activity Log */}
      {showActivityLog && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
          <div className="space-y-2">
            {activities.map((activity, index) => (
              <div key={index} className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Database className="w-4 h-4 text-gray-600" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{activity.description}</p>
                      <p className="text-xs text-gray-600">
                        {activity.type} • {activity.action} • {activity.timestamp.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Security Information */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start gap-3">
          <Settings className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <h3 className="font-semibold text-blue-900 mb-2">Security Features</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• End-to-end encryption for all sensitive data</li>
              <li>• Zero-knowledge architecture - we can't access your raw data</li>
              <li>• Local processing for photos and biometric data</li>
              <li>• GDPR and CCPA compliant data handling</li>
              <li>• Regular security audits and updates</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
