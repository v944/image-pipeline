import { useCallback, useRef, useState, type DragEvent } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  type OnNodesChange,
  type OnEdgesChange,
  type OnConnect,
  type Node,
  type Edge,
  type Connection,
  type XYPosition,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { nodeTypes } from "../nodes";
import { usePipelineStore } from "../../stores/pipeline.store";
import type { NodeType } from "../../types";

const defaultEdgeOptions = {
  style: { stroke: "#F59E0B", strokeWidth: 2 },
  animated: true,
};

export function FlowEditor() {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const storeNodes = usePipelineStore((s) => s.nodes);
  const storeEdges = usePipelineStore((s) => s.edges);
  const selectedNodeId = usePipelineStore((s) => s.selectedNodeId);
  const addNode = usePipelineStore((s) => s.addNode);
  const addEdgeToStore = usePipelineStore((s) => s.addEdge);
  const removeNode = usePipelineStore((s) => s.removeNode);
  const removeEdgeFromStore = usePipelineStore((s) => s.removeEdge);
  const setSelectedNode = usePipelineStore((s) => s.setSelectedNode);
  const updateNodePosition = usePipelineStore((s) => s.updateNodePosition);

  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);

  const flowNodes: Node[] = storeNodes.map((n) => ({
    id: n.id,
    type: n.type,
    position: n.position as XYPosition,
    data: { ...n.data, type: n.type, label: n.label },
    selected: n.id === selectedNodeId,
  }));

  const flowEdges: Edge[] = storeEdges.map((e) => ({
    id: e.id,
    source: e.source,
    target: e.target,
    selected: e.id === selectedEdgeId,
  }));

  const onNodesChange: OnNodesChange = useCallback(
    (changes) => {
      for (const change of changes) {
        if (change.type === "position" && change.position) {
          updateNodePosition(change.id, change.position as { x: number; y: number });
        }
        if (change.type === "remove") {
          removeNode(change.id);
        }
        if (change.type === "select") {
          setSelectedNode(change.selected ? change.id : null);
          if (change.selected) setSelectedEdgeId(null);
        }
      }
    },
    [updateNodePosition, removeNode, setSelectedNode]
  );

  const onEdgesChange: OnEdgesChange = useCallback(
    (changes) => {
      for (const change of changes) {
        if (change.type === "remove") {
          removeEdgeFromStore(change.id);
          setSelectedEdgeId((prev) => prev === change.id ? null : prev);
        }
        if (change.type === "select") {
          setSelectedEdgeId(change.selected ? change.id : null);
        }
      }
    },
    [removeEdgeFromStore]
  );

  const onConnect: OnConnect = useCallback(
    (connection: Connection) => {
      if (connection.source && connection.target) {
        addEdgeToStore(connection.source, connection.target);
      }
    },
    [addEdgeToStore]
  );

  const onDragOver = useCallback((event: DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback(
    (event: DragEvent) => {
      event.preventDefault();
      const type = event.dataTransfer.getData("application/reactflow") as NodeType;
      if (!type) return;
      const bounds = reactFlowWrapper.current?.getBoundingClientRect();
      if (!bounds) return;
      const position = {
        x: event.clientX - bounds.left - 70,
        y: event.clientY - bounds.top - 20,
      };
      addNode(type, position);
    },
    [addNode]
  );

  return (
    <div ref={reactFlowWrapper} className="w-full h-full">
      <ReactFlow
        nodes={flowNodes}
        edges={flowEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onDrop={onDrop}
        onDragOver={onDragOver}
        nodeTypes={nodeTypes}
        defaultEdgeOptions={defaultEdgeOptions}
        fitView
        edgesFocusable={true}
        deleteKeyCode={["Backspace", "Delete"]}
        onPaneClick={() => { setSelectedEdgeId(null); setSelectedNode(null); }}
        multiSelectionKeyCode="Control"
        selectionOnDrag
        panOnScroll
        minZoom={0.1}
        maxZoom={4}
      >
        <Background color="#1A1A24" gap={20} size={1} />
        <Controls className="!bg-[#1A1A24] !border-white/10 !text-gray-300" />
        <MiniMap
          nodeColor={() => "#F59E0B"}
          maskColor="rgba(13,13,20,0.7)"
          className="!bg-[#1A1A24] !border-white/10"
        />
      </ReactFlow>
    </div>
  );
}

