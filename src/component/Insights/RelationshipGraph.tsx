import React, { useMemo } from 'react';
import {
  ReactFlow,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  BackgroundVariant,
  MiniMap,
  type Node,
  type Edge,
  ReactFlowProvider
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
//@ts-ignore
import dagre from '@dagrejs/dagre';
import { Box, Typography } from '@mui/material';

export interface Relationship {
  table1: string;
  table2: string;
  relationship: string;
}

interface RelationshipGraphProps {
  relationships: Relationship[];
  height?: number | string;
  currentTable?: string;
  onNodeClick?: (tableName: string) => void;
}

const nodeWidth = 220;
const nodeHeight = 60;

const getLayoutedElements = (nodes: Node[], edges: Edge[], direction = 'TB') => {
  const dagreGraph = new dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({}));
  const isHorizontal = direction === 'LR';
  dagreGraph.setGraph({ rankdir: direction, nodesep: 80, ranksep: 120 });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    return {
      ...node,
      position: {
        x: nodeWithPosition.x - nodeWidth / 2,
        y: nodeWithPosition.y - nodeHeight / 2,
      },
      sourcePosition: isHorizontal ? 'right' : 'bottom',
      targetPosition: isHorizontal ? 'left' : 'top',
    } as Node;
  });

  return { nodes: layoutedNodes, edges };
};

const RelationshipGraphInner: React.FC<RelationshipGraphProps> = ({ relationships, height = 500, currentTable, onNodeClick }) => {
  const { initialNodes, initialEdges } = useMemo(() => {
    let filteredRelationships = relationships || [];

    // BFS to find all relationships up to 3 degrees 
    if (currentTable && filteredRelationships.length > 0) {
      const adjList: Record<string, Relationship[]> = {};
      filteredRelationships.forEach(rel => {
        if (!adjList[rel.table1]) adjList[rel.table1] = [];
        if (!adjList[rel.table2]) adjList[rel.table2] = [];
        adjList[rel.table1].push(rel);
        adjList[rel.table2].push(rel);
      });

      const maxDegrees = 3;
      const visitedTables = new Set<string>();
      const includedRelationships = new Set<Relationship>();

      let currentLevel = [currentTable];
      visitedTables.add(currentTable);

      for (let degree = 0; degree < maxDegrees; degree++) {
        let nextLevel: string[] = [];

        for (const table of currentLevel) {
          if (adjList[table]) {
            adjList[table].forEach(rel => {
              includedRelationships.add(rel);

              const neighbor = rel.table1 === table ? rel.table2 : rel.table1;
              if (!visitedTables.has(neighbor)) {
                visitedTables.add(neighbor);
                nextLevel.push(neighbor);
              }
            });
          }
        }

        if (nextLevel.length === 0) break;
        currentLevel = nextLevel;
      }

      filteredRelationships = Array.from(includedRelationships);
    }

    if (filteredRelationships.length === 0) {
      // If there are no relationships, but we have a currentTable, let's at least show the current table alone
      if (currentTable) {
        return {
          initialNodes: [
            {
              id: currentTable,
              data: { label: currentTable },
              position: { x: 0, y: 0 },
              style: {
                background: '#0B57D0', // Highlight current table
                color: '#FFFFFF',
                border: '1px solid #0842A0',
                borderRadius: '8px',
                padding: '12px 16px',
                fontSize: '13px',
                fontFamily: '"Google Sans Text", sans-serif',
                fontWeight: 600,
                width: nodeWidth,
                textAlign: 'center' as const,
              },
            }
          ],
          initialEdges: []
        };
      }
      return { initialNodes: [], initialEdges: [] };
    }

    // Extract unique tables
    const tableSet = new Set<string>();
    filteredRelationships.forEach((rel) => {
      tableSet.add(rel.table1);
      tableSet.add(rel.table2);
    });

    // Create nodes
    const nodes: Node[] = Array.from(tableSet).map((table) => {
      const isCurrentTable = table === currentTable;
      return {
        id: table,
        data: { label: table },
        position: { x: 0, y: 0 },
        style: {
          background: isCurrentTable ? '#0B57D0' : '#1E293B',
          color: isCurrentTable ? '#FFFFFF' : '#F1F5F9',
          border: isCurrentTable ? '2px solid #0842A0' : '1px solid #334155',
          borderRadius: '8px',
          padding: '12px 16px',
          fontSize: '13px',
          fontFamily: '"Google Sans Text", sans-serif',
          fontWeight: isCurrentTable ? 600 : 500,
          width: nodeWidth,
          textAlign: 'center' as const,
          cursor: onNodeClick ? 'pointer' : 'default',
        },
      };
    });

    // Create edges
    const edges: Edge[] = filteredRelationships.map((rel, idx) => ({
      id: `edge-${idx}`,
      source: rel.table1,
      target: rel.table2,
      label: rel.relationship,
      type: 'smoothstep',
      animated: true,
      style: { stroke: '#64748B', strokeWidth: 2 },
      labelStyle: {
        fill: '#94A3B8',
        fontSize: 11,
        fontFamily: '"Google Sans Text", sans-serif',
      },
      labelBgStyle: {
        fill: '#0F172A',
        fillOpacity: 0.8,
      },
      labelBgPadding: [6, 4] as [number, number],
      labelBgBorderRadius: 4,
    }));

    // Apply dagre layout
    const layouted = getLayoutedElements(nodes, edges, 'TB');
    return { initialNodes: layouted.nodes, initialEdges: layouted.edges };
  }, [relationships, currentTable, onNodeClick]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  React.useEffect(() => {
    setNodes(initialNodes);
    setEdges(initialEdges);
  }, [initialNodes, initialEdges, setNodes, setEdges]);

  if (nodes.length === 0) {
    return (
      <Box sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: height,
        color: '#9AA0A6'
      }}>
        <Typography variant="body2">No relationship data available</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ height, width: '100%', borderRadius: '8px', overflow: 'hidden', border: '1px solid #DADCE0' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={(_, node) => {
          if (onNodeClick) {
            onNodeClick(node.id);
          }
        }}
        fitView
        attributionPosition="bottom-left"
        style={{ background: '#0F172A' }}
      >
        <Controls
          style={{
            background: '#1E293B',
            borderRadius: '8px',
            border: '1px solid #334155',
          }}
        />
        <MiniMap
          nodeStrokeColor="#64748B"
          nodeColor="#1E293B"
          nodeBorderRadius={4}
          maskColor="rgba(15, 23, 42, 0.7)"
          style={{ background: '#1E293B', borderRadius: '8px' }}
        />
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#1E293B" />
      </ReactFlow>
    </Box>
  );
};

const RelationshipGraph: React.FC<RelationshipGraphProps> = (props) => {
  return (
    <ReactFlowProvider>
      <RelationshipGraphInner {...props} />
    </ReactFlowProvider>
  );
};

export default RelationshipGraph;
