# A.S.T.R.A.-Bio

A.S.T.R.A.-Bio is an independent, English-language demo for the [2026 NASA Space Apps Challenge](https://www.spaceappschallenge.org/2026/challenges/health-monitoring-software/).

[Open the Cloudflare demo](https://astra-bio.ikiamjosealvarezvega.workers.dev/)

## Walkthrough

1. The app opens on Day 42 in Mars delay mode. Inspect a telemetry card or open **All signals** to see daily and cumulative radiation, ARED load, estimated bone density change, the SANS risk score, and other observations.
2. Toggle a countermeasure checklist item and compare the simulated post-action score. Try the breathing pacer, simulated HRV boost, and 15-second reaction test.
3. Switch to **Flight Surgeon** and compare the 60-day benchmark with the 72-hour solar-event view. Explore the synchronized charts with the mission-day slider or by clicking a chart.
4. Select **Mars / Blackout** to hold the packet. Restore the delayed link, then advance the clock to simulate receipt. CSV and FHIR-inspired JSON exports run in the browser.
5. Open **Science & Data** for simulation parameters, equations, source links and the downloadable register.

## Run locally

With Node.js 22 or later:

```sh
npm ci
npm run dev
```

To build and test offline caching:

```sh
npm run build
npm run preview
```

The downloadable archive includes the compiled `dist/` directory. You can serve it locally with `python -m http.server 4173 --bind 127.0.0.1 --directory dist`. On localhost or HTTPS, visit once and wait for **Offline ready** before reloading without a network. The app bundles its image, fonts and simulation. External reference links use the network.

## Model and sources

The 60-day replay, 30-seed Monte Carlo benchmark, clinical cutoffs, automated actions, and risk scores are synthetic. The current simulated benchmark computes 84.8% fewer acclimation alerts and a 42.5-hour mean solar-event lead. The PVT measures actual browser interaction timing. The breathing response, starting assessments, and downlink delivery are simulated.

The engine and model configuration are in `src/engine/`. See the [NASA data and reference register](public/nasa-data-sources.md) for numerical references, research context, and credit for the Viking Mars mosaic from NASA/JPL-Caltech.

The prototype is served using Cloudflare Workers Static Assets. The `dist/` directory is the deployment artifact.

The original design and modeling approach came from the project team. Google Antigravity and Codex assisted with code and writing.
