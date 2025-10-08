'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Post, PostStatus } from '@/types';
import { usePosts, usePostActions } from '@/hooks/usePosts';

interface PostListProps {
  onEditPost: (post: Post) => void;
  onCreateNew: () => void;
}

interface FilterOptions {
  status: PostStatus | 'all';
  searchTerm: string;
  platform: string;
  dateRange: 'today' | 'week' | 'month' | 'all';
}

const STATUS_COLORS = {
  draft: 'text-text-muted',
  scheduled: 'text-info',
  published: 'text-success',
  failed: 'text-error',
  publishing: 'text-warning'
} as const;

const STATUS_BACKGROUNDS = {
  draft: 'bg-text-muted/10',
  scheduled: 'bg-info/10',
  published: 'bg-success/10',
  failed: 'bg-error/10',
  publishing: 'bg-warning/10'
} as const;

export const PostList: React.FC<PostListProps> = ({ onEditPost, onCreateNew }) => {
  const [filters, setFilters] = useState<FilterOptions>({
    status: 'all',
    searchTerm: '',
    platform: 'all',
    dateRange: 'all'
  });

  const [selectedPosts, setSelectedPosts] = useState<string[]>([]);
  const [bulkActionLoading, setBulkActionLoading] = useState(false);

  const { data: posts, loading, error, refetch, loadMore, hasMore } = usePosts({
    status: filters.status === 'all' ? undefined : filters.status,
    page: 1,
    size: 20
  });

  const { 
    deletePost, 
    publishPost, 
    duplicatePost,
    deleting,
    publishing,
    error: actionError,
    clearError
  } = usePostActions();

  // Filter posts based on client-side filters
  const filteredPosts = useMemo(() => {
    return posts.filter(post => {
      // Search filter
      if (filters.searchTerm) {
        const searchLower = filters.searchTerm.toLowerCase();
        if (!post.content.toLowerCase().includes(searchLower) &&
            !post.hashtags.some(tag => tag.toLowerCase().includes(searchLower))) {
          return false;
        }
      }

      // Date range filter
      if (filters.dateRange !== 'all') {
        const postDate = new Date(post.created_at);
        const now = new Date();
        let daysAgo: number;

        switch (filters.dateRange) {
          case 'today':
            daysAgo = 1;
            break;
          case 'week':
            daysAgo = 7;
            break;
          case 'month':
            daysAgo = 30;
            break;
          default:
            daysAgo = 0;
        }

        if (daysAgo > 0) {
          const cutoffDate = new Date(now.getTime() - (daysAgo * 24 * 60 * 60 * 1000));
          if (postDate < cutoffDate) {
            return false;
          }
        }
      }

      return true;
    });
  }, [posts, filters]);

  // Handle post selection
  const handleSelectPost = useCallback((postId: string) => {
    setSelectedPosts(prev => 
      prev.includes(postId) 
        ? prev.filter(id => id !== postId)
        : [...prev, postId]
    );
  }, []);

  const handleSelectAll = useCallback(() => {
    setSelectedPosts(prev => 
      prev.length === filteredPosts.length 
        ? [] 
        : filteredPosts.map(post => post.id)
    );
  }, [filteredPosts]);

  // Handle individual post actions
  const handleDeletePost = useCallback(async (postId: string) => {
    if (confirm('Are you sure you want to delete this post?')) {
      try {
        await deletePost(postId);
        await refetch();
      } catch (error) {
        console.error('Failed to delete post:', error);
      }
    }
  }, [deletePost, refetch]);

  const handlePublishPost = useCallback(async (postId: string) => {
    try {
      await publishPost(postId, true);
      await refetch();
    } catch (error) {
      console.error('Failed to publish post:', error);
    }
  }, [publishPost, refetch]);

  const handleDuplicatePost = useCallback(async (postId: string) => {
    try {
      await duplicatePost(postId);
      await refetch();
    } catch (error) {
      console.error('Failed to duplicate post:', error);
    }
  }, [duplicatePost, refetch]);

  // Handle bulk actions
  const handleBulkDelete = useCallback(async () => {
    if (selectedPosts.length === 0) return;
    
    if (confirm(`Are you sure you want to delete ${selectedPosts.length} posts?`)) {
      setBulkActionLoading(true);
      try {
        await Promise.all(selectedPosts.map(postId => deletePost(postId)));
        setSelectedPosts([]);
        await refetch();
      } catch (error) {
        console.error('Failed to delete posts:', error);
      } finally {
        setBulkActionLoading(false);
      }
    }
  }, [selectedPosts, deletePost, refetch]);

  const handleBulkPublish = useCallback(async () => {
    if (selectedPosts.length === 0) return;
    
    setBulkActionLoading(true);
    try {
      await Promise.all(
        selectedPosts
          .filter(postId => {
            const post = posts.find(p => p.id === postId);
            return post?.status === 'draft';
          })
          .map(postId => publishPost(postId, true))
      );
      setSelectedPosts([]);
      await refetch();
    } catch (error) {
      console.error('Failed to publish posts:', error);
    } finally {
      setBulkActionLoading(false);
    }
  }, [selectedPosts, posts, publishPost, refetch]);

  // Format date for display
  const formatDate = useCallback((dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      const diffInMinutes = Math.floor(diffInHours * 60);
      return `${diffInMinutes}m ago`;
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays}d ago`;
    }
  }, []);

  // Truncate content for display
  const truncateContent = useCallback((content: string, maxLength: number = 150): string => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="sm3d-text-h1">Posts</h1>
          <p className="sm3d-text-body mt-1">
            Manage and publish your social media content
          </p>
        </div>
        <Button onClick={onCreateNew}>
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Create Post
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Search
            </label>
            <input
              type="text"
              value={filters.searchTerm}
              onChange={(e) => setFilters(prev => ({ ...prev, searchTerm: e.target.value }))}
              placeholder="Search posts..."
              className="sm3d-input w-full"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Status
            </label>
            <select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value as FilterOptions['status'] }))}
              className="sm3d-input w-full"
            >
              <option value="all">All Status</option>
              <option value="draft">Draft</option>
              <option value="scheduled">Scheduled</option>
              <option value="published">Published</option>
              <option value="failed">Failed</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Date Range
            </label>
            <select
              value={filters.dateRange}
              onChange={(e) => setFilters(prev => ({ ...prev, dateRange: e.target.value as FilterOptions['dateRange'] }))}
              className="sm3d-input w-full"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
            </select>
          </div>

          <div className="flex items-end">
            <Button
              variant="secondary"
              onClick={() => setFilters({ status: 'all', searchTerm: '', platform: 'all', dateRange: 'all' })}
              className="w-full"
            >
              Clear Filters
            </Button>
          </div>
        </div>
      </Card>

      {/* Bulk Actions */}
      {selectedPosts.length > 0 && (
        <Card>
          <div className="flex items-center justify-between">
            <span className="text-sm text-text-secondary">
              {selectedPosts.length} post{selectedPosts.length !== 1 ? 's' : ''} selected
            </span>
            <div className="flex space-x-2">
              <Button
                variant="secondary"
                onClick={handleBulkPublish}
                disabled={bulkActionLoading}
                size="sm"
              >
                Publish Selected
              </Button>
              <Button
                variant="secondary"
                onClick={handleBulkDelete}
                disabled={bulkActionLoading}
                size="sm"
              >
                Delete Selected
              </Button>
              <Button
                variant="secondary"
                onClick={() => setSelectedPosts([])}
                size="sm"
              >
                Clear Selection
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Error Display */}
      {(error || actionError) && (
        <Card>
          <div className="bg-error/10 border border-error/20 rounded-button p-4">
            <div className="flex items-center justify-between">
              <p className="text-error text-sm">
                {error || actionError}
              </p>
              <button
                onClick={clearError}
                className="text-error hover:text-error/80"
              >
                ×
              </button>
            </div>
          </div>
        </Card>
      )}

      {/* Posts List */}
      <div className="space-y-4">
        {loading ? (
          // Loading skeleton
          Array.from({ length: 5 }, (_, i) => (
            <Card key={i} className="animate-pulse">
              <div className="flex items-start space-x-4">
                <div className="w-4 h-4 bg-border rounded"></div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <div className="h-4 bg-border rounded w-32"></div>
                    <div className="h-6 bg-border rounded w-20"></div>
                  </div>
                  <div className="h-4 bg-border rounded w-full mb-2"></div>
                  <div className="h-4 bg-border rounded w-3/4"></div>
                </div>
              </div>
            </Card>
          ))
        ) : filteredPosts.length === 0 ? (
          <Card>
            <div className="text-center py-12">
              <svg className="w-16 h-16 mx-auto mb-4 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="text-lg font-medium text-text-primary mb-2">
                No posts found
              </h3>
              <p className="text-text-muted mb-4">
                {posts.length === 0 
                  ? "You haven't created any posts yet."
                  : "No posts match your current filters."
                }
              </p>
              {posts.length === 0 && (
                <Button onClick={onCreateNew}>
                  Create Your First Post
                </Button>
              )}
            </div>
          </Card>
        ) : (
          <>
            {/* Select All */}
            <div className="flex items-center space-x-2 px-4">
              <input
                type="checkbox"
                checked={selectedPosts.length === filteredPosts.length && filteredPosts.length > 0}
                onChange={handleSelectAll}
                className="rounded border-border"
              />
              <label className="text-sm text-text-secondary">
                Select all ({filteredPosts.length} posts)
              </label>
            </div>

            {/* Posts */}
            {filteredPosts.map((post) => (
              <Card key={post.id} className="hover:bg-surface/50 transition-colors">
                <div className="flex items-start space-x-4">
                  <input
                    type="checkbox"
                    checked={selectedPosts.includes(post.id)}
                    onChange={() => handleSelectPost(post.id)}
                    className="mt-1 rounded border-border"
                  />
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_BACKGROUNDS[post.status]} ${STATUS_COLORS[post.status]}`}>
                          {post.status.charAt(0).toUpperCase() + post.status.slice(1)}
                        </span>
                        {post.scheduled_at && (
                          <span className="text-xs text-text-muted">
                            Scheduled for {new Date(post.scheduled_at).toLocaleString()}
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-text-muted">
                        {formatDate(post.created_at)}
                      </span>
                    </div>
                    
                    <div className="mb-3">
                      <p className="text-sm text-text-primary">
                        {truncateContent(post.content)}
                      </p>
                      {post.hashtags.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {post.hashtags.slice(0, 5).map((hashtag, index) => (
                            <span key={index} className="text-xs text-accent">
                              #{hashtag}
                            </span>
                          ))}
                          {post.hashtags.length > 5 && (
                            <span className="text-xs text-text-muted">
                              +{post.hashtags.length - 5} more
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {post.engagement_metrics && (
                      <div className="flex items-center space-x-4 mb-3 text-xs text-text-muted">
                        <span>❤️ {post.engagement_metrics.likes}</span>
                        <span>💬 {post.engagement_metrics.comments}</span>
                        <span>🔄 {post.engagement_metrics.shares}</span>
                        {post.engagement_metrics.views && (
                          <span>👁️ {post.engagement_metrics.views}</span>
                        )}
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between">
                      <div className="text-xs text-text-muted">
                        {post.media_urls.length > 0 && (
                          <span className="mr-3">📎 {post.media_urls.length} media</span>
                        )}
                        {post.ai_generated && (
                          <span className="mr-3">🤖 AI Generated</span>
                        )}
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        {post.status === 'draft' && (
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => handlePublishPost(post.id)}
                            disabled={publishing === post.id}
                          >
                            {publishing === post.id ? 'Publishing...' : 'Publish'}
                          </Button>
                        )}
                        
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => handleDuplicatePost(post.id)}
                        >
                          Duplicate
                        </Button>
                        
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => onEditPost(post)}
                        >
                          Edit
                        </Button>
                        
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => handleDeletePost(post.id)}
                          disabled={deleting === post.id}
                        >
                          {deleting === post.id ? 'Deleting...' : 'Delete'}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}

            {/* Load More */}
            {hasMore && (
              <div className="flex justify-center">
                <Button
                  variant="secondary"
                  onClick={loadMore}
                  disabled={loading}
                >
                  {loading ? 'Loading...' : 'Load More'}
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};