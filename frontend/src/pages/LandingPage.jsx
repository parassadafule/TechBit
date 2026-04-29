import { useEffect } from 'react';
import { ArrowRight, BrainCircuit, Radar, Search, Sparkles, Zap } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const sourceCards = [
  {
    title: 'GitHub via OSS Insight',
    description: 'We track open-source repo movement and rising engineering interest from the GitHub ecosystem.',
    logo: 'https://www.devtrends.pro/_next/image?url=%2Fimages%2Fgithub-custom.png&w=3840&q=75',
  },
  {
    title: 'Stack Overflow',
    description: 'Hot questions reveal what developers are actively struggling with, learning, and shipping.',
    logo: 'https://stackoverflow.com/Content/Sites/stackoverflow/Img/logo.png?v=0a124c963f5f',
  },
  {
    title: 'Reddit communities',
    description: 'Programming, webdev, and javascript discussions add real-world community momentum to the signal.',
    logo: 'https://redditinc.com/hubfs/Reddit%20Inc/Content/Brand%20Page/Reddit_Lockup_Logo.svg',
  },
  {
    title: 'Hacker News',
    description: 'We use Hacker News to capture broader product, startup, and engineering conversations.',
    logo: 'https://news.ycombinator.com/favicon.ico',
  },
];

const featureCards = [
  {
    icon: Radar,
    title: 'Trend Intelligence Engine',
    copy: 'TechBit aggregates multiple sources, normalizes the data, removes duplicates, and ranks what actually matters right now.',
  },
  {
    icon: BrainCircuit,
    title: 'Personalized Feed',
    copy: 'Your feed blends semantic relevance, trend alignment, engagement, and recency so it feels tuned for developers instead of engagement farming.',
  },
  {
    icon: Search,
    title: 'Semantic Search',
    copy: 'Search uses embeddings and related-content retrieval to surface posts that are conceptually relevant, not only keyword-adjacent.',
  },
  {
    icon: Sparkles,
    title: 'AI-Assisted Posting',
    copy: 'Posts can be enriched with TLDR generation and content understanding so long technical content becomes more scannable and shareable.',
  },
];

const feedSteps = [
  {
    step: '01',
    title: 'Build your developer profile',
    text: 'TechBit uses interests, liked tags, and recent searches to understand what kind of topics should be promoted for you.',
  },
  {
    step: '02',
    title: 'Rank candidate posts',
    text: 'Each post is scored using semantic similarity, trend score, engagement score, and recency score instead of one shallow metric.',
  },
  {
    step: '03',
    title: 'Keep the feed diverse',
    text: 'We avoid overloading the top results with the same tag cluster so the feed stays broad, useful, and fresh.',
  },
];

const uniqueHighlights = [
  'Local AI support through Ollama for privacy-aware experiments and lower-cost iteration.',
  'Live trend refreshes from external APIs instead of static demo-only content.',
  'A single workflow for discovery, semantic search, posting, learning, and trend monitoring.',
  'Built specifically around developer behavior rather than generic social media mechanics.',
];

const LandingPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      navigate('/app', { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[linear-gradient(180deg,#f8fbff_0%,#eef6ff_35%,#fff9f1_100%)]" />
    );
  }

  return (
    <div className="min-h-screen overflow-hidden bg-[linear-gradient(180deg,#f8fbff_0%,#eef6ff_35%,#fff9f1_100%)] text-slate-900">
      <div className="relative">
        <div className="absolute inset-x-0 top-0 -z-10 h-[34rem] bg-[radial-gradient(circle_at_top_left,rgba(14,165,233,0.18),transparent_35%),radial-gradient(circle_at_top_right,rgba(249,115,22,0.16),transparent_28%),radial-gradient(circle_at_center,rgba(15,23,42,0.08),transparent_44%)]" />

        <header className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6 lg:px-10">
          <Link to="/" className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-950 text-lg font-bold text-white shadow-[0_12px_30px_rgba(15,23,42,0.18)]">
              T
            </div>
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.32em] text-sky-700">TechBit</p>
              <p className="text-sm text-slate-500">Developer trend intelligence</p>
            </div>
          </Link>

          <nav className="flex items-center gap-3">
            <Link
              to="/login"
              className="rounded-full border border-slate-200 bg-white/80 px-4 py-2 text-sm font-medium text-slate-700 backdrop-blur hover:border-slate-300"
            >
              Log in
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white shadow-[0_14px_30px_rgba(15,23,42,0.16)] transition-transform hover:-translate-y-0.5"
            >
              Open TechBit
              <ArrowRight size={16} />
            </Link>
          </nav>
        </header>

        <section className="mx-auto grid max-w-7xl gap-12 px-6 pb-18 pt-8 lg:grid-cols-[1.15fr_0.85fr] lg:px-10 lg:pb-24 lg:pt-14">
          <div className="max-w-3xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-sky-200 bg-white/75 px-4 py-2 text-sm font-medium text-sky-800 backdrop-blur">
              <Zap size={16} />
              Trends, semantic search, AI posting, and a personalized developer feed
            </div>

            <h1 className="max-w-4xl font-serif text-5xl leading-[0.95] tracking-tight text-slate-950 sm:text-6xl lg:text-7xl">
              One place to understand what developers are talking about and why it matters.
            </h1>

            <p className="mt-7 max-w-2xl text-lg leading-8 text-slate-600 sm:text-xl">
              TechBit is a developer-first discovery platform that turns fragmented ecosystem chatter into trends,
              semantic search results, personalized feeds, learning context, and smarter technical posts.
            </p>

            <div className="mt-10 flex flex-col gap-4 sm:flex-row">
              <Link
                to="/login"
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-sky-600 px-6 py-4 text-base font-semibold text-white shadow-[0_18px_38px_rgba(2,132,199,0.28)] transition-transform hover:-translate-y-0.5 hover:bg-sky-700"
              >
                Start with TechBit
                <ArrowRight size={18} />
              </Link>
              <a
                href="#sources"
                className="inline-flex items-center justify-center rounded-2xl border border-slate-300 bg-white/85 px-6 py-4 text-base font-semibold text-slate-800 backdrop-blur hover:border-slate-400"
              >
                See our data sources
              </a>
            </div>

            <div className="mt-12 grid gap-4 sm:grid-cols-3">
              {[
                ['4 trend sources', 'GitHub, Stack Overflow, Reddit, and Hacker News'],
                ['Semantic ranking', 'Embeddings connect interests to the right posts'],
                ['AI-assisted content', 'TLDR generation and technical context enrichment'],
              ].map(([label, copy]) => (
                <div key={label} className="rounded-2xl border border-white/80 bg-white/70 p-4 shadow-[0_10px_30px_rgba(15,23,42,0.06)] backdrop-blur">
                  <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-400">{label}</p>
                  <p className="mt-3 text-sm leading-6 text-slate-700">{copy}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="absolute -left-6 top-12 hidden h-24 w-24 rounded-full bg-orange-300/30 blur-3xl lg:block" />
            <div className="absolute -right-8 bottom-6 hidden h-28 w-28 rounded-full bg-sky-400/20 blur-3xl lg:block" />

            <div className="rounded-[2rem] border border-slate-200/70 bg-slate-950 p-5 text-white shadow-[0_30px_80px_rgba(15,23,42,0.24)]">
              <div className="rounded-[1.5rem] border border-white/10 bg-[linear-gradient(160deg,#0f172a_0%,#111827_46%,#1e293b_100%)] p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-sky-300">Inside TechBit</p>
                    <h2 className="mt-2 text-2xl font-semibold">How the product thinks</h2>
                  </div>
                  <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">
                    Live signals
                  </div>
                </div>

                <div className="mt-6 space-y-4">
                  {[
                    ['Trend engine', 'Multiple sources are aggregated, normalized, deduplicated, and ranked into a single trends layer.'],
                    ['Personal feed', 'Posts are scored by semantic similarity, trend alignment, engagement, and freshness.'],
                    ['AI layer', 'Semantic search, TLDR generation, and content enrichment help developers move faster through dense information.'],
                  ].map(([title, body], index) => (
                    <div key={title} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                      <div className="flex items-start gap-4">
                        <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-xl bg-sky-400/15 text-sm font-semibold text-sky-200">
                          0{index + 1}
                        </div>
                        <div>
                          <p className="font-semibold text-white">{title}</p>
                          <p className="mt-1 text-sm leading-6 text-slate-300">{body}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-2xl border border-orange-400/20 bg-orange-400/10 p-4">
                    <p className="text-orange-200">Why it stands out</p>
                    <p className="mt-2 text-slate-200">It connects trends, learning, search, and posting instead of treating them as separate features.</p>
                  </div>
                  <div className="rounded-2xl border border-sky-400/20 bg-sky-400/10 p-4">
                    <p className="text-sky-200">What developers get</p>
                    <p className="mt-2 text-slate-200">A feed and search experience shaped by technical relevance, not just vanity engagement.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      <section id="sources" className="mx-auto max-w-7xl px-6 py-18 lg:px-10">
        <div className="mb-10 max-w-3xl">
          <p className="font-mono text-xs uppercase tracking-[0.32em] text-slate-400">Where trends come from</p>
          <h2 className="mt-3 text-4xl font-semibold tracking-tight text-slate-950">We gather signals from places developers already trust.</h2>
          <p className="mt-4 text-lg leading-8 text-slate-600">
            TechBit watches major developer ecosystems and turns scattered movement into one coherent picture of what is rising, useful, or worth learning.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {sourceCards.map((card) => (
            <div key={card.title} className="group rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-[0_16px_40px_rgba(15,23,42,0.06)] transition-transform hover:-translate-y-1">
              <img src={card.logo} alt={card.title} className="mb-4 h-12 w-auto" />
              <h3 className="text-xl font-semibold text-slate-950">{card.title}</h3>
              <p className="mt-3 text-sm leading-7 text-slate-600">{card.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-y border-slate-200 bg-white/70 py-18 backdrop-blur">
        <div className="mx-auto grid max-w-7xl gap-10 px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-10">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.32em] text-slate-400">How the feed works</p>
            <h2 className="mt-3 text-4xl font-semibold tracking-tight text-slate-950">A ranking system made for developer relevance.</h2>
            <p className="mt-4 text-lg leading-8 text-slate-600">
              The feed is not just latest-first. It balances semantic similarity, trend momentum, engagement, and recency, then applies diversity so you do not get trapped in the same topic loop.
            </p>
          </div>

          <div className="space-y-4">
            {feedSteps.map((item) => (
              <div key={item.step} className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-[0_14px_34px_rgba(15,23,42,0.05)]">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-sm font-semibold text-white">
                    {item.step}
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-slate-950">{item.title}</h3>
                    <p className="mt-2 text-sm leading-7 text-slate-600">{item.text}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-18 lg:px-10">
        <div className="mb-10 max-w-3xl">
          <p className="font-mono text-xs uppercase tracking-[0.32em] text-slate-400">What makes TechBit useful</p>
          <h2 className="mt-3 text-4xl font-semibold tracking-tight text-slate-950">The app explains itself through the product.</h2>
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          {featureCards.map(({ icon: Icon, title, copy }) => (
            <div key={title} className="rounded-[1.75rem] border border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)] p-6 shadow-[0_18px_42px_rgba(15,23,42,0.05)]">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-100 text-sky-700">
                <Icon size={22} />
              </div>
              <h3 className="mt-5 text-2xl font-semibold text-slate-950">{title}</h3>
              <p className="mt-3 text-sm leading-7 text-slate-600">{copy}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-slate-950 py-18 text-white">
        <div className="mx-auto grid max-w-7xl gap-12 px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-10">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.32em] text-sky-300">Unique features</p>
            <h2 className="mt-3 text-4xl font-semibold tracking-tight">More signal, less random scrolling.</h2>
            <p className="mt-4 text-lg leading-8 text-slate-300">
              TechBit combines trend discovery, semantic retrieval, AI-assisted writing, and learning workflows into one developer product instead of scattering them across tools.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {uniqueHighlights.map((item) => (
              <div key={item} className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-5">
                <div className="mb-3 h-2 w-16 rounded-full bg-gradient-to-r from-sky-400 to-orange-300" />
                <p className="text-sm leading-7 text-slate-200">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
};

export default LandingPage;
