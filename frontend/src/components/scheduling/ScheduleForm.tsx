/**
 * Schedule Form Component
 * Form for creating and editing scheduled posts with timezone-aware scheduling
 */

'use client';

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { validatePostContent, sanitizeHtml } from '@/utils/validation';

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

interface ScheduleFormErrors {
  title?: string;
  content?: string;
  platforms?: string;
  scheduledDate?: string;
  scheduledTime?: string;
  repeatUntil?: string;
  media?: string;
  submit?: string;
}

interface ScheduleFormProps {
  onSubmit: (data: ScheduleFormData) => Promise<void>;
  onCancel: () => void;
  platforms: Platform[];
  initialData?: Partial<ScheduleFormData>;
  isEditing?: boolean;
  selectedDate?: Date;
}

export const ScheduleForm: React.FC<ScheduleFormProps> = ({
  onSubmit,
  onCancel,
  platforms,
  initialData,
  isEditing = false,
  selectedDate
}) => {
  const [formData, setFormData] = useState<ScheduleFormData>({
    title: '',
    content: '',
    selectedPlatforms: [],
    scheduledDate: selectedDate ? selectedDate.toISOString().split('T')[0] : '',
    scheduledTime: '',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    repeatType: 'none',
    ...initialData
  });

  const [errors, setErrors] = useState<ScheduleFormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [characterCount, setCharacterCount] = useState(0);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  // Get connected platforms only
  const connectedPlatforms = useMemo(() => {
    return platforms.filter(platform => platform.isConnected);
  }, [platforms]);

  // Calculate character limits based on selected platforms
  const characterLimit = useMemo(() => {
    if (formData.selectedPlatforms.length === 0) return 280; // Default Twitter limit
    
    const selectedPlatformData = connectedPlatforms.filter(p => 
      formData.selectedPlatforms.includes(p.id)
    );
    
    if (selectedPlatformData.length === 0) return 280;
    
    // Return the most restrictive limit
    return Math.min(...selectedPlatformData.map(p => p.maxLength));
  }, [formData.selectedPlatforms, connectedPlatforms]);

  // Update character count when content changes
  useEffect(() => {
    setCharacterCount(formData.content.length);
  }, [formData.content]);

  // Handle form field changes
  const handleInputChange = useCallback((field: keyof ScheduleFormData, value: string | string[]) => {
    const sanitizedValue = typeof value === 'string' ? sanitizeHtml(value) : value;
    
    setFormData(prev => ({
      ...prev,
      [field]: sanitizedValue
    }));

    // Clear field error on change
    if (errors[field as keyof ScheduleFormErrors]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined
      }));
    }
  }, [errors]);

  // Handle platform selection
  const handlePlatformToggle = useCallback((platformId: string) => {
    // Security: Validate platform exists and is connected
    const platform = connectedPlatforms.find(p => p.id === platformId);
    if (!platform) return;

    setFormData(prev => ({
      ...prev,
      selectedPlatforms: prev.selectedPlatforms.includes(platformId)
        ? prev.selectedPlatforms.filter(id => id !== platformId)
        : [...prev.selectedPlatforms, platformId]
    }));

    // Clear platform error
    setErrors(prev => ({
      ...prev,
      platforms: undefined
    }));
  }, [connectedPlatforms]);

  // Handle media upload
  const handleMediaUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    
    // Security: Validate file types and sizes
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'video/mp4'];
    const maxSize = 50 * 1024 * 1024; // 50MB
    
    const validFiles: File[] = [];
    const invalidFiles: string[] = [];
    
    files.forEach(file => {
      if (!allowedTypes.includes(file.type)) {
        invalidFiles.push(`${file.name}: unsupported file type`);
      } else if (file.size > maxSize) {
        invalidFiles.push(`${file.name}: file too large (max 50MB)`);
      } else {
        validFiles.push(file);
      }
    });
    
    if (invalidFiles.length > 0) {
      setErrors(prev => ({
        ...prev,
        media: `Invalid files: ${invalidFiles.join(', ')}`
      }));
    } else {
      setErrors(prev => ({
        ...prev,
        media: undefined
      }));
    }
    
    setSelectedFiles(validFiles);
    setFormData(prev => ({
      ...prev,
      media: validFiles
    }));
  }, []);

  // Remove media file
  const handleRemoveMedia = useCallback((index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    setFormData(prev => ({
      ...prev,
      media: prev.media?.filter((_, i) => i !== index)
    }));
  }, []);

  // Validate form
  const validateForm = useCallback((): boolean => {
    const newErrors: ScheduleFormErrors = {};

    // Validate title
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    } else if (formData.title.length > 100) {
      newErrors.title = 'Title must be less than 100 characters';
    }

    // Validate content
    const contentValidation = validatePostContent(formData.content);
    if (!contentValidation.isValid) {
      newErrors.content = contentValidation.errors[0];
    } else if (formData.content.length > characterLimit) {
      newErrors.content = `Content exceeds character limit (${characterLimit})`;
    }

    // Validate platforms
    if (formData.selectedPlatforms.length === 0) {
      newErrors.platforms = 'Select at least one platform';
    }

    // Validate scheduled date
    if (!formData.scheduledDate) {
      newErrors.scheduledDate = 'Scheduled date is required';
    } else {
      const scheduledDate = new Date(formData.scheduledDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (scheduledDate < today) {
        newErrors.scheduledDate = 'Scheduled date cannot be in the past';
      }
      
      // Max 1 year in advance
      const maxDate = new Date();
      maxDate.setFullYear(maxDate.getFullYear() + 1);
      if (scheduledDate > maxDate) {
        newErrors.scheduledDate = 'Scheduled date cannot be more than 1 year in advance';
      }
    }

    // Validate scheduled time
    if (!formData.scheduledTime) {
      newErrors.scheduledTime = 'Scheduled time is required';
    } else if (formData.scheduledDate) {
      const scheduledDateTime = new Date(`${formData.scheduledDate}T${formData.scheduledTime}`);
      const now = new Date();
      
      if (scheduledDateTime <= now) {
        newErrors.scheduledTime = 'Scheduled time must be in the future';
      }
    }

    // Validate repeat until date
    if (formData.repeatType !== 'none' && formData.repeatUntil) {
      const repeatUntilDate = new Date(formData.repeatUntil);
      const scheduledDate = new Date(formData.scheduledDate);
      
      if (repeatUntilDate <= scheduledDate) {
        newErrors.repeatUntil = 'Repeat end date must be after scheduled date';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData, characterLimit]);

  // Handle form submission
  const handleSubmit = useCallback(async (event: React.FormEvent) => {
    event.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      await onSubmit(formData);
    } catch (error) {
      setErrors({
        submit: error instanceof Error ? error.message : 'Failed to schedule post. Please try again.'
      });
    } finally {
      setIsLoading(false);
    }
  }, [formData, validateForm, onSubmit]);

  // Get platform icon
  const getPlatformIcon = useCallback((platformId: string) => {
    const icons = {
      twitter: (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
        </svg>
      ),
      facebook: (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
        </svg>
      ),
      instagram: (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
        </svg>
      ),
      linkedin: (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
        </svg>
      )
    };
    return icons[platformId as keyof typeof icons] || null;
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {isEditing ? 'Edit Scheduled Post' : 'Schedule New Post'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              placeholder="Enter post title..."
              maxLength={100}
              required
            />
            {errors.title && (
              <p className="text-sm text-error">{errors.title}</p>
            )}
          </div>

          {/* Content */}
          <div className="space-y-2">
            <Label htmlFor="content">Content *</Label>
            <Textarea
              id="content"
              value={formData.content}
              onChange={(e) => handleInputChange('content', e.target.value)}
              placeholder="Write your post content..."
              rows={6}
              maxLength={characterLimit}
              required
            />
            <div className="flex justify-between text-sm">
              <span>
                {errors.content && <span className="text-error">{errors.content}</span>}
              </span>
              <span className={`${characterCount > characterLimit * 0.9 ? 'text-warning' : 'text-text-muted'}`}>
                {characterCount}/{characterLimit}
              </span>
            </div>
          </div>

          {/* Platform Selection */}
          <div className="space-y-2">
            <Label>Platforms *</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {connectedPlatforms.map((platform) => (
                <button
                  key={platform.id}
                  type="button"
                  onClick={() => handlePlatformToggle(platform.id)}
                  className={`flex items-center space-x-2 p-3 border rounded-lg transition-colors ${
                    formData.selectedPlatforms.includes(platform.id)
                      ? 'border-accent bg-accent/10 text-accent'
                      : 'border-border bg-background hover:bg-muted/20'
                  }`}
                >
                  <div style={{ color: platform.brandColor }}>
                    {getPlatformIcon(platform.id)}
                  </div>
                  <span className="text-sm font-medium">{platform.name}</span>
                </button>
              ))}
            </div>
            {errors.platforms && (
              <p className="text-sm text-error">{errors.platforms}</p>
            )}
          </div>

          {/* Schedule Date & Time */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="scheduledDate">Date *</Label>
              <Input
                id="scheduledDate"
                type="date"
                value={formData.scheduledDate}
                onChange={(e) => handleInputChange('scheduledDate', e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                required
              />
              {errors.scheduledDate && (
                <p className="text-sm text-error">{errors.scheduledDate}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="scheduledTime">Time *</Label>
              <Input
                id="scheduledTime"
                type="time"
                value={formData.scheduledTime}
                onChange={(e) => handleInputChange('scheduledTime', e.target.value)}
                required
              />
              {errors.scheduledTime && (
                <p className="text-sm text-error">{errors.scheduledTime}</p>
              )}
            </div>
          </div>

          {/* Timezone */}
          <div className="space-y-2">
            <Label htmlFor="timezone">Timezone</Label>
            <select
              id="timezone"
              value={formData.timezone}
              onChange={(e) => handleInputChange('timezone', e.target.value)}
              className="w-full p-2 border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-accent"
            >
              <option value="America/New_York">Eastern Time (ET)</option>
              <option value="America/Chicago">Central Time (CT)</option>
              <option value="America/Denver">Mountain Time (MT)</option>
              <option value="America/Los_Angeles">Pacific Time (PT)</option>
              <option value="Europe/London">Greenwich Mean Time (GMT)</option>
              <option value="Europe/Paris">Central European Time (CET)</option>
              <option value="Asia/Tokyo">Japan Standard Time (JST)</option>
              <option value="Australia/Sydney">Australian Eastern Time (AET)</option>
            </select>
          </div>

          {/* Repeat Options */}
          <div className="space-y-2">
            <Label htmlFor="repeatType">Repeat</Label>
            <select
              id="repeatType"
              value={formData.repeatType}
              onChange={(e) => handleInputChange('repeatType', e.target.value as any)}
              className="w-full p-2 border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-accent"
            >
              <option value="none">No repeat</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>

          {/* Repeat Until */}
          {formData.repeatType !== 'none' && (
            <div className="space-y-2">
              <Label htmlFor="repeatUntil">Repeat Until (Optional)</Label>
              <Input
                id="repeatUntil"
                type="date"
                value={formData.repeatUntil || ''}
                onChange={(e) => handleInputChange('repeatUntil', e.target.value)}
                min={formData.scheduledDate}
              />
              {errors.repeatUntil && (
                <p className="text-sm text-error">{errors.repeatUntil}</p>
              )}
            </div>
          )}

          {/* Media Upload */}
          <div className="space-y-2">
            <Label htmlFor="media">Media (Optional)</Label>
            <Input
              id="media"
              type="file"
              accept="image/*,video/mp4"
              multiple
              onChange={handleMediaUpload}
              className="file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-accent file:text-white hover:file:bg-accent/90"
            />
            {errors.media && (
              <p className="text-sm text-error">{errors.media}</p>
            )}
            
            {/* Media Preview */}
            {selectedFiles.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
                {selectedFiles.map((file, index) => (
                  <div key={index} className="relative">
                    <div className="aspect-square bg-muted rounded-lg flex items-center justify-center">
                      {file.type.startsWith('image/') ? (
                        <img
                          src={URL.createObjectURL(file)}
                          alt={`Upload ${index + 1}`}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      ) : (
                        <div className="text-center">
                          <svg className="w-8 h-8 mx-auto text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                          <p className="text-xs mt-1">Video</p>
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveMedia(index)}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-error text-white rounded-full flex items-center justify-center hover:bg-error/90"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Submit Error */}
          {errors.submit && (
            <Card className="border-error/20 bg-error/5">
              <CardContent className="flex items-center space-x-2">
                <svg className="w-5 h-5 text-error" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <span className="text-error">{errors.submit}</span>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <div className="flex justify-end space-x-3">
            <Button
              type="button"
              variant="ghost"
              onClick={onCancel}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              isLoading={isLoading}
              disabled={!formData.title || !formData.content || formData.selectedPlatforms.length === 0}
            >
              {isEditing ? 'Update Schedule' : 'Schedule Post'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default ScheduleForm;