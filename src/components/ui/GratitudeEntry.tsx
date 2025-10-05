"use client";

import { useState } from "react";
import { Button } from "./Button";
import { GratitudeEntry as GratitudeEntryType } from "~/lib/kv";

interface GratitudeEntryProps {
  entry?: GratitudeEntryType;
  date: string;
  onSave: (content: string, mood: string, isPublic: boolean) => Promise<void>;
  onDelete?: () => Promise<void>;
  isLoading?: boolean;
}

const moodOptions = [
  { value: 'grateful', label: '🙏 Grateful', color: 'bg-green-100 text-green-800' },
  { value: 'happy', label: '😊 Happy', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'peaceful', label: '☮️ Peaceful', color: 'bg-blue-100 text-blue-800' },
  { value: 'excited', label: '🎉 Excited', color: 'bg-purple-100 text-purple-800' },
  { value: 'content', label: '😌 Content', color: 'bg-indigo-100 text-indigo-800' },
];

export function GratitudeEntry({ 
  entry, 
  date, 
  onSave, 
  onDelete, 
  isLoading = false 
}: GratitudeEntryProps) {
  const [content, setContent] = useState(entry?.content || '');
  const [mood, setMood] = useState(entry?.mood || 'grateful');
  const [isPublic, setIsPublic] = useState(entry?.isPublic || false);
  const [isEditing, setIsEditing] = useState(!entry);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const handleSave = async () => {
    if (!content.trim()) return;
    
    await onSave(content.trim(), mood, isPublic);
    setIsEditing(false);
  };

  const handleDelete = async () => {
    if (onDelete && confirm('Are you sure you want to delete this entry?')) {
      await onDelete();
    }
  };

  if (!isEditing && entry) {
    return (
      <div className="bg-card border border-border rounded-lg p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-foreground">
            {formatDate(date)}
          </h3>
          <div className="flex gap-2">
            <Button
              onClick={() => setIsEditing(true)}
              variant="outline"
              size="sm"
            >
              Edit
            </Button>
            {onDelete && (
              <Button
                onClick={handleDelete}
                variant="outline"
                size="sm"
                className="text-red-600 hover:text-red-700"
              >
                Delete
              </Button>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            moodOptions.find(m => m.value === mood)?.color || 'bg-gray-100 text-gray-800'
          }`}>
            {moodOptions.find(m => m.value === mood)?.label}
          </span>
          {isPublic && (
            <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              🌍 Public
            </span>
          )}
        </div>
        
        <p className="text-foreground leading-relaxed">{entry.content}</p>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-lg p-4 space-y-4">
      <h3 className="text-lg font-semibold text-foreground">
        {formatDate(date)}
      </h3>
      
      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            What are you grateful for today?
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write about something you're grateful for..."
            className="w-full p-3 border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
            rows={4}
            maxLength={500}
          />
          <div className="text-xs text-muted-foreground mt-1">
            {content.length}/500 characters
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            How are you feeling?
          </label>
          <div className="grid grid-cols-2 gap-2">
            {moodOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setMood(option.value)}
                className={`p-2 rounded-lg text-sm font-medium transition-colors ${
                  mood === option.value
                    ? option.color
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="isPublic"
            checked={isPublic}
            onChange={(e) => setIsPublic(e.target.checked)}
            className="rounded border-border"
          />
          <label htmlFor="isPublic" className="text-sm text-foreground">
            Make this entry public (can be shared)
          </label>
        </div>
      </div>

      <div className="flex gap-2">
        <Button
          onClick={handleSave}
          disabled={!content.trim() || isLoading}
          isLoading={isLoading}
          className="flex-1"
        >
          {entry ? 'Update Entry' : 'Save Entry'}
        </Button>
        {entry && (
          <Button
            onClick={() => setIsEditing(false)}
            variant="outline"
            disabled={isLoading}
          >
            Cancel
          </Button>
        )}
      </div>
    </div>
  );
}
