import crypto from 'crypto';
import { getSupabaseUrl, getSupabaseAnonKey } from './supabase/config';

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
    const url = getSupabaseUrl();
    const key = getSupabaseAnonKey();

    const res = await fetch(`${url}/rest/v1/settings?key=eq.user_accounts&select=value`, {
      headers: {
        'apikey': key,
      },
      cache: 'no-store',
    });

    if (!res.ok) return [];
    const rows = await res.json();
    if (!rows || rows.length === 0 || !rows[0]?.value) return [];
    return JSON.parse(rows[0].value) || [];
  } catch (err) {
    console.warn('Failed to fetch cloud user accounts:', err);
    return [];
  }
}

export async function saveCloudUserAccount(account: CloudUserAccount): Promise<boolean> {
  try {
    const existing = await getCloudUserAccounts();
    const cleanEmail = account.email.toLowerCase().trim();
    const idx = existing.findIndex((u) => u.email.toLowerCase().trim() === cleanEmail);

    if (idx >= 0) {
      existing[idx] = account;
    } else {
      existing.push(account);
    }

    const url = getSupabaseUrl();
    const key = getSupabaseAnonKey();

    const res = await fetch(`${url}/rest/v1/settings`, {
      method: 'POST',
      headers: {
        'apikey': key,
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates',
      },
      body: JSON.stringify({
        key: 'user_accounts',
        value: JSON.stringify(existing),
        updated_at: new Date().toISOString(),
      }),
    });

    return res.ok;
  } catch (err) {
    console.error('Failed to save cloud user account:', err);
    return false;
  }
}

export async function findCloudUserAccount(email: string): Promise<CloudUserAccount | undefined> {
  const accounts = await getCloudUserAccounts();
  const cleanEmail = email.toLowerCase().trim();
  return accounts.find((u) => u.email.toLowerCase().trim() === cleanEmail);
}
