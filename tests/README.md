# Tests

Automated tests are not wired up yet. Recommended layout when you add them:

- **Unit tests**: colocated or under `backend/src/**/__tests__/` and `frontend/src/**/__tests__/`.
- **API integration**: `tests/integration/` with a test database or mocked Supabase.

After adding a runner (for example Vitest + Supertest), document the commands in the root `README.md`.
