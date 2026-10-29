# Architecture rules

- Registration contact questions live in registration_fields with a contact discriminator; never hardcode mandatory contact inputs outside the configured questions, so organizers can remove them.
- Convert legacy implicit contact questions to explicit configured questions when migrating; the registration RPC derives contact metadata from configured answers so client-supplied metadata cannot restore removed fields.
- Initialize registration defaults only for unconfigured, disabled forms; preserve saved enabled forms (including empty forms), and let organizers explicitly assign compatible contact roles so deleted contacts stay deleted unless restored.
- Venue-page creation reuses the existing promo/event forms with an initialVenue prop, preserving the venue ID and inherited location without treating new content as an edit.
- The venue-link audit checks paginated content IDs against existing venues; promo repairs use admin-checked preview/apply RPCs that revalidate unique name matches and preserve valid links, while uncertain matches use existing edit forms.
- Promo venue-link triggers only fill missing links from unique space/punctuation/case-normalized names and inherit venue location; new or renamed venues retry unlinked promos, so no client-side bulk updates or fuzzy automatic matches are needed.