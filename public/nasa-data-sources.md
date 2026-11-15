# A.S.T.R.A.-Bio | NASA data and source register

This English-language NASA Space Apps Challenge 2026 prototype uses a deterministic, synthetic 60-day mission. NASA material provides a habitat limit, a communications assumption, published context, and countermeasure research. The telemetry is generated locally.

## Mission imagery

The dashboard uses NASA/JPL-Caltech's Valles Marineris hemisphere mosaic, assembled from 102 Viking Orbiter images. The source image was resized for the offline build. [NASA Science, Mars Planet Globe](https://science.nasa.gov/resource/mars-planet-globe/)

## NASA values used by the software

| Value | Where it appears | Primary source |
| --- | --- | --- |
| **3.0 mmHg** maximum one-hour mean cabin ppCO₂ | Crew telemetry comparison and the ground console chart reference line. The demo cabin readings are synthetic and represent one-hour observations at the replay sample times. | [NASA-STD-3001 Vol. 2 Rev. F, §6.2.1.3, V2 6004](https://standards.nasa.gov/system/files/tmp/NASA-STD-3001%20Vol%202%20Rev%20F.pdf) |
| **Up to 22 minutes** one-way Earth–Mars delay | Mars link selector and simulated downlink ETA. The ISS mode uses 0 seconds as a demo simplification. Blackout holds the packet onboard. The clock control advances the simulation to receipt. | [NASA HRP, Human Health and Performance](https://www.nasa.gov/wp-content/uploads/2024/01/human-health-and-performance.pdf) |

## Published NASA numbers displayed as context

| Published value | Interpretation | Primary source |
| --- | --- | --- |
| **<600 mSv** career effective space radiation dose | Crew health requirement. The demo radiation field is a synthetic daily dose rate. | [NASA-STD-3001 Vol. 1 Rev. C, §4.8.2, V1 4030](https://standards.nasa.gov/sites/default/files/standards/NASA/C/nasa-std-3001-vol-1-rev-c-signature.pdf) |
| **1.84 ± 0.33 mSv/day** | Curiosity cruise RAD GCR dose equivalent estimate excluding solar particle events, measured inside that vehicle. The simulated dose rate and SPE peak are authored inputs. | [NASA NTRS, PELBE presentation, with Zeitlin et al. (2013)](https://ntrs.nasa.gov/api/citations/20180007936/downloads/20180007936.pdf) |
| **70 days at 6° head-down tilt** | Duration and tilt of the NASA exercise bed-rest study cited as an acclimation analog. | [NASA OSDR, OSD-946](https://osdr.nasa.gov/bio/repo/data/studies/OSD-946) |
| **340 days on the ISS** | Duration for the flight twin in the paired NASA Twins Study. | [NASA Twins Study FAQ](https://www.nasa.gov/humans-in-space/twins-study/faqs-nasa-twins-study/) |

## Datasets and research linked in the app

- **OSD-570, Inspiration4.** Peripheral blood mononuclear cell multi-omics and immune profiling. The demo's HR, HRV and sleep time series are generated independently. Files and assay metadata are available from [NASA OSDR](https://osdr.nasa.gov/bio/repo/data/studies/OSD-570).
- **OSD-946, head-down tilt bed rest.** Human exercise countermeasure study in a ground analog. Study description, metadata, and public files are at [NASA OSDR](https://osdr.nasa.gov/bio/repo/data/studies/OSD-946).
- **MSL-M-RAD-3-RDR-V1.0.** Reduced RAD cruise and Martian surface observations. Archive metadata and access are at the [NASA Planetary Data System](https://pds.nasa.gov/ds-view/pds/viewProfile.jsp?dsid=MSL-M-RAD-3-RDR-V1.0).
- **Twins Study.** Paired flight and ground observations motivate personalized longitudinal monitoring. See the [NASA Twins Study results](https://www.nasa.gov/humans-in-space/twins-study/faqs-nasa-twins-study/).
- **ARED.** Resistive exercise and studies of bone maintenance in orbit. The prototype session adjustments are illustrative. See the [NASA ARED bone study summary](https://www.nasa.gov/news-release/nasa-study-provides-new-findings-on-protecting-astronauts-bones-through-diet-and-exercise/).
- **SANS and LBNP.** NASA describes headward fluid shift, neuro-ocular findings, and research into lower-body negative pressure. See the [NASA Human Research Roadmap](https://humanresearchroadmap.nasa.gov/Risks/risk.aspx?i=105).
- **SSLA.** Programmable solid-state lighting for circadian research. See the [NASA Human Research Roadmap lighting record](https://humanresearchroadmap.nasa.gov/Gaps/gap.aspx?i=703).
- **SPE shielding.** Dosimetry, shielding, and moving crew to protected areas during an event. See the [NASA OCHMO Radiation Protection technical brief](https://www.nasa.gov/wp-content/uploads/2023/12/ochmo-tb-020-radiation-protection.pdf).

## Additional reference

[PhysioNet's Physiologic Response to Changes in Posture](https://physionet.org/content/prcp/1.0.0/) is a short tilt/standing study with ECG and arterial pressure recordings from ten healthy volunteers. The prototype cites it for posture-response context. The NASA OSD-946 record provides separate ground-based microgravity analog context.

## Synthetic data and evaluation

The simulation generates day, HRV RMSSD (ms), resting HR (bpm), sleep efficiency (%), radiation dose (mSv/day), cabin ppCO₂ (mmHg), ARED compliance (%), projected change in bone mineral density (%), and core temperature (°C). The Flight Surgeon Console exports all 60 daily samples as CSV.

The scenario inputs, EWMA initial state and minimum scales, MSCI weights and cutoffs, PVT lapse criterion, breathing gain, and countermeasure settings are demo parameters. The Day 42 profile includes 2.15 mSv/day, 3.9 mmHg, 61% sleep efficiency, 25 ms RMSSD and a 0.4 °C increase from the prior day. It produces an MSCI of 86% and contributions of 42%, 35% and 23% from the autonomic, radiation and combined circadian/CO₂ factors respectively. Attribution describes the mathematical model.

The benchmark reports 18 fixed per-signal flags and 1 adaptive daily alert during a scripted 14-day acclimation without a labeled event. The solar-event lead compares the first MSCI ≥35 against the first resting HR ≥100 bpm or core temperature ≥38 °C in a scripted hourly replay. The +38-hour result depends on these scenario inputs and comparator definitions. The prototype has no clinical validation.
