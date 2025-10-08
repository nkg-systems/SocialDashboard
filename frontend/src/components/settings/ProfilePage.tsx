/**
 * User Profile Management Page
 * Allows users to edit their personal information, profile picture, and basic account details
 */

'use client';

import React, { useState, useCallback, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  validateName, 
  validateEmail, 
  validateBio, 
  sanitizeHtml, 
  validateImageFile 
} from '@/utils/validation';

interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  username: string;
  bio: string;
  avatarUrl?: string;
  timezone: string;
  language: string;
  createdAt: string;
  updatedAt: string;
}

interface ProfileFormData {
  firstName: string;
  lastName: string;
  email: string;
  bio: string;
  timezone: string;
  language: string;
}

interface FormErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
  bio?: string;
  avatar?: string;
  submit?: string;
}

export const ProfilePage: React.FC = () => {
  // Mock user data - in real app this would come from API/context
  const [profile, setProfile] = useState<UserProfile>({
    id: '1',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    username: 'johndoe',
    bio: 'Social media enthusiast and content creator',
    avatarUrl: '',
    timezone: 'America/New_York',
    language: 'en',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-15T00:00:00Z',
  });

  const [formData, setFormData] = useState<ProfileFormData>({
    firstName: profile.firstName,
    lastName: profile.lastName,
    email: profile.email,
    bio: profile.bio,
    timezone: profile.timezone,
    language: profile.language,
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isChanged, setIsChanged] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>(profile.avatarUrl || '');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle form field changes
  const handleInputChange = useCallback((field: keyof ProfileFormData, value: string) => {
    // Security: Sanitize input
    const sanitizedValue = sanitizeHtml(value);
    
    setFormData(prev => ({
      ...prev,
      [field]: sanitizedValue
    }));

    // Clear field error on change
    if (errors[field as keyof FormErrors]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined
      }));
    }

    setIsChanged(true);
  }, [errors]);

  // Validate form
  const validateForm = useCallback((): boolean => {
    const newErrors: FormErrors = {};

    // Validate first name
    if (!validateName(formData.firstName)) {
      newErrors.firstName = 'First name must be 1-50 characters and contain only letters, spaces, hyphens, and apostrophes';
    }

    // Validate last name
    if (!validateName(formData.lastName)) {
      newErrors.lastName = 'Last name must be 1-50 characters and contain only letters, spaces, hyphens, and apostrophes';
    }

    // Validate email
    if (!validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Validate bio
    if (formData.bio && !validateBio(formData.bio)) {
      newErrors.bio = 'Bio must be less than 500 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  // Handle avatar upload
  const handleAvatarUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file
    if (!validateImageFile(file)) {
      setErrors(prev => ({
        ...prev,
        avatar: 'Please select a valid image file (JPG, PNG, WebP) under 5MB'
      }));
      return;
    }

    setAvatarFile(file);
    setIsChanged(true);

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Clear avatar error
    setErrors(prev => ({
      ...prev,
      avatar: undefined
    }));
  }, []);

  // Handle form submission
  const handleSubmit = useCallback(async (event: React.FormEvent) => {
    event.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Update profile
      const updatedProfile: UserProfile = {
        ...profile,
        ...formData,
        avatarUrl: previewUrl,
        updatedAt: new Date().toISOString(),
      };
      
      setProfile(updatedProfile);
      setIsChanged(false);

      // TODO: Show success notification
      console.log('Profile updated successfully');

    } catch (error) {
      setErrors({
        submit: 'Failed to update profile. Please try again.'
      });
    } finally {
      setIsLoading(false);
    }
  }, [formData, validateForm, profile, previewUrl]);

  // Reset form
  const handleReset = useCallback(() => {
    setFormData({
      firstName: profile.firstName,
      lastName: profile.lastName,
      email: profile.email,
      bio: profile.bio,
      timezone: profile.timezone,
      language: profile.language,
    });
    setErrors({});
    setIsChanged(false);
    setAvatarFile(null);
    setPreviewUrl(profile.avatarUrl || '');
  }, [profile]);

  const timezones = [
    { value: 'America/New_York', label: 'Eastern Time (ET)' },
    { value: 'America/Chicago', label: 'Central Time (CT)' },
    { value: 'America/Denver', label: 'Mountain Time (MT)' },
    { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
    { value: 'Europe/London', label: 'Greenwich Mean Time (GMT)' },
    { value: 'Europe/Paris', label: 'Central European Time (CET)' },
    { value: 'Asia/Tokyo', label: 'Japan Standard Time (JST)' },
    { value: 'Australia/Sydney', label: 'Australian Eastern Time (AET)' },
  ];

  const languages = [
    { value: 'en', label: 'English' },
    { value: 'es', label: 'Español' },
    { value: 'fr', label: 'Français' },
    { value: 'de', label: 'Deutsch' },
    { value: 'it', label: 'Italiano' },
    { value: 'pt', label: 'Português' },
    { value: 'ja', label: '日本語' },
    { value: 'ko', label: '한국어' },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="sm3d-text-h1">Profile Settings</h1>
        <p className="sm3d-text-body mt-1">
          Manage your personal information and account preferences
        </p>
      </div>

      {/* Profile Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Avatar Upload */}
            <div className="flex items-center space-x-4">
              <div className="relative">
                <div className="w-20 h-20 rounded-full bg-gray-200 overflow-hidden border-2 border-gray-300">
                  {previewUrl ? (
                    <img
                      src={previewUrl}
                      alt="Profile"
                      className="w-full h-full object-cover"
                      onError={() => setPreviewUrl('')}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  Upload Photo
                </Button>
                <p className="text-xs text-text-muted">
                  JPG, PNG or WebP. Max size 5MB.
                </p>
                {errors.avatar && (
                  <p className="text-xs text-error">{errors.avatar}</p>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleAvatarUpload}
                className="hidden"
              />
            </div>

            {/* Name Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name *</Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => handleInputChange('firstName', e.target.value)}
                  maxLength={50}
                  required
                />
                {errors.firstName && (
                  <p className="text-sm text-error">{errors.firstName}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name *</Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => handleInputChange('lastName', e.target.value)}
                  maxLength={50}
                  required
                />
                {errors.lastName && (
                  <p className="text-sm text-error">{errors.lastName}</p>
                )}
              </div>
            </div>

            {/* Email and Username */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  required
                />
                {errors.email && (
                  <p className="text-sm text-error">{errors.email}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  value={profile.username}
                  disabled
                  className="bg-gray-50"
                />
                <p className="text-xs text-text-muted">
                  Username cannot be changed
                </p>
              </div>
            </div>

            {/* Bio */}
            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                value={formData.bio}
                onChange={(e) => handleInputChange('bio', e.target.value)}
                maxLength={500}
                rows={3}
                placeholder="Tell us about yourself..."
              />
              <div className="flex justify-between text-xs text-text-muted">
                <span>{errors.bio && <span className="text-error">{errors.bio}</span>}</span>
                <span>{formData.bio.length}/500</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Preferences</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Timezone */}
            <div className="space-y-2">
              <Label htmlFor="timezone">Timezone</Label>
              <select
                id="timezone"
                value={formData.timezone}
                onChange={(e) => handleInputChange('timezone', e.target.value)}
                className="w-full p-2 border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-accent"
              >
                {timezones.map((tz) => (
                  <option key={tz.value} value={tz.value}>
                    {tz.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Language */}
            <div className="space-y-2">
              <Label htmlFor="language">Language</Label>
              <select
                id="language"
                value={formData.language}
                onChange={(e) => handleInputChange('language', e.target.value)}
                className="w-full p-2 border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-accent"
              >
                {languages.map((lang) => (
                  <option key={lang.value} value={lang.value}>
                    {lang.label}
                  </option>
                ))}
              </select>
            </div>
          </CardContent>
        </Card>

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
            onClick={handleReset}
            disabled={!isChanged || isLoading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            isLoading={isLoading}
            disabled={!isChanged}
          >
            Save Changes
          </Button>
        </div>
      </form>

      {/* Account Info */}
      <Card>
        <CardHeader>
          <CardTitle>Account Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-text-muted">Account Created:</span>
              <p className="font-medium">
                {new Date(profile.createdAt).toLocaleDateString()}
              </p>
            </div>
            <div>
              <span className="text-text-muted">Last Updated:</span>
              <p className="font-medium">
                {new Date(profile.updatedAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfilePage;