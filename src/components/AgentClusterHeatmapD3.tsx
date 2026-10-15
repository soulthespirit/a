import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import { 
  Grid, 
  Activity, 
  Flame, 
  Zap, 
  Maximize2, 
  Minimize2, 
  RotateCcw, 
  Info, 
  Sliders, 
  Sparkles,
  Layers,
  ArrowRight
} from 'lucide-react';
import { AgentInfo, AgentId } from '../types/cockpit';
import { soundFx } from '../utils/audioSynthesizer';

export interface AgentClusterHeatmapD3Props {
  agents: AgentInfo[];
  onSelectAgent?: (id: AgentId) => void;
  className?: string;
  isStageMode?: boolean;
}

export type HeatmapMode = 'synergy' | 'ratio' | 'density';
export type HeatmapPalette = 'amber' | 'plasma' | 'inferno';

interface CellData {
  rowAgent: AgentInfo;
  colAgent: AgentInfo;
  rowIndex: number;
  colIndex: number;
  throughput: number;     // Row agent completed tasks
  currentLoad: number;    // Col agent current load %
  value: number;          // Computed metric (0 - 100)
  ratio: number;          // Throughput vs load ratio
  crossTalkOps: number;   // Cross-agent data flow (ops/sec)
  status: 'OPTIMAL' | 'ELEVATED' | 'BALANCED';
}

export const AgentClusterHeatmapD3: React.FC<AgentClusterHeatmapD3Props> = ({
  agents,
  onSelectAgent,
  className = '',
  isStageMode = false
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [activeMode, setActiveMode] = useState<HeatmapMode>('synergy');
  const [activePalette, setActivePalette] = useState<HeatmapPalette>('amber');
  const [hoveredCell, setHoveredCell] = useState<CellData | null>(null);
  const [selectedCell, setSelectedCell] = useState<{ r: number; c: number } | null>(null);

  // Short labels for the 7 agents
  const agentShortNames: Record<string, string> = {
    ceo: 'CEO',
    pm: 'PM',
    ba: 'BA',
    designer: 'UX/UI',
    architect: 'ARCH',
    dev: 'DEV',
    qa: 'QA'
  };

  // Ensure 7 agents exist, fallback if less
  const clusterAgents = useMemo(() => {
    if (agents.length >= 7) return agents.slice(0, 7);
    return agents;
  }, [agents]);

  // Generate 7x7 matrix dataset representing Historical Throughput vs Current Load
  const matrixData = useMemo<CellData[]>(() => {
    if (clusterAgents.length === 0) return [];

    const maxThroughput = Math.max(...clusterAgents.map(a => a.completedTasks || 100), 800);
    const cells: CellData[] = [];

    clusterAgents.forEach((rowAg, r) => {
      const throughputNorm = (rowAg.completedTasks || 100) / maxThroughput; // 0.0 - 1.0

      clusterAgents.forEach((colAg, c) => {
        const loadNorm = (colAg.loadPercent || 50) / 100; // 0.0 - 1.0

        // Inherent structural affinity between agents (e.g. Architect ↔ Dev, Dev ↔ QA, CEO ↔ PM)
        let affinity = 1.0;
        if (r === c) affinity = 1.25; // Diagonal self-execution
        if ((rowAg.id === 'dev' && colAg.id === 'qa') || (rowAg.id === 'qa' && colAg.id === 'dev')) affinity = 1.35;
        if ((rowAg.id === 'architect' && colAg.id === 'dev') || (rowAg.id === 'dev' && colAg.id === 'architect')) affinity = 1.3;
        if ((rowAg.id === 'ceo' && colAg.id === 'pm') || (rowAg.id === 'pm' && colAg.id === 'ceo')) affinity = 1.2;
        if ((rowAg.id === 'pm' && colAg.id === 'ba') || (rowAg.id === 'ba' && colAg.id === 'pm')) affinity = 1.15;

        // Metric 1: Cluster Synergy (Throughput scaled by target agent's active load capacity)
        const synergyScore = Math.min(100, Math.max(15, Math.round(
          (throughputNorm * 0.52 + loadNorm * 0.48) * 88 * affinity
        )));

        // Metric 2: Ratio (Throughput-to-Load equilibrium)
        const ratioVal = Number(((rowAg.completedTasks / Math.max(10, colAg.loadPercent * 5)) * affinity).toFixed(2));
        const ratioScore = Math.min(100, Math.max(10, Math.round((ratioVal / 2.5) * 100)));

        // Metric 3: Cross-Talk Density
        const crossOps = Math.round((rowAg.completedTasks * 0.4 + colAg.loadPercent * 4.2) * affinity);
        const densityScore = Math.min(100, Math.max(20, Math.round((crossOps / 800) * 100)));

        let chosenVal = synergyScore;
        if (activeMode === 'ratio') chosenVal = ratioScore;
        if (activeMode === 'density') chosenVal = densityScore;

        let status: 'OPTIMAL' | 'ELEVATED' | 'BALANCED' = 'BALANCED';
        if (chosenVal >= 80) status = 'ELEVATED';
        else if (chosenVal >= 55) status = 'OPTIMAL';

        cells.push({
          rowAgent: rowAg,
          colAgent: colAg,
          rowIndex: r,
          colIndex: c,
          throughput: rowAg.completedTasks,
          currentLoad: colAg.loadPercent,
          value: chosenVal,
          ratio: ratioVal,
          crossTalkOps: crossOps,
          status
        });
      });
    });

    return cells;
  }, [clusterAgents, activeMode]);

  // Color interpolator selection using D3
  const getColorScale = useMemo(() => {
    const domain = [15, 95];

    if (activePalette === 'plasma') {
      return d3.scaleSequential()
        .domain(domain)
        .interpolator(d3.interpolatePlasma);
    }
    if (activePalette === 'inferno') {
      return d3.scaleSequential()
        .domain(domain)
        .interpolator(d3.interpolateInferno);
    }

    // Default: Cyber Amber & Warm Obsidian Palette
    return d3.scaleSequential()
      .domain(domain)
      .interpolator(d3.interpolateRgbBasis([
        '#100c08', // dark obsidian
        '#2e1507', // deep ember
        '#5e2606', // rust amber
        '#a84807', // fiery amber
        '#e06b12', // bright orange
        '#ff9e1b', // cyber gold
        '#ffcf4d', // radiant yellow
        '#fff6db'  // peak thermal white
      ]));
  }, [activePalette]);

  // D3 Heatmap Rendering
  useEffect(() => {
    if (!svgRef.current || matrixData.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    // Canvas Dimensions
    const width = 540;
    const height = 480;
    const margin = { top: 68, right: 35, bottom: 42, left: 95 };

    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const agentIds = clusterAgents.map(a => a.id);

    // Scales
    const xScale = d3.scaleBand()
      .domain(agentIds)
      .range([0, innerWidth])
      .padding(0.06);

    const yScale = d3.scaleBand()
      .domain(agentIds)
      .range([0, innerHeight])
      .padding(0.06);

    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Top X-Axis Label: CURRENT LOAD % (Columns)
    svg.append('text')
      .attr('x', margin.left + innerWidth / 2)
      .attr('y', 16)
      .attr('text-anchor', 'middle')
      .attr('fill', '#ffb259')
      .attr('font-size', '10px')
      .attr('font-family', 'JetBrains Mono, monospace')
      .attr('font-weight', 'bold')
      .attr('letter-spacing', '1.5px')
      .text('CURRENT LOAD % (CLUSTER COLUMNS)');

    // Left Y-Axis Label: HISTORICAL THROUGHPUT (Rows)
    svg.append('text')
      .attr('transform', `translate(16, ${margin.top + innerHeight / 2}) rotate(-90)`)
      .attr('text-anchor', 'middle')
      .attr('fill', '#ffb259')
      .attr('font-size', '10px')
      .attr('font-family', 'JetBrains Mono, monospace')
      .attr('font-weight', 'bold')
      .attr('letter-spacing', '1.5px')
      .text('HISTORICAL THROUGHPUT (ROWS)');

    // Column Headers (Top) with Load Badges
    const colHeaders = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top - 8})`);

    clusterAgents.forEach(agent => {
      const x = (xScale(agent.id) || 0) + xScale.bandwidth() / 2;
      const colG = colHeaders.append('g')
        .attr('transform', `translate(${x}, 0)`)
        .attr('cursor', 'pointer')
        .on('click', () => {
          soundFx.playClick(1100);
          onSelectAgent?.(agent.id);
        });

      colG.append('text')
        .attr('text-anchor', 'middle')
        .attr('y', -16)
        .attr('fill', '#ffffff')
        .attr('font-size', '10px')
        .attr('font-weight', 'bold')
        .attr('font-family', 'JetBrains Mono, monospace')
        .text(agentShortNames[agent.id] || agent.name.split(' ')[0]);

      // Load % badge
      colG.append('text')
        .attr('text-anchor', 'middle')
        .attr('y', -4)
        .attr('fill', agent.loadPercent > 80 ? '#f43f5e' : '#46e39a')
        .attr('font-size', '9px')
        .attr('font-family', 'JetBrains Mono, monospace')
        .text(`${agent.loadPercent}%`);
    });

    // Row Headers (Left) with Completed Tasks
    const rowHeaders = svg.append('g')
      .attr('transform', `translate(${margin.left - 8},${margin.top})`);

    clusterAgents.forEach(agent => {
      const y = (yScale(agent.id) || 0) + yScale.bandwidth() / 2;
      const rowG = rowHeaders.append('g')
        .attr('transform', `translate(0, ${y})`)
        .attr('cursor', 'pointer')
        .on('click', () => {
          soundFx.playClick(1100);
          onSelectAgent?.(agent.id);
        });

      rowG.append('text')
        .attr('text-anchor', 'end')
        .attr('y', -2)
        .attr('fill', '#ffffff')
        .attr('font-size', '10px')
        .attr('font-weight', 'bold')
        .attr('font-family', 'JetBrains Mono, monospace')
        .text(agentShortNames[agent.id] || agent.name.split(' ')[0]);

      // Completed Tasks badge
      rowG.append('text')
        .attr('text-anchor', 'end')
        .attr('y', 10)
        .attr('fill', '#ffb259')
        .attr('font-size', '8px')
        .attr('font-family', 'JetBrains Mono, monospace')
        .text(`${agent.completedTasks} tasks`);
    });

    // Crosshair Guide Rectangles (rendered under cells)
    const crosshairX = g.append('rect')
      .attr('class', 'crosshair-col')
      .attr('y', 0)
      .attr('height', innerHeight)
      .attr('fill', 'rgba(0, 240, 255, 0.08)')
      .attr('stroke', 'rgba(0, 240, 255, 0.3)')
      .attr('stroke-dasharray', '2 2')
      .attr('opacity', 0)
      .attr('pointer-events', 'none');

    const crosshairY = g.append('rect')
      .attr('class', 'crosshair-row')
      .attr('x', 0)
      .attr('width', innerWidth)
      .attr('fill', 'rgba(255, 138, 31, 0.08)')
      .attr('stroke', 'rgba(255, 138, 31, 0.3)')
      .attr('stroke-dasharray', '2 2')
      .attr('opacity', 0)
      .attr('pointer-events', 'none');

    // Draw Heatmap Cells
    const cellGroups = g.selectAll('.heatmap-cell')
      .data(matrixData)
      .enter()
      .append('g')
      .attr('class', 'heatmap-cell')
      .attr('transform', d => `translate(${xScale(d.colAgent.id)}, ${yScale(d.rowAgent.id)})`)
      .attr('cursor', 'pointer');

    // Rectangles
    cellGroups.append('rect')
      .attr('width', xScale.bandwidth())
      .attr('height', yScale.bandwidth())
      .attr('rx', 4)
      .attr('ry', 4)
      .attr('fill', d => getColorScale(d.value))
      .attr('stroke', d => (d.rowIndex === d.colIndex ? '#ffb259' : 'rgba(255, 255, 255, 0.06)'))
      .attr('stroke-width', d => (d.rowIndex === d.colIndex ? 1.5 : 1))
      .attr('stroke-dasharray', d => (d.rowIndex === d.colIndex ? '3 1' : 'none'))
      .style('transition', 'fill 0.3s ease, stroke 0.2s ease');

    // Monospace numeric values inside cells
    cellGroups.append('text')
      .attr('x', xScale.bandwidth() / 2)
      .attr('y', yScale.bandwidth() / 2 + 3.5)
      .attr('text-anchor', 'middle')
      .attr('font-size', '9.5px')
      .attr('font-family', 'JetBrains Mono, monospace')
      .attr('font-weight', '600')
      .attr('fill', d => (d.value > 65 ? '#ffffff' : '#cfbeae'))
      .attr('pointer-events', 'none')
      .text(d => (activeMode === 'ratio' ? `${d.ratio}x` : `${d.value}%`));

    // Diagonal Indicator: Subtle dot on primary self-executing diagonal (i == j)
    cellGroups.filter(d => d.rowIndex === d.colIndex)
      .append('circle')
      .attr('cx', xScale.bandwidth() - 5)
      .attr('cy', 5)
      .attr('r', 1.8)
      .attr('fill', '#00f0ff')
      .attr('pointer-events', 'none');

    // Interactive Hover & Click Listeners
    cellGroups
      .on('mouseenter', (event, d) => {
        setHoveredCell(d);
        soundFx.playClick(900 + d.value * 4);

        // Highlight Crosshair
        crosshairX
          .attr('x', xScale(d.colAgent.id) || 0)
          .attr('width', xScale.bandwidth())
          .attr('opacity', 1);

        crosshairY
          .attr('y', yScale(d.rowAgent.id) || 0)
          .attr('height', yScale.bandwidth())
          .attr('opacity', 1);

        d3.select(event.currentTarget as SVGGElement).select('rect')
          .attr('stroke', '#00f0ff')
          .attr('stroke-width', 2.2)
          .attr('filter', 'drop-shadow(0 0 6px rgba(0, 240, 255, 0.8))');
      })
      .on('mouseleave', (event, d) => {
        crosshairX.attr('opacity', 0);
        crosshairY.attr('opacity', 0);

        const isDiag = d.rowIndex === d.colIndex;
        d3.select(event.currentTarget as SVGGElement).select('rect')
          .attr('stroke', isDiag ? '#ffb259' : 'rgba(255, 255, 255, 0.06)')
          .attr('stroke-width', isDiag ? 1.5 : 1)
          .attr('filter', 'none');
      })
      .on('click', (_event, d) => {
        soundFx.playNodeSelect();
        setSelectedCell({ r: d.rowIndex, c: d.colIndex });
        onSelectAgent?.(d.rowAgent.id);
      });

  }, [matrixData, clusterAgents, getColorScale, activeMode, onSelectAgent]);

  // Summary Metrics computed across the 7x7 matrix
  const clusterSummary = useMemo(() => {
    if (matrixData.length === 0) return { mean: 0, peak: null, elevatedCount: 0 };
    const values = matrixData.map(d => d.value);
    const mean = Math.round(values.reduce((a, b) => a + b, 0) / values.length);
    const sorted = [...matrixData].sort((a, b) => b.value - a.value);
    const peak = sorted[0] || null;
    const elevatedCount = matrixData.filter(d => d.value >= 80).length;
    return { mean, peak, elevatedCount };
  }, [matrixData]);

  return (
    <div 
      ref={containerRef}
      className={`panel-tactical p-3.5 flex flex-col justify-between select-none ${className}`}
    >
      
      {/* Heatmap Header with Controls */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2 mb-2 border-b border-[#ff8a1f]/20">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded bg-[#ff8a1f]/15 border border-[#ff8a1f]/30 text-[#ff8a1f]">
            <Grid className="w-3.5 h-3.5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 font-condensed font-bold text-white tracking-wider text-xs">
              <span>7×7 CLUSTER HEATMAP</span>
              <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                D3 ENGINE
              </span>
            </div>
            <div className="text-[9px] text-[#9a8878] font-mono">
              Historical Throughput (Tasks) vs. Current Load (%)
            </div>
          </div>
        </div>

        {/* View Mode & Palette Controls */}
        <div className="flex items-center gap-1.5 flex-wrap text-[9px] font-mono">
          {/* Mode Selector */}
          <div className="flex items-center bg-[#090604] p-0.5 rounded border border-[#ff8a1f]/20">
            {(['synergy', 'ratio', 'density'] as HeatmapMode[]).map(m => (
              <button
                key={m}
                onClick={() => {
                  soundFx.playClick(1000);
                  setActiveMode(m);
                }}
                className={`px-1.5 py-0.5 rounded uppercase font-semibold transition-colors ${
                  activeMode === m
                    ? 'bg-[#ff8a1f] text-black font-bold shadow-sm'
                    : 'text-[#9a8878] hover:text-white'
                }`}
              >
                {m === 'synergy' ? 'SYNERGY' : m === 'ratio' ? 'RATIO' : 'OPS DENSITY'}
              </button>
            ))}
          </div>

          {/* Palette Selector */}
          <div className="flex items-center bg-[#090604] p-0.5 rounded border border-[#ff8a1f]/20">
            {(['amber', 'plasma', 'inferno'] as HeatmapPalette[]).map(p => (
              <button
                key={p}
                onClick={() => {
                  soundFx.playClick(1050);
                  setActivePalette(p);
                }}
                className={`px-1.5 py-0.5 rounded uppercase font-semibold transition-colors ${
                  activePalette === p
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                    : 'text-[#9a8878] hover:text-white'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* SVG Canvas Container */}
      <div className="relative w-full flex justify-center items-center my-1">
        <svg 
          ref={svgRef} 
          viewBox="0 0 540 480" 
          className="w-full max-w-[540px] h-auto drop-shadow-md overflow-visible"
        />

        {/* Floating Cell Inspection Tooltip */}
        {hoveredCell && (
          <div className="absolute top-2 right-2 bg-[#0d0905]/95 border border-[#ff8a1f]/60 p-2.5 rounded-lg shadow-2xl text-[10px] font-mono pointer-events-none z-30 max-w-[240px] backdrop-blur-md animate-fadeIn">
            <div className="flex items-center justify-between text-[#ffb259] font-bold border-b border-[#ff8a1f]/20 pb-1 mb-1.5">
              <span>INTERCONNECT CELL ({hoveredCell.rowIndex},{hoveredCell.colIndex})</span>
              <span className="text-cyan-300">
                {hoveredCell.rowIndex === hoveredCell.colIndex ? 'SELF-LOAD' : 'CROSS-TALK'}
              </span>
            </div>

            <div className="space-y-1 text-[#cfbeae]">
              <div className="flex justify-between">
                <span>Row (Throughput):</span>
                <b className="text-white font-semibold">{hoveredCell.rowAgent.name}</b>
              </div>
              <div className="flex justify-between pl-2 text-[9px] text-amber-300">
                <span>Completed Tasks:</span>
                <b>{hoveredCell.throughput.toLocaleString()} tasks</b>
              </div>

              <div className="flex justify-between pt-1">
                <span>Col (Capacity):</span>
                <b className="text-white font-semibold">{hoveredCell.colAgent.name}</b>
              </div>
              <div className="flex justify-between pl-2 text-[9px] text-[#46e39a]">
                <span>Current Load:</span>
                <b>{hoveredCell.currentLoad}%</b>
              </div>

              <div className="flex justify-between pt-1 border-t border-neutral-800 text-white font-bold">
                <span>Cluster Synergy:</span>
                <span className="text-[#ffb259]">{hoveredCell.value}%</span>
              </div>
              <div className="flex justify-between text-[9px] text-neutral-400">
                <span>Cross-Ops:</span>
                <span>{hoveredCell.crossTalkOps} ops/s</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* D3 Color Bar Legend & Cluster Summary Telemetry */}
      <div className="pt-2 mt-1 border-t border-[#ff8a1f]/15 flex flex-wrap items-center justify-between gap-2 text-[9px] font-mono text-[#9a8878]">
        {/* Dynamic Color Scale Legend */}
        <div className="flex items-center gap-2">
          <span>0%</span>
          <div 
            className="w-24 sm:w-32 h-2 rounded-full border border-white/10"
            style={{
              background: activePalette === 'plasma'
                ? 'linear-gradient(to right, #0d0887, #6a00a8, #b12a90, #e16462, #fca636, #f0f921)'
                : activePalette === 'inferno'
                  ? 'linear-gradient(to right, #000004, #420a68, #932667, #dd513a, #fca50a, #fcffa4)'
                  : 'linear-gradient(to right, #100c08, #5e2606, #a84807, #e06b12, #ff9e1b, #fff6db)'
            }}
          />
          <span>100% (PEAK)</span>
        </div>

        {/* Summary Stats */}
        <div className="flex items-center gap-3">
          <span>CLUSTER MEAN: <b className="text-white">{clusterSummary.mean}%</b></span>
          {clusterSummary.peak && (
            <span>
              PEAK INTERCONNECT: <b className="text-[#ffb259]">
                {agentShortNames[clusterSummary.peak.rowAgent.id]} ↔ {agentShortNames[clusterSummary.peak.colAgent.id]} ({clusterSummary.peak.value}%)
              </b>
            </span>
          )}
          <span className="text-emerald-400 hidden sm:inline">● 49 MATRIX CELLS ACTIVE</span>
        </div>
      </div>

    </div>
  );
};
