# API Handoff

The frontend is intentionally backend-agnostic. `src/services/apiClient.js` is the single transport adapter. In demo mode it returns deterministic mock results. Set `VITE_DEMO_MODE=false` and `VITE_API_BASE_URL` to integrate FastAPI.

Each screen specification includes the controlled API domain and named audit events in `src/config/screenSpecs.json`. Each action branch copies those values into `src/config/branches.json` so frontend developers cannot create a mutation UI without seeing the corresponding API/audit contract.

Required production integrations remain: GINFINA engineering domain APIs, GPROPEL project/site context, GSOLVE procurement/FINAC handoff, GCONNECT actions and notifications, and the bounded AI gateway.
