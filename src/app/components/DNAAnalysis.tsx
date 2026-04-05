import React, { useState, useEffect, useMemo } from 'react';
import { Dna, Users, Globe, Heart, AlertTriangle, TrendingUp, MapPin, Calendar, Filter, Search, Download, Upload, Shield, Activity } from 'lucide-react';
import { Person } from '../types/Person';

interface EthnicityRegion {
  id: string;
  name: string;
  percentage: number;
  confidence: number;
  subregions: string[];
  historicalContext: string;
  migrationPatterns: string[];
}

interface DNAMatch {
  id: string;
  matchId: string;
  name: string;
  relationshipType: 'parent' | 'child' | 'sibling' | 'half_sibling' | 'cousin' | 'distant_cousin' | 'unknown';
  sharedCentimorgans: number;
  sharedSegments: number;
  longestSegment: number;
  confidence: number;
  estimatedRelationship: string;
  commonAncestors?: string[];
  maternalPaternal: 'maternal' | 'paternal' | 'both' | 'unknown';
  contactInfo?: {
    email?: string;
    allowContact: boolean;
  };
}

interface GeneticTrait {
  id: string;
  name: string;
  category: 'physical' | 'health' | 'ancestral' | 'behavioral';
  description: string;
  confidence: number;
  evidence: string[];
  populationFrequency: number;
  implications: string[];
}

interface HealthInsight {
  id: string;
  condition: string;
  riskLevel: 'low' | 'moderate' | 'elevated' | 'high';
  geneticMarkers: string[];
  confidence: number;
  recommendations: string[];
  sources: string[];
  privacyLevel: 'public' | 'private' | 'restricted';
}

export function DNAAnalysis({ persons }: { persons: Person[] }) {
  const [ethnicityResults, setEthnicityResults] = useState<EthnicityRegion[]>([]);
  const [dnaMatches, setDnaMatches] = useState<DNAMatch[]>([]);
  const [geneticTraits, setGeneticTraits] = useState<GeneticTrait[]>([]);
  const [healthInsights, setHealthInsights] = useState<HealthInsight[]>([]);
  const [activeTab, setActiveTab] = useState<'ethnicity' | 'matches' | 'traits' | 'health'>('ethnicity');
  const [searchTerm, setSearchTerm] = useState('');
  const [relationshipFilter, setRelationshipFilter] = useState<'all' | 'close' | 'distant'>('all');
  const [confidenceFilter, setConfidenceFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');

  // Generate mock DNA ethnicity results
  const generateEthnicityResults = useMemo(() => {
    const regions: EthnicityRegion[] = [
      {
        id: 'northern-europe',
        name: 'Northern Europe',
        percentage: 45.2,
        confidence: 0.95,
        subregions: ['British Isles', 'Scandinavia', 'Germany'],
        historicalContext: 'Strong Viking and Anglo-Saxon influence',
        migrationPatterns: ['Migration to North America', 'Colonial expansion']
      },
      {
        id: 'southern-europe',
        name: 'Southern Europe',
        percentage: 23.8,
        confidence: 0.88,
        subregions: ['Italy', 'Spain', 'Greece'],
        historicalContext: 'Roman Empire and Mediterranean trade routes',
        migrationPatterns: ['Mediterranean trade', 'Colonial Americas']
      },
      {
        id: 'eastern-europe',
        name: 'Eastern Europe',
        percentage: 15.3,
        confidence: 0.82,
        subregions: ['Poland', 'Ukraine', 'Russia'],
        historicalContext: 'Slavic migrations and historical kingdoms',
        migrationPatterns: ['Immigration to industrial centers', 'Post-WWII migration']
      },
      {
        id: 'west-africa',
        name: 'West Africa',
        percentage: 8.7,
        confidence: 0.76,
        subregions: ['Nigeria', 'Ghana', 'Senegal'],
        historicalContext: 'Transatlantic slave trade and pre-colonial kingdoms',
        migrationPatterns: ['Forced migration through slavery', 'Recent immigration']
      },
      {
        id: 'east-asia',
        name: 'East Asia',
        percentage: 4.2,
        confidence: 0.65,
        subregions: ['China', 'Japan', 'Korea'],
        historicalContext: 'Ancient trade routes and cultural exchange',
        migrationPatterns: ['Modern immigration', 'Historical trade connections']
      },
      {
        id: 'native-american',
        name: 'Native American',
        percentage: 2.8,
        confidence: 0.71,
        subregions: ['North America', 'Central America'],
        historicalContext: 'Indigenous populations of the Americas',
        migrationPatterns: ['Pre-Columbian migration', 'Tribal movements']
      }
    ];

    return regions.sort((a, b) => b.percentage - a.percentage);
  }, []);

  // Generate mock DNA matches
  const generateDNAMatches = useMemo(() => {
    const matches: DNAMatch[] = [
      {
        id: 'match-1',
        matchId: 'DNA123456',
        name: 'Sarah Johnson',
        relationshipType: 'cousin',
        sharedCentimorgans: 850,
        sharedSegments: 28,
        longestSegment: 45,
        confidence: 0.92,
        estimatedRelationship: '1st cousin',
        commonAncestors: ['John Smith (1850-1925)', 'Mary Brown (1852-1930)'],
        maternalPaternal: 'paternal',
        contactInfo: {
          email: 'sarah.johnson@email.com',
          allowContact: true
        }
      },
      {
        id: 'match-2',
        matchId: 'DNA789012',
        name: 'Michael Chen',
        relationshipType: 'distant_cousin',
        sharedCentimorgans: 45,
        sharedSegments: 3,
        longestSegment: 18,
        confidence: 0.78,
        estimatedRelationship: '3rd-4th cousin',
        maternalPaternal: 'maternal',
        contactInfo: {
          allowContact: false
        }
      },
      {
        id: 'match-3',
        matchId: 'DNA345678',
        name: 'Emily Rodriguez',
        relationshipType: 'half_sibling',
        sharedCentimorgans: 1750,
        sharedSegments: 42,
        longestSegment: 68,
        confidence: 0.95,
        estimatedRelationship: 'Half-sibling',
        maternalPaternal: 'unknown',
        contactInfo: {
          email: 'emily.rodriguez@email.com',
          allowContact: true
        }
      }
    ];

    return matches.sort((a, b) => b.sharedCentimorgans - a.sharedCentimorgans);
  }, []);

  // Generate mock genetic traits
  const generateGeneticTraits = useMemo(() => {
    const traits: GeneticTrait[] = [
      {
        id: 'eye-color',
        name: 'Eye Color - Blue',
        category: 'physical',
        description: 'Likely to have blue or light-colored eyes',
        confidence: 0.87,
        evidence: ['HERC2 gene variant', 'OCA2 gene association'],
        populationFrequency: 0.08,
        implications: ['Higher light sensitivity', 'Increased risk of certain eye conditions']
      },
      {
        id: 'lactose-tolerance',
        name: 'Lactose Tolerance',
        category: 'ancestral',
        description: 'Likely tolerant to lactose in adulthood',
        confidence: 0.92,
        evidence: ['LCT gene variant', 'European ancestry correlation'],
        populationFrequency: 0.35,
        implications: ['Ability to digest dairy', 'Nutritional advantages in dairy-consuming cultures']
      },
      {
        id: 'fast-twitch',
        name: 'Fast-Twitch Muscle Fibers',
        category: 'physical',
        description: 'Higher proportion of fast-twitch muscle fibers',
        confidence: 0.74,
        evidence: ['ACTN3 gene variant', 'Athletic performance studies'],
        populationFrequency: 0.31,
        implications: ['Better sprinting ability', 'Potential for power sports excellence']
      },
      {
        id: 'circadian-rhythm',
        name: 'Morning Chronotype',
        category: 'behavioral',
        description: 'Likely to be a morning person (early chronotype)',
        confidence: 0.68,
        evidence: ['PER3 gene variant', 'Sleep pattern studies'],
        populationFrequency: 0.45,
        implications: ['Early morning alertness', 'Evening fatigue tendency']
      }
    ];

    return traits;
  }, []);

  // Generate mock health insights
  const generateHealthInsights = useMemo(() => {
    const insights: HealthInsight[] = [
      {
        id: 'vitamin-d',
        condition: 'Vitamin D Deficiency Risk',
        riskLevel: 'moderate',
        geneticMarkers: ['GC gene variant', 'DHCR7 gene'],
        confidence: 0.81,
        recommendations: [
          'Regular vitamin D supplementation',
          'Increased sun exposure with protection',
          'Dietary sources of vitamin D'
        ],
        sources: ['23andMe Health Report', 'NIH Vitamin D Research'],
        privacyLevel: 'private'
      },
      {
        id: 'celiac',
        condition: 'Celiac Disease Predisposition',
        riskLevel: 'elevated',
        geneticMarkers: ['HLA-DQ2', 'HLA-DQ8'],
        confidence: 0.89,
        recommendations: [
          'Consider gluten sensitivity testing',
          'Monitor for digestive symptoms',
          'Family screening if symptoms develop'
        ],
        sources: ['Celiac Disease Foundation', 'Medical genetics research'],
        privacyLevel: 'restricted'
      },
      {
        id: 'alzheimer',
        condition: 'Alzheimer\'s Disease Risk',
        riskLevel: 'low',
        geneticMarkers: ['APOE ε4 variant absent'],
        confidence: 0.73,
        recommendations: [
          'Maintain cardiovascular health',
          'Regular mental stimulation',
          'Healthy diet and exercise'
        ],
        sources: ['Alzheimer\'s Association', 'Genetics research'],
        privacyLevel: 'private'
      }
    ];

    return insights;
  }, []);

  useEffect(() => {
    setEthnicityResults(generateEthnicityResults);
    setDnaMatches(generateDNAMatches);
    setGeneticTraits(generateGeneticTraits);
    setHealthInsights(generateHealthInsights);
  }, [generateEthnicityResults, generateDNAMatches, generateGeneticTraits, generateHealthInsights]);

  // Filter functions
  const filteredMatches = useMemo(() => {
    let matches = dnaMatches;

    if (searchTerm) {
      matches = matches.filter(match =>
        match.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        match.estimatedRelationship.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (relationshipFilter === 'close') {
      matches = matches.filter(match => 
        ['parent', 'child', 'sibling', 'half_sibling'].includes(match.relationshipType)
      );
    } else if (relationshipFilter === 'distant') {
      matches = matches.filter(match => 
        ['cousin', 'distant_cousin'].includes(match.relationshipType)
      );
    }

    if (confidenceFilter !== 'all') {
      const threshold = confidenceFilter === 'high' ? 0.8 : confidenceFilter === 'medium' ? 0.6 : 0.4;
      matches = matches.filter(match => match.confidence >= threshold);
    }

    return matches;
  }, [dnaMatches, searchTerm, relationshipFilter, confidenceFilter]);

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'high': return 'text-red-600 bg-red-50';
      case 'elevated': return 'text-orange-600 bg-orange-50';
      case 'moderate': return 'text-yellow-600 bg-yellow-50';
      case 'low': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getRelationshipColor = (type: string) => {
    switch (type) {
      case 'parent':
      case 'child':
      case 'sibling':
      case 'half_sibling':
        return 'text-red-600 bg-red-50';
      case 'cousin':
        return 'text-blue-600 bg-blue-50';
      case 'distant_cousin':
        return 'text-gray-600 bg-gray-50';
      default:
        return 'text-purple-600 bg-purple-50';
    }
  };

  const getTraitCategoryIcon = (category: string) => {
    switch (category) {
      case 'physical': return <Users className="w-4 h-4" />;
      case 'health': return <Heart className="w-4 h-4" />;
      case 'ancestral': return <Globe className="w-4 h-4" />;
      case 'behavioral': return <Activity className="w-4 h-4" />;
      default: return <Dna className="w-4 h-4" />;
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-purple-100 rounded-lg">
            <Dna className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">DNA Analysis</h2>
            <p className="text-gray-600">Genetic insights and family connections</p>
          </div>
        </div>

        {/* DNA Analysis Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-purple-50 rounded-lg p-4">
            <Globe className="w-6 h-6 text-purple-600 mb-2" />
            <h3 className="font-semibold text-purple-900 mb-1">Ethnicity</h3>
            <p className="text-sm text-purple-700">6 regions identified</p>
          </div>
          <div className="bg-blue-50 rounded-lg p-4">
            <Users className="w-6 h-6 text-blue-600 mb-2" />
            <h3 className="font-semibold text-blue-900 mb-1">DNA Matches</h3>
            <p className="text-sm text-blue-700">{dnaMatches.length} relatives found</p>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <Activity className="w-6 h-6 text-green-600 mb-2" />
            <h3 className="font-semibold text-green-900 mb-1">Genetic Traits</h3>
            <p className="text-sm text-green-700">{geneticTraits.length} traits analyzed</p>
          </div>
          <div className="bg-orange-50 rounded-lg p-4">
            <Heart className="w-6 h-6 text-orange-600 mb-2" />
            <h3 className="font-semibold text-orange-900 mb-1">Health Insights</h3>
            <p className="text-sm text-orange-700">{healthInsights.length} risk factors</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 mb-6">
          <button
            onClick={() => setActiveTab('ethnicity')}
            className={`flex items-center gap-2 px-6 py-3 font-medium transition-colors ${
              activeTab === 'ethnicity'
                ? 'text-purple-600 border-b-2 border-purple-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Globe className="w-4 h-4" />
            Ethnicity
          </button>
          <button
            onClick={() => setActiveTab('matches')}
            className={`flex items-center gap-2 px-6 py-3 font-medium transition-colors ${
              activeTab === 'matches'
                ? 'text-purple-600 border-b-2 border-purple-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Users className="w-4 h-4" />
            DNA Matches
          </button>
          <button
            onClick={() => setActiveTab('traits')}
            className={`flex items-center gap-2 px-6 py-3 font-medium transition-colors ${
              activeTab === 'traits'
                ? 'text-purple-600 border-b-2 border-purple-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Activity className="w-4 h-4" />
            Genetic Traits
          </button>
          <button
            onClick={() => setActiveTab('health')}
            className={`flex items-center gap-2 px-6 py-3 font-medium transition-colors ${
              activeTab === 'health'
                ? 'text-purple-600 border-b-2 border-purple-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Heart className="w-4 h-4" />
            Health Insights
          </button>
        </div>

        {/* Filters for DNA Matches */}
        {activeTab === 'matches' && (
          <div className="flex gap-4 items-center">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search DNA matches..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>
            <select
              value={relationshipFilter}
              onChange={(e) => setRelationshipFilter(e.target.value as any)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="all">All Relationships</option>
              <option value="close">Close Relatives</option>
              <option value="distant">Distant Relatives</option>
            </select>
            <select
              value={confidenceFilter}
              onChange={(e) => setConfidenceFilter(e.target.value as any)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="all">All Confidence</option>
              <option value="high">High (80%+)</option>
              <option value="medium">Medium (60-79%)</option>
              <option value="low">Low (40-59%)</option>
            </select>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        {activeTab === 'ethnicity' && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Ethnicity Estimate</h3>
            
            {/* Ethnicity Chart */}
            <div className="mb-6">
              <div className="space-y-3">
                {ethnicityResults.map((region, index) => (
                  <div key={region.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">{region.name}</span>
                        <span className="text-sm text-gray-500">
                          {Math.round(region.confidence * 100)}% confidence
                        </span>
                      </div>
                      <span className="font-semibold text-gray-900">{region.percentage}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className="bg-purple-600 h-3 rounded-full transition-all duration-500"
                        style={{ width: `${region.percentage}%` }}
                      />
                    </div>
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">Subregions:</span> {region.subregions.join(', ')}
                    </div>
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">Historical Context:</span> {region.historicalContext}
                    </div>
                    {index < ethnicityResults.length - 1 && <div className="border-b border-gray-200 pt-3" />}
                  </div>
                ))}
              </div>
            </div>

            {/* Migration Patterns */}
            <div className="bg-blue-50 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 mb-2">Migration Patterns</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {ethnicityResults.slice(0, 4).map(region => (
                  <div key={region.id} className="text-sm">
                    <span className="font-medium text-blue-700">{region.name}:</span>
                    <ul className="text-blue-600 mt-1 space-y-1">
                      {region.migrationPatterns.map((pattern, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <MapPin className="w-3 h-3 mt-0.5" />
                          <span>{pattern}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'matches' && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">DNA Relatives</h3>
            
            {filteredMatches.map(match => (
              <div key={match.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-semibold text-gray-900">{match.name}</h4>
                    <p className="text-sm text-gray-600">Match ID: {match.matchId}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getRelationshipColor(match.relationshipType)}`}>
                      {match.estimatedRelationship}
                    </span>
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-600">
                      {Math.round(match.confidence * 100)}% confidence
                    </span>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                  <div>
                    <span className="text-sm text-gray-500">Shared cM</span>
                    <p className="font-semibold text-gray-900">{match.sharedCentimorgans}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Segments</span>
                    <p className="font-semibold text-gray-900">{match.sharedSegments}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Longest</span>
                    <p className="font-semibold text-gray-900">{match.longestSegment} cM</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Side</span>
                    <p className="font-semibold text-gray-900 capitalize">{match.maternalPaternal}</p>
                  </div>
                </div>
                
                {match.commonAncestors && match.commonAncestors.length > 0 && (
                  <div className="bg-green-50 rounded p-3 mb-3">
                    <p className="text-sm font-medium text-green-700 mb-1">Common Ancestors:</p>
                    <ul className="text-sm text-green-600 space-y-1">
                      {match.commonAncestors.map((ancestor, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <Users className="w-3 h-3 mt-0.5" />
                          <span>{ancestor}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {match.contactInfo && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm">
                      {match.contactInfo.allowContact ? (
                        <>
                          <Shield className="w-4 h-4 text-green-600" />
                          <span className="text-green-600">Contact allowed</span>
                          {match.contactInfo.email && (
                            <span className="text-gray-600">({match.contactInfo.email})</span>
                          )}
                        </>
                      ) : (
                        <>
                          <Shield className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-600">Contact not allowed</span>
                        </>
                      )}
                    </div>
                    <button className="px-3 py-1 text-sm bg-purple-600 text-white rounded hover:bg-purple-700">
                      Send Message
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {activeTab === 'traits' && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Genetic Traits</h3>
            
            {geneticTraits.map(trait => (
              <div key={trait.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start gap-4">
                  <div className={`p-2 rounded-lg ${
                    trait.category === 'physical' ? 'bg-blue-50' :
                    trait.category === 'health' ? 'bg-red-50' :
                    trait.category === 'ancestral' ? 'bg-green-50' :
                    'bg-purple-50'
                  }`}>
                    {getTraitCategoryIcon(trait.category)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-gray-900">{trait.name}</h4>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-600">
                          {Math.round(trait.confidence * 100)}% confidence
                        </span>
                        <span className="text-sm text-gray-500">
                          {Math.round(trait.populationFrequency * 100)}% population
                        </span>
                      </div>
                    </div>
                    
                    <p className="text-gray-600 mb-3">{trait.description}</p>
                    
                    <div className="space-y-2 mb-3">
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-1">Genetic Evidence:</p>
                        <ul className="text-sm text-gray-600 space-y-1">
                          {trait.evidence.map((evidence, index) => (
                            <li key={index} className="flex items-start gap-2">
                              <Dna className="w-3 h-3 text-purple-600 mt-1" />
                              <span>{evidence}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                    
                    {trait.implications.length > 0 && (
                      <div className="bg-blue-50 rounded p-3">
                        <p className="text-sm font-medium text-blue-700 mb-1">Implications:</p>
                        <ul className="text-sm text-blue-600 space-y-1">
                          {trait.implications.map((implication, index) => (
                            <li key={index} className="flex items-start gap-2">
                              <TrendingUp className="w-3 h-3 text-blue-600 mt-1" />
                              <span>{implication}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'health' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Health Insights</h3>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Shield className="w-4 h-4" />
                <span>Privacy-protected health information</span>
              </div>
            </div>
            
            {healthInsights.map(insight => (
              <div key={insight.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start gap-4">
                  <div className={`p-2 rounded-lg ${getRiskLevelColor(insight.riskLevel)}`}>
                    <Heart className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-gray-900">{insight.condition}</h4>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getRiskLevelColor(insight.riskLevel)}`}>
                          {insight.riskLevel.toUpperCase()} RISK
                        </span>
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-600">
                          {Math.round(insight.confidence * 100)}% confidence
                        </span>
                      </div>
                    </div>
                    
                    <div className="space-y-2 mb-3">
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-1">Genetic Markers:</p>
                        <div className="flex flex-wrap gap-1">
                          {insight.geneticMarkers.map((marker, index) => (
                            <span key={index} className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded font-mono">
                              {marker}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-orange-50 rounded p-3 mb-3">
                      <p className="text-sm font-medium text-orange-700 mb-2">Recommendations:</p>
                      <ul className="text-sm text-orange-600 space-y-1">
                        {insight.recommendations.map((recommendation, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <AlertTriangle className="w-3 h-3 text-orange-600 mt-1" />
                            <span>{recommendation}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Shield className="w-4 h-4" />
                        <span>Privacy: {insight.privacyLevel}</span>
                      </div>
                      <div className="text-sm text-gray-500">
                        Sources: {insight.sources.length}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
                <div className="text-sm text-yellow-800">
                  <p className="font-semibold mb-1">Important Health Disclaimer</p>
                  <p>These genetic insights are for informational purposes only and should not replace professional medical advice. Consult with healthcare professionals for any health concerns.</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* DNA Upload/Download Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">DNA Data Management</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <h4 className="font-medium text-gray-900 mb-2">Upload DNA Data</h4>
            <p className="text-sm text-gray-600 mb-4">Import DNA results from 23andMe, AncestryDNA, or MyHeritage</p>
            <button className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
              Upload DNA File
            </button>
          </div>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <Download className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <h4 className="font-medium text-gray-900 mb-2">Download DNA Report</h4>
            <p className="text-sm text-gray-600 mb-4">Export your DNA analysis results as PDF</p>
            <button className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
              Download Report
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
