import { useMemo, memo } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  MarkerType,
  Position,
  NodeProps,
  Handle
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Person } from '../types/Person';
import { 
  getAllCouples, 
  getRelationshipIndicator, 
  getAnniversaryInfo
} from '../utils/relationshipUtils';
import { FamilyTreeSkeleton } from './ui/SkeletonLoader';
import { 
  Heart, 
  Calendar
} from 'lucide-react';

interface FamilyTreeProps {
  persons: Person[];
  onPersonClick?: (person: Person) => void;
  showRelationshipLabels?: boolean;
  showAnniversaries?: boolean;
}

interface NodeData {
  person: Person;
  onPersonClick?: (person: Person) => void;
  anniversaryInfo?: any;
  relationshipStatus?: string;
}

// Enhanced node component with relationship indicators
const PersonNode = memo(({ data }: NodeProps<NodeData>) => {
  const { person, onPersonClick, anniversaryInfo, relationshipStatus } = data;
  const age = person.birthday ? new Date().getFullYear() - new Date(person.birthday).getFullYear() : null;

  const genderColors = {
    male: { bg: '#3B82F6', border: '#2563EB' },
    female: { bg: '#EC4899', border: '#DB2777' },
    other: { bg: '#8B5CF6', border: '#7C3AED' }
  };

  const colors = genderColors[person.gender as keyof typeof genderColors] || genderColors.other;

  // Get relationship indicator styling
  const relationshipIndicator = relationshipStatus ? getRelationshipIndicator(relationshipStatus) : null;

  return (
    <div className="relative">
      {/* Anniversary Badge */}
      {anniversaryInfo?.isAnniversaryToday && (
        <div className="absolute -top-2 -right-2 z-10">
          <div className="bg-pink-500 text-white rounded-full p-1 animate-pulse">
            <Heart className="w-3 h-3" />
          </div>
        </div>
      )}

      {/* Relationship Status Badge */}
      {relationshipIndicator && (
        <div className="absolute -top-2 -left-2 z-10">
          <div 
            className="rounded-full p-1 text-xs"
            style={{ backgroundColor: relationshipIndicator.style.color }}
            title={relationshipIndicator.label}
          >
            <span className="text-white">{relationshipIndicator.icon}</span>
          </div>
        </div>
      )}

      {/* Main Node */}
      <div
        className="px-4 py-3 rounded-lg shadow-lg cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-xl min-w-[200px] relative"
        style={{
          background: colors.bg,
          borderWidth: '2px',
          borderStyle: 'solid',
          borderColor: colors.border
        }}
        onClick={() => onPersonClick?.(person)}
      >
        {/* Marriage Date Badge */}
        {person.marriageDate && (
          <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2">
            <div className="bg-orange-100 text-orange-700 text-xs px-2 py-1 rounded-full flex items-center gap-1">
              <Heart className="w-3 h-3" />
              {new Date(person.marriageDate).getFullYear()}
            </div>
          </div>
        )}

        {/* Person Info */}
        <div className="text-center">
          <div className="font-semibold text-white text-sm mb-1">
            {person.firstName} {person.middleName} {person.lastName}
          </div>
          
          {age && (
            <div className="text-white/80 text-xs mb-1">
              Age: {age}
            </div>
          )}

          {person.occupation && (
            <div className="text-white/70 text-xs mb-1">
              {person.occupation}
            </div>
          )}

          {/* Relationship Status */}
          {relationshipStatus && relationshipStatus !== 'single' && (
            <div 
              className="text-white text-xs px-2 py-1 rounded-full mt-1"
              style={{ backgroundColor: relationshipIndicator?.style.color + '40' }}
            >
              {relationshipIndicator?.label}
            </div>
          )}

          {/* Anniversary Countdown */}
          {anniversaryInfo && !anniversaryInfo.isAnniversaryToday && anniversaryInfo.daysUntilAnniversary !== undefined && anniversaryInfo.daysUntilAnniversary <= 30 && (
            <div className="text-pink-200 text-xs mt-1 flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {anniversaryInfo.daysUntilAnniversary} days
            </div>
          )}
        </div>

        {/* Handles for connections */}
        <Handle
          type="target"
          position={Position.Top}
          className="w-3 h-3 !bg-gray-400 !border-gray-600"
        />
        <Handle
          type="source"
          position={Position.Bottom}
          className="w-3 h-3 !bg-gray-400 !border-gray-600"
        />
        <Handle
          type="source"
          position={Position.Left}
          className="w-3 h-3 !bg-gray-400 !border-gray-600"
        />
        <Handle
          type="target"
          position={Position.Right}
          className="w-3 h-3 !bg-gray-400 !border-gray-600"
        />
      </div>
    </div>
  );
});

PersonNode.displayName = 'PersonNode';

export function FamilyTreeEnhanced({ 
  persons, 
  onPersonClick, 
  showRelationshipLabels = true,
  showAnniversaries = true 
}: FamilyTreeProps) {
  console.log('🌳 FamilyTreeEnhanced - Persons data:', persons);
  
  // Get all couples and their information
  const couples = useMemo(() => getAllCouples(persons), [persons]);

  // Generate nodes and edges with enhanced relationship information
  const { nodes: generatedNodes, edges: generatedEdges } = useMemo(() => {
    const nodes: Node[] = [];
    const edges: Edge[] = [];
    const visited = new Set<string>();

    // Create nodes for all persons
    persons.forEach((person, index) => {
      const anniversaryInfo = showAnniversaries ? getAnniversaryInfo(person.marriageDate) : undefined;
      
      nodes.push({
        id: person.id,
        type: 'person',
        position: {
          x: (index % 4) * 250,
          y: Math.floor(index / 4) * 200
        },
        data: {
          person,
          onPersonClick,
          anniversaryInfo,
          relationshipStatus: person.marriageStatus
        } as NodeData
      });
      visited.add(person.id);
    });

    // Create parent-child edges (existing logic)
    persons.forEach(person => {
      if (person.motherId && visited.has(person.motherId)) {
        edges.push({
          id: `${person.motherId}-${person.id}-mother`,
          source: person.motherId,
          target: person.id,
          type: 'smoothstep',
          animated: false,
          style: {
            stroke: '#94A3B8',
            strokeWidth: 2
          },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: '#94A3B8'
          },
          label: 'Mother'
        });
      }

      if (person.fatherId && visited.has(person.fatherId)) {
        edges.push({
          id: `${person.fatherId}-${person.id}-father`,
          source: person.fatherId,
          target: person.id,
          type: 'smoothstep',
          animated: false,
          style: {
            stroke: '#94A3B8',
            strokeWidth: 2
          },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: '#94A3B8'
          },
          label: 'Father'
        });
      }
    });

    // Create enhanced relationship edges for couples
    couples.forEach(couple => {
      const relationshipIndicator = getRelationshipIndicator(couple.relationshipType, couple.verified);
      const edgeId = [couple.person1.id, couple.person2.id].sort().join('-relationship-');
      
      // Create relationship label
      let relationshipLabel = relationshipIndicator.label;
      if (couple.yearsTogether && couple.yearsTogether > 0) {
        relationshipLabel += ` (${Math.floor(couple.yearsTogether)}y)`;
      }
      if (couple.children && couple.children.length > 0) {
        relationshipLabel += ` • ${couple.children.length} children`;
      }

      edges.push({
        id: edgeId,
        source: couple.person1.id,
        target: couple.person2.id,
        type: 'straight',
        animated: couple.relationshipType === 'engaged',
        style: {
          stroke: relationshipIndicator.style.color,
          strokeWidth: relationshipIndicator.style.strokeWidth || 2,
          strokeDasharray: relationshipIndicator.style.strokeStyle === 'dashed' ? '5,5' :
                         relationshipIndicator.style.strokeStyle === 'dotted' ? '2,2' : undefined,
          opacity: relationshipIndicator.style.opacity || 1
        },
        label: showRelationshipLabels ? relationshipLabel : undefined,
        labelStyle: {
          fontSize: 12,
          fontWeight: 600,
          fill: relationshipIndicator.style.color,
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          borderRadius: 4,
          padding: 2
        },
        labelBgStyle: {
          fill: 'rgba(255, 255, 255, 0.9)',
          stroke: relationshipIndicator.style.color,
          strokeWidth: 1,
          rx: 4
        }
      });
    });

    return { nodes, edges };
  }, [persons, onPersonClick, couples, showRelationshipLabels, showAnniversaries]);

  const [nodes, , onNodesChange] = useNodesState(generatedNodes);
  const [edges, , onEdgesChange] = useEdgesState(generatedEdges);

  // Node types registration
  const nodeTypes = useMemo(() => ({
    person: PersonNode
  }), []);

  return (
    <div className="w-full h-full">
      {persons.length === 0 ? (
        <FamilyTreeSkeleton />
      ) : (
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypes}
          fitView
          attributionPosition="bottom-left"
        >
          <Background 
            color="#f1f5f9" 
            gap={20}
          />
          <Controls 
            showZoom={true}
            showFitView={true}
            showInteractive={false}
          />
        </ReactFlow>
      )}

      {/* Legend */}
      {persons.length > 0 && (
        <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg p-4 border border-gray-200">
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Heart className="w-4 h-4" />
            Relationship Types
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-8 h-0.5 bg-orange-500" style={{ borderTop: '2px solid #F59E0B' }}></div>
              <span className="text-gray-700">Married</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-0.5 bg-pink-500" style={{ borderTop: '2px dashed #EC4899' }}></div>
              <span className="text-gray-700">Engaged</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-0.5 bg-purple-500" style={{ borderTop: '2px dotted #8B5CF6' }}></div>
              <span className="text-gray-700">Partnered</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-0.5 bg-gray-500" style={{ borderTop: '1px dashed #6B7280' }}></div>
              <span className="text-gray-700">Divorced/Widowed</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
