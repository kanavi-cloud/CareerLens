# Suitability Diagnosis Work Log

## Pre-merge handoff - 2026-10-01

- Keep this work on `feature/suitability-diagnosis`. Local edits are not included in a GitHub push until they are committed; no commit or push was performed here.
- `.env` is ignored. On each developer machine, set `EXPO_PUBLIC_API_BASE_URL` to that machine's backend address. For Expo Go on a physical phone, use the computer's LAN IP, not `localhost`; then restart Expo so the variable is bundled again.
- When reusing a database, set `APP_SEED_RESET_ENABLED=false` before starting Docker Compose. Its current default is `true`, and the backend seed loader deletes diagnosis and planner data during reset.
- Profile editing now blocks saving when the initial profile request fails, preventing a temporary network error from overwriting an existing profile with demo defaults. A confirmed missing profile still permits first-time registration.
- `git diff --check` passed. App-wide TypeScript checking remains blocked by the existing `tsconfig.json` configuration and errors in untouched routes. Authenticated end-to-end testing on another computer is still required before declaring the merge safe.
- `npx expo export --platform ios` and `npx expo export --platform android` both completed successfully. These verify bundling, not API connectivity or device behavior.
- A TypeScript check with temporary command-line configuration overrides reported 79 errors in untouched files and none in the changed files. The project-wide check is still failing and must not be described as passed.

## UI error fixes and phone test - 2026-09-30

- Home-screen percentage-width change was reverted. `src/app/index.tsx` matches the original branch version.
- Added a visible logout control to the signed-in site header. Sessions persist locally until logout; the existing menu still contains My Page.
- Android Studio's Expo log showed a real crash when opening a planner roadmap: `useParams` was undefined. Changed the roadmap screen to Expo Router's `useLocalSearchParams`.
- The user reported profile editing and diagnosis Top 5 recommendations rendering on the iPhone. These observations came from the user's device, not this agent's own full scenario run.
- Phone test order: log in, open profile and confirm stored values, change one non-sensitive profile field and save, open suitability diagnosis, run it, inspect all Top 5 cards, switch between two detailed analyses, create a planner from one result, confirm its roadmap opens, then return home and inspect layout and button text at normal text size.
- Record the first failing step with the visible error, device model, and a screenshot. No commit or push performed.

## Retry after computer-use approval - 2026-09-30

- Computer-use permission is now effective: Android Studio was accessed successfully on feature/suitability-diagnosis.
- Read the existing iOS terminal errors: raw text in MetricCard and unsupported HTML input in profile editing. These match the code fixes already applied; historical logs are not proof of a new regression or of successful retesting.
- Android API 35 emulator booted; adb reported emulator-5554 as device. A redundant CLI launch exited because the same AVD was already running; no second emulator was started.
- Visually verified the app's unauthenticated suitability-diagnosis screen, then clicked Login and observed the login form.
- Attempted demo-account input. The keyboard obscured the form and input/submission success was not confirmed. No successful login, diagnosis response, or planner creation is claimed.
- Metro is listening on port 8081. The terminal's original startup URL still displays the old IP; current bundle/environment reload is not verified.
- Shell API check still returned HTTP 000 and docker compose ps returned socket permission denied. Computer-use approval did not grant shell Docker/network access.
- Status: partial UI verification only; authenticated scenario remains pending. Emulator was left open for continuation.

## Direct scenario verification attempt - 2026-09-30

Overall result: BLOCKED, not passed. Code implementation and type checking do not establish successful device execution.

| Scenario | Expected result | Observed result |
| --- | --- | --- |
| Backend connectivity | GET /api/jobs returns HTTP 200 | curl to http://192.168.0.4:8088/api/jobs failed with exit 7, HTTP 000; no HTTP response received |
| Open Android Studio test UI | App screen accessible for interaction | Android Studio is running, but UI access returned `Computer Use permissions are not granted` |
| Sign in and load profile | Authenticated profile shown | Not executed: direct UI access blocked |
| Edit and save profile | Changes persist and appear on diagnosis screen | Not executed |
| Run suitability diagnosis | Successful response and up to five recommendations | Not executed |
| Select recommendation | Matching scores and analysis shown | Not executed |
| Create planner | New roadmap opens successfully | Not executed |
| Inspect button contrast | Readable text on dark buttons on device | Not visually verified |

The connectivity failure alone does not establish that the backend is down; network restrictions remain a possible cause. Earlier inspection found a listener on port 8088. The local API URL was changed to match the observed Wi-Fi IP, but Expo environment reload and device connectivity have not been confirmed.

Required to resume: grant computer-use access for direct app interaction and provide an execution context that permits local API requests. Do not mark the above scenarios passed until their actual results are observed. No commit or push was performed.

## Follow-up fixes - 2026-09-30

- Replaced HTML input/select/details elements in profile editing with native text inputs, selectable options, and collapsible suggestions. Wrapped raw labels/errors in Text.
- Fixed MetricCard rendering primitive values directly inside View, which causes native text rendering errors.
- Refresh diagnosis profile when returning to the screen after editing.
- Updated the ignored local API address from 192.168.0.27 to the current 192.168.0.4. Expo must reload its environment.
- Local-network requests remain blocked in this agent environment. Successful authenticated API/device verification has not been established.

- Fixed shared Button label contrast by applying the foreground color directly to Text, including variant-specific loading indicators and accessibility state.
- Hide demo profile data until the authenticated user's profile has loaded; disable diagnosis while loading or after a failed profile request.
- Normalize missing profile arrays and ignore stale profile requests after navigation or account changes.
- Guard repeated diagnosis/planner actions and hide stale detailed analysis during diagnosis.
- Corrected PanelBlock children typing for multi-part detail text.
- git diff --check passed. Full TypeScript checking with bundler resolution exposes errors in other app screens; it is not a passing app-wide check.
- The backend address was unreachable during this follow-up. Authenticated device diagnosis and visual verification remain pending.

## Phase 1 - API connection cleanup

- Confirmed all work is being done on `feature/suitability-diagnosis`.
- Removed temporary Expo tunnel/QR dependencies that were added during device testing.
- Changed suitability diagnosis API calls to use the shared `getApiBaseUrl()` helper.
- Applied the same API base URL handling to planner creation and job list loading because they are part of the diagnosis flow.
- Kept all work local only. No remote commit or push was performed.

## Phase 2 - Mobile diagnosis screen

- Reworked `src/app/jobs/recommendation/index.tsx` into a mobile-first vertical flow.
- The screen now follows this order: profile summary, diagnosis action panel, Top 5 recommendation cards, and selected job analysis.
- Removed web-dashboard style layout patterns that were risky in React Native.
- Kept the visual tone aligned with existing app screens: white cards, strong `night` headings, teal/brand emphasis, compact badges, and stacked mobile cards.
- Preserved the existing backend flow: load stored profile, run stored-profile diagnosis, show recommendation scores, and create a planner from a diagnosis result.

## Phase 3 - Runtime verification

- Restarted Expo with cache reset on LAN port `8095`.
- Confirmed the Expo development server responds at `http://192.168.0.27:8095`.
- Confirmed the backend API responds at `http://192.168.0.27:8088/api/jobs`.
- Opened the app in Android Expo Go and verified the bundle completes without the previous `MetricCard` / `dl` runtime errors.
- Confirmed the unauthenticated recommendation route now reaches the auth-required screen without crashing.
- `npx tsc --noEmit` could not be used as a clean verifier because the existing `tsconfig.json` has a TypeScript 6 module resolution configuration conflict.
- `npx expo lint` could not be completed because the project has no ESLint config and the automatic dependency install failed under the current network-restricted environment.
- `git diff --check` passed.
