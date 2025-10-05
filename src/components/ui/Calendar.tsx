"use client";

import { useState } from "react";
import { Button } from "./Button";

interface CalendarProps {
  selectedDate: string;
  onDateSelect: (date: string) => void;
  entries: { date: string; mood?: string }[];
}

export function Calendar({ selectedDate, onDateSelect, entries }: CalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(() => {
    const date = new Date(selectedDate);
    return new Date(date.getFullYear(), date.getMonth(), 1);
  });

  const today = new Date().toISOString().split('T')[0];
  
  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const formatDate = (year: number, month: number, day: number) => {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  };

  const getMoodEmoji = (mood?: string) => {
    const moodMap: Record<string, string> = {
      'grateful': '🙏',
      'happy': '😊',
      'peaceful': '☮️',
      'excited': '🎉',
      'content': '😌',
    };
    return moodMap[mood || 'grateful'] || '🙏';
  };

  const hasEntry = (date: string) => {
    return entries.some(entry => entry.date === date);
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  const daysInMonth = getDaysInMonth(currentMonth);
  const firstDay = getFirstDayOfMonth(currentMonth);
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  const days = [];
  
  // Add empty cells for days before the first day of the month
  for (let i = 0; i < firstDay; i++) {
    days.push(<div key={`empty-${i}`} className="h-10"></div>);
  }
  
  // Add days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = formatDate(year, month, day);
    const isSelected = dateStr === selectedDate;
    const isToday = dateStr === today;
    const entry = entries.find(e => e.date === dateStr);
    
    days.push(
      <button
        key={day}
        onClick={() => onDateSelect(dateStr)}
        className={`
          h-10 w-10 rounded-lg text-sm font-medium transition-colors relative
          ${isSelected 
            ? 'bg-primary text-primary-foreground' 
            : isToday
            ? 'bg-accent text-accent-foreground'
            : hasEntry(dateStr)
            ? 'bg-green-100 text-green-800 hover:bg-green-200'
            : 'hover:bg-muted'
          }
        `}
      >
        {day}
        {entry && (
          <div className="absolute -top-1 -right-1 text-xs">
            {getMoodEmoji(entry.mood)}
          </div>
        )}
      </button>
    );
  }

  return (
    <div className="bg-card border border-border rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <Button
          onClick={() => navigateMonth('prev')}
          variant="outline"
          size="sm"
        >
          ←
        </Button>
        <h3 className="text-lg font-semibold text-foreground">
          {currentMonth.toLocaleDateString('en-US', { 
            month: 'long', 
            year: 'numeric' 
          })}
        </h3>
        <Button
          onClick={() => navigateMonth('next')}
          variant="outline"
          size="sm"
        >
          →
        </Button>
      </div>
      
      <div className="grid grid-cols-7 gap-1 mb-2">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="text-center text-xs font-medium text-muted-foreground py-2">
            {day}
          </div>
        ))}
      </div>
      
      <div className="grid grid-cols-7 gap-1">
        {days}
      </div>
      
      <div className="mt-4 flex items-center justify-center gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-primary"></div>
          <span>Selected</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-accent"></div>
          <span>Today</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-green-100"></div>
          <span>Has Entry</span>
        </div>
      </div>
    </div>
  );
}
