# Architecture rules

- Registration contact questions live in registration_fields with a contact discriminator; never hardcode mandatory contact inputs outside the configured questions, so organizers can remove them.
- Normalize legacy registration contact questions on loading; the registration RPC derives contact metadata from configured answers so client-supplied metadata cannot restore removed fields.