import crypto from 'crypto';
import { createAdminClient } from './supabase/admin';

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

    if (error || !data || !data.value) return [];
    return JSON.parse(data.value) || [];
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

    const supabase = createAdminClient();
    const { error } = await supabase.from('settings').upsert({
      key: 'user_accounts',
      value: JSON.stringify(existing),
      updated_at: new Date().toISOString(),
    });

    if (error) {
      console.warn('Failed to save cloud user account to Supabase:', error.message);
      return false;
    }

    return true;
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
