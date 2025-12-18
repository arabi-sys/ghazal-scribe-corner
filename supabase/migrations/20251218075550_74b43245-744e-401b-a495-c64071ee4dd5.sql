-- Create a function to decrement stock that can be called by authenticated users
CREATE OR REPLACE FUNCTION public.decrement_product_stock(product_id uuid, quantity integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.products
  SET stock = GREATEST(0, stock - quantity),
      updated_at = now()
  WHERE id = product_id;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.decrement_product_stock(uuid, integer) TO authenticated;