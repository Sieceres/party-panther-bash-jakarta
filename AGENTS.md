# Architecture rules

- Registration contact questions live in registration_fields with a contact discriminator; never hardcode mandatory contact inputs outside the configured questions, so organizers can remove them.
- Convert legacy implicit contact questions to explicit configured questions when migrating; the registration RPC derives contact metadata from configured answers so client-supplied metadata cannot restore removed fields.