/**
 * Media Asset Manager Component
 * Manages media files with secure upload, preview, and organization features
 */

'use client';

import React, { useState, useCallback, useMemo, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { validateImageFile, sanitizeHtml } from '@/utils/validation';

interface MediaAsset {
  id: string;
  filename: string;
  originalName: string;
  type: 'image' | 'video' | 'gif';
  mimeType: string;
  size: number;
  url: string;
  thumbnailUrl?: string;
  dimensions?: {
    width: number;
    height: number;
  };
  uploadedAt: Date;
  lastUsed?: Date;
  tags: string[];
  description: string;
  alt: string;
  userId: string;
}

interface MediaFolder {
  id: string;
  name: string;
  description: string;
  createdAt: Date;
  assetCount: number;
  userId: string;
}

type ViewMode = 'grid' | 'list';
type SortField = 'uploadedAt' | 'filename' | 'size' | 'lastUsed';
type SortDirection = 'asc' | 'desc';
type FilterType = 'all' | 'image' | 'video' | 'gif';

interface MediaAssetManagerProps {
  onSelectAsset?: (asset: MediaAsset) => void;
  selectionMode?: boolean;
  maxSelections?: number;
}

export const MediaAssetManager: React.FC<MediaAssetManagerProps> = ({
  onSelectAsset,
  selectionMode = false,
  maxSelections = 10
}) => {
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [folders, setFolders] = useState<MediaFolder[]>([
    {
      id: 'default',
      name: 'All Media',
      description: 'All uploaded media assets',
      createdAt: new Date(),
      assetCount: 0,
      userId: 'user1'
    }
  ]);
  const [selectedFolder, setSelectedFolder] = useState('default');
  const [selectedAssets, setSelectedAssets] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortField, setSortField] = useState<SortField>('uploadedAt');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showUploadZone, setShowUploadZone] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  // Filter and sort assets
  const filteredAndSortedAssets = useMemo(() => {
    let filtered = assets;

    // Apply folder filter
    if (selectedFolder !== 'default') {
      // In real app, assets would have folderId property
      filtered = assets; // For now, show all assets
    }

    // Apply type filter
    if (filterType !== 'all') {
      filtered = filtered.filter(asset => asset.type === filterType);
    }

    // Apply search filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(asset =>
        asset.filename.toLowerCase().includes(term) ||
        asset.originalName.toLowerCase().includes(term) ||
        asset.description.toLowerCase().includes(term) ||
        asset.tags.some(tag => tag.toLowerCase().includes(term))
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;

      switch (sortField) {
        case 'uploadedAt':
          aValue = new Date(a.uploadedAt).getTime();
          bValue = new Date(b.uploadedAt).getTime();
          break;
        case 'filename':
          aValue = a.filename.toLowerCase();
          bValue = b.filename.toLowerCase();
          break;
        case 'size':
          aValue = a.size;
          bValue = b.size;
          break;
        case 'lastUsed':
          aValue = a.lastUsed ? new Date(a.lastUsed).getTime() : 0;
          bValue = b.lastUsed ? new Date(b.lastUsed).getTime() : 0;
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [assets, selectedFolder, filterType, searchTerm, sortField, sortDirection]);

  // Handle file upload
  const handleFileUpload = useCallback(async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    
    // Security: Validate all files first
    const validFiles: File[] = [];
    const invalidFiles: string[] = [];
    
    fileArray.forEach(file => {
      // Enhanced file validation
      if (!validateImageFile(file) && !isValidVideoFile(file)) {
        invalidFiles.push(`${file.name}: invalid file type or size`);
      } else if (file.size > 100 * 1024 * 1024) { // 100MB limit
        invalidFiles.push(`${file.name}: file too large (max 100MB)`);
      } else {
        validFiles.push(file);
      }
    });

    if (invalidFiles.length > 0) {
      alert(`Invalid files:\n${invalidFiles.join('\n')}`);
      return;
    }

    if (validFiles.length === 0) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const uploadedAssets: MediaAsset[] = [];

      for (let i = 0; i < validFiles.length; i++) {
        const file = validFiles[i];
        
        // Simulate upload progress
        setUploadProgress(((i + 1) / validFiles.length) * 100);
        
        // In real app, upload to server
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const asset: MediaAsset = {
          id: `asset_${Date.now()}_${i}`,
          filename: `${Date.now()}_${file.name}`,
          originalName: file.name,
          type: getFileType(file),
          mimeType: file.type,
          size: file.size,
          url: URL.createObjectURL(file),
          thumbnailUrl: URL.createObjectURL(file),
          uploadedAt: new Date(),
          tags: [],
          description: '',
          alt: file.name.split('.')[0],
          userId: 'user1'
        };

        // Get dimensions for images
        if (asset.type === 'image') {
          asset.dimensions = await getImageDimensions(file);
        }

        uploadedAssets.push(asset);
      }

      setAssets(prev => [...uploadedAssets, ...prev]);
      setShowUploadZone(false);

    } catch (error) {
      console.error('Upload failed:', error);
      alert('Upload failed. Please try again.');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  }, []);

  // Validate video files
  const isValidVideoFile = useCallback((file: File): boolean => {
    const validVideoTypes = ['video/mp4', 'video/webm', 'video/ogg'];
    return validVideoTypes.includes(file.type) && file.size <= 100 * 1024 * 1024;
  }, []);

  // Get file type from file
  const getFileType = useCallback((file: File): MediaAsset['type'] => {
    if (file.type.startsWith('video/')) return 'video';
    if (file.type === 'image/gif') return 'gif';
    return 'image';
  }, []);

  // Get image dimensions
  const getImageDimensions = useCallback((file: File): Promise<{ width: number; height: number }> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        resolve({ width: img.naturalWidth, height: img.naturalHeight });
        URL.revokeObjectURL(img.src);
      };
      img.onerror = () => resolve({ width: 0, height: 0 });
      img.src = URL.createObjectURL(file);
    });
  }, []);

  // Handle drag and drop
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFileUpload(files);
    }
  }, [handleFileUpload]);

  // Handle asset selection
  const handleAssetSelection = useCallback((assetId: string) => {
    if (!selectionMode) return;

    const asset = assets.find(a => a.id === assetId);
    if (!asset) return;

    if (maxSelections === 1) {
      setSelectedAssets([assetId]);
      onSelectAsset?.(asset);
    } else {
      setSelectedAssets(prev => {
        const newSelection = prev.includes(assetId)
          ? prev.filter(id => id !== assetId)
          : prev.length < maxSelections
          ? [...prev, assetId]
          : prev;
        
        return newSelection;
      });
    }
  }, [selectionMode, maxSelections, assets, onSelectAsset]);

  // Handle asset deletion
  const handleAssetDelete = useCallback((assetId: string) => {
    // Security: Validate asset exists and belongs to user
    const asset = assets.find(a => a.id === assetId);
    if (!asset || asset.userId !== 'user1') return;

    const confirmed = confirm(`Delete "${asset.originalName}"? This action cannot be undone.`);
    if (!confirmed) return;

    // Revoke object URL to prevent memory leaks
    URL.revokeObjectURL(asset.url);
    if (asset.thumbnailUrl && asset.thumbnailUrl !== asset.url) {
      URL.revokeObjectURL(asset.thumbnailUrl);
    }

    setAssets(prev => prev.filter(a => a.id !== assetId));
    setSelectedAssets(prev => prev.filter(id => id !== assetId));
  }, [assets]);

  // Handle search input
  const handleSearchChange = useCallback((value: string) => {
    // Security: Sanitize search input
    const sanitized = sanitizeHtml(value).slice(0, 100);
    setSearchTerm(sanitized);
  }, []);

  // Format file size
  const formatFileSize = useCallback((bytes: number): string => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  }, []);

  // Format date
  const formatDate = useCallback((date: Date): string => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    }).format(new Date(date));
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="sm3d-text-h2">Media Library</h2>
          <p className="text-sm text-text-muted mt-1">
            Manage your media assets and organize content
          </p>
        </div>
        <div className="flex items-center space-x-2">
          {/* View Toggle */}
          <div className="flex bg-muted rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-md transition-colors ${
                viewMode === 'grid'
                  ? 'bg-background text-text-primary shadow-sm'
                  : 'text-text-muted hover:text-text-primary'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-md transition-colors ${
                viewMode === 'list'
                  ? 'bg-background text-text-primary shadow-sm'
                  : 'text-text-muted hover:text-text-primary'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
            </button>
          </div>

          <Button onClick={() => setShowUploadZone(true)}>
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            Upload Media
          </Button>
        </div>
      </div>

      {/* Upload Zone */}
      {showUploadZone && (
        <Card className="border-dashed border-2 border-accent">
          <CardContent className="p-6">
            <div
              ref={dropZoneRef}
              className={`relative border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
                dragActive
                  ? 'border-accent bg-accent/5'
                  : 'border-muted hover:border-accent/50 hover:bg-muted/20'
              }`}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            >
              {isUploading ? (
                <div className="space-y-4">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto"></div>
                  <p className="text-text-primary">Uploading... {Math.round(uploadProgress)}%</p>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="bg-accent h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <svg className="w-16 h-16 mx-auto text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <div>
                    <p className="text-lg font-medium text-text-primary">Drop files here or click to upload</p>
                    <p className="text-text-muted mt-1">Supports JPG, PNG, GIF, WebP, MP4 up to 100MB</p>
                  </div>
                  <Button onClick={() => fileInputRef.current?.click()}>
                    Choose Files
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*,video/mp4,video/webm,video/ogg"
                    onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
                    className="hidden"
                  />
                </div>
              )}
            </div>
            <div className="flex justify-end mt-4">
              <Button variant="ghost" onClick={() => setShowUploadZone(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Label htmlFor="search" className="sr-only">Search media</Label>
              <Input
                id="search"
                placeholder="Search media..."
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as FilterType)}
                className="p-2 border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-accent"
              >
                <option value="all">All Types</option>
                <option value="image">Images</option>
                <option value="video">Videos</option>
                <option value="gif">GIFs</option>
              </select>
              <select
                value={`${sortField}-${sortDirection}`}
                onChange={(e) => {
                  const [field, direction] = e.target.value.split('-') as [SortField, SortDirection];
                  setSortField(field);
                  setSortDirection(direction);
                }}
                className="p-2 border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-accent"
              >
                <option value="uploadedAt-desc">Newest First</option>
                <option value="uploadedAt-asc">Oldest First</option>
                <option value="filename-asc">Name A-Z</option>
                <option value="filename-desc">Name Z-A</option>
                <option value="size-desc">Largest First</option>
                <option value="size-asc">Smallest First</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Assets Grid/List */}
      {filteredAndSortedAssets.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <svg className="w-16 h-16 mx-auto text-text-muted mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-text-muted">No media assets found</p>
            <p className="text-sm text-text-muted mt-1">
              {searchTerm || filterType !== 'all' 
                ? 'Try adjusting your filters' 
                : 'Upload your first media file to get started'}
            </p>
          </CardContent>
        </Card>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          {filteredAndSortedAssets.map((asset) => (
            <div
              key={asset.id}
              className={`relative group bg-card rounded-lg border overflow-hidden cursor-pointer transition-all hover:shadow-lg ${
                selectedAssets.includes(asset.id) ? 'ring-2 ring-accent' : ''
              }`}
              onClick={() => handleAssetSelection(asset.id)}
            >
              <div className="aspect-square bg-muted flex items-center justify-center">
                {asset.type === 'video' ? (
                  <div className="relative w-full h-full">
                    <video
                      src={asset.url}
                      className="w-full h-full object-cover"
                      muted
                      preload="metadata"
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="bg-black/50 rounded-full p-2">
                        <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z"/>
                        </svg>
                      </div>
                    </div>
                  </div>
                ) : (
                  <img
                    src={asset.thumbnailUrl || asset.url}
                    alt={asset.alt}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                )}
              </div>
              
              {/* Overlay */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors">
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAssetDelete(asset.id);
                    }}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </Button>
                </div>
              </div>

              {/* Info */}
              <div className="p-2">
                <p className="text-sm font-medium text-text-primary truncate" title={asset.originalName}>
                  {asset.originalName}
                </p>
                <p className="text-xs text-text-muted">
                  {formatFileSize(asset.size)}
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left p-4">Preview</th>
                    <th className="text-left p-4">Name</th>
                    <th className="text-left p-4">Type</th>
                    <th className="text-left p-4">Size</th>
                    <th className="text-left p-4">Uploaded</th>
                    <th className="text-left p-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAndSortedAssets.map((asset) => (
                    <tr
                      key={asset.id}
                      className={`border-b border-border hover:bg-muted/20 cursor-pointer ${
                        selectedAssets.includes(asset.id) ? 'bg-accent/5' : ''
                      }`}
                      onClick={() => handleAssetSelection(asset.id)}
                    >
                      <td className="p-4">
                        <div className="w-12 h-12 bg-muted rounded overflow-hidden">
                          {asset.type === 'video' ? (
                            <video
                              src={asset.url}
                              className="w-full h-full object-cover"
                              muted
                              preload="metadata"
                            />
                          ) : (
                            <img
                              src={asset.thumbnailUrl || asset.url}
                              alt={asset.alt}
                              className="w-full h-full object-cover"
                              loading="lazy"
                            />
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <p className="font-medium text-text-primary truncate max-w-[200px]" title={asset.originalName}>
                          {asset.originalName}
                        </p>
                      </td>
                      <td className="p-4">
                        <span className="px-2 py-1 bg-muted text-text-muted rounded text-xs uppercase">
                          {asset.type}
                        </span>
                      </td>
                      <td className="p-4 text-text-muted">
                        {formatFileSize(asset.size)}
                      </td>
                      <td className="p-4 text-text-muted">
                        {formatDate(asset.uploadedAt)}
                      </td>
                      <td className="p-4">
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAssetDelete(asset.id);
                          }}
                        >
                          Delete
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Selection Info */}
      {selectionMode && selectedAssets.length > 0 && (
        <div className="fixed bottom-6 right-6 bg-card border border-border rounded-lg p-4 shadow-lg">
          <p className="text-sm text-text-primary">
            {selectedAssets.length} of {maxSelections} assets selected
          </p>
        </div>
      )}
    </div>
  );
};

export default MediaAssetManager;