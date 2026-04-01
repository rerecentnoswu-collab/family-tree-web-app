import React, { useState, useEffect, useMemo } from 'react';
import { FileText, Book, Globe, Archive, Camera, Users, Search, Plus, Edit3, Trash2, Download, Upload, Shield, AlertTriangle, CheckCircle, Clock, Calendar, MapPin, User, Link, Star, Filter, ChevronDown, ChevronUp, Copy, ExternalLink } from 'lucide-react';

interface Source {
  id: string;
  title: string;
  type: 'book' | 'document' | 'website' | 'archive' | 'photo' | 'interview' | 'newspaper' | 'certificate' | 'military' | 'census' | 'other';
  author?: string;
  publicationDate?: string;
  publisher?: string;
  location?: string;
  url?: string;
  description: string;
  reliability: 'primary' | 'secondary' | 'questionable';
  verified: boolean;
  tags: string[];
  attachments: string[];
  citations: string[];
  createdAt: string;
  updatedAt: string;
  confidence: number;
  evidence: Evidence[];
}

interface Evidence {
  id: string;
  sourceId: string;
  personId: string;
  factType: 'birth' | 'death' | 'marriage' | 'residence' | 'occupation' | 'relationship' | 'military_service' | 'immigration' | 'other';
  factValue: string;
  date?: string;
  location?: string;
  notes?: string;
  extractedText?: string;
  pageReference?: string;
  confidence: number;
  verified: boolean;
  conflictingEvidence?: string[];
}

interface Citation {
  id: string;
  sourceId: string;
  personId: string;
  factType: string;
  template: string;
  formatted: string;
  notes?: string;
  quality: 'high' | 'medium' | 'low';
  verified: boolean;
}

export function SourceCitationManager({ persons }: { persons: any[] }) {
  const [sources, setSources] = useState<Source[]>([]);
  const [evidence, setEvidence] = useState<Evidence[]>([]);
  const [citations, setCitations] = useState<Citation[]>([]);
  const [activeTab, setActiveTab] = useState<'sources' | 'evidence' | 'citations'>('sources');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'book' | 'document' | 'website' | 'archive' | 'photo'>('all');
  const [filterReliability, setFilterReliability] = useState<'all' | 'primary' | 'secondary' | 'questionable'>('all');
  const [selectedSource, setSelectedSource] = useState<Source | null>(null);
  const [expandedSources, setExpandedSources] = useState<Set<string>>(new Set());

  // Generate mock sources
  const generateMockSources = useMemo(() => {
    const mockSources: Source[] = [
      {
        id: 'source-1',
        title: 'Family Bible - Johnson Family',
        type: 'book',
        author: 'Various Family Members',
        publicationDate: '1890-1950',
        publisher: 'Family Records',
        location: 'Springfield, Illinois',
        description: 'Family bible containing birth, marriage, and death records of the Johnson family',
        reliability: 'primary',
        verified: true,
        tags: ['birth', 'death', 'marriage', 'family records'],
        attachments: ['bible_page_1.jpg', 'bible_page_2.jpg'],
        citations: ['citation-1', 'citation-2'],
        createdAt: '2024-01-15',
        updatedAt: '2024-01-20',
        confidence: 0.95,
        evidence: []
      },
      {
        id: 'source-2',
        title: '1910 United States Federal Census',
        type: 'census',
        author: 'U.S. Census Bureau',
        publicationDate: '1910',
        publisher: 'National Archives',
        location: 'Washington D.C.',
        url: 'https://www.archives.gov/research/census/1910',
        description: 'Federal census records showing household composition and demographics',
        reliability: 'primary',
        verified: true,
        tags: ['census', 'demographics', 'residence'],
        attachments: ['census_page_34.jpg'],
        citations: ['citation-3'],
        createdAt: '2024-01-16',
        updatedAt: '2024-01-18',
        confidence: 0.98,
        evidence: []
      },
      {
        id: 'source-3',
        title: 'World War II Draft Registration Card',
        type: 'military',
        author: 'Selective Service System',
        publicationDate: '1942',
        publisher: 'National Archives',
        location: 'St. Louis, Missouri',
        description: 'Military draft registration card with personal information',
        reliability: 'primary',
        verified: true,
        tags: ['military', 'draft', 'personal information'],
        attachments: ['draft_card_front.jpg', 'draft_card_back.jpg'],
        citations: ['citation-4'],
        createdAt: '2024-01-17',
        updatedAt: '2024-01-19',
        confidence: 0.92,
        evidence: []
      },
      {
        id: 'source-4',
        title: 'County Marriage Records',
        type: 'certificate',
        author: 'County Clerk Office',
        publicationDate: '1925-1960',
        publisher: 'Springfield County',
        location: 'Springfield, Illinois',
        description: 'Official marriage certificates and licenses',
        reliability: 'primary',
        verified: true,
        tags: ['marriage', 'certificate', 'official'],
        attachments: ['marriage_cert_1955.jpg'],
        citations: ['citation-5'],
        createdAt: '2024-01-18',
        updatedAt: '2024-01-18',
        confidence: 0.96,
        evidence: []
      },
      {
        id: 'source-5',
        title: 'Family Photo Album - 1940s',
        type: 'photo',
        author: 'Unknown Family Member',
        publicationDate: '1940-1949',
        description: 'Collection of family photographs from the 1940s era',
        reliability: 'secondary',
        verified: false,
        tags: ['photographs', 'visual evidence', 'family history'],
        attachments: ['photo_001.jpg', 'photo_002.jpg', 'photo_003.jpg'],
        citations: ['citation-6'],
        createdAt: '2024-01-19',
        updatedAt: '2024-01-21',
        confidence: 0.75,
        evidence: []
      }
    ];

    return mockSources;
  }, []);

  // Generate mock evidence
  const generateMockEvidence = useMemo(() => {
    const mockEvidence: Evidence[] = [
      {
        id: 'evidence-1',
        sourceId: 'source-1',
        personId: 'person-1',
        factType: 'birth',
        factValue: 'John William Johnson',
        date: '1892-03-15',
        location: 'Springfield, Illinois',
        notes: 'Birth recorded in family bible',
        pageReference: 'Page 23',
        confidence: 0.95,
        verified: true
      },
      {
        id: 'evidence-2',
        sourceId: 'source-2',
        personId: 'person-1',
        factType: 'residence',
        factValue: '123 Oak Street',
        date: '1910-04-15',
        location: 'Springfield, Illinois',
        notes: 'Census shows household with 5 members',
        pageReference: 'Sheet 34A',
        confidence: 0.98,
        verified: true
      },
      {
        id: 'evidence-3',
        sourceId: 'source-3',
        personId: 'person-1',
        factType: 'military_service',
        factValue: 'Draft Registration',
        date: '1942-10-16',
        location: 'St. Louis, Missouri',
        notes: 'Age recorded as 50, occupation: Carpenter',
        pageReference: 'Card Front',
        confidence: 0.92,
        verified: true
      }
    ];

    return mockEvidence;
  }, []);

  // Generate mock citations
  const generateMockCitations = useMemo(() => {
    const mockCitations: Citation[] = [
      {
        id: 'citation-1',
        sourceId: 'source-1',
        personId: 'person-1',
        factType: 'birth',
        template: 'Chicago Manual of Style',
        formatted: 'Johnson Family Bible, Birth Records, 1892, Page 23, Springfield, Illinois.',
        notes: 'Primary source family record',
        quality: 'high',
        verified: true
      },
      {
        id: 'citation-2',
        sourceId: 'source-2',
        personId: 'person-1',
        factType: 'residence',
        template: 'APA Style',
        formatted: 'U.S. Census Bureau. (1910). 1910 Federal Census. Springfield, Illinois: Sheet 34A.',
        notes: 'Official government census record',
        quality: 'high',
        verified: true
      }
    ];

    return mockCitations;
  }, []);

  useEffect(() => {
    setSources(generateMockSources);
    setEvidence(generateMockEvidence);
    setCitations(generateMockCitations);
  }, [generateMockSources, generateMockEvidence, generateMockCitations]);

  // Filter sources
  const filteredSources = useMemo(() => {
    let filtered = sources;

    if (searchTerm) {
      filtered = filtered.filter(source =>
        source.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        source.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        source.author?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        source.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (filterType !== 'all') {
      filtered = filtered.filter(source => source.type === filterType);
    }

    if (filterReliability !== 'all') {
      filtered = filtered.filter(source => source.reliability === filterReliability);
    }

    return filtered;
  }, [sources, searchTerm, filterType, filterReliability]);

  // Get source icon
  const getSourceIcon = (type: string) => {
    switch (type) {
      case 'book': return <Book className="w-5 h-5" />;
      case 'document': return <FileText className="w-5 h-5" />;
      case 'website': return <Globe className="w-5 h-5" />;
      case 'archive': return <Archive className="w-5 h-5" />;
      case 'photo': return <Camera className="w-5 h-5" />;
      case 'interview': return <Users className="w-5 h-5" />;
      case 'military': return <Shield className="w-5 h-5" />;
      case 'census': return <Users className="w-5 h-5" />;
      default: return <FileText className="w-5 h-5" />;
    }
  };

  // Get reliability color
  const getReliabilityColor = (reliability: string) => {
    switch (reliability) {
      case 'primary': return 'text-green-600 bg-green-50';
      case 'secondary': return 'text-yellow-600 bg-yellow-50';
      case 'questionable': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  // Get quality color
  const getQualityColor = (quality: string) => {
    switch (quality) {
      case 'high': return 'text-green-600 bg-green-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'low': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  // Toggle source expansion
  const toggleSourceExpansion = (sourceId: string) => {
    const newExpanded = new Set(expandedSources);
    if (newExpanded.has(sourceId)) {
      newExpanded.delete(sourceId);
    } else {
      newExpanded.add(sourceId);
    }
    setExpandedSources(newExpanded);
  };

  // Copy citation to clipboard
  const copyCitation = (citation: string) => {
    navigator.clipboard.writeText(citation);
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-blue-100 rounded-lg">
            <FileText className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Source Citation Manager</h2>
            <p className="text-gray-600">Automated citation and evidence management system</p>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 rounded-lg p-4">
            <Book className="w-6 h-6 text-blue-600 mb-2" />
            <h3 className="font-semibold text-blue-900 mb-1">Sources</h3>
            <p className="text-sm text-blue-700">{sources.length} documents</p>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <CheckCircle className="w-6 h-6 text-green-600 mb-2" />
            <h3 className="font-semibold text-green-900 mb-1">Evidence</h3>
            <p className="text-sm text-green-700">{evidence.length} facts</p>
          </div>
          <div className="bg-purple-50 rounded-lg p-4">
            <Link className="w-6 h-6 text-purple-600 mb-2" />
            <h3 className="font-semibold text-purple-900 mb-1">Citations</h3>
            <p className="text-sm text-purple-700">{citations.length} formatted</p>
          </div>
          <div className="bg-orange-50 rounded-lg p-4">
            <Star className="w-6 h-6 text-orange-600 mb-2" />
            <h3 className="font-semibold text-orange-900 mb-1">Verified</h3>
            <p className="text-sm text-orange-700">{sources.filter(s => s.verified).length} sources</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 mb-6">
          <button
            onClick={() => setActiveTab('sources')}
            className={`flex items-center gap-2 px-6 py-3 font-medium transition-colors ${
              activeTab === 'sources'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Book className="w-4 h-4" />
            Sources
          </button>
          <button
            onClick={() => setActiveTab('evidence')}
            className={`flex items-center gap-2 px-6 py-3 font-medium transition-colors ${
              activeTab === 'evidence'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <CheckCircle className="w-4 h-4" />
            Evidence
          </button>
          <button
            onClick={() => setActiveTab('citations')}
            className={`flex items-center gap-2 px-6 py-3 font-medium transition-colors ${
              activeTab === 'citations'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Link className="w-4 h-4" />
            Citations
          </button>
        </div>

        {/* Filters */}
        {activeTab === 'sources' && (
          <div className="flex gap-4 items-center">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search sources..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Types</option>
              <option value="book">Books</option>
              <option value="document">Documents</option>
              <option value="website">Websites</option>
              <option value="archive">Archives</option>
              <option value="photo">Photos</option>
            </select>
            <select
              value={filterReliability}
              onChange={(e) => setFilterReliability(e.target.value as any)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Reliability</option>
              <option value="primary">Primary</option>
              <option value="secondary">Secondary</option>
              <option value="questionable">Questionable</option>
            </select>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        {activeTab === 'sources' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Source Documents</h3>
              <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                <Plus className="w-4 h-4" />
                Add Source
              </button>
            </div>

            {filteredSources.map(source => (
              <div key={source.id} className="border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                <div className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${
                        source.type === 'book' ? 'bg-blue-50' :
                        source.type === 'document' ? 'bg-green-50' :
                        source.type === 'website' ? 'bg-purple-50' :
                        source.type === 'archive' ? 'bg-orange-50' :
                        source.type === 'photo' ? 'bg-pink-50' :
                        'bg-gray-50'
                      }`}>
                        {getSourceIcon(source.type)}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 mb-1">{source.title}</h4>
                        {source.author && (
                          <p className="text-sm text-gray-600 mb-1">By: {source.author}</p>
                        )}
                        <p className="text-sm text-gray-600 mb-2">{source.description}</p>
                        
                        <div className="flex items-center gap-4 text-sm text-gray-500 mb-2">
                          {source.publicationDate && (
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {source.publicationDate}
                            </span>
                          )}
                          {source.location && (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {source.location}
                            </span>
                          )}
                          {source.publisher && (
                            <span className="flex items-center gap-1">
                              <Book className="w-3 h-3" />
                              {source.publisher}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 mb-2">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getReliabilityColor(source.reliability)}`}>
                            {source.reliability.toUpperCase()}
                          </span>
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-600">
                            {Math.round(source.confidence * 100)}% confidence
                          </span>
                          {source.verified && (
                            <span className="flex items-center gap-1 text-xs text-green-600">
                              <CheckCircle className="w-3 h-3" />
                              Verified
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap gap-1">
                          {source.tags.map((tag, index) => (
                            <span key={index} className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleSourceExpansion(source.id)}
                        className="p-2 hover:bg-gray-100 rounded-lg"
                      >
                        {expandedSources.has(source.id) ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                      <button className="p-2 hover:bg-gray-100 rounded-lg">
                        <Edit3 className="w-4 h-4 text-gray-600" />
                      </button>
                      <button className="p-2 hover:bg-gray-100 rounded-lg">
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </button>
                    </div>
                  </div>

                  {expandedSources.has(source.id) && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h5 className="font-medium text-gray-900 mb-2">Attachments</h5>
                          <div className="space-y-1">
                            {source.attachments.map((attachment, index) => (
                              <div key={index} className="flex items-center gap-2 text-sm text-gray-600">
                                <FileText className="w-4 h-4" />
                                {attachment}
                              </div>
                            ))}
                          </div>
                        </div>
                        
                        <div>
                          <h5 className="font-medium text-gray-900 mb-2">Related Citations</h5>
                          <div className="space-y-1">
                            {source.citations.map((citationId, index) => (
                              <div key={index} className="flex items-center gap-2 text-sm text-gray-600">
                                <Link className="w-4 h-4" />
                                Citation {index + 1}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {source.url && (
                        <div className="mt-4">
                          <h5 className="font-medium text-gray-900 mb-2">External Link</h5>
                          <a
                            href={source.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800"
                          >
                            <ExternalLink className="w-4 h-4" />
                            {source.url}
                          </a>
                        </div>
                      )}

                      <div className="mt-4 flex items-center justify-between">
                        <div className="text-sm text-gray-500">
                          Created: {source.createdAt} | Updated: {source.updatedAt}
                        </div>
                        <div className="flex gap-2">
                          <button className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700">
                            View Evidence
                          </button>
                          <button className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700">
                            Generate Citation
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'evidence' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Evidence Records</h3>
              <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                <Plus className="w-4 h-4" />
                Add Evidence
              </button>
            </div>

            {evidence.map(evidence => (
              <div key={evidence.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="font-semibold text-gray-900">{evidence.factType.toUpperCase()}</h4>
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-600">
                        {Math.round(evidence.confidence * 100)}% confidence
                      </span>
                      {evidence.verified && (
                        <span className="flex items-center gap-1 text-xs text-green-600">
                          <CheckCircle className="w-3 h-3" />
                          Verified
                        </span>
                      )}
                    </div>
                    
                    <p className="text-gray-900 mb-2">{evidence.factValue}</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-2">
                      {evidence.date && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Calendar className="w-4 h-4" />
                          {evidence.date}
                        </div>
                      )}
                      {evidence.location && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <MapPin className="w-4 h-4" />
                          {evidence.location}
                        </div>
                      )}
                      {evidence.pageReference && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <FileText className="w-4 h-4" />
                          {evidence.pageReference}
                        </div>
                      )}
                    </div>

                    {evidence.notes && (
                      <div className="bg-gray-50 rounded p-3 mb-2">
                        <p className="text-sm text-gray-700">{evidence.notes}</p>
                      </div>
                    )}

                    {evidence.conflictingEvidence && evidence.conflictingEvidence.length > 0 && (
                      <div className="bg-yellow-50 rounded p-3 mb-2">
                        <p className="text-sm font-medium text-yellow-800 mb-1">Conflicting Evidence:</p>
                        <ul className="text-sm text-yellow-700 space-y-1">
                          {evidence.conflictingEvidence.map((conflict, index) => (
                            <li key={index} className="flex items-start gap-2">
                              <AlertTriangle className="w-3 h-3 mt-0.5" />
                              {conflict}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span>Source ID: {evidence.sourceId}</span>
                      <span>Person ID: {evidence.personId}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button className="p-2 hover:bg-gray-100 rounded-lg">
                      <Edit3 className="w-4 h-4 text-gray-600" />
                    </button>
                    <button className="p-2 hover:bg-gray-100 rounded-lg">
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'citations' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Formatted Citations</h3>
              <div className="flex gap-2">
                <button className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                  <Download className="w-4 h-4" />
                  Export All
                </button>
                <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  <Plus className="w-4 h-4" />
                  Generate Citation
                </button>
              </div>
            </div>

            {citations.map(citation => (
              <div key={citation.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="font-semibold text-gray-900">{citation.factType.toUpperCase()}</h4>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getQualityColor(citation.quality)}`}>
                        {citation.quality.toUpperCase()} QUALITY
                      </span>
                      {citation.verified && (
                        <span className="flex items-center gap-1 text-xs text-green-600">
                          <CheckCircle className="w-3 h-3" />
                          Verified
                        </span>
                      )}
                    </div>

                    <div className="bg-gray-50 rounded p-3 mb-3">
                      <p className="text-sm text-gray-900 font-mono">{citation.formatted}</p>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                      <span className="flex items-center gap-1">
                        <Book className="w-4 h-4" />
                        {citation.template}
                      </span>
                      <span>Source: {citation.sourceId}</span>
                      <span>Person: {citation.personId}</span>
                    </div>

                    {citation.notes && (
                      <div className="bg-blue-50 rounded p-3">
                        <p className="text-sm text-blue-800">{citation.notes}</p>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => copyCitation(citation.formatted)}
                      className="p-2 hover:bg-gray-100 rounded-lg"
                      title="Copy citation"
                    >
                      <Copy className="w-4 h-4 text-gray-600" />
                    </button>
                    <button className="p-2 hover:bg-gray-100 rounded-lg">
                      <Edit3 className="w-4 h-4 text-gray-600" />
                    </button>
                    <button className="p-2 hover:bg-gray-100 rounded-lg">
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </button>
                  </div>
                </div>
              </div>
            ))}

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-blue-600 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <p className="font-semibold mb-1">Citation Standards</p>
                  <p>All citations follow recognized genealogical standards including Chicago Manual of Style, APA, and Evidence Explained formats. Ensure proper source verification before using citations for official documentation.</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
            <Upload className="w-5 h-5 text-blue-600" />
            <div className="text-left">
              <p className="font-medium text-gray-900">Import Sources</p>
              <p className="text-sm text-gray-600">Upload documents and records</p>
            </div>
          </button>
          <button className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
            <FileText className="w-5 h-5 text-green-600" />
            <div className="text-left">
              <p className="font-medium text-gray-900">Extract Evidence</p>
              <p className="text-sm text-gray-600">AI-powered text extraction</p>
            </div>
          </button>
          <button className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
            <Download className="w-5 h-5 text-purple-600" />
            <div className="text-left">
              <p className="font-medium text-gray-900">Export Citations</p>
              <p className="text-sm text-gray-600">Download formatted bibliography</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
