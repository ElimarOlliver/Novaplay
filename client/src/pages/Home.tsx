import { useEffect, useMemo, useRef, useState } from "react";
import Hls from "hls.js";
import {
  Activity,
  AlertTriangle,
  Bell,
  Check,
  ChevronRight,
  CircleHelp,
  Film,
  Heart,
  LayoutGrid,
  Library,
  ListFilter,
  Menu,
  Play,
  Radio,
  Search,
  Settings2,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Star,
  Trophy,
  Tv,
  Volume2,
  X,
} from "lucide-react";
import { toast } from "sonner";

type Category = "all" | "channels" | "sports" | "movies";

type Channel = {
  id: string;
  name: string;
  url: string;
  tvgId?: string;
  logo?: string;
  group?: string;
  category: Exclude<Category, "all">;
  resolution?: string;
  featured?: boolean;
  network?: string;
  website?: string;
};

type DatabaseChannel = {
  id: string;
  name: string;
  country: string;
  categories: string[];
  network: string | null;
  website: string | null;
};

type PlaylistSource = {
  label: string;
  url: string;
};

const PLAYLIST_SOURCES: PlaylistSource[] = [
  {
    label: "Brasil",
    url: "https://iptv-org.github.io/iptv/countries/br.m3u",
  },
  {
    label: "Brasil · Pluto TV",
    url: "https://iptv-org.github.io/iptv/countries/br_pluto.m3u",
  },
];

const DATABASE_API_URL = "https://iptv-org.github.io/api/channels.json";

const FALLBACK_CHANNELS: Channel[] = [
  {
    id: "conectv-brasil",
    name: "ConecTV Brasil",
    url: "https://stream01.msolutionbrasil.com.br/hls/conectv/live.m3u8",
    category: "channels",
    group: "Canais",
    resolution: "720p",
  },
  {
    id: "rctv-brasil",
    name: "RCTV Brasil",
    url: "https://stmv.webtvninjas.com.br/rctv/rctv/playlist.m3u8",
    category: "channels",
    group: "Canais",
  },
  {
    id: "record-news",
    name: "Record News",
    url: "https://rnw-rn.otteravision.com/rnw/rn/rnw_rn.m3u8",
    category: "channels",
    group: "Canais",
    resolution: "720p",
  },
  {
    id: "band-sports",
    name: "Band Sports",
    url: "https://cdn-5.nxplay.com.br/BAND_SPORTS/index.m3u8",
    category: "sports",
    group: "Esportes",
    resolution: "1080p",
    featured: true,
  },
  {
    id: "cazetv",
    name: "CazeTV",
    url: "https://dfr80qz435crc.cloudfront.net/MNOP/Amagi/Caze/Caze_TV_BR/Caze_TV.m3u8",
    category: "sports",
    group: "Esportes",
    resolution: "1080i",
  },
  {
    id: "n-sports",
    name: "N Sports",
    url: "https://ogc-nsprt-tcl-roku-syndication.otteravision.com/ogc/nsprt/nsprt.m3u8",
    category: "sports",
    group: "Esportes",
    resolution: "1080p",
  },
  {
    id: "fifa-plus",
    name: "FIFA+",
    url: "https://jmp2.uk/plu-66997e8d3a4ad20008e50be9.m3u8",
    category: "sports",
    group: "Esportes",
    featured: true,
  },
  {
    id: "pluto-esportes",
    name: "Pluto TV Esportes",
    url: "https://jmp2.uk/plu-5f32d2db0af67400077f29c4.m3u8",
    category: "sports",
    group: "Esportes",
  },
  {
    id: "filmelier",
    name: "Filmelier TV",
    url: "https://jmp2.uk/plu-633dcebd80386500074a2461.m3u8",
    category: "movies",
    group: "Filmes",
    featured: true,
  },
  {
    id: "kuriakos-cine",
    name: "Kuriakos Cine",
    url: "https://w2.manasat.com/kcine/smil:kcine.smil/playlist.m3u8",
    category: "movies",
    group: "Filmes",
    resolution: "1080p",
  },
  {
    id: "sony-movies",
    name: "Sony Movies",
    url: "http://45.162.64.114/SONY_MOVIES/index.m3u8",
    category: "movies",
    group: "Filmes",
    resolution: "720p",
  },
  {
    id: "cine-classicos",
    name: "Pluto TV Cine Clássicos",
    url: "https://jmp2.uk/plu-5fa1612a669ba0000702017b.m3u8",
    category: "movies",
    group: "Filmes",
  },
  {
    id: "cine-comedia",
    name: "Pluto TV Cine Comédia",
    url: "https://jmp2.uk/plu-5f12101f0b12f00007844c7c.m3u8",
    category: "movies",
    group: "Filmes",
  },
  {
    id: "cine-drama",
    name: "Pluto TV Cine Drama",
    url: "https://jmp2.uk/plu-5f1210d14ae1f80007bafb1d.m3u8",
    category: "movies",
    group: "Filmes",
  },
  {
    id: "cine-terror",
    name: "Pluto TV Cine Terror",
    url: "https://jmp2.uk/plu-5f12111c9e6c2c00078ef3bb.m3u8",
    category: "movies",
    group: "Filmes",
  },
  {
    id: "filmes-nacionais",
    name: "Pluto TV Filmes Nacionais",
    url: "https://jmp2.uk/plu-5f5a545d0dbf7f0007c09408.m3u8",
    category: "movies",
    group: "Filmes",
  },
];

const categoryMeta: Record<Exclude<Category, "all">, { label: string; icon: typeof Tv; color: string }> = {
  channels: { label: "Canais", icon: Tv, color: "text-sky-300" },
  sports: { label: "Esportes", icon: Trophy, color: "text-amber-300" },
  movies: { label: "Filmes", icon: Film, color: "text-fuchsia-300" },
};

const categoryFromText = (name: string, group = ""): Exclude<Category, "all"> => {
  const text = `${name} ${group}`.toLocaleLowerCase();
  if (/sport|esporte|espn|band sports|cazetv|fifa|n sports|arena|combate|sportv/.test(text)) {
    return "sports";
  }
  if (/movie|filme|cine|cinema|megapix|sony movies|filmelier|kuriakos/.test(text)) {
    return "movies";
  }
  return "channels";
};

const parsePlaylist = (raw: string, sourceLabel: string): Channel[] => {
  const lines = raw.split(/\r?\n/);
  const channels: Channel[] = [];
  let metadata = "";

  for (const line of lines) {
    if (line.startsWith("#EXTINF:")) {
      metadata = line;
      continue;
    }
    if (!metadata || !line.trim() || line.startsWith("#")) continue;

    const url = line.trim();
    if (window.location.protocol === "https:" && url.startsWith("http://")) {
      metadata = "";
      continue;
    }
    const name = metadata.split(",").slice(1).join(",").trim() || "Canal sem nome";
    const attributes: Record<string, string> = {};
    const attributePattern = /([\w-]+)="([^"]*)"/g;
    let attributeMatch: RegExpExecArray | null;
    while ((attributeMatch = attributePattern.exec(metadata)) !== null) {
      attributes[attributeMatch[1]] = attributeMatch[2];
    }
    const cleanName = name.replace(/\s*\([^)]*\)\s*$/, "").trim();
    channels.push({
      id: `${sourceLabel}-${attributes["tvg-id"] || cleanName}-${url}`,
      name: cleanName,
      tvgId: attributes["tvg-id"],
      url,
      logo: attributes["tvg-logo"],
      group: attributes["group-title"] || sourceLabel,
      category: categoryFromText(cleanName, attributes["group-title"] || ""),
      resolution: name.match(/\(([^)]+)\)/)?.[1],
    });
    metadata = "";
  }
  return channels;
};

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

function ChannelLogo({ channel, large = false }: { channel: Channel; large?: boolean }) {
  const [failed, setFailed] = useState(false);
  return (
    <div
      className={`relative grid shrink-0 place-items-center overflow-hidden rounded-xl border border-white/10 bg-gradient-to-br from-slate-700 via-slate-800 to-slate-950 ${large ? "h-14 w-14" : "h-11 w-11"}`}
    >
      {channel.logo && !failed ? (
        <img
          src={channel.logo}
          alt=""
          className="h-full w-full object-contain p-1.5"
          onError={() => setFailed(true)}
        />
      ) : (
        <span className="font-display text-sm font-bold tracking-tight text-white/85">
          {initials(channel.name)}
        </span>
      )}
    </div>
  );
}

function StatPill({ icon: Icon, value, label }: { icon: typeof Activity; value: string; label: string }) {
  return (
    <div className="flex items-center gap-2 rounded-full border border-white/8 bg-white/[0.045] px-3 py-2">
      <Icon className="h-3.5 w-3.5 text-cyan-300" />
      <span className="text-xs font-semibold text-white">{value}</span>
      <span className="text-[11px] text-slate-500">{label}</span>
    </div>
  );
}

export default function Home() {
  const [channels, setChannels] = useState<Channel[]>(FALLBACK_CHANNELS);
  const [selected, setSelected] = useState<Channel>(FALLBACK_CHANNELS[0]);
  const [activeCategory, setActiveCategory] = useState<Category>("all");
  const [query, setQuery] = useState("");
  const [favorites, setFavorites] = useState<string[]>([]);
  const [loadingPlaylist, setLoadingPlaylist] = useState(true);
  const [playlistState, setPlaylistState] = useState<"syncing" | "synced" | "fallback">("syncing");
  const [databaseStats, setDatabaseStats] = useState({ total: 0, brazil: 0 });
  const [databaseState, setDatabaseState] = useState<"syncing" | "synced" | "fallback">("syncing");
  const [playerError, setPlayerError] = useState("");
  const [isPlaying, setIsPlaying] = useState(false);
  const [buffering, setBuffering] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);

  useEffect(() => {
    const stored = window.localStorage.getItem("iptv-favorites");
    if (stored) setFavorites(JSON.parse(stored));
  }, []);

  useEffect(() => {
    window.localStorage.setItem("iptv-favorites", JSON.stringify(favorites));
  }, [favorites]);

  useEffect(() => {
    let ignore = false;
    const loadPlaylists = async () => {
      try {
        const results = await Promise.allSettled(
          PLAYLIST_SOURCES.map(async (source) => {
            const response = await fetch(source.url);
            if (!response.ok) throw new Error(`${source.label}: ${response.status}`);
            return { label: source.label, body: await response.text() };
          }),
        );
        const parsed = results
          .filter((result): result is PromiseFulfilledResult<{ label: string; body: string }> => result.status === "fulfilled")
          .flatMap((result) => parsePlaylist(result.value.body, result.value.label));
        const unique = Array.from(new Map(parsed.map((channel) => [`${channel.name}-${channel.url}`, channel])).values());
        if (!ignore && unique.length > 0) {
          setChannels(unique);
          setSelected((current) => unique.find((channel) => channel.name === current.name) || unique[0]);
          setPlaylistState("synced");
        } else if (!ignore) {
          setPlaylistState("fallback");
        }
      } catch {
        if (!ignore) setPlaylistState("fallback");
      } finally {
        if (!ignore) setLoadingPlaylist(false);
      }
    };
    loadPlaylists();
    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    let ignore = false;
    const loadDatabase = async () => {
      try {
        const response = await fetch(DATABASE_API_URL);
        if (!response.ok) throw new Error("Database indisponível");
        const database = (await response.json()) as DatabaseChannel[];
        const brazil = database.filter((channel) => channel.country === "BR");
        const byId = new Map(database.map((channel) => [channel.id, channel]));
        if (ignore) return;
        setDatabaseStats({ total: database.length, brazil: brazil.length });
        setChannels((current) => current.map((channel) => {
          const metadata = channel.tvgId ? byId.get(channel.tvgId) : undefined;
          if (!metadata) return channel;
          const category = metadata.categories.includes("sports")
            ? "sports"
            : metadata.categories.includes("movies")
              ? "movies"
              : channel.category;
          return {
            ...channel,
            category,
            group: metadata.network || channel.group,
            network: metadata.network || undefined,
            website: metadata.website || undefined,
          };
        }));
        setDatabaseState("synced");
      } catch {
        if (!ignore) setDatabaseState("fallback");
      }
    };
    loadDatabase();
    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !selected?.url) return;
    setPlayerError("");
    setIsPlaying(false);
    setBuffering(true);
    hlsRef.current?.destroy();
    hlsRef.current = null;
    video.removeAttribute("src");
    video.load();

    const onError = () => {
      setBuffering(false);
      setPlayerError("Este link não respondeu no navegador. Ele pode estar offline, protegido ou bloqueado por região.");
      setIsPlaying(false);
    };
    video.addEventListener("error", onError);

    if (Hls.isSupported()) {
      const hls = new Hls({ enableWorker: true, lowLatencyMode: true, backBufferLength: 30 });
      let recoveryAttempts = 0;
      hlsRef.current = hls;
      hls.loadSource(selected.url);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.muted = true;
        video.play().catch(() => {
          setPlayerError("O canal carregou, mas o navegador bloqueou o autoplay. Clique no botão de reprodução.");
        });
      });
      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (!data.fatal) return;
        if (data.type === Hls.ErrorTypes.NETWORK_ERROR && recoveryAttempts < 2) {
          recoveryAttempts += 1;
          hls.startLoad();
          return;
        }
        if (data.type === Hls.ErrorTypes.MEDIA_ERROR && recoveryAttempts < 2) {
          recoveryAttempts += 1;
          hls.recoverMediaError();
          return;
        }
        setBuffering(false);
        setPlayerError("Não foi possível carregar este canal. O link pode estar offline, sem CORS ou bloqueado por região.");
        hls.destroy();
      });
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = selected.url;
      video.load();
      video.muted = true;
      video.play().catch(() => {
        setPlayerError("O canal carregou, mas o navegador bloqueou o autoplay. Clique no botão de reprodução.");
      });
    } else {
      setPlayerError("Este navegador não oferece suporte a reprodução HLS.");
    }

    return () => {
      video.removeEventListener("error", onError);
      hlsRef.current?.destroy();
      hlsRef.current = null;
    };
  }, [selected]);

  const filteredChannels = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase();
    return channels.filter((channel) => {
      const categoryMatch = activeCategory === "all" || channel.category === activeCategory;
      const queryMatch = !normalized || `${channel.name} ${channel.group}`.toLocaleLowerCase().includes(normalized);
      return categoryMatch && queryMatch;
    });
  }, [activeCategory, channels, query]);

  const featured = useMemo(
    () => channels.filter((channel) => channel.featured || channel.category === "sports").slice(0, 5),
    [channels],
  );
  const favoriteChannels = useMemo(
    () => channels.filter((channel) => favorites.includes(channel.id)),
    [channels, favorites],
  );

  const toggleFavorite = (channel: Channel) => {
    setFavorites((current) =>
      current.includes(channel.id) ? current.filter((id) => id !== channel.id) : [...current, channel.id],
    );
  };

  const selectCategory = (category: Category) => {
    setActiveCategory(category);
    setShowMobileMenu(false);
  };

  const categoryItems: Array<{ id: Category; label: string; icon: typeof Tv; count?: number }> = [
    { id: "all", label: "Descobrir", icon: LayoutGrid, count: channels.length },
    { id: "channels", label: "Canais", icon: Tv, count: channels.filter((channel) => channel.category === "channels").length },
    { id: "sports", label: "Esportes", icon: Trophy, count: channels.filter((channel) => channel.category === "sports").length },
    { id: "movies", label: "Filmes", icon: Film, count: channels.filter((channel) => channel.category === "movies").length },
  ];

  return (
    <div className="min-h-screen bg-[#080b11] text-slate-100 selection:bg-cyan-300 selection:text-slate-950">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-40 -top-40 h-[32rem] w-[32rem] rounded-full bg-cyan-500/8 blur-[120px]" />
        <div className="absolute right-0 top-[25rem] h-[30rem] w-[30rem] rounded-full bg-fuchsia-500/7 blur-[140px]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.04),transparent_30%)]" />
      </div>

      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[248px] flex-col border-r border-white/[0.07] bg-[#0a0e15]/90 px-5 py-6 backdrop-blur-xl lg:flex">
        <div className="flex items-center gap-3 px-2">
          <div className="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-br from-cyan-300 via-blue-500 to-violet-600 shadow-[0_10px_30px_rgba(34,211,238,0.22)]">
            <Play className="ml-0.5 h-5 w-5 fill-slate-950 text-slate-950" />
          </div>
          <div>
            <p className="font-display text-[17px] font-bold tracking-tight text-white">NOVA<span className="text-cyan-300">PLAY</span></p>
            <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-slate-500">public streams</p>
          </div>
        </div>

        <nav className="mt-12 space-y-1">
          <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.22em] text-slate-600">Biblioteca</p>
          {categoryItems.map(({ id, label, icon: Icon, count }) => (
            <button
              key={id}
              onClick={() => selectCategory(id)}
              className={`group flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm transition-all duration-200 ${activeCategory === id ? "bg-white/[0.09] text-white shadow-inner shadow-white/[0.04]" : "text-slate-500 hover:bg-white/[0.045] hover:text-slate-200"}`}
            >
              <Icon className={`h-[17px] w-[17px] ${activeCategory === id ? "text-cyan-300" : "text-slate-600 group-hover:text-slate-300"}`} />
              <span className="flex-1 font-medium">{label}</span>
              {count !== undefined && <span className="text-[11px] text-slate-600">{count}</span>}
            </button>
          ))}
        </nav>

        <div className="mt-8 border-t border-white/[0.07] pt-7">
          <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.22em] text-slate-600">Sua seleção</p>
          <button
            onClick={() => toast.info("Favoritos ficam salvos neste dispositivo.")}
            className="group flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm text-slate-500 transition hover:bg-white/[0.045] hover:text-slate-200"
          >
            <Heart className="h-[17px] w-[17px] text-slate-600 group-hover:text-rose-300" />
            <span className="flex-1 font-medium">Favoritos</span>
            <span className="text-[11px] text-slate-600">{favoriteChannels.length}</span>
          </button>
          <button
            onClick={() => toast.info("A fonte usa apenas playlists públicas do iptv-org.")}
            className="group flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm text-slate-500 transition hover:bg-white/[0.045] hover:text-slate-200"
          >
            <Library className="h-[17px] w-[17px] text-slate-600 group-hover:text-cyan-300" />
            <span className="flex-1 font-medium">Playlists</span>
            <ChevronRight className="h-4 w-4 text-slate-700" />
          </button>
        </div>

        <div className="mt-auto rounded-2xl border border-cyan-300/10 bg-gradient-to-br from-cyan-400/10 to-blue-500/5 p-4">
          <div className="mb-3 flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-cyan-300" />
            <span className="text-xs font-semibold text-cyan-100">Fonte pública</span>
          </div>
          <p className="text-[11px] leading-relaxed text-slate-500">Links são carregados do projeto iptv-org e podem mudar ou ficar indisponíveis.</p>
          <div className="mt-3 border-t border-white/10 pt-3 text-[10px] leading-relaxed text-slate-500">
            <div className="mb-1 flex items-center gap-1.5 text-cyan-200/80"><Library className="h-3 w-3" /> Catálogo sincronizado</div>
            <span>{databaseState === "synced" ? `${databaseStats.brazil.toLocaleString("pt-BR")} canais BR · ${databaseStats.total.toLocaleString("pt-BR")} no mundo` : "Metadados em sincronização"}</span>
          </div>
        </div>
      </aside>

      <div className="relative lg:pl-[248px]">
        <header className="sticky top-0 z-20 border-b border-white/[0.06] bg-[#080b11]/80 backdrop-blur-xl">
          <div className="flex h-[76px] items-center gap-4 px-5 sm:px-8 lg:px-10">
            <button className="rounded-xl border border-white/10 p-2 text-slate-400 lg:hidden" onClick={() => setShowMobileMenu((value) => !value)} aria-label="Abrir menu">
              {showMobileMenu ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            <div className="flex items-center gap-3 lg:hidden">
              <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-cyan-300 to-blue-600">
                <Play className="ml-0.5 h-4 w-4 fill-slate-950 text-slate-950" />
              </div>
              <span className="font-display text-base font-bold text-white">NOVA<span className="text-cyan-300">PLAY</span></span>
            </div>
            <div className="relative ml-auto flex w-full max-w-[440px] items-center lg:ml-0">
              <Search className="pointer-events-none absolute left-4 h-[17px] w-[17px] text-slate-600" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Buscar canais, esportes ou filmes..."
                className="h-11 w-full rounded-xl border border-white/[0.08] bg-white/[0.045] pl-11 pr-10 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-300/40 focus:bg-white/[0.07]"
              />
              {query && <button onClick={() => setQuery("")} className="absolute right-3 rounded-md p-1 text-slate-500 hover:text-white" aria-label="Limpar busca"><X className="h-4 w-4" /></button>}
            </div>
            <div className="ml-auto hidden items-center gap-2 sm:flex">
              <button onClick={() => toast.info("Nenhum alerta novo.")} className="grid h-10 w-10 place-items-center rounded-xl border border-white/[0.08] bg-white/[0.035] text-slate-500 transition hover:border-white/15 hover:text-white" aria-label="Notificações">
                <Bell className="h-[17px] w-[17px]" />
              </button>
              <button onClick={() => toast.info("Configurações avançadas estarão disponíveis em breve.")} className="grid h-10 w-10 place-items-center rounded-xl border border-white/[0.08] bg-white/[0.035] text-slate-500 transition hover:border-white/15 hover:text-white" aria-label="Configurações">
                <Settings2 className="h-[17px] w-[17px]" />
              </button>
              <div className="ml-2 grid h-9 w-9 place-items-center rounded-full border border-cyan-300/20 bg-cyan-300/10 text-xs font-bold text-cyan-200">NP</div>
            </div>
          </div>
          {showMobileMenu && (
            <div className="border-t border-white/[0.06] bg-[#0a0e15] px-5 py-4 lg:hidden">
              <div className="grid grid-cols-2 gap-2">
                {categoryItems.map(({ id, label, icon: Icon }) => (
                  <button key={id} onClick={() => selectCategory(id)} className={`flex items-center gap-2 rounded-xl px-3 py-3 text-sm ${activeCategory === id ? "bg-cyan-300/10 text-cyan-200" : "bg-white/[0.035] text-slate-400"}`}>
                    <Icon className="h-4 w-4" /> {label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </header>

        <main className="mx-auto max-w-[1500px] px-5 py-7 sm:px-8 sm:py-9 lg:px-10">
          <section className="grid gap-7 xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.75fr)]">
            <div className="min-w-0">
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-cyan-300/80"><Sparkles className="h-3.5 w-3.5" /> Ao vivo agora</div>
                  <h1 className="font-display text-3xl font-bold tracking-[-0.035em] text-white sm:text-[40px]">O que você quer assistir?</h1>
                  <p className="mt-2 text-sm text-slate-500">Explore canais públicos e dê play em um novo sinal.</p>
                </div>
                <div className="flex items-center gap-2 rounded-full border border-emerald-400/10 bg-emerald-400/[0.06] px-3 py-2 text-[11px] text-emerald-300">
                  <span className={`h-1.5 w-1.5 rounded-full ${loadingPlaylist ? "animate-pulse bg-amber-300" : "bg-emerald-300"}`} />
                  {loadingPlaylist ? "Sincronizando" : playlistState === "synced" ? "Playlist atualizada" : "Modo demonstração"}
                </div>
              </div>

              <div className="relative overflow-hidden rounded-[22px] border border-white/[0.08] bg-[#0c111a] shadow-[0_28px_80px_rgba(0,0,0,0.28)]">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_15%,rgba(34,211,238,0.15),transparent_32%),radial-gradient(circle_at_85%_85%,rgba(124,58,237,0.16),transparent_36%)]" />
                <div className="relative aspect-video min-h-[260px] w-full overflow-hidden bg-[#070a0f] sm:min-h-0">
                  <video ref={videoRef} className="h-full w-full object-contain" controls playsInline onPlay={() => setIsPlaying(true)} onPlaying={() => { setIsPlaying(true); setBuffering(false); setPlayerError(""); }} onPause={() => setIsPlaying(false)} onWaiting={() => setBuffering(true)} onCanPlay={() => setBuffering(false)} />
                  {buffering && !playerError && <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/10 bg-black/60 px-4 py-2 text-xs font-semibold text-white backdrop-blur-md"><span className="mr-2 inline-block h-2 w-2 animate-pulse rounded-full bg-cyan-300" />Carregando sinal</div>}
                  {!isPlaying && !playerError && (
                    <button onClick={() => videoRef.current?.play().catch(() => setPlayerError("O navegador bloqueou o início automático. Use os controles do player."))} className="absolute inset-0 grid place-items-center bg-gradient-to-t from-black/50 via-transparent to-black/10" aria-label={`Reproduzir ${selected.name}`}>
                      <span className="grid h-16 w-16 place-items-center rounded-full bg-cyan-300 text-slate-950 shadow-[0_0_0_10px_rgba(103,232,249,0.12),0_14px_36px_rgba(34,211,238,0.28)] transition hover:scale-105 active:scale-95"><Play className="ml-1 h-6 w-6 fill-current" /></span>
                    </button>
                  )}
                  {playerError && (
                    <div className="absolute inset-0 grid place-items-center bg-[#080b11]/90 p-6 text-center">
                      <div className="max-w-md">
                        <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-amber-300/10 text-amber-300"><AlertTriangle className="h-6 w-6" /></div>
                        <p className="font-semibold text-white">Sinal indisponível</p>
                        <p className="mt-2 text-xs leading-relaxed text-slate-500">{playerError}</p>
                        <button
                          onClick={() => {
                            if (videoRef.current && videoRef.current.readyState > 0) {
                              videoRef.current.play().then(() => {
                                setPlayerError("");
                                setIsPlaying(true);
                              }).catch(() => setSelected({ ...selected }));
                            } else {
                              setSelected({ ...selected });
                            }
                          }}
                          className="mt-4 rounded-lg border border-white/10 px-3 py-2 text-xs font-semibold text-slate-300 transition hover:bg-white/[0.06]"
                        >
                          Reproduzir novamente
                        </button>
                      </div>
                    </div>
                  )}
                  <div className="pointer-events-none absolute left-4 top-4 flex items-center gap-2 rounded-full border border-white/10 bg-black/40 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-white backdrop-blur-md"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-rose-400" /> Live</div>
                </div>
                <div className="relative flex flex-wrap items-center justify-between gap-4 border-t border-white/[0.07] px-5 py-4 sm:px-6">
                  <div className="flex min-w-0 items-center gap-3"><ChannelLogo channel={selected} large /><div className="min-w-0"><p className="truncate font-display text-lg font-semibold text-white">{selected.name}</p><p className="mt-0.5 text-xs text-slate-500">{selected.group || "Canal público"} {selected.resolution ? `· ${selected.resolution}` : "· transmissão ao vivo"}</p></div></div>
                  <div className="flex items-center gap-2"><button onClick={() => toggleFavorite(selected)} className={`grid h-9 w-9 place-items-center rounded-lg border transition ${favorites.includes(selected.id) ? "border-rose-300/20 bg-rose-300/10 text-rose-300" : "border-white/10 bg-white/[0.03] text-slate-500 hover:text-rose-300"}`} aria-label="Favoritar canal"><Heart className={`h-4 w-4 ${favorites.includes(selected.id) ? "fill-current" : ""}`} /></button><button onClick={() => navigator.clipboard?.writeText(selected.url).then(() => toast.success("Link copiado"))} className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-xs font-semibold text-slate-400 transition hover:bg-white/[0.07] hover:text-white">Copiar link</button></div>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2"><StatPill icon={Radio} value={String(channels.length)} label="canais" /><StatPill icon={Trophy} value={String(channels.filter((channel) => channel.category === "sports").length)} label="esportes" /><StatPill icon={Film} value={String(channels.filter((channel) => channel.category === "movies").length)} label="filmes" /></div>
            </div>

            <aside className="min-w-0 xl:pt-[62px]">
              <div className="mb-4 flex items-center justify-between"><div><p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-600">Seleção rápida</p><h2 className="mt-1 font-display text-xl font-semibold text-white">Destaques da semana</h2></div><button onClick={() => selectCategory("sports")} className="text-xs font-semibold text-cyan-300 transition hover:text-cyan-200">Ver esportes <ChevronRight className="inline h-3.5 w-3.5" /></button></div>
              <div className="space-y-2.5">
                {featured.map((channel) => (
                  <button key={channel.id} onClick={() => setSelected(channel)} className={`group flex w-full items-center gap-3 rounded-2xl border px-3 py-3 text-left transition-all duration-200 ${selected.id === channel.id ? "border-cyan-300/25 bg-cyan-300/[0.08]" : "border-white/[0.07] bg-white/[0.025] hover:-translate-y-0.5 hover:border-white/15 hover:bg-white/[0.055]"}`}>
                    <ChannelLogo channel={channel} /><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-white">{channel.name}</p><p className="mt-1 truncate text-[11px] text-slate-600">{channel.group || "Canal público"} {channel.resolution ? `· ${channel.resolution}` : ""}</p></div><span className="grid h-8 w-8 place-items-center rounded-lg bg-white/[0.05] text-slate-500 transition group-hover:bg-cyan-300 group-hover:text-slate-950"><Play className="h-3.5 w-3.5 fill-current" /></span>
                  </button>
                ))}
              </div>
              <div className="mt-5 rounded-2xl border border-white/[0.07] bg-gradient-to-r from-violet-500/[0.08] to-cyan-500/[0.06] p-4"><div className="flex items-start gap-3"><div className="mt-0.5 rounded-lg bg-violet-300/10 p-2 text-violet-200"><CircleHelp className="h-4 w-4" /></div><div><p className="text-xs font-semibold text-white">Algum canal não abriu?</p><p className="mt-1 text-[11px] leading-relaxed text-slate-500">Streams públicos podem expirar ou exigir autorização do provedor original.</p></div></div></div>
            </aside>
          </section>

          <section className="mt-12">
            <div className="mb-5 flex flex-wrap items-end justify-between gap-4"><div><p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-600">Catálogo público</p><h2 className="mt-1 font-display text-2xl font-semibold text-white">{activeCategory === "all" ? "Todos os canais" : categoryMeta[activeCategory].label}</h2></div><div className="flex items-center gap-2"><div className="hidden items-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.025] px-3 py-2 text-xs text-slate-500 sm:flex"><ListFilter className="h-3.5 w-3.5" /> {filteredChannels.length} resultados</div><button onClick={() => toast.info("Os canais são ordenados pela playlist pública atual.")} className="grid h-9 w-9 place-items-center rounded-lg border border-white/[0.08] bg-white/[0.025] text-slate-500 hover:text-white" aria-label="Opções de filtro"><SlidersHorizontal className="h-4 w-4" /></button></div></div>
            <div className="mb-6 flex gap-2 overflow-x-auto pb-1 scrollbar-none">{categoryItems.map(({ id, label, icon: Icon }) => <button key={id} onClick={() => selectCategory(id)} className={`flex shrink-0 items-center gap-2 rounded-full border px-4 py-2.5 text-xs font-semibold transition ${activeCategory === id ? "border-cyan-300/25 bg-cyan-300/10 text-cyan-200" : "border-white/[0.08] bg-white/[0.025] text-slate-500 hover:border-white/15 hover:text-slate-200"}`}><Icon className="h-3.5 w-3.5" /> {label}</button>)}</div>
            {filteredChannels.length > 0 ? <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">{filteredChannels.map((channel) => { const Icon = categoryMeta[channel.category].icon; return <article key={channel.id} className="group relative flex min-h-[108px] cursor-pointer items-center gap-3 overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.025] p-3 transition-all duration-200 hover:-translate-y-1 hover:border-cyan-300/20 hover:bg-white/[0.05] hover:shadow-[0_16px_36px_rgba(0,0,0,0.2)]" onClick={() => setSelected(channel)}><div className="absolute right-0 top-0 h-24 w-24 rounded-full bg-cyan-400/5 blur-2xl transition group-hover:bg-cyan-400/10" /><ChannelLogo channel={channel} /><div className="relative min-w-0 flex-1"><div className="mb-1 flex items-center gap-1.5"><Icon className={`h-3 w-3 ${categoryMeta[channel.category].color}`} /><span className="text-[10px] font-semibold uppercase tracking-wider text-slate-600">{categoryMeta[channel.category].label}</span></div><h3 className="truncate text-sm font-semibold text-slate-200 group-hover:text-white">{channel.name}</h3><p className="mt-1 truncate text-[11px] text-slate-600">{channel.group || "Link público"}{channel.resolution ? ` · ${channel.resolution}` : ""}</p></div><button onClick={(event) => { event.stopPropagation(); toggleFavorite(channel); }} className={`absolute right-3 top-3 rounded-md p-1.5 transition ${favorites.includes(channel.id) ? "text-rose-300" : "text-slate-700 opacity-0 group-hover:opacity-100 hover:text-rose-300"}`} aria-label="Favoritar"><Heart className={`h-3.5 w-3.5 ${favorites.includes(channel.id) ? "fill-current" : ""}`} /></button><span className="absolute bottom-3 right-3 text-slate-700 transition group-hover:text-cyan-300"><Play className="h-3.5 w-3.5 fill-current" /></span></article>; })}</div> : <div className="rounded-2xl border border-dashed border-white/10 py-16 text-center"><Search className="mx-auto h-7 w-7 text-slate-700" /><p className="mt-3 text-sm font-semibold text-slate-300">Nenhum canal encontrado</p><p className="mt-1 text-xs text-slate-600">Tente outro nome ou mude a categoria.</p></div>}
          </section>

          <footer className="mt-14 border-t border-white/[0.07] py-6"><div className="flex flex-col gap-3 text-[11px] leading-relaxed text-slate-600 sm:flex-row sm:items-center sm:justify-between"><p><span className="font-semibold text-slate-500">NOVA PLAY</span> · player web experimental para streams públicos.</p><p className="flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5 text-emerald-400/70" /> Nenhum login ou senha é solicitado.</p></div></footer>
        </main>
      </div>
    </div>
  );
}
