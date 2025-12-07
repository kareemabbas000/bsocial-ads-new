
import { supabase } from './supabaseClient';
import { UserProfile, UserConfig } from '../types';

export const fetchUserProfile = async (userId: string): Promise<UserProfile | null> => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    console.error('Error fetching profile:', error);
    return null;
  }
  return data;
};

export const fetchUserConfig = async (userId: string): Promise<UserConfig | null> => {
  const { data, error } = await supabase
    .from('user_config')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error) {
    console.error('Error fetching config:', error);
    return null;
  }
  return data;
};

export const fetchSystemSetting = async (key: string): Promise<string | null> => {
  const { data, error } = await supabase
    .from('system_settings')
    .select('value')
    .eq('key', key)
    .single();

  if (error) return null;
  return data.value;
};

export const updateSystemSetting = async (key: string, value: string) => {
  const { error } = await supabase
    .from('system_settings')
    .upsert({ key, value });
  if (error) throw error;
};

// --- Admin Functions ---

export const fetchAllUsers = async (): Promise<(UserProfile & { config?: UserConfig })[]> => {
  const { data: profiles, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false });

  if (profileError) throw profileError;

  const { data: configs, error: configError } = await supabase
    .from('user_config')
    .select('*');

  if (configError) throw configError;

  return profiles.map(p => ({
    ...p,
    config: configs.find(c => c.user_id === p.id)
  }));
};

export const updateUserRole = async (userId: string, role: 'admin' | 'client') => {
  const { error } = await supabase
    .from('profiles')
    .update({ role })
    .eq('id', userId);
  if (error) throw error;
};

export const updateUserConfig = async (userId: string, updates: Partial<UserConfig>) => {
  // Use upsert to create the config row if it doesn't exist
  const { error } = await supabase
    .from('user_config')
    .upsert({ user_id: userId, ...updates }, { onConflict: 'user_id' });

  if (error) throw error;
};

export const createUser = async (userData: any) => {
  const { data, error } = await supabase.functions.invoke('create-user', {
    body: userData
  });

  if (error) throw error;
  return data;
};

export const updateUserProfile = async (userId: string, updates: Partial<UserProfile>) => {
  const { error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId);
  if (error) throw error;
};

export const deleteUser = async (userId: string) => {
  // Direct deletion using the service role key authenticated client
  // this is more reliable than the edge function in this local dev setup
  const { data, error } = await supabase.auth.admin.deleteUser(userId);

  if (error) {
    console.error("Supabase Admin Delete Error:", error);
    throw error;
  }

  return data;
};
