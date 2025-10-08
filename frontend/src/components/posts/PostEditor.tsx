'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { PostCreate, PostUpdate, ConnectedAccount } from '@/types';
import { validatePostContent, sanitizeInput, validateImageUrl } from '@/utils/validation';
import { useSocialAccounts } from '@/hooks/useSocialAccounts';

interface PostEditorProps {
  initialData?: Partial<PostCreate>;
  postId?: string;
  onSave: (data: PostCreate | PostUpdate) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  mode: 'create' | 'edit';
}

interface PostFormData {
  content: string;
  media_urls: string[];
  hashtags: string[];
  mentions: string[];
  scheduled_at: string;
  social_account_ids: string[];
}

const MAX_CONTENT_LENGTH = 2800; // Conservative limit for cross-platform posting
const MAX_HASHTAGS = 30;
const MAX_MENTIONS = 20;
const MAX_MEDIA_URLS = 4;

export const PostEditor: React.FC<PostEditorProps> = ({
  initialData = {},
  postId,
  onSave,
  onCancel,
  isLoading = false,
  mode
}) => {
  const { connectedAccounts, loading: accountsLoading } = useSocialAccounts();
  
  const [formData, setFormData] = useState<PostFormData>({
    content: initialData.content || '',
    media_urls: initialData.media_urls || [],
    hashtags: initialData.hashtags || [],
    mentions: initialData.mentions || [],
    scheduled_at: initialData.scheduled_at || '',
    social_account_ids: initialData.social_account_ids || []
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [characterCount, setCharacterCount] = useState(0);
  const [isDraft, setIsDraft] = useState(true);

  // Security: Content validation
  const validateForm = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};

    // Validate content
    const contentValidation = validatePostContent(formData.content);
    if (!contentValidation.isValid) {
      newErrors.content = contentValidation.errors.join(', ');
    }

    // Character limit validation
    if (formData.content.length > MAX_CONTENT_LENGTH) {
      newErrors.content = `Content exceeds maximum length of ${MAX_CONTENT_LENGTH} characters`;
    }

    // Validate hashtags
    if (formData.hashtags.length > MAX_HASHTAGS) {
      newErrors.hashtags = `Maximum ${MAX_HASHTAGS} hashtags allowed`;
    }

    // Validate hashtags format
    const invalidHashtags = formData.hashtags.filter(tag => !/^[a-zA-Z0-9_]+$/.test(tag));
    if (invalidHashtags.length > 0) {
      newErrors.hashtags = 'Hashtags can only contain letters, numbers, and underscores';
    }

    // Validate mentions
    if (formData.mentions.length > MAX_MENTIONS) {
      newErrors.mentions = `Maximum ${MAX_MENTIONS} mentions allowed`;
    }

    // Validate mentions format
    const invalidMentions = formData.mentions.filter(mention => !/^[a-zA-Z0-9_]+$/.test(mention));
    if (invalidMentions.length > 0) {
      newErrors.mentions = 'Mentions can only contain letters, numbers, and underscores';
    }

    // Validate media URLs
    if (formData.media_urls.length > MAX_MEDIA_URLS) {
      newErrors.media_urls = `Maximum ${MAX_MEDIA_URLS} media files allowed`;
    }

    // Validate each media URL
    const invalidUrls = formData.media_urls.filter(url => !validateImageUrl(url));
    if (invalidUrls.length > 0) {
      newErrors.media_urls = 'Invalid media URLs detected';
    }

    // At least one platform must be selected
    if (formData.social_account_ids.length === 0) {
      newErrors.social_accounts = 'Select at least one platform to post to';
    }

    // Scheduled date validation
    if (formData.scheduled_at && new Date(formData.scheduled_at) <= new Date()) {
      newErrors.scheduled_at = 'Scheduled time must be in the future';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  // Update character count
  useEffect(() => {
    setCharacterCount(formData.content.length);
  }, [formData.content]);

  // Handle content change with sanitization
  const handleContentChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const sanitizedContent = sanitizeInput(e.target.value);
    setFormData(prev => ({ ...prev, content: sanitizedContent }));
  }, []);

  // Handle hashtags input
  const handleHashtagsChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const input = sanitizeInput(e.target.value);
    const hashtags = input.split(' ').filter(tag => tag.length > 0).map(tag => tag.replace(/^#/, ''));
    setFormData(prev => ({ ...prev, hashtags }));
  }, []);

  // Handle mentions input
  const handleMentionsChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const input = sanitizeInput(e.target.value);
    const mentions = input.split(' ').filter(mention => mention.length > 0).map(mention => mention.replace(/^@/, ''));
    setFormData(prev => ({ ...prev, mentions }));
  }, []);

  // Handle media URL addition
  const handleAddMediaUrl = useCallback((url: string) => {
    const sanitizedUrl = sanitizeInput(url.trim());
    if (sanitizedUrl && validateImageUrl(sanitizedUrl) && formData.media_urls.length < MAX_MEDIA_URLS) {
      setFormData(prev => ({ 
        ...prev, 
        media_urls: [...prev.media_urls, sanitizedUrl] 
      }));
    }
  }, [formData.media_urls.length]);

  // Handle media URL removal
  const handleRemoveMediaUrl = useCallback((index: number) => {
    setFormData(prev => ({ 
      ...prev, 
      media_urls: prev.media_urls.filter((_, i) => i !== index) 
    }));
  }, []);

  // Handle platform selection
  const handlePlatformToggle = useCallback((accountId: string) => {
    setFormData(prev => ({
      ...prev,
      social_account_ids: prev.social_account_ids.includes(accountId)
        ? prev.social_account_ids.filter(id => id !== accountId)
        : [...prev.social_account_ids, accountId]
    }));
  }, []);

  // Handle save
  const handleSave = useCallback(async (publishNow: boolean = false) => {
    if (!validateForm()) return;

    setIsDraft(!publishNow);
    
    const postData: PostCreate | PostUpdate = {
      content: formData.content.trim(),
      media_urls: formData.media_urls,
      hashtags: formData.hashtags,
      mentions: formData.mentions,
      social_account_ids: formData.social_account_ids,
      ...(formData.scheduled_at && { scheduled_at: formData.scheduled_at })
    };

    await onSave(postData);
  }, [formData, validateForm, onSave]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="sm3d-text-h2">
          {mode === 'create' ? 'Create New Post' : 'Edit Post'}
        </h2>
        <div className="flex space-x-3">
          <Button variant="secondary" onClick={onCancel} disabled={isLoading}>
            Cancel
          </Button>
          <Button 
            variant="secondary" 
            onClick={() => handleSave(false)}
            disabled={isLoading}
          >
            Save as Draft
          </Button>
          <Button 
            onClick={() => handleSave(true)}
            disabled={isLoading}
          >
            {formData.scheduled_at ? 'Schedule Post' : 'Publish Now'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content Area */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Content
                </label>
                <textarea
                  value={formData.content}
                  onChange={handleContentChange}
                  placeholder="What's happening?"
                  className="sm3d-input w-full h-32 resize-none"
                  maxLength={MAX_CONTENT_LENGTH}
                  disabled={isLoading}
                />
                <div className="flex justify-between mt-2">
                  <span className="text-sm text-text-muted">
                    {errors.content && <span className="text-error">{errors.content}</span>}
                  </span>
                  <span className={`text-sm ${
                    characterCount > MAX_CONTENT_LENGTH * 0.9 ? 'text-warning' : 
                    characterCount > MAX_CONTENT_LENGTH * 0.8 ? 'text-info' : 
                    'text-text-muted'
                  }`}>
                    {characterCount}/{MAX_CONTENT_LENGTH}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Hashtags (space separated)
                </label>
                <input
                  type="text"
                  value={formData.hashtags.map(tag => `#${tag}`).join(' ')}
                  onChange={handleHashtagsChange}
                  placeholder="#socialmedia #marketing"
                  className="sm3d-input w-full"
                  disabled={isLoading}
                />
                {errors.hashtags && (
                  <p className="text-sm text-error mt-1">{errors.hashtags}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Mentions (space separated)
                </label>
                <input
                  type="text"
                  value={formData.mentions.map(mention => `@${mention}`).join(' ')}
                  onChange={handleMentionsChange}
                  placeholder="@username @company"
                  className="sm3d-input w-full"
                  disabled={isLoading}
                />
                {errors.mentions && (
                  <p className="text-sm text-error mt-1">{errors.mentions}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Schedule (optional)
                </label>
                <input
                  type="datetime-local"
                  value={formData.scheduled_at}
                  onChange={(e) => setFormData(prev => ({ ...prev, scheduled_at: e.target.value }))}
                  className="sm3d-input"
                  min={new Date().toISOString().slice(0, 16)}
                  disabled={isLoading}
                />
                {errors.scheduled_at && (
                  <p className="text-sm text-error mt-1">{errors.scheduled_at}</p>
                )}
              </div>
            </div>
          </Card>

          {/* Media Attachment */}
          <Card>
            <h3 className="sm3d-text-h2 mb-4">Media Attachments</h3>
            <div className="space-y-4">
              <div className="flex space-x-2">
                <input
                  type="url"
                  placeholder="Image URL (https://...)"
                  className="sm3d-input flex-1"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      const input = e.target as HTMLInputElement;
                      handleAddMediaUrl(input.value);
                      input.value = '';
                    }
                  }}
                  disabled={isLoading || formData.media_urls.length >= MAX_MEDIA_URLS}
                />
                <Button
                  variant="secondary"
                  onClick={() => {
                    const input = document.querySelector('input[placeholder="Image URL (https://...)"]') as HTMLInputElement;
                    if (input?.value) {
                      handleAddMediaUrl(input.value);
                      input.value = '';
                    }
                  }}
                  disabled={isLoading || formData.media_urls.length >= MAX_MEDIA_URLS}
                >
                  Add
                </Button>
              </div>

              {formData.media_urls.length > 0 && (
                <div className="grid grid-cols-2 gap-4">
                  {formData.media_urls.map((url, index) => (
                    <div key={index} className="relative">
                      <img
                        src={url}
                        alt={`Media ${index + 1}`}
                        className="w-full h-32 object-cover rounded-button"
                        onError={(e) => {
                          const img = e.target as HTMLImageElement;
                          img.style.display = 'none';
                        }}
                      />
                      <button
                        onClick={() => handleRemoveMediaUrl(index)}
                        className="absolute top-2 right-2 bg-error text-white rounded-full w-6 h-6 flex items-center justify-center text-xs"
                        disabled={isLoading}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {errors.media_urls && (
                <p className="text-sm text-error">{errors.media_urls}</p>
              )}
            </div>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Platform Selection */}
          <Card>
            <h3 className="sm3d-text-h2 mb-4">Publish to</h3>
            {accountsLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 3 }, (_, i) => (
                  <div key={i} className="animate-pulse flex items-center space-x-3">
                    <div className="w-8 h-8 bg-border rounded"></div>
                    <div className="flex-1 h-4 bg-border rounded"></div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {connectedAccounts.map((account: ConnectedAccount) => (
                  <label
                    key={account.id}
                    className="flex items-center space-x-3 p-2 hover:bg-surface rounded-button cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={formData.social_account_ids.includes(account.id)}
                      onChange={() => handlePlatformToggle(account.id)}
                      className="sr-only"
                      disabled={isLoading}
                    />
                    <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                      formData.social_account_ids.includes(account.id)
                        ? 'bg-accent border-accent'
                        : 'border-border'
                    }`}>
                      {formData.social_account_ids.includes(account.id) && (
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                    <span className="text-sm text-text-primary">
                      {account.platformId} - @{account.username}
                    </span>
                  </label>
                ))}
              </div>
            )}
            
            {errors.social_accounts && (
              <p className="text-sm text-error mt-2">{errors.social_accounts}</p>
            )}
          </Card>

          {/* Post Preview */}
          <Card>
            <h3 className="sm3d-text-h2 mb-4">Preview</h3>
            <div className="bg-background p-4 rounded-button border border-border">
              <div className="whitespace-pre-wrap text-sm">
                {formData.content || 'Your post content will appear here...'}
              </div>
              {formData.hashtags.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {formData.hashtags.map((hashtag, index) => (
                    <span key={index} className="text-accent text-sm">
                      #{hashtag}
                    </span>
                  ))}
                </div>
              )}
              {formData.mentions.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {formData.mentions.map((mention, index) => (
                    <span key={index} className="text-info text-sm">
                      @{mention}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};