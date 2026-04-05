import React, { useCallback, useMemo, memo } from 'react';
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

interface FamilyTreeProps {
  persons: Person[];
  onPersonClick?: (person: Person) => void;
}

interface NodeData {
  person: Person;
  onPersonClick?: (person: Person) => void;
}

// Custom node component for better visualization
const PersonNode = memo(({ data }: NodeProps<NodeData>) => {
  const { person, onPersonClick } = data;
  const age = person.birthday ? new Date().getFullYear() - new Date(person.birthday).getFullYear() : null;

  const genderColors = {
    male: { bg: '#3B82F6', border: '#2563EB' },
    female: { bg: '#EC4899', border: '#DB2777' },
    other: { bg: '#8B5CF6', border: '#7C3AED' }
  };

  const colors = genderColors[person.gender as keyof typeof genderColors] || genderColors.other;

  return (
    <div
      className="px-4 py-3 rounded-lg shadow-lg cursor-pointer transition-transform hover:scale-105 min-w-[180px]"
      style={{
        background: colors.bg,
        borderWidth: '2px',
        borderStyle: 'solid',
        borderColor: colors.border
      }}
      onClick={() => onPersonClick?.(person)}
    >
      <Handle type="target" position={Position.Top} />
      <div className="text-white">
        <div className="font-bold text-sm">
          {person.firstName} {person.lastName}
        </div>
        <div className="text-xs opacity-90 mt-1">
          Age: {age}
        </div>
        <div className="text-xs opacity-75 mt-0.5 truncate">
          {person.birthplace}
        </div>
      </div>
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
});

PersonNode.displayName = 'PersonNode';

// Define custom node types outside component to prevent recreation - React Flow best practice
const nodeTypes = {
  personNode: PersonNode
};

export function FamilyTree({ persons, onPersonClick }: FamilyTreeProps) {
  // Build the tree structure using proper genealogy algorithm
  const { nodes: initialNodes, edges: initialEdges } = useMemo(() => {
    const nodes: Node<NodeData>[] = [];
    const edges: Edge[] = [];

    if (persons.length === 0) {
      return { nodes, edges };
    }

    // Create family structures
    interface Family {
      parents: Person[];
      children: Person[];
    }

    const personMap = new Map(persons.map(p => [p.id, p]));
    const childrenByParents = new Map<string, Person[]>();
    const familyGroups = new Map<string, Family>();

    // Group children by their parent pairs
    persons.forEach(person => {
      if (person.motherId || person.fatherId) {
        // Create a unique key for parent pair
        const parentKey = [person.motherId, person.fatherId]
          .filter(Boolean)
          .sort()
          .join('-') || 'no-parents';

        if (!childrenByParents.has(parentKey)) {
          childrenByParents.set(parentKey, []);
        }
        childrenByParents.get(parentKey)!.push(person);
      }
    });

    // Find root persons (ancestors with no parents)
    const rootPersons = persons.filter(p => !p.motherId && !p.fatherId);

    // Layout configuration
    const GENERATION_HEIGHT = 180;
    const NODE_HORIZONTAL_SPACING = 250;
    const SIBLING_SPACING = 220;

    const visited = new Set<string>();

    // Helper function to create a node
    const createNode = (person: Person, x: number, y: number): Node<NodeData> => {
      return {
        id: person.id,
        type: 'personNode',
        position: { x, y },
        data: {
          person,
          onPersonClick
        }
      };
    };

    // BFS with improved layout for genealogy
    interface QueueItem {
      person: Person;
      generation: number;
      xOffset: number;
    }

    const queue: QueueItem[] = [];

    // Start with root persons
    rootPersons.forEach((person, index) => {
      queue.push({
        person,
        generation: 0,
        xOffset: index * NODE_HORIZONTAL_SPACING
      });
    });

    // Process the tree level by level
    while (queue.length > 0) {
      const { person, generation, xOffset } = queue.shift()!;

      if (visited.has(person.id)) continue;
      visited.add(person.id);

      const x = xOffset;
      const y = generation * GENERATION_HEIGHT;

      // Create node for this person
      nodes.push(createNode(person, x, y));

      // Find children of this person
      const children: Person[] = [];
      persons.forEach(p => {
        if (p.motherId === person.id || p.fatherId === person.id) {
          if (!visited.has(p.id)) {
            children.push(p);
          }
        }
      });

      // Remove duplicates (children already queued)
      const uniqueChildren = children.filter((child, index, self) =>
        index === self.findIndex(c => c.id === child.id)
      );

      // Position children
      uniqueChildren.forEach((child, index) => {
        const totalWidth = (uniqueChildren.length - 1) * SIBLING_SPACING;
        const startX = xOffset - totalWidth / 2;
        const childX = startX + index * SIBLING_SPACING;

        queue.push({
          person: child,
          generation: generation + 1,
          xOffset: childX
        });

        // Create edge from parent to child
        edges.push({
          id: `${person.id}-${child.id}`,
          source: person.id,
          target: child.id,
          type: 'smoothstep',
          animated: false,
          style: {
            stroke: '#94A3B8',
            strokeWidth: 2
          },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: '#94A3B8'
          }
        });
      });

      // If this person has a spouse (co-parent), create a marriage edge
      const spouse = persons.find(p => {
        // Find someone who shares children with this person
        const hasSharedChild = persons.some(child =>
          (child.motherId === person.id && child.fatherId === p.id) ||
          (child.fatherId === person.id && child.motherId === p.id)
        );
        return hasSharedChild && p.id !== person.id;
      });

      if (spouse && visited.has(spouse.id)) {
        const edgeId = [person.id, spouse.id].sort().join('-marriage-');
        const existingEdge = edges.find(e => e.id === edgeId);

        if (!existingEdge) {
          edges.push({
            id: edgeId,
            source: person.id,
            target: spouse.id,
            type: 'straight',
            animated: false,
            style: {
              stroke: '#F59E0B',
              strokeWidth: 3,
              strokeDasharray: '5,5'
            }
          });
        }
      }
    }

    return { nodes, edges };
  }, [persons, onPersonClick]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Update nodes and edges when persons change
  React.useEffect(() => {
    setNodes(initialNodes);
    setEdges(initialEdges);
  }, [initialNodes, initialEdges, setNodes, setEdges]);

  if (persons.length === 0) {
    return (
      <div className="h-full w-full flex items-center justify-center text-gray-500" style={{ minHeight: '400px' }}>
        <div className="text-center">
          <p className="text-lg font-medium">No family members yet</p>
          <p className="text-sm mt-2">Add family members to see the tree visualization</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="w-full" 
      style={{ 
        height: '600px', 
        width: '100%',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        fitView
        minZoom={0.1}
        maxZoom={2}
        attributionPosition="bottom-left"
        defaultEdgeOptions={{
          type: 'smoothstep',
          animated: false
        }}
        style={{ width: '100%', height: '100%' }}
      >
        <Background color="#e5e7eb" gap={16} />
        <Controls />
      </ReactFlow>
    </div>
  );
}
