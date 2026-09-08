import { useState } from 'react';
import { RoadmapNode, NodeStatus, NodeLink } from '../types';

interface NodeEditorModalProps {
  node: RoadmapNode;
  allNodes: RoadmapNode[];
  onSave: (updated: RoadmapNode) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}

export function NodeEditorModal({
  node,
  allNodes,
  onSave,
  onDelete,
  onClose
}: NodeEditorModalProps) {
  const [title, setTitle] = useState(node.title);
  const [detail, setDetail] = useState(node.detail);
  const [state, setState] = useState<NodeStatus>(node.state);
  const [links, setLinks] = useState<(string | NodeLink)[]>(node.links || []);

  const getTargetId = (link: string | NodeLink): string =>
    typeof link === 'string' ? link : link.targetId;

  const availableTargets = allNodes.filter((n) => n.id !== node.id);

  const toggleLink = (targetId: string) => {
    const isLinked = links.some((l) => getTargetId(l) === targetId);
    if (isLinked) {
      setLinks(links.filter((l) => getTargetId(l) !== targetId));
    } else {
      if (links.length >= 4) {
        alert('Maximum of 4 outgoing links per node allowed.');
        return;
      }
      setLinks([...links, { targetId, sourceSide: 'right', targetSide: 'left' }]);
    }
  };

  const handleSave = () => {
    if (!title.trim()) return;
    onSave({
      ...node,
      title: title.trim(),
      detail: detail.trim(),
      state,
      links
    });
  };

  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <section className="composer" onMouseDown={(e) => e.stopPropagation()}>
        <button className="close" onClick={onClose} aria-label="Close modal">
          ×
        </button>
        <p className="eyebrow">EDIT ROADMAP NODE</p>

        <label>
          Node Name / Title
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Design System Pass"
            autoFocus
          />
        </label>

        <label>
          Description / Next Action
          <textarea
            value={detail}
            onChange={(e) => setDetail(e.target.value)}
            placeholder="Describe what needs to be accomplished in this node..."
          />
        </label>

        <label>
          Node Status
          <div className="status-selector-row">
            <button
              type="button"
              className={`status-chip pending ${state === 'pending' ? 'selected' : ''}`}
              onClick={() => setState('pending')}
            >
              <span className="dot red" /> Pending
            </button>
            <button
              type="button"
              className={`status-chip progress ${state === 'progress' ? 'selected' : ''}`}
              onClick={() => setState('progress')}
            >
              <span className="dot yellow" /> In Progress
            </button>
            <button
              type="button"
              className={`status-chip complete ${state === 'complete' ? 'selected' : ''}`}
              onClick={() => setState('complete')}
            >
              <span className="dot green" /> Completed
            </button>
          </div>
        </label>

        {availableTargets.length > 0 && (
          <div className="link-manager">
            <p className="eyebrow">OUTGOING CONNECTIONS ({links.length}/4)</p>
            <div className="link-targets">
              {availableTargets.map((target) => {
                const isLinked = links.some((l) => getTargetId(l) === target.id);
                return (
                  <button
                    key={target.id}
                    type="button"
                    className={`link-pill ${isLinked ? 'active' : ''}`}
                    onClick={() => toggleLink(target.id)}
                  >
                    {isLinked ? '✓ Connected to: ' : '+ Connect to: '}
                    <strong>{target.title}</strong>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="modal-actions">
          <button
            type="button"
            className="quiet-button danger"
            onClick={() => onDelete(node.id)}
          >
            Delete Node
          </button>
          <button type="button" className="primary-button" onClick={handleSave}>
            Save Node Changes
          </button>
        </div>
      </section>
    </div>
  );
}
