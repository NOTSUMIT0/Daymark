import { RoadmapMap } from '../types';
import { RoadmapCanvas } from '../components/RoadmapCanvas';

interface RoadmapsPageProps {
  roadmaps: RoadmapMap[];
  activeMapId: string;
  onSelectMap: (id: string) => void;
  onUpdateMap: (updated: Partial<RoadmapMap>) => void;
  onCreateMap: () => void;
  onDeleteMap: (id: string) => void;
}

export function RoadmapsPage({
  roadmaps,
  activeMapId,
  onSelectMap,
  onUpdateMap,
  onCreateMap,
  onDeleteMap
}: RoadmapsPageProps) {
  const currentMap = roadmaps.find((m) => m.id === activeMapId) || roadmaps[0];

  if (!currentMap) {
    return (
      <section className="page">
        <p>No roadmaps created yet.</p>
        <button className="primary-button" onClick={onCreateMap}>
          Create First Roadmap
        </button>
      </section>
    );
  }

  return (
    <section className="page roadmaps-page">
      <RoadmapCanvas
        map={currentMap}
        maps={roadmaps}
        onSelectMap={onSelectMap}
        onUpdateMap={onUpdateMap}
        onCreateMap={onCreateMap}
        onDeleteMap={onDeleteMap}
      />
    </section>
  );
}
