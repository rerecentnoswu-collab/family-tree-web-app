import { useMemo } from 'react';
import { Node, Edge, MarkerType } from 'reactflow';
import { Person } from '../../types/Person';
import { 
  getAllCouples, 
  getRelationshipIndicator, 
  getAnniversaryInfo
} from '../../utils/relationshipUtils';

interface NodeData {
  person: Person;
  onPersonClick?: (person: Person) => void;
  anniversaryInfo?: any;
}

export const useFamilyTreeData = (
  persons: Person[], 
  onPersonClick?: (person: Person) => void,
  showRelationshipLabels: boolean = true,
  showAnniversaries: boolean = true
) => {
  const couples = useMemo(() => getAllCouples(persons), [persons]);

  const generatedNodes = useMemo(() => {
    const nodes: Node<NodeData>[] = [];
    
    // Group persons by estimated generation based on birth year
    const groupedByGeneration = persons.reduce((acc, person) => {
      let generation = 1;
      if (person.birthday) {
        const birthYear = new Date(person.birthday).getFullYear();
        const currentYear = new Date().getFullYear();
        const age = currentYear - birthYear;
        // Estimate generation based on age
        if (age > 60) generation = 1;
        else if (age > 35) generation = 2;
        else if (age > 15) generation = 3;
        else generation = 4;
      }
      
      if (!acc[generation]) acc[generation] = [];
      acc[generation].push(person);
      return acc;
    }, {} as Record<number, Person[]>);

    // Create nodes for each person
    Object.entries(groupedByGeneration).forEach(([generation, genPersons]) => {
      genPersons.forEach((person, index) => {
        const anniversaryInfo = showAnniversaries ? getAnniversaryInfo(person) : undefined;
        
        nodes.push({
          id: person.id,
          type: 'person',
          position: {
            x: 150 + index * 250, // Horizontal spacing
            y: 100 + (parseInt(generation) - 1) * 200 // Vertical spacing by generation
          },
          data: {
            person,
            onPersonClick,
            anniversaryInfo
          }
        });
      });
    });

    return nodes;
  }, [persons, onPersonClick, showAnniversaries]);

  const generatedEdges = useMemo(() => {
    const edges: Edge[] = [];

    // Create parent-child relationships
    persons.forEach(person => {
      if (person.motherId) {
        edges.push({
          id: `${person.motherId}-${person.id}`,
          source: person.motherId,
          target: person.id,
          type: 'smoothstep',
          animated: false,
          style: { stroke: '#94a3b8', strokeWidth: 2 },
          markerEnd: { type: MarkerType.ArrowClosed, color: '#94a3b8' }
        });
      }
      
      if (person.fatherId) {
        edges.push({
          id: `${person.fatherId}-${person.id}`,
          source: person.fatherId,
          target: person.id,
          type: 'smoothstep',
          animated: false,
          style: { stroke: '#94a3b8', strokeWidth: 2 },
          markerEnd: { type: MarkerType.ArrowClosed, color: '#94a3b8' }
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
        relationshipLabel += ` \u2022 ${couple.children.length} children`;
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

    return edges;
  }, [persons, couples, showRelationshipLabels]);

  return { nodes: generatedNodes, edges: generatedEdges };
};
