import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import {
  ArrowLeft,
  Check,
  Download,
  ExternalLink,
  KeyRound,
  LockKeyhole,
  LogIn,
  LogOut,
  Mail,
  Pencil,
  Plus,
  RefreshCw,
  ShieldCheck,
  Trash2,
  Trophy,
  Users,
  WandSparkles,
} from "lucide-react";
import { useEffect, useState, type FormEvent, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import {
  adminClearData,
  adminDeleteGiveaway,
  adminListGiveaways,
  adminListParticipants,
  adminListWinners,
  adminPickWinners,
  adminSaveGiveaway,
  adminUpdateParticipantInstagramLink,
} from "@/lib/giveaway.functions";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin Studio | Telugu Toon World" },
      { name: "description", content: "Manage Telugu Toon World giveaways, entries, and winner draws." },
      { property: "og:title", content: "Admin Studio | Telugu Toon World" },
      { property: "og:description", content: "Manage giveaways and fair winner draws." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminStudio,
});

type Giveaway = Awaited<ReturnType<typeof adminListGiveaways>>[number];
type Participant = Awaited<ReturnType<typeof adminListParticipants>>[number];
type Winner = Awaited<ReturnType<typeof adminListWinners>>[number];

const blankForm = {
  title: "",
  description: "",
  imageUrl: "",
  instagramUrl: "",
  telegramUrl: "",
  youtubeUrl: "",
  facebookUrl: "",
  startDate: "",
  endDate: "",
  winnerLimit: "1",
};

function toDateTimeLocal(value: string | Date) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const timezoneOffset = date.getTimezoneOffset();
  return new Date(date.getTime() - timezoneOffset * 60_000).toISOString().slice(0, 16);
}

function isHttpUrl(value: string) {
  if (!value.trim()) return true;
  try {
    const parsed = new URL(value.trim());
    return (parsed.protocol === "http:" || parsed.protocol === "https:") && Boolean(parsed.hostname);
  } catch {
    return false;
  }
}

function adminError(error: unknown, fallback: string) {
  const message = error instanceof Error ? error.message : "";
  if (message.toLowerCase().includes("invalid url")) {
    return "Use a complete link beginning with https:// (for example, https://instagram.com/your-page).";
  }
  return message || fallback;
}

function AdminStudio() {
  const loadGiveaways = useServerFn(adminListGiveaways);
  const loadParticipants = useServerFn(adminListParticipants);
  const loadWinners = useServerFn(adminListWinners);
  const saveGiveaway = useServerFn(adminSaveGiveaway);
  const updateParticipantInstagramLink = useServerFn(adminUpdateParticipantInstagramLink);
  const deleteGiveaway = useServerFn(adminDeleteGiveaway);
  const pickWinners = useServerFn(adminPickWinners);
  const clearData = useServerFn(adminClearData);

  const [session, setSession] = useState<{ email: string } | null>(null);
  const [giveaways, setGiveaways] = useState<Giveaway[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [winners, setWinners] = useState<Winner[]>([]);
  const [form, setForm] = useState(blankForm);
  const [editing, setEditing] = useState(false);
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [resetSent, setResetSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [linkDrafts, setLinkDrafts] = useState<Record<string, string>>({});
  const [savingLinkId, setSavingLinkId] = useState<string | null>(null);

  async function refreshGiveaways() {
    try {
      setGiveaways(await loadGiveaways());
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Admin access required");
    }
  }

  useEffect(() => {
    void supabase.auth.getUser().then(({ data }) => {
      setSession(
        data.user?.email?.toLowerCase() === "germanbro40@gmail.com"
          ? { email: data.user.email ?? "" }
          : null,
      );
    });
  }, []);

  useEffect(() => {
    if (session) void refreshGiveaways();
  }, [session]);

  useEffect(() => {
    if (!selectedId) return;
    void Promise.all([
      loadParticipants({ data: { giveawayId: selectedId } }),
      loadWinners({ data: { giveawayId: selectedId } }),
    ]).then(([rows, winnerRows]) => {
      setParticipants(rows);
      setLinkDrafts(Object.fromEntries(rows.map((row) => [row.id, row.instagram_link])));
      setWinners(winnerRows);
    });
  }, [selectedId, loadParticipants, loadWinners]);

  async function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage(null);
    if (loginForm.email.trim().toLowerCase() !== "germanbro40@gmail.com") {
      setMessage("This account is not authorized for the admin studio.");
      setBusy(false);
      return;
    }
    const { data, error } = await supabase.auth.signInWithPassword(loginForm);
    if (error || !data.user) setMessage(error?.message ?? "Unable to sign in");
    else setSession({ email: data.user.email ?? "" });
    setBusy(false);
  }

  async function sendPasswordReset(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage(null);
    setResetSent(false);
    const email = loginForm.email.trim().toLowerCase();
    if (email !== "germanbro40@gmail.com") {
      setMessage("Enter the authorized admin email to receive a reset link.");
      setBusy(false);
      return;
    }
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) setMessage(error.message);
    else setResetSent(true);
    setBusy(false);
  }

  async function signOut() {
    await supabase.auth.signOut();
    setSession(null);
    setGiveaways([]);
    setSelectedId(null);
  }

  function startCreate() {
    setForm({
      ...blankForm,
      startDate: toDateTimeLocal(new Date()),
      endDate: toDateTimeLocal(new Date(Date.now() + 7 * 86400000)),
    });
    setEditing(true);
  }

  function startEdit(giveaway: Giveaway) {
    setSelectedId(giveaway.id ?? null);
    setForm({
      title: giveaway.title ?? "",
      description: giveaway.description ?? "",
      imageUrl: giveaway.image_url ?? "",
      instagramUrl: giveaway.instagram_url ?? "",
      telegramUrl: giveaway.telegram_url ?? "",
      youtubeUrl: giveaway.youtube_url ?? "",
      facebookUrl: giveaway.facebook_url ?? "",
      startDate: toDateTimeLocal(giveaway.start_date ?? ""),
      endDate: toDateTimeLocal(giveaway.end_date ?? ""),
      winnerLimit: String(giveaway.winner_limit ?? 1),
    });
    setEditing(true);
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage(null);
    try {
      const linkFields = [
        ["Image URL", form.imageUrl],
        ["Instagram link", form.instagramUrl],
        ["Telegram link", form.telegramUrl],
        ["YouTube link", form.youtubeUrl],
        ["Facebook link", form.facebookUrl],
      ] as const;
      const invalidLink = linkFields.find(([, value]) => !isHttpUrl(value));
      if (invalidLink) {
        setMessage(`${invalidLink[0]} must be a complete HTTP or HTTPS link.`);
        return;
      }
      const startDate = new Date(form.startDate);
      const endDate = new Date(form.endDate);
      if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
        setMessage("Enter valid start and end dates.");
        return;
      }
      if (endDate <= startDate) {
        setMessage("The end date must be after the start date.");
        return;
      }
      await saveGiveaway({
        data: {
          ...(selectedId ? { id: selectedId } : {}),
          ...form,
          imageUrl: form.imageUrl.trim(),
          instagramUrl: form.instagramUrl.trim(),
          telegramUrl: form.telegramUrl.trim(),
          youtubeUrl: form.youtubeUrl.trim(),
          facebookUrl: form.facebookUrl.trim(),
          winnerLimit: Number(form.winnerLimit),
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        },
      });
      setEditing(false);
      setSelectedId(null);
      setForm(blankForm);
      await refreshGiveaways();
      setMessage("Giveaway saved.");
    } catch (error) {
      setMessage(adminError(error, "Unable to save giveaway"));
    } finally {
      setBusy(false);
    }
  }

  async function draw(id: string) {
    if (!window.confirm("Pick winners now? This permanently snapshots the result.")) return;
    setBusy(true);
    try {
      await pickWinners({ data: { giveawayId: id } });
      setSelectedId(id);
      await refreshGiveaways();
      setMessage("Winners picked and saved to the hall of fame.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to pick winners");
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    if (!window.confirm("Delete this giveaway and its entries? Any selected winners will be preserved in the hall of fame.")) return;
    setBusy(true);
    setMessage(null);
    try {
      await deleteGiveaway({ data: { giveawayId: id } });
      if (selectedId === id) {
        setSelectedId(null);
        setParticipants([]);
        setWinners([]);
      }
      await refreshGiveaways();
       setMessage("Giveaway deleted. Winner snapshots were preserved.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to delete giveaway");
    } finally {
      setBusy(false);
    }
  }

  async function clearEntries(id: string) {
    if (!window.confirm("Clear participant data? Winner snapshots will remain.")) return;
    setBusy(true);
    try {
      await clearData({ data: { giveawayId: id } });
      setSelectedId(id);
      await refreshGiveaways();
      setParticipants([]);
      setMessage("Participant data cleared. Winner snapshots remain safe.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to clear entries");
    } finally {
      setBusy(false);
    }
  }

  async function saveParticipantInstagramLink(participant: Participant) {
    const instagramLink = linkDrafts[participant.id] ?? "";
    if (!selectedId) return;
    setSavingLinkId(participant.id);
    setMessage(null);
    try {
      const updated = await updateParticipantInstagramLink({
        data: {
          participantId: participant.id,
          giveawayId: selectedId,
          instagramLink,
        },
      });
      setParticipants((current) => current.map((row) => (row.id === updated.id ? updated : row)));
      setLinkDrafts((current) => ({ ...current, [updated.id]: updated.instagram_link }));
      setMessage("Instagram link updated.");
    } catch (error) {
      setMessage(adminError(error, "Unable to update Instagram link"));
    } finally {
      setSavingLinkId(null);
    }
  }

  function exportCsv() {
    const header = "Name,Instagram,Instagram link,Email,Phone,Joined\n";
    const body = participants
      .map((row) =>
        [row.full_name, row.instagram_username, row.instagram_link, row.email ?? "", row.phone ?? "", row.created_at]
          .map((value) => `"${String(value ?? "").replaceAll('"', '""')}"`)
          .join(","),
      )
      .join("\n");
    const url = URL.createObjectURL(new Blob([header + body], { type: "text/csv" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "giveaway-participants.csv";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  if (!session) {
    return (
      <main className="site-shell flex min-h-screen items-center justify-center px-5">
        <div className="auth-panel">
          <Link to="/" className="brand-lockup">
            <span className="brand-mark">TT</span>
            <span>Telugu Toon World</span>
          </Link>
          {showPasswordReset ? (
            <>
              <div className="mt-10">
                <div className="eyebrow"><KeyRound className="size-4" /> Account recovery</div>
                <h1 className="mt-4 text-3xl font-black tracking-tight">Reset your password.</h1>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">We’ll email a secure reset link to the authorized admin account.</p>
              </div>
              {message && <p className="status-error mt-6">{message}</p>}
              {resetSent && <p className="status-success mt-6">If the email is registered, a reset link is on its way. Check your inbox.</p>}
              <form className="mt-7 space-y-4" onSubmit={sendPasswordReset}>
                <label className="field-label">Admin email<Input required type="email" autoComplete="email" value={loginForm.email} onChange={(event) => setLoginForm({ ...loginForm, email: event.target.value })} /></label>
                <Button className="w-full" size="lg" disabled={busy}>{busy ? "Sending…" : <><Mail /> Send reset link</>}</Button>
              </form>
              <Button type="button" variant="ghost" className="mt-4 w-full" onClick={() => { setShowPasswordReset(false); setMessage(null); setResetSent(false); }}><ArrowLeft /> Back to sign in</Button>
            </>
          ) : (
            <>
              <div className="mt-10">
                <div className="eyebrow"><ShieldCheck className="size-4" /> Private studio</div>
                <h1 className="mt-4 text-3xl font-black tracking-tight">Welcome back.</h1>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">Sign in with the authorized admin account to post today’s giveaway, manage entries, and draw winners.</p>
              </div>
              {message && <p className="status-error mt-6">{message}</p>}
              <form className="mt-7 space-y-4" onSubmit={signIn}>
                <label className="field-label">Admin email<Input required type="email" autoComplete="username" value={loginForm.email} onChange={(event) => setLoginForm({ ...loginForm, email: event.target.value })} /></label>
                <label className="field-label">Password<Input required type="password" autoComplete="current-password" value={loginForm.password} onChange={(event) => setLoginForm({ ...loginForm, password: event.target.value })} /></label>
                <Button className="w-full" size="lg" disabled={busy}>{busy ? "Signing in…" : <><LogIn /> Sign in</>}</Button>
              </form>
              <Button type="button" variant="link" className="mt-4 w-full" onClick={() => { setShowPasswordReset(true); setMessage(null); }}>Forgot admin password?</Button>
              <p className="mt-2 text-center text-xs text-muted-foreground">This private studio is limited to the authorized admin account. New admin signups are disabled.</p>
            </>
          )}
        </div>
      </main>
    );
  }

  const selected = giveaways.find((giveaway) => giveaway.id === selectedId);

  return (
    <main className="site-shell min-h-screen pb-16">
      <header className="site-header mx-auto flex max-w-7xl items-center justify-between px-5 py-5 lg:px-8">
        <Link to="/" className="brand-lockup"><span className="brand-mark">TT</span><span>Telugu Toon World <span className="admin-tag">Studio</span></span></Link>
        <div className="flex items-center gap-3"><span className="hidden text-sm text-muted-foreground sm:inline">{session.email}</span><Button variant="outline" size="sm" onClick={() => void signOut()}><LogOut /> Sign out</Button></div>
      </header>

      <div className="mx-auto max-w-7xl px-5 pt-10 lg:px-8 lg:pt-16">
        <div className="flex flex-wrap items-end justify-between gap-5">
          <div><div className="eyebrow"><ShieldCheck className="size-4" /> Admin studio</div><h1 className="section-title mt-4">Make the magic happen.</h1><p className="mt-3 text-muted-foreground">Post today’s giveaway, watch entries roll in, and lock in fair winners.</p></div>
          <Button onClick={startCreate}><Plus /> Post giveaway</Button>
        </div>
        {message && <p className="status-success mt-6">{message}</p>}

        {editing && (
          <form className="admin-form mt-8" onSubmit={save}>
            <div className="flex items-center justify-between"><div><p className="section-kicker">Giveaway details</p><h2 className="mt-1 text-xl font-black">{selectedId ? "Edit giveaway" : "Post a giveaway"}</h2></div><Button type="button" variant="ghost" onClick={() => setEditing(false)}>Cancel</Button></div>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <label className="field-label">Title<Input required minLength={3} maxLength={160} value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} /></label>
              <label className="field-label">Image URL <span className="optional-mark">Optional</span><Input type="url" maxLength={500} value={form.imageUrl} onChange={(event) => setForm({ ...form, imageUrl: event.target.value })} placeholder="https://…" /></label>
              <label className="field-label md:col-span-2">Description<Textarea required maxLength={1000} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} /></label>
               <div className="md:col-span-2"><p className="section-kicker">Community links</p><p className="mt-1 text-sm text-muted-foreground">Add the official channels participants should visit for this giveaway.</p></div>
               <label className="field-label">Instagram <span className="optional-mark">Optional</span><Input type="url" maxLength={500} value={form.instagramUrl} onChange={(event) => setForm({ ...form, instagramUrl: event.target.value })} placeholder="https://instagram.com/…" /></label>
               <label className="field-label">Telegram <span className="optional-mark">Optional</span><Input type="url" maxLength={500} value={form.telegramUrl} onChange={(event) => setForm({ ...form, telegramUrl: event.target.value })} placeholder="https://t.me/…" /></label>
               <label className="field-label">YouTube <span className="optional-mark">Optional</span><Input type="url" maxLength={500} value={form.youtubeUrl} onChange={(event) => setForm({ ...form, youtubeUrl: event.target.value })} placeholder="https://youtube.com/…" /></label>
               <label className="field-label">Facebook <span className="optional-mark">Optional</span><Input type="url" maxLength={500} value={form.facebookUrl} onChange={(event) => setForm({ ...form, facebookUrl: event.target.value })} placeholder="https://facebook.com/…" /></label>
              <label className="field-label">Starts<Input required type="datetime-local" value={form.startDate} onChange={(event) => setForm({ ...form, startDate: event.target.value })} /></label>
              <label className="field-label">Ends<Input required type="datetime-local" value={form.endDate} onChange={(event) => setForm({ ...form, endDate: event.target.value })} /></label>
              <label className="field-label">Winner spots (1–10)<Input required type="number" min={1} max={10} value={form.winnerLimit} onChange={(event) => setForm({ ...form, winnerLimit: event.target.value })} /></label>
            </div>
            <Button type="submit" className="mt-6" disabled={busy}>{busy ? "Saving…" : "Post giveaway"}</Button>
          </form>
        )}

        <div className="mt-10 grid gap-8 lg:grid-cols-[.9fr_1.1fr]">
          <section>
            <div className="mb-4 flex items-center justify-between"><h2 className="text-lg font-black">Your giveaways</h2><Button variant="ghost" size="icon" onClick={() => void refreshGiveaways()} aria-label="Refresh giveaways"><RefreshCw /></Button></div>
            <div className="space-y-3">
              {giveaways.length === 0 && <div className="empty-state"><WandSparkles className="mx-auto size-8 text-brand-yellow" /><p className="mt-3 text-sm text-muted-foreground">Create your first giveaway.</p></div>}
               {giveaways.map((giveaway) => {
                 const locked = giveaway.status === "completed" || giveaway.status === "data_cleared";
                 return <div key={giveaway.id} className={selectedId === giveaway.id ? "admin-list-item admin-list-item-selected" : "admin-list-item"}><button type="button" onClick={() => setSelectedId(giveaway.id ?? null)} className="min-w-0 flex-1 text-left"><strong className="block truncate">{giveaway.title}</strong><small>{giveaway.status} · select to view entries</small></button><span className="flex shrink-0 gap-1">{!locked && <Button type="button" variant="ghost" size="icon" className="icon-action" onClick={() => startEdit(giveaway)} aria-label={`Edit ${giveaway.title}`} title="Edit"><Pencil /></Button>}{locked && <span className="inline-flex items-center px-2 text-xs font-bold text-muted-foreground" title="Editing is disabled after winners are selected"><LockKeyhole className="mr-1 size-3.5" /> Locked</span>}<Button type="button" variant="ghost" size="icon" className="icon-action icon-action-danger" onClick={() => void remove(giveaway.id ?? "")} aria-label={`Delete ${giveaway.title}`} title="Delete giveaway"><Trash2 /></Button></span></div>;
              })}
            </div>
          </section>

          <section>
            {selected ? <div className="admin-detail">
              <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="section-kicker">Selected giveaway</p><h2 className="mt-2 text-2xl font-black">{selected.title}</h2><p className="mt-1 text-sm text-muted-foreground">{selected.description}</p></div><div className="flex flex-wrap gap-2">{selected.status === "active" && <Button onClick={() => void draw(selected.id ?? "")} disabled={busy}><Trophy /> Pick winners</Button>}{selected.status === "completed" && <Button variant="outline" onClick={() => void clearEntries(selected.id ?? "")} disabled={busy}><Trash2 /> Clear entries</Button>}</div></div>
              <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-3"><Stat icon={<Users />} label="Entries" value={String(participants.length)} /><Stat icon={<Trophy />} label="Winner spots" value={String(selected.winner_limit)} /><Stat icon={<ShieldCheck />} label="Status" value={selected.status ?? "active"} /></div>
              <div className="mt-8">
                <div className="flex flex-wrap items-center justify-between gap-3"><div><h3 className="font-black">Participants ({participants.length})</h3><p className="mt-1 text-sm text-muted-foreground">Correct an entrant’s Instagram profile link when needed.</p></div><Button variant="outline" size="sm" onClick={exportCsv} disabled={participants.length === 0}><Download /> Export CSV</Button></div>
                <div className="mt-4 overflow-x-auto"><table className="data-table"><thead><tr><th>Name</th><th>Instagram</th><th>Instagram link</th><th>Joined</th></tr></thead><tbody>
                   {participants.map((participant) => { const draft = linkDrafts[participant.id] ?? participant.instagram_link; const isSaving = savingLinkId === participant.id; const validDraft = isHttpUrl(draft); return <tr key={participant.id}><td>{participant.full_name}</td><td>{participant.instagram_username}</td><td><div className="flex min-w-[20rem] items-center gap-2"><Input aria-label={`Instagram link for ${participant.full_name}`} type="url" value={draft} onChange={(event) => setLinkDrafts((current) => ({ ...current, [participant.id]: event.target.value }))} /><Button type="button" size="icon" variant="outline" aria-label={`Save Instagram link for ${participant.full_name}`} title="Save Instagram link" disabled={isSaving || draft === participant.instagram_link || !validDraft} onClick={() => void saveParticipantInstagramLink(participant)}><Check /></Button>{validDraft && <a className="text-brand-coral" href={draft} target="_blank" rel="noreferrer" aria-label={`Open Instagram link for ${participant.full_name}`} title="Open Instagram link"><ExternalLink className="size-4" /></a>}</div>{draft.trim() && !validDraft && <p className="mt-1 text-xs font-semibold text-destructive">Enter a complete link beginning with https://.</p>}</td><td>{participant.created_at ? new Date(participant.created_at).toLocaleDateString("en-IN") : "—"}</td></tr>; })}
                </tbody></table>{participants.length === 0 && <p className="py-8 text-center text-sm text-muted-foreground">No participants loaded yet.</p>}</div>
              </div>
              {winners.length > 0 && <div className="mt-8"><h3 className="font-black">Winner snapshot</h3><div className="mt-3 space-y-2">{winners.map((winner) => <div className="winner-row" key={winner.id}><span className="rank-badge">{winner.rank}</span><span className="flex-1 font-bold">{winner.full_name}</span><span className="text-sm text-muted-foreground">{winner.instagram_username}</span></div>)}</div></div>}
            </div> : <div className="empty-state h-full"><Users className="mx-auto size-10 text-brand-teal" /><h2 className="mt-4 text-xl font-black">Select a giveaway</h2><p className="mt-2 text-muted-foreground">Choose a giveaway to view entries and manage its draw.</p></div>}
          </section>
        </div>
      </div>
    </main>
  );
}

function Stat({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return <div className="rounded-2xl border border-border bg-background px-4 py-3"><div className="flex items-center gap-2 text-brand-coral">{icon}<span className="text-xs font-bold uppercase tracking-[0.1em] text-muted-foreground">{label}</span></div><p className="mt-1 font-black capitalize">{value}</p></div>;
}