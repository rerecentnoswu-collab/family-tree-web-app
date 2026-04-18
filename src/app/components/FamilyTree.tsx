import { useMemo } from 'react';
import { Person } from '../types/Person';
import { FamilyTreeSkeleton } from './ui/SkeletonLoader';
import { FamilyTreeLegend } from './family-tree/FamilyTreeLegend';

interface FamilyTreeProps {
  persons: Person[];
  crossAccountFamilyMembers?: any[];
  onPersonClick?: (person: Person) => void;
}

interface TreeNode {
  person: Person;
  children: TreeNode[];
  level: number;
}

export function FamilyTree({ persons, onPersonClick, crossAccountFamilyMembers }: FamilyTreeProps) {
  // Combine current user's persons with cross-account family members and remove duplicates
  const allPersons = useMemo(() => {
    const combinedPersons = [...persons];
    if (crossAccountFamilyMembers && crossAccountFamilyMembers.length > 0) {
      // Add cross-account family members to list
      const crossAccountPersons = crossAccountFamilyMembers.map(member => member.person);
      combinedPersons.push(...crossAccountPersons);
      console.log(`Adding ${crossAccountPersons.length} cross-account family members to tree`);
    }
    
    // Remove duplicates based on person name (for cross-account scenarios)
    const seen = new Set<string>();
    const duplicates: string[] = [];
    
    const filteredPersons = combinedPersons.filter(person => {
      const personKey = `${person.firstName?.toLowerCase()}|${person.lastName?.toLowerCase()}`;
      if (seen.has(personKey)) {
        duplicates.push(`${person.firstName} ${person.lastName} (ID: ${person.id})`);
        return false;
      }
      seen.add(personKey);
      return true;
    });
    
    if (duplicates.length > 0) {
      console.log('Removing duplicates by name:', duplicates);
    }
    
    return filteredPersons;
  }, [persons, crossAccountFamilyMembers]);

  // Build hierarchical tree structure
  const treeData = useMemo(() => {
    const personMap = new Map<string, TreeNode>();
    const rootNodes: TreeNode[] = [];

    // Create tree nodes for all unique persons
    allPersons.forEach(person => {
      personMap.set(person.id, {
        person,
        children: [],
        level: 0
      });
    });

    // Build parent-child relationships and group siblings by same parents
    allPersons.forEach(person => {
      const node = personMap.get(person.id);
      if (!node) return;

      // Find parent nodes and add this person as child
      if (person.fatherId) {
        const fatherNode = personMap.get(person.fatherId);
        if (fatherNode) {
          fatherNode.children.push(node);
          node.level = fatherNode.level + 1;
        }
      }

      if (person.motherId) {
        const motherNode = personMap.get(person.motherId);
        if (motherNode) {
          motherNode.children.push(node);
          node.level = Math.max(node.level, motherNode.level + 1);
        }
      }
    });

    // Group siblings by shared parents
    const parentGroups = new Map<string, TreeNode[]>();

    allPersons.forEach(person => {
      const parentKey = [person.fatherId, person.motherId].filter(Boolean).sort().join('-');
      if (!parentGroups.has(parentKey)) {
        parentGroups.set(parentKey, []);
      }
      const node = personMap.get(person.id);
      if (node) {
        parentGroups.get(parentKey)!.push(node);
      }
    });

    // Log family groups for debugging
    console.log('Family groups by parents:');
    parentGroups.forEach((siblings, parentKey) => {
      console.log(`Parents ${parentKey}: ${siblings.length} children`);
      siblings.forEach(sibling => {
        console.log(`  - ${sibling.person.firstName} ${sibling.person.lastName}`);
      });
    });

    // Find root nodes (no parents) and build tree from parent groups
    parentGroups.forEach((siblings, parentKey) => {
      // Check if any of these siblings have parents
      const hasParents = siblings.some(sibling => 
        sibling.person.fatherId || sibling.person.motherId
      );
      
      if (!hasParents) {
        // These are root nodes, add them to rootNodes
        siblings.forEach(sibling => {
          if (!rootNodes.includes(sibling)) {
            rootNodes.push(sibling);
          }
        });
      }
    });

    return rootNodes;
  }, [allPersons]);

  const renderTreeNode = (node: TreeNode) => {
    const age = node.person.birthday 
      ? new Date().getFullYear() - new Date(node.person.birthday).getFullYear()
      : null;

    return (
      <div key={node.person.id} className="flex flex-col items-center">
        {/* Connection line to parent */}
        {node.level > 0 && (
          <div className="w-0.5 h-6 bg-blue-200 mb-2"></div>
        )}
        
        {/* Person node */}
        <div 
          onClick={() => onPersonClick?.(node.person)}
          className="bg-white rounded-lg shadow-md p-3 border border-gray-200 hover:shadow-lg transition-all cursor-pointer min-w-40 text-center"
          style={{ marginLeft: `${node.level * 24}px` }}
        >
          {/* Avatar */}
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-lg mx-auto mb-2">
            {node.person.firstName.charAt(0)}{node.person.lastName.charAt(0)}
          </div>
          
          {/* Person info */}
          <div>
            <h3 className="font-semibold text-gray-900 text-sm">
              {node.person.firstName} {node.person.lastName}
            </h3>
            {age !== null && (
              <p className="text-xs text-gray-500 mb-1">
                {age} years
              </p>
            )}
          </div>
        </div>
        
        {/* Children */}
        {node.children.length > 0 && (
          <div className="flex flex-wrap justify-center gap-2 mt-3">
            {node.children.map((child) => renderTreeNode(child))}
          </div>
        )}
      </div>
    );
  };

  if (allPersons.length === 0) {
    return <FamilyTreeSkeleton />;
  }

  return (
    <div className="w-full h-full bg-gradient-to-br from-blue-50 to-indigo-50 p-6 overflow-auto">
      {/* Family Tree Header */}
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Family Tree</h1>
        <p className="text-gray-600 text-sm">{allPersons.length} family members</p>
      </div>

      {/* Family Tree Visualization */}
      <div className="flex justify-center">
        <div className="inline-block">
          {treeData.map((rootNode) => renderTreeNode(rootNode))}
        </div>
      </div>

      {/* Legend */}
      <FamilyTreeLegend />
    </div>
  );
}
