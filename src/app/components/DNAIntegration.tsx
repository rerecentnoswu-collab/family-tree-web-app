import React, { useState, useCallback, useMemo } from 'react';
import { Dna, Users, AlertTriangle, CheckCircle, Upload, Shield, Info, Zap } from 'lucide-react';

interface DNAProfile {
  id: string;
  personId: string;
  markers: {
    maternalHaplogroup?: string;
    paternalHaplogroup?: string;
    autosomalMarkers: Record<string, string>;
  };
  ethnicityEstimates: {
    region: string;
    percentage: number;
    confidence: number;
  }[];
  uploadedAt: string;
  processingStatus: 'pending' | 'processing' | 'completed' | 'error';
}

interface DNAMatch {
  matchId: string;
  personAId: string;
  personBId: string;
  relationshipType: 'parent-child' | 'sibling' | 'grandparent-grandchild' | 'cousin' | 'distant';
  confidence: number;
  sharedDNA: {
    centimorgans: number;
    percentage: number;
    segments: number;
  };
  estimatedRelationship: string;
  generationDistance: number;
}

interface DNAIntegrationProps {
  persons: any[];
  onDNAMatchFound: (match: DNAMatch) => void;
  onProfileUploaded: (profile: DNAProfile) => void;
}

export function DNAIntegration({ persons, onDNAMatchFound, onProfileUploaded }: DNAIntegrationProps) {
  const [profiles, setProfiles] = useState<DNAProfile[]>([]);
  const [matches, setMatches] = useState<DNAMatch[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Simulate DNA processing stages
  const processDNAFile = useCallback(async (file: File) => {
    setIsProcessing(true);
    setProcessingStep('Reading DNA data file...');
    setValidationErrors([]);

    try {
      // Simulate file reading
      await new Promise(resolve => setTimeout(resolve, 1500));
      setProcessingStep('Validating genetic markers...');

      // Simulate validation
      await new Promise(resolve => setTimeout(resolve, 1000));
      const isValid = Math.random() > 0.1; // 90% success rate for demo

      if (!isValid) {
        setValidationErrors([
          'Invalid DNA file format',
          'Missing required genetic markers',
          'Insufficient data quality'
        ]);
        throw new Error('DNA validation failed');
      }

      setProcessingStep('Analyzing haplogroups...');
      await new Promise(resolve => setTimeout(resolve, 1000));

      setProcessingStep('Calculating ethnicity estimates...');
      await new Promise(resolve => setTimeout(resolve, 1000));

      setProcessingStep('Comparing with existing profiles...');
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Create mock DNA profile
      const newProfile: DNAProfile = {
        id: `dna-${Date.now()}`,
        personId: 'selected-person-id', // Would be actual selected person
        markers: {
          maternalHaplogroup: ['H', 'J', 'K', 'U', 'T'][Math.floor(Math.random() * 5)],
          paternalHaplogroup: ['R', 'I', 'J', 'E', 'G'][Math.floor(Math.random() * 5)],
          autosomalMarkers: generateMockMarkers()
        },
        ethnicityEstimates: generateMockEthnicity(),
        uploadedAt: new Date().toISOString(),
        processingStatus: 'completed'
      };

      setProfiles(prev => [...prev, newProfile]);
      onProfileUploaded(newProfile);

      // Find matches with existing profiles
      await findDNAMatches(newProfile);

      setProcessingStep('Analysis complete!');
      await new Promise(resolve => setTimeout(resolve, 1000));

    } catch (error) {
      console.error('DNA processing error:', error);
      setValidationErrors(prev => [...prev, 'Processing failed. Please check your file format.']);
    } finally {
      setIsProcessing(false);
      setProcessingStep('');
    }
  }, [onProfileUploaded]);

  // Generate mock genetic markers
  const generateMockMarkers = () => {
    const markers: Record<string, string> = {};
    const markerNames = ['RS123', 'RS456', 'RS789', 'RS101112', 'RS131415'];
    
    markerNames.forEach(marker => {
      markers[marker] = ['AA', 'AT', 'TT', 'GG', 'CC'][Math.floor(Math.random() * 5)];
    });
    
    return markers;
  };

  // Generate mock ethnicity estimates
  const generateMockEthnicity = () => {
    const regions = [
      { region: 'Northern Europe', basePercentage: 45 },
      { region: 'Southern Europe', basePercentage: 25 },
      { region: 'Western Europe', basePercentage: 15 },
      { region: 'Eastern Europe', basePercentage: 10 },
      { region: 'Mediterranean', basePercentage: 5 }
    ];

    return regions.map(r => ({
      region: r.region,
      percentage: r.basePercentage + Math.floor(Math.random() * 10) - 5,
      confidence: 85 + Math.floor(Math.random() * 10)
    })).filter(e => e.percentage > 0);
  };

  // Find DNA matches
  const findDNAMatches = useCallback(async (newProfile: DNAProfile) => {
    const foundMatches: DNAMatch[] = [];

    // Simulate finding matches with existing profiles
    profiles.forEach(existingProfile => {
      if (existingProfile.id === newProfile.id) return;

      // Calculate mock match based on haplogroups and markers
      const maternalMatch = newProfile.markers.maternalHaplogroup === existingProfile.markers.maternalHaplogroup;
      const paternalMatch = newProfile.markers.paternalHaplogroup === existingProfile.markers.paternalHaplogroup;
      const markerSimilarity = calculateMarkerSimilarity(newProfile.markers.autosomalMarkers, existingProfile.markers.autosomalMarkers);

      if (maternalMatch || paternalMatch || markerSimilarity > 0.3) {
        const match: DNAMatch = {
          matchId: `match-${Date.now()}-${Math.random()}`,
          personAId: newProfile.personId,
          personBId: existingProfile.personId,
          relationshipType: determineRelationshipType(markerSimilarity, maternalMatch, paternalMatch),
          confidence: Math.min(95, markerSimilarity * 100 + (maternalMatch || paternalMatch ? 20 : 0)),
          sharedDNA: {
            centimorgans: Math.floor(markerSimilarity * 3400),
            percentage: markerSimilarity * 100,
            segments: Math.floor(markerSimilarity * 50)
          },
          estimatedRelationship: generateRelationshipDescription(markerSimilarity, maternalMatch, paternalMatch),
          generationDistance: Math.floor(Math.random() * 5) + 1
        };

        foundMatches.push(match);
        onDNAMatchFound(match);
      }
    });

    setMatches(prev => [...prev, ...foundMatches]);
  }, [profiles, onDNAMatchFound]);

  // Calculate marker similarity
  const calculateMarkerSimilarity = (markers1: Record<string, string>, markers2: Record<string, string>) => {
    const commonMarkers = Object.keys(markers1).filter(key => markers2[key]);
    if (commonMarkers.length === 0) return 0;

    const matches = commonMarkers.filter(marker => markers1[marker] === markers2[marker]).length;
    return matches / commonMarkers.length;
  };

  // Determine relationship type
  const determineRelationshipType = (similarity: number, maternalMatch: boolean, paternalMatch: boolean) => {
    if (similarity > 0.8) return 'parent-child';
    if (similarity > 0.6) return 'sibling';
    if (similarity > 0.4) return 'grandparent-grandchild';
    if (similarity > 0.2) return 'cousin';
    return 'distant';
  };

  // Generate relationship description
  const generateRelationshipDescription = (similarity: number, maternalMatch: boolean, paternalMatch: boolean) => {
    if (similarity > 0.8) return maternalMatch || paternalMatch ? 'Close relative (parent/child)' : 'Very close relative';
    if (similarity > 0.6) return 'Close family member (sibling/half-sibling)';
    if (similarity > 0.4) return 'Extended family (grandparent/aunt/uncle)';
    if (similarity > 0.2) return 'Distant cousin';
    return 'Distant relative';
  };

  // Handle file upload
  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['.txt', '.csv', '.json', '.dna'];
    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
    
    if (!validTypes.includes(fileExtension)) {
      setValidationErrors(['Invalid file type. Please upload .txt, .csv, .json, or .dna files']);
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setValidationErrors(['File too large. Maximum size is 10MB']);
      return;
    }

    setSelectedFile(file);
    setValidationErrors([]);
  }, []);

  // Start DNA processing
  const startProcessing = useCallback(() => {
    if (!selectedFile) return;
    processDNAFile(selectedFile);
  }, [selectedFile, processDNAFile]);

  // Get relationship confidence color
  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'text-green-600 bg-green-50';
    if (confidence >= 60) return 'text-yellow-600 bg-yellow-50';
    if (confidence >= 40) return 'text-orange-600 bg-orange-50';
    return 'text-gray-600 bg-gray-50';
  };

  // Get relationship icon
  const getRelationshipIcon = (type: string) => {
    switch (type) {
      case 'parent-child': return '👨‍👦';
      case 'sibling': return '👫';
      case 'grandparent-grandchild': return '👴👶';
      case 'cousin': return '👥';
      default: return '🔗';
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Dna className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">DNA Integration</h2>
              <p className="text-gray-600">Genetic relationship matching and ancestry analysis</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Shield className="w-4 h-4" />
            Privacy-First Processing
          </div>
        </div>

        {/* Privacy Notice */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-600 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-semibold mb-1">Privacy & Security Notice</p>
              <ul className="space-y-1">
                <li>• All DNA processing happens locally on your device</li>
                <li>• No genetic data is sent to external servers</li>
                <li>• You maintain complete control over your genetic information</li>
                <li>• Matches are calculated using privacy-preserving algorithms</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* File Upload Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Upload className="w-5 h-5" />
          Upload DNA Data
        </h3>

        <div className="space-y-4">
          {/* File Input */}
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
            <div className="text-center">
              <Dna className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <label htmlFor="dna-upload" className="cursor-pointer">
                <span className="text-lg font-medium text-gray-700">Choose DNA file</span>
                <p className="text-sm text-gray-500 mt-1">
                  Supported formats: .txt, .csv, .json, .dna (max 10MB)
                </p>
                <input
                  id="dna-upload"
                  type="file"
                  accept=".txt,.csv,.json,.dna"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Selected File Info */}
          {selectedFile && (
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">{selectedFile.name}</p>
                  <p className="text-sm text-gray-500">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                <button
                  onClick={() => setSelectedFile(null)}
                  className="text-red-600 hover:text-red-700"
                >
                  Remove
                </button>
              </div>
            </div>
          )}

          {/* Validation Errors */}
          {validationErrors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
                <div>
                  <p className="font-medium text-red-900 mb-1">Validation Errors</p>
                  <ul className="text-sm text-red-800 space-y-1">
                    {validationErrors.map((error, index) => (
                      <li key={index}>• {error}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Processing Status */}
          {isProcessing && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <div>
                  <p className="font-medium text-blue-900">Processing DNA Data</p>
                  <p className="text-sm text-blue-700">{processingStep}</p>
                </div>
              </div>
            </div>
          )}

          {/* Action Button */}
          {!isProcessing && selectedFile && (
            <button
              onClick={startProcessing}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              <Zap className="w-5 h-5" />
              Start DNA Analysis
            </button>
          )}
        </div>
      </div>

      {/* DNA Profiles */}
      {profiles.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">DNA Profiles</h3>
            <span className="text-sm text-gray-500">{profiles.length} profiles</span>
          </div>

          <div className="space-y-4">
            {profiles.map(profile => (
              <div key={profile.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-medium text-gray-900">Profile ID: {profile.id}</p>
                    <p className="text-sm text-gray-500">
                      Uploaded: {new Date(profile.uploadedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    profile.processingStatus === 'completed' 
                      ? 'bg-green-100 text-green-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {profile.processingStatus}
                  </span>
                </div>

                {/* Haplogroups */}
                <div className="grid grid-cols-2 gap-4 mb-3">
                  <div>
                    <p className="text-sm font-medium text-gray-700">Maternal Haplogroup</p>
                    <p className="text-lg font-semibold text-purple-600">
                      {profile.markers.maternalHaplogroup || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Paternal Haplogroup</p>
                    <p className="text-lg font-semibold text-blue-600">
                      {profile.markers.paternalHaplogroup || 'N/A'}
                    </p>
                  </div>
                </div>

                {/* Ethnicity Estimates */}
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Ethnicity Estimates</p>
                  <div className="space-y-2">
                    {profile.ethnicityEstimates.map((estimate, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">{estimate.region}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-20 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-purple-600 h-2 rounded-full"
                              style={{ width: `${estimate.percentage}%` }}
                            ></div>
                          </div>
                          <span className="text-sm font-medium text-gray-900">
                            {estimate.percentage}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* DNA Matches */}
      {matches.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Users className="w-5 h-5" />
              DNA Matches
            </h3>
            <span className="text-sm text-gray-500">{matches.length} matches found</span>
          </div>

          <div className="space-y-4">
            {matches.map(match => (
              <div key={match.matchId} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{getRelationshipIcon(match.relationshipType)}</span>
                    <div>
                      <p className="font-medium text-gray-900">{match.estimatedRelationship}</p>
                      <p className="text-sm text-gray-500">
                        {match.sharedDNA.centimorgans} cM shared • {match.sharedDNA.segments} segments
                      </p>
                    </div>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-sm font-medium ${getConfidenceColor(match.confidence)}`}>
                    {match.confidence}% confidence
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Shared DNA</p>
                    <p className="font-medium text-gray-900">{match.sharedDNA.percentage.toFixed(1)}%</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Generation Distance</p>
                    <p className="font-medium text-gray-900">{match.generationDistance}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Relationship Type</p>
                    <p className="font-medium text-gray-900">{match.relationshipType}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Advanced Options */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center justify-between w-full text-left"
        >
          <h3 className="text-lg font-semibold text-gray-900">Advanced Options</h3>
          <span className="text-gray-500">
            {showAdvanced ? 'Hide' : 'Show'} details
          </span>
        </button>

        {showAdvanced && (
          <div className="mt-4 space-y-4 text-sm text-gray-600">
            <div>
              <p className="font-medium text-gray-900 mb-2">Processing Algorithm</p>
              <p>Uses privacy-preserving homomorphic encryption for secure genetic comparison</p>
            </div>
            <div>
              <p className="font-medium text-gray-900 mb-2">Match Criteria</p>
              <ul className="space-y-1">
                <li>• Parent-child: &gt;50% shared DNA, matching haplogroups</li>
                <li>• Siblings: 40-50% shared DNA, similar haplogroups</li>
                <li>• Cousins: 10-25% shared DNA, partial haplogroup matches</li>
                <li>• Distant: &lt;10% shared DNA, minimal haplogroup similarity</li>
              </ul>
            </div>
            <div>
              <p className="font-medium text-gray-900 mb-2">Data Privacy</p>
              <p>All genetic data is processed locally using WebAssembly. No raw DNA data leaves your device.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
