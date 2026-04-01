# Family Tree Visualization - Architecture & Best Practices

## Overview
The family tree uses **ReactFlow** library with a custom **Breadth-First Search (BFS)** algorithm optimized for genealogy visualization.

## How It Works

### 1. Data Structure & Organization
```typescript
interface Person {
  id: string;
  firstName, middleName, lastName: string;
  birthday: string;
  birthplace: string;
  motherId?: string;  // Foreign key to mother
  fatherId?: string;   // Foreign key to father
  gender?: 'male' | 'female' | 'other';
}
```

### 2. Tree Building Algorithm (BFS-based)

#### Step 1: Identify Root Persons
```typescript
const rootPersons = persons.filter(p => !p.motherId && !p.fatherId);
```
- Finds ancestors (people with no parents)
- These become the starting points of the tree

#### Step 2: Queue-Based Layout
```typescript
queue = [{ person, generation, xOffset }]
```
- Uses Breadth-First Search to process generations level-by-level
- Each person gets positioned based on:
  - **Generation** (Y-axis): `generation * GENERATION_HEIGHT`
  - **Siblings** (X-axis): Spread horizontally around parent

#### Step 3: Avoid Duplicates
```typescript
const visited = new Set<string>();
if (visited.has(person.id)) continue;
```
- Tracks processed persons to prevent showing them twice
- Important for complex family trees with multiple connections

#### Step 4: Create Nodes & Edges
- **Nodes**: Visual representation of each person
- **Parent-Child Edges**: Arrows from parents to children
- **Marriage Edges**: Dashed lines between spouses (co-parents)

### 3. Custom Node Component

```typescript
const PersonNode = memo(({ data }: NodeProps<NodeData>) => {
  // Displays: Name, Age, Birthplace
  // Color-coded by gender
  // Clickable for interaction
});
```

**Benefits:**
- Memoized for performance (only re-renders when data changes)
- Rich information display
- Interactive (clickable)
- Custom styling per person

### 4. Interactivity

```typescript
onPersonClick={(person) => {
  // Switch to card view
  // Scroll to and highlight the person's card
}}
```

## Best Practices Implemented

### ✅ Performance Optimization
1. **useMemo** - Tree calculation only runs when `persons` changes
2. **React.memo** - Custom nodes don't re-render unnecessarily
3. **useNodesState/useEdgesState** - Efficient state management from ReactFlow

### ✅ Genealogy-Specific Features
1. **Generation-based layout** - Clear visual hierarchy
2. **Sibling spacing** - Children centered under parents
3. **Marriage connections** - Visualizes co-parenting relationships
4. **Gender color-coding** - Quick visual identification
   - Male: Blue (#3B82F6)
   - Female: Pink (#EC4899)
   - Other: Purple (#8B5CF6)

### ✅ User Experience
1. **Zoom & Pan** - ReactFlow controls for navigation
2. **Auto-fit view** - Tree automatically fits in viewport
3. **Clickable nodes** - Navigate from tree to detailed card view
4. **Empty state** - Clear message when no data available

### ✅ Data Integrity
1. **Duplicate prevention** - `visited` set ensures each person appears once
2. **Null safety** - Handles missing parents gracefully
3. **Edge validation** - Only creates valid parent-child relationships

## Potential Improvements

### For Large Family Trees (100+ persons)
1. **Virtual rendering** - Only render visible nodes
2. **Collapsible branches** - Hide/show subtrees
3. **Level-of-detail** - Show less info when zoomed out

### Advanced Features
1. **Multiple spouses** - Handle remarriage scenarios
2. **Adopted children** - Different edge styling
3. **Timeline view** - Arrange by birth year instead of generation
4. **Export functionality** - Save tree as image/PDF

### Layout Algorithms
Current algorithm works well for most cases, but consider:
1. **Walker algorithm** - Better for very wide trees
2. **Sugiyama framework** - Minimizes edge crossings
3. **Force-directed layout** - For complex relationship networks

## Technical Stack

- **ReactFlow**: Graph visualization library
- **TypeScript**: Type-safe components
- **Tailwind CSS**: Styling
- **React Hooks**: State management

## Code Location

- `/src/app/components/FamilyTree.tsx` - Main tree component
- `/src/app/App.tsx` - Integration & click handling
- `/src/app/components/PersonCard.tsx` - Detailed person view

## Performance Characteristics

- **Time Complexity**: O(n) where n = number of persons
- **Space Complexity**: O(n) for visited set and nodes/edges arrays
- **Re-render triggers**: Only when `persons` prop changes
