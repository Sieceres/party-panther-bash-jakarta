-- Add payment_status to event_attendees table
ALTER TABLE public.event_attendees 
ADD COLUMN payment_status BOOLEAN DEFAULT FALSE NOT NULL;

-- Add payment_date to track when payment was marked
ALTER TABLE public.event_attendees 
ADD COLUMN payment_date TIMESTAMP WITH TIME ZONE NULL;

-- Add payment_marked_by to track which admin marked the payment
ALTER TABLE public.event_attendees 
ADD COLUMN payment_marked_by UUID NULL;

-- Add RLS policy for admins to update payment status
CREATE POLICY "Admins can update payment status" 
ON public.event_attendees 
FOR UPDATE 
USING (is_current_user_admin())
WITH CHECK (is_current_user_admin());