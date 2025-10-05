import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getNeynarUser } from "~/lib/neynar";
import { getGratitudeEntries } from "~/lib/kv";
import { GratitudeSharePage } from "~/components/GratitudeSharePage";
import { APP_DESCRIPTION } from "~/lib/constants";

interface SharePageProps {
  params: { fid: string };
}

export async function generateMetadata({ params }: SharePageProps): Promise<Metadata> {
  const fid = parseInt(params.fid);
  
  if (isNaN(fid)) {
    return {
      title: "User Not Found",
    };
  }

  try {
    const user = await getNeynarUser(fid);
    const username = user?.username || `User ${fid}`;
    
    return {
      title: `${username}'s Gratitude Journal`,
      description: `View ${username}'s public gratitude entries and be inspired by their journey of gratitude.`,
      openGraph: {
        title: `${username}'s Gratitude Journal`,
        description: `View ${username}'s public gratitude entries and be inspired by their journey of gratitude.`,
        type: "website",
      },
    };
  } catch {
    return {
      title: "Gratitude Journal",
      description: APP_DESCRIPTION,
    };
  }
}

export default async function SharePage({ params }: SharePageProps) {
  const fid = parseInt(params.fid);
  
  if (isNaN(fid)) {
    notFound();
  }

  try {
    const [user, entries] = await Promise.all([
      getNeynarUser(fid),
      getGratitudeEntries(fid, 10) // Get last 10 entries
    ]);

    if (!user) {
      notFound();
    }

    // Filter to only public entries
    const publicEntries = entries.filter(entry => entry.isPublic);

    return (
      <GratitudeSharePage 
        user={user} 
        entries={publicEntries}
      />
    );
  } catch (err) {
    console.error('Error loading share page:', err);
    notFound();
  }
}