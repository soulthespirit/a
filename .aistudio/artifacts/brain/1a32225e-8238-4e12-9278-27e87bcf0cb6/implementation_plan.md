# Unified Core Intelligence Full-Width Stage Architecture

Integrate a dedicated, full-width **Unified Core Intelligence & AI Core** section directly above the Intelligence Stage, matching the provided screenshot design with live interactive channel chips, animated Bezier particle conduits, and a synchronized 5-step Automation Pipeline track.

## User Review & Critical Decisions

> [!IMPORTANT]
> The following decisions were confirmed during the interactive interview phase:

- **Confirmed Placement**: A dedicated, full-width section docked directly above the Intelligence Stage, spanning the complete 12-column viewport.
- **Confirmed Interactivity**: Channel chips (Content, Support, Leads, Voice, Scheduler on the left; Telegram, WhatsApp, Email, CRM, Database on the right) are interactive with live telemetry tooltips and click-to-filter capability.
- **Confirmed Pipeline Sync**: The 5-step Automation Pipeline (`01 TRIGGER` → `02 ROUTE` → `03 PROCESS` → `04 RESPOND` → `05 LEARN`) is fully animated and synchronized with real-time workflow simulations and execution states.

---

## 1. Overview & Core Concept

- **What It Does**: Renders a commanding, full-width operational showcase representing the OpenMausBot unified intelligence layer. Left communication channels stream inward toward a central golden holographic **AI CORE** (`UNIFIED INTELLIGENCE // Understand · Decide · Act`), which connects outward to external communication protocols and databases. Directly below sits the horizontal 5-stage Automation Pipeline showing atomic message progression.
- **Target Audience / Persona**: AI operators, founders, and engineers monitoring multichannel multi-agent operations in real time.
- **Key Value**: Provides an instantaneous high-level mental model of active communication conduits, agent load, and message dispatch flow before diving into granular stage-by-stage node inspectors or 3D vaults.

---

## 2. User Experience & Visual Design

### Key User Flows
1. **At-a-Glance Ingestion & Channel Status**:
   - The user sees 5 incoming channels on the left (`CONTENT`, `SUPPORT`, `LEADS`, `VOICE`, `SCHEDULER`) with live counts and active indicators.
   - Five outbound integrations on the right (`TELEGRAM`, `WHATSAPP`, `EMAIL`, `CRM`, `DATABASE`) with real-time connectivity status badges (`live`, `synced`, `healthy`).
2. **Central Holographic AI Core**:
   - Animated HTML5 canvas with rotating concentric dashed rings, glowing radial gold gradient, and flowing Bezier particle streams radiating between the channels and the AI core.
   - Core typography: `UNIFIED INTELLIGENCE` / `AI CORE` (bold display font) / `Understand · Decide · Act`.
3. **Synchronized Automation Pipeline**:
   - 5 sequential phase cards with amber active borders, glowing ring indicators, and dashed connector lines.
   - Selecting or simulating a workflow advances through the stages with affirmative sound feedback and visual highlighting.
4. **Channel Interaction & Filtering**:
   - Clicking any chip highlights its respective photon streams, filters the live streaming activity log to that channel, and displays quick operational stats in a sleek tooltip.

### Visual Identity & Theme
- **Color Palette**: Tactical Amber & Gold (`#ff8a1f`, `#ffb259`, `#e8c27a`), deep dark obsidian backdrop (`#060504`, `#0e0906`), emerald health accents (`#46e39a`), cyan diagnostic highlights (`#00F0FF`).
- **Typography**: `Barlow Condensed` for bold tactical headers, `JetBrains Mono` for tabular metrics and channel counts, `Barlow` for descriptive subtext.
- **Spatial Layout**: Full 12-column width (`col-span-12`), corner bracket accents (`.p::before`, `.p::after`), clean 3-part layout (Left Channels 150px, Center Stage Core 1fr, Right Channels 150px), responsive collapse on mobile.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Dedicated Full-Width Placement Above Stage**
  - *Chosen Approach*: Render the Unified Core Intelligence section as a top-level full-width block directly above the Intelligence Stage panels, ensuring immediate visual prominence without displacing the workflow canvas or telemetry dock.
  - *Why*: Perfectly matches the screenshot layout while keeping secondary tools (3D Vault, Workflow Canvas, Heatmap) accessible below.
- **Decision 2: High-Performance Canvas Rendering for Bezier Conduits**
  - *Chosen Approach*: Use a single hardware-accelerated 2D canvas context with `requestAnimationFrame` for the rotating rings and Bezier particle trajectories.
  - *Why*: Guarantees 60 FPS fluidity with minimal CPU/GPU overhead and zero DOM re-render lag.
- **Decision 3: Bidirectional State Synchronization**
  - *Chosen Approach*: Sync the 5 pipeline steps with the active executing action and workflow engine, allowing manual step selection or automatic progression.

---

## 4. Technical Architecture & Data Strategy

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       FULL-WIDTH COCKPIT VIEWPORT                           │
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │       UNIFIED CORE INTELLIGENCE SECTION (DEDICATED FULL-WIDTH)        │  │
│  │                                                                       │  │
│  │  ┌──────────────┐      ┌──────────────────────┐      ┌─────────────┐  │  │
│  │  │ LEFT CHIPS   │ ~~~~ │ HOLOGRAPHIC AI CORE  │ ~~~~ │ RIGHT CHIPS │  │  │
│  │  │ Content      │      │ Concentric Rotations │      │ Telegram    │  │  │
│  │  │ Support      │      │ Radial Golden Bloom  │      │ WhatsApp    │  │  │
│  │  │ Leads        │      │ Bezier Conduit Stream│      │ Email       │  │  │
│  │  │ Voice        │      │                      │      │ CRM         │  │  │
│  │  │ Scheduler    │      │ Understand•Decide•Act│      │ Database    │  │  │
│  │  └──────────────┘      └──────────────────────┘      └─────────────┘  │  │
│  │                                                                       │  │
│  │  ┌─────────────────────────────────────────────────────────────────┐  │  │
│  │  │ AUTOMATION PIPELINE: TRIGGER → ROUTE → PROCESS → RESPOND → LEARN│  │  │
│  │  └─────────────────────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │ INTELLIGENCE STAGE: Workflow Canvas / 3D Karpathy Vault / D3 Heatmap  │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │ TELEMETRY DOCK: Live Activity Streaming Logs & Operational Triggers   │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Component & State Plan
- **New Component: `UnifiedCoreIntelligenceStage.tsx`**:
  - Full-width container with responsive grid (`150px 1fr 150px` on desktop, stacked on mobile).
  - Canvas controller for smooth Bezier curves, photon particle flow, and triple-concentric rotating rings.
  - Interactive chip states with hover tooltips and selection handlers.
  - Integrated 5-stage Automation Pipeline with active step animation and sound triggers.
- **Integration in `UnifiedHybridCockpit.tsx`**:
  - Docked directly at the top of the central column above the multi-mode intelligence stage.
  - Connected to `activePipeStep`, `executingAction`, and channel filter state.
