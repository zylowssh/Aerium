# site-v2 Deep Full Analysis Report

Date: 2026-03-19
Scope: architecture, backend, frontend, security, quality tooling, docs, scripts, and dependency hygiene

---

## 1. Executive Summary

site-v2 has a strong foundation and good modular intent, but it is not production-safe in its current state.

Main risks:
- API correctness regressions in key backend paths.
- Security hardening gaps (secrets, CORS, endpoint exposure).
- Significant drift between docs, mock UI behavior, and real backend contracts.
- Low verification confidence due to minimal tests and high lint/type debt.

---

## 2. Validation Baseline

Commands run during audit:
- `npm run lint`
- `npm run test -- --run`
- `npm run build`
- `npx depcheck`

Results snapshot:
- Lint: 105 issues (57 errors, 48 warnings).
- Tests: 1 trivial test only in [src/test/example.test.ts](src/test/example.test.ts#L1).
- Build: success, but large assets/chunks are still present.
- depcheck: reports multiple unused deps/devDeps (requires manual confirmation for config-driven usage).

---

## 3. Critical Findings (Fix First)

### 3.1 Audit logging signature mismatch can break CRUD flows
Evidence:
- Logger signature expects `id_ressource` in [backend/audit_logger.py](backend/audit_logger.py#L40)
- Callers pass `resource_id` in [backend/routes/sensors.py](backend/routes/sensors.py#L191)
- Same mismatch in [backend/routes/readings.py](backend/routes/readings.py#L134)

Impact:
- Sensor and reading endpoints can fail with server errors on create/update/delete paths.

Recommendation:
- Align function signature and all call sites immediately.

### 3.2 Reports blueprint routing likely double-prefixed
Evidence:
- Blueprint defines `url_prefix='/api/reports'` in [backend/routes/reports.py](backend/routes/reports.py#L12)
- App registers same blueprint with `url_prefix='/api/reports'` in [backend/app.py](backend/app.py#L237)

Impact:
- Frontend report calls may not map to actual backend routes.

Recommendation:
- Keep the reports prefix in exactly one place (either blueprint or registration).

### 3.3 Production security posture is weak
Evidence:
- Hardcoded app secret in [backend/app.py](backend/app.py#L69)
- Hardcoded JWT secret in [backend/app.py](backend/app.py#L72)
- Wildcard CORS in [backend/app.py](backend/app.py#L124)
- Open CORS resource wildcard in [backend/app.py](backend/app.py#L130)
- Remote URL proxy endpoint in [backend/app.py](backend/app.py#L271)
- External ingest uses path key model in [backend/routes/readings.py](backend/routes/readings.py#L309)
- Inline note says the key is currently sensor id in [backend/routes/readings.py](backend/routes/readings.py#L314)

Impact:
- Increased abuse surface and weak boundary controls for production environments.

Recommendation:
- Move all secrets to environment variables only.
- Replace wildcard CORS with explicit allowlist per env.
- Restrict proxy destinations with domain allowlist.
- Replace sensor-id external ingest with per-device API keys or request signing.

### 3.4 WebSocket sensor updates likely fail silently due ID type mismatch
Evidence:
- Sensor type uses string id in [src/lib/sensorData.ts](src/lib/sensorData.ts#L4)
- Incoming websocket id cast to number in [src/hooks/useSensors.ts](src/hooks/useSensors.ts#L58)
- Comparison uses string vs number in [src/hooks/useSensors.ts](src/hooks/useSensors.ts#L62)

Impact:
- Real-time updates can fail to patch local sensor state.

Recommendation:
- Normalize IDs to one type across backend payloads and frontend state.

### 3.5 Production routes contain mock-only UX behavior
Evidence:
- Top bar uses mock add modal in [src/components/layout/TopBar.tsx](src/components/layout/TopBar.tsx#L174)
- Add modal only toasts (no API call) in [src/components/widgets/AddSensorModal.tsx](src/components/widgets/AddSensorModal.tsx#L20)
- Export modal only toasts in [src/components/widgets/ExportDataModal.tsx](src/components/widgets/ExportDataModal.tsx#L20)
- Admin page uses mock audit logs in [src/pages/Admin.tsx](src/pages/Admin.tsx#L45)
- Sensor map is placeholder in [src/pages/SensorMap.tsx](src/pages/SensorMap.tsx#L92)
- Notifications panel seeded from mocks in [src/components/widgets/NotificationsPanel.tsx](src/components/widgets/NotificationsPanel.tsx#L21)

Impact:
- User actions appear successful without persistence, reducing product trust.

Recommendation:
- Connect these views to real endpoints, or hide/remove until implemented.

### 3.6 Documentation drift is substantial
Evidence:
- README lists reports daily/weekly/monthly routes in [README.md](README.md#L210)
- API reference still includes stale sensor fields in [docs/guides/API_REFERENCE.md](docs/guides/API_REFERENCE.md#L137)
- Backend README FR lists old reports routes in [backend/README_FR.md](backend/README_FR.md#L219)
- On-demand simulation doc claims scheduler no-op in [ON_DEMAND_SIMULATION.md](ON_DEMAND_SIMULATION.md#L45)
- Scheduler still runs simulation job in [backend/scheduler.py](backend/scheduler.py#L157)

Impact:
- Integrators and contributors can implement against wrong contracts.

Recommendation:
- Regenerate docs from actual routes/models and archive stale analysis files.

---

## 4. Add

### 4.1 Add meaningful test coverage
Add:
- Backend integration tests for auth, sensors CRUD, report exports, and external ingest auth behavior.
- Frontend tests for key hooks/pages (auth guard, sensors websocket updates, reports export flow).

Why:
- Current coverage is effectively zero for critical paths.

### 4.2 Add stricter quality gates
Add CI gates for:
- `lint`
- `typecheck`
- `test`

Why:
- Prevent new regressions while incrementally fixing existing debt.

### 4.3 Add route-level validation usage
Evidence:
- Validation utilities are defined in [backend/validators.py](backend/validators.py#L10)
- No route usage detected.

Add:
- Request schema validation on create/update endpoints.

### 4.4 Add centralized auth state provider
Evidence:
- `useAuth` is used directly in multiple components and each instance may fetch profile independently.

Add:
- Auth context/provider with shared user/session cache.

---

## 5. Replace

### 5.1 Replace mock topbar sensor creation with API-connected flow
Replace:
- [src/components/widgets/AddSensorModal.tsx](src/components/widgets/AddSensorModal.tsx)

With:
- Reusable API-backed dialog behavior from [src/components/sensors/AddSensorDialog.tsx](src/components/sensors/AddSensorDialog.tsx)

### 5.2 Replace mock export modal with real export endpoints
Replace:
- Mock export behavior in [src/components/widgets/ExportDataModal.tsx](src/components/widgets/ExportDataModal.tsx)

With:
- Existing backend export calls used in [src/pages/Reports.tsx](src/pages/Reports.tsx#L43) and [src/lib/apiClient.ts](src/lib/apiClient.ts#L248)

### 5.3 Replace localStorage token strategy for production deployment
Replace:
- Direct token storage and checks in [src/lib/apiClient.ts](src/lib/apiClient.ts#L63) and [src/components/ProtectedRoute.tsx](src/components/ProtectedRoute.tsx#L15)

With:
- Safer cookie/session model (HttpOnly/SameSite/secure where applicable).

### 5.4 Replace stale manual API docs with generated docs
Replace:
- Hand-maintained endpoint blocks in README/docs

With:
- Contract-derived docs from actual registered routes.

---

## 6. Improve

### 6.1 Improve lint scope to focus on intended source sets
Evidence:
- Current ignore only `dist` in [eslint.config.js](eslint.config.js#L8)

Improve:
- Exclude backend venv and unrelated nested app trees from main lint target.

### 6.2 Improve TypeScript safety incrementally
Evidence:
- `strict: false` and `noImplicitAny: false` in [tsconfig.app.json](tsconfig.app.json#L19)
- `allowJs: true` and `strictNullChecks: false` in [tsconfig.json](tsconfig.json#L12)

Improve:
- Enable stricter rules in stages by folder/domain.

### 6.3 Improve logging hygiene
Evidence:
- Verbose client logs in [src/lib/apiClient.ts](src/lib/apiClient.ts#L27)
- Login debug output in [src/pages/Auth.tsx](src/pages/Auth.tsx#L70)

Improve:
- Gate debug logs by environment and remove sensitive traces.

### 6.4 Improve enum/status normalization across stack
Evidence:
- Mixed status vocab appears in models/routes/docs and frontend filters.

Improve:
- Define one canonical status contract and enforce via shared types/constants.

### 6.5 Improve startup scripts safety and consistency
Evidence:
- Broad process termination in [start.bat](start.bat#L215)
- Linux script prints frontend on 8080 while Vite is 5173 in [start.sh](start.sh#L89) and [vite.config.ts](vite.config.ts#L10)

Improve:
- Restrict kills to app-owned processes and unify advertised ports.

### 6.6 Improve connectedness of visible UI controls
Evidence:
- Non-functional table controls in [src/pages/Sensors.tsx](src/pages/Sensors.tsx#L206)

Improve:
- Wire edit/calibrate/delete actions or hide until implemented.

---

## 7. Delete (or Archive) Candidates

### 7.1 Delete or integrate unused widget files
Candidates:
- [src/components/widgets/EditSensorModal.tsx](src/components/widgets/EditSensorModal.tsx)
- [src/components/widgets/GenerateReportModal.tsx](src/components/widgets/GenerateReportModal.tsx)

### 7.2 Delete or integrate orphan backend modules
Candidates:
- [backend/email_service.py](backend/email_service.py)
- [backend/api_docs.py](backend/api_docs.py)

Notes:
- If removed, also prune related dependencies from [backend/requirements.txt](backend/requirements.txt).

### 7.3 Delete or move duplicate/parallel app trees from main delivery path
Candidates:
- [landing-v2/package.json](landing-v2/package.json)
- [landing-page-overhaul](landing-page-overhaul)

### 7.4 Archive stale analysis/docs that conflict with current code
Candidates:
- [ANALYSIS.md](ANALYSIS.md)
- [ON_DEMAND_SIMULATION.md](ON_DEMAND_SIMULATION.md)

---

## 8. Suggested Delivery Roadmap

### Phase 1 (1-2 days): correctness and security hotfixes
- Fix audit logger signature mismatch.
- Fix reports blueprint mounting.
- Normalize websocket sensor ID handling.
- Remove hardcoded secrets and tighten CORS/proxy rules.

### Phase 2 (3-7 days): remove user-facing mock behavior
- Replace topbar add sensor with real API flow.
- Connect export modal to real export endpoints.
- Replace admin/notifications mock data with real APIs.

### Phase 3 (1-2 weeks): quality and docs stabilization
- Add integration tests and key frontend tests.
- Tighten lint scope and type settings.
- Regenerate docs from actual route contracts.
- Validate and remove dead files/deps.

### Phase 4 (2-4 weeks): production hardening
- Move to stronger auth/session model.
- Normalize enums/status contracts across backend/frontend/docs.
- Final cleanup of duplicate app trees and stale reports.

---

## 9. Final Note

This report is analysis-only. No code was modified while producing findings.
