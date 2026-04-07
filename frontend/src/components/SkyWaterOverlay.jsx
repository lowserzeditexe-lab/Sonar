import { memo } from "react";
import { motion } from "framer-motion";

/* ─── Cloud shape (pure CSS ellipse + blur) ─── */
function Cloud({ top, width, height, opacity, speed, delay, blur, initialOffset = 0.5 }) {
  return (
    <div
      style={{
        position: "absolute",
        top,
        width,
        height,
        borderRadius: "50%/40%",
        background: `radial-gradient(ellipse at 50% 60%, rgba(255,255,255,${opacity}) 0%, rgba(255,255,255,${opacity * 0.6}) 40%, rgba(255,255,255,${opacity * 0.2}) 65%, transparent 80%)`,
        filter: `blur(${blur}px)`,
        animation: `cloud-drift-${speed} ${delay}s linear infinite`,
        animationDelay: `-${delay * initialOffset}s`,
        pointerEvents: "none",
        willChange: "transform",
      }}
    />
  );
}

/* ─── Sun glow ─── */
function SunGlow() {
  return (
    <>
      {/* Main sun disc */}
      <div
        style={{
          position: "absolute",
          top: "5%",
          left: "70%",
          width: "120px",
          height: "120px",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(255,245,200,0.95) 0%, rgba(255,220,100,0.6) 35%, rgba(255,200,60,0.2) 60%, transparent 75%)",
          animation: "sun-pulse 6s ease-in-out infinite",
          pointerEvents: "none",
          zIndex: 2,
        }}
      />
      {/* Outer halo */}
      <div
        style={{
          position: "absolute",
          top: "1%",
          left: "66%",
          width: "260px",
          height: "260px",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(255,230,140,0.25) 0%, rgba(255,200,60,0.1) 40%, transparent 65%)",
          pointerEvents: "none",
          zIndex: 1,
        }}
      />
    </>
  );
}

/* ─── Water sparkles ─── */
function Sparkle({ left, top, delay, size = 3 }) {
  return (
    <div
      style={{
        position: "absolute",
        left, top,
        width: size,
        height: size,
        borderRadius: "50%",
        background: "rgba(255,255,255,0.9)",
        animation: `sparkle ${2.5 + delay}s ease-in-out ${delay}s infinite`,
        pointerEvents: "none",
        boxShadow: "0 0 4px rgba(255,255,255,0.6)",
      }}
    />
  );
}

/* ─── Main overlay ─── */
function SkyWaterOverlay() {
  return (
    <div
      className="absolute inset-0 overflow-hidden pointer-events-none"
      style={{ zIndex: 1 }}
    >
      {/* ── Sky gradient ── */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: [
            "linear-gradient(to bottom,",
            "#3a8fd4 0%,",       // deep sky at top
            "#5ba3dd 12%,",      // mid sky
            "#7dbce6 25%,",      // lighter
            "#a2d3ef 38%,",      // pale blue
            "#c4e4f6 48%,",      // very pale  — approaching horizon
            "#d8edf9 54%,",      // horizon haze
            "#d2eaf8 58%,",      // water starts — mirror of sky
            "#b8ddf3 65%,",
            "#9acfed 75%,",
            "#7cc0e6 85%,",
            "#5eafe0 100%)",     // deeper water at bottom
          ].join(" "),
          pointerEvents: "none",
        }}
      />

      {/* ── Sun ── */}
      <SunGlow />

      {/* ── Sun ray streaks ── */}
      <div
        style={{
          position: "absolute",
          top: "4%",
          left: "70%",
          width: "350px",
          height: "400px",
          background: "conic-gradient(from 200deg at 50% 30%, transparent 0deg, rgba(255,230,140,0.06) 10deg, transparent 20deg, rgba(255,230,140,0.04) 50deg, transparent 60deg, rgba(255,230,140,0.05) 90deg, transparent 100deg, rgba(255,230,140,0.03) 150deg, transparent 160deg)",
          pointerEvents: "none",
          zIndex: 1,
        }}
      />

      {/* ── Cloud layers ── */}
      {/* Layer 1 – big puffy cumulus (slow, distant) */}
      <Cloud top="4%"  width="480px" height="120px" opacity={0.85} speed={1} delay={90}  blur={12} initialOffset={0.15} />
      <Cloud top="12%" width="550px" height="140px" opacity={0.75} speed={2} delay={120} blur={16} initialOffset={0.55} />
      <Cloud top="20%" width="420px" height="110px" opacity={0.7}  speed={1} delay={100} blur={13} initialOffset={0.38} />
      
      {/* Layer 2 – medium fluffy clouds (medium speed) */}
      <Cloud top="8%"  width="350px" height="95px"  opacity={0.8}  speed={2} delay={70}  blur={10} initialOffset={0.72} />
      <Cloud top="28%" width="400px" height="105px" opacity={0.65} speed={3} delay={75}  blur={11} initialOffset={0.28} />
      <Cloud top="16%" width="300px" height="80px"  opacity={0.7}  speed={1} delay={55}  blur={9}  initialOffset={0.62} />
      
      {/* Layer 3 – closer wisps and small puffs (faster) */}
      <Cloud top="33%" width="260px" height="70px"  opacity={0.55} speed={3} delay={50}  blur={7}  initialOffset={0.45} />
      <Cloud top="38%" width="320px" height="80px"  opacity={0.5}  speed={2} delay={60}  blur={8}  initialOffset={0.80} />
      <Cloud top="6%"  width="220px" height="60px"  opacity={0.45} speed={3} delay={40}  blur={6}  initialOffset={0.20} />
      <Cloud top="42%" width="180px" height="50px"  opacity={0.4}  speed={1} delay={45}  blur={7}  initialOffset={0.90} />

      {/* ── Horizon line – gentle haze ── */}
      <div
        style={{
          position: "absolute",
          top: "52%",
          left: 0,
          right: 0,
          height: "80px",
          background: "linear-gradient(to bottom, rgba(255,255,255,0.15) 0%, rgba(200,230,255,0.2) 40%, rgba(255,255,255,0.08) 100%)",
          filter: "blur(6px)",
          pointerEvents: "none",
          zIndex: 2,
        }}
      />

      {/* ── Water surface – subtle wave line ── */}
      <div
        style={{
          position: "absolute",
          top: "55%",
          left: "-5%",
          right: "-5%",
          height: "3px",
          background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.25) 20%, rgba(255,255,255,0.4) 50%, rgba(255,255,255,0.25) 80%, transparent 100%)",
          animation: "wave-sway 8s ease-in-out infinite",
          pointerEvents: "none",
          zIndex: 3,
        }}
      />

      {/* ── Reflected cloud shapes (flipped, faded — water mirror) ── */}
      <div style={{ position: "absolute", top: "57%", left: 0, right: 0, bottom: 0, opacity: 0.2, transform: "scaleY(-1)", pointerEvents: "none", overflow: "hidden" }}>
        <Cloud top="3%"  width="480px" height="120px" opacity={0.5}  speed={1} delay={90}  blur={20} initialOffset={0.15} />
        <Cloud top="10%" width="550px" height="140px" opacity={0.4}  speed={2} delay={120} blur={24} initialOffset={0.55} />
        <Cloud top="18%" width="420px" height="110px" opacity={0.35} speed={1} delay={100} blur={22} initialOffset={0.38} />
      </div>

      {/* ── Sun reflection on water ── */}
      <div
        style={{
          position: "absolute",
          top: "56%",
          left: "68%",
          width: "180px",
          height: "300px",
          background: "linear-gradient(to bottom, rgba(255,240,160,0.2) 0%, rgba(255,220,100,0.08) 30%, transparent 70%)",
          filter: "blur(20px)",
          animation: "wave-sway 6s ease-in-out infinite",
          pointerEvents: "none",
          zIndex: 2,
        }}
      />

      {/* ── Water caustics / shimmer effect ── */}
      <div
        style={{
          position: "absolute",
          top: "56%",
          left: 0,
          right: 0,
          bottom: 0,
          background: [
            "repeating-linear-gradient(",
            "105deg,",
            "transparent,",
            "transparent 60px,",
            "rgba(255,255,255,0.04) 60px,",
            "rgba(255,255,255,0.04) 62px",
            ")",
          ].join(" "),
          backgroundSize: "200% 100%",
          animation: "water-shimmer 15s ease-in-out infinite",
          pointerEvents: "none",
          zIndex: 2,
        }}
      />

      {/* ── Water sparkles ── */}
      <Sparkle left="15%" top="62%" delay={0}   size={3} />
      <Sparkle left="35%" top="58%" delay={0.8} size={2} />
      <Sparkle left="55%" top="65%" delay={1.6} size={3} />
      <Sparkle left="72%" top="60%" delay={0.4} size={2} />
      <Sparkle left="85%" top="67%" delay={1.2} size={3} />
      <Sparkle left="25%" top="72%" delay={2}   size={2} />
      <Sparkle left="60%" top="75%" delay={0.6} size={2} />
      <Sparkle left="42%" top="70%" delay={1.8} size={3} />
      <Sparkle left="90%" top="73%" delay={1}   size={2} />
      <Sparkle left="8%"  top="68%" delay={1.4} size={2} />

      {/* ── Depth tint at bottom (deeper water) ── */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: "30%",
          background: "linear-gradient(to bottom, transparent 0%, rgba(20,80,140,0.08) 100%)",
          pointerEvents: "none",
        }}
      />
    </div>
  );
}

export default memo(SkyWaterOverlay);
