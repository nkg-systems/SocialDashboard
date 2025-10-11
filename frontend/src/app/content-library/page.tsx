/**
 * Content Library Page Route
 * Main page for accessing the unified content library
 */

import React from 'react';
import { ContentLibraryPage } from '@/components/content-library/ContentLibraryPage';

export default function ContentLibrary() {
  return <ContentLibraryPage />;
}

export const metadata = {
  title: 'Content Library | Social Dashboard',
  description: 'Manage your media assets and content templates in one place'
};