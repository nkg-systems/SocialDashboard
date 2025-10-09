/**
 * Scheduling Page
 * Main page for post scheduling with calendar view and management
 */

'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import Calendar from './Calendar';
import ScheduleForm from './ScheduleForm';
import ScheduledPostsList from './ScheduledPostsList';

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

interface Platform {
  id: string;
  name: string;
  isConnected: boolean;
  maxLength: number;
  supportedMediaTypes: string[];
  brandColor: string;
}

interface ScheduleFormData {
  title: string;
  content: string;
  selectedPlatforms: string[];
  scheduledDate: string;
  scheduledTime: string;
  timezone: string;
  repeatType: 'none' | 'daily' | 'weekly' | 'monthly';
  repeatUntil?: string;
  media?: File[];
}

type ViewMode = 'calendar' | 'list';

export const SchedulingPage: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('calendar');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [showForm, setShowForm] = useState(false);
  const [editingPost, setEditingPost] = useState<ScheduledPost | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Mock data - in real app this would come from API/context
  const [scheduledPosts, setScheduledPosts] = useState<ScheduledPost[]>([
    {
      id: '1',
      title: 'Welcome to our new product launch!',
      content: 'Excited to share our latest innovation with the world. Check out all the amazing features! #ProductLaunch #Innovation',
      platforms: ['twitter', 'facebook'],
      scheduledTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
      status: 'scheduled',
      userId: 'user1',
      createdAt: new Date(),
      repeatType: 'none',
    },
    {
      id: '2',
      title: 'Weekly team update',
      content: 'Here\'s what our amazing team accomplished this week. Great progress on all fronts!',
      platforms: ['linkedin'],
      scheduledTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week from now
      status: 'scheduled',
      userId: 'user1',
      createdAt: new Date(),
      repeatType: 'weekly',
    },
    {
      id: '3',
      title: 'Published post example',
      content: 'This post was already published successfully.',
      platforms: ['instagram'],
      scheduledTime: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
      status: 'published',
      userId: 'user1',
      createdAt: new Date(),
    }
  ]);

  const platforms: Platform[] = useMemo(() => [
    {
      id: 'twitter',
      name: 'Twitter',
      isConnected: true,
      maxLength: 280,
      supportedMediaTypes: ['image/jpeg', 'image/png', 'image/gif', 'video/mp4'],
      brandColor: '#1DA1F2'
    },
    {
      id: 'facebook',
      name: 'Facebook',
      isConnected: true,
      maxLength: 63206,
      supportedMediaTypes: ['image/jpeg', 'image/png', 'video/mp4'],
      brandColor: '#1877F2'
    },
    {
      id: 'instagram',
      name: 'Instagram',
      isConnected: true,
      maxLength: 2200,
      supportedMediaTypes: ['image/jpeg', 'image/png', 'video/mp4'],
      brandColor: '#E4405F'
    },
    {
      id: 'linkedin',
      name: 'LinkedIn',
      isConnected: false,
      maxLength: 3000,
      supportedMediaTypes: ['image/jpeg', 'image/png', 'video/mp4'],
      brandColor: '#0A66C2'
    }
  ], []);

  // Handle date selection from calendar
  const handleDateClick = useCallback((date: Date) => {
    setSelectedDate(date);
    setShowForm(true);
    setEditingPost(null);
  }, []);

  // Handle post click from calendar
  const handlePostClick = useCallback((post: ScheduledPost) => {
    setEditingPost(post);
    setShowForm(true);
    setSelectedDate(new Date(post.scheduledTime));
  }, []);

  // Handle form submission
  const handleFormSubmit = useCallback(async (formData: ScheduleFormData) => {
    setIsLoading(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      const scheduledDateTime = new Date(`${formData.scheduledDate}T${formData.scheduledTime}`);
      
      if (editingPost) {
        // Update existing post
        setScheduledPosts(prev => prev.map(post => 
          post.id === editingPost.id 
            ? {
                ...post,
                title: formData.title,
                content: formData.content,
                platforms: formData.selectedPlatforms,
                scheduledTime: scheduledDateTime,
                repeatType: formData.repeatType,
                // Convert File objects to URLs (in real app, upload to server first)
                media: formData.media?.map(file => URL.createObjectURL(file))
              }
            : post
        ));
      } else {
        // Create new post
        const newPost: ScheduledPost = {
          id: Date.now().toString(),
          title: formData.title,
          content: formData.content,
          platforms: formData.selectedPlatforms,
          scheduledTime: scheduledDateTime,
          status: 'scheduled',
          userId: 'user1',
          createdAt: new Date(),
          repeatType: formData.repeatType,
          // Convert File objects to URLs (in real app, upload to server first)
          media: formData.media?.map(file => URL.createObjectURL(file))
        };
        
        setScheduledPosts(prev => [...prev, newPost]);
      }
      
      // Close form and reset
      setShowForm(false);
      setEditingPost(null);
      setSelectedDate(undefined);
      
    } catch (error) {
      throw new Error('Failed to save scheduled post');
    } finally {
      setIsLoading(false);
    }
  }, [editingPost]);

  // Handle form cancel
  const handleFormCancel = useCallback(() => {
    setShowForm(false);
    setEditingPost(null);
    setSelectedDate(undefined);
  }, []);

  // Handle post edit from list
  const handleEditPost = useCallback((post: ScheduledPost) => {
    setEditingPost(post);
    setSelectedDate(new Date(post.scheduledTime));
    setShowForm(true);
  }, []);

  // Handle post deletion
  const handleDeletePost = useCallback((postId: string) => {
    // Security: Validate post exists
    const postExists = scheduledPosts.some(p => p.id === postId);
    if (!postExists) return;

    setScheduledPosts(prev => prev.filter(post => post.id !== postId));
    
    // Close form if we're editing the deleted post
    if (editingPost?.id === postId) {
      setShowForm(false);
      setEditingPost(null);
      setSelectedDate(undefined);
    }
  }, [scheduledPosts, editingPost]);

  // Handle post duplication
  const handleDuplicatePost = useCallback((post: ScheduledPost) => {
    // Create a copy with new ID and current date
    const duplicatedPost: ScheduledPost = {
      ...post,
      id: Date.now().toString(),
      title: `${post.title} (Copy)`,
      createdAt: new Date(),
      status: 'draft'
    };
    
    setScheduledPosts(prev => [...prev, duplicatedPost]);
  }, []);

  // Handle publish now
  const handlePublishNow = useCallback(async (postId: string) => {
    const confirmed = confirm('Publish this post immediately?');
    if (!confirmed) return;

    // Security: Validate post exists and is scheduled
    const post = scheduledPosts.find(p => p.id === postId);
    if (!post || post.status !== 'scheduled') return;

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setScheduledPosts(prev => prev.map(p =>
        p.id === postId 
          ? { ...p, status: 'published' as const }
          : p
      ));
    } catch (error) {
      console.error('Failed to publish post:', error);
    }
  }, [scheduledPosts]);

  const connectedPlatformsCount = platforms.filter(p => p.isConnected).length;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="sm3d-text-h1">Post Scheduler</h1>
          <p className="sm3d-text-body mt-1">
            Schedule and manage your social media posts across platforms
          </p>
        </div>
        <div className="flex items-center space-x-3">
          {/* View Toggle */}
          <div className="flex bg-muted rounded-lg p-1">
            <button
              onClick={() => setViewMode('calendar')}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'calendar'
                  ? 'bg-background text-text-primary shadow-sm'
                  : 'text-text-muted hover:text-text-primary'
              }`}
            >
              <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Calendar
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'list'
                  ? 'bg-background text-text-primary shadow-sm'
                  : 'text-text-muted hover:text-text-primary'
              }`}
            >
              <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
              List
            </button>
          </div>
          
          <Button
            onClick={() => {
              setSelectedDate(new Date());
              setEditingPost(null);
              setShowForm(true);
            }}
            disabled={connectedPlatformsCount === 0}
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Schedule Post
          </Button>
        </div>
      </div>

      {/* No Connected Platforms Warning */}
      {connectedPlatformsCount === 0 && (
        <div className="bg-warning/10 border border-warning/20 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <svg className="w-5 h-5 text-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <div>
              <p className="text-warning font-medium">No connected platforms</p>
              <p className="text-warning text-sm">
                Connect at least one social media platform to start scheduling posts.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className={`${showForm ? 'xl:col-span-2' : 'xl:col-span-3'}`}>
          {viewMode === 'calendar' ? (
            <Calendar
              scheduledPosts={scheduledPosts}
              onDateClick={handleDateClick}
              onPostClick={handlePostClick}
              selectedDate={selectedDate}
              minDate={new Date()}
            />
          ) : (
            <ScheduledPostsList
              posts={scheduledPosts}
              onEditPost={handleEditPost}
              onDeletePost={handleDeletePost}
              onDuplicatePost={handleDuplicatePost}
              onPublishNow={handlePublishNow}
              loading={isLoading}
            />
          )}
        </div>

        {/* Form Panel */}
        {showForm && (
          <div className="xl:col-span-1">
            <ScheduleForm
              onSubmit={handleFormSubmit}
              onCancel={handleFormCancel}
              platforms={platforms}
              initialData={editingPost ? {
                title: editingPost.title,
                content: editingPost.content,
                selectedPlatforms: editingPost.platforms,
                scheduledDate: editingPost.scheduledTime.toISOString().split('T')[0],
                scheduledTime: editingPost.scheduledTime.toTimeString().slice(0, 5),
                repeatType: editingPost.repeatType || 'none',
              } : undefined}
              isEditing={!!editingPost}
              selectedDate={selectedDate}
            />
          </div>
        )}
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-card rounded-lg p-4 border border-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-text-muted">Total Scheduled</p>
              <p className="text-2xl font-bold text-text-primary">
                {scheduledPosts.filter(p => p.status === 'scheduled').length}
              </p>
            </div>
            <div className="p-2 bg-accent/10 rounded-lg">
              <svg className="w-5 h-5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-lg p-4 border border-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-text-muted">Published</p>
              <p className="text-2xl font-bold text-text-primary">
                {scheduledPosts.filter(p => p.status === 'published').length}
              </p>
            </div>
            <div className="p-2 bg-success/10 rounded-lg">
              <svg className="w-5 h-5 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-lg p-4 border border-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-text-muted">Failed</p>
              <p className="text-2xl font-bold text-text-primary">
                {scheduledPosts.filter(p => p.status === 'failed').length}
              </p>
            </div>
            <div className="p-2 bg-error/10 rounded-lg">
              <svg className="w-5 h-5 text-error" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-lg p-4 border border-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-text-muted">Connected Platforms</p>
              <p className="text-2xl font-bold text-text-primary">
                {connectedPlatformsCount}
              </p>
            </div>
            <div className="p-2 bg-info/10 rounded-lg">
              <svg className="w-5 h-5 text-info" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SchedulingPage;