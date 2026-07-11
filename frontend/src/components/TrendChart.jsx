/**
 * @fileoverview Canvas-based real-time area sparkline graph displaying density trends.
 */
import React, { useRef, useEffect } from 'react';

export default function TrendChart({ history, gateName }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Use parent element size (responsiveness)
    const width = canvas.parentElement.clientWidth || 300;
    const height = 180;
    
    // Scale for high DPI (Retina displays)
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(dpr, dpr);

    // Clear Canvas
    ctx.fillStyle = '#0f172a'; // slate-950 background matches layout
    ctx.fillRect(0, 0, width, height);

    // Check if we have logs to draw
    if (!history || history.length === 0) {
      ctx.fillStyle = '#64748b'; // slate-500
      ctx.font = '12px system-ui, -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('No history loaded yet.', width / 2, height / 2);
      return;
    }

    // Sort history chronologically (oldest to newest) to draw from left to right
    const data = [...history].reverse();
    const paddingLeft = 35;
    const paddingRight = 15;
    const paddingTop = 25;
    const paddingBottom = 25;

    const chartWidth = width - paddingLeft - paddingRight;
    const chartHeight = height - paddingTop - paddingBottom;

    // Draw Grid Lines (Horizontal)
    ctx.strokeStyle = '#334155'; // slate-700
    ctx.lineWidth = 0.5;
    ctx.setLineDash([4, 4]);
    
    const gridTiers = [0, 25, 50, 75, 100];
    gridTiers.forEach((tier) => {
      const y = paddingTop + chartHeight - (tier / 100) * chartHeight;
      ctx.beginPath();
      ctx.moveTo(paddingLeft, y);
      ctx.lineTo(width - paddingRight, y);
      ctx.stroke();

      // Text label for grid tiers
      ctx.fillStyle = '#94a3b8'; // slate-400
      ctx.font = '8px monospace';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.fillText(`${tier}%`, paddingLeft - 5, y);
    });
    ctx.setLineDash([]); // Reset line dash

    // Plot points
    const pointsCount = data.length;
    const stepX = pointsCount > 1 ? chartWidth / (pointsCount - 1) : chartWidth;
    
    const coordPoints = data.map((log, idx) => {
      const x = paddingLeft + idx * stepX;
      // Cap density between 0 and 100
      const d = Math.max(0, Math.min(100, log.density));
      const y = paddingTop + chartHeight - (d / 100) * chartHeight;
      return { x, y, density: log.density, timestamp: new Date(log.timestamp) };
    });

    // Draw Area Fill under the line (Gradient)
    if (coordPoints.length > 0) {
      const gradient = ctx.createLinearGradient(0, paddingTop, 0, paddingTop + chartHeight);
      gradient.addColorStop(0, 'rgba(234, 88, 12, 0.45)'); // stadium orange opacity
      gradient.addColorStop(1, 'rgba(234, 88, 12, 0.00)'); // fades to transparent
      
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.moveTo(paddingLeft, paddingTop + chartHeight);
      
      coordPoints.forEach((pt) => {
        ctx.lineTo(pt.x, pt.y);
      });
      
      ctx.lineTo(coordPoints[coordPoints.length - 1].x, paddingTop + chartHeight);
      ctx.closePath();
      ctx.fill();
    }

    // Draw Line
    if (coordPoints.length > 0) {
      ctx.strokeStyle = '#ea580c'; // stadium-orange-600
      ctx.lineWidth = 2.5;
      ctx.lineJoin = 'round';
      ctx.beginPath();
      
      coordPoints.forEach((pt, idx) => {
        if (idx === 0) {
          ctx.moveTo(pt.x, pt.y);
        } else {
          ctx.lineTo(pt.x, pt.y);
        }
      });
      ctx.stroke();
    }

    // Draw Data Point Circles & Tooltip value on the latest point
    coordPoints.forEach((pt, idx) => {
      // Circle at node
      ctx.fillStyle = '#ea580c';
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, 3.5, 0, 2 * Math.PI);
      ctx.fill();
      ctx.stroke();

      // Show timestamp labels on X-axis (first and last to prevent overlap)
      if (idx === 0 || idx === coordPoints.length - 1 || (coordPoints.length > 4 && idx === Math.floor(coordPoints.length / 2))) {
        const timeStr = pt.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        ctx.fillStyle = '#64748b';
        ctx.font = '8px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText(timeStr, pt.x, paddingTop + chartHeight + 6);
      }
    });

    // Draw Title/Metadata header in canvas
    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 10px system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(`${gateName} - Live Real-Time Trend`, paddingLeft, 5);

  }, [history, gateName]);

  return (
    <div className="w-full bg-stadium-slate-950 rounded-lg p-2 border border-stadium-slate-850">
      <canvas 
        ref={canvasRef} 
        className="w-full block" 
        aria-label={`Real-time capacity graph trend for ${gateName}`}
      />
    </div>
  );
}
