/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Project, LanguageMode } from './types';
import { ProjectService } from './services/projectService';
import { CharacterService } from './services/characterService';
import { EpisodeService } from './services/episodeService';
import { StyleService } from './services/styleService';
import { storageService } from './services/storageService';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { DashboardView } from './components/dashboard/DashboardView';
import { CharacterListView } from './components/characters/CharacterListView';
import { CharacterDNAEditor } from './components/characters/CharacterDNAEditor';
import { CharacterReferenceGallery } from './components/characters/CharacterReferenceGallery';
import { GlobalStyleView } from './components/style/GlobalStyleView';
import { SeasonListView } from './components/seasons/SeasonListView';
import { EpisodeListView } from './components/episodes/EpisodeListView';
import { StoryGeneratorView } from './components/story/StoryGeneratorView';
import { ProviderAdaptersView } from './components/providers/ProviderAdaptersView';
import { BackupModal } from './components/shared/BackupModal';

export default function App() {
  const [project, setProject] = useState<Project>(ProjectService.getProject());
  const [currentView, setCurrentView] = useState<string>('dashboard');
  const [selectedCharacterId, setSelectedCharacterId] = useState<string>('char_pi');
  const [selectedSeasonId, setSelectedSeasonId] = useState<string | undefined>(undefined);
  const [language, setLanguage] = useState<LanguageMode>('bilingual');
  const [backupModalMode, setBackupModalMode] = useState<'export' | 'import' | 'reset' | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const characters = CharacterService.getAllCharacters();
  const episodes = EpisodeService.getAllEpisodes();
  const activeStyle = StyleService.getActiveStyleVersion();
  const references = CharacterService.getAllReferences();

  const handleRefreshAll = () => {
    setProject(ProjectService.getProject());
    setRefreshKey((prev) => prev + 1);
  };

  const handleNavigate = (view: string, id?: string) => {
    setCurrentView(view);
    if (view === 'character-dna' && id) {
      setSelectedCharacterId(id);
    } else if (view === 'references' && id) {
      setSelectedCharacterId(id);
    } else if (view === 'episodes' && id) {
      setSelectedSeasonId(id);
    }
  };

  const handleOpenDNA = (characterId: string) => {
    setSelectedCharacterId(characterId);
    setCurrentView('character-dna');
  };

  const handleOpenReferences = (characterId: string) => {
    setSelectedCharacterId(characterId);
    setCurrentView('references');
  };

  const handleOpenSeasonEpisodes = (seasonId: string) => {
    setSelectedSeasonId(seasonId);
    setCurrentView('episodes');
  };

  return (
    <div className="flex h-screen w-screen bg-slate-950 text-slate-100 font-sans overflow-hidden antialiased selection:bg-amber-500 selection:text-slate-950">
      {/* Navigation Sidebar */}
      <Sidebar
        currentView={currentView}
        onNavigate={handleNavigate}
        characters={characters}
        selectedCharacterId={selectedCharacterId}
        language={language}
      />

      {/* Main Studio Viewport */}
      <div className="flex-1 flex flex-col h-full overflow-hidden min-w-0">
        {/* Studio Top Header */}
        <Header
          project={project}
          language={language}
          onLanguageChange={setLanguage}
          onOpenExportModal={() => setBackupModalMode('export')}
          onOpenImportModal={() => setBackupModalMode('import')}
          onResetSeed={() => setBackupModalMode('reset')}
        />

        {/* Scrollable Workspace Stage */}
        <main
          key={refreshKey}
          className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 custom-scrollbar"
        >
          {currentView === 'dashboard' && (
            <DashboardView
              project={project}
              characters={characters}
              episodes={episodes}
              activeStyle={activeStyle}
              references={references}
              onNavigate={handleNavigate}
              language={language}
            />
          )}

          {currentView === 'characters' && (
            <CharacterListView
              onOpenDNA={handleOpenDNA}
              onOpenReferences={handleOpenReferences}
              language={language}
            />
          )}

          {currentView === 'character-dna' && (
            <CharacterDNAEditor
              characterId={selectedCharacterId}
              onBack={() => setCurrentView('characters')}
              language={language}
              onOpenReferences={handleOpenReferences}
              onOpenHistory={() => {}}
            />
          )}

          {currentView === 'references' && (
            <CharacterReferenceGallery
              initialCharacterId={selectedCharacterId}
              language={language}
              onOpenDNA={handleOpenDNA}
            />
          )}

          {currentView === 'style' && (
            <GlobalStyleView language={language} />
          )}

          {currentView === 'seasons' && (
            <SeasonListView
              onOpenEpisodes={handleOpenSeasonEpisodes}
              language={language}
            />
          )}

          {currentView === 'episodes' && (
            <EpisodeListView
              initialSeasonId={selectedSeasonId}
              language={language}
            />
          )}

          {currentView === 'story-generator' && (
            <StoryGeneratorView
              language={language}
              onNavigate={handleNavigate}
              onEpisodeCreated={() => {
                handleRefreshAll();
              }}
            />
          )}

          {currentView === 'providers' && (
            <ProviderAdaptersView language={language} />
          )}
        </main>
      </div>

      {/* Backup, Import & Reset Modal */}
      {backupModalMode && (
        <BackupModal
          isOpen={!!backupModalMode}
          mode={backupModalMode}
          onClose={() => setBackupModalMode(null)}
          onRefreshAll={handleRefreshAll}
          language={language}
        />
      )}
    </div>
  );
}
