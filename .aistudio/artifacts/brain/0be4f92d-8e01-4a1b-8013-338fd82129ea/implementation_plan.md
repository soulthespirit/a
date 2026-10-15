# Implementation Plan: Fused OpenMausBot Command Center & Embedded Workflow Canvas

Synthesizes the newly provided **OpenMausBot Command Center** design (warm obsidian aesthetic, fiery amber and cyber orange glow, tactical corner-bracket panels, SVG sparkline KPI matrix, conversation type donut ring, real-time insights area chart, and automation pipeline) with the current interactive **Workflow Canvas**, embedding the node graph into the central stage and synchronizing the 5-stage automation pipeline with live multi-agent execution.

---

### User Review & Critical Decisions

> [!IMPORTANT]
> The following user preferences were confirmed and are locked into the unified design:
>
> - **Confirmed Decision 1 (Embedded Workflow Canvas)**: The interactive Workflow Canvas (pan/zoom, draggable agent nodes, glowing bezier wires, and node inspector) is directly embedded inside the central command stage, co-existing with the animated AI Core and communication channel chips.
> - **Confirmed Decision 2 (Warm Obsidian & Fiery Amber Glow)**: The combined interface adopts the new warm obsidian theme (`--bg: #060504`, `--pn: rgba(22,15,10,0.82)`, `--or: #ff8a1f`, `--or2: #ffb259`, `--ln: rgba(255,138,31,0.26)`) with tactical corner-bracket accents (`::before` / `::after`), radial orange lighting, and high-legibility tabular typography (`Barlow Condensed` / `JetBrains Mono`).
> - **Confirmed Decision 3 (Real-Time Pipeline Synchronization)**: The 5-stage Automation Pipeline (`TRIGGER` → `ROUTE` → `PROCESS` → `RESPOND` → `LEARN`) illuminates sequentially in real time as workflow nodes and actions execute through the server-side Gemini API.
> - **Confirmed Decision 4 (No Redundant Left Bot Bar)**: All agent list and bot navigation remain exclusively in the native OpenMausBot desktop sidebar; internal duplicate agent list panels are eliminated from the cockpit grid.

---

### 1. Proposed Architecture & Component Structure

#### Layout Hierarchy (Contiguous Command Center Grid)

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                   OpenMausBot Native App Frame                                   │
├──────────────┬───────────────────────────────────────────────────────────────────────────────────┤
│ Native       │ TOP HEADER: OPEN MAUSE BOT · Core Online · Uptime 00:00:00 · Sync Time            │
│ Sidebar      ├───────────────────────────────────────────────────────────────────────────────────┤
│ (240px)      │ TOP KPI BAR (6 Cards with Real-Time Sparklines & Badges):                         │
│ • macOS Dots │ [ACTIVE CHATS] [TASKS TODAY] [AGENTS ONLINE] [REPLIES / MIN] [AVG RESP] [UPTIME]  │
│ • Computer   ├─────────────────────────────────┬─────────────────────────────────────────────────┤
│   Picker     │ 3-COLUMN MASTER WORKSPACE:      │                                                 │
│ • Search     │ ┌─────────────────────────────┐ │ ┌─────────────────────────────────────────────┐ │
│ • Pinned     │ │ LEFT COLUMN:                │ │ │ RIGHT COLUMN:                               │ │
│   JARVIS     │ │ 1. Live Agent Waves (spark) │ │ │ 1. Real-Time Insights (SVG area chart)      │ │
│ • Bots List  │ │ 2. Conversation Types Donut │ │ │ 2. Top Intents (progress bars)              │ │
│   Accordion  │ │ 3. Memory Stats (8.4k+ rec) │ │ │ 3. System Health (100% OK ring + checks)    │ │
│ • Routines,  │ └─────────────────────────────┘ │ └─────────────────────────────────────────────┘ │
│   Triggers,  │ ┌───────────────────────────────────────────────────────────────────────────────┐ │
│   Apps       │ │ CENTER COLUMN (STAGE):                                                        │ │
│              │ │ • Embedded Interactive Workflow Canvas (Pan/Zoom, Draggable Nodes, Wires)     │ │
│              │ │ • Central AI Core (Nova Engine) with Radiating Conduits & Channel Chips       │ │
│              │ │ • Stage View Toggle (Unified Stage with Canvas Overlay / Integrated Graph)    │ │
│              │ │ • AUTOMATION PIPELINE (TRIGGER → ROUTE → PROCESS → RESPOND → LEARN)          │ │
│              │ └───────────────────────────────────────────────────────────────────────────────┘ │
│              ├───────────────────────────────────────────────────────────────────────────────────┤
│              │ BOTTOM CHASSIS STRIP:                                                             │
│              │ • Left: Live Activity Log (Streaming traces, Gemini reasoning, and timestamps)    │
│              │ • Right: Commands Bay (SCAN, OPTIMIZE, PROTECT, RESTORE, EVOLVE + Quick Triggers) │
│              │          Interactive Terminal CLI Form with working Gemini backend runner         │
└──────────────┴───────────────────────────────────────────────────────────────────────────────────┘
```

---

### 2. Detailed Subsystem Specifications

#### A. Top Header & 6-KPI Sparkline Strip
- **Header**:
  - `OPEN MAUSE BOT` title with glowing amber neon text shadow.
  - Subtitle: `Your AI operator. One core, every channel, always on.`
  - Status indicators: `CORE ONLINE` (pulsing emerald dot), live running `UPTIME` timer, and real-time localized `SYNC` clock.
- **6 KPI Cards**:
  1. `ACTIVE CHATS`: Real-time session count (e.g. `532`) with dynamic gain badge and live SVG sparkline.
  2. `TASKS TODAY`: Processed tasks (e.g. `18,247`) with daily gain percentage and live SVG sparkline.
  3. `AGENTS ONLINE`: Swarm availability (`7 / 7` or `12 / 12`) with health status.
  4. `REPLIES / MIN`: Dynamic throughput calculation (`~415 per sec`) with sparkline.
  5. `AVG RESPONSE`: Latency reading dynamically bound to `thoughtLatencyMs` (`0.68s` / `450ms`).
  6. `UPTIME`: `99.99%` system availability indicator.

#### B. Left Column Telemetry
- **Live Agent Waves**: Shows all active swarm agents with real-time SVG sparklines and load percentage numbers.
- **Conversation Types Donut Ring**: Conic gradient ring displaying conversational distribution (Sales 38%, Support 28%, Booking 15%, Upsell 10%) with color-coded swatches.
- **RAG Memory Stats**: Living memory counters (Contacts remembered `8,412+`, Notes stored `26,950+`, Recall accuracy `97.4%`, Learning rate `+3.1% / week`).

#### C. Center Column: Central Stage with Embedded Workflow Canvas
- **Tactical Stage Surface**: Dark amber obsidian panel with corner bracket notches (`::before`, `::after`).
- **Embedded Workflow Canvas Integration**:
  - The interactive node graph is hosted inside the central stage, featuring full pan, zoom, draggable nodes, and glowing bezier wires with photon particles.
  - The central AI Core connects via curved bezier conduits to external channel chips (`CONTENT`, `SUPPORT`, `LEADS`, `VOICE`, `SCHEDULER` on left; `TELEGRAM`, `WHATSAPP`, `EMAIL`, `CRM`, `DATABASE` on right).
  - Floating stage mode controls allow the operator to seamlessly toggle between the Node Flow view and the Holographic Core view, or display them fused in hybrid overlay mode.
- **5-Stage Automation Pipeline**:
  - Stages: `TRIGGER` → `ROUTE` → `PROCESS` → `RESPOND` → `LEARN`.
  - When an action or workflow is dispatched, each stage illuminates sequentially with an amber glow and inset shadow (`box-shadow: 0 0 18px rgba(255,138,31,.35) inset`), visualizing the live event pipeline.

#### D. Right Column Telemetry & Insights
- **Real-Time Insights**: 30-minute SVG area chart displaying live rolling volume, alongside micro-metrics: `82% Engagement`, `91% Resolved`, `4.8 Satisfaction`.
- **Top Intents**: Real-time progress bars with dynamic widths for Product Information, Pricing Inquiry, Technical Support, Order Status, and Appointment Booking.
- **System Health**: 100% OK circular gauge ring with green status indicators for AI Engine, Voice, Integrations, and Security.

#### E. Bottom Activity & Command Deck
- **Live Activity Streaming Log**: Monospace trace log showing real-time timestamps, incoming channel events, agent consensus logs, and Gemini model outputs.
- **Commands Bay**:
  - Quick action pads: `SCAN`, `OPTIMIZE`, `PROTECT`, `RESTORE`, `EVOLVE`, plus Tier-1 operations (`DEPLOY AGENTS`, `RUN WORKFLOW`, `SYNC VAULT`).
  - Interactive Terminal CLI Form: Operators can type custom natural language or CLI commands (`$ ...`), which execute against the `/api/gemini/action` endpoint with real responses rendered into the activity log.

---

### 3. Verification Plan

1. **Build & Type Checking**:
   - Run `npm run lint` and `compile_applet` to verify clean compilation with zero TypeScript errors.
2. **Visual & Layout Alignment**:
   - Verify warm obsidian aesthetic (`#060504`) with corner brackets and fiery amber glow.
   - Verify 6 KPI sparklines, donut ring, SVG area chart, and 5-stage pipeline rendering.
3. **Workflow & Stage Interaction**:
   - Confirm Workflow Canvas pan/zoom and node dragging work smoothly inside the central stage.
   - Trigger `RUN WORKFLOW` and verify pipeline stages highlight in sync with node execution.
4. **Command Execution**:
   - Test clicking command buttons (`SCAN`, `OPTIMIZE`, etc.) and typing custom prompts in the command input form, confirming real logs stream into the Live Activity log.
