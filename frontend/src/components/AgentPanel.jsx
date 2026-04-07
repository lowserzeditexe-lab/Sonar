import { motion, AnimatePresence } from "framer-motion";
import { Brain, GitBranch, Code2, Bug, CheckCircle, Loader2, Clock } from "lucide-react";

const ICONS = { Brain, GitBranch, Code2, Bug };

const STATUS_CONFIG = {
  waiting: { color: "#475569", bg: "rgba(71,85,105,0.1)", label: "Waiting", dot: "#475569" },
  active: { color: "#06b6d4", bg: "rgba(6,182,212,0.1)", label: "Working", dot: "#06b6d4" },
  done: { color: "#10b981", bg: "rgba(16,185,129,0.1)", label: "Done", dot: "#10b981" },
};

function AgentStep({ agent, status, isLast, index, logs }) {
  const Icon = ICONS[agent.icon] || Code2;
  const cfg = STATUS_CONFIG[status];

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1, duration: 0.4 }}
      className="relative flex gap-3"
    >
      {/* Timeline line */}
      {!isLast && (
        <div className="absolute left-4 top-9 bottom-0 w-px"
          style={{ background: status === "done" ? "rgba(16,185,129,0.3)" : "rgba(30,41,59,0.6)" }} />
      )}

      {/* Icon bubble */}
      <div
        className="relative z-10 flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-500"
        style={{
          background: cfg.bg,
          border: `1px solid ${cfg.color}40`,
          boxShadow: status === "active" ? `0 0 12px ${cfg.color}30` : "none",
        }}
      >
        {status === "active" ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" style={{ color: cfg.color }} />
        ) : status === "done" ? (
          <CheckCircle className="w-3.5 h-3.5" style={{ color: cfg.color }} />
        ) : (
          <Icon className="w-3.5 h-3.5" style={{ color: cfg.color }} />
        )}
        {status === "active" && (
          <motion.div
            animate={{ scale: [1, 1.8, 1], opacity: [0.6, 0, 0.6] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="absolute inset-0 rounded-full"
            style={{ background: cfg.color, opacity: 0.2 }}
          />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 pb-5">
        <div className="flex items-center justify-between mb-0.5">
          <span
            className="text-xs font-semibold"
            style={{ color: status === "waiting" ? "#475569" : "#e2e8f0" }}
          >
            {agent.name}
          </span>
          <span className="text-xs flex items-center gap-1" style={{ color: cfg.color }}>
            <div className="w-1.5 h-1.5 rounded-full" style={{ background: cfg.dot, animation: status === "active" ? "pulse 1s infinite" : "none" }} />
            {cfg.label}
          </span>
        </div>
        <p className="text-xs leading-relaxed" style={{ color: status === "waiting" ? "#334155" : "#64748b" }}>
          {agent.description}
        </p>

        {/* Log snippets for active/done */}
        <AnimatePresence>
          {status !== "waiting" && logs && logs.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-2 space-y-1 overflow-hidden"
            >
              {logs.map((log, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="flex items-start gap-1.5 text-xs"
                >
                  <span className="text-cyan-500 mt-0.5 flex-shrink-0">›</span>
                  <span style={{ color: "#475569" }}>{log}</span>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

export default function AgentPanel({ agentStatuses, agentLogs }) {
  const steps = [
    { id: "planner", name: "Planner", icon: "Brain", description: "Analyzing requirements, planning architecture and feature scope" },
    { id: "architect", name: "Architect", icon: "GitBranch", description: "Designing component tree, data models, and API contracts" },
    { id: "coder", name: "Coder", icon: "Code2", description: "Writing React components and implementing business logic" },
    { id: "debugger", name: "Debugger", icon: "Bug", description: "Running tests, fixing edge cases, optimizing performance" },
  ];

  const activeCount = steps.filter(s => agentStatuses[s.id] === "active").length;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 flex-shrink-0"
        style={{ borderBottom: "1px solid rgba(30,41,59,0.6)" }}>
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Agents</span>
          {activeCount > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-1.5 text-xs text-cyan-400"
            >
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
                className="w-1.5 h-1.5 rounded-full bg-cyan-400"
              />
              {activeCount} active
            </motion.div>
          )}
        </div>
      </div>

      {/* Steps */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {steps.map((step, i) => (
          <AgentStep
            key={step.id}
            agent={step}
            status={agentStatuses[step.id] || "waiting"}
            isLast={i === steps.length - 1}
            index={i}
            logs={agentLogs?.[step.id] || []}
          />
        ))}
      </div>
    </div>
  );
}
