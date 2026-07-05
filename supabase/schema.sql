CREATE TABLE trackers (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    price NUMERIC NOT NULL,
    currency TEXT NOT NULL DEFAULT 'EUR',
    cycle TEXT NOT NULL DEFAULT 'monthly',
    next_billing_date DATE NOT NULL,
    notify_datetime TIMESTAMP WITH TIME ZONE,
    url TEXT,
    notes TEXT,
    is_notified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

ALTER TABLE trackers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own trackers" 
ON trackers FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own trackers" 
ON trackers FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own trackers" 
ON trackers FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own trackers" 
ON trackers FOR DELETE 
USING (auth.uid() = user_id);

create table push_tokens (
    user_id uuid references auth.users (id) on delete cascade,
    token text not null,
    updated_at timestamptz default now(),
    primary key (user_id, token)
);

alter table push_tokens enable row level security;

create policy "A user can manage his push tokens"
on push_tokens for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- cron

create extension if not exists pg_net;

select cron.schedule(
  'invoke-push-notifications',
  '* * * * *',
  $$
    select net.http_post(
        url:='https://<project>.supabase.co/functions/v1/smooth-task',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer <token>"}'::jsonb,
        body:='{}'::jsonb
    ) as request_id;
  $$
);