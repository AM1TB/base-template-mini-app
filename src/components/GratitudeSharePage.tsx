"use client";

import { GratitudeEntry as GratitudeEntryType } from "~/lib/kv";
import { Button } from "./ui/Button";
import { APP_URL } from "~/lib/constants";

interface GratitudeSharePageProps {
  user: {
    fid: number;
    username: string;
    display_name: string;
    pfp_url?: string;
  };
  entries: GratitudeEntryType[];
}

export function GratitudeSharePage({ user, entries }: GratitudeSharePageProps) {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      month: 'long', 
      day: 'numeric', 
      year: 'numeric' 
    });
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

  const shareUrl = `${APP_URL}/share/${user.fid}`;

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      alert('Link copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto py-8 px-4 max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            {user.pfp_url && (
              <img
                src={user.pfp_url}
                alt={user.display_name}
                className="w-16 h-16 rounded-full mr-4"
              />
            )}
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                {user.display_name || user.username}&apos;s Gratitude Journal
              </h1>
              <p className="text-muted-foreground">
                @{user.username}
              </p>
            </div>
          </div>
          
          <div className="flex items-center justify-center gap-4 mb-6">
            <Button
              onClick={copyToClipboard}
              variant="outline"
              size="sm"
            >
              📋 Copy Link
            </Button>
            <Button
              onClick={() => window.open(`https://warpcast.com/${user.username}`, '_blank')}
              variant="outline"
              size="sm"
            >
              👤 View Profile
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="bg-card border border-border rounded-lg p-6 mb-8">
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-foreground">
                {entries.length}
              </div>
              <div className="text-sm text-muted-foreground">
                Public Entries
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold text-foreground">
                {entries.length > 0 ? Math.ceil(entries.length / 7) : 0}
              </div>
              <div className="text-sm text-muted-foreground">
                Weeks of Gratitude
              </div>
            </div>
          </div>
        </div>

        {/* Entries */}
        {entries.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🔒</div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              No Public Entries Yet
            </h3>
            <p className="text-muted-foreground">
              {user.display_name || user.username} hasn&apos;t shared any public gratitude entries yet.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-foreground text-center">
              Recent Gratitude Entries
            </h2>
            
            {entries.map((entry) => (
              <div key={entry.id} className="bg-card border border-border rounded-lg p-6">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">
                      {getMoodEmoji(entry.mood)}
                    </span>
                    <span className="text-sm font-medium text-muted-foreground">
                      {formatDate(entry.date)}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {new Date(entry.createdAt).toLocaleTimeString('en-US', {
                      hour: 'numeric',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
                
                <p className="text-foreground leading-relaxed">
                  {entry.content}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Call to Action */}
        <div className="mt-12 text-center">
          <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-6">
            <div className="text-4xl mb-4">🌟</div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Start Your Own Gratitude Journey
            </h3>
            <p className="text-muted-foreground mb-4">
              Join the community and begin reflecting on the positive moments in your life.
            </p>
            <Button
              onClick={() => window.open(APP_URL, '_blank')}
              className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600"
            >
              Start Journaling
            </Button>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p>
            Powered by <span className="font-semibold">Gratitude Journal</span> on Farcaster
          </p>
        </div>
      </div>
    </div>
  );
}
