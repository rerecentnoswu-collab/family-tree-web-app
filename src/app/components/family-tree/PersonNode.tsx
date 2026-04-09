import { memo } from 'react';
import {
  Handle,
  Position,
  NodeProps,
} from 'reactflow';
import { Person } from '../../types/Person';
import { Heart, Users, Calendar, MapPin, Clock, Sparkles } from 'lucide-react';

interface NodeData {
  person: Person;
  onPersonClick?: (person: Person) => void;
  anniversaryInfo?: any;
}

export const PersonNode = memo(({ data }: NodeProps<NodeData>) => {
  const { person, onPersonClick, anniversaryInfo } = data;
  const age = person.birthday ? new Date().getFullYear() - new Date(person.birthday).getFullYear() : null;

  const getGenderColor = (gender?: string) => {
    switch (gender?.toLowerCase()) {
      case 'male': return 'from-blue-500 to-blue-600';
      case 'female': return 'from-pink-500 to-pink-600';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  const getMarriageIcon = (status?: string) => {
    switch (status) {
      case 'married': return <Heart className="w-3 h-3" />;
      case 'engaged': return <Sparkles className="w-3 h-3" />;
      default: return null;
    }
  };

  return (
    <div 
      className={`bg-gradient-to-br ${getGenderColor(person.gender)} text-white rounded-xl shadow-lg p-4 cursor-pointer hover:shadow-xl transition-all duration-200 hover:scale-105 min-w-[200px]`}
      onClick={() => onPersonClick?.(person)}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 bg-white border-2 border-gray-400"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 bg-white border-2 border-gray-400"
      />
      
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <h3 className="font-bold text-lg leading-tight">
            {person.firstName} {person.lastName}
          </h3>
          {person.middleName && (
            <span className="text-sm opacity-80">{person.middleName}</span>
          )}
        </div>
        {getMarriageIcon(person.marriageStatus)}
      </div>

      <div className="space-y-1 text-sm">
        {age && (
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3 opacity-70" />
            <span>{age} years old</span>
          </div>
        )}
        
        {person.birthday && (
          <div className="flex items-center gap-1">
            <Calendar className="w-3 h-3 opacity-70" />
            <span>{new Date(person.birthday).toLocaleDateString()}</span>
          </div>
        )}
        
        {person.birthplace && (
          <div className="flex items-center gap-1">
            <MapPin className="w-3 h-3 opacity-70" />
            <span className="truncate">{person.birthplace}</span>
          </div>
        )}
        
        {person.occupation && (
          <div className="text-xs opacity-80 mt-1">
            {person.occupation}
          </div>
        )}
      </div>

      {anniversaryInfo && (
        <div className="mt-2 pt-2 border-t border-white/20">
          <div className="flex items-center gap-1 text-xs">
            <Heart className="w-3 h-3" />
            <span>{anniversaryInfo.type}: {anniversaryInfo.date}</span>
          </div>
        </div>
      )}

      {person.spouse_ids && person.spouse_ids.length > 0 && (
        <div className="mt-2 pt-2 border-t border-white/20">
          <div className="flex items-center gap-1 text-xs">
            <Users className="w-3 h-3" />
            <span>{person.spouse_ids.length} spouse(s)</span>
          </div>
        </div>
      )}
    </div>
  );
});

PersonNode.displayName = 'PersonNode';
