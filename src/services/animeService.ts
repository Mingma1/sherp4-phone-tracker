import { useMemo } from 'react';

// Anime / Manga data service for Sherp4 Phone Tracker
// Primary source: AniList GraphQL (reliable, no key, covers anime + manga + characters)
// Fallbacks: curated static lists so widgets always render something fun.

const ANILIST_URL = 'https://graphql.anilist.co';

export interface AnimeCard {
  id: number;
  title: string;
  score: number | null;
  cover: string;
  genres: string[];
}

export interface MangaCard {
  id: number;
  title: string;
  score: number | null;
  cover: string;
  chapters: number | null;
  genres: string[];
}

export interface AnimeQuote {
  quote: string;
  character: string;
  anime: string;
}

async function anilist<T>(query: string): Promise<T | null> {
  try {
    const res = await fetch(ANILIST_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query }),
    });
    if (!res.ok) return null;
    const json = await res.json();
    return (json?.data ?? null) as T | null;
  } catch {
    return null;
  }
}

// ─── Trending Anime ─────────────────────────────────────────────────────────

const FALLBACK_ANIME: AnimeCard[] = [
  { id: 1, title: 'Chainsaw Man', score: 84, cover: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx44511-zXJnXlnI8nZ8.png', genres: ['Action', 'Supernatural'] },
  { id: 2, title: 'Jujutsu Kaisen', score: 86, cover: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx113415-1NySFUBUKj5k.png', genres: ['Action', 'Supernatural'] },
  { id: 3, title: 'Demon Slayer', score: 83, cover: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx101922-KkaNY41p6j4M.png', genres: ['Action', 'Adventure'] },
  { id: 4, title: 'Spy x Family', score: 82, cover: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx140960-rU3L9OQpplD0.png', genres: ['Comedy', 'Action'] },
  { id: 5, title: "Frieren: Beyond Journey's End", score: 89, cover: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx154587-PPjCuKGYubhB.png', genres: ['Adventure', 'Drama'] },
  { id: 6, title: 'One Piece', score: 87, cover: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx30013-aXGYIK1pP3LG.png', genres: ['Action', 'Adventure'] },
];

export async function getTrendingAnime(limit = 6): Promise<AnimeCard[]> {
  const data = await anilist<{ Page: { media: any[] } }>(
    `{ Page(perPage: ${limit}) { media(type: ANIME, sort: TRENDING_DESC) { id title { romaji english } averageScore coverImage { large extraLarge } genres } } }`
  );
  const media = data?.Page?.media;
  if (!media?.length) return FALLBACK_ANIME.slice(0, limit);
  return media.map(m => ({
    id: m.id,
    title: m.title?.english || m.title?.romaji || 'Unknown',
    score: m.averageScore ?? null,
    cover: m.coverImage?.extraLarge || m.coverImage?.large || '',
    genres: m.genres || [],
  }));
}

// ─── Trending Manga ─────────────────────────────────────────────────────────

const FALLBACK_MANGA: MangaCard[] = [
  { id: 1, title: 'One Piece', score: 91, cover: 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx30013-aXGYYhEqiNmZ.png', chapters: 1100, genres: ['Action', 'Adventure'] },
  { id: 2, title: 'Jujutsu Kaisen', score: 85, cover: 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx101317-tuLPNQgmYhuG.png', chapters: 250, genres: ['Action', 'Supernatural'] },
  { id: 3, title: 'Chainsaw Man', score: 86, cover: 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx108555-8VjItCl6kbPM.png', chapters: 150, genres: ['Action', 'Supernatural'] },
  { id: 4, title: 'Solo Leveling', score: 83, cover: 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx111396-aZCAMpTNkPX4.png', chapters: 179, genres: ['Action', 'Adventure'] },
];

export async function getTrendingManga(limit = 4): Promise<MangaCard[]> {
  const data = await anilist<{ Page: { media: any[] } }>(
    `{ Page(perPage: ${limit}) { media(type: MANGA, sort: TRENDING_DESC) { id title { romaji english } averageScore coverImage { large } chapters genres } } }`
  );
  const media = data?.Page?.media;
  if (!media?.length) return FALLBACK_MANGA.slice(0, limit);
  return media.map(m => ({
    id: m.id,
    title: m.title?.english || m.title?.romaji || 'Unknown',
    score: m.averageScore ?? null,
    cover: m.coverImage?.large || '',
    chapters: m.chapters ?? null,
    genres: m.genres || [],
  }));
}

// ─── Anime Quotes (curated, always available) ───────────────────────────────

const QUOTES: AnimeQuote[] = [
  { quote: 'If you don\'t take risks, you can\'t create a future.', character: 'Monkey D. Luffy', anime: 'One Piece' },
  { quote: 'The world isn\'t perfect. But it\'s there for us, doing the best it can.', character: 'Roy Mustang', anime: 'Fullmetal Alchemist' },
  { quote: 'A person can change, at the moment when that person wants to change.', character: 'Haruno Sakura', anime: 'Naruto' },
  { quote: 'Whatever you lose, you\'ll find it again. But what you throw away you\'ll never get back.', character: 'Kenshin Himura', anime: 'Rurouni Kenshin' },
  { quote: 'Hard work is worthless for those that don\'t believe in themselves.', character: 'Naruto Uzumaki', anime: 'Naruto' },
  { quote: 'Fear is not evil. It tells you what your weakness is.', character: 'Gildarts Clive', anime: 'Fairy Tail' },
  { quote: 'Knowing you\'re different is only painful because others try to make you believe you are.', character: 'Armin Arlert', anime: 'Attack on Titan' },
  { quote: 'People\'s lives don\'t end when they die. It ends when they lose faith.', character: 'Itachi Uchiha', anime: 'Naruto' },
  { quote: 'Being weak is nothing to be ashamed of. Staying weak is!', character: 'Frieza', anime: 'Dragon Ball Z' },
  { quote: 'The ones who accomplish the most are those who keep trying.', character: 'Roronoa Zoro', anime: 'One Piece' },
  { quote: 'Sometimes we have to lose something to realize its true value.', character: 'Edward Elric', anime: 'Fullmetal Alchemist' },
  { quote: 'A lesson without pain is meaningless.', character: 'Edward Elric', anime: 'Fullmetal Alchemist' },
  { quote: 'Stop doing nothing. Just because you don\'t know what the answer is, doesn\'t mean you should just give up.', character: 'Satoru Gojo', anime: 'Jujutsu Kaisen' },
];

export async function getQuote(): Promise<AnimeQuote> {
  try {
    const res = await fetch('https://animechan.io/api/v1/quotes/random');
    if (res.ok) {
      const data = await res.json();
      if (data?.content && data?.character?.name) {
        return {
          quote: data.content,
          character: data.character.name,
          anime: data.anime?.name || 'Unknown',
        };
      }
    }
  } catch {
    /* fall through */
  }
  return QUOTES[Math.floor(Math.random() * QUOTES.length)];
}
