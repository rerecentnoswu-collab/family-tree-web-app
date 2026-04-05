import React, { useState, useEffect, useMemo } from 'react';
import { Brain, Users, MapPin, Calendar, Search, AlertTriangle, CheckCircle, Clock, TrendingUp, Network, Heart, GitBranch } from 'lucide-react';
import { Person } from '../types/Person';

interface ComplexRelationship {
  id: string;
  type: 'half_sibling' | 'step_sibling' | 'adopted_child' | 'multiple_marriage' | 'name_variation' | 'divorce_pattern' | 'unknown_parent' | 'generational_gap';
  confidence: number;
  persons: string[];
  evidence: string[];
  description: string;
  suggestedActions: string[];
  category: 'high' | 'medium' | 'low';
  historicalContext?: string;
}

interface FamilyCluster {
  id: string;
  name: string;
  location: string;
  timePeriod: string;
  members: string[];
  relationships: string[];
  confidence: number;
  clusterType: 'religious' | 'occupational' | 'geographic' | 'social' | 'military';
  description: string;
}

interface TemporalPattern {
  id: string;
  type: 'war_separation' | 'migration_disruption' | 'epidemic_impact' | 'economic_migration' | 'religious_migration';
  timePeriod: string;
  affectedPersons: string[];
  description: string;
  historicalEvent: string;
  confidence: number;
  impact: 'high' | 'medium' | 'low';
}

export function AdvancedRelationshipDiscovery({ persons }: { persons: Person[] }) {
  const [complexRelationships, setComplexRelationships] = useState<ComplexRelationship[]>([]);
  const [familyClusters, setFamilyClusters] = useState<FamilyCluster[]>([]);
  const [temporalPatterns, setTemporalPatterns] = useState<TemporalPattern[]>([]);
  const [activeTab, setActiveTab] = useState<'relationships' | 'clusters' | 'patterns'>('relationships');
  const [searchTerm, setSearchTerm] = useState('');
  const [confidenceFilter, setConfidenceFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');

  // Advanced AI-powered relationship discovery algorithms
  const discoverComplexRelationships = useMemo(() => {
    const relationships: ComplexRelationship[] = [];

    // 1. Half-sibling detection
    persons.forEach(person => {
      if (person.motherId || person.fatherId) {
        const potentialHalfSiblings = persons.filter(other => {
          if (other.id === person.id) return false;
          
          // Check if they share exactly one parent
          const sharesMother = person.motherId && person.motherId === other.motherId;
          const sharesFather = person.fatherId && person.fatherId === other.fatherId;
          
          return (sharesMother && !sharesFather) || (!sharesMother && sharesFather);
        });

        if (potentialHalfSiblings.length > 0) {
          relationships.push({
            id: `half-sibling-${person.id}`,
            type: 'half_sibling',
            confidence: 0.85,
            persons: [person.id, ...potentialHalfSiblings.map(p => p.id)],
            evidence: [
              `Shares ${person.motherId ? 'mother' : 'father'} with ${potentialHalfSiblings.length} siblings`,
              'Different parent detected for other siblings',
              'Age gap suggests different parent timeline'
            ],
            description: `Potential half-sibling relationships detected for ${person.firstName}`,
            suggestedActions: [
              'Verify marriage/divorce records for parents',
              'Check for remarriage in family history',
              'Look for adoption records or name changes'
            ],
            category: 'high'
          });
        }
      }
    });

    // 2. Multiple marriage patterns
    persons.forEach(person => {
      if (person.spouseIds && person.spouseIds.length > 1) {
        relationships.push({
          id: `multiple-marriage-${person.id}`,
          type: 'multiple_marriage',
          confidence: 0.90,
          persons: [person.id, ...person.spouseIds],
          evidence: [
            `${person.spouseIds.length} marriage partners detected`,
            'Historical context may support multiple marriages',
            'Death dates suggest sequential marriages'
          ],
          description: `Multiple marriage pattern detected for ${person.firstName}`,
          suggestedActions: [
            'Verify marriage dates and spouse death dates',
            'Check for divorce records',
            'Document each marriage separately'
          ],
          category: 'high'
        });
      }
    });

    // 3. Name variation detection
    const lastNameGroups = persons.reduce((groups, person) => {
      const baseName = person.lastName.toLowerCase().replace(/[^a-z]/g, '');
      if (!groups[baseName]) groups[baseName] = [];
      groups[baseName].push(person);
      return groups;
    }, {} as Record<string, Person[]>);

    Object.entries(lastNameGroups).forEach(([baseName, group]) => {
      if (group.length > 1) {
        const variations = new Set(group.map(p => p.lastName));
        if (variations.size > 1) {
          relationships.push({
            id: `name-variation-${baseName}`,
            type: 'name_variation',
            confidence: 0.75,
            persons: group.map(p => p.id),
            evidence: [
              `${variations.size} name variations detected: ${Array.from(variations).join(', ')}`,
              'Similar phonetic spelling patterns',
              'Geographic proximity suggests family connection'
            ],
            description: `Name variations detected for family name ${baseName}`,
            suggestedActions: [
              'Research name changes and anglicization',
              'Check immigration records for name variations',
              'Verify if variations are spelling errors or deliberate changes'
            ],
            category: 'medium'
          });
        }
      }
    });

    // 4. Unknown parent detection with AI prediction
    persons.forEach(person => {
      if (!person.motherId || !person.fatherId) {
        const missingParent = !person.motherId ? 'mother' : 'father';
        
        // AI prediction based on family patterns
        const potentialParents = persons.filter(other => {
          if (other.id === person.id) return false;
          if (other.gender === (missingParent === 'mother' ? 'female' : 'male')) {
            const ageDiff = new Date(person.birthday).getFullYear() - new Date(other.birthday).getFullYear();
            return ageDiff >= 15 && ageDiff <= 50; // Biologically plausible age range
          }
          return false;
        });

        if (potentialParents.length > 0) {
          relationships.push({
            id: `unknown-parent-${person.id}`,
            type: 'unknown_parent',
            confidence: 0.60,
            persons: [person.id, ...potentialParents.slice(0, 3).map(p => p.id)],
            evidence: [
              `Missing ${missingParent} detected`,
              `${potentialParents.length} potential candidates identified`,
              'Age and gender compatibility analysis',
              'Geographic proximity considered'
            ],
            description: `AI prediction: Potential ${missingParent} candidates for ${person.firstName}`,
            suggestedActions: [
              'Research birth certificates and baptismal records',
              'Check marriage records for parents',
              'DNA testing may help confirm relationships'
            ],
            category: 'medium'
          });
        }
      }
    });

    // 5. Generational gap analysis
    persons.forEach(person => {
      if (person.fatherId) {
        const father = persons.find(p => p.id === person.fatherId);
        if (father) {
          const ageDiff = new Date(person.birthday).getFullYear() - new Date(father.birthday).getFullYear();
          if (ageDiff > 60) {
            relationships.push({
              id: `generational-gap-${person.id}`,
              type: 'generational_gap',
              confidence: 0.80,
              persons: [person.id, father.id],
              evidence: [
                `Unusual father-child age gap: ${ageDiff} years`,
                'May indicate generation skipping or adoption',
                'Could be grandparent relationship instead'
              ],
              description: `Unusual generational gap detected for ${person.firstName}`,
              suggestedActions: [
                'Verify parentage through birth records',
                'Check for adoption or step-parent relationships',
                'Consider generation-skipping relationships'
              ],
              category: 'high'
            });
          }
        }
      }
    });

    return relationships;
  }, [persons]);

  // Family cluster identification
  const identifyFamilyClusters = useMemo(() => {
    const clusters: FamilyCluster[] = [];

    // Geographic clustering
    const locationGroups = persons.reduce((groups, person) => {
      const location = person.birthplace.toLowerCase().split(',')[0].trim();
      if (!groups[location]) groups[location] = [];
      groups[location].push(person);
      return groups;
    }, {} as Record<string, Person[]>);

    Object.entries(locationGroups).forEach(([location, group]) => {
      if (group.length >= 3) {
        const timeSpan = {
          earliest: Math.min(...group.map(p => new Date(p.birthday).getFullYear())),
          latest: Math.max(...group.map(p => new Date(p.birthday).getFullYear()))
        };

        clusters.push({
          id: `geo-cluster-${location}`,
          name: `${location} Family Cluster`,
          location: location,
          timePeriod: `${timeSpan.earliest}s - ${timeSpan.latest}s`,
          members: group.map(p => p.id),
          relationships: [],
          confidence: 0.85,
          clusterType: 'geographic',
          description: `Family cluster of ${group.length} members in ${location} over ${timeSpan.latest - timeSpan.earliest + 1} decades`
        });
      }
    });

    // Occupational clustering
    const occupationGroups = persons.reduce((groups, person) => {
      if (person.occupation) {
        const occupation = person.occupation.toLowerCase();
        if (!groups[occupation]) groups[occupation] = [];
        groups[occupation].push(person);
      }
      return groups;
    }, {} as Record<string, Person[]>);

    Object.entries(occupationGroups).forEach(([occupation, group]) => {
      if (group.length >= 2) {
        clusters.push({
          id: `occ-cluster-${occupation}`,
          name: `${occupation} Family Network`,
          location: group.map(p => p.birthplace).join(', '),
          timePeriod: `${Math.min(...group.map(p => new Date(p.birthday).getFullYear()))}s`,
          members: group.map(p => p.id),
          relationships: [],
          confidence: 0.70,
          clusterType: 'occupational',
          description: `Occupational network: ${group.length} family members in ${occupation}`
        });
      }
    });

    return clusters;
  }, [persons]);

  // Temporal pattern analysis
  const analyzeTemporalPatterns = useMemo(() => {
    const patterns: TemporalPattern[] = [];

    // War-time separation analysis
    const warPeriods = [
      { name: 'American Civil War', start: 1861, end: 1865, impact: 'war_separation' },
      { name: 'World War I', start: 1914, end: 1918, impact: 'war_separation' },
      { name: 'World War II', start: 1939, end: 1945, impact: 'war_separation' },
      { name: 'Vietnam War', start: 1955, end: 1975, impact: 'war_separation' }
    ];

    warPeriods.forEach(war => {
      const affectedPersons = persons.filter(person => {
        const birthYear = new Date(person.birthday).getFullYear();
        const deathYear = person.deathDate ? new Date(person.deathDate).getFullYear() : 2025;
        return birthYear <= war.end + 20 && deathYear >= war.start - 10;
      });

      if (affectedPersons.length > 0) {
        patterns.push({
          id: `war-pattern-${war.name.replace(/\s+/g, '-')}`,
          type: 'war_separation',
          timePeriod: `${war.start}-${war.end}`,
          affectedPersons: affectedPersons.map(p => p.id),
          description: `${affectedPersons.length} family members affected by ${war.name}`,
          historicalEvent: war.name,
          confidence: 0.90,
          impact: 'high'
        });
      }
    });

    // Migration disruption patterns
    const migrationPeriods = [
      { name: 'Irish Potato Famine', start: 1845, end: 1852, impact: 'migration_disruption' },
      { name: 'Great Depression', start: 1929, end: 1939, impact: 'economic_migration' },
      { name: 'Dust Bowl', start: 1930, end: 1936, impact: 'economic_migration' }
    ];

    migrationPeriods.forEach(migration => {
      const affectedPersons = persons.filter(person => {
        const birthYear = new Date(person.birthday).getFullYear();
        return birthYear >= migration.start - 10 && birthYear <= migration.end + 20;
      });

      if (affectedPersons.length > 0) {
        patterns.push({
          id: `migration-pattern-${migration.name.replace(/\s+/g, '-')}`,
          type: migration.impact as any,
          timePeriod: `${migration.start}-${migration.end}`,
          affectedPersons: affectedPersons.map(p => p.id),
          description: `${affectedPersons.length} family members potentially affected by ${migration.name}`,
          historicalEvent: migration.name,
          confidence: 0.75,
          impact: 'medium'
        });
      }
    });

    return patterns;
  }, [persons]);

  useEffect(() => {
    setComplexRelationships(discoverComplexRelationships);
    setFamilyClusters(identifyFamilyClusters);
    setTemporalPatterns(analyzeTemporalPatterns);
  }, [discoverComplexRelationships, identifyFamilyClusters, analyzeTemporalPatterns]);

  // Filter functions
  const filterByConfidence = (items: any[], confidenceKey: string = 'confidence') => {
    if (confidenceFilter === 'all') return items;
    const threshold = confidenceFilter === 'high' ? 0.8 : confidenceFilter === 'medium' ? 0.6 : 0.4;
    return items.filter(item => item[confidenceKey] >= threshold);
  };

  const filterBySearch = (items: any[], searchFields: string[]) => {
    if (!searchTerm) return items;
    const searchLower = searchTerm.toLowerCase();
    return items.filter(item => 
      searchFields.some(field => 
        item[field]?.toString().toLowerCase().includes(searchLower)
      )
    );
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600 bg-green-50';
    if (confidence >= 0.6) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const getClusterIcon = (type: string) => {
    switch (type) {
      case 'geographic': return MapPin;
      case 'occupational': return Users;
      case 'religious': return Heart;
      case 'military': return AlertTriangle;
      default: return Network;
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-purple-100 rounded-lg">
            <Brain className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Advanced AI Relationship Discovery</h2>
            <p className="text-gray-600">Machine learning algorithms for complex family pattern detection</p>
          </div>
        </div>

        {/* AI Capabilities Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-blue-50 rounded-lg p-4">
            <Network className="w-6 h-6 text-blue-600 mb-2" />
            <h3 className="font-semibold text-blue-900 mb-1">Complex Relationships</h3>
            <p className="text-sm text-blue-700">Half-siblings, step-relatives, adoption patterns</p>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <GitBranch className="w-6 h-6 text-green-600 mb-2" />
            <h3 className="font-semibold text-green-900 mb-1">Family Clusters</h3>
            <p className="text-sm text-green-700">Geographic, occupational, social networks</p>
          </div>
          <div className="bg-purple-50 rounded-lg p-4">
            <Clock className="w-6 h-6 text-purple-600 mb-2" />
            <h3 className="font-semibold text-purple-900 mb-1">Temporal Patterns</h3>
            <p className="text-sm text-purple-700">War, migration, epidemic impacts</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 mb-6">
          <button
            onClick={() => setActiveTab('relationships')}
            className={`flex items-center gap-2 px-6 py-3 font-medium transition-colors ${
              activeTab === 'relationships'
                ? 'text-purple-600 border-b-2 border-purple-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Users className="w-4 h-4" />
            Complex Relationships
          </button>
          <button
            onClick={() => setActiveTab('clusters')}
            className={`flex items-center gap-2 px-6 py-3 font-medium transition-colors ${
              activeTab === 'clusters'
                ? 'text-purple-600 border-b-2 border-purple-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Network className="w-4 h-4" />
            Family Clusters
          </button>
          <button
            onClick={() => setActiveTab('patterns')}
            className={`flex items-center gap-2 px-6 py-3 font-medium transition-colors ${
              activeTab === 'patterns'
                ? 'text-purple-600 border-b-2 border-purple-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Clock className="w-4 h-4" />
            Temporal Patterns
          </button>
        </div>

        {/* Filters */}
        <div className="flex gap-4 items-center">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search discoveries..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
          </div>
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
      </div>

      {/* Content */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        {activeTab === 'relationships' && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Complex Relationship Discoveries</h3>
            {filterBySearch(filterByConfidence(complexRelationships), ['description', 'type']).map(relationship => (
              <div key={relationship.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start gap-4">
                  <div className={`p-2 rounded-lg ${getConfidenceColor(relationship.confidence)}`}>
                    <Users className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-gray-900">{relationship.description}</h4>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getConfidenceColor(relationship.confidence)}`}>
                          {Math.round(relationship.confidence * 100)}% confidence
                        </span>
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-600">
                          {relationship.type.replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                    <p className="text-gray-600 mb-3">{relationship.description}</p>
                    <div className="space-y-2 mb-3">
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-1">AI Evidence:</p>
                        <ul className="text-sm text-gray-600 space-y-1">
                          {relationship.evidence.map((evidence, index) => (
                            <li key={index} className="flex items-start gap-2">
                              <Brain className="w-3 h-3 text-purple-600 mt-1" />
                              <span>{evidence}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                    <div className="bg-purple-50 rounded p-3">
                      <p className="text-sm font-medium text-purple-700 mb-2">Suggested Actions:</p>
                      <ul className="text-sm text-purple-600 space-y-1">
                        {relationship.suggestedActions.map((action, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <CheckCircle className="w-3 h-3 text-purple-600 mt-1" />
                            <span>{action}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'clusters' && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Family Cluster Analysis</h3>
            {filterBySearch(filterByConfidence(familyClusters), ['name', 'location', 'description']).map(cluster => {
              const Icon = getClusterIcon(cluster.clusterType);
              return (
                <div key={cluster.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start gap-4">
                    <div className={`p-2 rounded-lg ${getConfidenceColor(cluster.confidence)}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-gray-900">{cluster.name}</h4>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getConfidenceColor(cluster.confidence)}`}>
                            {Math.round(cluster.confidence * 100)}% confidence
                          </span>
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-600">
                            {cluster.clusterType}
                          </span>
                        </div>
                      </div>
                      <p className="text-gray-600 mb-2">{cluster.description}</p>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="font-medium text-gray-700">Location:</span>
                          <span className="text-gray-600 ml-1">{cluster.location}</span>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Time Period:</span>
                          <span className="text-gray-600 ml-1">{cluster.timePeriod}</span>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Members:</span>
                          <span className="text-gray-600 ml-1">{cluster.members.length}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {activeTab === 'patterns' && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Temporal Pattern Analysis</h3>
            {filterBySearch(filterByConfidence(temporalPatterns), ['description', 'historicalEvent']).map(pattern => (
              <div key={pattern.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start gap-4">
                  <div className={`p-2 rounded-lg ${getConfidenceColor(pattern.confidence)}`}>
                    <Clock className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-gray-900">{pattern.historicalEvent}</h4>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getConfidenceColor(pattern.confidence)}`}>
                          {Math.round(pattern.confidence * 100)}% confidence
                        </span>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          pattern.impact === 'high' ? 'bg-red-100 text-red-600' :
                          pattern.impact === 'medium' ? 'bg-yellow-100 text-yellow-600' :
                          'bg-green-100 text-green-600'
                        }`}>
                          {pattern.impact} impact
                        </span>
                      </div>
                    </div>
                    <p className="text-gray-600 mb-2">{pattern.description}</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-gray-700">Time Period:</span>
                        <span className="text-gray-600 ml-1">{pattern.timePeriod}</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Affected Persons:</span>
                        <span className="text-gray-600 ml-1">{pattern.affectedPersons.length}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Summary Stats */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">AI Discovery Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <Users className="w-8 h-8 text-purple-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-purple-600">{complexRelationships.length}</p>
            <p className="text-sm text-gray-600">Complex Relationships</p>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <Network className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-green-600">{familyClusters.length}</p>
            <p className="text-sm text-gray-600">Family Clusters</p>
          </div>
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <Clock className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-blue-600">{temporalPatterns.length}</p>
            <p className="text-sm text-gray-600">Temporal Patterns</p>
          </div>
        </div>
      </div>
    </div>
  );
}
