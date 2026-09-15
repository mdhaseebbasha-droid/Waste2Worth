import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.tsx';
import { Navbar } from './components/Navbar.tsx';
import { Footer } from './components/Footer.tsx';
import { AuthModal } from './components/AuthModal.tsx';
import { HomePage } from './pages/HomePage.tsx';
import { WasteSelectionPage } from './pages/WasteSelectionPage.tsx';
import { PhotoScanPage } from './pages/PhotoScanPage.tsx';
import { RecommendationsPage } from './pages/RecommendationsPage.tsx';
import { ProjectDetailsPage } from './pages/ProjectDetailsPage.tsx';
import { SavedProjectsPage } from './pages/SavedProjectsPage.tsx';
import { DIYProject } from './types/index.ts';

export default function App() {
  const [generatedProjects, setGeneratedProjects] = useState<DIYProject[]>([]);
  const [selectedWasteItems, setSelectedWasteItems] = useState<string[]>([]);
  const [activeProject, setActiveProject] = useState<DIYProject | null>(null);

  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');

  const handleOpenAuth = (mode: 'login' | 'signup' = 'login') => {
    setAuthMode(mode);
    setAuthModalOpen(true);
  };

  const handleProjectsGenerated = (projects: DIYProject[], wasteItems: string[]) => {
    setGeneratedProjects(projects);
    setSelectedWasteItems(wasteItems);
  };

  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="min-h-screen flex flex-col bg-stone-50 text-stone-900 selection:bg-emerald-200 selection:text-emerald-900">
          <Navbar onOpenAuth={handleOpenAuth} />

          <main className="flex-1">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route
                path="/select"
                element={
                  <WasteSelectionPage
                    onProjectsGenerated={handleProjectsGenerated}
                  />
                }
              />
              <Route
                path="/scan"
                element={
                  <PhotoScanPage
                    onProjectsGenerated={handleProjectsGenerated}
                  />
                }
              />
              <Route
                path="/recommendations"
                element={
                  <RecommendationsPage
                    projects={generatedProjects}
                    wasteItems={selectedWasteItems}
                    onSelectProject={setActiveProject}
                    onOpenAuth={() => handleOpenAuth('login')}
                  />
                }
              />
              <Route
                path="/project/:id"
                element={
                  <ProjectDetailsPage
                    currentProject={activeProject}
                    onOpenAuth={() => handleOpenAuth('login')}
                  />
                }
              />
              <Route
                path="/saved"
                element={
                  <SavedProjectsPage
                    onSelectProject={setActiveProject}
                    onOpenAuth={() => handleOpenAuth('login')}
                  />
                }
              />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>

          <Footer />

          {/* Authentication Modal */}
          <AuthModal
            isOpen={authModalOpen}
            onClose={() => setAuthModalOpen(false)}
            defaultMode={authMode}
          />
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}
