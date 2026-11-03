import {
  ArrowUpRight,
  ChevronDown,
  ChevronUp,
  Github,
  Play,
  Search,
  Sparkles,
} from "lucide-react";
import { useMemo, useRef, useState } from "react";
import submissions from "./data/submissions.json";

type Submission = {
  id: string;
  name: string;
  description: string;
  demoVideo: string;
  demoEmbedUrl: string;
  demoProvider: string;
  demoThumbnailUrl: string;
  tracks: string[];
  attendees: Array<{
    name: string;
    linkedin: string;
  }>;
  githubRepo: string;
  showcaseWorthy: string;
};

const data = submissions as Submission[];
const SHOW_GITHUB_LINKS = false;
const trackFilters = ["Antler Agents", "Rho Fintech", "AutoHDR"];
const filters = ["All", ...trackFilters];
const winningBuilds = [
  {
    track: "Antler Agents Track",
    name: "Ocypod",
  },
  {
    track: "Rho Fintech Track",
    name: "Payment Intelligence",
  },
  {
    track: "AutoHDR Image Models & Pipelines Track",
    name: "ShootAgent",
  },
  {
    track: "Community Choice",
    name: "Kestrel",
  },
]
  .map((winner) => {
    const submission = data.find((entry) => entry.name === winner.name);
    return submission ? { ...winner, submission } : null;
  })
  .filter((winner): winner is { track: string; name: string; submission: Submission } =>
    Boolean(winner),
  );

type Sponsor = {
  name: string;
  logo: string;
  logoTheme?: "dark";
  description: string;
  cta?: { label: string; href: string };
};

const sponsors: Sponsor[] = [
  {
    name: "Antler",
    logo: "/sponsors/antler.svg",
    description:
      "Antler is a pre-seed fund, the first believer at inception stage, investing $600K as your first institutional check. Antler hosted the hackathon and sponsored the Agents track.",
    cta: { label: "Apply to a residency", href: "https://to.antler.co/AITX" },
  },
  {
    name: "Rho",
    logo: "/sponsors/rho.png",
    description:
      "Rho is the all-in-one financial platform for startups: business banking, corporate cards, expense management, and automated AP. Rho sponsored the Fintech track, challenging teams to build on real financial workflows.",
    cta: { label: "rho.co", href: "https://www.rho.co" },
  },
  {
    name: "AutoHDR",
    logo: "/sponsors/autohdr.svg",
    description:
      "AutoHDR edits 1 in 10 U.S. real estate listings using AI. They scaled from $0 to $8M ARR in under a year, sponsored the Image Models & Pipelines track, and are hiring builders with creativity, grit, and a willingness to ship.",
    cta: { label: "autohdr.com", href: "https://www.autohdr.com/" },
  },
  {
    name: "Supabase",
    logo: "/sponsors/supabase.svg",
    description:
      "Supabase is the open source Postgres development platform — database, auth, storage, and realtime APIs that let builders ship production apps in a weekend.",
    cta: { label: "supabase.com", href: "https://supabase.com" },
  },
  {
    name: "Atlassian for Startups",
    logo: "/sponsors/atlassian-for-startups.svg",
    logoTheme: "dark",
    description:
      "Atlassian's mission is to unleash the potential of every team. Supercharged by AI, Atlassian for Startups gives founders collaboration tools to plan, track, and ship — from MVP to IPO.",
    cta: {
      label: "Atlassian for Startups",
      href: "https://www.atlassian.com/software/startups",
    },
  },
];

function shortDescription(value: string, maxLength = 245) {
  if (value.length <= maxLength) return value;
  return `${value.slice(0, maxLength).trim()}...`;
}

function scoreForFeature(submission: Submission) {
  return (
    submission.tracks.length * 8 +
    (submission.githubRepo ? 4 : 0) +
    (submission.demoVideo ? 4 : 0)
  );
}

function trackTone(track: string) {
  if (track === "Antler Agents") return "tone-blue";
  if (track === "AutoHDR") return "tone-amber";
  if (track === "Rho Fintech") return "tone-green";
  return "tone-neutral";
}

function matchesFilter(submission: Submission, filter: string) {
  if (filter === "All") return true;
  return submission.tracks.includes(filter);
}

function App() {
  const [activeFilter, setActiveFilter] = useState("All");
  const [query, setQuery] = useState("");
  const [expandedDescriptions, setExpandedDescriptions] = useState<Set<string>>(
    () => new Set(),
  );
  const [activeVideos, setActiveVideos] = useState<Set<string>>(() => new Set());
  const [readyVideos, setReadyVideos] = useState<Set<string>>(() => new Set());
  const [fallbackVideos, setFallbackVideos] = useState<Set<string>>(() => new Set());
  const fallbackTimers = useRef<Map<string, number>>(new Map());

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return data
      .filter((submission) => matchesFilter(submission, activeFilter))
      .filter((submission) => {
        if (!normalizedQuery) return true;
        return [
          submission.name,
          submission.description,
          submission.attendees.map((attendee) => attendee.name).join(" "),
          submission.tracks.join(" "),
        ]
          .join(" ")
          .toLowerCase()
          .includes(normalizedQuery);
      })
      .sort((a, b) => scoreForFeature(b) - scoreForFeature(a));
  }, [activeFilter, query]);

  const multiTrackBuilds = data.filter(
    (submission) => submission.tracks.length > 1,
  ).length;
  return (
    <main>
      <section className="hero">
        <nav className="topbar" aria-label="Site">
          <div className="brand" aria-label="AITX and MLOps World GenAI Summit">
            <img alt="AITX" className="brand-aitx" src="/brand/aitx.png" />
            <span aria-hidden="true" className="brand-amp">
              &amp;
            </span>
            <span aria-hidden="true" className="mlops-badge">
              <img alt="" src="/brand/mlops-world.png" />
            </span>
            <span className="mlops-text">
              MLOps World
              <br />
              GenAI Summit
            </span>
          </div>
          <a className="nav-link" href="#gallery">
            View builds
            <ArrowUpRight size={16} />
          </a>
        </nav>

        <div className="hero-grid">
          <div className="hero-copy">
            <p className="eyebrow">Community Hackathon @ Austin Tech Week</p>
            <h1>Austin builders spent Tech Week shipping real products.</h1>
            <p className="hero-lede">
              AITX teamed up with MLOps World | GenAI Summit for a hackathon
              during Austin Tech Week. Throughout the entire week, hackers built
              across the Antler Agents, AutoHDR Image Models &amp; Pipelines,
              and Rho Fintech tracks, culminating in live demoes at a
              science-fair-style &quot;Hack Fair&quot; in front of judges and
              the Austin AI community. Check out their projects below!
            </p>
            <div className="hero-actions">
              <a className="primary-action" href="#gallery">
                Explore the gallery
                <Sparkles size={18} />
              </a>
              <a className="secondary-action" href="#featured">
                See winning builds
              </a>
            </div>
          </div>

        </div>
      </section>

      <section className="sponsors" id="sponsors" aria-labelledby="sponsors-heading">
        <div className="section-heading">
          <p className="eyebrow">Sponsors</p>
          <h2 id="sponsors-heading">Made possible by</h2>
        </div>
        <div className="sponsor-grid">
          {sponsors.map((sponsor) => (
            <article
              className="sponsor-card"
              key={sponsor.name}
              data-theme={sponsor.logoTheme}
            >
              <div className="sponsor-logo">
                <img alt={`${sponsor.name} logo`} src={sponsor.logo} />
              </div>
              <p>{sponsor.description}</p>
              {sponsor.cta ? (
                <a
                  className="partner-cta"
                  href={sponsor.cta.href}
                  target="_blank"
                  rel="noreferrer"
                >
                  {sponsor.cta.label}
                  <ArrowUpRight size={14} />
                </a>
              ) : null}
            </article>
          ))}
        </div>
      </section>

      <section className="featured" id="featured" aria-labelledby="featured-heading">
        <div className="section-heading">
          <p className="eyebrow">Winning Builds</p>
          <h2 id="featured-heading">Winners from the Hack Fair</h2>
        </div>
        <div className="featured-grid">
          {winningBuilds.map((winner, index) => (
            <a
              className="featured-card"
              href={`#submission-${winner.submission.id}`}
              key={winner.submission.id}
            >
              <span className="rank">0{index + 1}</span>
              <div>
                <p className="winner-track">{winner.track}</p>
                <h3>{winner.submission.name}</h3>
                <p>{shortDescription(winner.submission.description, 150)}</p>
              </div>
              <div className="metric-row">
                {winner.submission.tracks.slice(0, 2).map((track) => (
                  <span key={track}>{track}</span>
                ))}
                <span>Jump to build</span>
              </div>
            </a>
          ))}
        </div>
      </section>

      <section className="gallery-section" id="gallery" aria-labelledby="gallery-heading">
        <div className="gallery-header">
          <div>
            <p className="eyebrow">Build gallery</p>
            <h2 id="gallery-heading">Search every project</h2>
          </div>
          <div className="search-wrap">
            <Search size={18} />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search projects, teams, tracks..."
              aria-label="Search submissions"
            />
          </div>
        </div>

        <div className="filter-row" aria-label="Submission filters">
          {filters.map((filter) => (
            <button
              className={activeFilter === filter ? "filter active" : "filter"}
              key={filter}
              onClick={() => setActiveFilter(filter)}
              type="button"
            >
              {filter}
            </button>
          ))}
        </div>

        <div className="result-count">
          Showing {filtered.length} of {data.length} builds
          <span>{multiTrackBuilds} builds entered multiple tracks</span>
        </div>

        {filtered.length === 0 ? (
          <div className="empty-state">
            <h3>No matching builds</h3>
            <p>Try a different project name, team member, or track.</p>
          </div>
        ) : null}

        <div className="card-grid">
          {filtered.map((submission) => (
            <article
              className="submission-card"
              id={`submission-${submission.id}`}
              key={submission.id}
            >
              {(() => {
                const isExpanded = expandedDescriptions.has(submission.id);
                const canExpand = submission.description.length > 245;
                const description = isExpanded
                  ? submission.description
                  : shortDescription(submission.description);

                return (
                  <>
              <div className="card-top">
                <div className="badge-row">
                  {submission.tracks.map((track) => (
                    <span className={`badge ${trackTone(track)}`} key={track}>
                      {track}
                    </span>
                  ))}
                </div>
                <h3>{submission.name}</h3>
                <p>{description}</p>
                {canExpand ? (
                  <button
                    className="description-toggle"
                    onClick={() => {
                      setExpandedDescriptions((current) => {
                        const next = new Set(current);
                        if (next.has(submission.id)) {
                          next.delete(submission.id);
                        } else {
                          next.add(submission.id);
                        }
                        return next;
                      });
                    }}
                    type="button"
                  >
                    {isExpanded ? "Show less" : "Show full description"}
                    {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>
                ) : null}
              </div>

              {submission.demoEmbedUrl ? (
                <div className="video-frame">
                  {activeVideos.has(submission.id) ? (
                    <>
                      <iframe
                        src={submission.demoEmbedUrl}
                        title={`${submission.name} demo video`}
                        allow="autoplay; fullscreen; picture-in-picture"
                        allowFullScreen
                        onLoad={() => {
                          const pending = fallbackTimers.current.get(submission.id);
                          if (pending !== undefined) {
                            window.clearTimeout(pending);
                            fallbackTimers.current.delete(submission.id);
                          }
                          setReadyVideos((current) =>
                            new Set(current).add(submission.id),
                          );
                        }}
                      />
                      {!readyVideos.has(submission.id) &&
                      !fallbackVideos.has(submission.id) ? (
                        <div className="video-loading-overlay">
                          {submission.demoThumbnailUrl ? (
                            <img alt="" src={submission.demoThumbnailUrl} />
                          ) : null}
                          <span className="play-badge">
                            <Play size={22} fill="currentColor" />
                          </span>
                          <span className="video-provider">
                            Loading embedded player...
                          </span>
                        </div>
                      ) : null}
                      {fallbackVideos.has(submission.id) ? (
                        <div className="video-fallback-overlay">
                          {submission.demoThumbnailUrl ? (
                            <img alt="" src={submission.demoThumbnailUrl} />
                          ) : null}
                          <a
                            href={submission.demoVideo}
                            target="_blank"
                            rel="noreferrer"
                          >
                            <Play size={18} fill="currentColor" />
                            Open demo
                          </a>
                        </div>
                      ) : null}
                    </>
                  ) : (
                    <button
                      className="video-poster"
                      onClick={() => {
                        setReadyVideos((current) => {
                          const next = new Set(current);
                          next.delete(submission.id);
                          return next;
                        });
                        setFallbackVideos((current) => {
                          const next = new Set(current);
                          next.delete(submission.id);
                          return next;
                        });
                        setActiveVideos((current) => new Set(current).add(submission.id));
                        const existing = fallbackTimers.current.get(submission.id);
                        if (existing !== undefined) {
                          window.clearTimeout(existing);
                        }
                        const timerId = window.setTimeout(() => {
                          fallbackTimers.current.delete(submission.id);
                          setReadyVideos((readyCurrent) => {
                            if (readyCurrent.has(submission.id)) return readyCurrent;
                            setFallbackVideos((current) =>
                              new Set(current).add(submission.id),
                            );
                            return readyCurrent;
                          });
                        }, 12000);
                        fallbackTimers.current.set(submission.id, timerId);
                      }}
                      type="button"
                    >
                      {submission.demoThumbnailUrl ? (
                        <img
                          alt=""
                          loading="lazy"
                          src={submission.demoThumbnailUrl}
                        />
                      ) : null}
                      <span className="play-badge">
                        <Play size={22} fill="currentColor" />
                      </span>
                      <span className="video-provider">
                        Play {submission.demoProvider || "demo"}
                      </span>
                    </button>
                  )}
                </div>
              ) : null}

              {submission.attendees.length > 0 ? (
                <div className="meta-line">
                  <span>Team</span>
                  <div className="attendee-list">
                    {submission.attendees.map((attendee) =>
                      attendee.linkedin ? (
                        <a
                          href={attendee.linkedin}
                          key={`${submission.id}-${attendee.name}`}
                          target="_blank"
                          rel="noreferrer"
                        >
                          {attendee.name}
                        </a>
                      ) : (
                        <span key={`${submission.id}-${attendee.name}`}>
                          {attendee.name}
                        </span>
                      ),
                    )}
                  </div>
                </div>
              ) : null}

              <div className="card-actions">
                {submission.demoVideo ? (
                  <a href={submission.demoVideo} target="_blank" rel="noreferrer">
                    <Play size={16} />
                    Demo
                  </a>
                ) : null}
                {SHOW_GITHUB_LINKS && submission.githubRepo ? (
                  <a href={submission.githubRepo} target="_blank" rel="noreferrer">
                    <Github size={16} />
                  Repo
                </a>
              ) : null}
              </div>
                  </>
                );
              })()}
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}

export default App;
