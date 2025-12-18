-- Allow admins to view all user_ebooks for revenue tracking
CREATE POLICY "Admins can view all user ebooks"
ON public.user_ebooks
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));