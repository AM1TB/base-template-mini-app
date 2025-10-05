"use client";

import { useState, useEffect, useCallback } from "react";
import { useMiniApp } from "@neynar/react";
import { fetchWithAuth } from "~/lib/auth";
import { GratitudeEntry as GratitudeEntryType } from "~/lib/kv";
import { GratitudeEntry } from "./ui/GratitudeEntry";
import { GratitudeList } from "./ui/GratitudeList";
import { Calendar } from "./ui/Calendar";
import { Button } from "./ui/Button";
import { Header } from "./ui/Header";
import { GratitudeFooter } from "./ui/GratitudeFooter";

export type Tab = "today" | "calendar" | "history" | "share";

export default function GratitudeJournal() {
  const { isSDKLoaded, context } = useMiniApp();
  const [activeTab, setActiveTab] = useState<Tab>("today");
  const [selectedDate, setSelectedDate] = useState(() => 
    new Date().toISOString().split('T')[0]
  );
  const [entries, setEntries] = useState<GratitudeEntryType[]>([]);
  const [currentEntry, setCurrentEntry] = useState<GratitudeEntryType | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Development mode - bypass authentication for local testing
  const isDevelopment = process.env.NODE_ENV === 'development' && !context?.user?.fid;
  const mockFid = 12345; // Mock FID for development
  const currentFid = context?.user?.fid || mockFid;

  // Fetch entries for the current user
  const fetchEntries = useCallback(async () => {
    if (!currentFid) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      if (isDevelopment) {
        // Mock data for development
        setEntries([]);
      } else {
        const response = await fetchWithAuth('/api/gratitude');
        const data = await response.json();
        setEntries(data.entries || []);
      }
    } catch (err) {
      console.error('Failed to fetch entries:', err);
      setError('Failed to load entries');
    } finally {
      setIsLoading(false);
    }
  }, [currentFid, isDevelopment]);

  // Fetch specific entry for selected date
  const fetchEntry = useCallback(async (date: string) => {
    if (!currentFid) return;
    
    try {
      if (isDevelopment) {
        // Mock data for development
        setCurrentEntry(null);
      } else {
        const response = await fetchWithAuth(`/api/gratitude/${date}`);
        if (response.ok) {
          const data = await response.json();
          setCurrentEntry(data.entry);
        } else if (response.status === 404) {
          setCurrentEntry(null);
        } else {
          throw new Error('Failed to fetch entry');
        }
      }
    } catch (err) {
      console.error('Failed to fetch entry:', err);
      setCurrentEntry(null);
    }
  }, [currentFid, isDevelopment]);

  // Save or update entry
  const saveEntry = useCallback(async (content: string, mood: string, isPublic: boolean) => {
    if (!currentFid) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      if (isDevelopment) {
        // Mock save for development
        const mockEntry: GratitudeEntryType = {
          id: `${currentFid}-${selectedDate}-${Date.now()}`,
          fid: currentFid,
          content,
          date: selectedDate,
          createdAt: Date.now(),
          mood: mood as GratitudeEntryType['mood'],
          isPublic,
        };
        setCurrentEntry(mockEntry);
        setEntries(prev => [mockEntry, ...prev.filter(e => e.date !== selectedDate)]);
      } else {
        const response = await fetchWithAuth('/api/gratitude', {
          method: 'POST',
          body: JSON.stringify({
            content,
            date: selectedDate,
            mood,
            isPublic,
          }),
        });
        
        if (response.ok) {
          const data = await response.json();
          setCurrentEntry(data.entry);
          await fetchEntries(); // Refresh the list
        } else {
          throw new Error('Failed to save entry');
        }
      }
    } catch (err) {
      console.error('Failed to save entry:', err);
      setError('Failed to save entry');
    } finally {
      setIsLoading(false);
    }
  }, [currentFid, selectedDate, fetchEntries, isDevelopment]);

  // Delete entry
  const deleteEntry = useCallback(async (date: string) => {
    if (!currentFid) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      if (isDevelopment) {
        // Mock delete for development
        setCurrentEntry(null);
        setEntries(prev => prev.filter(e => e.date !== date));
      } else {
        const response = await fetchWithAuth(`/api/gratitude/${date}`, {
          method: 'DELETE',
        });
        
        if (response.ok) {
          setCurrentEntry(null);
          await fetchEntries(); // Refresh the list
        } else {
          throw new Error('Failed to delete entry');
        }
      }
    } catch (err) {
      console.error('Failed to delete entry:', err);
      setError('Failed to delete entry');
    } finally {
      setIsLoading(false);
    }
  }, [currentFid, fetchEntries, isDevelopment]);

  // Load data when component mounts or user changes
  useEffect(() => {
    if (isSDKLoaded && (context?.user?.fid || isDevelopment)) {
      fetchEntries();
    }
  }, [isSDKLoaded, context?.user?.fid, isDevelopment, fetchEntries]);

  // Load entry when selected date changes
  useEffect(() => {
    if (context?.user?.fid || isDevelopment) {
      fetchEntry(selectedDate);
    }
  }, [selectedDate, context?.user?.fid, isDevelopment, fetchEntry]);

  if (!isSDKLoaded) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!context?.user?.fid && !isDevelopment) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="text-6xl mb-4">🔐</div>
          <h2 className="text-xl font-semibold text-foreground mb-2">
            Authentication Required
          </h2>
          <p className="text-muted-foreground">
            Please sign in to access your gratitude journal.
          </p>
          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              <strong>For Testing:</strong> This app requires Farcaster authentication. 
              To test locally, use the Warpcast Developer Tools or deploy to Vercel.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const isToday = selectedDate === new Date().toISOString().split('T')[0];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="mx-auto py-4 px-4 pb-20 max-w-2xl">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            🙏 Gratitude Journal
          </h1>
          <p className="text-muted-foreground">
            Reflect on the positive moments in your life
          </p>
          {isDevelopment && (
            <div className="mt-2 px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium inline-block">
              🧪 Development Mode
            </div>
          )}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <p className="text-red-800 text-sm">{error}</p>
            <Button
              onClick={() => setError(null)}
              className="mt-2 bg-gray-500 hover:bg-gray-600"
            >
              Dismiss
            </Button>
          </div>
        )}

        {activeTab === "today" && (
          <div className="space-y-4">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-foreground mb-1">
                {isToday ? "Today's Entry" : formatDate(selectedDate)}
              </h2>
              {!isToday && (
                <Button
                  onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
                  className="mt-2 bg-gray-500 hover:bg-gray-600"
                >
                  Go to Today
                </Button>
              )}
            </div>
            
            <GratitudeEntry
              entry={currentEntry || undefined}
              date={selectedDate}
              onSave={saveEntry}
              onDelete={currentEntry ? () => deleteEntry(selectedDate) : undefined}
              isLoading={isLoading}
            />
          </div>
        )}

        {activeTab === "calendar" && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground text-center">
              Calendar View
            </h2>
            <Calendar
              selectedDate={selectedDate}
              onDateSelect={(date) => {
                setSelectedDate(date);
                setActiveTab("today");
              }}
              entries={entries.map(entry => ({
                date: entry.date,
                mood: entry.mood,
              }))}
            />
          </div>
        )}

        {activeTab === "history" && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground text-center">
              Your Gratitude History
            </h2>
            <GratitudeList
              entries={entries}
              onEntryUpdate={async (date, content, mood, isPublic) => {
                await saveEntry(content, mood, isPublic);
              }}
              onEntryDelete={deleteEntry}
              isLoading={isLoading}
            />
          </div>
        )}

        {activeTab === "share" && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground text-center">
              Share Your Gratitude
            </h2>
            <div className="bg-card border border-border rounded-lg p-6 text-center">
              <div className="text-6xl mb-4">🌟</div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Spread Positivity
              </h3>
              <p className="text-muted-foreground mb-4">
                Share your gratitude journey with the Farcaster community and inspire others to practice gratitude.
              </p>
              <div className="space-y-3">
                <Button
                  onClick={() => {
                    const publicEntries = entries.filter(entry => entry.isPublic);
                    if (publicEntries.length === 0) {
                      alert('You need to make some entries public first!');
                      return;
                    }
                    if (isDevelopment) {
                      alert(`Development Mode: Would share ${publicEntries.length} public entries`);
                    } else {
                      // This would integrate with the sharing functionality
                      alert('Sharing feature coming soon!');
                    }
                  }}
                  className="w-full"
                >
                  Share Public Entries
                </Button>
                <Button
                  onClick={() => {
                    const todayEntry = entries.find(entry => 
                      entry.date === new Date().toISOString().split('T')[0]
                    );
                    if (!todayEntry) {
                      alert('Write today&apos;s entry first!');
                      return;
                    }
                    if (isDevelopment) {
                      alert('Development Mode: Would share today\'s entry');
                    } else {
                      // This would integrate with the sharing functionality
                      alert('Sharing feature coming soon!');
                    }
                  }}
                  className="w-full bg-gray-500 hover:bg-gray-600"
                >
                  Share Today&apos;s Entry
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      <GratitudeFooter
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />
    </div>
  );
}
