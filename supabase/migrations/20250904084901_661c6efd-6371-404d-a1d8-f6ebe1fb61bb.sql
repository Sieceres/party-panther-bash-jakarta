-- Add DELETE policies for events and promos so organizers can delete their own content

-- Allow users to delete their own events
CREATE POLICY "Users can delete their own events" 
ON public.events 
FOR DELETE 
USING (auth.uid() = created_by);

-- Allow users to delete their own promos
CREATE POLICY "Users can delete their own promos" 
ON public.promos 
FOR DELETE 
USING (auth.uid() = created_by);