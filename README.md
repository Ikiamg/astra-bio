# A.S.T.R.A.-Bio

An English-language astronaut health monitoring demo for the [2026 NASA Space Apps Challenge](https://www.spaceappschallenge.org/2026/challenges/health-monitoring-software/).

[Open the deployed demo](https://astra-bio.ikiamjosealvarezvega.workers.dev/)

## Demo walkthrough

1. Start in the crew cockpit on Day 25 for the 18% nominal MSCI.
2. Select Day 42 Solar Particle Event. Inspect the 86% MSCI and its 42%, 35%, and 23% driver shares.
3. Confirm the storm-shelter protocol and select Mars blackout.
4. Open Flight Surgeon. Compare 18 vs. 1 false-alert flags during acclimation and a 38-hour lead in the scripted solar event. Restore the link by selecting the 22-minute Mars mode, then advance the mission clock to simulate receipt of the packet.
5. Select Day 55 for the bone and neuro-ocular scenario or open Assessments to try the breathing pacer and reaction-time test.

## Run locally

Use Node.js 22 or later.

```sh
npm ci
npm run dev
```

To build and test the production assets, including caching for offline reloads:

```sh
npm run build
npm run preview
```

The downloadable offline ZIP includes the production `dist/` directory. With Python available, you can serve it locally without downloading JavaScript dependencies:

```sh
python -m http.server 4173 --bind 127.0.0.1 --directory dist
```

Open `http://127.0.0.1:4173`. In production or on localhost, visit once and wait for the service worker to install before reloading offline. The app and all its fonts, charts, telemetry, assessments, and exports are packaged together. External reference links require a network connection.

## Model and data

- `src/data/nasaMissionData.ts` defines the 60-day synthetic telemetry and scenario fixtures.
- `src/engine/astraBioEngine.ts` computes pre-update z-scores and the EWMA baseline, MSCI, model contributions, and comparisons.
- `public/nasa-data-sources.md` records every NASA source and describes how each is used. NASA's one-hour habitat ppCO₂ reference and Mars delay assumption are the two values used directly by the app. The linked datasets and other NASA values provide context.
- The daily fixed chart counts per-signal flags. The hourly solar-event comparison uses a separate symptom-level fixed gate. Results describe these scripted inputs and comparators. The risk model and assessments have no clinical validation.
- Assessment reaction times are measured in the browser. Breathing-related RMSSD gains and downlink delivery are simulations.
- Protocol confirmations are stored in the current browser. Click any crew signal for its recorded value, prior baseline and z-score. Use the Flight Surgeon telemetry slider to inspect each of the 60 days.

## Imagery

Mars mosaic from the Viking orbiters. Image credit: NASA/JPL-Caltech. [NASA Science image and metadata](https://science.nasa.gov/resource/mars-planet-globe/)

The demo is served from Cloudflare Workers Static Assets. The contents of `dist/` are the deployment artifact. See [Cloudflare Workers Static Assets](https://developers.cloudflare.com/workers/static-assets/) for the upload workflow.
