import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { 
  Compass, 
  Navigation, 
  MapPin, 
  Radio, 
  Maximize2, 
  Minimize2, 
  ZoomIn, 
  ZoomOut, 
  Play, 
  Pause,
  ChevronDown,
  ChevronUp,
  Move
} from 'lucide-react';
import { soundFx } from '../utils/audioSynthesizer';

export type TopoRenderMode = 'wireframe3d' | 'contour2d' | 'lidarScan';
export type OverlayCorner = 'bottom-right' | 'top-right' | 'bottom-left' | 'top-left';

interface TacticalDroneOverlayProps {
  onTargetSet?: (coords: { lat: number; lng: number; alt: number }) => void;
  className?: string;
  defaultCorner?: OverlayCorner;
  pulseLatencySec?: number;
}

interface GPSPosition {
  lat: number;
  lng: number;
  alt: number; // in meters
  heading: number; // in degrees 0-359
  speedKmh: number;
  targetLat: number;
  targetLng: number;
}

interface Breadcrumb {
  x: number;
  y: number;
  timestamp: number;
}

export const TacticalDroneOverlay: React.FC<TacticalDroneOverlayProps> = ({
  onTargetSet,
  className = '',
  defaultCorner = 'bottom-right',
  pulseLatencySec = 0.8
}) => {
  // State
  const [isMinimized, setIsMinimized] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [corner, setCorner] = useState<OverlayCorner>(defaultCorner);
  const [renderMode, setRenderMode] = useState<TopoRenderMode>('wireframe3d');
  const [zoomLevel, setZoomLevel] = useState<number>(1.5);
  const [isPatrolling, setIsPatrolling] = useState<boolean>(true);
  const [showContours] = useState<boolean>(true);
  const [showWireGrid] = useState<boolean>(true);
  const [showLidarSweep] = useState<boolean>(true);
  const [manualWaypointNotice, setManualWaypointNotice] = useState<string | null>(null);

  // Canvas ref
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Simulated GPS baseline around a tactical ops zone (Marin Headlands / Golden Gate topography)
  const baseCoords = useRef({
    lat: 37.8199,
    lng: -122.4783,
    alt: 118.5
  });

  // Current Drone State
  const droneState = useRef<GPSPosition>({
    lat: 37.8199,
    lng: -122.4783,
    alt: 118.5,
    heading: 42,
    speedKmh: 24.8,
    targetLat: 37.8245,
    targetLng: -122.4720
  });

  // Display telemetry state for React UI
  const [telemetry, setTelemetry] = useState({
    latFormatted: `37°49'11.6"N`,
    lngFormatted: `122°28'41.9"W`,
    latDecimal: 37.8199,
    lngDecimal: -122.4783,
    alt: 118.5,
    heading: 42,
    speedKmh: 24.8,
    satellites: 16,
    hdop: 0.68,
    fix: 'RTK-FIXED',
    linkDb: -58,
    batteryPercent: 88,
    activeWaypoints: 4
  });

  // Path history for breadcrumbs on the canvas
  const breadcrumbsRef = useRef<Breadcrumb[]>([]);
  const radarAngleRef = useRef<number>(0);
  const patrolWaypointsRef = useRef<Array<{ x: number; y: number }>>([
    { x: -0.5, y: -0.4 },
    { x: 0.45, y: -0.35 },
    { x: 0.6, y: 0.4 },
    { x: -0.35, y: 0.5 },
    { x: -0.6, y: 0.1 }
  ]);
  const currentWaypointIndex = useRef<number>(0);

  // Internal normalized map coordinate [-1 to 1] for drone
  const botNormPos = useRef({ x: 0, y: 0 });

  // Format decimal to degrees-minutes-seconds
  const formatDMS = (dec: number, isLat: boolean) => {
    const dir = isLat ? (dec >= 0 ? 'N' : 'S') : (dec >= 0 ? 'E' : 'W');
    const abs = Math.abs(dec);
    const deg = Math.floor(abs);
    const minFloat = (abs - deg) * 60;
    const min = Math.floor(minFloat);
    const sec = ((minFloat - min) * 60).toFixed(1);
    return `${deg}°${min}'${sec}"${dir}`;
  };

  // Topographical elevation height function (procedural hills, ridges, valleys)
  const getElevation = useCallback((x: number, y: number, _timeSec: number) => {
    const d1 = Math.sin(x * 3.5 + 0.4) * Math.cos(y * 3.5 - 0.2);
    const d2 = Math.sin((x + y) * 2.8) * 0.45;
    const distFromRidge = Math.sqrt((x - 0.2) * (x - 0.2) + (y + 0.1) * (y + 0.1));
    const hillPeak = Math.exp(-distFromRidge * 3.2) * 1.2;
    const ridgeWest = Math.exp(-Math.abs(x + 0.6) * 4) * 0.7 * Math.cos(y * 4);
    const microUndulation = Math.sin(x * 8 + y * 7) * 0.12;

    return (d1 + d2 + hillPeak + ridgeWest + microUndulation) * 0.5 + 0.5; // normalized 0..1
  }, []);

  // Update drone simulation loop
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isPatrolling) return;

      const wp = patrolWaypointsRef.current[currentWaypointIndex.current];
      const dx = wp.x - botNormPos.current.x;
      const dy = wp.y - botNormPos.current.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < 0.08) {
        // Next waypoint
        currentWaypointIndex.current = (currentWaypointIndex.current + 1) % patrolWaypointsRef.current.length;
      } else {
        // Move towards waypoint
        const speed = 0.007;
        const angle = Math.atan2(dy, dx);
        botNormPos.current.x += Math.cos(angle) * speed;
        botNormPos.current.y += Math.sin(angle) * speed;

        // Calculate heading in degrees (0 is North / -Y in screen space)
        let deg = Math.round((Math.atan2(dx, -dy) * 180) / Math.PI);
        if (deg < 0) deg += 360;
        droneState.current.heading = deg;

        // Calculate simulated GPS coordinates (1 unit = ~0.005 degrees lat/lng, roughly 500m)
        const lat = baseCoords.current.lat + botNormPos.current.y * 0.0045;
        const lng = baseCoords.current.lng + botNormPos.current.x * 0.0055;
        
        // Altitude changes dynamically with topography
        const elev = getElevation(botNormPos.current.x, botNormPos.current.y, Date.now() / 1000);
        const alt = baseCoords.current.alt + elev * 75 + Math.sin(Date.now() / 2000) * 2.5;

        droneState.current.lat = lat;
        droneState.current.lng = lng;
        droneState.current.alt = alt;
        droneState.current.speedKmh = 22 + Math.sin(Date.now() / 1500) * 4.5;

        // Add breadcrumb every ~400ms
        if (Math.random() > 0.45) {
          breadcrumbsRef.current.push({
            x: botNormPos.current.x,
            y: botNormPos.current.y,
            timestamp: Date.now()
          });
          if (breadcrumbsRef.current.length > 35) {
            breadcrumbsRef.current.shift();
          }
        }

        // Update telemetry for UI
        setTelemetry(prev => ({
          ...prev,
          latFormatted: formatDMS(lat, true),
          lngFormatted: formatDMS(lng, false),
          latDecimal: lat,
          lngDecimal: lng,
          alt: Number(alt.toFixed(1)),
          heading: deg,
          speedKmh: Number(droneState.current.speedKmh.toFixed(1)),
          batteryPercent: Math.max(15, 88 - ((Date.now() / 60000) % 10)),
          satellites: 16 + (Math.sin(Date.now() / 10000) > 0 ? 1 : 0)
        }));
      }
    }, 70);

    return () => clearInterval(interval);
  }, [isPatrolling, getElevation]);

  // Main Canvas Rendering Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let isRunning = true;

    const render = () => {
      if (!isRunning) return;

      const width = canvas.width;
      const height = canvas.height;
      if (width === 0 || height === 0) return;

      ctx.clearRect(0, 0, width, height);

      const timeSec = Date.now() / 1000;
      radarAngleRef.current = (radarAngleRef.current + 0.025) % (Math.PI * 2);

      // 1. Tactical Background with vignette
      const bgGrad = ctx.createRadialGradient(width / 2, height / 2, 10, width / 2, height / 2, Math.max(width, height) * 0.7);
      bgGrad.addColorStop(0, '#100a06');
      bgGrad.addColorStop(0.7, '#070503');
      bgGrad.addColorStop(1, '#020101');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // Center offset
      const cx = width / 2;
      const cy = height / 2;
      const scale = (Math.min(width, height) / 2.3) * zoomLevel;

      // ----------------------------------------------------
      // MODE 1: 3D WIREFRAME TOPOGRAPHICAL MESH
      // ----------------------------------------------------
      if (renderMode === 'wireframe3d') {
        const rows = 22;
        const cols = 22;
        const gridPoints: Array<Array<{ px: number; py: number; heightNorm: number }>> = [];

        // Isometric / tilted perspective parameters
        const pitch = 0.62;
        const yaw = 0.25;

        for (let r = 0; r <= rows; r++) {
          const rowArr = [];
          const normY = (r / rows) * 2 - 1;

          for (let c = 0; c <= cols; c++) {
            const normX = (c / cols) * 2 - 1;
            const h = getElevation(normX, normY, timeSec);

            // Project to 2.5D wireframe stage
            const elevPx = h * 38 * zoomLevel;
            const rx = normX * Math.cos(yaw) - normY * Math.sin(yaw);
            const ry = (normX * Math.sin(yaw) + normY * Math.cos(yaw)) * pitch;

            const px = cx + rx * scale;
            const py = cy + ry * scale - elevPx + 14;

            rowArr.push({ px, py, heightNorm: h });
          }
          gridPoints.push(rowArr);
        }

        // Draw wireframe grid lines
        if (showWireGrid) {
          ctx.lineWidth = 1;
          for (let r = 0; r <= rows; r++) {
            for (let c = 0; c <= cols; c++) {
              const pt = gridPoints[r][c];

              const isPeak = pt.heightNorm > 0.65;
              const isValley = pt.heightNorm < 0.35;

              ctx.strokeStyle = isPeak 
                ? 'rgba(255, 138, 31, 0.45)' 
                : isValley 
                ? 'rgba(0, 240, 255, 0.25)' 
                : 'rgba(255, 178, 89, 0.28)';

              if (c < cols) {
                const nextPt = gridPoints[r][c + 1];
                ctx.beginPath();
                ctx.moveTo(pt.px, pt.py);
                ctx.lineTo(nextPt.px, nextPt.py);
                ctx.stroke();
              }

              if (r < rows) {
                const downPt = gridPoints[r + 1][c];
                ctx.beginPath();
                ctx.moveTo(pt.px, pt.py);
                ctx.lineTo(downPt.px, downPt.py);
                ctx.stroke();
              }
            }
          }
        }

        // Draw highlighted Topo Iso-Altitude Contours
        if (showContours) {
          const contourLevels = [0.3, 0.5, 0.7, 0.85];
          contourLevels.forEach((level, idx) => {
            ctx.strokeStyle = idx % 2 === 0 ? 'rgba(0, 240, 255, 0.65)' : 'rgba(255, 138, 31, 0.65)';
            ctx.lineWidth = idx === 1 || idx === 3 ? 1.5 : 0.9;
            ctx.setLineDash(idx % 2 === 0 ? [] : [3, 3]);

            for (let r = 0; r < rows; r++) {
              for (let c = 0; c < cols; c++) {
                const p1 = gridPoints[r][c];
                const p2 = gridPoints[r][c + 1];

                if (
                  (p1.heightNorm <= level && p2.heightNorm >= level) ||
                  (p1.heightNorm >= level && p2.heightNorm <= level)
                ) {
                  const t = (level - p1.heightNorm) / (p2.heightNorm - p1.heightNorm + 0.0001);
                  const ix = p1.px + t * (p2.px - p1.px);
                  const iy = p1.py + t * (p2.py - p1.py);

                  ctx.beginPath();
                  ctx.arc(ix, iy, 1.2, 0, Math.PI * 2);
                  ctx.fillStyle = ctx.strokeStyle;
                  ctx.fill();
                }
              }
            }
            ctx.setLineDash([]);
          });
        }
      }

      // ----------------------------------------------------
      // MODE 2 & 3: 2D ISO-CONTOUR MAP & LIDAR SCAN
      // ----------------------------------------------------
      if (renderMode === 'contour2d' || renderMode === 'lidarScan') {
        const rings = [0.25, 0.5, 0.75, 1.0];
        rings.forEach((rRatio) => {
          const r = scale * rRatio;
          ctx.beginPath();
          ctx.arc(cx, cy, r, 0, Math.PI * 2);
          ctx.strokeStyle = 'rgba(255, 138, 31, 0.2)';
          ctx.lineWidth = 1;
          ctx.setLineDash([4, 4]);
          ctx.stroke();
          ctx.setLineDash([]);

          ctx.font = '8px monospace';
          ctx.fillStyle = 'rgba(255, 178, 89, 0.5)';
          ctx.fillText(`${Math.round(rRatio * 500)}m`, cx + r - 18, cy - 3);
        });

        const numContours = 9;
        for (let i = 1; i <= numContours; i++) {
          ctx.beginPath();
          const steps = 40;
          for (let s = 0; s <= steps; s++) {
            const angle = (s / steps) * Math.PI * 2;
            const rBase = scale * 0.9;
            const testX = (Math.cos(angle) * rBase) / scale;
            const testY = (Math.sin(angle) * rBase) / scale;
            const h = getElevation(testX, testY, timeSec);
            const rAdj = rBase * (0.3 + h * 0.7);

            const px = cx + Math.cos(angle) * rAdj;
            const py = cy + Math.sin(angle) * rAdj;

            if (s === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          }
          ctx.closePath();
          ctx.strokeStyle = i % 3 === 0 ? 'rgba(0, 240, 255, 0.5)' : 'rgba(255, 138, 31, 0.25)';
          ctx.lineWidth = i % 3 === 0 ? 1.5 : 0.8;
          ctx.stroke();
        }

        if (showLidarSweep || renderMode === 'lidarScan') {
          const beamAngle = radarAngleRef.current;
          const beamLen = scale * 1.1;
          const beamGrad = ctx.createRadialGradient(cx, cy, 2, cx, cy, beamLen);
          beamGrad.addColorStop(0, 'rgba(0, 240, 255, 0.4)');
          beamGrad.addColorStop(1, 'rgba(0, 240, 255, 0.0)');

          ctx.beginPath();
          ctx.moveTo(cx, cy);
          ctx.arc(cx, cy, beamLen, beamAngle - 0.25, beamAngle);
          ctx.closePath();
          ctx.fillStyle = beamGrad;
          ctx.fill();

          ctx.beginPath();
          ctx.moveTo(cx, cy);
          ctx.lineTo(cx + Math.cos(beamAngle) * beamLen, cy + Math.sin(beamAngle) * beamLen);
          ctx.strokeStyle = 'rgba(0, 240, 255, 0.85)';
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }
      }

      // ----------------------------------------------------
      // DRAW BREADCRUMB TRAIL OF OPENMAUSBOT
      // ----------------------------------------------------
      if (breadcrumbsRef.current.length > 1) {
        ctx.beginPath();
        breadcrumbsRef.current.forEach((bc, idx) => {
          let bpx: number;
          let bpy: number;

          if (renderMode === 'wireframe3d') {
            const h = getElevation(bc.x, bc.y, timeSec);
            const pitch = 0.62;
            const yaw = 0.25;
            const elevPx = h * 38 * zoomLevel;
            const rx = bc.x * Math.cos(yaw) - bc.y * Math.sin(yaw);
            const ry = (bc.x * Math.sin(yaw) + bc.y * Math.cos(yaw)) * pitch;
            bpx = cx + rx * scale;
            bpy = cy + ry * scale - elevPx + 14;
          } else {
            bpx = cx + bc.x * scale;
            bpy = cy + bc.y * scale;
          }

          if (idx === 0) ctx.moveTo(bpx, bpy);
          else ctx.lineTo(bpx, bpy);
        });
        ctx.strokeStyle = 'rgba(0, 240, 255, 0.35)';
        ctx.lineWidth = 1.2;
        ctx.setLineDash([2, 3]);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // ----------------------------------------------------
      // DRAW ACTIVE WAYPOINT TARGET
      // ----------------------------------------------------
      const currentTargetWp = patrolWaypointsRef.current[currentWaypointIndex.current];
      if (currentTargetWp) {
        let tpx: number;
        let tpy: number;

        if (renderMode === 'wireframe3d') {
          const h = getElevation(currentTargetWp.x, currentTargetWp.y, timeSec);
          const pitch = 0.62;
          const yaw = 0.25;
          const elevPx = h * 38 * zoomLevel;
          const rx = currentTargetWp.x * Math.cos(yaw) - currentTargetWp.y * Math.sin(yaw);
          const ry = (currentTargetWp.x * Math.sin(yaw) + currentTargetWp.y * Math.cos(yaw)) * pitch;
          tpx = cx + rx * scale;
          tpy = cy + ry * scale - elevPx + 14;
        } else {
          tpx = cx + currentTargetWp.x * scale;
          tpy = cy + currentTargetWp.y * scale;
        }

        const markerSize = 6 + Math.sin(timeSec * 5) * 1.5;
        ctx.save();
        ctx.translate(tpx, tpy);
        ctx.rotate(timeSec * 1.2);
        ctx.strokeStyle = '#ffb259';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(-markerSize / 2, -markerSize / 2, markerSize, markerSize);
        ctx.restore();

        ctx.fillStyle = '#ffb259';
        ctx.font = '9px monospace';
        ctx.fillText(`WP-${currentWaypointIndex.current + 1}`, tpx + 8, tpy + 3);
      }

      // ----------------------------------------------------
      // DRAW OPENMAUSBOT DRONE ICON & HEADING RETICLE
      // ----------------------------------------------------
      let botPx: number;
      let botPy: number;

      if (renderMode === 'wireframe3d') {
        const h = getElevation(botNormPos.current.x, botNormPos.current.y, timeSec);
        const pitch = 0.62;
        const yaw = 0.25;
        const elevPx = h * 38 * zoomLevel;
        const rx = botNormPos.current.x * Math.cos(yaw) - botNormPos.current.y * Math.sin(yaw);
        const ry = (botNormPos.current.x * Math.sin(yaw) + botNormPos.current.y * Math.cos(yaw)) * pitch;
        botPx = cx + rx * scale;
        botPy = cy + ry * scale - elevPx + 14;
      } else {
        botPx = cx + botNormPos.current.x * scale;
        botPy = cy + botNormPos.current.y * scale;
      }

      // Pulsing radar ping ring from OpenMausBot
      const pulseSize = (timeSec * 35) % 36;
      const pulseAlpha = Math.max(0, 1 - pulseSize / 36);
      ctx.beginPath();
      ctx.arc(botPx, botPy, pulseSize, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(0, 240, 255, ${pulseAlpha * 0.6})`;
      ctx.lineWidth = 1;
      ctx.stroke();

      // Heading indicator direction vector
      const headingRad = (droneState.current.heading * Math.PI) / 180;
      const headLen = 18;
      const headX = botPx + Math.sin(headingRad) * headLen;
      const headY = botPy - Math.cos(headingRad) * headLen;

      ctx.beginPath();
      ctx.moveTo(botPx, botPy);
      ctx.lineTo(headX, headY);
      ctx.strokeStyle = '#00f0ff';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Drone Body
      ctx.save();
      ctx.translate(botPx, botPy);
      ctx.rotate(headingRad);

      ctx.fillStyle = '#00f0ff';
      ctx.shadowColor = '#00f0ff';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.moveTo(0, -9);
      ctx.lineTo(6, 7);
      ctx.lineTo(0, 4);
      ctx.lineTo(-6, 7);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(0, 0, 2.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();

      // Unit tag callout
      ctx.fillStyle = '#00f0ff';
      ctx.font = 'bold 9px monospace';
      ctx.fillText('OPENMAUSBOT', botPx + 10, botPy - 8);
      ctx.fillStyle = '#ffb259';
      ctx.font = '8px monospace';
      ctx.fillText(`${droneState.current.alt.toFixed(1)}m AGL`, botPx + 10, botPy + 2);

      // ----------------------------------------------------
      // TACTICAL CORNER BRACKETS & CROSSHAIR OVERLAY
      // ----------------------------------------------------
      const bracketLen = 10;
      ctx.strokeStyle = 'rgba(255, 138, 31, 0.6)';
      ctx.lineWidth = 1.5;

      ctx.beginPath();
      ctx.moveTo(8, 8 + bracketLen);
      ctx.lineTo(8, 8);
      ctx.lineTo(8 + bracketLen, 8);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(width - 8 - bracketLen, 8);
      ctx.lineTo(width - 8, 8);
      ctx.lineTo(width - 8, 8 + bracketLen);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(8, height - 8 - bracketLen);
      ctx.lineTo(8, height - 8);
      ctx.lineTo(8 + bracketLen, height - 8);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(width - 8 - bracketLen, height - 8);
      ctx.lineTo(width - 8, height - 8);
      ctx.lineTo(width - 8, height - 8 - bracketLen);
      ctx.stroke();

      ctx.strokeStyle = 'rgba(255, 138, 31, 0.2)';
      ctx.lineWidth = 0.8;
      ctx.setLineDash([3, 5]);
      ctx.beginPath();
      ctx.moveTo(cx, 15);
      ctx.lineTo(cx, height - 15);
      ctx.moveTo(15, cy);
      ctx.lineTo(width - 15, cy);
      ctx.stroke();
      ctx.setLineDash([]);

      animationFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      isRunning = false;
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [renderMode, zoomLevel, showContours, showWireGrid, showLidarSweep, getElevation]);

  // Handle click on canvas to set a new tactical waypoint for OpenMausBot
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const width = canvas.width;
    const height = canvas.height;
    const cx = width / 2;
    const cy = height / 2;
    const scale = (Math.min(width, height) / 2.3) * zoomLevel;

    const normX = Math.max(-0.9, Math.min(0.9, (clickX - cx) / scale));
    const normY = Math.max(-0.9, Math.min(0.9, (clickY - cy) / scale));

    patrolWaypointsRef.current.push({ x: normX, y: normY });
    currentWaypointIndex.current = patrolWaypointsRef.current.length - 1;

    const targetLat = baseCoords.current.lat + normY * 0.0045;
    const targetLng = baseCoords.current.lng + normX * 0.0055;
    const elev = getElevation(normX, normY, Date.now() / 1000);
    const targetAlt = baseCoords.current.alt + elev * 75;

    soundFx.playNodeSelect();

    setManualWaypointNotice(`VECTOR SET: ${formatDMS(targetLat, true)} ${formatDMS(targetLng, false)}`);
    setTimeout(() => setManualWaypointNotice(null), 3000);

    if (onTargetSet) {
      onTargetSet({ lat: targetLat, lng: targetLng, alt: targetAlt });
    }
  };

  // Switch corner placement
  const toggleCorner = () => {
    soundFx.playClick(1050);
    const corners: OverlayCorner[] = ['bottom-right', 'top-right', 'top-left', 'bottom-left'];
    const nextIdx = (corners.indexOf(corner) + 1) % corners.length;
    setCorner(corners[nextIdx]);
  };

  // Corner style positioning classes
  const cornerClasses = useMemo(() => {
    switch (corner) {
      case 'bottom-right':
        return 'bottom-2.5 right-2.5';
      case 'top-right':
        return 'top-12 right-2.5';
      case 'bottom-left':
        return 'bottom-2.5 left-2.5';
      case 'top-left':
        return 'top-12 left-2.5';
      default:
        return 'bottom-2.5 right-2.5';
    }
  }, [corner]);

  const containerWidthClass = isExpanded 
    ? 'w-[360px] sm:w-[420px]' 
    : 'w-[280px] sm:w-[320px]';
  const canvasHeight = isExpanded ? 230 : 155;

  return (
    <aside 
      aria-label="Tactical Drone Topographical Map Overlay"
      className={`absolute ${cornerClasses} z-30 transition-all duration-300 pointer-events-auto select-none font-mono ${className}`}
    >
      {/* Minimized Compact Capsule */}
      {isMinimized ? (
        <div 
          onClick={() => {
            soundFx.playClick(1100);
            setIsMinimized(false);
          }}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#0e0906]/95 border border-[#ff8a1f]/50 hover:border-[#ff8a1f] text-xs shadow-[0_0_15px_rgba(255,138,31,0.3)] cursor-pointer hover:scale-102 transition-all backdrop-blur-md"
        >
          <div className="relative flex items-center justify-center">
            <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-[#46e39a]" />
          </div>
          <span className="text-white font-condensed font-bold tracking-wider">OM-BOT DRONE</span>
          <span className="text-[#ffb259] text-[10px]">{telemetry.latFormatted}</span>
          <span className="text-cyan-300 font-bold text-[10px]">{telemetry.alt}m</span>
          <ChevronUp className="w-3.5 h-3.5 text-[#9a8878]" />
        </div>
      ) : (
        /* Full Tactical Wireframe Topo HUD Card */
        <div className={`${containerWidthClass} rounded-xl bg-[#0b0704]/96 border border-[#ff8a1f]/40 shadow-[0_0_25px_rgba(0,0,0,0.8),0_0_15px_rgba(255,138,31,0.25)] backdrop-blur-md overflow-hidden flex flex-col`}>
          
          {/* Header Bar */}
          <div className="flex items-center justify-between px-2.5 py-1.5 bg-[#140b05] border-b border-[#ff8a1f]/25">
            <div className="flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500" />
              </span>
              <span className="text-xs font-condensed font-bold tracking-widest text-[#ffb259] uppercase">
                TACTICAL DRONE
              </span>
              <span className="text-[9px] px-1 py-0.2 rounded bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 font-mono">
                OM-BOT RECON
              </span>
            </div>

            {/* Quick Action Controls */}
            <div className="flex items-center gap-1">
              <button
                onClick={toggleCorner}
                title="Switch Corner Dock"
                className="p-1 rounded text-[#9a8878] hover:text-white hover:bg-[#ff8a1f]/20 transition-colors"
              >
                <Move className="w-3 h-3" />
              </button>
              <button
                onClick={() => {
                  soundFx.playClick(1000);
                  setIsExpanded(!isExpanded);
                }}
                title={isExpanded ? 'Standard View' : 'Expanded View'}
                className="p-1 rounded text-[#9a8878] hover:text-white hover:bg-[#ff8a1f]/20 transition-colors"
              >
                {isExpanded ? <Minimize2 className="w-3 h-3" /> : <Maximize2 className="w-3 h-3" />}
              </button>
              <button
                onClick={() => {
                  soundFx.playClick(900);
                  setIsMinimized(true);
                }}
                title="Minimize Overlay"
                className="p-1 rounded text-[#9a8878] hover:text-white hover:bg-[#ff8a1f]/20 transition-colors"
              >
                <ChevronDown className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Render Mode Selector & Map Control Strip */}
          <div className="flex items-center justify-between px-2 py-1 bg-[#0e0804] border-b border-[#ff8a1f]/15 text-[10px]">
            {/* Topo Mode Buttons */}
            <div className="flex items-center gap-1">
              {(
                [
                  { id: 'wireframe3d', label: '3D TOPO' },
                  { id: 'contour2d', label: 'ISO-CONTOUR' },
                  { id: 'lidarScan', label: 'LIDAR' }
                ] as const
              ).map((mode) => (
                <button
                  key={mode.id}
                  onClick={() => {
                    soundFx.playClick(1150);
                    setRenderMode(mode.id);
                  }}
                  className={`px-1.5 py-0.5 rounded text-[9px] font-condensed tracking-wider transition-all ${
                    renderMode === mode.id
                      ? 'bg-[#ff8a1f] text-[#120802] font-bold shadow-[0_0_8px_rgba(255,138,31,0.5)]'
                      : 'text-[#9a8878] hover:text-white'
                  }`}
                >
                  {mode.label}
                </button>
              ))}
            </div>

            {/* Zoom & Layer Toggles */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => {
                  soundFx.playClick(1200);
                  setZoomLevel((z) => Math.max(0.8, Number((z - 0.3).toFixed(1))));
                }}
                className="p-0.5 rounded text-[#9a8878] hover:text-white hover:bg-[#ff8a1f]/20"
                title="Zoom Out"
              >
                <ZoomOut className="w-3 h-3" />
              </button>
              <span className="text-[9px] text-[#ffb259] px-0.5 font-mono">{zoomLevel}x</span>
              <button
                onClick={() => {
                  soundFx.playClick(1300);
                  setZoomLevel((z) => Math.min(3.0, Number((z + 0.3).toFixed(1))));
                }}
                className="p-0.5 rounded text-[#9a8878] hover:text-white hover:bg-[#ff8a1f]/20"
                title="Zoom In"
              >
                <ZoomIn className="w-3 h-3" />
              </button>

              <div className="h-3 w-[1px] bg-[#ff8a1f]/20 mx-0.5" />

              <button
                onClick={() => {
                  soundFx.playClick(1100);
                  setIsPatrolling(!isPatrolling);
                }}
                className={`p-0.5 rounded ${
                  isPatrolling ? 'text-[#46e39a]' : 'text-amber-400'
                } hover:bg-[#ff8a1f]/20`}
                title={isPatrolling ? 'Pause Autonomous Patrol' : 'Resume Patrol'}
              >
                {isPatrolling ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
              </button>
            </div>
          </div>

          {/* Interactive Wireframe Canvas */}
          <div className="relative w-full cursor-crosshair overflow-hidden group">
            <canvas
              ref={canvasRef}
              width={isExpanded ? 420 : 320}
              height={canvasHeight}
              onClick={handleCanvasClick}
              className="w-full block"
              style={{ height: `${canvasHeight}px` }}
            />

            {/* Click instruction tooltip */}
            <div className="absolute top-1.5 left-2 pointer-events-none text-[8px] font-mono text-[#9a8878]/70 group-hover:text-[#ffb259] transition-colors">
              CLICK MAP TO VECTOR WP
            </div>

            {/* Waypoint Notice Banner */}
            {manualWaypointNotice && (
              <div className="absolute top-2 inset-x-2 py-0.5 px-2 rounded bg-cyan-950/90 border border-cyan-400/80 text-cyan-300 text-[9px] font-mono text-center shadow-lg animate-pulse">
                {manualWaypointNotice}
              </div>
            )}

            {/* In-canvas HUD compass & status tag */}
            <div className="absolute bottom-1.5 left-2 flex items-center gap-1 pointer-events-none text-[9px] text-[#46e39a] font-mono bg-black/60 px-1.5 py-0.5 rounded border border-[#46e39a]/30">
              <span className="w-1.5 h-1.5 rounded-full bg-[#46e39a] animate-pulse" />
              <span>{telemetry.fix}</span>
              <span className="text-neutral-500">•</span>
              <span className="text-neutral-300">{telemetry.satellites} SATS</span>
            </div>

            {/* Compass Heading Tape */}
            <div className="absolute bottom-1.5 right-2 flex items-center gap-1 pointer-events-none text-[9px] text-[#ffb259] font-mono bg-black/60 px-1.5 py-0.5 rounded border border-[#ff8a1f]/30">
              <Compass className="w-3 h-3 text-[#ff8a1f]" />
              <span>{String(telemetry.heading).padStart(3, '0')}°</span>
              <span className="text-cyan-300">
                {telemetry.heading >= 315 || telemetry.heading < 45
                  ? 'N'
                  : telemetry.heading < 135
                  ? 'E'
                  : telemetry.heading < 225
                  ? 'S'
                  : 'W'}
              </span>
            </div>
          </div>

          {/* Real-time Simulated GPS Coordinates & Flight Telemetry Panel */}
          <div className="p-2 bg-[#0d0805] border-t border-[#ff8a1f]/20 grid grid-cols-2 gap-1.5 text-[10px]">
            
            {/* GPS Latitude / Longitude */}
            <div className="flex flex-col bg-[#140b05] p-1.5 rounded border border-[#ff8a1f]/15">
              <div className="flex items-center justify-between text-[#9a8878] text-[9px]">
                <span className="flex items-center gap-1">
                  <MapPin className="w-2.5 h-2.5 text-[#ff8a1f]" />
                  <span>GPS LAT/LNG</span>
                </span>
                <span className="text-[8px] text-[#46e39a]">HDOP {telemetry.hdop}</span>
              </div>
              <div className="text-white font-mono font-medium text-[10px] mt-0.5 leading-tight">
                {telemetry.latFormatted}
              </div>
              <div className="text-[#ffb259] font-mono text-[10px] leading-tight">
                {telemetry.lngFormatted}
              </div>
            </div>

            {/* Altitude & Ground Speed */}
            <div className="flex flex-col bg-[#140b05] p-1.5 rounded border border-[#ff8a1f]/15">
              <div className="flex items-center justify-between text-[#9a8878] text-[9px]">
                <span className="flex items-center gap-1">
                  <Navigation className="w-2.5 h-2.5 text-cyan-400" />
                  <span>FLIGHT METRICS</span>
                </span>
                <span className="text-[8px] text-cyan-300">{telemetry.batteryPercent}% PWR</span>
              </div>
              <div className="flex items-center justify-between mt-0.5">
                <span className="text-neutral-400 text-[9px]">ALT AGL:</span>
                <span className="text-cyan-300 font-bold font-mono">{telemetry.alt} m</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-neutral-400 text-[9px]">SPEED:</span>
                <span className="text-white font-mono font-medium">{telemetry.speedKmh} km/h</span>
              </div>
            </div>

          </div>

          {/* Bottom Telemetry Mini-Strip */}
          <div className="px-2 py-1 bg-[#090503] border-t border-[#ff8a1f]/10 flex items-center justify-between text-[8px] font-mono text-[#9a8878]">
            <span className="text-[#ffb259]">SIGNAL: {telemetry.linkDb} dBm</span>
            <span>WAYPOINTS: {telemetry.activeWaypoints} ACTIVE</span>
            <span className="text-cyan-400">PATROL: {isPatrolling ? 'ACTIVE' : 'HOLD'}</span>
          </div>

        </div>
      )}
    </aside>
  );
};
