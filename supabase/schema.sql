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