-- Add DELETE policy for event comments to allow users to delete their own comments and admins to delete any comments
CREATE POLICY "Users can delete their own comments or admins can delete any"
ON public.event_comments
FOR DELETE
USING (
  auth.uid() = user_id OR 
  is_current_user_admin()
);