import * as THREE from 'three';
import { VaultNode } from '../components/KarpathyVault3D';

export type HeatmapMetric = 'composite' | 'access' | 'density' | 'recall';
export type HeatmapPalette = 'thermal' | 'cyber' | 'plasma';

export interface HeatmapConfig {
  enabled: boolean;
  metric: HeatmapMetric;
  palette: HeatmapPalette;
  gain: number; // 0.2 to 1.5 (default 0.85)
  radiusMultiplier: number; // 0.5 to 2.0 (default 1.0)
  showContours: boolean;
  showPeakLabels: boolean;
  blendMode: 'screen' | 'lighter';
}

export interface ClusterTelemetry {
  peakNodeLabel: string;
  peakAccessCount: number;
  meanAccessCount: number;
  maxClusterDensity: number;
  totalClusters: number;
}

// Temporary 3D vector for projection without allocations in the loop
const tempVec = new THREE.Vector3();

/**
 * Calculates spatial density for each node based on 3D Euclidean distances
 * to neighboring nodes in the vault graph.
 */
export function computeClusterDensities(nodes: VaultNode[]): Map<string, number> {
  const densityMap = new Map<string, number>();
  if (nodes.length === 0) return densityMap;

  // Bandwidth sigma for 3D Gaussian kernel (matches vault node spacing ~120 units)
  const sigma = 140;
  const twoSigmaSq = 2 * sigma * sigma;

  for (let i = 0; i < nodes.length; i++) {
    const n1 = nodes[i];
    let density = 0;

    for (let j = 0; j < nodes.length; j++) {
      if (i === j) continue;
      const n2 = nodes[j];
      const dx = n1.x - n2.x;
      const dy = n1.y - n2.y;
      const dz = n1.z - n2.z;
      const distSq = dx * dx + dy * dy + dz * dz;
      density += Math.exp(-distSq / twoSigmaSq);
    }
    densityMap.set(n1.id, density);
  }

  // Normalize densities to 0.0 - 1.0
  let maxDensity = 0.001;
  densityMap.forEach(d => {
    if (d > maxDensity) maxDensity = d;
  });

  densityMap.forEach((d, id) => {
    densityMap.set(id, Math.min(1.0, d / maxDensity));
  });

  return densityMap;
}

/**
 * Extracts live cluster telemetry for HUD indicators and legend.
 */
export function getClusterTelemetry(nodes: VaultNode[], densityMap: Map<string, number>): ClusterTelemetry {
  if (nodes.length === 0) {
    return {
      peakNodeLabel: 'None',
      peakAccessCount: 0,
      meanAccessCount: 0,
      maxClusterDensity: 0,
      totalClusters: 0
    };
  }

  let peakNode = nodes[0];
  let totalAccess = 0;
  let maxDensity = 0;

  for (const node of nodes) {
    totalAccess += node.accessCount;
    if (node.accessCount > peakNode.accessCount) {
      peakNode = node;
    }
    const d = densityMap.get(node.id) || 0;
    if (d > maxDensity) maxDensity = d;
  }

  return {
    peakNodeLabel: peakNode.label,
    peakAccessCount: peakNode.accessCount,
    meanAccessCount: Math.round(totalAccess / nodes.length),
    maxClusterDensity: Math.round(maxDensity * 100),
    totalClusters: Math.min(5, Math.ceil(nodes.length / 4))
  };
}

/**
 * Returns color stops for the specified heatmap palette.
 */
function getPaletteColors(palette: HeatmapPalette, alpha: number) {
  switch (palette) {
    case 'cyber':
      return [
        { stop: 0.0, color: `rgba(255, 255, 255, ${Math.min(1, alpha * 0.95)})` },
        { stop: 0.25, color: `rgba(0, 243, 255, ${Math.min(1, alpha * 0.85)})` },
        { stop: 0.55, color: `rgba(70, 227, 154, ${Math.min(1, alpha * 0.55)})` },
        { stop: 0.8, color: `rgba(139, 92, 246, ${Math.min(1, alpha * 0.25)})` },
        { stop: 1.0, color: 'rgba(12, 10, 24, 0)' }
      ];
    case 'plasma':
      return [
        { stop: 0.0, color: `rgba(255, 255, 255, ${Math.min(1, alpha * 0.95)})` },
        { stop: 0.25, color: `rgba(244, 63, 94, ${Math.min(1, alpha * 0.85)})` },
        { stop: 0.55, color: `rgba(217, 70, 239, ${Math.min(1, alpha * 0.55)})` },
        { stop: 0.8, color: `rgba(99, 102, 241, ${Math.min(1, alpha * 0.25)})` },
        { stop: 1.0, color: 'rgba(20, 10, 30, 0)' }
      ];
    case 'thermal':
    default:
      return [
        { stop: 0.0, color: `rgba(255, 255, 230, ${Math.min(1, alpha * 0.95)})` },
        { stop: 0.22, color: `rgba(255, 215, 0, ${Math.min(1, alpha * 0.85)})` },
        { stop: 0.52, color: `rgba(255, 138, 31, ${Math.min(1, alpha * 0.65)})` },
        { stop: 0.78, color: `rgba(220, 38, 38, ${Math.min(1, alpha * 0.35)})` },
        { stop: 1.0, color: 'rgba(40, 10, 5, 0)' }
      ];
  }
}

/**
 * Projects 3D node coordinates into 2D viewport coordinates and renders the intensity heatmap.
 */
export function renderVaultHeatmap({
  canvas,
  camera,
  nodes,
  densityMap,
  config,
  elapsed
}: {
  canvas: HTMLCanvasElement;
  camera: THREE.PerspectiveCamera;
  nodes: VaultNode[];
  densityMap: Map<string, number>;
  config: HeatmapConfig;
  elapsed: number;
}) {
  if (!config.enabled || !canvas || !camera) return;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const width = canvas.width;
  const height = canvas.height;

  // Clear previous frame
  ctx.clearRect(0, 0, width, height);

  if (nodes.length === 0) return;

  // Find min/max for normalization
  let minAccess = Infinity;
  let maxAccess = -Infinity;
  nodes.forEach(n => {
    if (n.accessCount < minAccess) minAccess = n.accessCount;
    if (n.accessCount > maxAccess) maxAccess = n.accessCount;
  });
  if (minAccess === maxAccess) maxAccess = minAccess + 1;

  // Projected node cache for this frame
  interface ProjectedHeatPoint {
    node: VaultNode;
    x: number;
    y: number;
    intensity: number;
    radius: number;
    depth: number;
  }

  const projectedPoints: ProjectedHeatPoint[] = [];

  for (const node of nodes) {
    tempVec.set(node.x, node.y, node.z);
    tempVec.project(camera);

    // Behind camera check
    if (tempVec.z >= 1.0) continue;

    // Convert normalized device coordinates to canvas pixels
    const px = ((tempVec.x + 1) / 2) * width;
    const py = ((-tempVec.y + 1) / 2) * height;

    // Out of view margin check
    if (px < -150 || px > width + 150 || py < -150 || py > height + 150) continue;

    // Calculate node intensity based on chosen metric
    const normAccess = Math.max(0.08, (node.accessCount - minAccess) / (maxAccess - minAccess));
    const normDensity = densityMap.get(node.id) || 0.5;
    const normRecall = node.currentRecallWeight || 0.5;

    let heatIntensity = 0.5;
    switch (config.metric) {
      case 'access':
        heatIntensity = normAccess;
        break;
      case 'density':
        heatIntensity = normDensity;
        break;
      case 'recall':
        heatIntensity = normRecall;
        break;
      case 'composite':
      default:
        // Weighted composite: access frequency (50%) + cluster density (35%) + recall activation (15%)
        heatIntensity = (normAccess * 0.5) + (normDensity * 0.35) + (normRecall * 0.15);
        break;
    }

    // Depth attenuation (nodes closer to camera appear slightly larger & more prominent)
    const depthFactor = Math.max(0.45, Math.min(1.4, 1.0 - (tempVec.z * 0.35)));
    const baseRadius = 55 * config.radiusMultiplier * depthFactor;
    const radius = baseRadius * (0.7 + heatIntensity * 0.65);

    projectedPoints.push({
      node,
      x: px,
      y: py,
      intensity: heatIntensity,
      radius,
      depth: tempVec.z
    });
  }

  // Set blending mode for luminous thermal accumulation
  ctx.save();
  ctx.globalCompositeOperation = config.blendMode === 'lighter' ? 'lighter' : 'screen';

  // 1. Draw Radial Heat Kernels
  for (const pt of projectedPoints) {
    const alpha = Math.min(1.0, pt.intensity * config.gain);
    if (alpha <= 0.01) continue;

    const grad = ctx.createRadialGradient(pt.x, pt.y, 0, pt.x, pt.y, pt.radius);
    const colorStops = getPaletteColors(config.palette, alpha);

    for (const stop of colorStops) {
      grad.addColorStop(stop.stop, stop.color);
    }

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(pt.x, pt.y, pt.radius, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  // 2. Optional: Draw Topological Iso-Density Contours
  if (config.showContours) {
    ctx.save();
    ctx.globalCompositeOperation = 'source-over';
    
    // Pulse phase for breathing organic animation
    const contourPulse = Math.sin(elapsed * 2.2) * 0.08;

    for (const pt of projectedPoints) {
      if (pt.intensity < 0.35) continue; // Only draw contours for moderate/high heat nodes

      // Contour colors matching palette
      let contourStroke = 'rgba(255, 138, 31, 0.4)';
      let innerStroke = 'rgba(255, 215, 0, 0.6)';
      if (config.palette === 'cyber') {
        contourStroke = 'rgba(0, 243, 255, 0.4)';
        innerStroke = 'rgba(70, 227, 154, 0.6)';
      } else if (config.palette === 'plasma') {
        contourStroke = 'rgba(217, 70, 239, 0.4)';
        innerStroke = 'rgba(244, 63, 94, 0.6)';
      }

      // Outer Isoline
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 4]);
      ctx.strokeStyle = contourStroke;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, pt.radius * (0.8 + contourPulse), 0, Math.PI * 2);
      ctx.stroke();

      // Inner Core Isoline (for high intensity peaks)
      if (pt.intensity >= 0.7) {
        ctx.setLineDash([2, 2]);
        ctx.strokeStyle = innerStroke;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, pt.radius * (0.45 - contourPulse), 0, Math.PI * 2);
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  // 3. Optional: Draw High-Intensity Cluster Peak Badges
  if (config.showPeakLabels) {
    ctx.save();
    ctx.globalCompositeOperation = 'source-over';
    ctx.font = '10px monospace';
    ctx.textBaseline = 'middle';

    // Sort to highlight top 4 hottest nodes
    const topPeaks = [...projectedPoints]
      .filter(p => p.intensity >= 0.65)
      .sort((a, b) => b.intensity - a.intensity)
      .slice(0, 4);

    for (const peak of topPeaks) {
      const labelText = `${Math.round(peak.intensity * 100)}% DENSITY`;
      const hitsText = `${peak.node.accessCount.toLocaleString()} HITS`;

      const badgeX = peak.x + 18;
      const badgeY = peak.y - 18;

      // Small tactical crosshair tick
      ctx.strokeStyle = config.palette === 'cyber' ? '#00f3ff' : '#ff8a1f';
      ctx.lineWidth = 1.2;
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.moveTo(peak.x - 6, peak.y);
      ctx.lineTo(peak.x + 6, peak.y);
      ctx.moveTo(peak.x, peak.y - 6);
      ctx.lineTo(peak.x, peak.y + 6);
      ctx.stroke();

      // Connector line to badge
      ctx.strokeStyle = config.palette === 'cyber' ? 'rgba(0, 243, 255, 0.5)' : 'rgba(255, 138, 31, 0.5)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(peak.x, peak.y);
      ctx.lineTo(badgeX - 4, badgeY);
      ctx.lineTo(badgeX + 85, badgeY);
      ctx.stroke();

      // Badge background pill
      ctx.fillStyle = 'rgba(10, 7, 5, 0.85)';
      ctx.fillRect(badgeX - 2, badgeY - 14, 90, 26);
      ctx.strokeStyle = config.palette === 'cyber' ? 'rgba(0, 243, 255, 0.4)' : 'rgba(255, 138, 31, 0.4)';
      ctx.strokeRect(badgeX - 2, badgeY - 14, 90, 26);

      // Badge text
      ctx.fillStyle = config.palette === 'cyber' ? '#00f3ff' : '#ffb259';
      ctx.fillText(labelText, badgeX + 4, badgeY - 5);

      ctx.fillStyle = '#9a8878';
      ctx.fillText(hitsText, badgeX + 4, badgeY + 6);
    }
    ctx.restore();
  }
}
