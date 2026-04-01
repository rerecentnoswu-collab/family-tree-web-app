import React, { useState, useEffect, useMemo } from 'react';
import { BookOpen, PenTool, Sparkles, Clock, Users, MapPin, Calendar, Heart, Brain, FileText, Download, Share2, Settings, Play, Pause, RotateCcw, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Image, Music, Video, Star, TrendingUp, BarChart3, Activity, Lightbulb, MessageSquare, Globe, History } from 'lucide-react';

interface StoryTheme {
  id: string;
  name: string;
  description: string;
  icon: string;
  style: 'narrative' | 'chronological' | 'thematic' | 'biographical';
  tone: 'formal' | 'casual' | 'poetic' | 'dramatic';
  length: 'short' | 'medium' | 'long';
}

interface StoryChapter {
  id: string;
  title: string;
  content: string;
  type: 'introduction' | 'childhood' | 'adulthood' | 'family' | 'career' | 'legacy' | 'conclusion';
  timeline: string[];
  people: string[];
  places: string[];
  events: string[];
  media: string[];
  wordCount: number;
  readTime: number;
}

interface GeneratedStory {
  id: string;
  title: string;
  subtitle: string;
  theme: StoryTheme;
  chapters: StoryChapter[];
  metadata: {
    totalWords: number;
    readTime: number;
    peopleCount: number;
    placesCount: number;
    eventsCount: number;
    mediaCount: number;
    generatedAt: string;
    version: string;
  };
  settings: {
    includePhotos: boolean;
    includeTimeline: boolean;
    includeFamilyTree: boolean;
    includeHistoricalContext: boolean;
    language: string;
    voice: string;
  };
}

interface StoryTemplate {
  id: string;
  name: string;
  description: string;
  category: 'biography' | 'family_history' | 'migration' | 'military' | 'celebration';
  structure: string[];
  prompts: string[];
  examples: string;
}

export function StoryGenerator({ persons }: { persons: any[] }) {
  const [activeTab, setActiveTab] = useState<'generate' | 'stories' | 'templates' | 'settings'>('generate');
  const [selectedTheme, setSelectedTheme] = useState<StoryTheme | null>(null);
  const [generatedStories, setGeneratedStories] = useState<GeneratedStory[]>([]);
  const [currentStory, setCurrentStory] = useState<GeneratedStory | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [selectedPeople, setSelectedPeople] = useState<string[]>([]);
  const [storyLength, setStoryLength] = useState<'short' | 'medium' | 'long'>('medium');
  const [storyTone, setStoryTone] = useState<'formal' | 'casual' | 'poetic' | 'dramatic'>('casual');

  // Story themes
  const storyThemes: StoryTheme[] = [
    {
      id: 'biography',
      name: 'Personal Biography',
      description: 'Life story of an individual',
      icon: '👤',
      style: 'biographical',
      tone: 'formal',
      length: 'medium'
    },
    {
      id: 'family_saga',
      name: 'Family Saga',
      description: 'Multi-generational family history',
      icon: '👨‍👩‍👧‍👦',
      style: 'narrative',
      tone: 'dramatic',
      length: 'long'
    },
    {
      id: 'migration_journey',
      name: 'Migration Journey',
      description: 'Story of family migration and settlement',
      icon: '🌍',
      style: 'chronological',
      tone: 'poetic',
      length: 'medium'
    },
    {
      id: 'war_hero',
      name: 'Military Service',
      description: 'Stories of military service and sacrifice',
      icon: '⚔️',
      style: 'thematic',
      tone: 'formal',
      length: 'short'
    },
    {
      id: 'love_story',
      name: 'Love Story',
      description: 'Romantic relationships and marriages',
      icon: '💕',
      style: 'narrative',
      tone: 'poetic',
      length: 'medium'
    },
    {
      id: 'legacy',
      name: 'Family Legacy',
      description: 'Impact and contributions to family and community',
      icon: '🏛️',
      style: 'biographical',
      tone: 'formal',
      length: 'long'
    }
  ];

  // Story templates
  const storyTemplates: StoryTemplate[] = [
    {
      id: 'life_journey',
      name: 'Life Journey',
      description: 'Complete life story from birth to present',
      category: 'biography',
      structure: ['introduction', 'childhood', 'education', 'career', 'family', 'legacy'],
      prompts: [
        'What were the early years like?',
        'How did education shape their future?',
        'What were their major accomplishments?',
        'How did they build their family?',
        'What is their lasting impact?'
      ],
      examples: 'Born in a small town, they grew up with strong values...'
    },
    {
      id: 'immigration_story',
      name: 'Immigration Story',
      description: 'Journey of immigration and adaptation',
      category: 'migration',
      structure: ['origins', 'journey', 'arrival', 'struggles', 'success', 'legacy'],
      prompts: [
        'What prompted the decision to leave?',
        'What was the journey like?',
        'How did they adapt to the new country?',
        'What challenges did they face?',
        'How did they build a new life?'
      ],
      examples: 'Leaving everything behind, they embarked on a perilous journey...'
    },
    {
      id: 'war_memories',
      name: 'War Memories',
      description: 'Military service experiences',
      category: 'military',
      structure: ['enlistment', 'training', 'deployment', 'combat', 'return', 'aftermath'],
      prompts: [
        'Why did they join the military?',
        'What was training like?',
        'Where did they serve?',
        'What were their experiences?',
        'How did it change them?'
      ],
      examples: 'Answering the call of duty, they left home as young men...'
    }
  ];

  // Generate mock stories
  const generateMockStories = useMemo(() => {
    const stories: GeneratedStory[] = [
      {
        id: 'story-1',
        title: 'The Johnson Family Legacy',
        subtitle: 'A Century of American Dreams',
        theme: storyThemes[1],
        chapters: [
          {
            id: 'chapter-1',
            title: 'The Beginning',
            content: 'In the late 19th century, a young immigrant named William Johnson arrived in America with nothing but dreams and determination. Born in a small village in Ireland, he left behind poverty and famine in search of a better life. The journey across the Atlantic was treacherous, but his spirit remained unbroken. Upon arriving in New York Harbor, the sight of the Statue of Liberty filled him with hope for the future.',
            type: 'introduction',
            timeline: ['1890-1895'],
            people: ['William Johnson', 'Mary O\'Sullivan'],
            places: ['Ireland', 'New York', 'Ellis Island'],
            events: ['Immigration', 'Arrival in America'],
            media: ['immigration_photo.jpg', 'ship_manifest.jpg'],
            wordCount: 458,
            readTime: 2
          },
          {
            id: 'chapter-2',
            title: 'Building a Foundation',
            content: 'William worked tirelessly in the factories of New York, saving every penny he could. He met Mary O\'Sullivan, another Irish immigrant, and they fell in love. Together, they faced the challenges of life in a new country, supporting each other through hardships and celebrating small victories. Their marriage in 1895 marked the beginning of a new chapter, not just for them, but for generations to come.',
            type: 'family',
            timeline: ['1895-1905'],
            people: ['William Johnson', 'Mary O\'Sullivan', 'John Johnson'],
            places: ['New York', 'Brooklyn', 'Lower East Side'],
            events: ['Marriage', 'Birth of first child'],
            media: ['wedding_photo.jpg', 'family_portrait.jpg'],
            wordCount: 612,
            readTime: 3
          }
        ],
        metadata: {
          totalWords: 1070,
          readTime: 5,
          peopleCount: 3,
          placesCount: 4,
          eventsCount: 4,
          mediaCount: 4,
          generatedAt: '2024-01-20T14:30:00Z',
          version: '1.0'
        },
        settings: {
          includePhotos: true,
          includeTimeline: true,
          includeFamilyTree: true,
          includeHistoricalContext: true,
          language: 'english',
          voice: 'narrative'
        }
      }
    ];

    return stories;
  }, [storyThemes]);

  useEffect(() => {
    setGeneratedStories(generateMockStories);
  }, [generateMockStories]);

  // Generate story
  const generateStory = async () => {
    if (!selectedTheme || selectedPeople.length === 0) return;

    setIsGenerating(true);
    setGenerationProgress(0);

    const interval = setInterval(() => {
      setGenerationProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsGenerating(false);
          
          // Create new story
          const newStory: GeneratedStory = {
            id: `story-${Date.now()}`,
            title: `The ${selectedPeople.join(' & ')} Story`,
            subtitle: `A ${selectedTheme.name} Journey`,
            theme: selectedTheme,
            chapters: [
              {
                id: 'chapter-1',
                title: 'Introduction',
                content: `This is the story of ${selectedPeople.join(' and ')}, a tale that spans generations and touches the hearts of all who read it. From humble beginnings to extraordinary achievements, their journey reflects the resilience and determination that defines the human spirit.`,
                type: 'introduction',
                timeline: ['1800-1900'],
                people: selectedPeople,
                places: ['Various locations'],
                events: ['Major life events'],
                media: ['family_photos.jpg'],
                wordCount: 245,
                readTime: 1
              }
            ],
            metadata: {
              totalWords: 245,
              readTime: 1,
              peopleCount: selectedPeople.length,
              placesCount: 1,
              eventsCount: 1,
              mediaCount: 1,
              generatedAt: new Date().toISOString(),
              version: '1.0'
            },
            settings: {
              includePhotos: true,
              includeTimeline: true,
              includeFamilyTree: true,
              includeHistoricalContext: true,
              language: 'english',
              voice: 'narrative'
            }
          };
          
          setGeneratedStories(prev => [newStory, ...prev]);
          setCurrentStory(newStory);
          return 100;
        }
        return prev + 10;
      });
    }, 200);
  };

  // Get tone icon
  const getToneIcon = (tone: string) => {
    switch (tone) {
      case 'formal': return <BookOpen className="w-4 h-4" />;
      case 'casual': return <MessageSquare className="w-4 h-4" />;
      case 'poetic': return <Heart className="w-4 h-4" />;
      case 'dramatic': return <Sparkles className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  // Get style color
  const getStyleColor = (style: string) => {
    switch (style) {
      case 'narrative': return 'text-blue-600 bg-blue-50';
      case 'chronological': return 'text-green-600 bg-green-50';
      case 'thematic': return 'text-purple-600 bg-purple-50';
      case 'biographical': return 'text-orange-600 bg-orange-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-purple-100 rounded-lg">
            <BookOpen className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">AI Story Generator</h2>
            <p className="text-gray-600">Create compelling family narratives with AI</p>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-purple-50 rounded-lg p-4">
            <BookOpen className="w-6 h-6 text-purple-600 mb-2" />
            <h3 className="font-semibold text-purple-900 mb-1">Stories Created</h3>
            <p className="text-sm text-purple-700">{generatedStories.length} narratives</p>
          </div>
          <div className="bg-blue-50 rounded-lg p-4">
            <FileText className="w-6 h-6 text-blue-600 mb-2" />
            <h3 className="font-semibold text-blue-900 mb-1">Total Words</h3>
            <p className="text-sm text-blue-700">
              {generatedStories.reduce((acc, story) => acc + story.metadata.totalWords, 0).toLocaleString()}
            </p>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <Users className="w-6 h-6 text-green-600 mb-2" />
            <h3 className="font-semibold text-green-900 mb-1">People Featured</h3>
            <p className="text-sm text-green-700">{persons.length} family members</p>
          </div>
          <div className="bg-orange-50 rounded-lg p-4">
            <Sparkles className="w-6 h-6 text-orange-600 mb-2" />
            <h3 className="font-semibold text-orange-900 mb-1">AI Enhanced</h3>
            <p className="text-sm text-orange-700">Advanced narratives</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('generate')}
            className={`flex items-center gap-2 px-6 py-3 font-medium transition-colors ${
              activeTab === 'generate'
                ? 'text-purple-600 border-b-2 border-purple-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <PenTool className="w-4 h-4" />
            Generate
          </button>
          <button
            onClick={() => setActiveTab('stories')}
            className={`flex items-center gap-2 px-6 py-3 font-medium transition-colors ${
              activeTab === 'stories'
                ? 'text-purple-600 border-b-2 border-purple-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            Stories
          </button>
          <button
            onClick={() => setActiveTab('templates')}
            className={`flex items-center gap-2 px-6 py-3 font-medium transition-colors ${
              activeTab === 'templates'
                ? 'text-purple-600 border-b-2 border-purple-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <FileText className="w-4 h-4" />
            Templates
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`flex items-center gap-2 px-6 py-3 font-medium transition-colors ${
              activeTab === 'settings'
                ? 'text-purple-600 border-b-2 border-purple-600'
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
        {activeTab === 'generate' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Create New Story</h3>
              <button
                onClick={generateStory}
                disabled={!selectedTheme || selectedPeople.length === 0 || isGenerating}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isGenerating ? (
                  <>
                    <Brain className="w-4 h-4 animate-pulse" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Generate Story
                  </>
                )}
              </button>
            </div>

            {/* Generation Progress */}
            {isGenerating && (
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-2">
                  <Brain className="w-5 h-5 text-purple-600 animate-pulse" />
                  <span className="font-medium text-purple-900">AI is crafting your story...</span>
                </div>
                <div className="w-full bg-purple-200 rounded-full h-2">
                  <div
                    className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${generationProgress}%` }}
                  />
                </div>
                <p className="text-sm text-purple-700 mt-1">{generationProgress}% complete</p>
              </div>
            )}

            {/* Story Theme Selection */}
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Choose Story Theme</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {storyThemes.map(theme => (
                  <div
                    key={theme.id}
                    onClick={() => setSelectedTheme(theme)}
                    className={`border rounded-lg p-4 cursor-pointer transition-all ${
                      selectedTheme?.id === theme.id
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-2xl">{theme.icon}</span>
                      <h5 className="font-semibold text-gray-900">{theme.name}</h5>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">{theme.description}</p>
                    <div className="flex items-center gap-2 text-xs">
                      <span className={`px-2 py-1 rounded-full ${getStyleColor(theme.style)}`}>
                        {theme.style}
                      </span>
                      <span className="flex items-center gap-1 text-gray-600">
                        {getToneIcon(theme.tone)}
                        {theme.tone}
                      </span>
                      <span className="text-gray-600">
                        {theme.length}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* People Selection */}
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Select People to Include</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {persons.slice(0, 12).map(person => (
                  <label
                    key={person.id}
                    className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50"
                  >
                    <input
                      type="checkbox"
                      checked={selectedPeople.includes(person.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedPeople(prev => [...prev, person.id]);
                        } else {
                          setSelectedPeople(prev => prev.filter(id => id !== person.id));
                        }
                      }}
                      className="w-4 h-4 text-purple-600 rounded"
                    />
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{person.name}</p>
                      <p className="text-sm text-gray-600">
                        {person.birthDate ? `${person.birthDate} - ${person.deathDate || 'Present'}` : 'Unknown dates'}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Story Options */}
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Story Options</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Story Length</label>
                  <select
                    value={storyLength}
                    onChange={(e) => setStoryLength(e.target.value as any)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="short">Short (500-1000 words)</option>
                    <option value="medium">Medium (1000-3000 words)</option>
                    <option value="long">Long (3000+ words)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Story Tone</label>
                  <select
                    value={storyTone}
                    onChange={(e) => setStoryTone(e.target.value as any)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="formal">Formal</option>
                    <option value="casual">Casual</option>
                    <option value="poetic">Poetic</option>
                    <option value="dramatic">Dramatic</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Language</label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent">
                    <option value="english">English</option>
                    <option value="spanish">Spanish</option>
                    <option value="french">French</option>
                    <option value="german">German</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Additional Options */}
            <div className="space-y-3">
              <label className="flex items-center gap-3 p-3 bg-gray-50 rounded cursor-pointer">
                <input type="checkbox" defaultChecked className="w-4 h-4 text-purple-600 rounded" />
                <div>
                  <p className="font-medium text-gray-900">Include Historical Context</p>
                  <p className="text-sm text-gray-600">Add relevant historical events and context</p>
                </div>
              </label>
              <label className="flex items-center gap-3 p-3 bg-gray-50 rounded cursor-pointer">
                <input type="checkbox" defaultChecked className="w-4 h-4 text-purple-600 rounded" />
                <div>
                  <p className="font-medium text-gray-900">Include Family Photos</p>
                  <p className="text-sm text-gray-600">Integrate photos into the narrative</p>
                </div>
              </label>
              <label className="flex items-center gap-3 p-3 bg-gray-50 rounded cursor-pointer">
                <input type="checkbox" defaultChecked className="w-4 h-4 text-purple-600 rounded" />
                <div>
                  <p className="font-medium text-gray-900">Include Timeline</p>
                  <p className="text-sm text-gray-600">Add chronological timeline of events</p>
                </div>
              </label>
            </div>
          </div>
        )}

        {activeTab === 'stories' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Generated Stories</h3>
              <div className="flex gap-2">
                <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  <Download className="w-4 h-4" />
                  Export All
                </button>
                <button className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
                  <Share2 className="w-4 h-4" />
                  Share
                </button>
              </div>
            </div>

            <div className="space-y-4">
              {generatedStories.map(story => (
                <div key={story.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-semibold text-gray-900 text-lg">{story.title}</h4>
                      <p className="text-gray-600 mb-2">{story.subtitle}</p>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <FileText className="w-4 h-4" />
                          {story.metadata.totalWords.toLocaleString()} words
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {story.metadata.readTime} min read
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {new Date(story.metadata.generatedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setCurrentStory(story)}
                        className="px-3 py-1 text-sm bg-purple-600 text-white rounded hover:bg-purple-700"
                      >
                        Read
                      </button>
                      <button className="p-2 hover:bg-gray-100 rounded">
                        <Download className="w-4 h-4 text-gray-600" />
                      </button>
                      <button className="p-2 hover:bg-gray-100 rounded">
                        <Share2 className="w-4 h-4 text-gray-600" />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mb-3">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStyleColor(story.theme.style)}`}>
                      {story.theme.style}
                    </span>
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-600">
                      {story.theme.length}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-gray-600">
                      {getToneIcon(story.theme.tone)}
                      {story.theme.tone}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div className="text-center p-2 bg-blue-50 rounded">
                      <Users className="w-5 h-5 text-blue-600 mx-auto mb-1" />
                      <p className="font-semibold text-blue-900">{story.metadata.peopleCount}</p>
                      <p className="text-xs text-blue-700">People</p>
                    </div>
                    <div className="text-center p-2 bg-green-50 rounded">
                      <MapPin className="w-5 h-5 text-green-600 mx-auto mb-1" />
                      <p className="font-semibold text-green-900">{story.metadata.placesCount}</p>
                      <p className="text-xs text-green-700">Places</p>
                    </div>
                    <div className="text-center p-2 bg-purple-50 rounded">
                      <Calendar className="w-5 h-5 text-purple-600 mx-auto mb-1" />
                      <p className="font-semibold text-purple-900">{story.metadata.eventsCount}</p>
                      <p className="text-xs text-purple-700">Events</p>
                    </div>
                    <div className="text-center p-2 bg-orange-50 rounded">
                      <Image className="w-5 h-5 text-orange-600 mx-auto mb-1" />
                      <p className="font-semibold text-orange-900">{story.metadata.mediaCount}</p>
                      <p className="text-xs text-orange-700">Media</p>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {story.chapters[0]?.content || 'No content available'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'templates' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Story Templates</h3>
              <button className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
                <Plus className="w-4 h-4" />
                Create Template
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {storyTemplates.map(template => (
                <div key={template.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-semibold text-gray-900">{template.name}</h4>
                      <p className="text-gray-600 text-sm">{template.description}</p>
                    </div>
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-600">
                      {template.category}
                    </span>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-1">Structure:</p>
                      <div className="flex flex-wrap gap-1">
                        {template.structure.map((item, index) => (
                          <span key={index} className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                            {item}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-1">Writing Prompts:</p>
                      <ul className="text-xs text-gray-600 space-y-1">
                        {template.prompts.slice(0, 3).map((prompt, index) => (
                          <li key={index} className="flex items-start gap-1">
                            <Lightbulb className="w-3 h-3 text-yellow-600 mt-0.5" />
                            {prompt}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="pt-3 border-t border-gray-200">
                      <p className="text-xs text-gray-500 italic">"{template.examples}"</p>
                    </div>

                    <div className="flex gap-2">
                      <button className="flex-1 px-3 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 text-sm">
                        Use Template
                      </button>
                      <button className="px-3 py-2 border border-gray-300 rounded hover:bg-gray-50 text-sm">
                        Preview
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">Story Generation Settings</h3>

            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">AI Preferences</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <div>
                    <p className="font-medium text-gray-900">Creativity Level</p>
                    <p className="text-sm text-gray-600">Balance between facts and creative storytelling</p>
                  </div>
                  <select className="px-3 py-2 border border-gray-300 rounded-lg">
                    <option>Balanced</option>
                    <option>More Factual</option>
                    <option>More Creative</option>
                  </select>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <div>
                    <p className="font-medium text-gray-900">Detail Level</p>
                    <p className="text-sm text-gray-600">Amount of detail in generated stories</p>
                  </div>
                  <select className="px-3 py-2 border border-gray-300 rounded-lg">
                    <option>Standard</option>
                    <option>Detailed</option>
                    <option>Concise</option>
                  </select>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <div>
                    <p className="font-medium text-gray-900">Voice Style</p>
                    <p className="text-sm text-gray-600">Narrative voice for the story</p>
                  </div>
                  <select className="px-3 py-2 border border-gray-300 rounded-lg">
                    <option>Third Person</option>
                    <option>First Person</option>
                    <option>Omniscient</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Content Settings</h4>
              <div className="space-y-3">
                <label className="flex items-center justify-between p-3 bg-gray-50 rounded cursor-pointer">
                  <div>
                    <p className="font-medium text-gray-900">Include Sensitive Information</p>
                    <p className="text-sm text-gray-600">Include private or sensitive family information</p>
                  </div>
                  <input type="checkbox" className="w-5 h-5 text-purple-600 rounded" />
                </label>
                <label className="flex items-center justify-between p-3 bg-gray-50 rounded cursor-pointer">
                  <div>
                    <p className="font-medium text-gray-900">Generate Dialogue</p>
                    <p className="text-sm text-gray-600">Include fictional dialogue in stories</p>
                  </div>
                  <input type="checkbox" defaultChecked className="w-5 h-5 text-purple-600 rounded" />
                </label>
                <label className="flex items-center justify-between p-3 bg-gray-50 rounded cursor-pointer">
                  <div>
                    <p className="font-medium text-gray-900">Emotional Depth</p>
                    <p className="text-sm text-gray-600">Include emotional and psychological insights</p>
                  </div>
                  <input type="checkbox" defaultChecked className="w-5 h-5 text-purple-600 rounded" />
                </label>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Output Options</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <div>
                    <p className="font-medium text-gray-900">Default Export Format</p>
                    <p className="text-sm text-gray-600">Preferred format for story exports</p>
                  </div>
                  <select className="px-3 py-2 border border-gray-300 rounded-lg">
                    <option>PDF</option>
                    <option>Word Document</option>
                    <option>HTML</option>
                    <option>Plain Text</option>
                  </select>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <div>
                    <p className="font-medium text-gray-900">Chapter Breaks</p>
                    <p className="text-sm text-gray-600">How to structure story chapters</p>
                  </div>
                  <select className="px-3 py-2 border border-gray-300 rounded-lg">
                    <option>Automatic</option>
                    <option>By Time Period</option>
                    <option>By Life Events</option>
                    <option>Custom</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Story Reader Modal */}
      {currentStory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{currentStory.title}</h2>
                  <p className="text-gray-600">{currentStory.subtitle}</p>
                </div>
                <button
                  onClick={() => setCurrentStory(null)}
                  className="p-2 hover:bg-gray-100 rounded"
                >
                  ×
                </button>
              </div>

              <div className="flex items-center gap-4 mb-6 text-sm text-gray-600">
                <span className="flex items-center gap-1">
                  <FileText className="w-4 h-4" />
                  {currentStory.metadata.totalWords.toLocaleString()} words
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {currentStory.metadata.readTime} min read
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {new Date(currentStory.metadata.generatedAt).toLocaleDateString()}
                </span>
              </div>

              <div className="space-y-6">
                {currentStory.chapters.map((chapter, index) => (
                  <div key={chapter.id} className="border-b border-gray-200 pb-6 last:border-b-0">
                    <h3 className="text-xl font-semibold text-gray-900 mb-3">
                      Chapter {index + 1}: {chapter.title}
                    </h3>
                    <div className="prose prose-lg max-w-none">
                      <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                        {chapter.content}
                      </p>
                    </div>
                    
                    {chapter.media.length > 0 && (
                      <div className="mt-4">
                        <h4 className="text-sm font-medium text-gray-900 mb-2">Related Media</h4>
                        <div className="flex gap-2">
                          {chapter.media.map((media, mediaIndex) => (
                            <div key={mediaIndex} className="w-20 h-20 bg-gray-200 rounded flex items-center justify-center">
                              <Image className="w-8 h-8 text-gray-400" />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex gap-2 mt-6 pt-6 border-t">
                <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                  <Download className="w-4 h-4" />
                  Download
                </button>
                <button className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700">
                  <Share2 className="w-4 h-4" />
                  Share
                </button>
                <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded hover:bg-gray-50">
                  <RotateCcw className="w-4 h-4" />
                  Regenerate
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
