import React, { useState, useRef, useEffect, MouseEvent, WheelEvent } from 'react';
import { RoadmapMap, RoadmapNode, NodeStatus, NodeLink } from '../types';
import { NodeEditorModal } from './NodeEditorModal';

interface RoadmapCanvasProps {
  map: RoadmapMap;
  maps: RoadmapMap[];
  onSelectMap: (id: string) => void;
  onUpdateMap: (updated: Partial<RoadmapMap>) => void;
  onCreateMap: () => void;
  onDeleteMap: (id: string) => void;
}

const NODE_WIDTH = 240;
const NODE_HEIGHT = 150;

export function RoadmapCanvas({
  map,
  maps,
  onSelectMap,
  onUpdateMap,
  onCreateMap,
  onDeleteMap
}: RoadmapCanvasProps) {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  // Node Dragging State
  const [draggedNodeId, setDraggedNodeId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // Single-Click Extending Connection Line State
  const [connectSource, setConnectSource] = useState<{
    nodeId: string;
    side: 'left' | 'right';
  } | null>(null);
  const [dragConnectionPos, setDragConnectionPos] = useState<{ x: number; y: number } | null>(null);

  const [editingNode, setEditingNode] = useState<RoadmapNode | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<{ sourceId: string; targetId: string } | null>(null);

  const canvasRef = useRef<HTMLDivElement>(null);

  // Convert viewport client coordinates to canvas internal pixel coordinates
  const getCanvasCoords = (clientX: number, clientY: number) => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    const rect = canvasRef.current.getBoundingClientRect();
    const x = (clientX - rect.left - pan.x) / zoom;
    const y = (clientY - rect.top - pan.y) / zoom;
    return { x, y };
  };

  // Track window mousemove & keydown during extending connection line
  useEffect(() => {
    if (!connectSource) return;

    const handleWindowMouseMove = (e: globalThis.MouseEvent) => {
      const coords = getCanvasCoords(e.clientX, e.clientY);
      setDragConnectionPos(coords);
    };

    const handleWindowKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setConnectSource(null);
        setDragConnectionPos(null);
      }
    };

    window.addEventListener('mousemove', handleWindowMouseMove);
    window.addEventListener('keydown', handleWindowKeyDown);

    return () => {
      window.removeEventListener('mousemove', handleWindowMouseMove);
      window.removeEventListener('keydown', handleWindowKeyDown);
    };
  }, [connectSource, zoom, pan]);

  // Canvas Panning & Background Click Handler
  const handleCanvasMouseDown = (e: MouseEvent<HTMLDivElement>) => {
    const isBg =
      e.target === e.currentTarget ||
      (e.target as HTMLElement).classList.contains('canvas-background') ||
      (e.target as HTMLElement).classList.contains('edges-layer');

    if (!isBg) return;

    // Cancel extending line on background click
    if (connectSource) {
      setConnectSource(null);
      setDragConnectionPos(null);
    }

    setIsPanning(true);
    setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    setSelectedEdge(null);
  };

  const handleCanvasMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (isPanning) {
      setPan({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y
      });
      return;
    }

    // Node Dragging
    if (draggedNodeId) {
      const coords = getCanvasCoords(e.clientX, e.clientY);
      const newX = Math.round(coords.x - dragOffset.x);
      const newY = Math.round(coords.y - dragOffset.y);

      onUpdateMap({
        nodes: map.nodes.map((n) =>
          n.id === draggedNodeId ? { ...n, x: newX, y: newY } : n
        )
      });
    }
  };

  const handleCanvasMouseUp = () => {
    setIsPanning(false);
    setDraggedNodeId(null);
  };

  const handleWheel = (e: WheelEvent<HTMLDivElement>) => {
    const delta = e.deltaY > 0 ? -0.06 : 0.06;
    setZoom((z) => Math.min(2.0, Math.max(0.4, Number((z + delta).toFixed(2)))));
  };

  // Single Click on Port Handle (Left or Right) to start or finish extension
  const handlePortClick = (
    e: React.MouseEvent,
    node: RoadmapNode,
    side: 'left' | 'right'
  ) => {
    e.stopPropagation();

    // 1. If NO connection is extending: Start line extension from this port!
    if (!connectSource) {
      const sideLinksCount = (node.links || []).filter((l) => {
        if (typeof l === 'string') return side === 'right';
        return (l.sourceSide || 'right') === side;
      }).length;

      if (sideLinksCount >= 2) {
        return;
      }


      setConnectSource({ nodeId: node.id, side });
      const coords = getCanvasCoords(e.clientX, e.clientY);
      setDragConnectionPos(coords);
      return;
    }

    // 2. If line IS extending and user clicks the SAME port again: CANCEL!
    if (connectSource.nodeId === node.id && connectSource.side === side) {
      setConnectSource(null);
      setDragConnectionPos(null);
      return;
    }

    // 3. If line IS extending and user clicks ANOTHER port: COMPLETE connection!
    if (connectSource.nodeId !== node.id) {
      attemptCompleteConnection(connectSource.nodeId, connectSource.side, node.id, side);
    }

    setConnectSource(null);
    setDragConnectionPos(null);
  };

  // Single Click on Node Card
  const handleNodeClick = (e: React.MouseEvent<HTMLElement>, node: RoadmapNode) => {
    e.stopPropagation();
    setSelectedEdge(null);

    // If extending line is active and user clicks target node card
    if (connectSource) {
      if (connectSource.nodeId !== node.id) {
        attemptCompleteConnection(connectSource.nodeId, connectSource.side, node.id, 'left');
      }
      setConnectSource(null);
      setDragConnectionPos(null);
    }
  };

  // Touchscreen Support for Mobile & Tablets
  const handleTouchStartCanvas = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length !== 1) return;
    const touch = e.touches[0];
    const isBg =
      e.target === e.currentTarget ||
      (e.target as HTMLElement).classList.contains('canvas-background') ||
      (e.target as HTMLElement).classList.contains('edges-layer');

    if (!isBg) return;

    if (connectSource) {
      setConnectSource(null);
      setDragConnectionPos(null);
    }

    setIsPanning(true);
    setPanStart({ x: touch.clientX - pan.x, y: touch.clientY - pan.y });
    setSelectedEdge(null);
  };

  const handleTouchMoveCanvas = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length !== 1) return;
    const touch = e.touches[0];

    if (isPanning) {
      setPan({
        x: touch.clientX - panStart.x,
        y: touch.clientY - panStart.y
      });
      return;
    }

    if (draggedNodeId) {
      const coords = getCanvasCoords(touch.clientX, touch.clientY);
      const newX = Math.round(coords.x - dragOffset.x);
      const newY = Math.round(coords.y - dragOffset.y);

      onUpdateMap({
        nodes: map.nodes.map((n) =>
          n.id === draggedNodeId ? { ...n, x: newX, y: newY } : n
        )
      });
    } else if (connectSource) {
      const coords = getCanvasCoords(touch.clientX, touch.clientY);
      setDragConnectionPos(coords);
    }
  };

  // Node Drag Start on MouseDown (Desktop)
  const handleNodeMouseDown = (e: React.MouseEvent<HTMLElement>, node: RoadmapNode) => {
    if (connectSource) return;

    e.stopPropagation();
    setSelectedEdge(null);
    const coords = getCanvasCoords(e.clientX, e.clientY);
    setDraggedNodeId(node.id);
    setDragOffset({
      x: coords.x - node.x,
      y: coords.y - node.y
    });
  };

  const handleTouchStartNode = (e: React.TouchEvent<HTMLElement>, node: RoadmapNode) => {
    if (e.touches.length !== 1) return;
    if (connectSource) return;

    e.stopPropagation();
    setSelectedEdge(null);
    const touch = e.touches[0];
    const coords = getCanvasCoords(touch.clientX, touch.clientY);
    setDraggedNodeId(node.id);
    setDragOffset({
      x: coords.x - node.x,
      y: coords.y - node.y
    });
  };

  const getTargetId = (link: string | NodeLink): string =>
    typeof link === 'string' ? link : link.targetId;

  const attemptCompleteConnection = (
    sourceId: string,
    sourceSide: 'left' | 'right',
    targetId: string,
    targetSide: 'left' | 'right'
  ) => {
    const sourceNode = map.nodes.find((n) => n.id === sourceId);
    if (!sourceNode) return;

    // Check if link already exists
    const alreadyLinked = (sourceNode.links || []).some((l) => getTargetId(l) === targetId);
    if (alreadyLinked) return;

    // Count incoming connections on target side (MAX 2 PER PORT)
    const incomingCount = map.nodes.filter((n) =>
      (n.links || []).some((l) => {
        const tid = getTargetId(l);
        const tSide = typeof l === 'string' ? 'left' : l.targetSide || 'left';
        return tid === targetId && tSide === targetSide;
      })
    ).length;

    if (incomingCount >= 2) {
      return;
    }


    const newLink: NodeLink = {
      targetId,
      sourceSide,
      targetSide
    };

    const updatedNodes = map.nodes.map((n) =>
      n.id === sourceId ? { ...n, links: [...(n.links || []), newLink] } : n
    );
    onUpdateMap({ nodes: updatedNodes });
  };

  // Status Circle Toggle
  const handleStatusChange = (nodeId: string, newState: NodeStatus, e: React.MouseEvent) => {
    e.stopPropagation();
    onUpdateMap({
      nodes: map.nodes.map((n) => (n.id === nodeId ? { ...n, state: newState } : n))
    });
  };

  // Add Node centered on visible screen viewport
  const handleAddNode = () => {
    let initialX = 150;
    let initialY = 150;

    if (canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      initialX = Math.round((rect.width / 2 - pan.x) / zoom - NODE_WIDTH / 2);
      initialY = Math.round((rect.height / 2 - pan.y) / zoom - NODE_HEIGHT / 2);
    }

    const count = map.nodes.length;
    const offsetX = (count % 4) * 25;
    const offsetY = (count % 4) * 25;

    const newNode: RoadmapNode = {
      id: crypto.randomUUID(),
      title: `Node ${count + 1}`,
      detail: 'Describe key milestone objective and deliverables.',
      state: 'pending',
      links: [],
      x: initialX + offsetX,
      y: initialY + offsetY
    };

    onUpdateMap({ nodes: [...map.nodes, newNode] });
    setEditingNode(newNode);
  };

  // Save Node Edits
  const handleSaveNode = (updatedNode: RoadmapNode) => {
    onUpdateMap({
      nodes: map.nodes.map((n) => (n.id === updatedNode.id ? updatedNode : n))
    });
    setEditingNode(null);
  };

  // Delete Node
  const handleDeleteNode = (nodeId: string) => {
    onUpdateMap({
      nodes: map.nodes
        .filter((n) => n.id !== nodeId)
        .map((n) => ({
          ...n,
          links: (n.links || []).filter((l) => getTargetId(l) !== nodeId)
        }))
    });
    setEditingNode(null);
  };

  // Remove Selected Edge
  const handleDisconnectSelectedEdge = () => {
    if (!selectedEdge) return;
    onUpdateMap({
      nodes: map.nodes.map((n) =>
        n.id === selectedEdge.sourceId
          ? { ...n, links: (n.links || []).filter((l) => getTargetId(l) !== selectedEdge.targetId) }
          : n
      )
    });
    setSelectedEdge(null);
  };

  const handleResetCanvas = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  // Helper to compute clean Bezier Curve string for any port combination
  const computeBezierPath = (
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    sSide: 'left' | 'right',
    tSide: 'left' | 'right'
  ) => {
    const dist = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
    const minOffset = Math.max(50, Math.min(dist * 0.5, 160));

    const cx1 = sSide === 'right' ? x1 + minOffset : x1 - minOffset;
    const cx2 = tSide === 'right' ? x2 + minOffset : x2 - minOffset;

    return `M ${x1} ${y1} C ${cx1} ${y1}, ${cx2} ${y2}, ${x2} ${y2}`;
  };

  return (
    <div className="roadmap-container">
      {/* Selector & Roadmap Control Bar */}
      <div className="roadmap-selector-bar">
        <div className="selector-group">
          <label htmlFor="roadmap-select">Select Roadmap:</label>
          <select
            id="roadmap-select"
            value={map.id}
            onChange={(e) => onSelectMap(e.target.value)}
          >
            {maps.map((m) => (
              <option key={m.id} value={m.id}>
                {m.title}
              </option>
            ))}
          </select>

          <button type="button" className="quiet-button" onClick={onCreateMap}>
            + New Roadmap
          </button>

          <button
            type="button"
            className="quiet-button danger"
            onClick={() => onDeleteMap(map.id)}
          >
            🗑 Delete Roadmap
          </button>
        </div>
      </div>

      {/* Title & Description Editor */}
      <section className="panel roadmap-meta-panel">
        <input
          type="text"
          className="roadmap-title-input"
          value={map.title}
          onChange={(e) => onUpdateMap({ title: e.target.value })}
          placeholder="Roadmap Title..."
        />
        <textarea
          className="roadmap-desc-input"
          value={map.description}
          onChange={(e) => onUpdateMap({ description: e.target.value })}
          placeholder="Describe the workflow, milestones, and delivery path..."
        />
      </section>

      {/* Main Blueprint Canvas Host */}
      <section className="graph-shell">
        <header className="canvas-header">
          <div>
            <p className="eyebrow">BLUEPRINT CANVAS · SINGLE-CLICK FLOW</p>
            <h2>{map.title}</h2>
          </div>

          <div className="canvas-actions">
            {connectSource ? (
              <span className="connect-indicator">
                ⚡ Move mouse &amp; click target port to connect (Esc to cancel)
              </span>
            ) : (
              <span className="instruction-text">
                Click port dot ONCE to extend line · Click target port to connect
              </span>
            )}

            {selectedEdge && (
              <button
                type="button"
                className="quiet-button danger-pill"
                onClick={handleDisconnectSelectedEdge}
              >
                Disconnect Link
              </button>
            )}

            <button
              type="button"
              className={`action-pill ${connectSource ? 'active' : ''}`}
              onClick={() =>
                setConnectSource(
                  connectSource
                    ? null
                    : map.nodes[0]
                    ? { nodeId: map.nodes[0].id, side: 'right' }
                    : null
                )
              }
            >
              {connectSource ? 'Cancel Connect' : 'Connect Nodes'}
            </button>

            <div className="zoom-controls">
              <button
                type="button"
                onClick={() => setZoom((z) => Math.max(0.4, Number((z - 0.1).toFixed(2))))}
              >
                −
              </button>
              <button type="button" onClick={handleResetCanvas}>
                {Math.round(zoom * 100)}%
              </button>
              <button
                type="button"
                onClick={() => setZoom((z) => Math.min(2.0, Number((z + 0.1).toFixed(2))))}
              >
                +
              </button>
            </div>

            <button type="button" className="primary-button" onClick={handleAddNode}>
              Add Node +
            </button>
          </div>
        </header>

        <div
          ref={canvasRef}
          className={`canvas ${isPanning ? 'panning' : ''}`}
          onMouseDown={handleCanvasMouseDown}
          onMouseMove={handleCanvasMouseMove}
          onMouseUp={handleCanvasMouseUp}
          onMouseLeave={handleCanvasMouseUp}
          onTouchStart={handleTouchStartCanvas}
          onTouchMove={handleTouchMoveCanvas}
          onTouchEnd={handleCanvasMouseUp}
          onWheel={handleWheel}
        >
          <div
            className="canvas-background"
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transformOrigin: '0 0'
            }}
          >
            {/* SVG Layer for Edges */}
            <svg className="edges-layer">
              <defs>
                <marker
                  id="edge-arrow"
                  markerWidth="8"
                  markerHeight="8"
                  refX="7"
                  refY="4"
                  orient="auto"
                >
                  <path d="M0,0 L8,4 L0,8 Z" className="arrow-head" />
                </marker>
                <marker
                  id="edge-arrow-selected"
                  markerWidth="8"
                  markerHeight="8"
                  refX="7"
                  refY="4"
                  orient="auto"
                >
                  <path d="M0,0 L8,4 L0,8 Z" className="arrow-head-selected" />
                </marker>
                <marker
                  id="edge-arrow-drag"
                  markerWidth="8"
                  markerHeight="8"
                  refX="7"
                  refY="4"
                  orient="auto"
                >
                  <path d="M0,0 L8,4 L0,8 Z" className="arrow-head-drag" />
                </marker>
              </defs>

              {/* Render Established Connections */}
              {map.nodes.flatMap((source) =>
                (source.links || []).map((link) => {
                  const targetId = getTargetId(link);
                  const target = map.nodes.find((n) => n.id === targetId);
                  if (!target) return null;

                  const sSide = typeof link === 'string' ? 'right' : link.sourceSide || 'right';
                  const tSide = typeof link === 'string' ? 'left' : link.targetSide || 'left';

                  const x1 = sSide === 'right' ? source.x + NODE_WIDTH : source.x;
                  const y1 = source.y + NODE_HEIGHT / 2;

                  const x2 = tSide === 'right' ? target.x + NODE_WIDTH : target.x;
                  const y2 = target.y + NODE_HEIGHT / 2;

                  const pathD = computeBezierPath(x1, y1, x2, y2, sSide, tSide);
                  const isSelected =
                    selectedEdge?.sourceId === source.id && selectedEdge?.targetId === targetId;

                  return (
                    <g key={`${source.id}->${targetId}`}>
                      <path
                        d={pathD}
                        className="edge-click-target"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedEdge({ sourceId: source.id, targetId });
                        }}
                      />
                      <path
                        d={pathD}
                        className={`edge-path ${isSelected ? 'selected' : ''}`}
                        markerEnd={isSelected ? 'url(#edge-arrow-selected)' : 'url(#edge-arrow)'}
                      />
                    </g>
                  );
                })
              )}

              {/* Active Temporary Extending Line */}
              {connectSource && dragConnectionPos && (() => {
                const sourceNode = map.nodes.find((n) => n.id === connectSource.nodeId);
                if (!sourceNode) return null;

                const sSide = connectSource.side;
                const x1 = sSide === 'right' ? sourceNode.x + NODE_WIDTH : sourceNode.x;
                const y1 = sourceNode.y + NODE_HEIGHT / 2;

                const x2 = dragConnectionPos.x;
                const y2 = dragConnectionPos.y;

                const tSide = x2 > sourceNode.x + NODE_WIDTH / 2 ? 'left' : 'right';
                const pathD = computeBezierPath(x1, y1, x2, y2, sSide, tSide);

                return (
                  <path
                    d={pathD}
                    className="drag-edge-path"
                    markerEnd="url(#edge-arrow-drag)"
                  />
                );
              })()}
            </svg>

            {/* Render Node Cards */}
            {map.nodes.map((node, index) => {
              const isSource = connectSource?.nodeId === node.id;
              return (
                <article
                  key={node.id}
                  className={`canvas-node ${node.state} ${isSource ? 'connect-source' : ''}`}
                  style={{
                    left: `${node.x}px`,
                    top: `${node.y}px`
                  }}
                  onClick={(e) => handleNodeClick(e, node)}
                  onMouseDown={(e) => handleNodeMouseDown(e, node)}
                  onTouchStart={(e) => handleTouchStartNode(e, node)}
                >
                  {/* Left Connection Port (Single Click to Start or Finish Line) */}
                  <div
                    className={`port left-port ${isSource && connectSource.side === 'left' ? 'source-active' : ''}`}
                    onClick={(e) => handlePortClick(e, node, 'left')}
                  />

                  {/* Right Connection Port (Single Click to Start or Finish Line) */}
                  <div
                    className={`port right-port ${isSource && connectSource.side === 'right' ? 'source-active' : ''}`}
                    onClick={(e) => handlePortClick(e, node, 'right')}
                  />

                  <div className="node-card-header">
                    <span className="node-index-badge">#{index + 1}</span>

                    {/* Status Circle Selector */}
                    <div className="node-status-dots">
                      <button
                        type="button"
                        className={`dot-btn pending ${node.state === 'pending' ? 'active' : ''}`}
                        title="Mark Pending (Red)"
                        onClick={(e) => handleStatusChange(node.id, 'pending', e)}
                      />
                      <button
                        type="button"
                        className={`dot-btn progress ${node.state === 'progress' ? 'active' : ''}`}
                        title="Mark In Progress (Yellow)"
                        onClick={(e) => handleStatusChange(node.id, 'progress', e)}
                      />
                      <button
                        type="button"
                        className={`dot-btn complete ${node.state === 'complete' ? 'active' : ''}`}
                        title="Mark Completed (Green)"
                        onClick={(e) => handleStatusChange(node.id, 'complete', e)}
                      />
                    </div>
                  </div>

                  <div className="node-body">
                    <h3 className="node-title">{node.title}</h3>
                    <p className="node-detail">{node.detail}</p>
                  </div>

                  <div className="node-card-footer">
                    <span className={`status-pill ${node.state}`}>
                      {node.state === 'pending'
                        ? 'Pending'
                        : node.state === 'progress'
                        ? 'In Progress'
                        : 'Completed'}
                    </span>
                    <button
                      type="button"
                      className="edit-node-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingNode(node);
                      }}
                    >
                      Edit ✎
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <p className="page-caption">
        <strong>Canvas Tip:</strong> Click any port dot ONCE to extend a line to your cursor (no mouse holding required). Click target port to lock connection. Press Esc or click background to cancel.
      </p>

      {/* Edit Node Modal */}
      {editingNode && (
        <NodeEditorModal
          node={editingNode}
          allNodes={map.nodes}
          onSave={handleSaveNode}
          onDelete={handleDeleteNode}
          onClose={() => setEditingNode(null)}
        />
      )}
    </div>
  );
}
