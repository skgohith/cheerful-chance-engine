import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, CheckCircle2, Clock3, Facebook, Instagram, MessageCircle, Send, Users, Youtube } from "lucide-react";
import { useEffect, useMemo, useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getPublicGiveaway, submitGiveawayEntry } from "@/lib/giveaway.functions";

export const Route = createFileRoute("/giveaways/$id")({
  head: () => ({
    meta: [
      { title: "Enter a Telugu Toon World Giveaway" },
      { name: "description", content: "Join a Telugu Toon World giveaway and get a chance to win fun prizes." },
      { property: "og:title", content: "Enter a Telugu Toon World Giveaway" },
      { property: "og:description", content: "Join the fun and enter today's Telugu Toon World giveaway." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: GiveawayDetail,
});

type Giveaway = NonNullable<Awaited<ReturnType<typeof getPublicGiveaway>>>;

function GiveawayDetail() {
  const { id } = Route.useParams();
  const loadGiveaway = useServerFn(getPublicGiveaway);
  const submitEntry = useServerFn(submitGiveawayEntry);
  const [giveaway, setGiveaway] = useState<Giveaway | null>(null);
  const [form, setForm] = useState({ fullName: "", instagramUsername: "", instagramLink: "", email: "", phone: "", honeypot: "" });
  const [status, setStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let active = true;
    const load = async () => {
      const result = await loadGiveaway({ data: { id } });
      if (active) setGiveaway(result);
    };
    void load();
    const interval = window.setInterval(() => void load(), 15000);
    return () => { active = false; window.clearInterval(interval); };
  }, [id, loadGiveaway]);

  const startsAt = giveaway ? new Date(giveaway.start_date ?? 0).getTime() : 0;
  const upcoming = Boolean(giveaway && giveaway.status === "active" && startsAt > Date.now());
  const ended = useMemo(() => !giveaway || giveaway.status !== "active" || startsAt > Date.now() || new Date(giveaway.end_date ?? 0).getTime() <= Date.now(), [giveaway, startsAt]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus(null);
    const normalized = form.instagramUsername.trim();
    if (!normalized.startsWith("@")) {
      setStatus({ type: "error", message: "Add an Instagram username beginning with @." });
      return;
    }
    setSubmitting(true);
    try {
      const result = await submitEntry({ data: { giveawayId: id, ...form } });
      if (!result.ok) {
        setStatus({ type: "error", message: result.error });
        return;
      }
      setForm({ fullName: "", instagramUsername: "", instagramLink: "", email: "", phone: "", honeypot: "" });
      setStatus({ type: "success", message: "You're in! Keep an eye on the Telugu Toon World page for the winner announcement." });
      const refreshed = await loadGiveaway({ data: { id } });
      setGiveaway(refreshed);
    } catch {
      setStatus({ type: "error", message: "We couldn't process that entry. Please try again." });
    } finally {
      setSubmitting(false);
    }
  }

  if (!giveaway) return <main className="site-shell flex min-h-screen items-center justify-center px-6"><p className="text-muted-foreground">Loading giveaway…</p></main>;

  const shareText = encodeURIComponent(`Join the ${giveaway.title} giveaway from Telugu Toon World!`);
  const shareUrl = typeof window !== "undefined" ? encodeURIComponent(window.location.href) : "";

  return <main className="site-shell min-h-screen pb-16">
    <header className="site-header mx-auto flex max-w-6xl items-center justify-between px-5 py-5 lg:px-8">
      <Link to="/" className="brand-lockup" aria-label="Telugu Toon World home"><span className="brand-mark">TT</span><span>Telugu Toon World</span></Link>
      <Link to="/" className="inline-flex items-center gap-2 text-sm font-bold text-muted-foreground transition-colors hover:text-foreground"><ArrowLeft className="size-4" /> All giveaways</Link>
    </header>
    <div className="mx-auto grid max-w-6xl gap-8 px-5 pt-8 lg:grid-cols-[1.05fr_.95fr] lg:px-8 lg:pt-14">
      <section>
         <div className="eyebrow"><span className="eyebrow-dot" /> {upcoming ? "Coming soon" : ended ? "Giveaway closed" : "Entries are open"}</div>
        <h1 className="display-title mt-5 max-w-2xl">{giveaway.title}</h1>
        <p className="mt-5 max-w-xl text-lg leading-8 text-muted-foreground">{giveaway.description}</p>
        <div className="mt-8 grid max-w-xl grid-cols-2 gap-3 sm:grid-cols-3">
          <InfoChip icon={<Users className="size-4" />} label="Entries" value={`${giveaway.participant_count ?? 0}`} />
          <InfoChip icon={<Clock3 className="size-4" />} label="Closes" value={new Date(giveaway.end_date ?? Date.now()).toLocaleDateString("en-IN", { day: "numeric", month: "short" })} />
          <InfoChip icon={<CheckCircle2 className="size-4" />} label="Winners" value={`${giveaway.winner_limit ?? 0}`} />
        </div>
        <div className="mt-8 flex flex-wrap gap-3" aria-label="Share giveaway">
          <Button asChild variant="outline"><a href={`https://wa.me/?text=${shareText}%20${shareUrl}`} target="_blank" rel="noreferrer"><MessageCircle /> WhatsApp</a></Button>
           {giveaway.instagram_url && <Button asChild variant="outline"><a href={giveaway.instagram_url} target="_blank" rel="noreferrer"><Instagram /> Instagram</a></Button>}
           {giveaway.telegram_url && <Button asChild variant="outline"><a href={giveaway.telegram_url} target="_blank" rel="noreferrer"><Send /> Telegram</a></Button>}
           {giveaway.youtube_url && <Button asChild variant="outline"><a href={giveaway.youtube_url} target="_blank" rel="noreferrer"><Youtube /> YouTube</a></Button>}
           {giveaway.facebook_url && <Button asChild variant="outline"><a href={giveaway.facebook_url} target="_blank" rel="noreferrer"><Facebook /> Facebook</a></Button>}
          <Button asChild variant="outline"><a href={`https://t.me/share/url?url=${shareUrl}&text=${shareText}`} target="_blank" rel="noreferrer"><Send /> Share</a></Button>
        </div>
        <div className="mt-10 overflow-hidden rounded-[1.75rem] border border-border bg-card shadow-[0_20px_60px_-35px_var(--ring)]">
          <img src={giveaway.image_url || "/favicon.png"} alt={giveaway.title ?? "Giveaway prize"} className="aspect-[16/10] w-full object-cover" width={1440} height={900} />
        </div>
      </section>
      <section className="lg:pt-12">
        <div className="form-panel">
          <div className="flex items-start justify-between gap-4"><div><p className="section-kicker">Free entry</p><h2 className="mt-2 text-2xl font-black tracking-tight">Count me in</h2></div><div className="count-bubble"><span>{giveaway.participant_count ?? 0}</span><small>joined</small></div></div>
          {status && <div className={status.type === "success" ? "status-success" : "status-error"} role="status">{status.message}</div>}
          <form className="mt-7 space-y-4" onSubmit={handleSubmit}>
            <label className="field-label">Full name<Input required maxLength={120} value={form.fullName} onChange={(event) => setForm({ ...form, fullName: event.target.value })} placeholder="Your name" disabled={ended || submitting} /></label>
            <label className="field-label">Instagram username <span className="required-mark">Required</span><Input required maxLength={120} value={form.instagramUsername} onChange={(event) => setForm({ ...form, instagramUsername: event.target.value })} placeholder="@yourusername" disabled={ended || submitting} /></label>
            <label className="field-label">Instagram profile link <span className="required-mark">Required</span><Input required type="url" maxLength={300} value={form.instagramLink} onChange={(event) => setForm({ ...form, instagramLink: event.target.value })} placeholder="https://instagram.com/yourusername" disabled={ended || submitting} /></label>
            <div className="grid gap-4 sm:grid-cols-2"><label className="field-label">Email <span className="optional-mark">Optional</span><Input type="email" maxLength={255} value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} placeholder="you@example.com" disabled={ended || submitting} /></label><label className="field-label">Phone <span className="optional-mark">Optional</span><Input type="tel" maxLength={30} value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} placeholder="+91 98765 43210" disabled={ended || submitting} /></label></div>
            <label className="sr-only">Leave this blank<Input tabIndex={-1} autoComplete="off" value={form.honeypot} onChange={(event) => setForm({ ...form, honeypot: event.target.value })} /></label>
             <Button type="submit" size="lg" className="mt-2 w-full" disabled={ended || submitting}>{upcoming ? "Entries open soon" : ended ? "Entries closed" : submitting ? "Submitting…" : "Enter giveaway"}</Button>
          </form>
          <p className="mt-5 text-xs leading-5 text-muted-foreground">One entry per Instagram account. Entries are checked manually before winners are announced.</p>
        </div>
        <div className="mt-5 border-l-2 border-brand-yellow pl-4 text-sm leading-6 text-muted-foreground"><strong className="text-foreground">How to enter:</strong> follow Telugu Toon World on Instagram, submit the form, and keep your profile public until the draw.</div>
      </section>
    </div>
  </main>;
}

function InfoChip({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return <div className="rounded-2xl border border-border bg-card px-4 py-3"><div className="flex items-center gap-2 text-brand-coral">{icon}<span className="text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">{label}</span></div><p className="mt-1 text-base font-black">{value}</p></div>;
}