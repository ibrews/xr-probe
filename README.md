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
