-- Create exchange messages table for chat between users
CREATE TABLE public.exchange_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  transaction_id UUID NOT NULL REFERENCES public.exchange_transactions(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.exchange_messages ENABLE ROW LEVEL SECURITY;

-- Users can view messages for transactions they're involved in
CREATE POLICY "Users can view messages for their transactions"
ON public.exchange_messages
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.exchange_transactions t
    JOIN public.exchange_books b ON t.book_id = b.id
    WHERE t.id = transaction_id
    AND (t.user_id = auth.uid() OR b.depositor_id = auth.uid())
  )
);

-- Users can send messages for transactions they're involved in
CREATE POLICY "Users can send messages for their transactions"
ON public.exchange_messages
FOR INSERT
WITH CHECK (
  sender_id = auth.uid() AND
  EXISTS (
    SELECT 1 FROM public.exchange_transactions t
    JOIN public.exchange_books b ON t.book_id = b.id
    WHERE t.id = transaction_id
    AND (t.user_id = auth.uid() OR b.depositor_id = auth.uid())
  )
);

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.exchange_messages;