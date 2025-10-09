/**
 * Calendar Component
 * Interactive calendar for displaying and managing scheduled posts
 */

'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface ScheduledPost {
  id: string;
  title: string;
  content: string;
  platforms: string[];
  scheduledTime: Date;
  status: 'scheduled' | 'published' | 'failed' | 'draft';
  userId: string;
  createdAt: Date;
}

interface CalendarProps {
  scheduledPosts: ScheduledPost[];
  onDateClick: (date: Date) => void;
  onPostClick: (post: ScheduledPost) => void;
  selectedDate?: Date;
  minDate?: Date;
  maxDate?: Date;
}

interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  posts: ScheduledPost[];
  isPast: boolean;
}

export const Calendar: React.FC<CalendarProps> = ({
  scheduledPosts,
  onDateClick,
  onPostClick,
  selectedDate,
  minDate,
  maxDate
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const today = new Date();

  // Navigation handlers
  const goToPreviousMonth = useCallback(() => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(newDate.getMonth() - 1);
      
      // Security: Validate against minDate
      if (minDate && newDate < minDate) {
        const minMonth = new Date(minDate);
        minMonth.setDate(1);
        return minMonth;
      }
      
      return newDate;
    });
  }, [minDate]);

  const goToNextMonth = useCallback(() => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(newDate.getMonth() + 1);
      
      // Security: Validate against maxDate
      if (maxDate && newDate > maxDate) {
        const maxMonth = new Date(maxDate);
        maxMonth.setDate(1);
        return maxMonth;
      }
      
      return newDate;
    });
  }, [maxDate]);

  const goToToday = useCallback(() => {
    setCurrentDate(new Date());
  }, []);

  // Generate calendar days
  const calendarDays = useMemo((): CalendarDay[] => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    // Get first day of month and determine starting day of week
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    // Generate 42 days (6 weeks)
    const days: CalendarDay[] = [];
    const currentDateLoop = new Date(startDate);
    
    for (let i = 0; i < 42; i++) {
      const dateStr = currentDateLoop.toDateString();
      const todayStr = today.toDateString();
      const selectedDateStr = selectedDate?.toDateString();
      
      // Filter posts for this day
      const dayPosts = scheduledPosts.filter(post => {
        const postDate = new Date(post.scheduledTime);
        return postDate.toDateString() === dateStr;
      });
      
      days.push({
        date: new Date(currentDateLoop),
        isCurrentMonth: currentDateLoop.getMonth() === month,
        isToday: dateStr === todayStr,
        isSelected: dateStr === selectedDateStr,
        posts: dayPosts,
        isPast: currentDateLoop < today && dateStr !== todayStr
      });
      
      currentDateLoop.setDate(currentDateLoop.getDate() + 1);
    }
    
    return days;
  }, [currentDate, scheduledPosts, selectedDate, today]);

  // Handle date click with validation
  const handleDateClick = useCallback((day: CalendarDay) => {
    // Security: Validate date is not in the past (unless it's today)
    if (day.isPast && !day.isToday) {
      return;
    }
    
    // Security: Validate against min/max dates
    if (minDate && day.date < minDate) return;
    if (maxDate && day.date > maxDate) return;
    
    onDateClick(day.date);
  }, [onDateClick, minDate, maxDate]);

  // Handle post click with validation
  const handlePostClick = useCallback((post: ScheduledPost, event: React.MouseEvent) => {
    event.stopPropagation();
    
    // Security: Validate post exists in our array
    const validPost = scheduledPosts.find(p => p.id === post.id);
    if (!validPost) return;
    
    onPostClick(validPost);
  }, [onPostClick, scheduledPosts]);

  // Get status color for posts
  const getStatusColor = useCallback((status: ScheduledPost['status']) => {
    const colors = {
      scheduled: 'bg-accent text-white',
      published: 'bg-success text-white',
      failed: 'bg-error text-white',
      draft: 'bg-warning text-white'
    };
    return colors[status] || 'bg-muted text-text-muted';
  }, []);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <svg className="w-5 h-5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span>{monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}</span>
          </CardTitle>
          <div className="flex items-center space-x-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={goToPreviousMonth}
              disabled={minDate && new Date(currentDate.getFullYear(), currentDate.getMonth() - 1) < minDate}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Button>
            <Button variant="ghost" size="sm" onClick={goToToday}>
              Today
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={goToNextMonth}
              disabled={maxDate && new Date(currentDate.getFullYear(), currentDate.getMonth() + 1) > maxDate}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1">
          {/* Day headers */}
          {dayNames.map(day => (
            <div key={day} className="p-2 text-center text-sm font-medium text-text-muted">
              {day}
            </div>
          ))}
          
          {/* Calendar days */}
          {calendarDays.map((day, index) => (
            <div
              key={index}
              className={`min-h-[100px] p-1 border border-border rounded cursor-pointer transition-colors ${
                !day.isCurrentMonth
                  ? 'bg-muted/30 text-text-muted'
                  : day.isPast && !day.isToday
                  ? 'bg-muted/50 text-text-muted cursor-not-allowed'
                  : 'bg-background hover:bg-muted/20'
              } ${
                day.isSelected
                  ? 'ring-2 ring-accent bg-accent/5'
                  : ''
              } ${
                day.isToday
                  ? 'ring-1 ring-accent/50'
                  : ''
              }`}
              onClick={() => handleDateClick(day)}
            >
              {/* Day number */}
              <div className={`text-sm font-medium mb-1 ${
                day.isToday
                  ? 'text-accent font-bold'
                  : day.isCurrentMonth
                  ? 'text-text-primary'
                  : 'text-text-muted'
              }`}>
                {day.date.getDate()}
              </div>
              
              {/* Posts for this day */}
              <div className="space-y-1">
                {day.posts.slice(0, 3).map(post => (
                  <div
                    key={post.id}
                    className={`px-2 py-1 rounded text-xs truncate cursor-pointer hover:opacity-80 transition-opacity ${getStatusColor(post.status)}`}
                    onClick={(e) => handlePostClick(post, e)}
                    title={`${post.title} - ${post.platforms.join(', ')}`}
                  >
                    {post.title || 'Untitled Post'}
                  </div>
                ))}
                {day.posts.length > 3 && (
                  <div className="text-xs text-text-muted px-1">
                    +{day.posts.length - 3} more
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
        
        {/* Legend */}
        <div className="mt-4 flex items-center justify-center space-x-6 text-xs">
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 rounded bg-accent"></div>
            <span>Scheduled</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 rounded bg-success"></div>
            <span>Published</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 rounded bg-error"></div>
            <span>Failed</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 rounded bg-warning"></div>
            <span>Draft</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default Calendar;