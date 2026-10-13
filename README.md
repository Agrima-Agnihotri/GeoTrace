# GeoTrace GIS
### AI-Assisted As-Built Mapping for Underground Utilities

**Capture. Verify. Map. Build Safer Infrastructure.**

GeoTrace GIS is an AI-assisted geospatial platform designed to improve the accuracy and reliability of underground utility records. It captures pipeline routes, depth measurements, and field evidence before backfilling, compares actual installations against planned CAD drawings, and creates verified, searchable as-built records for future excavation and infrastructure management.

> **Our Vision:** A reliable, evidence-backed digital map of underground infrastructure that helps teams make safer, better-informed decisions before they dig.

---

## Table of Contents

- [The Problem](#the-problem)
- [Our Solution](#our-solution)
- [Key Features](#key-features)
- [How It Works](#how-it-works)
- [System Architecture](#system-architecture)
- [Technology Stack](#technology-stack)
- [Target Users](#target-users)
- [Expected Impact](#expected-impact)
- [Development Roadmap](#development-roadmap)
- [Limitations and Responsible Use](#limitations-and-responsible-use)
- [Future Scope](#future-scope)
- [Project Status](#project-status)
- [Collaboration](#collaboration)

---

## The Problem

Underground utilities such as water pipelines, gas lines, sewer networks, electrical cables, and telecommunications infrastructure are essential to modern cities. However, the records of their actual installed positions often differ from the original engineering plans.

During construction, pipelines may be shifted, rerouted, or installed at different depths. If these changes are not measured and documented before the trench is backfilled, the final records may remain incomplete or inaccurate.

### Key Challenges

- **Inaccurate utility maps:** Planned routes may not match the actual installation.
- **Missing depth information:** Field teams may lack reliable vertical measurements.
- **Excavation damage:** Unrecorded utilities can be struck during subsequent construction.
- **Costly rework:** Teams may need to repeat surveying and repair damaged infrastructure.
- **Fragmented records:** Drawings, survey measurements, photographs, and approvals may be stored separately.
- **Limited field accessibility:** Construction teams need reliable utility information at the worksite.

Traditional documentation can fail to establish a reliable connection between the original design, the actual installation, and the final approved record.

GeoTrace GIS addresses this gap by making accurate field documentation and verification an integral part of the construction workflow.

---

## Our Solution

GeoTrace GIS introduces an evidence-driven workflow for creating accurate **as-built utility records before backfilling**.

The platform combines field data capture, survey measurements, AI-assisted pipe and fitting detection, geospatial mapping, and human verification to document the actual underground installation.

### How GeoTrace GIS Helps

- Captures field imagery, survey measurements, and location metadata.
- Assists in detecting visible pipes and fittings using computer vision.
- Supports spatial reconstruction using survey control and photogrammetry.
- Compares planned CAD routes with actual measured routes and depths.
- Flags deviations for engineering review.
- Maintains separate draft and approved records.
- Enables searchable GIS records and compatible CAD/GIS exports.
- Supports AR visualization of previously recorded utility information.

The objective is to create a traceable, reusable record of what was actually installed—not merely what was originally planned.

---

## Key Features

### 1. Evidence-Backed Field Capture

Record exposed pipelines before backfilling using guided video or image capture, survey measurements, timestamps, and location metadata.

Original evidence can be retained to support later inspection and verification.

### 2. AI-Assisted Pipe Detection

Use computer vision to identify visible pipes, fittings, and relevant infrastructure in captured imagery.

Combine visual information with survey control to support spatial reconstruction. Detection and reconstruction results require validation against suitable reference measurements.

### 3. Planned vs. Actual Route Comparison

Compare the original design with the measured as-built installation.

- Visualize planned and actual routes on a map.
- Identify route deviations.
- Compare recorded depth measurements.
- Flag discrepancies for engineering review.

### 4. Verification and Approval Workflow

Support a structured review process in which authorized personnel can inspect supporting evidence, approve records, reject submissions, or request additional information.

Draft records remain distinguishable from approved records.

### 5. Geospatial Data Management

Organize utility records using spatial data and associated metadata.

The proposed database design supports project-level organization, utility geometry, evidence references, and approval history.

### 6. CAD and GIS Interoperability

Support data exchange with compatible engineering and geospatial workflows through formats such as:

- GeoJSON
- CSV
- DXF
- GeoPackage

Export availability depends on the implemented conversion and validation workflows.

### 7. AR-Based Field Visualization

Display previously recorded utility locations, route geometry, and depth labels through a compatible mobile camera view.

This feature is intended to help field personnel interpret existing records in context.

**Important:** AR displays stored information. It does not independently detect buried pipes or guarantee their current physical location.

---

## How It Works

GeoTrace GIS follows a seven-stage workflow.

```text
┌──────────────────────────────────────┐
│  1. PLAN                             │
│  Import or record the planned route  │
└──────────────────┬───────────────────┘
                   ▼
┌──────────────────────────────────────┐
│  2. CAPTURE                          │
│  Record exposed pipes and survey data│
└──────────────────┬───────────────────┘
                   ▼
┌──────────────────────────────────────┐
│  3. VALIDATE                         │
│  Check evidence and metadata         │
└──────────────────┬───────────────────┘
                   ▼
┌──────────────────────────────────────┐
│  4. RECONSTRUCT                      │
│  Assist detection and spatial mapping│
└──────────────────┬───────────────────┘
                   ▼
┌──────────────────────────────────────┐
│  5. COMPARE                          │
│  Identify route and depth deviations│
└──────────────────┬───────────────────┘
                   ▼
┌──────────────────────────────────────┐
│  6. REVIEW                           │
│  Approve or request corrections      │
└──────────────────┬───────────────────┘
                   ▼
┌──────────────────────────────────────┐
│  7. REUSE                            │
│  Search, export, map, and view in AR │
└──────────────────────────────────────┘
```

### Final Output

An evidence-backed, owner-approved as-built utility record containing available route geometry, depth measurements, supporting evidence, and review history.

---

## System Architecture

GeoTrace GIS is designed around four interconnected layers.

```text
┌─────────────────────────────────────────────┐
│              FIELD CAPTURE                  │
│                                             │
│  Mobile App | Camera | GNSS | Survey Inputs │
│              Offline Queue                  │
└──────────────────────┬──────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────┐
│            AI PROCESSING LAYER              │
│                                             │
│  FastAPI | Computer Vision | Reconstruction │
│       Metadata Validation | Jobs            │
└──────────────────────┬──────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────┐
│          GEOSPATIAL DATA LAYER              │
│                                             │
│ PostgreSQL + PostGIS | Evidence References  │
│     File Hashes | Audit Logs | Approvals    │
└──────────────────────┬──────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────┐
│       VISUALIZATION AND INTEGRATION         │
│                                             │
│ React Dashboard | MapLibre | CAD/GIS Export │
│                Mobile AR                    │
└─────────────────────────────────────────────┘
```

### Architecture Components

| Layer | Responsibility |
|---|---|
| Field Capture | Collect imagery, location metadata, and survey measurements |
| AI Processing | Assist with pipe detection, geometry reconstruction, and deviation analysis |
| Geospatial Data | Manage utility geometry, project records, evidence references, and approvals |
| Visualization | Display mapped utilities, route comparisons, review tools, exports, and AR overlays |

The modular architecture is intended to separate field data collection, processing, record management, and end-user visualization so individual components can evolve independently.

---

## Technology Stack

The following technologies form the proposed technical architecture. Their inclusion describes the intended design and does not imply that every component is already implemented.

| Technology | Purpose |
|---|---|
| Flutter / Native Android | Mobile field-capture application |
| Python | AI processing and backend development |
| FastAPI | Backend APIs and processing services |
| OpenCV | Computer vision and image processing |
| Photogrammetry | Support image-based spatial reconstruction |
| GNSS and Survey Equipment | Geographic positioning and reference measurements |
| PostgreSQL | Structured data storage |
| PostGIS | Geospatial storage and spatial queries |
| React | Web-based review and management dashboard |
| MapLibre | Interactive geospatial visualization |
| ARCore / ARKit | Mobile AR visualization |
| GeoJSON / CSV | Data interchange |
| DXF / GeoPackage | CAD and GIS data exchange |

---

## Target Users

### Primary Users

**Utility Companies**

Maintain accurate, searchable records of installed underground infrastructure for future maintenance and planning.

**Infrastructure Contractors**

Document completed pipeline installations before backfilling and reduce gaps between design drawings and final records.

**Field Surveyors**

Record coordinates, route alignment, and depth measurements using appropriate surveying methods.

### Secondary Users

- Municipal authorities and urban infrastructure departments.
- Civil engineers and engineering consultants.
- Construction planners and excavation teams.
- GIS professionals and infrastructure asset managers.

---

## Expected Impact

GeoTrace GIS is designed to improve infrastructure documentation and support safer excavation practices.

| Impact Area | Expected Benefit |
|---|---|
| Excavation Safety | Better access to documented utility locations |
| Documentation Quality | More complete and verifiable as-built records |
| Project Efficiency | Less repeated surveying and documentation rework |
| Cost Management | Potential reduction in avoidable repair and restoration expenses |
| Accountability | Traceable evidence and review history |
| Interoperability | Reusable records across compatible CAD and GIS tools |
| Long-Term Planning | Better information for infrastructure maintenance and expansion |

### Evaluation Metrics

The project can be evaluated using measurable indicators:

- Time required to produce an accepted as-built record.
- Horizontal and vertical measurement error against a reference survey.
- Pipe and fitting detection precision and recall.
- Percentage of records with complete supporting evidence.
- Percentage of records accepted without additional corrections.
- Time required to compare planned and actual utility routes.

Actual improvements should be established through pilot testing and comparison against reference measurements.

---

## Development Roadmap

The initial implementation strategy prioritizes water pipelines as the first use case before expanding to additional utility networks.

### Phase 1 — Core MVP

- Create and manage utility projects.
- Import or record planned pipeline routes.
- Capture field evidence and survey measurements.
- Store evidence references and associated metadata.
- Display utility routes on a map.

### Phase 2 — Water Pipeline Pilot

- Test the workflow at a suitable real-world site.
- Compare recorded geometry against a reference survey.
- Evaluate measurement accuracy and documentation time.
- Collect feedback from contractors and surveyors.

### Phase 3 — Verification and AR

- Develop the reviewer approval workflow.
- Maintain traceable record changes and review history.
- Prototype AR visualization of stored utility records.
- Evaluate usability and field-alignment limitations.

### Phase 4 — Expansion

- Extend support to gas, sewer, power, and telecommunications utilities.
- Improve CAD/GIS interoperability.
- Support multi-project and multi-site management.
- Explore city-scale underground utility information systems.

---

## Limitations and Responsible Use

GeoTrace GIS is intended to improve underground utility documentation. It is not a substitute for professional surveying or established excavation safety procedures.

### Technical Limitations

- AI-based detection depends on imagery quality and may produce incorrect results.
- Reliable positioning and depth measurements depend on appropriate equipment, calibration, survey methods, and reference data.
- Visual reconstruction does not automatically guarantee survey-grade accuracy.
- AR overlays may be affected by positioning errors, calibration, and outdated records.
- Exported records must preserve coordinate reference information and relevant measurement metadata.

### Data Integrity and Verification

- Original evidence should be retained wherever required by the project workflow.
- Record changes and approvals should be traceable.
- File hashes can help detect changes to stored evidence, but do not independently prove that the original evidence is authentic.
- Authorized personnel should review records before they are treated as authoritative.
- Unverified and approved records must remain distinguishable.

### Excavation Safety

The absence of a mapped utility must never be interpreted as proof that an area is safe to excavate.

Field teams must follow applicable utility-locating requirements, site procedures, and professional safety guidance before excavation.

The goal is to support better decisions through reliable records, measurable validation, and transparent review—not to replace essential safety checks.

---

## Future Scope

GeoTrace GIS aims to progress toward a comprehensive digital information layer for underground infrastructure.

Potential future developments include:

- Multi-utility mapping across larger geographic areas.
- Improved automated geometry reconstruction.
- Integration with municipal GIS and infrastructure asset-management systems.
- Change tracking across construction and maintenance projects.
- Enhanced mobile field workflows with offline synchronization.
- Spatial analysis for utility conflicts and excavation planning.
- A searchable, continuously improved record of verified underground infrastructure.

### Long-Term Vision: Google Earth for Underground Utilities

The long-term vision is to create a map-based experience for underground infrastructure, built incrementally from reliable, owner-approved records.

Instead of relying on assumptions or incomplete drawings, authorized users could explore documented underground utility networks, inspect recorded depth and route information, and access supporting evidence where available.

This vision depends on data quality, participating infrastructure owners, suitable survey references, and ongoing record maintenance.

---

## Project Status

GeoTrace GIS is a hackathon project with a proposed MVP roadmap focused on water-pipeline documentation.

The architecture and workflows described in this README represent the intended solution. Individual capabilities should be considered implemented only when supported by working code, validated outputs, and appropriate testing.

The immediate objective is to demonstrate a practical end-to-end workflow:

**Capture before backfilling. Compare against the design. Verify the evidence. Preserve the approved as-built record.**

---

## Collaboration

We welcome collaboration with:

- Utility providers and infrastructure contractors.
- Professional surveyors and civil engineers.
- GIS developers and geospatial researchers.
- Municipal authorities and infrastructure planners.

Potential pilot partners can help validate the workflow using a suitable test site, design drawings, and reference survey measurements.

### Interested in a Pilot?

We are looking for opportunities to test GeoTrace GIS on a water-pipeline installation and evaluate its accuracy, documentation workflow, and practical value in the field.

---

**GeoTrace GIS — Because what gets built should be mapped as it is.**
