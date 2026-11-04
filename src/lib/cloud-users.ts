import crypto from 'crypto';
import { createAdminClient } from './supabase/admin';
import { getStoredUserAccounts, saveStoredUserAccount, findStoredUserAccount } from './storage';

export interface CloudUserAccount {
  id: string;
  email: string;
  fullName: string;
  phone: string;
  passwordHash: string;
  createdAt: string;
}

export function hashPassword(pwd: string): string {
  return crypto.createHash('sha256').update(pwd).digest('hex');
}

export async function getCloudUserAccounts(): Promise<CloudUserAccount[]> {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'user_accounts')
      .maybeSingle();

    let cloudAccounts: CloudUserAccount[] = [];
    if (!error && data && data.value) {
      if (typeof data.value === 'string') {
        try {
          cloudAccounts = JSON.parse(data.value) || [];
        } catch {}
      } else if (Array.isArray(data.value)) {
        cloudAccounts = data.value;
      }
    }

    // Merge dengan akun local storage agar tidak ada akun yang terputus
    const localAccounts = getStoredUserAccounts();
    const merged = [...cloudAccounts];
    for (const la of localAccounts) {
      if (!merged.some((u) => u.email.toLowerCase().trim() === la.email.toLowerCase().trim())) {
        merged.push(la);
      }
    }

    return merged;
  } catch (err) {
    console.warn('Failed to fetch cloud user accounts:', err);
    return getStoredUserAccounts();
  }
}

export async function saveCloudUserAccount(account: CloudUserAccount): Promise<boolean> {
  try {
    // 1. Simpan di local storage
    saveStoredUserAccount(account);

    // 2. Ambil list akun saat ini dan lakukan upsert
    const existing = await getCloudUserAccounts();
    const cleanEmail = account.email.toLowerCase().trim();
    const idx = existing.findIndex((u) => u.email.toLowerCase().trim() === cleanEmail);

    if (idx >= 0) {
      existing[idx] = account;
    } else {
      existing.push(account);
    }

    const supabase = createAdminClient();
    const payload = {
      key: 'user_accounts',
      value: JSON.stringify(existing),
      updated_at: new Date().toISOString(),
    };

    // Upsert dengan target key eksplisit
    const { error: upsertErr } = await supabase
      .from('settings')
      .upsert(payload, { onConflict: 'key' });

    if (upsertErr) {
      console.warn('Supabase settings upsert warning, fallback to direct select/update/insert:', upsertErr.message);
      const { data: row } = await supabase
        .from('settings')
        .select('key')
        .eq('key', 'user_accounts')
        .maybeSingle();

      if (row) {
        await supabase
          .from('settings')
          .update({ value: payload.value, updated_at: payload.updated_at })
          .eq('key', 'user_accounts');
      } else {
        await supabase.from('settings').insert(payload);
      }
    }

    return true;
  } catch (err) {
    console.error('Failed to save cloud user account:', err);
    return false;
  }
}

export async function findCloudUserAccount(email: string): Promise<CloudUserAccount | undefined> {
  const cleanEmail = email.toLowerCase().trim();
  const accounts = await getCloudUserAccounts();
  const found = accounts.find((u) => u.email.toLowerCase().trim() === cleanEmail);
  if (found) return found;

  return findStoredUserAccount(cleanEmail);
}
