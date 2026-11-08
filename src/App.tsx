import React, { useEffect, useState } from 'react';
import { Header } from './components/Header';
import { LeftDrawer } from './components/LeftDrawer';
import { InspectorPanel } from './components/InspectorPanel';
import { ChatCanvas } from './components/ChatCanvas';
import { FreeformCanvas } from './components/FreeformCanvas';
import { ArenaCanvas } from './components/ArenaCanvas';
import { EvalCanvas } from './components/EvalCanvas';
import { StructuredCanvas } from './components/StructuredCanvas';
import { GetCodeModal } from './components/GetCodeModal';
import { CachingModal } from './components/CachingModal';
import { ShareModal } from './components/ShareModal';
import { PromptGalleryModal } from './components/PromptGalleryModal';
import { PromptsGalleryView } from './components/PromptsGalleryView';
import { useStudioStore } from './store/studioStore';

export default function App() {
  const {
    activeTab,
    setIsCodeModalOpen,
    setIsCachingModalOpen,
    setIsShareModalOpen,
    setIsPromptGalleryOpen,
  } = useStudioStore();

  const [, setHasApiKey] = useState(true);

  useEffect(() => {
    fetch('/api/health')
      .then((res) => res.json())
      .then((data) => {
        setHasApiKey(Boolean(data.hasApiKey));
      })
      .catch(() => {
        // Fallback
      });
  }, []);

  // Global keydown handler for Escape & shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsCodeModalOpen(false);
        setIsCachingModalOpen(false);
        setIsShareModalOpen(false);
        setIsPromptGalleryOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setIsCodeModalOpen, setIsCachingModalOpen, setIsShareModalOpen, setIsPromptGalleryOpen]);

  return (
    <div className="flex flex-col h-screen w-screen bg-zinc-950 font-sans text-zinc-100 overflow-hidden">
      {/* Top Header */}
      <Header />

      {/* Main Studio Body (Three Column Flex) */}
      <div className="flex flex-1 overflow-hidden min-h-0 relative">
        <LeftDrawer />

        <main className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
          {activeTab === 'chat' && <ChatCanvas />}
          {activeTab === 'freeform' && <FreeformCanvas />}
          {activeTab === 'prompts' && <PromptsGalleryView />}
          {activeTab === 'arena' && <ArenaCanvas />}
          {activeTab === 'evals' && <EvalCanvas />}
          {activeTab === 'structured' && <StructuredCanvas />}
        </main>

        <InspectorPanel />
      </div>

      {/* Modals */}
      <GetCodeModal />
      <CachingModal />
      <ShareModal />
      <PromptGalleryModal />
    </div>
  );
}
