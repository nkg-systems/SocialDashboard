/**
 * Scheduled Posts List Component
 * Displays and manages scheduled posts with filtering and sorting capabilities
 */

'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface ScheduledPost {
  id: string;
  title: string;
  content: string;
  platforms: string[];
  scheduledTime: Date;
  status: 'scheduled' | 'published' | 'failed' | 'draft';
  userId: string;
  createdAt: Date;
  repeatType?: 'none' | 'daily' | 'weekly' | 'monthly';
  media?: string[];
}

interface ScheduledPostsListProps {
  posts: ScheduledPost[];
  onEditPost: (post: ScheduledPost) => void;
  onDeletePost: (postId: string) => void;
  onDuplicatePost: (post: ScheduledPost) => void;
  onPublishNow: (postId: string) => void;
  loading?: boolean;
  error?: string;
}

type SortField = 'scheduledTime' | 'createdAt' | 'title' | 'status';
type SortDirection = 'asc' | 'desc';
type FilterStatus = 'all' | 'scheduled' | 'published' | 'failed' | 'draft';

export const ScheduledPostsList: React.FC<ScheduledPostsListProps> = ({
  posts,
  onEditPost,
  onDeletePost,
  onDuplicatePost,
  onPublishNow,
  loading = false,
  error
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all');
  const [sortField, setSortField] = useState<SortField>('scheduledTime');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [selectedPosts, setSelectedPosts] = useState<string[]>([]);

  // Filter and sort posts
  const filteredAndSortedPosts = useMemo(() => {
    let filtered = posts;

    // Apply search filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(post =>
        post.title.toLowerCase().includes(term) ||
        post.content.toLowerCase().includes(term) ||
        post.platforms.some(platform => platform.toLowerCase().includes(term))
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(post => post.status === statusFilter);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;

      switch (sortField) {
        case 'scheduledTime':
          aValue = new Date(a.scheduledTime).getTime();
          bValue = new Date(b.scheduledTime).getTime();
          break;
        case 'createdAt':
          aValue = new Date(a.createdAt).getTime();
          bValue = new Date(b.createdAt).getTime();
          break;
        case 'title':
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
          break;
        case 'status':
          aValue = a.status;
          bValue = b.status;
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [posts, searchTerm, statusFilter, sortField, sortDirection]);

  // Handle search input
  const handleSearchChange = useCallback((value: string) => {
    // Security: Basic input sanitization
    const sanitized = value.replace(/[<>]/g, '').slice(0, 100);
    setSearchTerm(sanitized);
  }, []);

  // Handle sort change
  const handleSort = useCallback((field: SortField) => {
    if (field === sortField) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  }, [sortField]);

  // Handle post selection
  const handlePostSelection = useCallback((postId: string, selected: boolean) => {
    // Security: Validate post exists
    const postExists = posts.some(p => p.id === postId);
    if (!postExists) return;

    setSelectedPosts(prev =>
      selected
        ? [...prev, postId]
        : prev.filter(id => id !== postId)
    );
  }, [posts]);

  // Handle select all
  const handleSelectAll = useCallback((selected: boolean) => {
    setSelectedPosts(selected ? filteredAndSortedPosts.map(p => p.id) : []);
  }, [filteredAndSortedPosts]);

  // Handle bulk actions
  const handleBulkDelete = useCallback(() => {
    if (selectedPosts.length === 0) return;

    const confirmed = confirm(
      `Delete ${selectedPosts.length} selected posts?\n\nThis action cannot be undone.`
    );

    if (confirmed) {
      selectedPosts.forEach(postId => {
        // Security: Validate each post ID before deletion
        const postExists = posts.some(p => p.id === postId);
        if (postExists) {
          onDeletePost(postId);
        }
      });
      setSelectedPosts([]);
    }
  }, [selectedPosts, posts, onDeletePost]);

  // Get status color
  const getStatusColor = useCallback((status: ScheduledPost['status']) => {
    const colors = {
      scheduled: 'text-accent bg-accent/10',
      published: 'text-success bg-success/10',
      failed: 'text-error bg-error/10',
      draft: 'text-warning bg-warning/10'
    };
    return colors[status] || 'text-text-muted bg-muted/10';
  }, []);

  // Get platform icons
  const getPlatformIcons = useCallback((platforms: string[]) => {
    const icons = {
      twitter: '🐦',
      facebook: '📘',
      instagram: '📷',
      linkedin: '💼',
      tiktok: '🎵',
      youtube: '📺'
    };
    
    return platforms.slice(0, 3).map(platform => 
      icons[platform as keyof typeof icons] || '📱'
    ).join(' ');
  }, []);

  // Format date
  const formatDate = useCallback((date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    }).format(new Date(date));
  }, []);

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-accent"></div>
            <span className="text-text-muted">Loading scheduled posts...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-error/20 bg-error/5">
        <CardContent className="flex items-center space-x-2 py-6">
          <svg className="w-5 h-5 text-error" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <span className="text-error">{error}</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Scheduled Posts</CardTitle>
          {selectedPosts.length > 0 && (
            <div className="flex items-center space-x-2">
              <span className="text-sm text-text-muted">
                {selectedPosts.length} selected
              </span>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleBulkDelete}
              >
                Delete Selected
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <Label htmlFor="search" className="sr-only">Search posts</Label>
            <Input
              id="search"
              placeholder="Search posts..."
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="status-filter" className="sr-only">Filter by status</Label>
            <select
              id="status-filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as FilterStatus)}
              className="p-2 border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-accent"
            >
              <option value="all">All Status</option>
              <option value="scheduled">Scheduled</option>
              <option value="published">Published</option>
              <option value="failed">Failed</option>
              <option value="draft">Draft</option>
            </select>
          </div>
        </div>

        {/* Posts Table */}
        {filteredAndSortedPosts.length === 0 ? (
          <div className="text-center py-12 text-text-muted">
            <svg className="w-12 h-12 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p>No scheduled posts found</p>
            <p className="text-sm mt-1">
              {searchTerm || statusFilter !== 'all' 
                ? 'Try adjusting your filters' 
                : 'Create your first scheduled post'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-2">
                    <input
                      type="checkbox"
                      checked={selectedPosts.length === filteredAndSortedPosts.length && filteredAndSortedPosts.length > 0}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      className="rounded border-border focus:ring-accent"
                    />
                  </th>
                  <th className="text-left p-2">
                    <button
                      onClick={() => handleSort('title')}
                      className="flex items-center space-x-1 hover:text-accent"
                    >
                      <span>Title</span>
                      {sortField === 'title' && (
                        <svg className={`w-4 h-4 transform ${sortDirection === 'desc' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                        </svg>
                      )}
                    </button>
                  </th>
                  <th className="text-left p-2">Platforms</th>
                  <th className="text-left p-2">
                    <button
                      onClick={() => handleSort('scheduledTime')}
                      className="flex items-center space-x-1 hover:text-accent"
                    >
                      <span>Scheduled</span>
                      {sortField === 'scheduledTime' && (
                        <svg className={`w-4 h-4 transform ${sortDirection === 'desc' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                        </svg>
                      )}
                    </button>
                  </th>
                  <th className="text-left p-2">
                    <button
                      onClick={() => handleSort('status')}
                      className="flex items-center space-x-1 hover:text-accent"
                    >
                      <span>Status</span>
                      {sortField === 'status' && (
                        <svg className={`w-4 h-4 transform ${sortDirection === 'desc' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                        </svg>
                      )}
                    </button>
                  </th>
                  <th className="text-left p-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredAndSortedPosts.map((post) => (
                  <tr key={post.id} className="border-b border-border hover:bg-muted/20">
                    <td className="p-2">
                      <input
                        type="checkbox"
                        checked={selectedPosts.includes(post.id)}
                        onChange={(e) => handlePostSelection(post.id, e.target.checked)}
                        className="rounded border-border focus:ring-accent"
                      />
                    </td>
                    <td className="p-2">
                      <div>
                        <p className="font-medium text-text-primary truncate max-w-[200px]" title={post.title}>
                          {post.title}
                        </p>
                        <p className="text-sm text-text-muted truncate max-w-[300px]" title={post.content}>
                          {post.content}
                        </p>
                        {post.media && post.media.length > 0 && (
                          <div className="flex items-center space-x-1 mt-1">
                            <svg className="w-3 h-3 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span className="text-xs text-text-muted">{post.media.length} media</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="p-2">
                      <span className="text-sm">
                        {getPlatformIcons(post.platforms)}
                      </span>
                    </td>
                    <td className="p-2">
                      <div>
                        <p className="text-sm text-text-primary">
                          {formatDate(post.scheduledTime)}
                        </p>
                        {post.repeatType && post.repeatType !== 'none' && (
                          <p className="text-xs text-text-muted">
                            Repeats {post.repeatType}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="p-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(post.status)}`}>
                        {post.status.charAt(0).toUpperCase() + post.status.slice(1)}
                      </span>
                    </td>
                    <td className="p-2">
                      <div className="flex items-center space-x-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onEditPost(post)}
                          disabled={post.status === 'published'}
                          title="Edit post"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onDuplicatePost(post)}
                          title="Duplicate post"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        </Button>
                        {post.status === 'scheduled' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onPublishNow(post.id)}
                            title="Publish now"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                            </svg>
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            const confirmed = confirm('Delete this post?');
                            if (confirmed) onDeletePost(post.id);
                          }}
                          title="Delete post"
                          className="text-error hover:text-error"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ScheduledPostsList;