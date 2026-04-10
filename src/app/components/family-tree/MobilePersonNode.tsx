import { memo, useMemo } from 'react';
import {
  Handle,
  Position,
  NodeProps,
} from 'reactflow';
import { Person } from '../../types/Person';
import { Heart, Calendar, MapPin, Clock } from 'lucide-react';

interface NodeData {
  person: Person;
  onPersonClick?: (person: Person) => void;
  anniversaryInfo?: any;
  isMobile?: boolean;
}

// Mobile-optimized PersonNode with reduced complexity and better performance
export const MobilePersonNode = memo(({ data }: NodeProps<NodeData>) => {
  const { person, onPersonClick, anniversaryInfo, isMobile = false } = data;
  
  // Memoize expensive calculations
  const age = useMemo(() => {
    return person.birthday ? new Date().getFullYear() - new Date(person.birthday).getFullYear() : null;
  }, [person.birthday]);

  const genderColor = useMemo(() => {
    switch (person.gender?.toLowerCase()) {
      case 'male': return 'from-blue-500 to-blue-600';
      case 'female': return 'from-pink-500 to-pink-600';
      default: return 'from-gray-500 to-gray-600';
    }
  }, [person.gender]);

  const marriageIcon = useMemo(() => {
    if (!person.spouse_ids?.length) return null;
    return <Heart className="w-3 h-3" />;
  }, [person.spouse_ids]);

  // Mobile-optimized styles
  const nodeClasses = useMemo(() => {
    const baseClasses = `bg-gradient-to-br ${genderColor} text-white rounded-lg shadow-lg cursor-pointer transition-all duration-200`;
    if (isMobile) {
      return `${baseClasses} p-3 hover:shadow-xl min-w-[160px] max-w-[180px]`;
    }
    return `${baseClasses} p-4 hover:shadow-xl hover:scale-105 min-w-[200px]`;
  }, [genderColor, isMobile]);

  const handlePersonClick = () => {
    // Debounce click for mobile to prevent double taps
    if (onPersonClick) {
      onPersonClick(person);
    }
  };

  return (
    <div 
      className={nodeClasses}
      onClick={handlePersonClick}
      role="button"
      tabIndex={0}
      aria-label={`${person.firstName} ${person.lastName}`}
    >
      {/* Handles for connections - simplified for mobile */}
      <Handle
        type="target"
        position={Position.Top}
        className="w-2 h-2 bg-white border-2 border-gray-400"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-2 h-2 bg-white border-2 border-gray-400"
      />

      {/* Person Information - optimized for mobile */}
      <div className="text-center">
        {/* Name */}
        <div className="font-bold text-sm mb-1 truncate">
          {person.firstName} {person.middleName && `${person.middleName[0].}.`} {person.lastName}
        </div>

        {/* Age and Birthday - only show on mobile if space allows */}
        {age && (
          <div className="flex items-center justify-center text-xs opacity-90 mb-1">
            <Calendar className="w-3 h-3 mr-1" />
            {age} years
          </div>
        )}

        {/* Location - simplified for mobile */}
        {person.birthplace && !isMobile && (
          <div className="flex items-center justify-center text-xs opacity-90 mb-1">
            <MapPin className="w-3 h-3 mr-1" />
            <span className="truncate">{person.birthplace}</span>
          </div>
        )}

        {/* Marriage Status */}
        {marriageIcon && (
          <div className="flex items-center justify-center text-xs opacity-90">
            {marriageIcon}
          </div>
        )}

        {/* Anniversary Info - only on desktop */}
        {anniversaryInfo && !isMobile && (
          <div className="flex items-center justify-center text-xs opacity-90 mt-1">
            <Clock className="w-3 h-3 mr-1" />
            {anniversaryInfo}
          </div>
        )}
      </div>
    </div>
  );
});

MobilePersonNode.displayName = 'MobilePersonNode';
