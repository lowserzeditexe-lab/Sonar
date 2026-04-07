import { useState, useEffect, useRef } from "react";
import { motion, useInView } from "framer-motion";
import { ArrowRight, GitBranch, Check, Zap, Globe, Lock } from "lucide-react";

// ─── Animated counter ────────────────────────────────────────────────────────

function Counter({ target, suffix = "", duration = 1800 }) {
  const [val, setVal] = useState(0);
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (!inView) return;
    let start = null;
    const step = (ts) => {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      setVal(Math.floor(ease * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [inView, target, duration]);

  return <span ref={ref}>{val.toLocaleString()}{suffix}</span>;
}

// ─── Stats section ────────────────────────────────────────────────────────────

const STATS = [
  { value: 120000, suffix: "+", label: "apps déployées" },
  { value: 49,     suffix: "k",  label: "devs actifs" },
  { value: 999,    suffix: "%",  label: "uptime garanti", display: "99.9%" },
  { value: 12,     suffix: "¢",  label: "coût moyen" },
];

function StatsSection() {
  return (
    <section style={{ padding: "72px 40px 80px", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
      <div style={{ maxWidth: "900px", margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "0" }}>
        {STATS.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.08, duration: 0.4 }}
            style={{
              textAlign: "center",
              padding: "0 24px",
              borderRight: i < STATS.length - 1 ? "1px solid rgba(255,255,255,0.06)" : "none",
            }}
          >
            <p style={{
              fontFamily: "'Outfit', sans-serif",
              fontSize: "clamp(2rem, 4vw, 3rem)",
              fontWeight: 900,
              letterSpacing: "-0.04em",
              color: "#fff",
              lineHeight: 1,
              marginBottom: 8,
            }}>
              {s.display ? s.display : <Counter target={s.value} suffix={s.suffix} />}
            </p>
            <p style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: "12px",
              color: "rgba(140,158,180,0.55)",
              fontWeight: 500,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
            }}>
              {s.label}
            </p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

// ─── App builder mockup ───────────────────────────────────────────────────────

const MOCK_MESSAGES = [
  { role: "user", text: "Build me a todo app with priorities" },
  { role: "ai",   text: "Creating your app…", steps: ["Analyzing prompt", "Scaffolding React", "Building components", "Writing styles", "Running tests"] },
];

const MOCK_CODE = `import { useState } from "react"

export default function TodoApp() {
  const [tasks, setTasks] = useState([
    { id: 1, text: "Design landing page", done: true, priority: "high" },
    { id: 2, text: "Build API endpoints", done: false, priority: "high" },
    { id: 3, text: "Write documentation", done: false, priority: "low" },
  ])

  return (
    <div className="app">
      <h1>My Tasks</h1>
      {tasks.map(task => (
        <TaskItem key={task.id} task={task} />
      ))}
    </div>
  )
}`;

function MockBuilderPreview() {
  const [step, setStep] = useState(0);
  const [codeVisible, setCodeVisible] = useState(false);
  const [charCount, setCharCount] = useState(0);
  const inView = useInView(useRef(null), { once: true });

  useEffect(() => {
    const timer = setTimeout(() => setStep(1), 800);
    const timer2 = setTimeout(() => { setStep(2); setCodeVisible(true); }, 1600);
    const timer3 = setTimeout(() => setStep(3), 2400);
    const timer4 = setTimeout(() => setStep(4), 3000);
    const timer5 = setTimeout(() => setStep(5), 3600);
    return () => [timer, timer2, timer3, timer4, timer5].forEach(clearTimeout);
  }, []);

  useEffect(() => {
    if (!codeVisible) return;
    if (charCount >= MOCK_CODE.length) return;
    const t = setTimeout(() => setCharCount(c => Math.min(c + 6, MOCK_CODE.length)), 12);
    return () => clearTimeout(t);
  }, [codeVisible, charCount]);

  const completedSteps = step - 1;

  return (
    <div style={{
      borderRadius: "16px",
      overflow: "hidden",
      border: "1px solid rgba(255,255,255,0.1)",
      boxShadow: "0 40px 120px rgba(0,0,0,0.8), 0 0 0 1px rgba(6,182,212,0.08)",
      background: "#080c14",
      fontFamily: "'Manrope', monospace",
    }}>
      {/* Browser chrome */}
      <div style={{
        height: "44px",
        background: "#0d1220",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        display: "flex",
        alignItems: "center",
        gap: "8px",
        padding: "0 16px",
      }}>
        <div style={{ display: "flex", gap: 6 }}>
          {["#ff5f57", "#febc2e", "#28c840"].map((c) => (
            <div key={c} style={{ width: 10, height: 10, borderRadius: "50%", background: c, opacity: 0.8 }} />
          ))}
        </div>
        <div style={{
          flex: 1, maxWidth: 340, margin: "0 auto",
          background: "rgba(255,255,255,0.05)",
          borderRadius: 6,
          height: 24,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 6,
        }}>
          <Lock style={{ width: 9, height: 9, color: "rgba(6,182,212,0.6)" }} />
          <span style={{ fontSize: "11px", color: "rgba(180,200,230,0.5)", fontFamily: "'DM Sans', sans-serif" }}>
            app.sonar.dev/todo-app-7f3a
          </span>
        </div>
        <div style={{ display: "flex", gap: 8, marginLeft: "auto" }}>
          <div style={{ padding: "3px 10px", borderRadius: 6, background: "rgba(6,182,212,0.1)", border: "1px solid rgba(6,182,212,0.25)", fontSize: "10px", fontFamily: "'Plus Jakarta Sans', sans-serif", color: "#06b6d4", fontWeight: 600 }}>S-1</div>
          <div style={{ padding: "3px 10px", borderRadius: 6, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", fontSize: "10px", fontFamily: "'Plus Jakarta Sans', sans-serif", color: "rgba(180,200,230,0.6)", fontWeight: 600 }}>Deploy</div>
        </div>
      </div>

      {/* Main area */}
      <div style={{ display: "grid", gridTemplateColumns: "300px 1fr", height: "360px" }}>

        {/* Left: Chat panel */}
        <div style={{ borderRight: "1px solid rgba(255,255,255,0.05)", padding: "20px 16px", display: "flex", flexDirection: "column", gap: 12, overflowY: "hidden" }}>
          {/* User message */}
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            style={{
              alignSelf: "flex-end",
              background: "rgba(6,182,212,0.12)",
              border: "1px solid rgba(6,182,212,0.2)",
              borderRadius: "12px 12px 4px 12px",
              padding: "10px 14px",
              maxWidth: "90%",
            }}
          >
            <p style={{ fontSize: "12px", color: "#e2e8f0", lineHeight: 1.5 }}>
              Build me a todo app with priorities
            </p>
          </motion.div>

          {/* AI response */}
          {step >= 1 && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
              style={{
                alignSelf: "flex-start",
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.07)",
                borderRadius: "12px 12px 12px 4px",
                padding: "12px 14px",
                maxWidth: "100%",
              }}
            >
              <p style={{ fontSize: "11px", color: "rgba(6,182,212,0.9)", fontWeight: 700, marginBottom: 10, letterSpacing: "0.04em", textTransform: "uppercase" }}>
                Building your app
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {["Analyzing prompt", "Scaffolding React", "Building components", "Writing styles", "Running tests"].map((s, i) => (
                  <div key={s} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    {completedSteps > i ? (
                      <div style={{ width: 14, height: 14, borderRadius: "50%", background: "rgba(16,185,129,0.2)", border: "1px solid rgba(16,185,129,0.4)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <Check style={{ width: 8, height: 8, color: "#10b981" }} />
                      </div>
                    ) : completedSteps === i ? (
                      <div style={{ width: 14, height: 14, borderRadius: "50%", border: "1.5px solid rgba(6,182,212,0.6)", flexShrink: 0, position: "relative", overflow: "hidden" }}>
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                          style={{ position: "absolute", inset: 0, borderRadius: "50%", borderTop: "1.5px solid #06b6d4", borderRight: "1.5px solid transparent", borderBottom: "1.5px solid transparent", borderLeft: "1.5px solid transparent" }}
                        />
                      </div>
                    ) : (
                      <div style={{ width: 14, height: 14, borderRadius: "50%", border: "1px solid rgba(255,255,255,0.1)", flexShrink: 0 }} />
                    )}
                    <span style={{ fontSize: "11px", color: completedSteps > i ? "rgba(180,200,230,0.7)" : completedSteps === i ? "#e2e8f0" : "rgba(100,120,150,0.5)" }}>
                      {s}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {step >= 5 && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              style={{
                alignSelf: "flex-start",
                background: "rgba(16,185,129,0.07)",
                border: "1px solid rgba(16,185,129,0.2)",
                borderRadius: "12px 12px 12px 4px",
                padding: "10px 14px",
              }}
            >
              <p style={{ fontSize: "12px", color: "#10b981", fontWeight: 600 }}>Your app is ready!</p>
              <p style={{ fontSize: "11px", color: "rgba(180,200,230,0.6)", marginTop: 3 }}>Preview available on the right.</p>
            </motion.div>
          )}
        </div>

        {/* Right: Code panel */}
        <div style={{ background: "#06080f", position: "relative", overflow: "hidden" }}>
          {/* Tab bar */}
          <div style={{ height: 32, borderBottom: "1px solid rgba(255,255,255,0.05)", display: "flex", alignItems: "center", padding: "0 12px", gap: 4 }}>
            <div style={{ padding: "4px 12px", borderRadius: "6px 6px 0 0", background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)", borderBottom: "none", fontSize: "10px", color: "#e2e8f0", fontFamily: "'Manrope', monospace" }}>
              App.tsx
            </div>
            <div style={{ padding: "4px 12px", fontSize: "10px", color: "rgba(100,120,150,0.5)", fontFamily: "'Manrope', monospace" }}>
              styles.css
            </div>
          </div>

          {/* Code content */}
          <div style={{ padding: "16px 20px", overflow: "hidden", height: "calc(100% - 32px)" }}>
            <pre style={{
              margin: 0,
              fontFamily: "'Manrope', 'Fira Code', monospace",
              fontSize: "11.5px",
              lineHeight: "1.7",
              color: "rgba(180,200,230,0.85)",
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
            }}>
              {MOCK_CODE.slice(0, charCount).split("\n").map((line, i) => (
                <div key={i} style={{ display: "flex" }}>
                  <span style={{ color: "rgba(60,80,110,0.6)", minWidth: "28px", textAlign: "right", marginRight: "16px", userSelect: "none" }}>{i + 1}</span>
                  <span style={{ color: colorize(line) ? undefined : "rgba(180,200,230,0.75)" }}>
                    {syntaxHighlight(line)}
                  </span>
                </div>
              ))}
              {charCount < MOCK_CODE.length && (
                <motion.span
                  animate={{ opacity: [1, 0, 1] }}
                  transition={{ duration: 0.6, repeat: Infinity }}
                  style={{ display: "inline-block", width: 2, height: "1em", background: "#06b6d4", verticalAlign: "text-bottom", marginLeft: 1 }}
                />
              )}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}

function colorize() { return false; }

function syntaxHighlight(line) {
  // Very simple coloring for keywords
  const kw = ["import", "export", "default", "function", "const", "return", "from"];
  let colored = line;
  const parts = [];
  let remaining = line;

  // Basic keyword highlighting
  for (const word of kw) {
    if (remaining.includes(word + " ") || remaining.includes(word + "(") || remaining.startsWith(word)) {
      const idx = remaining.indexOf(word);
      if (idx !== -1) {
        if (idx > 0) parts.push(<span key={`pre-${word}`} style={{ color: "rgba(180,200,230,0.75)" }}>{remaining.slice(0, idx)}</span>);
        parts.push(<span key={word} style={{ color: "#c084fc" }}>{word}</span>);
        remaining = remaining.slice(idx + word.length);
      }
    }
  }
  if (parts.length === 0) {
    // Color strings
    if (line.includes('"') || line.includes("'")) {
      return <span style={{ color: "rgba(180,200,230,0.75)" }}>{line}</span>;
    }
    return line;
  }
  if (remaining) parts.push(<span key="rest" style={{ color: "rgba(180,200,230,0.75)" }}>{remaining}</span>);
  return parts;
}

function DemoSection() {
  return (
    <section style={{ padding: "0 40px 120px" }}>
      <div style={{ maxWidth: "960px", margin: "0 auto" }}>
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.55 }}
        >
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "11px", color: "rgba(6,182,212,0.7)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 14 }}>
              Voyez-le en action
            </p>
            <h2 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: "clamp(2rem, 4vw, 3rem)", fontWeight: 700, letterSpacing: "-0.04em", color: "#fff", lineHeight: 1.1 }}>
              De l'idée au code,<br />en temps réel.
            </h2>
          </div>
          <MockBuilderPreview />
        </motion.div>
      </div>
    </section>
  );
}

// ─── Value props (horizontal, large) ─────────────────────────────────────────

const VALUES = [
  {
    icon: Zap,
    color: "#06b6d4",
    eyebrow: "Vitesse",
    title: "Zéro setup.",
    desc: "Décrivez votre app. Sonar scaffold, code et déploie. Pas de config Webpack, pas de boilerplate — juste votre idée qui prend vie.",
  },
  {
    icon: Globe,
    color: "#10b981",
    eyebrow: "Production",
    title: "Vraiment deployable.",
    desc: "Pas des prototypes bricolés. Du React moderne, du TypeScript propre, des APIs FastAPI. Code reviewable, editable, exportable.",
  },
  {
    icon: Lock,
    color: "#a78bfa",
    eyebrow: "Contrôle",
    title: "Votre code, vos règles.",
    desc: "Chaque ligne appartient à vous. Exportez vers GitHub, déployez sur votre infra, modifiez dans votre IDE. Aucun lock-in.",
  },
];

function ValueCard({ item, index }) {
  const [hovered, setHovered] = useState(false);
  const Icon = item.icon;
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1, duration: 0.4 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        padding: "36px 32px",
        borderRadius: "20px",
        background: hovered ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.015)",
        border: `1px solid ${hovered ? `${item.color}30` : "rgba(255,255,255,0.06)"}`,
        transition: "all 0.25s",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Glow blob */}
      <div style={{
        position: "absolute", top: -40, right: -40,
        width: 160, height: 160,
        borderRadius: "50%",
        background: `radial-gradient(circle, ${item.color}18 0%, transparent 70%)`,
        transition: "opacity 0.3s",
        opacity: hovered ? 1 : 0.4,
      }} />

      <div style={{ width: 44, height: 44, borderRadius: 12, background: `${item.color}15`, border: `1px solid ${item.color}28`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20 }}>
        <Icon style={{ width: 20, height: 20, color: item.color }} />
      </div>
      <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "10px", fontWeight: 700, color: item.color, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10 }}>
        {item.eyebrow}
      </p>
      <h3 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: "1.55rem", fontWeight: 700, color: "#fff", letterSpacing: "-0.035em", lineHeight: 1.1, marginBottom: 14 }}>
        {item.title}
      </h3>
      <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "13.5px", color: "rgba(140,158,180,0.7)", lineHeight: 1.65 }}>
        {item.desc}
      </p>
    </motion.div>
  );
}

function ValuesSection() {
  return (
    <section style={{ padding: "0 40px 120px", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
      <div style={{ maxWidth: "960px", margin: "0 auto", paddingTop: 100 }}>
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "11px", color: "rgba(6,182,212,0.7)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 14, textAlign: "center" }}
        >
          Pourquoi les devs choisissent Sonar
        </motion.p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px" }}>
          {VALUES.map((v, i) => <ValueCard key={v.eyebrow} item={v} index={i} />)}
        </div>
      </div>
    </section>
  );
}

// ─── Testimonials ─────────────────────────────────────────────────────────────

const TESTIMONIALS = [
  {
    avatar: "JM",
    name: "Jordan M.",
    role: "Indie Hacker",
    handle: "@jordan_builds",
    color: "#06b6d4",
    text: "J'ai lancé mon SaaS en 3 jours. Avant ça me prenait 3 semaines juste pour le setup. Sonar change vraiment la donne.",
  },
  {
    avatar: "SC",
    name: "Sarah C.",
    role: "Product Designer",
    handle: "@sarahcodes",
    color: "#a78bfa",
    text: "Je prototypais en Figma, maintenant je livre directement en production. Le code généré est propre, pas du tout du code IA bâclé.",
  },
  {
    avatar: "TK",
    name: "Thomas K.",
    role: "CTO @ Startup",
    handle: "@tkdev",
    color: "#10b981",
    text: "On a remplacé 40% de notre workload de dev junior avec Sonar. ROI immédiat. L'équipe se concentre sur la logique métier.",
  },
];

function TestimonialCard({ t, index }) {
  const [hovered, setHovered] = useState(false);
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1, duration: 0.4 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        padding: "28px",
        borderRadius: "18px",
        background: hovered ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.02)",
        border: `1px solid ${hovered ? `${t.color}25` : "rgba(255,255,255,0.06)"}`,
        transition: "all 0.2s",
        boxShadow: hovered ? `0 8px 32px ${t.color}10` : "none",
      }}
    >
      <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "14px", color: "rgba(200,215,235,0.8)", lineHeight: 1.65, marginBottom: 24, fontStyle: "italic" }}>
        "{t.text}"
      </p>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{
          width: 36, height: 36, borderRadius: "50%",
          background: `${t.color}22`,
          border: `1.5px solid ${t.color}40`,
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0,
        }}>
          <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: "11px", fontWeight: 900, color: t.color }}>
            {t.avatar}
          </span>
        </div>
        <div>
          <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: "13px", fontWeight: 600, color: "#e2e8f0", marginBottom: 2 }}>
            {t.name}
          </p>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "11px", color: "rgba(100,120,150,0.6)" }}>
            {t.role} · <span style={{ color: t.color }}>{t.handle}</span>
          </p>
        </div>
      </div>
    </motion.div>
  );
}

function TestimonialsSection() {
  return (
    <section style={{ padding: "0 40px 120px" }}>
      <div style={{ maxWidth: "960px", margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 56 }}>
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "11px", color: "rgba(6,182,212,0.7)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 14 }}
          >
            Ce qu'ils disent
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: "clamp(1.9rem, 4vw, 2.8rem)", fontWeight: 700, letterSpacing: "-0.04em", color: "#fff", lineHeight: 1.1 }}
          >
            Des équipes qui livrent<br />deux fois plus vite.
          </motion.h2>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px" }}>
          {TESTIMONIALS.map((t, i) => <TestimonialCard key={t.handle} t={t} index={i} />)}
        </div>
      </div>
    </section>
  );
}

// ─── Final CTA ────────────────────────────────────────────────────────────────

function CtaSection() {
  const [hovered, setHovered] = useState(false);
  return (
    <section style={{ padding: "0 40px 120px" }}>
      <motion.div
        initial={{ opacity: 0, y: 32 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        style={{
          maxWidth: "780px",
          margin: "0 auto",
          textAlign: "center",
          padding: "80px 48px",
          borderRadius: "28px",
          background: "linear-gradient(140deg, rgba(12,31,74,0.9) 0%, rgba(6,13,30,0.95) 55%, rgba(1,4,8,1) 100%)",
          border: "1px solid rgba(6,182,212,0.15)",
          boxShadow: "0 0 80px rgba(6,182,212,0.06), 0 40px 80px rgba(0,0,0,0.6)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Glow */}
        <div style={{
          position: "absolute", top: -80, left: "50%", transform: "translateX(-50%)",
          width: 500, height: 300,
          background: "radial-gradient(ellipse, rgba(6,182,212,0.12) 0%, transparent 70%)",
          pointerEvents: "none",
        }} />

        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "11px", color: "rgba(6,182,212,0.7)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 20, position: "relative" }}>
          Prêt à builder ?
        </p>
        <h2 style={{
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          fontSize: "clamp(2.2rem, 5vw, 3.5rem)",
          fontWeight: 700,
          letterSpacing: "-0.045em",
          color: "#fff",
          lineHeight: 1.05,
          marginBottom: 20,
          position: "relative",
        }}>
          Votre prochaine app<br />commence ici.
        </h2>
        <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: "1.05rem", color: "rgba(180,195,215,0.55)", marginBottom: 40, position: "relative" }}>
          Gratuit pour commencer. Aucune carte bancaire requise.
        </p>

        <div style={{ display: "flex", justifyContent: "center", gap: 12, flexWrap: "wrap", position: "relative" }}>
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            data-testid="cta-start-building"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "14px 28px",
              borderRadius: "12px",
              background: "linear-gradient(135deg, #06b6d4, #0ea5e9)",
              color: "#000",
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontWeight: 700,
              fontSize: "15px",
              border: "none",
              cursor: "pointer",
              boxShadow: "0 0 32px rgba(6,182,212,0.4)",
              transition: "box-shadow 0.2s",
            }}
          >
            Commencer gratuitement
            <ArrowRight style={{ width: 15, height: 15 }} />
          </motion.button>

          <button
            data-testid="cta-github"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "14px 24px",
              borderRadius: "12px",
              background: "rgba(255,255,255,0.06)",
              color: "rgba(220,230,245,0.8)",
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontWeight: 600,
              fontSize: "14px",
              border: "1px solid rgba(255,255,255,0.1)",
              cursor: "pointer",
              transition: "background 0.15s",
            }}
            onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.1)"}
            onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.06)"}
          >
            <GitBranch style={{ width: 16, height: 16 }} />
            Voir sur GitHub
          </button>
        </div>
      </motion.div>
    </section>
  );
}

// ─── Footer ───────────────────────────────────────────────────────────────────

function Footer() {
  const links = {
    Produit:    ["Fonctionnalités", "Tarifs", "Roadmap", "Changelog"],
    Ressources: ["Documentation", "Tutoriels", "Blog", "Status"],
    Société:    ["À propos", "Carrières", "Presse", "Contact"],
    Légal:      ["Conditions", "Confidentialité", "Sécurité", "Cookies"],
  };
  return (
    <footer style={{ borderTop: "1px solid rgba(255,255,255,0.06)", padding: "64px 40px 40px" }}>
      <div style={{ maxWidth: "1080px", margin: "0 auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr", gap: "32px", marginBottom: 56 }}>
          <div>
            <span style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 900, fontSize: "1.2rem", letterSpacing: "-0.05em", color: "#fff", display: "block", marginBottom: 12 }}>
              sonar
            </span>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "13px", color: "rgba(140,158,180,0.5)", lineHeight: 1.7, maxWidth: 220 }}>
              Construisez des applications production-ready en quelques minutes grâce à l'IA.
            </p>
          </div>
          {Object.entries(links).map(([cat, items]) => (
            <div key={cat}>
              <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: "11px", fontWeight: 600, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 14 }}>
                {cat}
              </p>
              {items.map(item => (
                <a
                  key={item}
                  href="#"
                  style={{ display: "block", fontFamily: "'DM Sans', sans-serif", fontSize: "13px", color: "rgba(140,158,180,0.5)", marginBottom: 10, textDecoration: "none", transition: "color 0.15s" }}
                  onMouseEnter={e => { e.target.style.color = "rgba(180,195,215,0.85)"; }}
                  onMouseLeave={e => { e.target.style.color = "rgba(140,158,180,0.5)"; }}
                >
                  {item}
                </a>
              ))}
            </div>
          ))}
        </div>
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: 24, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "12px", color: "rgba(100,116,139,0.4)" }}>
            © 2025 Sonar. Tous droits réservés.
          </p>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "12px", color: "rgba(100,116,139,0.3)" }}>
            Propulsé par l'IA
          </p>
        </div>
      </div>
    </footer>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────

export default function LandingSections() {
  return (
    <div style={{ background: "#000308" }}>
      <StatsSection />
      <DemoSection />
      <ValuesSection />
      <TestimonialsSection />
      <CtaSection />
      <Footer />
    </div>
  );
}
