-- Create Drafts Table for Ads Manager

create table if not exists public.ads_manager_drafts (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  ad_account_id text not null,
  draft_id uuid not null, -- Client-side generated ID for optimistic UI
  level text check (level in ('CAMPAIGN', 'ADSET', 'AD')) not null,
  payload jsonb not null default '{}'::jsonb,
  status text check (status in ('DRAFT', 'PUBLISHING', 'ERROR', 'PUBLISHED')) default 'DRAFT',
  error_message text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  
  -- Ensure unique draft_id per user (optional, but good for safety)
  unique(user_id, draft_id)
);

-- RLS Policies
alter table public.ads_manager_drafts enable row level security;

create policy "Users can view their own drafts"
  on public.ads_manager_drafts for select
  using (auth.uid() = user_id);

create policy "Users can insert their own drafts"
  on public.ads_manager_drafts for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own drafts"
  on public.ads_manager_drafts for update
  using (auth.uid() = user_id);

create policy "Users can delete their own drafts"
  on public.ads_manager_drafts for delete
  using (auth.uid() = user_id);

-- Indexes
create index idx_drafts_user_account on public.ads_manager_drafts(user_id, ad_account_id);
