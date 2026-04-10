import { useState, useEffect, useCallback, useMemo } from 'react';
import { Person } from '../../types/Person';
import { MobilePersonNode } from '../family-tree/MobilePersonNode';
import { MobileVirtualizedFamilyTree } from '../family-tree/MobileVirtualizedFamilyTree';

interface MobileOptimizedFamilyTreeProps {
  persons: Person[];
  onPersonClick?: (person: Person) => void;
  onLoadMore?: () => void;
  hasMore?: boolean;
  loading?: boolean;
  className?: string;
}

export const MobileOptimizedFamilyTree: React.FC<MobileOptimizedFamilyTreeProps> = ({
  persons,
  onPersonClick,
  onLoadMore,
  hasMore = false,
  loading = false,
  className = ''
}) => {
  const [viewMode, setViewMode] = useState<'tree' | 'list'>('tree');
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredPersons, setFilteredPersons] = useState<Person[]>([]);

  // Filter persons for mobile search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredPersons(persons);
    } else {
      const filtered = persons.filter(person =>
        `${person.firstName} ${person.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
        person.birthplace?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredPersons(filtered);
    }
  }, [persons, searchQuery]);

  // Memoized render functions for performance
  const renderTreeMode = useMemo(() => (
    <div className="w-full h-full">
      <MobileVirtualizedFamilyTree
        persons={filteredPersons}
        onPersonClick={onPersonClick}
        onLoadMore={onLoadMore}
        hasMore={hasMore}
        loading={loading}
        itemHeight={120}
        containerHeight={400}
      />
    </div>
  ), [filteredPersons, onPersonClick, onLoadMore, hasMore, loading]);

  const renderListMode = useMemo(() => (
    <div className="space-y-2 max-h-96 overflow-y-auto">
      {filteredPersons.map((person) => (
        <div
          key={person.id}
          className="bg-white rounded-lg shadow-md p-3 cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => onPersonClick?.(person)}
        >
          <MobilePersonNode
            data={{
              person,
              onPersonClick,
              isMobile: true
            }}
          />
        </div>
      ))}
      {loading && (
        <div className="text-center py-4">
          <div className="text-gray-500 text-sm">Loading more...</div>
        </div>
      )}
    </div>
  ), [filteredPersons, onPersonClick, loading]);

  return (
    <div className={`mobile-family-tree ${className}`}>
      {/* Mobile Header with Controls */}
      <div className="sticky top-0 bg-white border-b border-gray-200 p-4 z-10">
        {/* Search Bar */}
        <div className="mb-4">
          <input
            type="text"
            placeholder="Search family members..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* View Mode Toggle */}
        <div className="flex justify-center space-x-2">
          <button
            onClick={() => setViewMode('tree')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              viewMode === 'tree'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Tree View
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              viewMode === 'list'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            List View
          </button>
        </div>

        {/* Stats */}
        <div className="mt-3 text-center text-sm text-gray-600">
          {filteredPersons.length} of {persons.length} members
          {hasMore && ' (more available)'}
        </div>
      </div>

      {/* Content Area */}
      <div className="p-4">
        {viewMode === 'tree' ? renderTreeMode : renderListMode}
      </div>

      {/* Mobile Optimizations */}
      <style jsx>{`
        .mobile-family-tree {
          /* Optimize for touch interactions */
          -webkit-tap-highlight-color: transparent;
          -webkit-touch-callout: none;
          -webkit-user-select: none;
          user-select: none;
        }

        .mobile-family-tree * {
          /* Hardware acceleration */
          transform: translateZ(0);
          -webkit-transform: translateZ(0);
        }

        /* Smooth scrolling */
        .mobile-family-tree .overflow-y-auto {
          -webkit-overflow-scrolling: touch;
          scroll-behavior: smooth;
        }

        /* Optimize images and media */
        .mobile-family-tree img {
          max-width: 100%;
          height: auto;
        }

        /* Reduce motion for accessibility */
        @media (prefers-reduced-motion: reduce) {
          .mobile-family-tree * {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
          }
        }
      `}</style>
    </div>
  );
};
