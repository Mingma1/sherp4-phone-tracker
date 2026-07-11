import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Sparkles, BookOpen, Quote as QuoteIcon, Star, RefreshCw } from 'lucide-react';
import {
  getTrendingAnime,
  getTrendingManga,
  getQuote,
  type AnimeCard,
  type MangaCard,
  type AnimeQuote,
} from '../services/animeService';

// ─── Anime Quote Card ───────────────────────────────────────────────────────

export function AnimeQuoteCard() {
  const [quote, setQuote] = useState<AnimeQuote | null>(null);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    getQuote().then(q => {
      setQuote(q);
      setLoading(false);
    });
  };

  useEffect(() => { load(); }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-3xl border border-pink-500/20 bg-gradient-to-br from-pink-500/10 via-fuchsia-500/5 to-purple-500/10 p-6"
    >
      <div className="absolute -right-6 -top-6 text-pink-500/10">
        <QuoteIcon className="h-24 w-24" />
      </div>
      <div className="relative">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-pink-400">
            <Sparkles className="h-4 w-4" />
            <span className="text-[10px] font-black uppercase tracking-[0.25em]">Otaku Wisdom</span>
          </div>
          <button
            onClick={load}
            className="text-pink-400/60 transition-colors hover:text-pink-400"
            aria-label="New quote"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {loading ? (
          <div className="space-y-2">
            <div className="h-4 w-full animate-pulse rounded bg-white/10" />
            <div className="h-4 w-3/4 animate-pulse rounded bg-white/10" />
          </div>
        ) : (
          <>
            <p className="text-[15px] font-medium leading-relaxed text-white/90">
              &ldquo;{quote?.quote}&rdquo;
            </p>
            <div className="mt-4">
              <p className="text-sm font-black text-pink-300">{quote?.character}</p>
              <p className="text-[10px] font-bold uppercase tracking-wider text-white/40">
                {quote?.anime}
              </p>
            </div>
          </>
        )}
      </div>
    </motion.div>
  );
}

// ─── Trending Anime Strip ───────────────────────────────────────────────────

export function TrendingAnimeStrip() {
  const [anime, setAnime] = useState<AnimeCard[]>([]);

  useEffect(() => {
    getTrendingAnime(8).then(setAnime);
  }, []);

  return (
    <div>
      <div className="mb-3 flex items-center gap-2 px-1">
        <div className="h-3 w-1 rounded-full bg-pink-500" />
        <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-white/40">
          Trending Anime
        </h3>
      </div>
      <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-2 scrollbar-hide">
        {anime.length === 0
          ? Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-44 w-28 shrink-0 animate-pulse rounded-2xl bg-white/5" />
            ))
          : anime.map((a, i) => (
              <motion.a
                key={a.id}
                href={`https://anilist.co/anime/${a.id}`}
                target="_blank"
                rel="noreferrer"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
                className="group relative h-44 w-28 shrink-0 overflow-hidden rounded-2xl border border-white/10"
              >
                {a.cover && (
                  <img
                    src={a.cover}
                    alt={a.title}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
                {a.score && (
                  <div className="absolute right-1.5 top-1.5 flex items-center gap-0.5 rounded-full bg-black/70 px-1.5 py-0.5 backdrop-blur-sm">
                    <Star className="h-2.5 w-2.5 fill-yellow-400 text-yellow-400" />
                    <span className="text-[9px] font-black text-white">{a.score}</span>
                  </div>
                )}
                <div className="absolute bottom-0 left-0 right-0 p-2">
                  <p className="line-clamp-2 text-[10px] font-bold leading-tight text-white">
                    {a.title}
                  </p>
                </div>
              </motion.a>
            ))}
      </div>
    </div>
  );
}

// ─── Manga Spotlight ────────────────────────────────────────────────────────

export function MangaSpotlight() {
  const [manga, setManga] = useState<MangaCard[]>([]);

  useEffect(() => {
    getTrendingManga(3).then(setManga);
  }, []);

  return (
    <div>
      <div className="mb-3 flex items-center gap-2 px-1">
        <BookOpen className="h-3.5 w-3.5 text-fuchsia-400" />
        <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-white/40">
          Manga Spotlight
        </h3>
      </div>
      <div className="space-y-3">
        {manga.length === 0
          ? Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-16 animate-pulse rounded-2xl bg-white/5" />
            ))
          : manga.map((m, i) => (
              <motion.a
                key={m.id}
                href={`https://anilist.co/manga/${m.id}`}
                target="_blank"
                rel="noreferrer"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.08 }}
                className="group flex items-center gap-3 rounded-2xl border border-white/5 bg-white/[0.03] p-3 transition-colors hover:border-fuchsia-500/30 hover:bg-white/[0.06]"
              >
                <div className="h-16 w-12 shrink-0 overflow-hidden rounded-lg">
                  {m.cover && (
                    <img
                      src={m.cover}
                      alt={m.title}
                      loading="lazy"
                      className="h-full w-full object-cover"
                    />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-black text-white">{m.title}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-1.5">
                    {m.score && (
                      <span className="flex items-center gap-0.5 rounded bg-fuchsia-500/10 px-1.5 py-0.5 text-[9px] font-bold text-fuchsia-300">
                        <Star className="h-2.5 w-2.5 fill-current" /> {m.score}
                      </span>
                    )}
                    {m.chapters && (
                      <span className="rounded bg-white/5 px-1.5 py-0.5 text-[9px] font-bold text-white/40">
                        {m.chapters} ch
                      </span>
                    )}
                    {m.genres?.[0] && (
                      <span className="rounded bg-white/5 px-1.5 py-0.5 text-[9px] font-bold text-white/40">
                        {m.genres[0]}
                      </span>
                    )}
                  </div>
                </div>
              </motion.a>
            ))}
      </div>
    </div>
  );
}
