/**
 * Content Library Widget
 * Compact widget for dashboard showing recent content and quick access
 */

'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useContentLibrary } from '@/hooks/useContentLibrary';

interface ContentLibraryWidgetProps {
  onOpenLibrary?: () => void;
  showStats?: boolean;
  compact?: boolean;
}

export const ContentLibraryWidget: React.FC<ContentLibraryWidgetProps> = ({
  onOpenLibrary,
  showStats = true,
  compact = false
}) => {
  const {
    stats,
    getRecentAssets,
    getRecentTemplates,
    isLoading,
    error
  } = useContentLibrary();

  const recentAssets = getRecentAssets(compact ? 3 : 6);
  const recentTemplates = getRecentTemplates(compact ? 2 : 4);

  // Format file size
  const formatFileSize = (bytes: number): string => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  if (error) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-error text-sm">Failed to load content library</p>
          <Button variant="ghost" size="sm" className="mt-2">
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className={compact ? "text-base" : "text-lg"}>
            Content Library
          </CardTitle>
          {onOpenLibrary && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onOpenLibrary}
              className="text-accent hover:text-accent"
            >
              View All
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Stats Overview */}
        {showStats && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-text-default">{stats.totalAssets}</div>
              <div className="text-xs text-text-muted">Media Assets</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-text-default">{stats.totalTemplates}</div>
              <div className="text-xs text-text-muted">Templates</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-text-default">
                {formatFileSize(stats.storageUsed)}
              </div>
              <div className="text-xs text-text-muted">Storage Used</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-accent">
                {stats.assetsUsedThisMonth + stats.templatesUsedThisMonth}
              </div>
              <div className="text-xs text-text-muted">Used This Month</div>
            </div>
          </div>
        )}

        {/* Recent Media Assets */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-text-default">Recent Media</h4>
            <span className="text-xs text-text-muted">{recentAssets.length} items</span>
          </div>
          
          {recentAssets.length === 0 ? (
            <div className="text-center py-4">
              <svg className="w-8 h-8 mx-auto text-text-muted mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="text-xs text-text-muted">No media assets yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 lg:grid-cols-6 gap-2">
              {recentAssets.map((asset) => (
                <div
                  key={asset.id}
                  className="aspect-square rounded-lg overflow-hidden bg-muted group cursor-pointer hover:ring-2 hover:ring-accent transition-all"
                  title={asset.originalName}
                >
                  {asset.type === 'image' || asset.type === 'gif' ? (
                    <img
                      src={asset.thumbnailUrl || asset.url}
                      alt={asset.alt}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-muted">
                      <svg className="w-6 h-6 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Templates */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-text-default">Recent Templates</h4>
            <span className="text-xs text-text-muted">{recentTemplates.length} items</span>
          </div>
          
          {recentTemplates.length === 0 ? (
            <div className="text-center py-4">
              <svg className="w-8 h-8 mx-auto text-text-muted mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-xs text-text-muted">No templates yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {recentTemplates.map((template) => (
                <div
                  key={template.id}
                  className="flex items-start space-x-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 cursor-pointer transition-colors"
                  title={template.description}
                >
                  <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h5 className="text-sm font-medium text-text-default truncate">
                      {template.name}
                    </h5>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className="text-xs px-2 py-1 bg-accent/10 text-accent rounded capitalize">
                        {template.category}
                      </span>
                      <span className="text-xs text-text-muted">
                        {template.variables.length} variables
                      </span>
                      <span className="text-xs text-text-muted">
                        Used {template.usageCount} times
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="flex space-x-2 pt-2">
          <Button
            variant="ghost"
            size="sm"
            className="flex-1"
            onClick={() => {
              // In real app, would open upload dialog
              console.log('Open upload dialog');
            }}
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            Upload Media
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="flex-1"
            onClick={() => {
              // In real app, would open template creation
              console.log('Open template creation');
            }}
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Template
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ContentLibraryWidget;