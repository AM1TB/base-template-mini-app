import { FrameNotificationDetails } from "@farcaster/frame-sdk";
import { Redis } from "@upstash/redis";
import { APP_NAME } from "./constants";

// Gratitude entry type
export interface GratitudeEntry {
  id: string;
  fid: number;
  content: string;
  date: string; // YYYY-MM-DD format
  createdAt: number;
  mood?: 'happy' | 'grateful' | 'peaceful' | 'excited' | 'content';
  isPublic?: boolean;
}

// In-memory fallback storage
const localStore = new Map<string, FrameNotificationDetails>();
const gratitudeStore = new Map<string, GratitudeEntry>();

// Use Redis if KV env vars are present, otherwise use in-memory
const useRedis = process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN;
const redis = useRedis ? new Redis({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
}) : null;

function getUserNotificationDetailsKey(fid: number): string {
  return `${APP_NAME}:user:${fid}`;
}

export async function getUserNotificationDetails(
  fid: number
): Promise<FrameNotificationDetails | null> {
  const key = getUserNotificationDetailsKey(fid);
  if (redis) {
    return await redis.get<FrameNotificationDetails>(key);
  }
  return localStore.get(key) || null;
}

export async function setUserNotificationDetails(
  fid: number,
  notificationDetails: FrameNotificationDetails
): Promise<void> {
  const key = getUserNotificationDetailsKey(fid);
  if (redis) {
    await redis.set(key, notificationDetails);
  } else {
    localStore.set(key, notificationDetails);
  }
}

export async function deleteUserNotificationDetails(
  fid: number
): Promise<void> {
  const key = getUserNotificationDetailsKey(fid);
  if (redis) {
    await redis.del(key);
  } else {
    localStore.delete(key);
  }
}

// Gratitude entry functions
function getGratitudeEntryKey(fid: number, date: string): string {
  return `${APP_NAME}:gratitude:${fid}:${date}`;
}

function getGratitudeEntriesKey(fid: number): string {
  return `${APP_NAME}:gratitude:${fid}:entries`;
}

export async function saveGratitudeEntry(entry: GratitudeEntry): Promise<void> {
  const key = getGratitudeEntryKey(entry.fid, entry.date);
  const entriesKey = getGratitudeEntriesKey(entry.fid);
  
  if (redis) {
    await redis.set(key, entry);
    // Add to user's entries list
    await redis.sadd(entriesKey, entry.date);
  } else {
    gratitudeStore.set(key, entry);
  }
}

export async function getGratitudeEntry(fid: number, date: string): Promise<GratitudeEntry | null> {
  const key = getGratitudeEntryKey(fid, date);
  
  if (redis) {
    return await redis.get<GratitudeEntry>(key);
  } else {
    return gratitudeStore.get(key) || null;
  }
}

export async function getGratitudeEntries(fid: number, limit: number = 30): Promise<GratitudeEntry[]> {
  const entriesKey = getGratitudeEntriesKey(fid);
  
  if (redis) {
    const dates = await redis.smembers(entriesKey);
    const sortedDates = dates.sort().reverse().slice(0, limit);
    
    const entries: GratitudeEntry[] = [];
    for (const date of sortedDates) {
      const entry = await getGratitudeEntry(fid, date);
      if (entry) entries.push(entry);
    }
    return entries;
  } else {
    // For in-memory storage, we need to iterate through all entries
    const entries: GratitudeEntry[] = [];
    for (const [key, entry] of gratitudeStore.entries()) {
      if (key.includes(`:${fid}:`) && entry.fid === fid) {
        entries.push(entry);
      }
    }
    return entries
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, limit);
  }
}

export async function deleteGratitudeEntry(fid: number, date: string): Promise<void> {
  const key = getGratitudeEntryKey(fid, date);
  const entriesKey = getGratitudeEntriesKey(fid);
  
  if (redis) {
    await redis.del(key);
    await redis.srem(entriesKey, date);
  } else {
    gratitudeStore.delete(key);
  }
}
