/**
 * React hooks for post management
 */

import { useState, useEffect, useCallback } from 'react';
import { Post, PostCreate, PostUpdate, PaginatedResponse } from '@/types';
import { apiClient, ApiError } from '@/lib/apiClient';

interface UsePostsOptions {
  status?: 'draft' | 'scheduled' | 'published' | 'failed';
  page?: number;
  size?: number;
}

interface UsePostsReturn {
  data: Post[];
  loading: boolean;
  error: string | null;
  pagination: {
    total: number;
    page: number;
    size: number;
    pages: number;
  } | null;
  refetch: () => Promise<void>;
  loadMore: () => Promise<void>;
  hasMore: boolean;
}

export function usePosts(options: UsePostsOptions = {}): UsePostsReturn {
  const [data, setData] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<{
    total: number;
    page: number;
    size: number;
    pages: number;
  } | null>(null);

  const { status, page = 1, size = 20 } = options;

  const fetchPosts = useCallback(async (pageToFetch: number = page, append: boolean = false) => {
    try {
      setError(null);
      if (!append) setLoading(true);

      const params = new URLSearchParams({
        page: pageToFetch.toString(),
        size: size.toString(),
      });

      if (status) {
        params.append('status', status);
      }

      const response = await apiClient.get<PaginatedResponse<Post>>(
        `/posts?${params.toString()}`
      );

      if (append) {
        setData(prev => [...prev, ...response.items]);
      } else {
        setData(response.items);
      }

      setPagination({
        total: response.total,
        page: response.page,
        size: response.size,
        pages: response.pages,
      });

    } catch (err) {
      const errorMessage = err instanceof ApiError ? err.message : 'Failed to fetch posts';
      setError(errorMessage);
      console.error('Posts fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [page, size, status]);

  const loadMore = useCallback(async () => {
    if (!pagination || pagination.page >= pagination.pages) return;
    await fetchPosts(pagination.page + 1, true);
  }, [fetchPosts, pagination]);

  const hasMore = pagination ? pagination.page < pagination.pages : false;

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  return {
    data,
    loading,
    error,
    pagination,
    refetch: () => fetchPosts(),
    loadMore,
    hasMore,
  };
}

interface UsePostActionsReturn {
  creating: boolean;
  updating: boolean;
  deleting: string | null;
  publishing: string | null;
  createPost: (postData: PostCreate) => Promise<Post>;
  updatePost: (id: string, postData: PostUpdate) => Promise<Post>;
  deletePost: (id: string) => Promise<void>;
  publishPost: (id: string, publishNow?: boolean) => Promise<void>;
  duplicatePost: (id: string) => Promise<Post>;
  error: string | null;
  clearError: () => void;
}

export function usePostActions(): UsePostActionsReturn {
  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [publishing, setPublishing] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const createPost = useCallback(async (postData: PostCreate): Promise<Post> => {
    try {
      setError(null);
      setCreating(true);
      
      const post = await apiClient.post<Post>('/posts', postData);
      return post;
    } catch (err) {
      const errorMessage = err instanceof ApiError ? err.message : 'Failed to create post';
      setError(errorMessage);
      throw err;
    } finally {
      setCreating(false);
    }
  }, []);

  const updatePost = useCallback(async (id: string, postData: PostUpdate): Promise<Post> => {
    try {
      setError(null);
      setUpdating(true);
      
      const post = await apiClient.put<Post>(`/posts/${id}`, postData);
      return post;
    } catch (err) {
      const errorMessage = err instanceof ApiError ? err.message : 'Failed to update post';
      setError(errorMessage);
      throw err;
    } finally {
      setUpdating(false);
    }
  }, []);

  const deletePost = useCallback(async (id: string): Promise<void> => {
    try {
      setError(null);
      setDeleting(id);
      
      await apiClient.delete(`/posts/${id}`);
    } catch (err) {
      const errorMessage = err instanceof ApiError ? err.message : 'Failed to delete post';
      setError(errorMessage);
      throw err;
    } finally {
      setDeleting(null);
    }
  }, []);

  const publishPost = useCallback(async (id: string, publishNow: boolean = false): Promise<void> => {
    try {
      setError(null);
      setPublishing(id);
      
      const endpoint = publishNow ? `/posts/${id}/publish-now` : `/posts/${id}/publish`;
      await apiClient.post(endpoint);
    } catch (err) {
      const errorMessage = err instanceof ApiError ? err.message : 'Failed to publish post';
      setError(errorMessage);
      throw err;
    } finally {
      setPublishing(null);
    }
  }, []);

  const duplicatePost = useCallback(async (id: string): Promise<Post> => {
    try {
      setError(null);
      
      const post = await apiClient.post<Post>(`/posts/${id}/duplicate`);
      return post;
    } catch (err) {
      const errorMessage = err instanceof ApiError ? err.message : 'Failed to duplicate post';
      setError(errorMessage);
      throw err;
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    creating,
    updating,
    deleting,
    publishing,
    createPost,
    updatePost,
    deletePost,
    publishPost,
    duplicatePost,
    error,
    clearError,
  };
}

interface UseScheduledPostsReturn {
  data: Post[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useScheduledPosts(): UseScheduledPostsReturn {
  const [data, setData] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchScheduledPosts = useCallback(async () => {
    try {
      setError(null);
      setLoading(true);
      
      const response = await apiClient.get<{ posts: Post[] }>('/posts/scheduled');
      setData(response.posts || []);
    } catch (err) {
      const errorMessage = err instanceof ApiError ? err.message : 'Failed to fetch scheduled posts';
      setError(errorMessage);
      console.error('Scheduled posts error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchScheduledPosts();
  }, [fetchScheduledPosts]);

  return {
    data,
    loading,
    error,
    refetch: fetchScheduledPosts,
  };
}

interface UsePostAnalyticsReturn {
  data: Record<string, any> | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function usePostAnalytics(postId: string): UsePostAnalyticsReturn {
  const [data, setData] = useState<Record<string, any> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = useCallback(async () => {
    if (!postId) return;
    
    try {
      setError(null);
      setLoading(true);
      
      const analytics = await apiClient.get<Record<string, any>>(`/posts/${postId}/analytics`);
      setData(analytics);
    } catch (err) {
      const errorMessage = err instanceof ApiError ? err.message : 'Failed to fetch post analytics';
      setError(errorMessage);
      console.error('Post analytics error:', err);
    } finally {
      setLoading(false);
    }
  }, [postId]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  return {
    data,
    loading,
    error,
    refetch: fetchAnalytics,
  };
}