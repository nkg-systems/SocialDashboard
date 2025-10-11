/**
 * Content Library Page
 * Unified interface for managing media assets and content templates
 */

'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MediaAssetManager } from './MediaAssetManager';
import { TemplateManager } from './TemplateManager';

type ContentLibraryTab = 'media' | 'templates';

interface MediaAsset {
  id: string;
  filename: string;
  originalName: string;
  type: 'image' | 'video' | 'gif';
  mimeType: string;
  size: number;
  url: string;
  thumbnailUrl?: string;
  uploadedAt: Date;
  lastUsed?: Date;
  tags: string[];
  description: string;
  alt: string;
  userId: string;
}

interface ContentTemplate {
  id: string;
  name: string;
  description: string;
  content: string;
  category: string;
  variables: Array<{
    name: string;
    type: 'text' | 'number' | 'url' | 'hashtag' | 'mention';
    placeholder: string;
    required: boolean;
    defaultValue?: string;
  }>;
  platforms: string[];
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  usageCount: number;
  userId: string;
}

interface ContentLibraryPageProps {
  initialTab?: ContentLibraryTab;
  selectionMode?: boolean;
  onSelectMedia?: (media: MediaAsset) => void;
  onSelectTemplate?: (template: ContentTemplate) => void;
  onClose?: () => void;
}

export const ContentLibraryPage: React.FC<ContentLibraryPageProps> = ({
  initialTab = 'media',
  selectionMode = false,
  onSelectMedia,
  onSelectTemplate,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<ContentLibraryTab>(initialTab);
  const [searchTerm, setSearchTerm] = useState('');

  // Tab configuration
  const tabs = useMemo(() => [
    {
      id: 'media' as ContentLibraryTab,
      label: 'Media Assets',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      description: 'Upload and manage images, videos, and other media files',
      count: 0 // This would be populated from actual data
    },
    {
      id: 'templates' as ContentLibraryTab,
      label: 'Content Templates',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      description: 'Create and manage reusable content templates with variables',
      count: 0 // This would be populated from actual data
    }
  ], []);

  // Handle tab switching
  const handleTabChange = useCallback((tab: ContentLibraryTab) => {
    setActiveTab(tab);
    setSearchTerm(''); // Clear search when switching tabs
  }, []);

  // Handle media selection
  const handleMediaSelection = useCallback((media: any) => {
    if (onSelectMedia) {
      onSelectMedia(media);
    }
  }, [onSelectMedia]);

  // Handle template selection
  const handleTemplateSelection = useCallback((template: any) => {
    if (onSelectTemplate) {
      onSelectTemplate(template);
    }
  }, [onSelectTemplate]);

  // Render tab content
  const renderTabContent = useCallback(() => {
    switch (activeTab) {
      case 'media':
        return (
          <MediaAssetManager
            selectionMode={selectionMode}
            onSelectMedia={handleMediaSelection}
            initialSearchTerm={searchTerm}
          />
        );
      case 'templates':
        return (
          <TemplateManager
            selectionMode={selectionMode}
            onSelectTemplate={handleTemplateSelection}
          />
        );
      default:
        return null;
    }
  }, [activeTab, selectionMode, handleMediaSelection, handleTemplateSelection, searchTerm]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div>
                <h1 className="sm3d-text-h1">Content Library</h1>
                <p className="text-sm text-text-muted mt-1">
                  {selectionMode 
                    ? 'Select content to use in your post' 
                    : 'Manage your media assets and content templates'}
                </p>
              </div>
            </div>
            
            {/* Close button for selection mode */}
            {selectionMode && onClose && (
              <Button
                variant="ghost"
                onClick={onClose}
                className="text-text-muted hover:text-text-default"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Close
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-border">
        <div className="container mx-auto px-4">
          <nav className="flex space-x-8" aria-label="Content Library Tabs">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`
                    flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors
                    ${isActive 
                      ? 'border-accent text-accent' 
                      : 'border-transparent text-text-muted hover:text-text-default hover:border-border-hover'
                    }
                  `}
                  aria-current={isActive ? 'page' : undefined}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                  {tab.count > 0 && (
                    <span className={`
                      px-2 py-1 text-xs rounded-full
                      ${isActive 
                        ? 'bg-accent/10 text-accent' 
                        : 'bg-muted text-text-muted'
                      }
                    `}>
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <div className="container mx-auto px-4 py-6">
        {/* Tab Description */}
        <div className="mb-6">
          <Card className="bg-muted/30">
            <CardContent className="p-4">
              <div className="flex items-start space-x-3">
                <div className="text-accent mt-1">
                  {tabs.find(tab => tab.id === activeTab)?.icon}
                </div>
                <div>
                  <h3 className="font-medium text-text-default mb-1">
                    {tabs.find(tab => tab.id === activeTab)?.label}
                  </h3>
                  <p className="text-sm text-text-muted">
                    {tabs.find(tab => tab.id === activeTab)?.description}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Dynamic Tab Content */}
        <div className="tab-content">
          {renderTabContent()}
        </div>
      </div>

      {/* Quick Actions Floating Panel (when in selection mode) */}
      {selectionMode && (
        <div className="fixed bottom-6 right-6 z-50">
          <Card className="shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="text-sm text-text-muted">
                  Selection Mode Active
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleTabChange('media')}
                    className={activeTab === 'media' ? 'bg-accent/10 text-accent' : ''}
                  >
                    Media
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleTabChange('templates')}
                    className={activeTab === 'templates' ? 'bg-accent/10 text-accent' : ''}
                  >
                    Templates
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default ContentLibraryPage;