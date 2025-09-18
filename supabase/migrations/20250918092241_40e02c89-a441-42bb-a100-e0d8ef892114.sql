-- Update RLS policy to allow admins to delete any event
DROP POLICY IF EXISTS "Users can delete their own events" ON public.events;

CREATE POLICY "Users can delete their own events or admins can delete any"
ON public.events
FOR DELETE
USING (
  auth.uid() = created_by OR
  is_current_user_admin()
);