import React, { useState, useEffect, useMemo } from 'react';
import { Brain, Users, MapPin, Activity, AlertTriangle, TrendingUp, Clock, Globe, Heart, Calendar, Search, Filter } from 'lucide-react';

interface Person {
  id: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  birthday: string;
  birthplace: string;
  motherId?: string;
  fatherId?: string;
  gender?: 'male' | 'female' | 'other';
  occupation?: string;
  deathDate?: string;
  deathPlace?: string;
}

interface PredictiveInsight {
  id: string;
  type: 'missing_relative' | 'migration_pattern' | 'health_insight' | 'historical_connection';
  title: string;
  description: string;
  confidence: number;
  evidence: string[];
  relatedPersons: string[];
  category: 'high' | 'medium' | 'low';
  actionable: boolean;
  suggestedActions?: string[];
}

interface MigrationPattern {
  id: string;
  familyId: string;
  startLocation: string;
  endLocation: string;
  timePeriod: string;
  reason: string;
  confidence: number;
  historicalContext: string;
}

interface HealthPattern {
  id: string;
  condition: string;
  prevalence: number;
  ageOfOnset: number;
  riskLevel: 'low' | 'medium' | 'high';
  geneticMarkers: string[];
  recommendations: string[];
  affectedFamilyMembers: string[];
}

interface RelationshipValidation {
  id: string;
  type: 'consanguinity' | 'age_gap' | 'timeline' | 'generational' | 'duplicate';
  severity: 'error' | 'warning' | 'info';
  title: string;
  description: string;
  persons: string[];
  recommendation: string;
  genealogicalStandard: string;
}

interface BestPracticeSuggestion {
  id: string;
  category: 'documentation' | 'source_citation' | 'relationship_proof' | 'data_quality' | 'privacy';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  impact: string;
  implementation: string[];
  examples: string[];
}

interface PredictiveAnalyticsProps {
  persons: Person[];
  onInsightSelected: (insight: PredictiveInsight) => void;
}

export function PredictiveAnalytics({ persons, onInsightSelected }: PredictiveAnalyticsProps) {
  const [activeTab, setActiveTab] = useState<'relatives' | 'migration' | 'health' | 'historical' | 'validation' | 'practices'>('relatives');
  const [insights, setInsights] = useState<PredictiveInsight[]>([]);
  const [migrationPatterns, setMigrationPatterns] = useState<MigrationPattern[]>([]);
  const [healthPatterns, setHealthPatterns] = useState<HealthPattern[]>([]);
  const [validations, setValidations] = useState<RelationshipValidation[]>([]);
  const [bestPractices, setBestPractices] = useState<BestPracticeSuggestion[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [confidenceFilter, setConfidenceFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');

  // ML-powered prediction of missing relatives
  const predictMissingRelatives = useMemo(() => {
    const missingRelatives: PredictiveInsight[] = [];
    
    persons.forEach(person => {
      // Algorithm 1: Bayesian probability for missing parents
      if (!person.motherId || !person.fatherId) {
        const parentProbability = calculateMissingParentProbability(person, persons);
        
        if (parentProbability > 0.7) {
        if (!hasChildren) {
          missingRelatives.push({
            id: `potential-spouse-${person.id}`,
            type: 'missing_relative',
            title: `Potential Missing Spouse for ${person.firstName}`,
            description: `At age ${personAge}, likely married or in a relationship`,
            confidence: 0.60,
            evidence: [
              `Current age: ${personAge}`,
              `No children recorded`,
              `Historical marriage patterns`
            ],
            relatedPersons: [person.id],
            category: 'medium',
            actionable: true,
            suggestedActions: [
              'Search marriage records',
              'Check census records for cohabitation',
              'Look for family photographs'
            ]
          });
        }
      }
    });
    
    return missingRelatives;
  }, [persons]);

  // Predict migration patterns
  const predictMigrationPatterns = useMemo(() => {
    const patterns: MigrationPattern[] = [];
    const locationMap = new Map<string, Person[]>();
    
    // Group people by birth location
    persons.forEach(person => {
      const location = person.birthplace;
      if (!locationMap.has(location)) {
        locationMap.set(location, []);
      }
      locationMap.get(location)!.push(person);
    });
    
    // Analyze migration patterns
    locationMap.forEach((peopleInLocation, location) => {
      const birthYears = peopleInLocation.map(p => new Date(p.birthday).getFullYear());
      const earliestYear = Math.min(...birthYears);
      const latestYear = Math.max(...birthYears);
      
      // Check if family moved over time
      if (latestYear - earliestYear > 20) {
        const laterBirths = peopleInLocation.filter(p => 
          new Date(p.birthday).getFullYear() > earliestYear + 20
        );
        
        if (laterBirths.length > 0) {
          patterns.push({
            id: `migration-${location}-${earliestYear}`,
            familyId: location,
            startLocation: location,
            endLocation: 'Unknown - investigate further',
            timePeriod: `${earliestYear}-${latestYear}`,
            reason: 'Economic opportunity or family expansion',
            confidence: 0.70,
            historicalContext: getHistoricalMigrationContext(earliestYear, latestYear, location)
          });
        }
      }
    });
    
    return patterns;
  }, [persons]);

  // Predict health patterns
  const predictHealthPatterns = useMemo(() => {
    const patterns: HealthPattern[] = [];
    
    // Mock health pattern analysis based on family data
    const ageDistribution = persons.map(p => ({
      name: `${p.firstName} ${p.lastName}`,
      age: new Date().getFullYear() - new Date(p.birthday).getFullYear(),
      lifespan: p.deathDate ? 
        new Date(p.deathDate).getFullYear() - new Date(p.birthday).getFullYear() : 
        null
    }));
    
    // Analyze lifespan patterns
    const completedLifespans = ageDistribution
      .filter(p => p.lifespan !== null)
      .map(p => p.lifespan!);
    
    if (completedLifespans.length > 0) {
      const averageLifespan = completedLifespans.reduce((a, b) => a + b, 0) / completedLifespans.length;
      
      patterns.push({
        id: 'lifespan-pattern',
        condition: 'Family Longevity Pattern',
        prevalence: averageLifespan > 75 ? 0.8 : 0.6,
        ageOfOnset: 0,
        riskLevel: averageLifespan > 75 ? 'low' : 'medium',
        geneticMarkers: ['Longevity genes', 'Telomere length'],
        recommendations: [
          'Regular health checkups',
          'Focus on cardiovascular health',
          'Maintain healthy lifestyle',
          'Consider genetic testing for age-related conditions'
        ],
        affectedFamilyMembers: ageDistribution.map(p => p.name)
      });
    }
    
    // Analyze birth location health patterns
    const locationHealthData = new Map<string, { count: number; avgLifespan: number }>();
    
    persons.forEach(person => {
      const location = person.birthplace;
      const lifespan = person.deathDate ? 
        new Date(person.deathDate).getFullYear() - new Date(person.birthday).getFullYear() : 
        null;
      
      if (!locationHealthData.has(location)) {
        locationHealthData.set(location, { count: 0, avgLifespan: 0 });
      }
      
      const data = locationHealthData.get(location)!;
      data.count++;
      if (lifespan !== null) {
        data.avgLifespan = (data.avgLifespan * (data.count - 1) + lifespan) / data.count;
      }
    });
    
    locationHealthData.forEach((data, location) => {
      if (data.avgLifespan > 0 && data.avgLifespan < 65) {
        patterns.push({
          id: `health-location-${location}`,
          condition: `Regional Health Pattern - ${location}`,
          prevalence: 0.4,
          ageOfOnset: 0,
          riskLevel: 'medium',
          geneticMarkers: ['Environmental factors', 'Regional disease patterns'],
          recommendations: [
            'Research historical diseases in the region',
            'Consider environmental health factors',
            'Screen for regional health conditions',
            'Monitor for inherited environmental risks'
          ],
          affectedFamilyMembers: persons
            .filter(p => p.birthplace === location)
            .map(p => `${p.firstName} ${p.lastName}`)
        });
      }
    });
    
    return patterns;
  }, [persons]);

  // Global relationship validation
  const validateRelationships = useMemo(() => {
    const validations: RelationshipValidation[] = [];
    
    // Check for consanguinity
    persons.forEach(person => {
      if (person.motherId && person.fatherId) {
        const mother = persons.find(p => p.id === person.motherId);
        const father = persons.find(p => p.id === person.fatherId);
        
        if (mother && father && mother.fatherId === father.fatherId) {
          validations.push({
            id: `consanguinity-${person.id}`,
            type: 'consanguinity',
            severity: 'error',
            title: 'Potential Consanguinity Detected',
            description: 'Parents may share a common ancestor',
            persons: [person.id, mother.id, father.id],
            recommendation: 'Verify family lineage and check for cousin relationships',
            genealogicalStandard: 'GEDCOM 5.5.1: Consanguinity should be documented'
          });
        }
      }
    });
    
    // Check for age gaps
    persons.forEach(person => {
      if (person.motherId) {
        const mother = persons.find(p => p.id === person.motherId);
        if (mother) {
          const ageDiff = new Date(person.birthday).getFullYear() - new Date(mother.birthday).getFullYear();
          if (ageDiff < 13 || ageDiff > 50) {
            validations.push({
              id: `age-gap-mother-${person.id}`,
              type: 'age_gap',
              severity: ageDiff < 13 ? 'error' : 'warning',
              title: 'Unusual Mother-Child Age Gap',
              description: `Age difference: ${ageDiff} years`,
              persons: [person.id, mother.id],
              recommendation: 'Verify birth dates and relationship accuracy',
              genealogicalStandard: 'Genealogical Proof Standard: Verify unusual age patterns'
            });
          }
        }
      }
    });
    
    // Check timeline consistency
    persons.forEach(person => {
      if (person.deathDate && person.birthday) {
        const birth = new Date(person.birthday);
        const death = new Date(person.deathDate);
        if (death < birth) {
          validations.push({
            id: `timeline-${person.id}`,
            type: 'timeline',
            severity: 'error',
            title: 'Timeline Inconsistency',
            description: 'Death date precedes birth date',
            persons: [person.id],
            recommendation: 'Correct birth and death dates',
            genealogicalStandard: 'Chronological consistency required'
          });
        }
      }
    });
    
    return validations;
  }, [persons]);

  // Best practices suggestions
  const generateBestPractices = useMemo(() => {
    const practices: BestPracticeSuggestion[] = [];
    
    // Check documentation quality
    const undocumentedPersons = persons.filter(p => !p.occupation && !p.deathDate);
    if (undocumentedPersons.length > 0) {
      practices.push({
        id: 'documentation-quality',
        category: 'documentation',
        priority: 'high',
        title: 'Improve Person Documentation',
        description: `${undocumentedPersons.length} persons lack complete information`,
        impact: 'Enhances research value and accuracy',
        implementation: [
          'Add occupation information',
          'Document death dates and places',
          'Include middle names when known',
          'Add marriage information'
        ],
        examples: ['John Smith the Baker', 'Mary Elizabeth Johnson']
      });
    }
    
    // Source citation recommendations
    practices.push({
      id: 'source-citation',
      category: 'source_citation',
      priority: 'high',
      title: 'Implement Source Citations',
      description: 'Add proper source documentation for all relationships',
      impact: 'Ensures verifiability and research credibility',
      implementation: [
        'Cite birth certificates',
        'Document marriage records',
        'Reference census data',
        'Include DNA evidence'
      ],
      examples: ['Birth Certificate #1234, County Clerk', '1920 Census, Page 45']
    });
    
    // Privacy recommendations
    practices.push({
      id: 'privacy-protection',
      category: 'privacy',
      priority: 'medium',
      title: 'Protect Living Person Privacy',
      description: 'Implement privacy controls for living relatives',
      impact: 'Protects personal information and complies with regulations',
      implementation: [
        'Mark living persons as private',
        'Limit access to sensitive information',
        'Obtain consent for data sharing',
        'Follow GDPR/CCPA guidelines'
      ],
      examples: ['Private: Living Person', 'Restricted: Medical Information']
    });
    
    return practices;
  }, [persons]);

  // Get historical context for migration
  const getHistoricalMigrationContext = (startYear: number, endYear: number, location: string): string => {
    const contexts = [
      { range: [1840, 1920], context: 'Industrial Revolution - Urban migration for factory work' },
      { range: [1920, 1945], context: 'Great Depression - Economic hardship migration' },
      { range: [1945, 1965], context: 'Post-WWII - Suburban expansion and baby boom' },
      { range: [1965, 1985], context: 'Civil Rights era - Migration for equality and opportunity' },
      { range: [1985, 2005], context: 'Tech boom - Migration to technology centers' }
    ];
    
    const matchingContext = contexts.find(ctx => 
      startYear >= ctx.range[0] && endYear <= ctx.range[1]
    );
    
    return matchingContext?.context || 'Family expansion or economic opportunity';
  };

  // Generate all insights
  useEffect(() => {
    const allInsights: PredictiveInsight[] = [
      ...predictMissingRelatives,
      ...predictMigrationPatterns.map(pattern => ({
        id: `migration-insight-${pattern.id}`,
        type: 'historical_connection' as const,
        title: `Migration Pattern: ${pattern.startLocation}`,
        description: `Family likely migrated from ${pattern.startLocation} during ${pattern.timePeriod}`,
        confidence: pattern.confidence,
        evidence: [
          `Time period: ${pattern.timePeriod}`,
          `Historical context: ${pattern.historicalContext}`,
          `Reason: ${pattern.reason}`
        ],
        relatedPersons: persons
          .filter(p => p.birthplace === pattern.startLocation)
          .map(p => p.id),
        category: pattern.confidence > 0.8 ? 'high' : pattern.confidence > 0.6 ? 'medium' : 'low',
        actionable: true,
        suggestedActions: [
          'Research local history archives',
          'Check land and property records',
          'Look for immigration documents',
          'Search military service records'
        ]
      })),
      ...healthPatterns.map(pattern => ({
        id: `health-insight-${pattern.id}`,
        type: 'health_insight' as const,
        title: pattern.condition,
        description: `Family health pattern with ${Math.round(pattern.prevalence * 100)}% prevalence`,
        confidence: pattern.prevalence,
        evidence: [
          `Risk level: ${pattern.riskLevel}`,
          `Genetic markers: ${pattern.geneticMarkers.join(', ')}`,
          `Affected family members: ${pattern.affectedFamilyMembers.length}`
        ],
        relatedPersons: persons
          .filter(p => pattern.affectedFamilyMembers.includes(`${p.firstName} ${p.lastName}`))
          .map(p => p.id),
        category: pattern.riskLevel === 'high' ? 'high' : pattern.riskLevel === 'medium' ? 'medium' : 'low',
        actionable: true,
        suggestedActions: pattern.recommendations
      }))
    ];
    
    setInsights(allInsights);
    setMigrationPatterns(predictMigrationPatterns);
    setHealthPatterns(predictHealthPatterns);
    setValidations(validateRelationships);
    setBestPractices(generateBestPractices);
  }, [predictMissingRelatives, predictMigrationPatterns, predictHealthPatterns, validateRelationships, generateBestPractices, persons]);

  // Filter insights
  const filteredInsights = useMemo(() => {
    let filtered = insights;
    
    if (searchTerm) {
      filtered = filtered.filter(insight => 
        insight.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        insight.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (confidenceFilter !== 'all') {
      filtered = filtered.filter(insight => insight.category === confidenceFilter);
    }
    
    return filtered.sort((a, b) => b.confidence - a.confidence);
  }, [insights, searchTerm, confidenceFilter]);

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'missing_relative': return Users;
      case 'migration_pattern': return MapPin;
      case 'health_insight': return Heart;
      case 'historical_connection': return Calendar;
      default: return Brain;
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
            <h2 className="text-2xl font-bold text-gray-900">Predictive Analytics</h2>
            <p className="text-gray-600">AI-powered insights into your family history</p>
          </div>
        </div>

        {/* Privacy Notice */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-blue-600 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-semibold mb-1">Predictive Analysis Notice</p>
              <ul className="space-y-1">
                <li>• All predictions are based on statistical patterns and historical data</li>
                <li>• Confidence scores indicate probability, not certainty</li>
                <li>• Verify predictions with official records before accepting</li>
                <li>• Health insights are for educational purposes only</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('relatives')}
            className={`flex items-center gap-2 px-6 py-3 font-medium transition-colors ${
              activeTab === 'relatives'
                ? 'text-purple-600 border-b-2 border-purple-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Users className="w-4 h-4" />
            Missing Relatives
          </button>
          <button
            onClick={() => setActiveTab('migration')}
            className={`flex items-center gap-2 px-6 py-3 font-medium transition-colors ${
              activeTab === 'migration'
                ? 'text-purple-600 border-b-2 border-purple-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <MapPin className="w-4 h-4" />
            Migration Patterns
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
          <button
            onClick={() => setActiveTab('historical')}
            className={`flex items-center gap-2 px-6 py-3 font-medium transition-colors ${
              activeTab === 'historical'
                ? 'text-purple-600 border-b-2 border-purple-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Calendar className="w-4 h-4" />
            Historical Context
          </button>
          <button
            onClick={() => setActiveTab('validation')}
            className={`flex items-center gap-2 px-6 py-3 font-medium transition-colors ${
              activeTab === 'validation'
                ? 'text-purple-600 border-b-2 border-purple-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <AlertTriangle className="w-4 h-4" />
            Validation
          </button>
          <button
            onClick={() => setActiveTab('practices')}
            className={`flex items-center gap-2 px-6 py-3 font-medium transition-colors ${
              activeTab === 'practices'
                ? 'text-purple-600 border-b-2 border-purple-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Brain className="w-4 h-4" />
            Best Practices
          </button>
        </div>

        {/* Filters */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex gap-4 items-center">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search insights..."
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
              <option value="high">High Confidence</option>
              <option value="medium">Medium Confidence</option>
              <option value="low">Low Confidence</option>
            </select>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {activeTab === 'relatives' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Missing Relatives Predictions</h3>
              {filteredInsights
                .filter(insight => insight.type === 'missing_relative')
                .map(insight => {
                  const Icon = getInsightIcon(insight.type);
                  return (
                    <div key={insight.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start gap-4">
                        <div className={`p-2 rounded-lg ${getCategoryColor(insight.category)}`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-semibold text-gray-900">{insight.title}</h4>
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${getCategoryColor(insight.category)}`}>
                                {Math.round(insight.confidence * 100)}% confidence
                              </span>
                              {insight.actionable && (
                                <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-600">
                                  Actionable
                                </span>
                              )}
                            </div>
                          </div>
                          <p className="text-gray-600 mb-3">{insight.description}</p>
                          
                          <div className="space-y-2">
                            <div>
                              <p className="text-sm font-medium text-gray-700 mb-1">Evidence:</p>
                              <ul className="text-sm text-gray-600 space-y-1">
                                {insight.evidence.map((evidence, index) => (
                                  <li key={index} className="flex items-start gap-2">
                                    <span className="text-purple-600 mt-1">•</span>
                                    <span>{evidence}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                            
                            {insight.suggestedActions && insight.suggestedActions.length > 0 && (
                              <div>
                                <p className="text-sm font-medium text-gray-700 mb-1">Suggested Actions:</p>
                                <ul className="text-sm text-gray-600 space-y-1">
                                  {insight.suggestedActions.map((action, index) => (
                                    <li key={index} className="flex items-start gap-2">
                                      <TrendingUp className="w-3 h-3 text-green-600 mt-1" />
                                      <span>{action}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}

          {activeTab === 'migration' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Family Migration Patterns</h3>
              {migrationPatterns.map(pattern => (
                <div key={pattern.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start gap-4">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <MapPin className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-gray-900">
                          {pattern.startLocation} → {pattern.endLocation}
                        </h4>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getCategoryColor(
                          pattern.confidence > 0.8 ? 'high' : pattern.confidence > 0.6 ? 'medium' : 'low'
                        )}`}>
                          {Math.round(pattern.confidence * 100)}% confidence
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-4 mb-3">
                        <div>
                          <p className="text-sm font-medium text-gray-700">Time Period</p>
                          <p className="text-sm text-gray-600">{pattern.timePeriod}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-700">Reason</p>
                          <p className="text-sm text-gray-600">{pattern.reason}</p>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-1">Historical Context</p>
                        <p className="text-sm text-gray-600">{pattern.historicalContext}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'health' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Family Health Patterns</h3>
              {healthPatterns.map(pattern => (
                <div key={pattern.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start gap-4">
                    <div className="p-2 bg-red-100 rounded-lg">
                      <Heart className="w-5 h-5 text-red-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-gray-900">{pattern.condition}</h4>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getCategoryColor(pattern.riskLevel)}`}>
                          {pattern.riskLevel} risk
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-4 mb-3">
                        <div>
                          <p className="text-sm font-medium text-gray-700">Prevalence</p>
                          <p className="text-sm text-gray-600">{Math.round(pattern.prevalence * 100)}%</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-700">Affected Members</p>
                          <p className="text-sm text-gray-600">{pattern.affectedFamilyMembers.length}</p>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-1">Recommendations</p>
                        <ul className="text-sm text-gray-600 space-y-1">
                          {pattern.recommendations.map((rec, index) => (
                            <li key={index} className="flex items-start gap-2">
                              <Activity className="w-3 h-3 text-green-600 mt-1" />
                              <span>{rec}</span>
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

          {activeTab === 'historical' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Historical Context Connections</h3>
              {filteredInsights
                .filter(insight => insight.type === 'historical_connection')
                .map(insight => {
                  const Icon = getInsightIcon(insight.type);
                  return (
                    <div key={insight.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start gap-4">
                        <div className="p-2 bg-purple-100 rounded-lg">
                          <Icon className="w-5 h-5 text-purple-600" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-semibold text-gray-900">{insight.title}</h4>
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getCategoryColor(insight.category)}`}>
                              {Math.round(insight.confidence * 100)}% confidence
                            </span>
                          </div>
                          <p className="text-gray-600 mb-3">{insight.description}</p>
                          <div className="space-y-2">
                            <div>
                              <p className="text-sm font-medium text-gray-700 mb-1">Historical Evidence:</p>
                              <ul className="text-sm text-gray-600 space-y-1">
                                {insight.evidence.map((evidence, index) => (
                                  <li key={index} className="flex items-start gap-2">
                                    <Globe className="w-3 h-3 text-purple-600 mt-1" />
                                    <span>{evidence}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
          {activeTab === 'validation' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Relationship Validation</h3>
              {validations.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <AlertTriangle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>No validation issues detected</p>
                  <p className="text-sm">Your family data follows genealogical best practices</p>
                </div>
              ) : (
                validations.map(validation => (
                  <div key={validation.id} className={`border rounded-lg p-4 ${
                    validation.severity === 'error' ? 'border-red-200 bg-red-50' :
                    validation.severity === 'warning' ? 'border-yellow-200 bg-yellow-50' :
                    'border-blue-200 bg-blue-50'
                  }`}>
                    <div className="flex items-start gap-4">
                      <AlertTriangle className={`w-5 h-5 mt-1 ${
                        validation.severity === 'error' ? 'text-red-600' :
                        validation.severity === 'warning' ? 'text-yellow-600' :
                        'text-blue-600'
                      }`} />
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold text-gray-900">{validation.title}</h4>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            validation.severity === 'error' ? 'bg-red-100 text-red-600' :
                            validation.severity === 'warning' ? 'bg-yellow-100 text-yellow-600' :
                            'bg-blue-100 text-blue-600'
                          }`}>
                            {validation.severity.toUpperCase()}
                          </span>
                        </div>
                        <p className="text-gray-600 mb-2">{validation.description}</p>
                        <div className="bg-white rounded p-3 mb-2">
                          <p className="text-sm font-medium text-gray-700 mb-1">Genealogical Standard:</p>
                          <p className="text-sm text-gray-600">{validation.genealogicalStandard}</p>
                        </div>
                        <div className="bg-white rounded p-3">
                          <p className="text-sm font-medium text-gray-700 mb-1">Recommendation:</p>
                          <p className="text-sm text-gray-600">{validation.recommendation}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
          {activeTab === 'practices' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Genealogical Best Practices</h3>
              {bestPractices.map(practice => (
                <div key={practice.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start gap-4">
                    <Brain className={`w-5 h-5 mt-1 ${
                      practice.priority === 'high' ? 'text-red-600' :
                      practice.priority === 'medium' ? 'text-yellow-600' :
                      'text-green-600'
                    }`} />
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-gray-900">{practice.title}</h4>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          practice.priority === 'high' ? 'bg-red-100 text-red-600' :
                          practice.priority === 'medium' ? 'bg-yellow-100 text-yellow-600' :
                          'bg-green-100 text-green-600'
                        }`}>
                          {practice.priority.toUpperCase()} PRIORITY
                        </span>
                      </div>
                      <p className="text-gray-600 mb-3">{practice.description}</p>
                      <div className="bg-blue-50 rounded p-3 mb-3">
                        <p className="text-sm font-medium text-blue-700 mb-1">Impact:</p>
                        <p className="text-sm text-blue-600">{practice.impact}</p>
                      </div>
                      <div className="space-y-3">
                        <div>
                          <p className="text-sm font-medium text-gray-700 mb-2">Implementation Steps:</p>
                          <ul className="text-sm text-gray-600 space-y-1">
                            {practice.implementation.map((step, index) => (
                              <li key={index} className="flex items-start gap-2">
                                <span className="text-purple-600 mt-1">•</span>
                                <span>{step}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                        {practice.examples.length > 0 && (
                          <div>
                            <p className="text-sm font-medium text-gray-700 mb-2">Examples:</p>
                            <div className="text-sm text-gray-600 space-y-1">
                              {practice.examples.map((example, index) => (
                                <div key={index} className="bg-gray-50 rounded px-2 py-1 font-mono text-xs">
                                  {example}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Summary Stats */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Analytics Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <Users className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-blue-600">
              {predictMissingRelatives.length}
            </p>
            <p className="text-sm text-gray-600">Missing Relatives</p>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <MapPin className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-green-600">
              {migrationPatterns.length}
            </p>
            <p className="text-sm text-gray-600">Migration Patterns</p>
          </div>
          <div className="text-center p-4 bg-red-50 rounded-lg">
            <Heart className="w-8 h-8 text-red-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-red-600">
              {healthPatterns.length}
            </p>
            <p className="text-sm text-gray-600">Health Insights</p>
          </div>
          <div className="text-center p-4 bg-orange-50 rounded-lg">
            <AlertTriangle className="w-8 h-8 text-orange-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-orange-600">
              {validations.length}
            </p>
            <p className="text-sm text-gray-600">Validation Issues</p>
          </div>
          <div className="text-center p-4 bg-indigo-50 rounded-lg">
            <Brain className="w-8 h-8 text-indigo-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-indigo-600">
              {bestPractices.length}
            </p>
            <p className="text-sm text-gray-600">Best Practices</p>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <TrendingUp className="w-8 h-8 text-purple-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-purple-600">
              {Math.round(filteredInsights.reduce((sum, insight) => sum + insight.confidence, 0) / filteredInsights.length * 100) || 0}%
            </p>
            <p className="text-sm text-gray-600">Avg Confidence</p>
          </div>
        </div>
      </div>
    </div>
  );
}
