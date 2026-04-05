import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Calendar, Clock, MapPin, Users, Heart, AlertTriangle, Globe, ZoomIn, ZoomOut, Play, Pause, RotateCcw, Filter, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { Person } from '../types/Person';

interface TimelineEvent {
  id: string;
  type: 'birth' | 'death' | 'marriage' | 'migration' | 'military' | 'occupation' | 'historical' | 'custom';
  title: string;
  date: string;
  year: number;
  description: string;
  personIds: string[];
  location?: string;
  importance: 'low' | 'medium' | 'high';
  category: 'personal' | 'family' | 'historical' | 'global';
  color?: string;
  icon?: React.ReactNode;
}

interface HistoricalEvent {
  id: string;
  title: string;
  date: string;
  year: number;
  endYear?: number;
  description: string;
  category: 'war' | 'migration' | 'economic' | 'social' | 'political' | 'natural_disaster' | 'pandemic';
  impact: 'local' | 'national' | 'global';
  color: string;
}

export function InteractiveTimeline({ persons }: { persons: Person[] }) {
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>([]);
  const [historicalEvents, setHistoricalEvents] = useState<HistoricalEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<TimelineEvent | HistoricalEvent | null>(null);
  const [viewMode, setViewMode] = useState<'decade' | 'year' | 'month'>('decade');
  const [timeRange, setTimeRange] = useState({ start: 1800, end: 2000 });
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentYear, setCurrentYear] = useState(1900);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [filterType, setFilterType] = useState<'all' | 'personal' | 'family' | 'historical'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const timelineRef = useRef<HTMLDivElement>(null);

  // Generate timeline events from person data
  const generateTimelineEvents = useMemo(() => {
    const events: TimelineEvent[] = [];

    persons.forEach(person => {
      // Birth event
      if (person.birthday) {
        events.push({
          id: `birth-${person.id}`,
          type: 'birth',
          title: `${person.firstName} ${person.lastName} Born`,
          date: person.birthday,
          year: new Date(person.birthday).getFullYear(),
          description: `Born in ${person.birthplace || 'unknown location'}`,
          personIds: [person.id],
          location: person.birthplace,
          importance: 'high',
          category: 'personal',
          color: '#10b981'
        });
      }

      // Death event
      if (person.deathDate) {
        events.push({
          id: `death-${person.id}`,
          type: 'death',
          title: `${person.firstName} ${person.lastName} Passed Away`,
          date: person.deathDate,
          year: new Date(person.deathDate).getFullYear(),
          description: `Died at age ${person.birthday ? new Date(person.deathDate).getFullYear() - new Date(person.birthday).getFullYear() : 'unknown'}`,
          personIds: [person.id],
          importance: 'high',
          category: 'personal',
          color: '#ef4444'
        });
      }
    });

    // Add family events (marriages, migrations, etc.)
    persons.forEach(person => {
      // Marriage events (simplified - would need spouse data)
      if (person.birthday && Math.random() > 0.7) { // Mock data
        const marriageYear = new Date(person.birthday).getFullYear() + 20 + Math.floor(Math.random() * 10);
        events.push({
          id: `marriage-${person.id}`,
          type: 'marriage',
          title: `Marriage of ${person.firstName} ${person.lastName}`,
          date: `${marriageYear}-06-15`,
          year: marriageYear,
          description: `Married in ${person.birthplace}`,
          personIds: [person.id],
          location: person.birthplace,
          importance: 'medium',
          category: 'family',
          color: '#8b5cf6'
        });
      }

      // Migration events
      if (person.birthday && Math.random() > 0.8) { // Mock data
        const migrationYear = new Date(person.birthday).getFullYear() + 25 + Math.floor(Math.random() * 20);
        events.push({
          id: `migration-${person.id}`,
          type: 'migration',
          title: `${person.firstName} ${person.lastName} Moved`,
          date: `${migrationYear}-03-01`,
          year: migrationYear,
          description: `Moved from ${person.birthplace} to new location`,
          personIds: [person.id],
          importance: 'medium',
          category: 'family',
          color: '#3b82f6'
        });
      }
    });

    return events.sort((a, b) => a.year - b.year);
  }, [persons]);

  // Generate historical events
  const generateHistoricalEvents = useMemo(() => {
    const events: HistoricalEvent[] = [
      {
        id: 'civil-war',
        title: 'American Civil War',
        date: '1861-04-12',
        year: 1861,
        endYear: 1865,
        description: 'War between Union and Confederate states',
        category: 'war',
        impact: 'national',
        color: '#dc2626'
      },
      {
        id: 'ww1',
        title: 'World War I',
        date: '1914-07-28',
        year: 1914,
        endYear: 1918,
        description: 'Global conflict involving world powers',
        category: 'war',
        impact: 'global',
        color: '#dc2626'
      },
      {
        id: 'great-depression',
        title: 'Great Depression',
        date: '1929-10-29',
        year: 1929,
        endYear: 1939,
        description: 'Economic downturn affecting millions',
        category: 'economic',
        impact: 'global',
        color: '#f59e0b'
      },
      {
        id: 'ww2',
        title: 'World War II',
        date: '1939-09-01',
        year: 1939,
        endYear: 1945,
        description: 'Second global military conflict',
        category: 'war',
        impact: 'global',
        color: '#dc2626'
      },
      {
        id: 'spanish-flu',
        title: 'Spanish Flu Pandemic',
        date: '1918-03-04',
        year: 1918,
        endYear: 1920,
        description: 'Global influenza pandemic',
        category: 'pandemic',
        impact: 'global',
        color: '#8b5cf6'
      },
      {
        id: 'industrial-revolution',
        title: 'Second Industrial Revolution',
        date: '1870-01-01',
        year: 1870,
        endYear: 1914,
        description: 'Period of technological advancement',
        category: 'social',
        impact: 'global',
        color: '#059669'
      }
    ];

    return events;
  }, []);

  useEffect(() => {
    setTimelineEvents(generateTimelineEvents);
    setHistoricalEvents(generateHistoricalEvents);
  }, [generateTimelineEvents, generateHistoricalEvents]);

  // Auto-play functionality
  useEffect(() => {
    if (isPlaying) {
      const interval = setInterval(() => {
        setCurrentYear(prev => {
          if (prev >= timeRange.end) {
            setIsPlaying(false);
            return timeRange.start;
          }
          return prev + 1;
        });
      }, 100);

      return () => clearInterval(interval);
    }
  }, [isPlaying, timeRange]);

  // Filter events
  const filteredEvents = useMemo(() => {
    let events = [...timelineEvents];

    if (filterType !== 'all') {
      events = events.filter(event => event.category === filterType);
    }

    if (searchTerm) {
      events = events.filter(event =>
        event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return events.filter(event => event.year >= timeRange.start && event.year <= timeRange.end);
  }, [timelineEvents, filterType, searchTerm, timeRange]);

  const filteredHistoricalEvents = useMemo(() => {
    return historicalEvents.filter(event => 
      event.year >= timeRange.start && 
      (event.endYear ? event.endYear <= timeRange.end : event.year <= timeRange.end)
    );
  }, [historicalEvents, timeRange]);

  // Get event icon
  const getEventIcon = (type: string) => {
    switch (type) {
      case 'birth': return <Heart className="w-4 h-4" />;
      case 'death': return <AlertTriangle className="w-4 h-4" />;
      case 'marriage': return <Users className="w-4 h-4" />;
      case 'migration': return <MapPin className="w-4 h-4" />;
      case 'military': return <AlertTriangle className="w-4 h-4" />;
      case 'occupation': return <Calendar className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  // Calculate timeline position
  const getTimelinePosition = (year: number) => {
    const range = timeRange.end - timeRange.start;
    const position = ((year - timeRange.start) / range) * 100;
    return Math.max(0, Math.min(100, position));
  };

  // Zoom controls
  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev * 1.2, 5));
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev / 1.2, 0.5));
  };

  const handleReset = () => {
    setZoomLevel(1);
    setCurrentYear(1900);
    setIsPlaying(false);
  };

  // Time range controls
  const handlePreviousDecade = () => {
    const decade = 10;
    setTimeRange(prev => ({
      start: Math.max(prev.start - decade, 1800),
      end: Math.max(prev.end - decade, 1820)
    }));
  };

  const handleNextDecade = () => {
    const decade = 10;
    setTimeRange(prev => ({
      start: Math.min(prev.start + decade, 1980),
      end: Math.min(prev.end + decade, 2000)
    }));
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Clock className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Interactive Timeline</h2>
            <p className="text-gray-600">Explore your family history through time</p>
          </div>
        </div>

        {/* Timeline Controls */}
        <div className="flex flex-wrap gap-4 items-center mb-6">
          {/* View Mode */}
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('decade')}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                viewMode === 'decade' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Decade
            </button>
            <button
              onClick={() => setViewMode('year')}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                viewMode === 'year' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Year
            </button>
            <button
              onClick={() => setViewMode('month')}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                viewMode === 'month' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Month
            </button>
          </div>

          {/* Zoom Controls */}
          <div className="flex gap-2">
            <button
              onClick={handleZoomOut}
              className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              onClick={handleZoomIn}
              className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={handleReset}
              className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          {/* Playback Controls */}
          <div className="flex gap-2">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </button>
          </div>

          {/* Time Range Controls */}
          <div className="flex gap-2">
            <button
              onClick={handlePreviousDecade}
              className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 py-1 bg-gray-100 rounded-lg text-sm font-medium">
              {timeRange.start}-{timeRange.end}
            </span>
            <button
              onClick={handleNextDecade}
              className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Filter */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as any)}
            className="px-3 py-1 bg-gray-100 rounded-lg text-sm"
          >
            <option value="all">All Events</option>
            <option value="personal">Personal</option>
            <option value="family">Family</option>
            <option value="historical">Historical</option>
          </select>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search events..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 pr-3 py-1 bg-gray-100 rounded-lg text-sm w-48"
            />
          </div>
        </div>

        {/* Current Year Display */}
        <div className="text-center mb-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-lg">
            <Calendar className="w-5 h-5 text-blue-600" />
            <span className="text-lg font-semibold text-blue-900">Year: {currentYear}</span>
          </div>
        </div>
      </div>

      {/* Timeline Visualization */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div ref={timelineRef} className="relative h-96 overflow-hidden">
          {/* Timeline Base */}
          <div className="absolute top-1/2 left-0 right-0 h-1 bg-gray-300 transform -translate-y-1/2" />
          
          {/* Year Markers */}
          <div className="absolute top-0 left-0 right-0 h-full">
            {Array.from({ length: Math.min(10, timeRange.end - timeRange.start + 1) }, (_, i) => {
              const year = timeRange.start + Math.floor((timeRange.end - timeRange.start) * (i / 9));
              const position = getTimelinePosition(year);
              return (
                <div
                  key={year}
                  className="absolute top-0 bottom-0 flex flex-col items-center"
                  style={{ left: `${position}%` }}
                >
                  <div className="w-0.5 h-full bg-gray-200" />
                  <div className="mt-2 text-xs text-gray-600 font-medium">{year}</div>
                </div>
              );
            })}
          </div>

          {/* Personal Events */}
          <div className="absolute top-0 left-0 right-0 h-full">
            {filteredEvents.map((event, index) => {
              const position = getTimelinePosition(event.year);
              const isHighlighted = Math.abs(event.year - currentYear) <= 5;
              return (
                <div
                  key={event.id}
                  className={`absolute top-1/2 transform -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all duration-200 ${
                    isHighlighted ? 'scale-125 z-20' : 'scale-100 z-10'
                  }`}
                  style={{ 
                    left: `${position}%`,
                    top: index % 2 === 0 ? '25%' : '75%'
                  }}
                  onClick={() => setSelectedEvent(event)}
                >
                  <div
                    className="relative p-2 rounded-full shadow-lg hover:shadow-xl transition-shadow"
                    style={{ backgroundColor: event.color }}
                  >
                    {getEventIcon(event.type)}
                    {isHighlighted && (
                      <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-white rounded-full animate-pulse" />
                    )}
                  </div>
                  <div className="absolute top-full mt-1 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
                    <div className="text-xs font-medium text-gray-700 bg-white px-2 py-1 rounded shadow">
                      {event.title}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Historical Events */}
          <div className="absolute top-0 left-0 right-0 h-full">
            {filteredHistoricalEvents.map(event => {
              const startPos = getTimelinePosition(event.year);
              const endPos = event.endYear ? getTimelinePosition(event.endYear) : startPos;
              return (
                <div
                  key={event.id}
                  className="absolute top-0 bottom-0 bg-opacity-20 cursor-pointer hover:bg-opacity-30 transition-all"
                  style={{
                    left: `${startPos}%`,
                    right: `${100 - endPos}%`,
                    backgroundColor: event.color
                  }}
                  onClick={() => setSelectedEvent(event)}
                >
                  <div className="absolute top-2 left-0 right-0 text-center">
                    <div className="inline-block px-2 py-1 text-xs font-medium text-white rounded" style={{ backgroundColor: event.color }}>
                      {event.title}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Current Year Indicator */}
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-30"
            style={{ left: `${getTimelinePosition(currentYear)}%` }}
          >
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-red-500 rounded-full" />
            <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 w-3 h-3 bg-red-500 rounded-full" />
          </div>
        </div>
      </div>

      {/* Event Details */}
      {selectedEvent && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{selectedEvent.title}</h3>
              <p className="text-gray-600">{selectedEvent.description}</p>
            </div>
            <button
              onClick={() => setSelectedEvent(null)}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              ×
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <span className="font-medium text-gray-700">Date:</span>
              <span className="text-gray-600 ml-2">{selectedEvent.date}</span>
            </div>
            
            {'location' in selectedEvent && selectedEvent.location && (
              <div>
                <span className="font-medium text-gray-700">Location:</span>
                <span className="text-gray-600 ml-2">{selectedEvent.location}</span>
              </div>
            )}
            
            {'category' in selectedEvent && (
              <div>
                <span className="font-medium text-gray-700">Category:</span>
                <span className="text-gray-600 ml-2">{selectedEvent.category}</span>
              </div>
            )}
            
            {'impact' in selectedEvent && (
              <div>
                <span className="font-medium text-gray-700">Impact:</span>
                <span className="text-gray-600 ml-2">{selectedEvent.impact}</span>
              </div>
            )}
          </div>
          
          {'personIds' in selectedEvent && selectedEvent.personIds.length > 0 && (
            <div className="mt-4">
              <span className="font-medium text-gray-700">Related People:</span>
              <div className="mt-2 flex flex-wrap gap-2">
                {selectedEvent.personIds.map(personId => {
                  const person = persons.find(p => p.id === personId);
                  return person ? (
                    <span key={personId} className="px-2 py-1 bg-blue-50 text-blue-600 rounded text-sm">
                      {person.firstName} {person.lastName}
                    </span>
                  ) : null;
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Statistics */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Timeline Statistics</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <Calendar className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-blue-600">{filteredEvents.length}</p>
            <p className="text-sm text-gray-600">Family Events</p>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <Globe className="w-8 h-8 text-purple-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-purple-600">{filteredHistoricalEvents.length}</p>
            <p className="text-sm text-gray-600">Historical Events</p>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <Users className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-green-600">{persons.length}</p>
            <p className="text-sm text-gray-600">Family Members</p>
          </div>
          <div className="text-center p-4 bg-orange-50 rounded-lg">
            <Clock className="w-8 h-8 text-orange-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-orange-600">{timeRange.end - timeRange.start + 1}</p>
            <p className="text-sm text-gray-600">Years Spanned</p>
          </div>
        </div>
      </div>
    </div>
  );
}
