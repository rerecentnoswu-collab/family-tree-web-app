import { memo, useState, useEffect, useRef, useCallback } from 'react';
import { Person } from '../../types/Person';
import { MobilePersonNode } from './MobilePersonNode';

interface MobileVirtualizedFamilyTreeProps {
  persons: Person[];
  onPersonClick?: (person: Person) => void;
  itemHeight?: number;
  containerHeight?: number;
  onLoadMore?: () => void;
  hasMore?: boolean;
  loading?: boolean;
}

// Virtual scrolling component for mobile performance
export const MobileVirtualizedFamilyTree = memo<MobileVirtualizedFamilyTreeProps>(({
  persons,
  onPersonClick,
  itemHeight = 120,
  containerHeight = 400,
  onLoadMore,
  hasMore = false,
  loading = false
}) => {
  const [scrollTop, setScrollTop] = useState(0);
  const [containerSize, setContainerSize] = useState({ width: 0, height: containerHeight });
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollElementRef = useRef<HTMLDivElement>(null);

  // Calculate visible range
  const visibleRange = useCallback(() => {
    const startIndex = Math.floor(scrollTop / itemHeight);
    const endIndex = Math.min(
      startIndex + Math.ceil(containerSize.height / itemHeight) + 2, // Buffer for smooth scrolling
      persons.length
    );
    return { startIndex, endIndex };
  }, [scrollTop, itemHeight, containerSize.height, persons.length]);

  // Handle scroll events with throttling for mobile
  const handleScroll = useCallback(() => {
    if (!scrollElementRef.current) return;
    
    const newScrollTop = scrollElementRef.current.scrollTop;
    setScrollTop(newScrollTop);

    // Load more when approaching bottom
    if (hasMore && !loading) {
      const scrollPercentage = newScrollTop / (scrollElementRef.current.scrollHeight - containerSize.height);
      if (scrollPercentage > 0.8) {
        onLoadMore?.();
      }
    }
  }, [hasMore, loading, onLoadMore, containerSize.height]);

  // Update container size
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setContainerSize({ width: rect.width, height: rect.height });
      }
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // Add scroll listener with passive events for mobile performance
  useEffect(() => {
    const scrollElement = scrollElementRef.current;
    if (!scrollElement) return;

    // Use passive event listeners for better mobile performance
    scrollElement.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      scrollElement.removeEventListener('scroll', handleScroll);
    };
  }, [handleScroll]);

  const { startIndex, endIndex } = visibleRange();
  const visiblePersons = persons.slice(startIndex, endIndex);

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-full overflow-hidden"
      style={{ height: containerSize.height }}
    >
      <div
        ref={scrollElementRef}
        className="overflow-y-auto overflow-x-hidden w-full h-full"
        style={{ 
          WebkitOverflowScrolling: 'touch', // Smooth scrolling on iOS
          scrollBehavior: 'smooth'
        }}
      >
        {/* Spacer for virtual scrolling */}
        <div 
          style={{ 
            height: `${persons.length * itemHeight}px`,
            position: 'relative'
          }}
        >
          {/* Visible items */}
          {visiblePersons.map((person, index) => (
            <div
              key={person.id}
              className="absolute left-0 right-0 flex items-center justify-center p-2"
              style={{
                top: `${(startIndex + index) * itemHeight}px`,
                height: `${itemHeight}px`,
                transform: 'translateZ(0)', // Hardware acceleration
                willChange: 'transform' // Optimize for animations
              }}
            >
              <div className="w-full max-w-sm">
                <MobilePersonNode
                  data={{
                    person,
                    onPersonClick,
                    isMobile: true
                  }}
                />
              </div>
            </div>
          ))}
          
          {/* Loading indicator */}
          {loading && (
            <div
              className="absolute left-0 right-0 flex items-center justify-center p-4"
              style={{
                top: `${persons.length * itemHeight}px`
              }}
            >
              <div className="text-gray-500 text-sm">Loading more...</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

MobileVirtualizedFamilyTree.displayName = 'MobileVirtualizedFamilyTree';
