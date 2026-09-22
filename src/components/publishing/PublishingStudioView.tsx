import React, { useState, useEffect } from 'react';
import { PublishingLibraryView } from './PublishingLibraryView';
import { PublishingStudioWorkspace } from './PublishingStudioWorkspace';

interface PublishingStudioViewProps {
  initialEpisodeId?: string;
}

export const PublishingStudioView: React.FC<PublishingStudioViewProps> = ({
  initialEpisodeId,
}) => {
  const [currentEpisodeId, setCurrentEpisodeId] = useState<string | null>(
    initialEpisodeId || null
  );

  useEffect(() => {
    if (initialEpisodeId) {
      setCurrentEpisodeId(initialEpisodeId);
    }
  }, [initialEpisodeId]);

  return (
    <div className="w-full">
      {currentEpisodeId ? (
        <PublishingStudioWorkspace
          key={currentEpisodeId}
          initialEpisodeId={currentEpisodeId}
          onBackToLibrary={() => setCurrentEpisodeId(null)}
        />
      ) : (
        <PublishingLibraryView
          onSelectEpisode={(epId) => setCurrentEpisodeId(epId)}
        />
      )}
    </div>
  );
};
