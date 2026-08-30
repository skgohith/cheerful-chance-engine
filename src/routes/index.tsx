import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { ArrowUpRight, ChevronRight, Clock3, Instagram, Menu, Sparkles, Trophy, Users, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import heroImage from "@/assets/toon-giveaway-hero.jpg";
import { Button } from "@/components/ui/button";
import { listPublicGiveaways, listPublicWinners } from "@/lib/giveaway.functions";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [
    { title: "Telugu Toon World Giveaways" },
    { name: "description", content: "Join colorful, community-first giveaways from Telugu Toon World." },
    { property: "og:title", content: "Telugu Toon World Giveaways" },
    { property: "og:description", content: "Join colorful, community-first giveaways from Telugu Toon World." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: Home,
});

type Giveaway = Awaited<ReturnType<typeof listPublicGiveaways>>[number];
type Winner = Awaited<ReturnType<typeof listPublicWinners>>[number];

function Home() {
  const loadGiveaways = useServerFn(listPublicGiveaways);
  const loadWinners = useServerFn(listPublicWinners);
  const [giveaways, setGiveaways] = useState<Giveaway[]>([]);
  const [winners, setWinners] = useState<Winner[]>([]);
  const [loading, setLoading] = useState(true);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [showSplash, setShowSplash] = useState(false);

  useEffect(() => {
    const hasVisited = window.sessionStorage.getItem("toon-world-intro-seen");
    if (!hasVisited) { setShowSplash(true); window.sessionStorage.setItem("toon-world-intro-seen", "1"); }
    void Promise.all([loadGiveaways(), loadWinners({ data: {} })]).then(([giveawayRows, winnerRows]) => { setGiveaways(giveawayRows); setWinners(winnerRows); setLoading(false); }).catch(() => setLoading(false));
  }, [loadGiveaways, loadWinners]);

  const active = useMemo(() => giveaways.filter((giveaway) => giveaway.status === "active" && new Date(giveaway.end_date ?? 0).getTime() > Date.now()), [giveaways]);
  const completed = useMemo(() => giveaways.filter((giveaway) => giveaway.status !== "active"), [giveaways]);
  const featured = active[0];

  return <main className="site-shell min-h-screen overflow-hidden"><header className="site-header mx-auto flex max-w-7xl items-center justify-between px-5 py-5 lg:px-8"><Link to="/" className="brand-lockup"><span className="brand-mark">TT</span><span>Telugu Toon World</span></Link><nav className="hidden items-center gap-7 text-sm font-bold md:flex"><a href="#giveaways" className="text-muted-foreground hover:text-foreground">Giveaways</a><Link to="/past-winners" className="text-muted-foreground hover:text-foreground">Past winners</Link><Link to="/admin" className="text-muted-foreground hover:text-foreground">Admin</Link></nav><Button className="hidden md:inline-flex" asChild><a href="https://www.instagram.com/" target="_blank" rel="noreferrer"><Instagram /> Follow on Instagram</a></Button><Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMobileMenu(!mobileMenu)} aria-label={mobileMenu ? "Close menu" : "Open menu"}>{mobileMenu ? <X /> : <Menu />}</Button></header>{mobileMenu && <nav className="mx-5 flex flex-col gap-4 border-b border-border pb-5 text-sm font-bold md:hidden"><a href="#giveaways" onClick={() => setMobileMenu(false)}>Giveaways</a><Link to="/past-winners">Past winners</Link><Link to="/admin">Admin studio</Link></nav>}<section className="hero-band mx-auto max-w-7xl px-5 pt-5 lg:px-8 lg:pt-8"><div className="hero-art"><img src={heroImage} alt="Cheerful cartoon characters celebrating a giveaway" width={1440} height={960} fetchPriority="high" /><div className="hero-copy"><div className="eyebrow"><span className="eyebrow-dot" /> Community giveaways</div><h1 className="hero-title">Win a little <span className="text-brand-coral">toon magic.</span></h1><p className="hero-subtitle">Fun prizes, fair draws, and big smiles from your favorite Telugu cartoon world.</p><div className="mt-7 flex flex-wrap gap-3"><Button size="lg" asChild><a href="#giveaways">Explore giveaways <ArrowUpRight /></a></Button><Button size="lg" variant="outline" asChild><Link to="/past-winners">See past winners <Trophy /></Link></Button></div></div></div></section><section id="giveaways" className="mx-auto max-w-7xl px-5 py-20 lg:px-8 lg:py-28"><div className="flex flex-wrap items-end justify-between gap-6"><div><div className="eyebrow"><Sparkles className="size-4" /> Enter a giveaway</div><h2 className="section-title mt-4">Enter today’s giveaway.</h2><p className="mt-3 max-w-xl text-muted-foreground">The admin posts the live giveaway here. Enter before the clock runs out; winners are selected in the private studio.</p></div><span className="rounded-full bg-brand-teal/10 px-4 py-2 text-sm font-black text-brand-teal">{active.length} live</span></div>{loading ? <div className="mt-10 grid gap-6 md:grid-cols-2"><div className="loading-card" /><div className="loading-card" /></div> : active.length === 0 ? <div className="empty-state mt-10"><Sparkles className="mx-auto size-10 text-brand-yellow" /><h3 className="mt-4 text-xl font-black">Today’s giveaway is on the way</h3><p className="mt-2 text-muted-foreground">Follow Telugu Toon World on Instagram so you never miss the next drop.</p></div> : <div className="mt-10 grid gap-6 md:grid-cols-2">{active.map((giveaway, index) => <GiveawayCard key={giveaway.id ?? index} giveaway={giveaway} featured={giveaway.id === featured?.id} />)}</div>}</section><section className="past-band"><div className="mx-auto max-w-7xl px-5 py-20 lg:px-8 lg:py-24"><div className="flex flex-wrap items-end justify-between gap-5"><div><div className="eyebrow"><Trophy className="size-4" /> Past winners</div><h2 className="section-title mt-4">Good vibes, <span className="text-brand-coral">great winners.</span></h2></div><Button variant="outline" asChild><Link to="/past-winners">View the hall of fame <ChevronRight /></Link></Button></div>{completed.length === 0 ? <p className="mt-8 text-muted-foreground">Your first winner leaderboard will live here after the draw.</p> : <div className="mt-9 grid gap-6 lg:grid-cols-2">{completed.slice(0, 2).map((giveaway) => <WinnerPreview key={giveaway.id ?? giveaway.title ?? "winner"} giveaway={giveaway} winners={winners.filter((winner) => winner.giveaway_id === giveaway.id)} />)}</div>}</div></section><footer className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-5 py-8 text-sm text-muted-foreground lg:px-8"><p>Made with joy for the Toon World family.</p><a href="https://www.instagram.com/" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 font-bold text-foreground hover:text-brand-coral"><Instagram className="size-4" /> @telugutoonworld</a></footer>{showSplash && <IntroSplash onDone={() => setShowSplash(false)} />}</main>;
}

function GiveawayCard({ giveaway, featured }: { giveaway: Giveaway; featured: boolean }) {
  const days = Math.max(0, Math.ceil((new Date(giveaway.end_date ?? 0).getTime() - Date.now()) / 86400000));
  return <article className={featured ? "giveaway-card giveaway-card-featured" : "giveaway-card"}><div className="relative overflow-hidden rounded-[1.25rem]"><img src={giveaway.image_url || heroImage} alt={giveaway.title ?? "Giveaway prize"} className="aspect-[16/9] w-full object-cover" width={720} height={405} loading="lazy" /><span className="absolute left-4 top-4 rounded-full bg-background/90 px-3 py-1 text-xs font-black uppercase tracking-[0.12em]">{featured ? "Featured" : "Open"}</span></div><div className="pt-5"><div className="flex items-center justify-between gap-3 text-xs font-bold uppercase tracking-[0.1em] text-muted-foreground"><span className="inline-flex items-center gap-1.5"><Clock3 className="size-3.5 text-brand-coral" /> {days} days left</span><span>{giveaway.winner_limit} winner{giveaway.winner_limit === 1 ? "" : "s"}</span></div><h3 className="mt-3 text-2xl font-black tracking-tight">{giveaway.title}</h3><p className="mt-2 line-clamp-2 text-sm leading-6 text-muted-foreground">{giveaway.description}</p><div className="mt-5 flex items-center justify-between gap-4"><span className="inline-flex items-center gap-2 text-sm font-bold text-muted-foreground"><Users className="size-4 text-brand-teal" /> {giveaway.participant_count ?? 0} joined</span><Button asChild><Link to="/giveaways/$id" params={{ id: giveaway.id ?? "" }}>Enter now <ArrowUpRight /></Link></Button></div></div></article>;
}

function WinnerPreview({ giveaway, winners }: { giveaway: Giveaway; winners: Winner[] }) {
  return <article className="winner-preview"><div><p className="section-kicker">{new Date(giveaway.end_date ?? Date.now()).toLocaleDateString("en-IN", { month: "long", year: "numeric" })}</p><h3 className="mt-2 text-xl font-black">{giveaway.title}</h3></div><div className="mt-5 space-y-2">{winners.slice(0, 3).map((winner) => <div key={`${winner.giveaway_id}-${winner.rank}`} className="flex items-center gap-3 rounded-xl bg-background/70 px-3 py-2"><span className="rank-mini">{winner.rank}</span><span className="min-w-0 flex-1 truncate text-sm font-bold">{winner.full_name}</span><span className="text-xs text-muted-foreground">{winner.instagram_username}</span></div>)}{winners.length === 0 && <p className="text-sm text-muted-foreground">Leaderboard coming soon.</p>}</div></article>;
}

function IntroSplash({ onDone }: { onDone: () => void }) {
  useEffect(() => { const timer = window.setTimeout(onDone, 2600); return () => window.clearTimeout(timer); }, [onDone]);
  return <div className="intro-splash" role="dialog" aria-label="Telugu Toon World introduction"><div className="intro-spark intro-spark-one" /><div className="intro-spark intro-spark-two" /><div className="intro-logo"><span className="intro-mark">TT</span><p>Telugu Toon World</p><small>Giveaways</small></div><Button variant="outline" className="intro-skip" onClick={onDone}>Skip intro</Button></div>;
}
