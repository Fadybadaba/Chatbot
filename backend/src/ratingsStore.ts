export interface ChatRating {
  id: string;
  sessionId: string;
  userId: string;
  stars: number; // 1..5
  createdAt: string;
}

import { getSupabaseAdmin } from './supabaseAdmin';

// In-memory store for demo purposes.
const ratings: ChatRating[] = [];

export async function addChatRating(r: ChatRating): Promise<void> {
  const supabase = getSupabaseAdmin();
  if (supabase) {
    const { error } = await supabase.from('chat_ratings').insert({
      id: r.id,
      created_at: r.createdAt,
      session_id: r.sessionId,
      user_id: r.userId,
      stars: r.stars,
    });
    if (error) throw error;
    return;
  }

  ratings.unshift(r);
  if (ratings.length > 1000) ratings.length = 1000;
}

export async function listChatRatings(): Promise<ChatRating[]> {
  const supabase = getSupabaseAdmin();
  if (supabase) {
    const { data, error } = await supabase
      .from('chat_ratings')
      .select('id, created_at, session_id, user_id, stars')
      .order('created_at', { ascending: false })
      .limit(1000);
    if (error) throw error;
    return (data || []).map(r => ({
      id: r.id as string,
      createdAt: r.created_at as string,
      sessionId: r.session_id as string,
      userId: r.user_id as string,
      stars: r.stars as number,
    }));
  }

  return ratings;
}

export async function getChatRatingsSummary(): Promise<{
  count: number;
  average: number | null;
  distribution: Record<1 | 2 | 3 | 4 | 5, number>;
}> {
  const list = await listChatRatings();
  const count = list.length;
  const distribution: Record<1 | 2 | 3 | 4 | 5, number> = {
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0,
  };
  for (const r of list) {
    const s = r.stars as 1 | 2 | 3 | 4 | 5;
    distribution[s] = (distribution[s] || 0) + 1;
  }
  if (count === 0) return { count, average: null, distribution };
  const sum = list.reduce((acc, r) => acc + r.stars, 0);
  return {
    count,
    average: Math.round((sum / count) * 100) / 100,
    distribution,
  };
}

