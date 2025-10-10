/**
 * Template Manager Component
 * Manages reusable content templates with variables and categories
 */

'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { sanitizeHtml, validatePostContent } from '@/utils/validation';

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

interface TemplateCategory {
  id: string;
  name: string;
  description: string;
  templateCount: number;
}

type SortField = 'name' | 'createdAt' | 'updatedAt' | 'usageCount';
type SortDirection = 'asc' | 'desc';

interface TemplateManagerProps {
  onSelectTemplate?: (template: ContentTemplate) => void;
  selectionMode?: boolean;
}

export const TemplateManager: React.FC<TemplateManagerProps> = ({
  onSelectTemplate,
  selectionMode = false
}) => {
  const [templates, setTemplates] = useState<ContentTemplate[]>([
    {
      id: '1',
      name: 'Product Launch Announcement',
      description: 'Template for announcing new product launches',
      content: '🚀 Excited to announce our latest {{product_name}}!\n\n{{product_description}}\n\nCheck it out: {{product_url}}\n\n{{hashtags}}',
      category: 'product',
      variables: [
        { name: 'product_name', type: 'text', placeholder: 'Enter product name', required: true },
        { name: 'product_description', type: 'text', placeholder: 'Brief product description', required: true },
        { name: 'product_url', type: 'url', placeholder: 'Product URL', required: true },
        { name: 'hashtags', type: 'hashtag', placeholder: 'Relevant hashtags', required: false, defaultValue: '#NewProduct #Innovation' }
      ],
      platforms: ['twitter', 'facebook', 'linkedin'],
      tags: ['product', 'announcement', 'launch'],
      createdAt: new Date('2024-01-15'),
      updatedAt: new Date('2024-01-15'),
      usageCount: 12,
      userId: 'user1'
    },
    {
      id: '2',
      name: 'Weekly Team Update',
      description: 'Template for sharing weekly team accomplishments',
      content: '📈 This week our team accomplished:\n\n• {{achievement_1}}\n• {{achievement_2}}\n• {{achievement_3}}\n\nGreat work everyone! {{team_mention}}',
      category: 'updates',
      variables: [
        { name: 'achievement_1', type: 'text', placeholder: 'First achievement', required: true },
        { name: 'achievement_2', type: 'text', placeholder: 'Second achievement', required: true },
        { name: 'achievement_3', type: 'text', placeholder: 'Third achievement', required: false },
        { name: 'team_mention', type: 'mention', placeholder: '@team handle', required: false }
      ],
      platforms: ['linkedin', 'twitter'],
      tags: ['team', 'update', 'weekly'],
      createdAt: new Date('2024-01-10'),
      updatedAt: new Date('2024-01-20'),
      usageCount: 8,
      userId: 'user1'
    }
  ]);

  const [categories] = useState<TemplateCategory[]>([
    { id: 'all', name: 'All Templates', description: 'All available templates', templateCount: 0 },
    { id: 'product', name: 'Product', description: 'Product-related templates', templateCount: 1 },
    { id: 'updates', name: 'Updates', description: 'Update and announcement templates', templateCount: 1 },
    { id: 'marketing', name: 'Marketing', description: 'Marketing campaign templates', templateCount: 0 },
    { id: 'events', name: 'Events', description: 'Event promotion templates', templateCount: 0 }
  ]);

  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField>('updatedAt');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<ContentTemplate | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<ContentTemplate | null>(null);
  const [previewVariables, setPreviewVariables] = useState<Record<string, string>>({});

  // Form state for template creation/editing
  const [templateForm, setTemplateForm] = useState({
    name: '',
    description: '',
    content: '',
    category: 'marketing',
    platforms: [] as string[],
    tags: '',
    variables: [] as TemplateVariable[]
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Filter and sort templates
  const filteredAndSortedTemplates = useMemo(() => {
    let filtered = templates;

    // Apply category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(template => template.category === selectedCategory);
    }

    // Apply search filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(template =>
        template.name.toLowerCase().includes(term) ||
        template.description.toLowerCase().includes(term) ||
        template.content.toLowerCase().includes(term) ||
        template.tags.some(tag => tag.toLowerCase().includes(term))
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;

      switch (sortField) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'createdAt':
          aValue = new Date(a.createdAt).getTime();
          bValue = new Date(b.createdAt).getTime();
          break;
        case 'updatedAt':
          aValue = new Date(a.updatedAt).getTime();
          bValue = new Date(b.updatedAt).getTime();
          break;
        case 'usageCount':
          aValue = a.usageCount;
          bValue = b.usageCount;
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [templates, selectedCategory, searchTerm, sortField, sortDirection]);

  // Handle search input
  const handleSearchChange = useCallback((value: string) => {
    // Security: Sanitize search input
    const sanitized = sanitizeHtml(value).slice(0, 100);
    setSearchTerm(sanitized);
  }, []);

  // Extract variables from template content
  const extractVariables = useCallback((content: string): string[] => {
    const matches = content.match(/\{\{([^}]+)\}\}/g);
    if (!matches) return [];
    
    return matches.map(match => match.replace(/\{\{|\}\}/g, '').trim())
      .filter((value, index, array) => array.indexOf(value) === index); // Remove duplicates
  }, []);

  // Handle template form input changes
  const handleFormInputChange = useCallback((field: string, value: string | string[]) => {
    const sanitizedValue = typeof value === 'string' ? sanitizeHtml(value) : value;
    
    setTemplateForm(prev => ({
      ...prev,
      [field]: sanitizedValue
    }));

    // Auto-detect variables when content changes
    if (field === 'content' && typeof sanitizedValue === 'string') {
      const variableNames = extractVariables(sanitizedValue);
      const newVariables: TemplateVariable[] = variableNames.map(name => {
        // Check if variable already exists
        const existing = templateForm.variables.find(v => v.name === name);
        return existing || {
          name,
          type: 'text',
          placeholder: `Enter ${name}`,
          required: true
        };
      });
      
      setTemplateForm(prev => ({
        ...prev,
        variables: newVariables
      }));
    }

    // Clear field error
    if (formErrors[field]) {
      setFormErrors(prev => ({
        ...prev,
        [field]: undefined
      }));
    }
  }, [templateForm.variables, extractVariables, formErrors]);

  // Validate template form
  const validateTemplateForm = useCallback((): boolean => {
    const errors: Record<string, string> = {};

    if (!templateForm.name.trim()) {
      errors.name = 'Template name is required';
    } else if (templateForm.name.length > 100) {
      errors.name = 'Template name must be less than 100 characters';
    }

    if (!templateForm.description.trim()) {
      errors.description = 'Template description is required';
    } else if (templateForm.description.length > 500) {
      errors.description = 'Template description must be less than 500 characters';
    }

    const contentValidation = validatePostContent(templateForm.content);
    if (!contentValidation.isValid) {
      errors.content = contentValidation.errors[0];
    }

    if (templateForm.platforms.length === 0) {
      errors.platforms = 'Select at least one platform';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }, [templateForm]);

  // Handle template creation/update
  const handleSaveTemplate = useCallback(async () => {
    if (!validateTemplateForm()) return;

    try {
      const templateData: ContentTemplate = {
        id: editingTemplate?.id || `template_${Date.now()}`,
        name: templateForm.name,
        description: templateForm.description,
        content: templateForm.content,
        category: templateForm.category,
        platforms: templateForm.platforms,
        tags: templateForm.tags.split(',').map(tag => tag.trim()).filter(Boolean),
        variables: templateForm.variables,
        createdAt: editingTemplate?.createdAt || new Date(),
        updatedAt: new Date(),
        usageCount: editingTemplate?.usageCount || 0,
        userId: 'user1'
      };

      if (editingTemplate) {
        setTemplates(prev => prev.map(t => t.id === editingTemplate.id ? templateData : t));
      } else {
        setTemplates(prev => [templateData, ...prev]);
      }

      // Reset form
      setTemplateForm({
        name: '',
        description: '',
        content: '',
        category: 'marketing',
        platforms: [],
        tags: '',
        variables: []
      });
      setFormErrors({});
      setShowCreateForm(false);
      setEditingTemplate(null);

    } catch (error) {
      console.error('Failed to save template:', error);
    }
  }, [templateForm, editingTemplate, validateTemplateForm]);

  // Handle template deletion
  const handleDeleteTemplate = useCallback((templateId: string) => {
    // Security: Validate template exists and belongs to user
    const template = templates.find(t => t.id === templateId);
    if (!template || template.userId !== 'user1') return;

    const confirmed = confirm(`Delete "${template.name}"? This action cannot be undone.`);
    if (!confirmed) return;

    setTemplates(prev => prev.filter(t => t.id !== templateId));
  }, [templates]);

  // Handle template editing
  const handleEditTemplate = useCallback((template: ContentTemplate) => {
    setEditingTemplate(template);
    setTemplateForm({
      name: template.name,
      description: template.description,
      content: template.content,
      category: template.category,
      platforms: template.platforms,
      tags: template.tags.join(', '),
      variables: template.variables
    });
    setShowCreateForm(true);
  }, []);

  // Handle template selection
  const handleSelectTemplate = useCallback((template: ContentTemplate) => {
    if (selectionMode && onSelectTemplate) {
      onSelectTemplate(template);
    } else {
      setPreviewTemplate(template);
      // Initialize preview variables with default values
      const initialValues: Record<string, string> = {};
      template.variables.forEach(variable => {
        initialValues[variable.name] = variable.defaultValue || '';
      });
      setPreviewVariables(initialValues);
    }
  }, [selectionMode, onSelectTemplate]);

  // Render preview with variables replaced
  const renderPreviewContent = useCallback((template: ContentTemplate, variables: Record<string, string>): string => {
    let content = template.content;
    
    Object.entries(variables).forEach(([name, value]) => {
      const regex = new RegExp(`\\{\\{${name}\\}\\}`, 'g');
      content = content.replace(regex, value || `{{${name}}}`);
    });
    
    return content;
  }, []);

  // Format date
  const formatDate = useCallback((date: Date): string => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(new Date(date));
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="sm3d-text-h2">Template Library</h2>
          <p className="text-sm text-text-muted mt-1">
            Create and manage reusable content templates
          </p>
        </div>
        <Button onClick={() => setShowCreateForm(true)}>
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Create Template
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <Label htmlFor="template-search" className="sr-only">Search templates</Label>
              <Input
                id="template-search"
                placeholder="Search templates..."
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="p-2 border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-accent"
              >
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
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
                <option value="updatedAt-desc">Recently Updated</option>
                <option value="createdAt-desc">Recently Created</option>
                <option value="name-asc">Name A-Z</option>
                <option value="name-desc">Name Z-A</option>
                <option value="usageCount-desc">Most Used</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Templates Grid */}
      {filteredAndSortedTemplates.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <svg className="w-16 h-16 mx-auto text-text-muted mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-text-muted">No templates found</p>
            <p className="text-sm text-text-muted mt-1">
              {searchTerm || selectedCategory !== 'all' 
                ? 'Try adjusting your filters' 
                : 'Create your first template to get started'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAndSortedTemplates.map((template) => (
            <Card 
              key={template.id} 
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => handleSelectTemplate(template)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{template.name}</CardTitle>
                    <p className="text-sm text-text-muted mt-1">{template.description}</p>
                  </div>
                  <div className="flex space-x-1 ml-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditTemplate(template);
                      }}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteTemplate(template.id);
                      }}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {/* Content Preview */}
                  <div className="bg-muted p-3 rounded text-sm">
                    <p className="line-clamp-3">{template.content}</p>
                  </div>

                  {/* Meta Info */}
                  <div className="flex items-center justify-between text-xs text-text-muted">
                    <span>{template.variables.length} variables</span>
                    <span>{formatDate(template.updatedAt)}</span>
                  </div>

                  {/* Tags */}
                  {template.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {template.tags.slice(0, 3).map((tag) => (
                        <span key={tag} className="px-2 py-1 bg-accent/10 text-accent text-xs rounded">
                          {tag}
                        </span>
                      ))}
                      {template.tags.length > 3 && (
                        <span className="px-2 py-1 bg-muted text-text-muted text-xs rounded">
                          +{template.tags.length - 3}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Platform Icons */}
                  <div className="flex space-x-1">
                    {template.platforms.map(platform => (
                      <div key={platform} className="w-6 h-6 bg-muted rounded flex items-center justify-center">
                        <span className="text-xs">
                          {platform.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Template Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <Card>
              <CardHeader>
                <CardTitle>
                  {editingTemplate ? 'Edit Template' : 'Create New Template'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Template Name */}
                <div className="space-y-2">
                  <Label htmlFor="template-name">Template Name *</Label>
                  <Input
                    id="template-name"
                    value={templateForm.name}
                    onChange={(e) => handleFormInputChange('name', e.target.value)}
                    placeholder="Enter template name..."
                    maxLength={100}
                  />
                  {formErrors.name && (
                    <p className="text-sm text-error">{formErrors.name}</p>
                  )}
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="template-description">Description *</Label>
                  <Textarea
                    id="template-description"
                    value={templateForm.description}
                    onChange={(e) => handleFormInputChange('description', e.target.value)}
                    placeholder="Describe what this template is for..."
                    maxLength={500}
                    rows={3}
                  />
                  {formErrors.description && (
                    <p className="text-sm text-error">{formErrors.description}</p>
                  )}
                </div>

                {/* Content */}
                <div className="space-y-2">
                  <Label htmlFor="template-content">Template Content *</Label>
                  <Textarea
                    id="template-content"
                    value={templateForm.content}
                    onChange={(e) => handleFormInputChange('content', e.target.value)}
                    placeholder="Write your template content. Use {{variable_name}} for dynamic content..."
                    rows={6}
                  />
                  <p className="text-xs text-text-muted">
                    Use double curly braces for variables: {`{{variable_name}}`}
                  </p>
                  {formErrors.content && (
                    <p className="text-sm text-error">{formErrors.content}</p>
                  )}
                </div>

                {/* Category */}
                <div className="space-y-2">
                  <Label htmlFor="template-category">Category</Label>
                  <select
                    id="template-category"
                    value={templateForm.category}
                    onChange={(e) => handleFormInputChange('category', e.target.value)}
                    className="w-full p-2 border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-accent"
                  >
                    {categories.filter(c => c.id !== 'all').map(category => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Platforms */}
                <div className="space-y-2">
                  <Label>Platforms *</Label>
                  <div className="flex flex-wrap gap-2">
                    {['twitter', 'facebook', 'instagram', 'linkedin', 'tiktok'].map(platform => (
                      <label key={platform} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={templateForm.platforms.includes(platform)}
                          onChange={(e) => {
                            const platforms = e.target.checked
                              ? [...templateForm.platforms, platform]
                              : templateForm.platforms.filter(p => p !== platform);
                            handleFormInputChange('platforms', platforms);
                          }}
                          className="rounded border-border focus:ring-accent"
                        />
                        <span className="capitalize">{platform}</span>
                      </label>
                    ))}
                  </div>
                  {formErrors.platforms && (
                    <p className="text-sm text-error">{formErrors.platforms}</p>
                  )}
                </div>

                {/* Tags */}
                <div className="space-y-2">
                  <Label htmlFor="template-tags">Tags</Label>
                  <Input
                    id="template-tags"
                    value={templateForm.tags}
                    onChange={(e) => handleFormInputChange('tags', e.target.value)}
                    placeholder="Enter tags separated by commas..."
                  />
                  <p className="text-xs text-text-muted">
                    Separate tags with commas
                  </p>
                </div>

                {/* Variables Preview */}
                {templateForm.variables.length > 0 && (
                  <div className="space-y-2">
                    <Label>Detected Variables</Label>
                    <div className="bg-muted p-3 rounded space-y-2">
                      {templateForm.variables.map((variable) => (
                        <div key={variable.name} className="text-sm">
                          <code className="bg-background px-2 py-1 rounded text-accent">
                            {`{{${variable.name}}}`}
                          </code>
                          <span className="ml-2 text-text-muted">
                            - {variable.type} {variable.required ? '(required)' : '(optional)'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex justify-end space-x-3 pt-4">
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setShowCreateForm(false);
                      setEditingTemplate(null);
                      setFormErrors({});
                    }}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleSaveTemplate}>
                    {editingTemplate ? 'Update Template' : 'Create Template'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Template Preview Modal */}
      {previewTemplate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <Card>
              <CardHeader>
                <CardTitle>Template Preview: {previewTemplate.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Variables Input */}
                {previewTemplate.variables.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="font-medium">Fill in the variables:</h3>
                    {previewTemplate.variables.map((variable) => (
                      <div key={variable.name} className="space-y-2">
                        <Label htmlFor={`var-${variable.name}`}>
                          {variable.name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          {variable.required && ' *'}
                        </Label>
                        <Input
                          id={`var-${variable.name}`}
                          value={previewVariables[variable.name] || ''}
                          onChange={(e) => setPreviewVariables(prev => ({
                            ...prev,
                            [variable.name]: e.target.value
                          }))}
                          placeholder={variable.placeholder}
                        />
                      </div>
                    ))}
                  </div>
                )}

                {/* Preview */}
                <div className="space-y-2">
                  <Label>Preview:</Label>
                  <div className="bg-muted p-4 rounded whitespace-pre-wrap">
                    {renderPreviewContent(previewTemplate, previewVariables)}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end space-x-3 pt-4">
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setPreviewTemplate(null);
                      setPreviewVariables({});
                    }}
                  >
                    Close
                  </Button>
                  {selectionMode && (
                    <Button
                      onClick={() => {
                        onSelectTemplate?.(previewTemplate);
                        setPreviewTemplate(null);
                        setPreviewVariables({});
                      }}
                    >
                      Use Template
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};

export default TemplateManager;