import { useEffect, useState, type FormEvent } from 'react';
import { LogIn, LogOut, UserRound, X } from 'lucide-react';
import type { Session } from '@supabase/supabase-js';
import { isSupabaseConfigured, supabase } from '../lib/supabaseClient';

export default function AccountPanel() {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [profileBusy, setProfileBusy] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [busy, setBusy] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = window.setInterval(() => setCooldown(seconds => Math.max(0, seconds - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [cooldown > 0]);

  useEffect(() => {
    if (!supabase) return;
    let alive = true;
    supabase.auth.getSession().then(({ data }) => { if (alive) setSession(data.session); });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, next) => setSession(next));
    return () => { alive = false; listener.subscription.unsubscribe(); };
  }, []);

  useEffect(() => {
    if (!supabase || !session?.user.id) { setDisplayName(''); return; }
    let active = true;
    supabase.from('profiles').select('display_name').eq('id', session.user.id).maybeSingle()
      .then(({ data }) => {
        if (active && data?.display_name) setDisplayName(data.display_name);
        else if (active) setDisplayName(session.user.email?.split('@')[0] ?? '');
      });
    return () => { active = false; };
  }, [session?.user.id]);

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase || !session?.user.id) return;
    setProfileBusy(true); setError(''); setMessage('');
    try {
      const { error: saveError } = await supabase.from('profiles')
        .update({ display_name: displayName.trim() })
        .eq('id', session.user.id);
      if (saveError) throw saveError;
      setMessage('Profile saved.');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not save your profile.');
    } finally { setProfileBusy(false); }
  }

  async function sendLink(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase || busy || cooldown > 0) return;
    setBusy(true); setError(''); setMessage('');
    try {
      const { error: authError } = await supabase.auth.signInWithOtp({
        email: email.trim(), options: { emailRedirectTo: window.location.origin },
      });
      if (authError) throw authError;
      setMessage('Magic link sent. Check your inbox and spam folder. For your security, wait a minute before requesting another link.');
      setCooldown(60);
    } catch (cause) {
      const details = cause instanceof Error ? cause.message : 'Could not send the sign-in link.';
      if (/rate.?limit|rate exceeded|too many requests|email rate/i.test(details)) {
        setCooldown(60);
        setError('Supabase has temporarily limited sign-in emails. Please wait a few minutes, then try once. Repeated requests can extend the limit.');
      } else {
        setError(details);
      }
    } finally { setBusy(false); }
  }

  async function signOut() {
    if (!supabase) return;
    setBusy(true); setError('');
    try {
      const { error: authError } = await supabase.auth.signOut();
      if (authError) throw authError;
      setMessage('You are signed out.');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not sign out.');
    } finally { setBusy(false); }
  }

  return <>
    <button className="account-trigger" type="button" onClick={() => setOpen(true)}>
      <UserRound size={16}/><span>{session?.user.email ? 'Account' : 'Sign in'}</span>
    </button>
    {open && <div className="overlay account-overlay" onClick={event => { if (event.target === event.currentTarget) setOpen(false); }}>
      <section className="modal account-modal" role="dialog" aria-modal="true" aria-labelledby="account-title">
        <button className="close" type="button" aria-label="Close account panel" onClick={() => setOpen(false)}><X size={17}/></button>
        <span className="eyebrow">RIPS LAB / ACCOUNT</span>
        <h2 id="account-title">{session?.user.email ? 'You’re signed in.' : 'Your Rips, across devices.'}</h2>
        {!isSupabaseConfigured ? <>
          <p>Cloud accounts are ready to connect, but this deployment needs Supabase project settings first.</p>
          <div className="notice account-notice"><b>Setup required</b><p>Add <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_PUBLISHABLE_KEY</code> to the deployment environment, then apply the migration in <code>supabase/migrations</code>.</p></div>
        </> : session?.user.email ? <>
          <p className="account-email">{session.user.email}</p>
          <form className="account-form" onSubmit={saveProfile}>
            <label htmlFor="account-display-name">Display name</label>
            <input id="account-display-name" maxLength={40} value={displayName} onChange={event => setDisplayName(event.target.value)} placeholder="Your display name" required/>
            <button className="primary wide" type="submit" disabled={profileBusy}><UserRound size={16}/>{profileBusy ? 'Saving…' : 'Save profile'}</button>
          </form>
          <button className="secondary wide" type="button" disabled={busy} onClick={signOut}><LogOut size={16}/>{busy ? 'Signing out…' : 'Sign out'}</button>
        </> : <>
          <p>Sign in with a secure email magic link. No password required.</p>
          <form className="account-form" onSubmit={sendLink}>
            <label htmlFor="account-email">Email address</label>
            <input id="account-email" type="email" autoComplete="email" required value={email} onChange={event => setEmail(event.target.value)} placeholder="you@example.com"/>
            <button className="primary wide" type="submit" disabled={busy || cooldown > 0}><LogIn size={16}/>{busy ? 'Sending link…' : cooldown > 0 ? `Try again in ${cooldown}s` : 'Email me a sign-in link'}</button>
          </form>
        </>}
        {message && <p className="account-success" role="status">{message}</p>}
        {error && <p className="error" role="alert">{error}</p>}
        <small className="fine">Demo packs, balances, and token values are simulated. Signing in does not create real assets.</small>
      </section>
    </div>}
  </>;
}
