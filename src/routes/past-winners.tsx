import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, Crown, Medal, Trophy } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { listPublicGiveaways, listPublicWinners } from "@/lib/giveaway.functions";

export const Route = createFileRoute("/past-winners")({
  head: () => ({ meta: [
    { title: "Past Winners | Telugu Toon World" },
    { name: "description", content: "See the ranked giveaway winners from Telugu Toon World." },
    { property: "og:title", content: "Past Winners | Telugu Toon World" },
    { property: "og:description", content: "Celebrate the winners from Telugu Toon World giveaways." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: PastWinners,
});

function PastWinners() {
  const loadGiveaways = useServerFn(listPublicGiveaways);
  const loadWinners = useServerFn(listPublicWinners);
  const [giveaways, setGiveaways] = useState<Awaited<ReturnType<typeof listPublicGiveaways>>>([]);
  const [winners, setWinners] = useState<Awaited<ReturnType<typeof listPublicWinners>>>([]);

  useEffect(() => { void Promise.all([loadGiveaways(), loadWinners({ data: {} })]).then(([giveawayRows, winnerRows]) => { setGiveaways(giveawayRows); setWinners(winnerRows); }); }, [loadGiveaways, loadWinners]);
  const completed = useMemo(() => {
    const existing = giveaways.filter((giveaway) => giveaway.status !== "active");
    const knownIds = new Set(existing.map((giveaway) => giveaway.id));
    const deletedSnapshots = winners
      .filter((winner) => winner.giveaway_id && !knownIds.has(winner.giveaway_id))
      .reduce<Awaited<ReturnType<typeof listPublicGiveaways>>>((rows, winner) => {
        if (!winner.giveaway_id || rows.some((row) => row.id === winner.giveaway_id)) return rows;
        rows.push({
          id: winner.giveaway_id,
          title: winner.giveaway_title ?? "Past giveaway",
          description: "",
          image_url: null,
          start_date: null,
          end_date: winner.selected_at,
          winner_limit: null,
          status: "completed",
          created_at: winner.selected_at,
          participant_count: null,
          instagram_url: null,
          telegram_url: null,
          youtube_url: null,
          facebook_url: null,
        });
        return rows;
      }, []);
    return [...existing, ...deletedSnapshots];
  }, [giveaways, winners]);

  return <main className="site-shell min-h-screen pb-20"><header className="site-header mx-auto flex max-w-6xl items-center justify-between px-5 py-5 lg:px-8"><Link to="/" className="brand-lockup"><span className="brand-mark">TT</span><span>Telugu Toon World</span></Link><Link to="/" className="inline-flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-foreground"><ArrowLeft className="size-4" /> Home</Link></header><section className="mx-auto max-w-6xl px-5 pb-8 pt-12 lg:px-8 lg:pt-20"><div className="eyebrow"><span className="eyebrow-dot" /> Hall of fame</div><h1 className="display-title mt-5 max-w-3xl">The Toon World <span className="text-brand-coral">winners</span></h1><p className="mt-5 max-w-xl text-lg leading-8 text-muted-foreground">Every winner, every rank, permanently celebrated. Thanks for making each giveaway a little more magical.</p></section><section className="mx-auto max-w-6xl space-y-8 px-5 lg:px-8">{completed.length === 0 ? <div className="empty-state"><Trophy className="mx-auto size-10 text-brand-yellow" /><h2 className="mt-4 text-xl font-black">The trophy shelf is waiting</h2><p className="mt-2 text-muted-foreground">Past winners will appear here after the first draw.</p></div> : completed.map((giveaway) => { const rows = winners.filter((winner) => winner.giveaway_id === giveaway.id); return <article key={giveaway.id} className="winner-section"><div className="flex flex-wrap items-end justify-between gap-4"><div><p className="section-kicker">Completed giveaway</p><h2 className="mt-2 text-2xl font-black tracking-tight">{giveaway.title}</h2></div><span className="rounded-full bg-brand-yellow/20 px-3 py-1 text-xs font-black uppercase tracking-[0.12em] text-foreground">{rows.length} winners</span></div><div className="mt-5 space-y-3">{rows.map((winner) => <WinnerRow key={`${winner.giveaway_id}-${winner.rank}`} rank={winner.rank ?? 0} name={winner.full_name ?? "Winner"} username={winner.instagram_username ?? ""} link={winner.instagram_link ?? "#"} />)}{rows.length === 0 && <p className="rounded-2xl border border-dashed border-border p-5 text-sm text-muted-foreground">Winner details are being updated.</p>}</div></article>; })}</section></main>;
}

function WinnerRow({ rank, name, username, link }: { rank: number; name: string; username: string; link: string }) {
  const first = rank === 1;
  return <div className={first ? "winner-row winner-row-first" : "winner-row"}><div className={first ? "rank-badge rank-gold" : "rank-badge"}>{first ? <Crown className="size-5" /> : <Medal className="size-4" />}<span>{rank}</span></div><div className="min-w-0 flex-1"><p className="truncate font-black">{name}</p><a className="truncate text-sm text-muted-foreground hover:text-brand-coral" href={link} target="_blank" rel="noreferrer">{username}</a></div>{first && <Trophy className="size-6 shrink-0 text-brand-yellow" />}</div>;
}