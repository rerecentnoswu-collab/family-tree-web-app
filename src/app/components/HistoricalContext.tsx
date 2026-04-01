import React, { useState, useCallback, useMemo } from 'react';
import { Clock, MapPin, Calendar, BookOpen, Globe, AlertTriangle, Info, TrendingUp, Users } from 'lucide-react';

interface HistoricalEvent {
  id: string;
  title: string;
  description: string;
  date: string;
  location: string;
  type: 'war' | 'migration' | 'economic' | 'social' | 'political' | 'natural_disaster' | 'cultural';
  impact: 'local' | 'regional' | 'national' | 'global';
  relevance: number; // 0-100 relevance score
}

interface Person {
  id: string;
  firstName: string;
  lastName: string;
  birthday: string;
  birthplace: string;
  deathDate?: string;
  deathPlace?: string;
  occupation?: string;
}

interface HistoricalContextProps {
  persons: Person[];
  onEventSelected: (event: HistoricalEvent) => void;
}

export function HistoricalContext({ persons, onEventSelected }: HistoricalContextProps) {
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const [historicalEvents, setHistoricalEvents] = useState<HistoricalEvent[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [timeRange, setTimeRange] = useState<'lifetime' | 'decade' | 'century'>('lifetime');
  const [eventTypes, setEventTypes] = useState<string[]>(['war', 'migration', 'economic', 'social', 'political']);

  // Mock historical events database
  const mockHistoricalEvents: HistoricalEvent[] = [
    {
      id: 'ww1',
      title: 'World War I',
      description: 'Global conflict from 1914 to 1918 that reshaped the world order',
      date: '1914-07-28',
      location: 'Europe, Global',
      type: 'war',
      impact: 'global',
      relevance: 95
    },
    {
      id: 'great_depression',
      title: 'Great Depression',
      description: 'Severe worldwide economic depression that lasted from 1929 to 1939',
      date: '1929-10-29',
      location: 'United States, Global',
      type: 'economic',
      impact: 'global',
      relevance: 90
    },
    {
      id: 'ww2',
      title: 'World War II',
      description: 'Global war from 1939 to 1945, the deadliest conflict in human history',
      date: '1939-09-01',
      location: 'Europe, Asia, Global',
      type: 'war',
      impact: 'global',
      relevance: 98
    },
    {
      id: 'industrial_revolution',
      title: 'Industrial Revolution',
      description: 'Period of major industrialization and innovation',
      date: '1760-01-01',
      location: 'Britain, Europe, North America',
      type: 'economic',
      impact: 'global',
      relevance: 85
    },
    {
      id: 'spanish_flu',
      title: 'Spanish Flu Pandemic',
      description: 'Deadly influenza pandemic that infected 500 million people worldwide',
      date: '1918-03-04',
      location: 'Global',
      type: 'natural_disaster',
      impact: 'global',
      relevance: 88
    },
    {
      id: 'civil_rights',
      title: 'Civil Rights Movement',
      description: 'Social movement for equal rights and treatment of African Americans',
      date: '1954-01-01',
      location: 'United States',
      type: 'social',
      impact: 'national',
      relevance: 82
    },
    {
      id: 'fall_berlin_wall',
      title: 'Fall of the Berlin Wall',
      description: 'Symbolic end of the Cold War and German reunification',
      date: '1989-11-09',
      location: 'Berlin, Germany',
      type: 'political',
      impact: 'global',
      relevance: 80
    },
    {
      id: 'migration_1840',
      title: 'Great Irish Famine Migration',
      description: 'Mass migration due to potato famine in Ireland',
      date: '1845-01-01',
      location: 'Ireland, United States, Canada',
      type: 'migration',
      impact: 'global',
      relevance: 75
    }
  ];

  // Calculate person's lifetime range
  const getPersonTimeRange = useCallback((person: Person) => {
    const birthYear = new Date(person.birthday).getFullYear();
    const deathYear = person.deathDate ? new Date(person.deathDate).getFullYear() : new Date().getFullYear();
    
    switch (timeRange) {
      case 'lifetime':
        return { start: birthYear - 5, end: deathYear + 5 };
      case 'decade':
        return { start: birthYear - 10, end: birthYear + 10 };
      case 'century':
        return { start: birthYear - 50, end: birthYear + 50 };
      default:
        return { start: birthYear, end: deathYear };
    }
  }, [timeRange]);

  // Filter relevant events for a person
  const getRelevantEvents = useCallback((person: Person) => {
    const { start, end } = getPersonTimeRange(person);
    
    return mockHistoricalEvents.filter(event => {
      const eventYear = new Date(event.date).getFullYear();
      
      // Check if event falls within time range
      if (eventYear < start || eventYear > end) return false;
      
      // Check event type filter
      if (!eventTypes.includes(event.type)) return false;
      
      // Calculate relevance based on proximity and impact
      const yearDiff = Math.abs(eventYear - new Date(person.birthday).getFullYear());
      const ageAtEvent = eventYear - new Date(person.birthday).getFullYear();
      
      // Higher relevance for events that occurred during person's adult life
      let relevance = event.relevance;
      if (ageAtEvent >= 18 && ageAtEvent <= 65) {
        relevance += 10;
      }
      
      // Location relevance (mock implementation)
      if (person.birthplace.includes('United States') && event.location.includes('United States')) {
        relevance += 15;
      }
      
      return relevance > 50;
    }).sort((a, b) => {
      const aYear = new Date(a.date).getFullYear();
      const bYear = new Date(b.date).getFullYear();
      return Math.abs(aYear - new Date(person.birthday).getFullYear()) - 
             Math.abs(bYear - new Date(person.birthday).getFullYear());
    });
  }, [getPersonTimeRange, eventTypes]);

  // Load historical events for selected person
  const loadHistoricalEvents = useCallback(async (person: Person) => {
    setLoadingEvents(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const relevantEvents = getRelevantEvents(person);
      setHistoricalEvents(relevantEvents);
    } catch (error) {
      console.error('Failed to load historical events:', error);
    } finally {
      setLoadingEvents(false);
    }
  }, [getRelevantEvents]);

  // Handle person selection
  const handlePersonSelect = useCallback((person: Person) => {
    setSelectedPerson(person);
    loadHistoricalEvents(person);
  }, [loadHistoricalEvents]);

  // Get event type icon and color
  const getEventTypeInfo = useCallback((type: string) => {
    switch (type) {
      case 'war':
        return { icon: '⚔️', color: 'red', label: 'War' };
      case 'migration':
        return { icon: '🚢', color: 'blue', label: 'Migration' };
      case 'economic':
        return { icon: '💰', color: 'green', label: 'Economic' };
      case 'social':
        return { icon: '👥', color: 'purple', label: 'Social' };
      case 'political':
        return { icon: '🏛️', color: 'orange', label: 'Political' };
      case 'natural_disaster':
        return { icon: '🌪️', color: 'yellow', label: 'Disaster' };
      case 'cultural':
        return { icon: '🎭', color: 'pink', label: 'Cultural' };
      default:
        return { icon: '📅', color: 'gray', label: 'Event' };
    }
  }, []);

  // Get impact level badge
  const getImpactBadge = useCallback((impact: string) => {
    switch (impact) {
      case 'global':
        return { color: 'bg-red-100 text-red-800', label: 'Global' };
      case 'national':
        return { color: 'bg-blue-100 text-blue-800', label: 'National' };
      case 'regional':
        return { color: 'bg-yellow-100 text-yellow-800', label: 'Regional' };
      case 'local':
        return { color: 'bg-green-100 text-green-800', label: 'Local' };
      default:
        return { color: 'bg-gray-100 text-gray-800', label: 'Unknown' };
    }
  }, []);

  // Calculate age at event
  const getAgeAtEvent = useCallback((person: Person, eventDate: string) => {
    const personBirthYear = new Date(person.birthday).getFullYear();
    const eventYear = new Date(eventDate).getFullYear();
    return eventYear - personBirthYear;
  }, []);

  // Format date range
  const formatDateRange = useCallback((date: string) => {
    const eventDate = new Date(date);
    return eventDate.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  }, []);

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-amber-100 rounded-lg">
            <Clock className="w-6 h-6 text-amber-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Historical Context</h2>
            <p className="text-gray-600">Discover historical events that shaped your ancestors' lives</p>
          </div>
        </div>

        {/* Info Notice */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-amber-600 mt-0.5" />
            <div className="text-sm text-amber-800">
              <p className="font-semibold mb-1">Historical Context Analysis</p>
              <p>Explore major historical events that occurred during your family members' lifetimes. 
              This helps understand the social, political, and economic circumstances that influenced their lives.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Person Selection */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Users className="w-5 h-5" />
              Select Family Member
            </h3>

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {persons.map(person => (
                <button
                  key={person.id}
                  onClick={() => handlePersonSelect(person)}
                  className={`w-full text-left p-3 rounded-lg border transition-colors ${
                    selectedPerson?.id === person.id
                      ? 'bg-blue-50 border-blue-200 text-blue-900'
                      : 'bg-white border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <div className="font-medium">{person.firstName} {person.lastName}</div>
                  <div className="text-sm text-gray-500">
                    {new Date(person.birthday).getFullYear()} - {person.deathDate ? new Date(person.deathDate).getFullYear() : 'Present'}
                  </div>
                  <div className="text-xs text-gray-400">{person.birthplace}</div>
                </button>
              ))}
            </div>

            {/* Time Range Filter */}
            {selectedPerson && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h4 className="font-medium text-gray-900 mb-3">Time Range</h4>
                <div className="space-y-2">
                  {(['lifetime', 'decade', 'century'] as const).map(range => (
                    <label key={range} className="flex items-center gap-2">
                      <input
                        type="radio"
                        value={range}
                        checked={timeRange === range}
                        onChange={(e) => setTimeRange(e.target.value as any)}
                        className="text-blue-600"
                      />
                      <span className="text-sm text-gray-700 capitalize">
                        {range === 'lifetime' ? 'Full Lifetime' : range}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Event Type Filter */}
            {selectedPerson && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h4 className="font-medium text-gray-900 mb-3">Event Types</h4>
                <div className="space-y-2">
                  {[
                    { value: 'war', label: 'Wars & Conflicts' },
                    { value: 'migration', label: 'Migrations' },
                    { value: 'economic', label: 'Economic Events' },
                    { value: 'social', label: 'Social Movements' },
                    { value: 'political', label: 'Political Changes' }
                  ].map(type => (
                    <label key={type.value} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        value={type.value}
                        checked={eventTypes.includes(type.value)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setEventTypes(prev => [...prev, type.value]);
                          } else {
                            setEventTypes(prev => prev.filter(t => t !== type.value));
                          }
                        }}
                        className="text-blue-600"
                      />
                      <span className="text-sm text-gray-700">{type.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Historical Events */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                Historical Events
              </h3>
              {selectedPerson && (
                <div className="text-sm text-gray-500">
                  {historicalEvents.length} events found
                </div>
              )}
            </div>

            {!selectedPerson ? (
              <div className="text-center py-12">
                <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Select a family member to view historical context</p>
              </div>
            ) : loadingEvents ? (
              <div className="text-center py-12">
                <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-gray-500">Loading historical events...</p>
              </div>
            ) : historicalEvents.length === 0 ? (
              <div className="text-center py-12">
                <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No historical events found for this time period</p>
                <p className="text-sm text-gray-400 mt-2">Try adjusting the time range or event type filters</p>
              </div>
            ) : (
              <div className="space-y-4">
                {historicalEvents.map(event => {
                  const typeInfo = getEventTypeInfo(event.type);
                  const impactBadge = getImpactBadge(event.impact);
                  const ageAtEvent = getAgeAtEvent(selectedPerson, event.date);
                  
                  return (
                    <div
                      key={event.id}
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => onEventSelected(event)}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{typeInfo.icon}</span>
                          <div>
                            <h4 className="font-semibold text-gray-900">{event.title}</h4>
                            <p className="text-sm text-gray-500">{formatDateRange(event.date)}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${impactBadge.color}`}>
                            {impactBadge.label}
                          </span>
                          <span className="text-sm text-gray-500">
                            Age: {ageAtEvent}
                          </span>
                        </div>
                      </div>

                      <p className="text-gray-700 text-sm mb-3">{event.description}</p>

                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {event.location}
                        </div>
                        <div className="flex items-center gap-1">
                          <TrendingUp className="w-3 h-3" />
                          {event.relevance}% relevance
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Selected Person Summary */}
          {selectedPerson && (
            <div className="mt-6 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h4 className="font-semibold text-gray-900 mb-3">Life Summary</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Born</p>
                  <p className="font-medium">{formatDateRange(selectedPerson.birthday)}</p>
                  <p className="text-gray-400">{selectedPerson.birthplace}</p>
                </div>
                <div>
                  <p className="text-gray-500">Died</p>
                  <p className="font-medium">
                    {selectedPerson.deathDate ? formatDateRange(selectedPerson.deathDate) : 'Still living'}
                  </p>
                  <p className="text-gray-400">{selectedPerson.deathPlace || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-gray-500">Age Range</p>
                  <p className="font-medium">
                    {selectedPerson.deathDate 
                      ? new Date(selectedPerson.deathDate).getFullYear() - new Date(selectedPerson.birthday).getFullYear()
                      : new Date().getFullYear() - new Date(selectedPerson.birthday).getFullYear()
                    } years
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Occupation</p>
                  <p className="font-medium">{selectedPerson.occupation || 'Unknown'}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
