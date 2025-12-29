-- Add offered_book_id column for exchange transactions
ALTER TABLE public.exchange_transactions 
ADD COLUMN IF NOT EXISTS offered_book_id uuid REFERENCES public.exchange_books(id);

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_exchange_transactions_offered_book_id 
ON public.exchange_transactions(offered_book_id);