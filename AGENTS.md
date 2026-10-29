# Architecture rules

- Registration contact questions live in registration_fields with a contact discriminator; never hardcode mandatory contact inputs outside the configured questions, so organizers can remove them.
- Convert legacy implicit contact questions to explicit configured questions when migrating; the registration RPC derives contact metadata from configured answers so client-supplied metadata cannot restore removed fields.
- Initialize registration defaults only for unconfigured, disabled forms; preserve saved enabled forms (including empty forms), and let organizers explicitly assign compatible contact roles so deleted contacts stay deleted unless restored.
- Venue-page creation reuses the existing promo/event forms with an initialVenue prop, preserving the venue ID and inherited location without treating new content as an edit.