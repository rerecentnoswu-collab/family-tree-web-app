import { useMemo } from 'react';
import { Person } from '../types/Person';
import { FamilyTreeSkeleton } from './ui/SkeletonLoader';
import { FamilyTreeLegend } from './family-tree/FamilyTreeLegend';
import { getAllCouples } from '../utils/relationshipUtils';

interface FamilyTreeProps {
  persons: Person[];
  onPersonClick?: (person: Person) => void;
}

interface TreeNode {
  person: Person;
  children: TreeNode[];
  level: number;
  spouse?: Person;
  spouseConnection?: {
    type: string;
    yearsTogether?: number;
    verified: boolean;
  };
}

export function FamilyTree({ persons, onPersonClick }: FamilyTreeProps) {
  // Remove duplicates with improved logic
  const uniquePersons = useMemo(() => {
    const seen = new Map<string, Person>();
    const duplicates: Person[] = [];
    
    persons.forEach(person => {
      // Create a robust key for deduplication including ID if available
      const baseKey = `${person.firstName.trim().toLowerCase()}-${person.lastName.trim().toLowerCase()}-${person.birthday || ''}`;
      const key = person.id && !person.id.includes('undefined') && !person.id.includes('temp') 
        ? `${baseKey}-${person.id}` 
        : baseKey;
      
      if (seen.has(key)) {
        const existing = seen.get(key)!;
        duplicates.push(person);
        
        // Improved selection logic: prefer entry with complete data
        const existingScore = getPersonDataScore(existing);
        const newScore = getPersonDataScore(person);
        
        if (newScore > existingScore) {
          seen.set(key, person);
        }
      } else {
        seen.set(key, person);
      }
    });
    
    // Log duplicates for debugging
    if (duplicates.length > 0) {
      console.log(`Removed ${duplicates.length} duplicate entries:`, duplicates.map(d => `${d.firstName} ${d.lastName}`));
    }
    
    return Array.from(seen.values());
  }, [persons]);

  // Helper function to score person data completeness
  const getPersonDataScore = (person: Person): number => {
    let score = 0;
    if (person.id && !person.id.includes('undefined') && !person.id.includes('temp')) score += 3;
    if (person.firstName) score += 1;
    if (person.lastName) score += 1;
    if (person.birthday) score += 2;
    if (person.birthplace) score += 1;
    if (person.occupation) score += 1;
    if (person.gender) score += 1;
    if (person.motherId || person.fatherId) score += 2;
    if (person.spouse_ids && person.spouse_ids.length > 0) score += 1;
    return score;
  };

  // Get couples data for relationship connections
  const couples = useMemo(() => getAllCouples(uniquePersons), [uniquePersons]);

  // Build hierarchical tree structure with spouse connections
  const treeData = useMemo(() => {
    const personMap = new Map<string, TreeNode>();
    const rootNodes: TreeNode[] = [];
    const processedCouples = new Set<string>();
    const spousesToFilter = new Set<string>(); // Track spouses that should be filtered out

    // Create tree nodes for all unique persons
    uniquePersons.forEach(person => {
      personMap.set(person.id, {
        person,
        children: [],
        level: 0
      });
    });

    // Add spouse connections and mark spouses for filtering
    couples.forEach(couple => {
      const coupleKey = [couple.person1.id, couple.person2.id].sort().join('-');
      if (processedCouples.has(coupleKey)) return;
      processedCouples.add(coupleKey);

      const node1 = personMap.get(couple.person1.id);
      const node2 = personMap.get(couple.person2.id);
      
      if (node1 && node2) {
        // Add spouse connection to both nodes
        node1.spouse = couple.person2;
        node1.spouseConnection = {
          type: couple.relationshipType,
          yearsTogether: couple.yearsTogether,
          verified: couple.verified
        };
        
        node2.spouse = couple.person1;
        node2.spouseConnection = {
          type: couple.relationshipType,
          yearsTogether: couple.yearsTogether,
          verified: couple.verified
        };

        // Mark the second person in each couple for filtering
        // We'll keep the first person and render the second as their spouse
        spousesToFilter.add(couple.person2.id);
      }
    });

    // Build parent-child relationships
    uniquePersons.forEach(person => {
      const node = personMap.get(person.id);
      if (!node) return;

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

    // Find root nodes (no parents) but filter out spouses
    uniquePersons.forEach(person => {
      // Skip if this person is marked as a spouse to be filtered
      if (spousesToFilter.has(person.id)) return;
      
      const node = personMap.get(person.id);
      if (node && !person.fatherId && !person.motherId) {
        rootNodes.push(node);
      }
    });

    // Also filter children to avoid duplicates
    const filterChildren = (nodes: TreeNode[]): TreeNode[] => {
      return nodes.filter(child => !spousesToFilter.has(child.person.id))
        .map(child => ({
          ...child,
          children: filterChildren(child.children)
        }));
    };

    return rootNodes.map(node => ({
      ...node,
      children: filterChildren(node.children)
    }));
  }, [uniquePersons, couples]);

  const renderTreeNode = (node: TreeNode) => {
    const age = node.person.birthday 
      ? new Date().getFullYear() - new Date(node.person.birthday).getFullYear()
      : null;

    const hasSpouse = !!node.spouse;
    const spouseConnection = node.spouseConnection;

    // Get relationship styling
    const getRelationshipStyle = (type: string, verified: boolean) => {
      const baseOpacity = verified ? 1 : 0.7;
      switch (type) {
        case 'married':
          return { color: '#F59E0B', style: 'solid', width: 3, opacity: baseOpacity, icon: '❤️' };
        case 'engaged':
          return { color: '#EC4899', style: 'dashed', width: 2, opacity: baseOpacity, icon: '💍' };
        case 'partnered':
          return { color: '#8B5CF6', style: 'dotted', width: 2, opacity: baseOpacity, icon: '💜' };
        case 'divorced':
          return { color: '#6B7280', style: 'dashed', width: 1, opacity: 0.5, icon: '💔' };
        case 'widowed':
          return { color: '#6B7280', style: 'solid', width: 1, opacity: 0.5, icon: '⚫' };
        default:
          return { color: '#94A3B8', style: 'solid', width: 2, opacity: baseOpacity, icon: '🔗' };
      }
    };

    return (
      <div key={node.person.id} className="flex flex-col items-center">
        {/* Enhanced connection line to parent */}
        {node.level > 0 && (
          <div className="relative flex flex-col items-center">
            {/* Vertical line with gradient */}
            <div className="w-1 h-10 bg-gradient-to-b from-blue-400 to-blue-300 rounded-full shadow-sm"></div>
            {/* Connection node */}
            <div className="w-3 h-3 bg-blue-500 rounded-full border-2 border-white shadow-md -mt-1.5"></div>
          </div>
        )}
        
        {/* Couple connection and spouse node */}
        {hasSpouse && spouseConnection && (
          <div className="flex items-center gap-4 mb-4">
            {/* Main person node */}
            <div 
              onClick={() => onPersonClick?.(node.person)}
              className="bg-white rounded-xl shadow-lg p-4 border-2 border-gray-100 hover:shadow-xl hover:border-blue-200 transition-all duration-200 cursor-pointer min-w-48 text-center relative group transform hover:scale-105"
            >
              {/* Marriage status indicator */}
              <div className="absolute -top-2 -right-2 flex items-center justify-center w-6 h-6 rounded-full bg-gradient-to-br from-pink-500 to-rose-500 border-2 border-white shadow-md">
                <span className="text-white text-xs">
                  {getRelationshipStyle(spouseConnection.type, spouseConnection.verified).icon}
                </span>
              </div>
              
              {/* Enhanced avatar with gender color and animation */}
              <div className={`w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-lg mx-auto mb-3 shadow-lg transform transition-transform group-hover:scale-110 ${
                node.person.gender === 'female' 
                  ? 'bg-gradient-to-br from-pink-500 to-rose-600 ring-2 ring-pink-200' 
                  : 'bg-gradient-to-br from-blue-500 to-indigo-600 ring-2 ring-blue-200'
              }`}>
                {node.person.firstName.charAt(0)}{node.person.lastName.charAt(0)}
              </div>
              
              {/* Enhanced person info */}
              <div className="space-y-1">
                <h3 className="font-bold text-gray-900 text-base leading-tight">
                  {node.person.firstName} {node.person.lastName}
                </h3>
                {node.person.middleName && (
                  <p className="text-xs text-gray-500 italic">{node.person.middleName}</p>
                )}
                {age !== null && (
                  <div className="flex items-center justify-center gap-1 text-xs text-gray-600">
                    <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
                    <span>{age} years old</span>
                  </div>
                )}
                {node.person.occupation && (
                  <p className="text-xs text-gray-500 bg-gray-50 rounded px-2 py-1 inline-block mt-1">
                    {node.person.occupation}
                  </p>
                )}
              </div>

              {/* Enhanced hover indicator */}
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200 shadow-lg animate-pulse"></div>
            </div>

            {/* Relationship connection line */}
            <div className="relative flex items-center">
              <div 
                className={`h-1 rounded-full shadow-sm ${
                  spouseConnection.type === 'engaged' ? 'border-dashed' : 
                  spouseConnection.type === 'partnered' ? 'border-dotted' : ''
                }`}
                style={{
                  width: '60px',
                  backgroundColor: getRelationshipStyle(spouseConnection.type, spouseConnection.verified).color,
                  opacity: getRelationshipStyle(spouseConnection.type, spouseConnection.verified).opacity,
                  borderWidth: `${getRelationshipStyle(spouseConnection.type, spouseConnection.verified).width}px`,
                  borderStyle: getRelationshipStyle(spouseConnection.type, spouseConnection.verified).style === 'dashed' ? 'dashed' : 
                               getRelationshipStyle(spouseConnection.type, spouseConnection.verified).style === 'dotted' ? 'dotted' : 'solid'
                }}
              ></div>
              {/* Relationship label */}
              <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 bg-white px-2 py-1 rounded-full shadow-md border border-gray-200">
                <span className="text-xs font-medium" style={{ color: getRelationshipStyle(spouseConnection.type, spouseConnection.verified).color }}>
                  {spouseConnection.type.charAt(0).toUpperCase() + spouseConnection.type.slice(1)}
                  {spouseConnection.yearsTogether && ` ${Math.floor(spouseConnection.yearsTogether)}y`}
                </span>
              </div>
              {/* Heart icon in the middle */}
              <div className="absolute left-1/2 transform -translate-x-1/2 -top-2 w-4 h-4 bg-white rounded-full flex items-center justify-center shadow-md border border-gray-200">
                <span className="text-xs">{getRelationshipStyle(spouseConnection.type, spouseConnection.verified).icon}</span>
              </div>
            </div>

            {/* Spouse node */}
            <div 
              onClick={() => onPersonClick?.(node.spouse!)}
              className="bg-white rounded-xl shadow-lg p-4 border-2 border-gray-100 hover:shadow-xl hover:border-pink-200 transition-all duration-200 cursor-pointer min-w-48 text-center relative group transform hover:scale-105"
            >
              {/* Marriage status indicator */}
              <div className="absolute -top-2 -right-2 flex items-center justify-center w-6 h-6 rounded-full bg-gradient-to-br from-pink-500 to-rose-500 border-2 border-white shadow-md">
                <span className="text-white text-xs">
                  {getRelationshipStyle(spouseConnection.type, spouseConnection.verified).icon}
                </span>
              </div>
              
              {/* Enhanced avatar with gender color and animation */}
              <div className={`w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-lg mx-auto mb-3 shadow-lg transform transition-transform group-hover:scale-110 ${
                node.spouse!.gender === 'female' 
                  ? 'bg-gradient-to-br from-pink-500 to-rose-600 ring-2 ring-pink-200' 
                  : 'bg-gradient-to-br from-blue-500 to-indigo-600 ring-2 ring-blue-200'
              }`}>
                {node.spouse!.firstName.charAt(0)}{node.spouse!.lastName.charAt(0)}
              </div>
              
              {/* Enhanced person info */}
              <div className="space-y-1">
                <h3 className="font-bold text-gray-900 text-base leading-tight">
                  {node.spouse!.firstName} {node.spouse!.lastName}
                </h3>
                {node.spouse!.middleName && (
                  <p className="text-xs text-gray-500 italic">{node.spouse!.middleName}</p>
                )}
                {node.spouse!.birthday && (
                  <div className="flex items-center justify-center gap-1 text-xs text-gray-600">
                    <span className="w-2 h-2 bg-pink-400 rounded-full"></span>
                    <span>{new Date().getFullYear() - new Date(node.spouse!.birthday).getFullYear()} years old</span>
                  </div>
                )}
                {node.spouse!.occupation && (
                  <p className="text-xs text-gray-500 bg-gray-50 rounded px-2 py-1 inline-block mt-1">
                    {node.spouse!.occupation}
                  </p>
                )}
              </div>

              {/* Enhanced hover indicator */}
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-gradient-to-br from-pink-500 to-pink-600 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200 shadow-lg animate-pulse"></div>
            </div>
          </div>
        )}

        {/* Single person node (no spouse) */}
        {!hasSpouse && (
          <div 
            onClick={() => onPersonClick?.(node.person)}
            className="bg-white rounded-xl shadow-lg p-4 border-2 border-gray-100 hover:shadow-xl hover:border-blue-200 transition-all duration-200 cursor-pointer min-w-48 text-center relative group transform hover:scale-105"
            style={{ marginLeft: `${node.level * 40}px` }}
          >
            {/* Enhanced avatar with gender color and animation */}
            <div className={`w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-lg mx-auto mb-3 shadow-lg transform transition-transform group-hover:scale-110 ${
              node.person.gender === 'female' 
                ? 'bg-gradient-to-br from-pink-500 to-rose-600 ring-2 ring-pink-200' 
                : 'bg-gradient-to-br from-blue-500 to-indigo-600 ring-2 ring-blue-200'
            }`}>
              {node.person.firstName.charAt(0)}{node.person.lastName.charAt(0)}
            </div>
            
            {/* Enhanced person info */}
            <div className="space-y-1">
              <h3 className="font-bold text-gray-900 text-base leading-tight">
                {node.person.firstName} {node.person.lastName}
              </h3>
              {node.person.middleName && (
                <p className="text-xs text-gray-500 italic">{node.person.middleName}</p>
              )}
              {age !== null && (
                <div className="flex items-center justify-center gap-1 text-xs text-gray-600">
                  <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
                  <span>{age} years old</span>
                </div>
              )}
              {node.person.birthday && (
                <p className="text-xs text-gray-400">
                  {new Date(node.person.birthday).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </p>
              )}
              {/* Occupation if available */}
              {node.person.occupation && (
                <p className="text-xs text-gray-500 bg-gray-50 rounded px-2 py-1 inline-block mt-1">
                  {node.person.occupation}
                </p>
              )}
              {/* Birthplace if available */}
              {node.person.birthplace && (
                <p className="text-xs text-gray-400 flex items-center justify-center gap-1">
                  <span className="w-1.5 h-1.5 bg-green-400 rounded-full"></span>
                  {node.person.birthplace}
                </p>
              )}
            </div>

            {/* Enhanced hover indicator */}
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200 shadow-lg animate-pulse"></div>
          </div>
        )}
        
        {/* Enhanced children container with improved connections */}
        {node.children.length > 0 && (
          <div className="relative mt-6">
            {/* Enhanced horizontal line for multiple children */}
            {node.children.length > 1 && (
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 flex items-center">
                <div className="w-full h-1 bg-gradient-to-r from-transparent via-blue-400 to-transparent rounded-full shadow-sm"></div>
                <div className="absolute left-1/2 transform -translate-x-1/2 w-2 h-2 bg-blue-500 rounded-full border border-white shadow"></div>
              </div>
            )}
            {/* Single child connection */}
            {node.children.length === 1 && (
              <div className="w-0.5 h-6 bg-gradient-to-b from-blue-400 to-blue-300 rounded-full mx-auto"></div>
            )}
            
            <div className={`flex ${node.children.length > 1 ? 'justify-center gap-8' : 'justify-center'} mt-4`}>
              {node.children.map((child) => (
                <div key={child.person.id} className="relative">
                  {/* Child connection indicator */}
                  {node.children.length > 1 && (
                    <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 w-1.5 h-1.5 bg-blue-500 rounded-full border border-white shadow"></div>
                  )}
                  {renderTreeNode(child)}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  if (uniquePersons.length === 0) {
    return <FamilyTreeSkeleton />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4 md:p-6 lg:p-8 overflow-auto">
      {/* Enhanced Family Tree Header */}
      <div className="text-center mb-8 md:mb-12">
        <div className="inline-flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-lg">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <div className="text-left">
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Family Tree
            </h1>
            <p className="text-gray-600 text-sm md:text-base mt-1">
              {uniquePersons.length} family members • {couples.length} couples
            </p>
          </div>
        </div>
        
        {/* Statistics Bar */}
        <div className="flex justify-center gap-4 md:gap-8 mt-6">
          <div className="bg-white/80 backdrop-blur-sm rounded-lg px-4 py-2 shadow-sm border border-white/50">
            <div className="text-2xl font-bold text-blue-600">{uniquePersons.length}</div>
            <div className="text-xs text-gray-600">Members</div>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-lg px-4 py-2 shadow-sm border border-white/50">
            <div className="text-2xl font-bold text-pink-600">{couples.length}</div>
            <div className="text-xs text-gray-600">Couples</div>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-lg px-4 py-2 shadow-sm border border-white/50">
            <div className="text-2xl font-bold text-green-600">
              {treeData.reduce((acc, node) => acc + node.children.length, 0)}
            </div>
            <div className="text-xs text-gray-600">Children</div>
          </div>
        </div>
      </div>

      {/* Enhanced Family Tree Visualization */}
      <div className="flex justify-center items-start min-h-[400px]">
        <div className="inline-block max-w-full overflow-x-auto">
          <div className="flex flex-col items-center gap-8 p-4 bg-white/60 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50">
            {treeData.map((rootNode, index) => (
              <div key={rootNode.person.id} className="relative">
                {index > 0 && (
                  <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 w-px h-8 bg-gradient-to-b from-transparent to-blue-300"></div>
                )}
                {renderTreeNode(rootNode)}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Enhanced Legend */}
      <div className="mt-8 flex justify-center">
        <FamilyTreeLegend />
      </div>

      {/* Footer with tips */}
      <div className="mt-12 text-center">
        <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm rounded-full px-4 py-2 shadow-sm border border-white/50">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          <span className="text-sm text-gray-600">
            Click on any family member to view details • Couples are connected with relationship lines
          </span>
        </div>
      </div>
    </div>
  );
}
