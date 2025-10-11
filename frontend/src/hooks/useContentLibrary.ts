/**
 * Content Library Hook
 * Shared state management for media assets and templates
 */

import { useState, useCallback, useMemo } from 'react';

// Types
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

interface ContentTemplate {
  id: string;
  name: string;
  description: string;
  content: string;
  category: string;
  variables: TemplateVariable[];
  platforms: string[];
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  usageCount: number;
  userId: string;
}

interface TemplateVariable {
  name: string;
  type: 'text' | 'number' | 'url' | 'hashtag' | 'mention';
  placeholder: string;
  required: boolean;
  defaultValue?: string;
}

interface ContentLibraryStats {
  totalAssets: number;
  totalTemplates: number;
  storageUsed: number; // in bytes
  assetsUsedThisMonth: number;
  templatesUsedThisMonth: number;
}

interface UseContentLibraryReturn {
  // State
  assets: MediaAsset[];
  templates: ContentTemplate[];
  stats: ContentLibraryStats;
  isLoading: boolean;
  error: string | null;
  
  // Asset methods
  uploadAssets: (files: File[]) => Promise<MediaAsset[]>;
  deleteAsset: (assetId: string) => Promise<void>;
  updateAsset: (assetId: string, updates: Partial<MediaAsset>) => Promise<void>;
  searchAssets: (query: string) => MediaAsset[];
  
  // Template methods
  createTemplate: (template: Omit<ContentTemplate, 'id' | 'createdAt' | 'updatedAt' | 'usageCount' | 'userId'>) => Promise<ContentTemplate>;
  updateTemplate: (templateId: string, updates: Partial<ContentTemplate>) => Promise<void>;
  deleteTemplate: (templateId: string) => Promise<void>;
  searchTemplates: (query: string) => ContentTemplate[];
  useTemplate: (templateId: string) => Promise<void>; // Increment usage count
  
  // Utility methods
  getRecentAssets: (limit?: number) => MediaAsset[];
  getRecentTemplates: (limit?: number) => ContentTemplate[];
  getPopularTemplates: (limit?: number) => ContentTemplate[];
  refreshData: () => Promise<void>;
}

export const useContentLibrary = (): UseContentLibraryReturn => {
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [templates, setTemplates] = useState<ContentTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Calculate stats
  const stats = useMemo((): ContentLibraryStats => {
    const totalAssets = assets.length;
    const totalTemplates = templates.length;
    const storageUsed = assets.reduce((total, asset) => total + asset.size, 0);
    
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    const assetsUsedThisMonth = assets.filter(asset => {
      if (!asset.lastUsed) return false;
      const lastUsed = new Date(asset.lastUsed);
      return lastUsed.getMonth() === currentMonth && lastUsed.getFullYear() === currentYear;
    }).length;
    
    const templatesUsedThisMonth = templates.filter(template => {
      const updatedAt = new Date(template.updatedAt);
      return updatedAt.getMonth() === currentMonth && updatedAt.getFullYear() === currentYear;
    }).length;
    
    return {
      totalAssets,
      totalTemplates,
      storageUsed,
      assetsUsedThisMonth,
      templatesUsedThisMonth
    };
  }, [assets, templates]);

  // Asset methods
  const uploadAssets = useCallback(async (files: File[]): Promise<MediaAsset[]> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const uploadedAssets: MediaAsset[] = [];
      
      for (const file of files) {
        // In real app, upload to server
        const asset: MediaAsset = {
          id: `asset_${Date.now()}_${Math.random()}`,
          filename: `${Date.now()}_${file.name}`,
          originalName: file.name,
          type: file.type.startsWith('video/') ? 'video' : 
                file.type === 'image/gif' ? 'gif' : 'image',
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
        
        uploadedAssets.push(asset);
      }
      
      setAssets(prev => [...uploadedAssets, ...prev]);
      return uploadedAssets;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Upload failed';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const deleteAsset = useCallback(async (assetId: string): Promise<void> => {
    try {
      const asset = assets.find(a => a.id === assetId);
      if (!asset) throw new Error('Asset not found');
      
      // Security: Check ownership
      if (asset.userId !== 'user1') {
        throw new Error('Unauthorized');
      }
      
      // Clean up object URLs
      URL.revokeObjectURL(asset.url);
      if (asset.thumbnailUrl && asset.thumbnailUrl !== asset.url) {
        URL.revokeObjectURL(asset.thumbnailUrl);
      }
      
      setAssets(prev => prev.filter(a => a.id !== assetId));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Delete failed';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [assets]);

  const updateAsset = useCallback(async (assetId: string, updates: Partial<MediaAsset>): Promise<void> => {
    try {
      setAssets(prev => prev.map(asset => 
        asset.id === assetId ? { ...asset, ...updates } : asset
      ));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Update failed';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  const searchAssets = useCallback((query: string): MediaAsset[] => {
    if (!query.trim()) return assets;
    
    const term = query.toLowerCase();
    return assets.filter(asset =>
      asset.filename.toLowerCase().includes(term) ||
      asset.originalName.toLowerCase().includes(term) ||
      asset.description.toLowerCase().includes(term) ||
      asset.tags.some(tag => tag.toLowerCase().includes(term))
    );
  }, [assets]);

  // Template methods
  const createTemplate = useCallback(async (templateData: Omit<ContentTemplate, 'id' | 'createdAt' | 'updatedAt' | 'usageCount' | 'userId'>): Promise<ContentTemplate> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const template: ContentTemplate = {
        ...templateData,
        id: `template_${Date.now()}_${Math.random()}`,
        createdAt: new Date(),
        updatedAt: new Date(),
        usageCount: 0,
        userId: 'user1'
      };
      
      setTemplates(prev => [template, ...prev]);
      return template;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Create failed';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateTemplate = useCallback(async (templateId: string, updates: Partial<ContentTemplate>): Promise<void> => {
    try {
      setTemplates(prev => prev.map(template =>
        template.id === templateId 
          ? { ...template, ...updates, updatedAt: new Date() }
          : template
      ));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Update failed';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  const deleteTemplate = useCallback(async (templateId: string): Promise<void> => {
    try {
      const template = templates.find(t => t.id === templateId);
      if (!template) throw new Error('Template not found');
      
      // Security: Check ownership
      if (template.userId !== 'user1') {
        throw new Error('Unauthorized');
      }
      
      setTemplates(prev => prev.filter(t => t.id !== templateId));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Delete failed';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [templates]);

  const searchTemplates = useCallback((query: string): ContentTemplate[] => {
    if (!query.trim()) return templates;
    
    const term = query.toLowerCase();
    return templates.filter(template =>
      template.name.toLowerCase().includes(term) ||
      template.description.toLowerCase().includes(term) ||
      template.content.toLowerCase().includes(term) ||
      template.tags.some(tag => tag.toLowerCase().includes(term))
    );
  }, [templates]);

  const useTemplate = useCallback(async (templateId: string): Promise<void> => {
    try {
      setTemplates(prev => prev.map(template =>
        template.id === templateId
          ? { ...template, usageCount: template.usageCount + 1, updatedAt: new Date() }
          : template
      ));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Usage tracking failed';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  // Utility methods
  const getRecentAssets = useCallback((limit: number = 5): MediaAsset[] => {
    return [...assets]
      .sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime())
      .slice(0, limit);
  }, [assets]);

  const getRecentTemplates = useCallback((limit: number = 5): ContentTemplate[] => {
    return [...templates]
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, limit);
  }, [templates]);

  const getPopularTemplates = useCallback((limit: number = 5): ContentTemplate[] => {
    return [...templates]
      .sort((a, b) => b.usageCount - a.usageCount)
      .slice(0, limit);
  }, [templates]);

  const refreshData = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    setError(null);
    
    try {
      // In real app, fetch from API
      // For now, just clear error state
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Refresh failed';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    // State
    assets,
    templates,
    stats,
    isLoading,
    error,
    
    // Asset methods
    uploadAssets,
    deleteAsset,
    updateAsset,
    searchAssets,
    
    // Template methods
    createTemplate,
    updateTemplate,
    deleteTemplate,
    searchTemplates,
    useTemplate,
    
    // Utility methods
    getRecentAssets,
    getRecentTemplates,
    getPopularTemplates,
    refreshData
  };
};

export default useContentLibrary;