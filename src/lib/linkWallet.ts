import { supabase } from './supabaseClient';

/** Persist connected wallet pubkey on the signed-in profile (best-effort). */
export async function linkWalletToProfile(walletPubkey: string): Promise<void> {
  if (!supabase || !walletPubkey) return;
  const { data } = await supabase.auth.getSession();
  const userId = data.session?.user?.id;
  if (!userId) return;
  await supabase
    .from('profiles')
    .update({ wallet_pubkey: walletPubkey })
    .eq('id', userId)
    .then(({ error }) => {
      if (error) console.warn('Could not link wallet to profile', error.message);
    });
}
