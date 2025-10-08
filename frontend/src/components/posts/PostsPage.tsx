'use client';

import React, { useState, useCallback } from 'react';
import { ErrorBoundary } from '../ui/ErrorBoundary';
import { PostEditor } from './PostEditor';
import { PostList } from './PostList';
import { Post, PostCreate, PostUpdate } from '@/types';
import { usePostActions } from '@/hooks/usePosts';

type ViewMode = 'list' | 'create' | 'edit';

interface PostsPageState {
  mode: ViewMode;
  editingPost?: Post;
  isLoading: boolean;
  error: string | null;
}

export const PostsPage: React.FC = () => {
  const [state, setState] = useState<PostsPageState>({
    mode: 'list',
    editingPost: undefined,
    isLoading: false,
    error: null
  });

  const { createPost, updatePost } = usePostActions();

  // Handle view mode changes
  const handleCreateNew = useCallback(() => {
    setState(prev => ({
      ...prev,
      mode: 'create',
      editingPost: undefined,
      error: null
    }));
  }, []);

  const handleEditPost = useCallback((post: Post) => {
    setState(prev => ({
      ...prev,
      mode: 'edit',
      editingPost: post,
      error: null
    }));
  }, []);

  const handleBackToList = useCallback(() => {
    setState(prev => ({
      ...prev,
      mode: 'list',
      editingPost: undefined,
      error: null
    }));
  }, []);

  // Handle post save (create or update)
  const handleSavePost = useCallback(async (postData: PostCreate | PostUpdate) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      if (state.mode === 'create') {
        await createPost(postData as PostCreate);
      } else if (state.mode === 'edit' && state.editingPost) {
        await updatePost(state.editingPost.id, postData as PostUpdate);
      }
      
      // Navigate back to list after successful save
      handleBackToList();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to save post';
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage
      }));
    }
  }, [state.mode, state.editingPost, createPost, updatePost, handleBackToList]);

  // Error handling
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  // Render appropriate view
  const renderCurrentView = () => {
    switch (state.mode) {
      case 'create':
        return (
          <PostEditor
            mode="create"
            onSave={handleSavePost}
            onCancel={handleBackToList}
            isLoading={state.isLoading}
          />
        );
      
      case 'edit':
        if (!state.editingPost) {
          return (
            <div className="text-center py-8">
              <p className="text-error">No post selected for editing</p>
              <button
                onClick={handleBackToList}
                className="mt-4 text-accent hover:underline"
              >
                Back to Posts
              </button>
            </div>
          );
        }
        
        return (
          <PostEditor
            mode="edit"
            postId={state.editingPost.id}
            initialData={{
              content: state.editingPost.content,
              media_urls: state.editingPost.media_urls,
              hashtags: state.editingPost.hashtags,
              mentions: state.editingPost.mentions,
              scheduled_at: state.editingPost.scheduled_at,
              social_account_ids: [state.editingPost.social_account_id].filter(Boolean)
            }}
            onSave={handleSavePost}
            onCancel={handleBackToList}
            isLoading={state.isLoading}
          />
        );
      
      default:
        return (
          <PostList
            onEditPost={handleEditPost}
            onCreateNew={handleCreateNew}
          />
        );
    }
  };

  return (
    <ErrorBoundary
      fallback={(error, resetError) => (
        <div className="text-center py-12">
          <div className="bg-error/10 border border-error/20 rounded-card p-6 max-w-md mx-auto">
            <h2 className="text-lg font-semibold text-error mb-2">
              Something went wrong
            </h2>
            <p className="text-sm text-text-secondary mb-4">
              {error.message || 'An unexpected error occurred'}
            </p>
            <div className="flex space-x-3 justify-center">
              <button
                onClick={resetError}
                className="px-4 py-2 bg-accent text-white rounded-button text-sm hover:opacity-90 transition-opacity"
              >
                Try Again
              </button>
              <button
                onClick={handleBackToList}
                className="px-4 py-2 bg-surface border border-border text-text-primary rounded-button text-sm hover:bg-border transition-colors"
              >
                Back to Posts
              </button>
            </div>
          </div>
        </div>
      )}
    >
      <div className="min-h-screen bg-background">
        {/* Error Display */}
        {state.error && (
          <div className="bg-error/10 border-b border-error/20 px-6 py-4">
            <div className="flex items-center justify-between max-w-7xl mx-auto">
              <div className="flex items-center space-x-3">
                <svg className="w-5 h-5 text-error" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <p className="text-error text-sm">
                  {state.error}
                </p>
              </div>
              <button
                onClick={clearError}
                className="text-error hover:text-error/80 text-xl font-bold"
              >
                ×
              </button>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-6 py-8">
          {renderCurrentView()}
        </div>
      </div>
    </ErrorBoundary>
  );
};