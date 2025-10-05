"use client";

import { GratitudeEntry as GratitudeEntryType } from "~/lib/kv";
import { GratitudeEntry } from "./GratitudeEntry";

interface GratitudeListProps {
  entries: GratitudeEntryType[];
  onEntryUpdate: (date: string, content: string, mood: string, isPublic: boolean) => Promise<void>;
  onEntryDelete: (date: string) => Promise<void>;
  isLoading?: boolean;
}

export function GratitudeList({ 
  entries, 
  onEntryUpdate, 
  onEntryDelete, 
  isLoading = false 
}: GratitudeListProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-card border border-border rounded-lg p-4 animate-pulse">
            <div className="h-4 bg-muted rounded w-1/3 mb-3"></div>
            <div className="h-3 bg-muted rounded w-1/4 mb-2"></div>
            <div className="space-y-2">
              <div className="h-3 bg-muted rounded"></div>
              <div className="h-3 bg-muted rounded w-3/4"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-6xl mb-4">📝</div>
        <h3 className="text-lg font-semibold text-foreground mb-2">
          No entries yet
        </h3>
        <p className="text-muted-foreground">
          Start your gratitude journey by writing your first entry!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {entries.map((entry) => (
        <GratitudeEntry
          key={entry.id}
          entry={entry}
          date={entry.date}
          onSave={async (content, mood, isPublic) => {
            await onEntryUpdate(entry.date, content, mood, isPublic);
          }}
          onDelete={async () => {
            await onEntryDelete(entry.date);
          }}
        />
      ))}
    </div>
  );
}
