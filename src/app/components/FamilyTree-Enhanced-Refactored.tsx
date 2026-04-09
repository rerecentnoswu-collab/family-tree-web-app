import React from 'react';
import ReactFlow, {
  Controls,
  Background,
  useNodesState,
  useEdgesState,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Person } from '../types/Person';
import { FamilyTreeSkeleton } from './ui/SkeletonLoader';
import { PersonNode } from './family-tree/PersonNode';
import { FamilyTreeLegend } from './family-tree/FamilyTreeLegend';
import { useFamilyTreeData } from './family-tree/FamilyTreeUtils';

interface FamilyTreeProps {
  persons: Person[];
  onPersonClick?: (person: Person) => void;
  showRelationshipLabels?: boolean;
  showAnniversaries?: boolean;
}

export function FamilyTreeEnhanced({ 
  persons, 
  onPersonClick, 
  showRelationshipLabels = true,
  showAnniversaries = true 
}: FamilyTreeProps) {
  console.log('FamilyTreeEnhanced - Persons data:', persons);

  const { nodes: generatedNodes, edges: generatedEdges } = useFamilyTreeData(
    persons, 
    onPersonClick, 
    showRelationshipLabels, 
    showAnniversaries
  );

  const [nodes, _setNodes, onNodesChange] = useNodesState(generatedNodes);
  const [edges, _setEdges, onEdgesChange] = useEdgesState(generatedEdges);

  // Node types registration
  const nodeTypes = React.useMemo(() => ({
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
      {persons.length > 0 && <FamilyTreeLegend />}
    </div>
  );
}
