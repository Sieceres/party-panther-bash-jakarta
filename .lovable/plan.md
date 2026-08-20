# Notify organizers when an attendee marks "I have paid"

Yes, Telegram is viable — but the best approach is to reuse the notification pipeline this app already has, so the organizer gets it in-app **and** on Telegram if they linked their account.

## How it works today

- Attendees press "I have paid" in the payment dialog, which sets `event_attendees.payment_claimed_at`.
- The app already has a `user_notifications` table plus the in-app bell, and database triggers (e.g. new attendee joined, new comment) that insert notifications for the event owner.
- Notifications are forwarded to Telegram by the existing `telegram-notify-user` function, which only sends when the user has linked their Telegram (`profiles.telegram_chat_id`); otherwise it silently skips.

So no new channel is needed: one new trigger plugs the payment claim into everything that already exists.

## What to build

1. New database trigger on `event_attendees` that fires when `payment_claimed_at` changes from empty to set.
2. It inserts a notification of type `payment_claimed` for the event creator (and co-organizers of that event), with:
   - Title: "Attendee marked as paid"
   - Message: "<Name> marked payment as paid for <Event title>"
   - Link straight to the event page
3. Organizers see it in the bell immediately; those with Telegram linked also get the message there through the existing forwarding path.
4. No notification is created when the organizer marks their own payment.
5. A second notification when a receipt image is uploaded (`receipt_url` set), in addition to the "I have paid" tap.

## Un-marking payment

- Attendees who tapped "I have paid" get an "I haven't paid yet" button in the payment dialog that clears `payment_claimed_at`.
- Un-marking is blocked once the organizer has confirmed the payment (`payment_status = true`) — at that point only the organizer can change it.
- Un-marking produces no notification.

## Anti-spam limit

- An attendee can send at most 3 "I have paid" notifications per event, ever. After that, toggling still works but no further notification is created.
- Additionally, no notification is created if the same attendee already triggered one for that event within the last 30 minutes.
- The UI shows a short "You can only do this a few times" note and disables the buttons briefly after each toggle.

## Technical notes

- Trigger: `AFTER UPDATE ON public.event_attendees`, condition `OLD.payment_claimed_at IS NULL AND NEW.payment_claimed_at IS NOT NULL`, `SECURITY DEFINER`, `SET search_path = public`, mirroring `notify_event_join`.
- A second condition in the same trigger handles `receipt_url` going from null to set.
- Recipients: `events.created_by` plus rows in `event_attendees` with `is_co_organizer = true` for the same event, deduped, excluding `NEW.user_id`.
- Throttling is enforced inside the trigger by counting existing `user_notifications` rows of type `payment_claimed` whose `metadata` matches this event + attendee (count < 3 and none newer than 30 minutes).
- Un-mark path: attendee updates their own `event_attendees` row setting `payment_claimed_at = null`; the existing self-update RLS policy covers it, and the trigger only fires on null → not-null, so no notification.
- Frontend: `EventPaymentInfo.tsx` gains the un-mark button and the toggle cooldown; the bell and Telegram path already handle new notification types generically.
- Anonymous attendees: show the display name to organizers as elsewhere in the payment/receipt admin views (organizers already see real identities for payment tracking).

