# 人體的運動 · Body Movement Lab

A bilingual HKDSE Biology movement simulation. Original, rotatable WebGL geometry with a rigged skeleton, hinge joints, opposing muscle pairs and a clearly identified 2D fallback. No accounts, package downloads, paid APIs or runtime third-party assets.

## 離線使用 / Run offline

Download `body-movement-offline.zip`, extract it, and open `index.html` in a modern browser. Alternatively open `dist/index.html` directly. The built file contains all code, styles, diagrams and translations. A network connection and server are not required. Managed enterprise browsers may block file URLs; in that case use the local server below.

下載並解壓縮 `body-movement-offline.zip`，用瀏覽器開啟當中的 `index.html`，毋須安裝或連線。繁體中文為預設語言；右上角可切換英文。語言偏好會在瀏覽器允許時儲存。觀察紀錄保留於本次頁面，關閉前請下載 CSV。

## Development

Use the existing checkout; each cloud task is already isolated. Do not create another Git worktree unless requested.

Requires Node.js 18+ for builds/tests and Python 3 for the optional development server. No npm dependencies or installation step.

```sh
npm test
npm run build
npm start
```

The development server binds only to loopback, port 8000. Serve the repository root for modular development; distribute `dist/index.html` for offline use. Rebuild after source changes. `npm run build` is deterministic and does not change source files.

Optional browser acceptance checks need Playwright and Chromium installed in the host environment. With the local server running, run `node tests/browser.cjs`. Set `CHROMIUM_PATH` when needed. These tools are test-only dependencies; the application itself needs none. The test also detects the preinstalled Playwright location in the managed cloud runtime.

## Use

Select an elbow or supported left knee, then contract a labelled muscle or click its geometry. A click on a different joint first selects that joint. Use progress, single step, play/pause or replay to inspect movement. The destination-angle control guides exploration; selecting the opposite muscle automatically chooses its directional limit if the old destination is incompatible. In a challenge the correct muscle moves towards the prescribed target; the opposite muscle moves away. Camera sliders provide keyboard alternatives to dragging. Reduced-motion users advance deliberately with progress or single-step controls instead of autoplay.

Guided mode separates prediction, operation, observation and written explanation. Explanation is self-assessed against a revealed model answer, never graded by keyword matching. A ±5° geometrical tolerance applies independently to each assessed joint. Multiple-joint tasks accept either order. Records copy actual state, targets, camera, progress, predictions and explanation; later changes cannot alter them. CSV exports the recorded measurements and responses in the current language. No arbitrary-photo recognition is offered.

## Model assumptions / 模型假設

- Unloaded, supported, seated teaching model; shoulder, hip and trunk positions are fixed. Elbows independently range from 0–135°; the supported left knee ranges from 0–110°. These invented teaching settings are not measured human data or examination recall requirements.
- Each pair allows only one selected muscle. Flexor contraction produces flexion; extensor contraction produces extension. Its opposing muscle is allowed to lengthen. The knee pair is a functional schematic, not a single-muscle anatomical claim.
- Elbow flexors are biceps, anterior to the upper arm; extensors are triceps, posterior. Bones retain their lengths and rotate around fixed pivots in the hinge plane. Tendon segments connect the muscle belly to insertion points on moving forearm/shin geometry and retain a fixed schematic length; muscle-belly geometry adapts. Gold ligament segments distinguish bone-to-bone connection from pale tendon muscle-to-bone connection. Geometry is illustrative, not a surgical anatomical atlas.
- Real movement may involve gravity, co-contraction and other muscles. A static posture alone never establishes activation; tasks specify initial state, target and movement direction. Matching a pose does not establish exclusive activation in a real person.
- No textbook PDF or EDB source document was supplied or retrieved. Content follows the explicit chapter-specific specification and exact supplied glossary; page references and alignment against the original documents remain unverified. No claim of textbook artwork reproduction or formal curriculum certification is made. Lever classifications and additional named muscles are outside this tool's assessed scope.

The complete stable-ID bilingual dictionary and exact supplied glossary are in `i18n.js`. All essential content is bundled in the offline file.

## Acceptance evidence

Executed in Node.js 24 and headless Chromium with WebGL (software rendering). See `tests/model.test.js` and `tests/browser.cjs`.

| Required check | Evidence |
|---|---|
| 1. Each biceps flexes only its own elbow; triceps extends it | Model tests check both directions and unchanged other joints; browser checks all elbow transitions. |
| 2. Opposing muscle states, tendon and pull caption agree | State/caption use the same selected joint and action as motion; renderer uses the same pose for insertion points and active muscle geometry. Reviewed in browser. Tendons have constant 0.14 model-unit length. |
| 3. Knee directions and generic naming | Browser passes both supported-knee transitions; dictionary uses only generic knee flexor/extensor. |
| 4. Defined initial → target movement | All six tasks validated reachable with explicit initial/target states; no photograph scoring. |
| 5. Fixed joints, ranges and camera-independent scoring | Model tests verify limits, bone lengths and tolerance; browser verifies camera rotation preserves success. |
| 6. Direct click / keyboard / replay equivalence | Browser checks a projected muscle hit, Enter activation and replay; all drive the same motion controller. |
| 7. Language preserves selected task, pose and progress | Browser switches languages mid-movement and verifies unchanged progress; translation changes text without recreating simulation state. |

Additional browser checks: immutable observations, CSV download, 390 px layout without horizontal overflow, explicit WebGL-unavailable fallback and no JavaScript exceptions.
