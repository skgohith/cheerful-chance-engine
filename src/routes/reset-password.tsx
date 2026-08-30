import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, CheckCircle2, KeyRound, Save } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/reset-password")({
  head: () => ({ meta: [
    { title: "Reset Admin Password | Telugu Toon World" },
    { name: "description", content: "Set a new password for the Telugu Toon World admin studio." },
    { property: "og:title", content: "Reset Admin Password | Telugu Toon World" },
    { property: "og:description", content: "Set a new password for the Telugu Toon World admin studio." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: ResetPassword,
});

function ResetPassword() {
  const navigate = useNavigate();
  const [recoveryReady, setRecoveryReady] = useState<boolean | null>(null);
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [complete, setComplete] = useState(false);

  useEffect(() => {
    let active = true;
    const searchParams = new URLSearchParams(window.location.search);
    const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    const recoveryType = searchParams.get("type") ?? hashParams.get("type");
    const errorDescription = searchParams.get("error_description") ?? hashParams.get("error_description");
    const authorizedEmail = "germanbro40@gmail.com";

    function isAuthorizedUser(email: string | undefined) {
      return email?.toLowerCase() === authorizedEmail;
    }

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (active && (event === "PASSWORD_RECOVERY" || session) && isAuthorizedUser(session?.user.email)) {
        setRecoveryReady(true);
      }
    });

    async function initializeRecovery() {
      if (errorDescription) {
        if (active) {
          setMessage(decodeURIComponent(errorDescription.replaceAll("+", " ")));
          setRecoveryReady(false);
        }
        return;
      }

      const code = searchParams.get("code");
      const tokenHash = searchParams.get("token_hash");
      const accessToken = hashParams.get("access_token");
      const refreshToken = hashParams.get("refresh_token");
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        const { data } = await supabase.auth.getSession();
        if (active) {
          if (error || !isAuthorizedUser(data.session?.user.email)) {
            setMessage("This reset link is invalid, expired, or not for the authorized admin account. Request a new one from the admin sign-in page.");
            setRecoveryReady(false);
          } else {
            setRecoveryReady(true);
          }
        }
        return;
      }

      if (accessToken && refreshToken && recoveryType === "recovery") {
        const { data, error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
        if (active) {
          if (error || !isAuthorizedUser(data.session?.user.email)) {
            setMessage("This reset link is invalid, expired, or not for the authorized admin account. Request a new one from the admin sign-in page.");
            setRecoveryReady(false);
          } else {
            window.history.replaceState({}, document.title, "/reset-password?type=recovery");
            setRecoveryReady(true);
          }
        }
        return;
      }

      if (tokenHash && recoveryType === "recovery") {
        const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: "recovery" });
        const { data } = await supabase.auth.getSession();
        if (active) {
          if (error || !isAuthorizedUser(data.session?.user.email)) {
            setMessage("This reset link is invalid, expired, or not for the authorized admin account. Request a new one from the admin sign-in page.");
            setRecoveryReady(false);
          } else {
            setRecoveryReady(true);
          }
        }
        return;
      }

      if (recoveryType !== "recovery") {
        if (active) setRecoveryReady(false);
        return;
      }

      const { data } = await supabase.auth.getSession();
      if (active) {
        if (isAuthorizedUser(data.session?.user.email)) {
          setRecoveryReady(true);
        } else {
          setMessage("This reset link is missing, expired, or already used. Request a new one from the admin sign-in page.");
          setRecoveryReady(false);
        }
      }
    }

    void initializeRecovery();

    return () => { active = false; authListener.subscription.unsubscribe(); };
  }, []);

  async function updatePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setMessage(null);
    if (password.length < 8) { setMessage("Choose a password with at least 8 characters."); return; }
    if (password !== confirmation) { setMessage("The passwords do not match."); return; }
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) setMessage(error.message);
    else {
      await supabase.auth.signOut();
      setComplete(true);
      setRecoveryReady(false);
      setPassword("");
      setConfirmation("");
    }
    setBusy(false);
  }

  return <main className="site-shell flex min-h-screen items-center justify-center px-5"><div className="auth-panel w-full max-w-xl"><a href="/" className="brand-lockup"><span className="brand-mark">TT</span><span>Telugu Toon World</span></a><div className="mt-10"><div className="eyebrow"><KeyRound className="size-4" /> Account recovery</div><h1 className="mt-4 text-3xl font-black tracking-tight">{complete ? "Password updated." : "Choose a new password."}</h1><p className="mt-3 text-sm leading-6 text-muted-foreground">{complete ? "Your new password is ready. Sign in to continue to the private admin studio." : "Set a new password for the private admin studio, then continue to sign in."}</p></div>{complete && <div className="mt-7"><p className="status-success flex items-center gap-2"><CheckCircle2 className="size-4" /> Your password was changed successfully.</p><Button type="button" className="mt-5 w-full" size="lg" onClick={() => void navigate({ to: "/admin" })}><ArrowLeft /> Continue to admin sign in</Button></div>}{!complete && recoveryReady === null && <p className="mt-6 text-sm text-muted-foreground">Checking your secure reset link…</p>}{!complete && recoveryReady === false && <div className="mt-6"><p className="status-error">{message ?? "This reset link is missing, expired, or already used. Request a new one from the admin sign-in page."}</p><Button type="button" variant="outline" className="mt-5" onClick={() => void navigate({ to: "/admin" })}><ArrowLeft /> Back to admin sign in</Button></div>}{!complete && recoveryReady && <><form className="mt-7 space-y-4" onSubmit={updatePassword}><label className="field-label">New password<Input required minLength={8} type="password" autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} /></label><label className="field-label">Confirm new password<Input required minLength={8} type="password" autoComplete="new-password" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} /></label>{message && <p className="status-error">{message}</p>}<Button className="w-full" size="lg" disabled={busy}>{busy ? "Saving…" : <><Save /> Save new password</>}</Button></form><p className="mt-6 text-center text-xs text-muted-foreground">Your reset session is temporary and can only be used to set this password.</p></>}</div></main>;
}