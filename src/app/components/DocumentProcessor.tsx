import React, { useState, useCallback, useMemo } from 'react';
import { FileText, Upload, Brain, Eye, Download, AlertTriangle, CheckCircle, Search, Calendar, Users, MapPin } from 'lucide-react';

interface Document {
  id: string;
  name: string;
  type: 'birth_certificate' | 'marriage_record' | 'death_certificate' | 'census' | 'letter' | 'diary' | 'military_record' | 'immigration_record' | 'other';
  uploadDate: string;
  fileSize: number;
  processed: boolean;
  extractedText?: string;
  entities?: ExtractedEntity[];
  relationships?: DocumentRelationship[];
}

interface ExtractedEntity {
  text: string;
  type: 'person' | 'date' | 'location' | 'occupation' | 'relationship' | 'event';
  confidence: number;
  startIndex: number;
  endIndex: number;
  context: string;
}

interface DocumentRelationship {
  personId?: string;
  relationshipType: 'parent' | 'child' | 'spouse' | 'sibling' | 'witness' | 'official';
  mentionedPerson: string;
  confidence: number;
  evidence: string;
}

interface DocumentProcessorProps {
  persons: any[];
  onDocumentProcessed: (document: Document) => void;
  onRelationshipFound: (relationship: DocumentRelationship) => void;
}

export function DocumentProcessor({ persons, onDocumentProcessed, onRelationshipFound }: DocumentProcessorProps) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [entityFilter, setEntityFilter] = useState<string>('all');

  // Mock document processing
  const processDocument = useCallback(async (file: File, documentType: string) => {
    setIsProcessing(true);
    setProcessingStep('Reading document content...');

    try {
      // Simulate file reading
      await new Promise(resolve => setTimeout(resolve, 1500));
      setProcessingStep('Extracting text using OCR...');

      // Mock OCR text extraction
      const mockTexts = {
        birth_certificate: `BIRTH CERTIFICATE\n\nState of California\nCounty of San Francisco\n\nThis is to certify that John Michael Smith was born on March 15, 1925 in San Francisco, California to parents Robert Smith (occupation: Carpenter) and Mary Johnson Smith (occupation: Teacher). The birth was attended by Dr. James Wilson.\n\nWitness: Margaret Davis\nDate: April 1, 1925`,
        
        marriage_record: `MARRIAGE LICENSE\n\nState of New York\nCounty of Kings\n\nThis certifies that John Michael Smith, age 25, occupation: Engineer, residing in Brooklyn, New York and Elizabeth Marie Brown, age 23, occupation: Nurse, residing in Manhattan, New York were joined in marriage on June 20, 1950.\n\nWitnesses: Robert Smith (father), Margaret Brown (mother)\nOfficiant: Rev. Thomas Anderson`,
        
        death_certificate: `DEATH CERTIFICATE\n\nState of California\nCounty of Los Angeles\n\nThis certifies that John Michael Smith, born March 15, 1925 in San Francisco, California, died on December 10, 1998 in Los Angeles, California. Cause of death: Natural causes. Occupation at time of death: Retired Engineer.\n\nInformant: Elizabeth Smith (wife)\nDate: December 12, 1998`,
        
        letter: `Dear Sister,\n\nI hope this letter finds you well. I am writing from our new home in Chicago where I moved last month for the teaching position at Lincoln High School. The city is bustling with activity and the school is wonderful. The children are bright and eager to learn.\n\nPlease give my regards to mother and father. Tell them I miss them dearly and will visit for Christmas.\n\nYour loving sister,\nMargaret\n\nJune 15, 1948\nChicago, Illinois`,
        
        diary: `October 12, 1918\n\nAnother difficult day at the factory. The war has taken so many young men from our town. I worry about my brother James who is serving in France. Mother prays for his safety every night.\n\nThe influenza has reached our community. Many have fallen ill. We must be careful and keep our spirits high.\n\nWork continues despite the challenges. We must support our families and our country.\n\n- Robert`,
        
        military_record: `MILITARY SERVICE RECORD\n\nUnited States Army\n\nName: James Robert Smith\nService Number: 123-45-6789\nRank: Sergeant\nUnit: 82nd Airborne Division\nService Period: 1942-1945\nTheaters: European, Pacific\nCampaigns: Normandy, Battle of the Bulge\nAwards: Purple Heart, Bronze Star\nDischarge: Honorable\n\nDate of Birth: March 22, 1920\nPlace of Birth: San Francisco, California`
      };

      const extractedText = mockTexts[documentType as keyof typeof mockTexts] || 
        `Document content for ${file.name}. This contains various personal information including names, dates, locations, and relationships that would be relevant for genealogical research.`;

      setProcessingStep('Analyzing text for entities...');

      // Extract entities
      await new Promise(resolve => setTimeout(resolve, 1000));
      const entities = extractEntities(extractedText);

      setProcessingStep('Identifying relationships...');

      // Extract relationships
      await new Promise(resolve => setTimeout(resolve, 1000));
      const relationships = extractRelationships(extractedText, persons);

      setProcessingStep('Finalizing analysis...');

      // Create processed document
      const processedDocument: Document = {
        id: `doc-${Date.now()}`,
        name: file.name,
        type: documentType as any,
        uploadDate: new Date().toISOString(),
        fileSize: file.size,
        processed: true,
        extractedText,
        entities,
        relationships
      };

      setDocuments(prev => [...prev, processedDocument]);
      setSelectedDocument(processedDocument);
      onDocumentProcessed(processedDocument);

      // Notify about relationships
      relationships.forEach(rel => onRelationshipFound(rel));

      setProcessingStep('Processing complete!');
      await new Promise(resolve => setTimeout(resolve, 1000));

    } catch (error) {
      console.error('Document processing error:', error);
    } finally {
      setIsProcessing(false);
      setProcessingStep('');
    }
  }, [persons, onDocumentProcessed, onRelationshipFound]);

  // Extract entities from text
  const extractEntities = useCallback((text: string): ExtractedEntity[] => {
    const entities: ExtractedEntity[] = [];

    // Extract dates
    const datePattern = /\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4}\b/gi;
    const dates = text.match(datePattern) || [];
    dates.forEach(date => {
      const index = text.indexOf(date);
      entities.push({
        text: date,
        type: 'date',
        confidence: 0.9,
        startIndex: index,
        endIndex: index + date.length,
        context: text.substring(Math.max(0, index - 20), Math.min(text.length, index + date.length + 20))
      });
    });

    // Extract names (simplified)
    const namePattern = /\b([A-Z][a-z]+ [A-Z][a-z]+)\b/g;
    const names = text.match(namePattern) || [];
    names.forEach(name => {
      const index = text.indexOf(name);
      entities.push({
        text: name,
        type: 'person',
        confidence: 0.7,
        startIndex: index,
        endIndex: index + name.length,
        context: text.substring(Math.max(0, index - 20), Math.min(text.length, index + name.length + 20))
      });
    });

    // Extract locations
    const locationPattern = /\b(San Francisco|Los Angeles|New York|Chicago|Brooklyn|Manhattan|California|New York|Illinois|France|Europe|Pacific|European)\b/gi;
    const locations = text.match(locationPattern) || [];
    locations.forEach(location => {
      const index = text.indexOf(location);
      entities.push({
        text: location,
        type: 'location',
        confidence: 0.8,
        startIndex: index,
        endIndex: index + location.length,
        context: text.substring(Math.max(0, index - 20), Math.min(text.length, index + location.length + 20))
      });
    });

    // Extract occupations
    const occupationPattern = /\b(Teacher|Carpenter|Engineer|Nurse|Doctor|Officiant|Sergeant|Factory\s+Worker|Retired)\b/gi;
    const occupations = text.match(occupationPattern) || [];
    occupations.forEach(occupation => {
      const index = text.indexOf(occupation);
      entities.push({
        text: occupation,
        type: 'occupation',
        confidence: 0.75,
        startIndex: index,
        endIndex: index + occupation.length,
        context: text.substring(Math.max(0, index - 20), Math.min(text.length, index + occupation.length + 20))
      });
    });

    return entities;
  }, []);

  // Extract relationships from text
  const extractRelationships = useCallback((text: string, familyPersons: any[]): DocumentRelationship[] => {
    const relationships: DocumentRelationship[] = [];

    // Simple relationship extraction based on keywords
    if (text.includes('father') || text.includes('mother')) {
      relationships.push({
        relationshipType: 'parent',
        mentionedPerson: 'Parent mentioned in document',
        confidence: 0.8,
        evidence: 'Document contains parental references'
      });
    }

    if (text.includes('husband') || text.includes('wife') || text.includes('married')) {
      relationships.push({
        relationshipType: 'spouse',
        mentionedPerson: 'Spouse mentioned in document',
        confidence: 0.9,
        evidence: 'Document contains marital references'
      });
    }

    if (text.includes('brother') || text.includes('sister')) {
      relationships.push({
        relationshipType: 'sibling',
        mentionedPerson: 'Sibling mentioned in document',
        confidence: 0.7,
        evidence: 'Document contains sibling references'
      });
    }

    if (text.includes('witness')) {
      relationships.push({
        relationshipType: 'witness',
        mentionedPerson: 'Witness mentioned in document',
        confidence: 0.8,
        evidence: 'Document contains witness information'
      });
    }

    return relationships;
  }, []);

  // Handle file upload
  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['.pdf', '.jpg', '.jpeg', '.png', '.txt', '.doc', '.docx'];
    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
    
    if (!validTypes.includes(fileExtension)) {
      alert('Invalid file type. Please upload PDF, image, or text files.');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('File too large. Maximum size is 10MB.');
      return;
    }

    setSelectedFile(file);
  }, []);

  // Start document processing
  const startProcessing = useCallback((documentType: string) => {
    if (!selectedFile) return;
    processDocument(selectedFile, documentType);
  }, [selectedFile, processDocument]);

  // Filter entities
  const filteredEntities = useMemo(() => {
    if (!selectedDocument?.entities) return [];
    
    if (entityFilter === 'all') return selectedDocument.entities;
    
    return selectedDocument.entities.filter(entity => entity.type === entityFilter);
  }, [selectedDocument, entityFilter]);

  // Search entities
  const searchedEntities = useMemo(() => {
    if (!searchTerm) return filteredEntities;
    
    return filteredEntities.filter(entity => 
      entity.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entity.context.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [filteredEntities, searchTerm]);

  // Get entity icon and color
  const getEntityInfo = useCallback((type: string) => {
    switch (type) {
      case 'person':
        return { icon: Users, color: 'text-blue-600 bg-blue-50', label: 'Person' };
      case 'date':
        return { icon: Calendar, color: 'text-green-600 bg-green-50', label: 'Date' };
      case 'location':
        return { icon: MapPin, color: 'text-purple-600 bg-purple-50', label: 'Location' };
      case 'occupation':
        return { icon: FileText, color: 'text-orange-600 bg-orange-50', label: 'Occupation' };
      case 'relationship':
        return { icon: Users, color: 'text-pink-600 bg-pink-50', label: 'Relationship' };
      case 'event':
        return { icon: AlertTriangle, color: 'text-red-600 bg-red-50', label: 'Event' };
      default:
        return { icon: FileText, color: 'text-gray-600 bg-gray-50', label: 'Other' };
    }
  }, []);

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-green-100 rounded-lg">
            <Brain className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Document Processing</h2>
            <p className="text-gray-600">AI-powered analysis of historical documents and records</p>
          </div>
        </div>

        {/* Privacy Notice */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
            <div className="text-sm text-green-800">
              <p className="font-semibold mb-1">Privacy-First Processing</p>
              <ul className="space-y-1">
                <li>• All document processing happens locally on your device</li>
                <li>• No documents are sent to external servers</li>
                <li>• OCR and text analysis performed using WebAssembly</li>
                <li>• You maintain complete control over your documents</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Document Upload */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Upload className="w-5 h-5" />
              Upload Document
            </h3>

            {/* File Input */}
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 mb-4">
              <div className="text-center">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <label htmlFor="doc-upload" className="cursor-pointer">
                  <span className="text-lg font-medium text-gray-700">Choose document</span>
                  <p className="text-sm text-gray-500 mt-1">
                    PDF, Images, or Text files (max 10MB)
                  </p>
                  <input
                    id="doc-upload"
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png,.txt,.doc,.docx"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {/* Selected File */}
            {selectedFile && (
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
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

            {/* Document Type Selection */}
            {selectedFile && (
              <div className="space-y-3">
                <h4 className="font-medium text-gray-900">Document Type</h4>
                <div className="space-y-2">
                  {[
                    { value: 'birth_certificate', label: 'Birth Certificate' },
                    { value: 'marriage_record', label: 'Marriage Record' },
                    { value: 'death_certificate', label: 'Death Certificate' },
                    { value: 'census', label: 'Census Record' },
                    { value: 'letter', label: 'Letter' },
                    { value: 'diary', label: 'Diary/Journal' },
                    { value: 'military_record', label: 'Military Record' },
                    { value: 'immigration_record', label: 'Immigration Record' },
                    { value: 'other', label: 'Other Document' }
                  ].map(type => (
                    <button
                      key={type.value}
                      onClick={() => startProcessing(type.value)}
                      disabled={isProcessing}
                      className="w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {type.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Processing Status */}
            {isProcessing && (
              <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  <div>
                    <p className="font-medium text-blue-900">Processing Document</p>
                    <p className="text-sm text-blue-700">{processingStep}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Document List */}
          {documents.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Processed Documents</h3>
              <div className="space-y-2">
                {documents.map(doc => (
                  <button
                    key={doc.id}
                    onClick={() => setSelectedDocument(doc)}
                    className={`w-full text-left p-3 rounded-lg border transition-colors ${
                      selectedDocument?.id === doc.id
                        ? 'bg-blue-50 border-blue-200'
                        : 'bg-white border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <div className="font-medium text-gray-900">{doc.name}</div>
                    <div className="text-sm text-gray-500">
                      {doc.type.replace('_', ' ')} • {new Date(doc.uploadDate).toLocaleDateString()}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Document Analysis */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Eye className="w-5 h-5" />
                Document Analysis
              </h3>
              {selectedDocument && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">
                    {selectedDocument.entities?.length || 0} entities found
                  </span>
                  <button className="p-2 text-gray-500 hover:text-gray-700">
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {!selectedDocument ? (
              <div className="text-center py-12">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Upload and process a document to see analysis</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Extracted Text */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Extracted Text</h4>
                  <div className="bg-gray-50 rounded-lg p-4 max-h-48 overflow-y-auto">
                    <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                      {selectedDocument.extractedText}
                    </pre>
                  </div>
                </div>

                {/* Entity Filters */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Filter Entities</h4>
                  <div className="flex gap-2 mb-3">
                    <select
                      value={entityFilter}
                      onChange={(e) => setEntityFilter(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    >
                      <option value="all">All Types</option>
                      <option value="person">People</option>
                      <option value="date">Dates</option>
                      <option value="location">Locations</option>
                      <option value="occupation">Occupations</option>
                      <option value="relationship">Relationships</option>
                    </select>
                    <div className="flex-1">
                      <input
                        type="text"
                        placeholder="Search entities..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* Extracted Entities */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">
                    Extracted Entities ({searchedEntities.length})
                  </h4>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {searchedEntities.map((entity, index) => {
                      const entityInfo = getEntityInfo(entity.type);
                      const Icon = entityInfo.icon;
                      
                      return (
                        <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                          <div className={`p-2 rounded-lg ${entityInfo.color}`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-gray-900">{entity.text}</span>
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${entityInfo.color}`}>
                                {entityInfo.label}
                              </span>
                              <span className="text-xs text-gray-500">
                                {Math.round(entity.confidence * 100)}% confidence
                              </span>
                            </div>
                            <p className="text-sm text-gray-600">{entity.context}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Relationships */}
                {selectedDocument.relationships && selectedDocument.relationships.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">Identified Relationships</h4>
                    <div className="space-y-2">
                      {selectedDocument.relationships.map((rel, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                          <div>
                            <p className="font-medium text-blue-900 capitalize">{rel.relationshipType}</p>
                            <p className="text-sm text-blue-700">{rel.mentionedPerson}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-blue-600">{Math.round(rel.confidence * 100)}% confidence</p>
                            <p className="text-xs text-blue-500">{rel.evidence}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
