# 人體的運動 · Body Movement Lab

Bilingual, offline educational simulation with original, rotatable 3D geometry, eight opposing muscle pairs labelled **A–P**, and a clearly identified 2D fallback. No accounts, paid APIs or runtime third-party requests.

## 離線使用 / Offline use

Download `body-movement-offline.zip`, extract it, and open `index.html`. Alternatively open `dist/index.html` directly. All code, styles, translations and diagrams are bundled. No server or internet connection is required. A managed browser may block local files; use the loopback server below in that case.

下載 ZIP 並解壓，開啟當中的 `index.html` 即可離線使用。繁體中文為預設語言，可隨時切換英文。觀察紀錄保留於本次頁面；關閉前請下載 CSV。

## Interaction

- Operation guidance and the accessible muscle index sit above the workspace; layer/camera controls sit above the model. Predictions occupy the left 01 panel, with concise A–P letter choices.
- Running and dancing targets show separate left/right side profiles to avoid the two limbs hiding each other. Model letter badges sit on outer rails; each leader ends on an actual front-facing muscle mesh vertex and remains attached during movement/camera rotation.
- One enlarged target render replaces the old initial / target / current thumbnails. The initial posture and assessed transitions remain specified in text.
- **Hold a muscle or its letter on the diagram to contract it; release to stop.** Longer holds produce greater simulated movement. Each single click or small-step action moves exactly 1° (clamped at the joint limit). There is no destination-angle slider, contraction slider or joint dropdown. Holding a marker directly selects its pair.
- In Guided Challenge, first choose the contracting and relaxing member of each assessed pair, then submit before operating. The written explanation is self-assessed against an explicitly revealed answer, never graded by keywords. Explore allows immediate manipulation.
- Drag empty space to rotate, or use camera sliders / arrow keys. The collapsible keyboard index exposes equivalent A–P controls: hold Space or Enter; release to stop. Replay reproduces the **actual partial movement**, not an invented full movement.
- Reset selected joint / whole pose, layers, side view, close-up, slower viewing and immutable observations remain available. CSV contains all eight joint settings, initial/target settings, selection, predictions, response, camera and elapsed model time. Language switching preserves current pose, task, responses, records and camera.

## Muscle index

| IDs | Pair | Effect |
|---|---|---|
| A / B | Left elbow biceps / triceps | Flexion / extension |
| C / D | Right elbow biceps / triceps | Flexion / extension |
| E / F | Left wrist flexor / extensor | Palm flexion / extension |
| G / H | Right wrist flexor / extensor | Palm flexion / extension |
| I / J | Left knee flexor / extensor | Flexion / extension |
| K / L | Right knee flexor / extensor | Flexion / extension |
| M / N | Left ankle dorsiflexor / plantarflexor | Raise toes / point foot down |
| O / P | Right ankle dorsiflexor / plantarflexor | Raise toes / point foot down |

Wrist, knee and ankle muscles are **functional schematics**, not additional named muscles required by the supplied chapter. Hand control concerns the wrist and palm, not individual fingers. Foot control concerns the ankle, not individual toes. The stable bilingual dictionary and exact supplied glossary are in `i18n.js`.

## Corrected anatomy and model assumptions

Knee flexion is now measured **relative to the thigh**, with **0° meaning thigh–shin alignment**. The old model incorrectly used a downward shin as 0° in a seated posture, effectively adding about 90° and causing excessive upward movement. The corrected seated shin bends down and back; throughout its range it remains below the knee. Standing-reference knees bend posteriorly. The heel stays below the hip at the permitted limit.

The elbows likewise rotate relative to the upper arm. Wrists and ankles use their parent limb's local frame: when an elbow or knee moves, its hand/foot and attached muscle pair follow, while the wrist/ankle setting stays unchanged. Bones retain their lengths; hands and feet remain attached. Shoulders, hips and trunk are fixed within a task. Dance and running references use different preset fixed upper-arm frames, not hidden compensating movements.

This is an unloaded teaching model. Within a pair only one muscle contracts; its opposing muscle relaxes and lengthens. Muscle bellies change length/thickness; schematic 0.14-unit tendons retain their length and transmit pull, while separate ligament segments identify bone-to-bone connections. It is not a medical anatomical atlas. Hold time is a viewing/input control, not a physiological law or measured force. Numerical angles and the ±5° scoring tolerance are invented teaching settings, not measured human data or examination recall requirements.

Ten explicit movement tasks include the original six elbow/knee transitions, opposing wrist and ankle movements, and original **running-inspired** and **dance-inspired** posture transitions. These extensions are unloaded reference configurations, not a claim to reproduce gait, balance or actual activity in a moving person. Actual running/dancing involve gravity, balance, co-contraction and other muscles. A static target cannot uniquely identify real activation; scores concern a specified initial-to-target transition. After release, the caption identifies the **last movement**, rather than inferring current activity from a stationary posture.

No textbook PDF or specific DSE past-paper question was supplied or retrieved. No past-paper artwork is reproduced or claimed; references are original models. Page references and alignment with the original textbook / EDB documents remain unverified. Lever classification and extra named muscles are outside the assessed scope.

## Development and validation

Use the existing checkout; cloud tasks are already isolated. Do not create a Git worktree unless requested. Node.js 18+ builds/tests the app; Python 3 is only needed for the optional server. No npm dependencies or installation step.

```sh
npm test
npm run build
npm start
```

The server binds only to loopback, port 8000. Distribute `dist/index.html`; rebuild after changes. Optional browser checks require host-installed Playwright and Chromium: with the server running, use `node tests/browser.cjs`. Set `CHROMIUM_PATH` if needed. Test tools are not runtime application dependencies.

Verified in Node.js 24 and headless Chromium with WebGL:

- Eight model tests: sixteen labels; independent bidirectional movement; ten reachable transitions in either joint order; hinge limits; fixed bone lengths and attached hands/feet; knee angle alignment and no seated upward over-rotation; elbow/wrist local angles; ankle directions; camera-independent tolerance; bilingual dictionary completeness.
- Browser checks: enlarged single target and removed old controls; prediction gate; direct holding and release; longer hold produces greater movement; all sixteen diagram markers control the correct joint/direction; keyboard hold and partial replay; language/state retention; immutable records; running/dancing/hand/foot reference rendering; CSV; narrow layout; non-overlapping label rails and mesh-accurate endpoints across multiple poses/camera angles; explicit WebGL fallback; no JavaScript errors.
