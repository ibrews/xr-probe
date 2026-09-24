# XR Probe

XR Probe is a no-build WebXR capability readout for headset-browser testing. It records display, view, reference-space, input-source, hand-tracking, and select-event data in a world-locked panel that is easy to photograph.

## Quickstart

Open <https://ibrews.github.io/xr-probe/> on a headset, tap **Enter VR**, and photograph the panel. After leaving XR, copy the retained JSON snapshot for closer comparison.

## Things to Try

1. Enter once with hands and once with controllers; compare the input-source rows.
2. Add `?ar=1` to the URL to make immersive AR the default when the browser supports it.
3. Compare the Quest 3 and Vision Pro view FOV, framebuffer, and frame-rate values.
4. Pinch or press Select and confirm the panel moves back in front of your current head pose.

## Test

The test uses IWER 2.4.0 and Playwright from a checkout that provides both packages:

```sh
NODE_MODULES=/path/to/node_modules node tests/iwer-probe.mjs hand
NODE_MODULES=/path/to/node_modules node tests/iwer-probe.mjs controller
```

## License

MIT © Alex Coulombe Presents

## Receipt

- Implementation commit: `92e8a1deb88389abc2ece4104c04e81bd16228af`
- Live URL: <https://ibrews.github.io/xr-probe/>
- Inspected stereo screenshot: `/Users/alex/GH/xr-probe/test-results/xr-probe-hand.png`
- Did not pass: none

Hand-mode run:

```text
PASS  framebuffer has dimensions — {"width":1440,"height":900}
PASS  two views have finite FOV values — [{"eye":"left","left":38.659808254090095,"right":38.659808254090095,"up":45,"down":45},{"eye":"right","left":38.659808254090095,"right":38.659808254090095,"up":45,"down":45}]
PASS  two input sources — 2
PASS  hands use tracked-pointer
PASS  hands expose 25 joints — [{"present":true,"size":25,"wristPose":true},{"present":true,"size":25,"wristPose":true}]
PASS  hand-tracking feature enabled — ["anchors","bounded-floor","hand-tracking","hit-test","local","local-floor","mesh-detection","plane-detection","unbounded","viewer"]
PASS  left pinch increments selectstart — 0 → 1
SCREENSHOT  /Users/alex/GH/xr-probe/test-results/xr-probe-hand.png

ALL PASSED
```

Controller-mode run:

```text
PASS  framebuffer has dimensions — {"width":1440,"height":900}
PASS  two views have finite FOV values — [{"eye":"left","left":38.659808254090095,"right":38.659808254090095,"up":45,"down":45},{"eye":"right","left":38.659808254090095,"right":38.659808254090095,"up":45,"down":45}]
PASS  two input sources — 2
PASS  controllers expose 4 axes — [{"buttons":7,"axes":4,"pressedIndices":[],"axesValues":[null,null,0,0]},{"buttons":7,"axes":4,"pressedIndices":[],"axesValues":[null,null,0,0]}]
SCREENSHOT  /Users/alex/GH/xr-probe/test-results/xr-probe-controller.png

ALL PASSED
```
