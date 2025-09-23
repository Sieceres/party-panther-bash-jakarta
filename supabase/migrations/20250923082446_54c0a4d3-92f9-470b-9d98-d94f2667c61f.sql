-- Add receipt tracking columns to event_attendees table
ALTER TABLE public.event_attendees 
ADD COLUMN receipt_url TEXT,
ADD COLUMN receipt_uploaded_at TIMESTAMP WITH TIME ZONE;

-- Add index for receipt queries
CREATE INDEX idx_event_attendees_receipt ON public.event_attendees(receipt_url) WHERE receipt_url IS NOT NULL;