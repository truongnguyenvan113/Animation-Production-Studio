import React, { useState } from 'react';
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

  return (
    <div className="w-full">
      {currentEpisodeId ? (
        <PublishingStudioWorkspace
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
