/**
 * components/ConfettiOverlay.jsx
 *
 * Full-screen canvas confetti animation.
 * Plays automatically when `active` becomes true, then fades out.
 * Calls `onComplete` when the animation finishes.
 *
 * Mounts a fixed canvas at z-index 9999 — pointer-events none so it
 * never blocks taps on the modal behind it.
 *
 * @param {{
 *   active:      boolean,
 *   onComplete?: () => void,
 * }} props
 */

import { useEffect, useRef, useCallback } from "react";

// ─── Config ───────────────────────────────────────────────────────────────────

const PARTICLE_COUNT = 130;
const DURATION_MS    = 3600;   // total animation time
const FADE_START     = 0.65;   // start fading at 65% of duration
const GRAVITY        = 0.055;

const COLORS = [
  "#0F6E56", "#D97706", "#185FA5", "#EA580C",
  "#7C3AED", "#DB2777", "#16A34A", "#CA8A04",
  "#059669", "#4338CA", "#991B1B", "#0284C7",
];

const SHAPES = ["rect", "circle", "ribbon"];

// ─── Particle factory ─────────────────────────────────────────────────────────

function makeParticle(canvasWidth) {
  return {
    x:             Math.random() * canvasWidth,
    y:             -20 - Math.random() * 120,           // spawn above viewport
    vx:            (Math.random() - 0.5) * 4,
    vy:            1.8 + Math.random() * 3.2,
    rotation:      Math.random() * 360,
    rotationSpeed: (Math.random() - 0.5) * 9,
    color:         COLORS[Math.floor(Math.random() * COLORS.length)],
    width:         6 + Math.random() * 10,
    height:        (4 + Math.random() * 6),
    shape:         SHAPES[Math.floor(Math.random() * SHAPES.length)],
    drift:         (Math.random() - 0.5) * 0.6,        // lateral wobble
    driftPhase:    Math.random() * Math.PI * 2,
    opacity:       1,
  };
}

// ─── Draw helpers ─────────────────────────────────────────────────────────────

function drawParticle(ctx, p) {
  ctx.save();
  ctx.globalAlpha = p.opacity;
  ctx.translate(p.x, p.y);
  ctx.rotate((p.rotation * Math.PI) / 180);
  ctx.fillStyle = p.color;

  switch (p.shape) {
    case "rect":
      ctx.fillRect(-p.width / 2, -p.height / 2, p.width, p.height);
      break;
    case "circle":
      ctx.beginPath();
      ctx.arc(0, 0, p.width / 2, 0, Math.PI * 2);
      ctx.fill();
      break;
    case "ribbon":
      ctx.beginPath();
      ctx.moveTo(-p.width / 2, 0);
      ctx.quadraticCurveTo(0, -p.height, p.width / 2, 0);
      ctx.quadraticCurveTo(0,  p.height, -p.width / 2, 0);
      ctx.fill();
      break;
    default:
      break;
  }
  ctx.restore();
}

// ─── Component ────────────────────────────────────────────────────────────────

function ConfettiOverlay({ active, onComplete }) {
  const canvasRef = useRef(null);
  const rafRef    = useRef(null);

  const animate = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx    = canvas.getContext("2d");
    const width  = canvas.width;
    const height = canvas.height;

    const particles = Array.from({ length: PARTICLE_COUNT }, () => makeParticle(width));
    let startTime   = null;

    function frame(timestamp) {
      if (!startTime) startTime = timestamp;
      const elapsed  = timestamp - startTime;
      const progress = Math.min(elapsed / DURATION_MS, 1);

      ctx.clearRect(0, 0, width, height);

      for (const p of particles) {
        // Physics
        p.vy           += GRAVITY;
        p.y            += p.vy;
        p.x            += p.vx + Math.sin(p.driftPhase + elapsed * 0.002) * p.drift;
        p.rotation     += p.rotationSpeed;
        p.driftPhase   += 0.03;

        // Fade out in the last portion of the animation
        p.opacity = progress > FADE_START
          ? 1 - (progress - FADE_START) / (1 - FADE_START)
          : 1;

        // Only draw if still on screen
        if (p.y < height + 40) drawParticle(ctx, p);
      }

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(frame);
      } else {
        ctx.clearRect(0, 0, width, height);
        onComplete?.();
      }
    }

    rafRef.current = requestAnimationFrame(frame);
  }, [onComplete]);

  useEffect(() => {
    if (!active) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;

    // Handle resize mid-animation
    const onResize = () => {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", onResize);

    animate();

    return () => {
      window.removeEventListener("resize", onResize);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [active, animate]);

  if (!active) return null;

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{
        position:      "fixed",
        top:           0,
        left:          0,
        width:         "100%",
        height:        "100%",
        pointerEvents: "none",
        zIndex:        9999,
      }}
    />
  );
}

export default ConfettiOverlay;
