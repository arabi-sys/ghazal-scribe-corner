-- Create money_transfers table for Lebanon local transfers
CREATE TABLE public.money_transfers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  sender_full_name TEXT NOT NULL,
  sender_id_number TEXT NOT NULL,
  sender_id_picture_url TEXT,
  sender_phone TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  receiver_full_name TEXT NOT NULL,
  transfer_type TEXT NOT NULL DEFAULT 'local',
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.money_transfers ENABLE ROW LEVEL SECURITY;

-- RLS policies for money_transfers
CREATE POLICY "Users can view own transfers" ON public.money_transfers
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create transfers" ON public.money_transfers
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all transfers" ON public.money_transfers
FOR SELECT USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update transfers" ON public.money_transfers
FOR UPDATE USING (has_role(auth.uid(), 'admin'));

-- Create ebooks table
CREATE TABLE public.ebooks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  author TEXT NOT NULL,
  description TEXT,
  cover_url TEXT,
  content_url TEXT,
  price NUMERIC NOT NULL DEFAULT 0,
  is_free BOOLEAN NOT NULL DEFAULT false,
  genre TEXT,
  pages INTEGER,
  isbn TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for ebooks
ALTER TABLE public.ebooks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view ebooks" ON public.ebooks
FOR SELECT USING (true);

CREATE POLICY "Admins can manage ebooks" ON public.ebooks
FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Create user_ebooks (purchased ebooks)
CREATE TABLE public.user_ebooks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  ebook_id UUID NOT NULL REFERENCES public.ebooks(id) ON DELETE CASCADE,
  purchased_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, ebook_id)
);

ALTER TABLE public.user_ebooks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own ebooks" ON public.user_ebooks
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can purchase ebooks" ON public.user_ebooks
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create storage bucket for ID pictures
INSERT INTO storage.buckets (id, name, public) VALUES ('id-pictures', 'id-pictures', false);

CREATE POLICY "Users can upload own ID pictures" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'id-pictures' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view own ID pictures" ON storage.objects
FOR SELECT USING (bucket_id = 'id-pictures' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Admins can view all ID pictures" ON storage.objects
FOR SELECT USING (bucket_id = 'id-pictures' AND has_role(auth.uid(), 'admin'));