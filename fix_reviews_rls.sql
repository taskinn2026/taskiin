-- Enable RLS for reviews
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Drop existing policies just in case
DROP POLICY IF EXISTS "Anyone can read reviews" ON public.reviews;
DROP POLICY IF EXISTS "Authenticated users can create reviews" ON public.reviews;
DROP POLICY IF EXISTS "Users can update their own reviews" ON public.reviews;
DROP POLICY IF EXISTS "Users can delete their own reviews" ON public.reviews;

-- Allow anyone to read reviews
CREATE POLICY "Anyone can read reviews"
ON public.reviews
FOR SELECT
USING (true);

-- Allow authenticated users to insert reviews
CREATE POLICY "Authenticated users can create reviews"
ON public.reviews
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own reviews
CREATE POLICY "Users can update their own reviews"
ON public.reviews
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Allow users to delete their own reviews
CREATE POLICY "Users can delete their own reviews"
ON public.reviews
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);
