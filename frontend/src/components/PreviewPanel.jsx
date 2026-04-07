import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RefreshCw, ExternalLink, Smartphone, Monitor, Tablet, Loader2 } from "lucide-react";

// Inline Todo Preview
function TodoPreview() {
  const [todos, setTodos] = useState([
    { id: 1, text: "Design system architecture", done: false, priority: "High" },
    { id: 2, text: "Set up CI/CD pipeline", done: true, priority: "Medium" },
    { id: 3, text: "Write unit tests", done: false, priority: "High" },
    { id: 4, text: "Deploy to production", done: false, priority: "Low" },
  ]);
  const [input, setInput] = useState("");

  const toggle = (id) => setTodos(t => t.map(x => x.id === id ? { ...x, done: !x.done } : x));
  const add = () => {
    if (!input.trim()) return;
    setTodos(t => [...t, { id: Date.now(), text: input, done: false, priority: "Medium" }]);
    setInput("");
  };

  return (
    <div className="min-h-full p-5" style={{ background: "#030712", fontFamily: "system-ui, sans-serif" }}>
      <h1 className="text-xl font-bold mb-1" style={{ color: "#22d3ee" }}>My Tasks</h1>
      <p className="text-xs mb-4" style={{ color: "#6b7280" }}>{todos.filter(t => !t.done).length} tasks remaining</p>
      <div className="flex gap-2 mb-4">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && add()}
          placeholder="Add task..."
          className="flex-1 px-3 py-2 rounded-lg outline-none text-sm"
          style={{ background: "#1f2937", color: "#f9fafb", border: "1px solid #374151" }}
        />
        <button
          onClick={add}
          className="px-3 py-2 rounded-lg text-xs font-semibold"
          style={{ background: "#0e7490", color: "#fff" }}
        >
          Add
        </button>
      </div>
      <div className="space-y-2">
        {todos.map(t => (
          <div
            key={t.id}
            onClick={() => toggle(t.id)}
            className="flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-opacity"
            style={{ background: "#111827", opacity: t.done ? 0.5 : 1 }}
          >
            <div
              className="w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0"
              style={{ borderColor: t.done ? "#22d3ee" : "#374151", background: t.done ? "#22d3ee" : "transparent" }}
            >
              {t.done && <span style={{ color: "#000", fontSize: "9px" }}>✓</span>}
            </div>
            <span className="flex-1 text-sm" style={{ color: "#d1d5db", textDecoration: t.done ? "line-through" : "none" }}>
              {t.text}
            </span>
            <span
              className="text-xs px-2 py-0.5 rounded-full"
              style={{
                background: t.priority === "High" ? "#450a0a" : t.priority === "Medium" ? "#422006" : "#052e16",
                color: t.priority === "High" ? "#f87171" : t.priority === "Medium" ? "#fb923c" : "#4ade80",
              }}
            >
              {t.priority}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Inline Dashboard Preview
function DashboardPreview() {
  const kpis = [
    { label: "Revenue", value: "$378K", change: "+18%", up: true },
    { label: "Users", value: "24.8K", change: "+5%", up: true },
    { label: "Conv. Rate", value: "3.24%", change: "-0.8%", up: false },
    { label: "Avg Session", value: "4m 32s", change: "+12%", up: true },
  ];
  const bars = [42, 53, 48, 61, 79, 95];
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];

  return (
    <div className="min-h-full p-4" style={{ background: "#030712", fontFamily: "system-ui, sans-serif" }}>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-lg font-bold" style={{ color: "#f9fafb" }}>Analytics</h1>
        <span className="text-xs px-2 py-1 rounded-lg" style={{ background: "#1f2937", color: "#6b7280" }}>Last 6 months</span>
      </div>
      <div className="grid grid-cols-2 gap-2 mb-4">
        {kpis.map(k => (
          <div key={k.label} className="p-3 rounded-xl" style={{ background: "#111827" }}>
            <p className="text-xs mb-1" style={{ color: "#6b7280" }}>{k.label}</p>
            <p className="text-lg font-bold" style={{ color: "#f9fafb" }}>{k.value}</p>
            <span className="text-xs" style={{ color: k.up ? "#4ade80" : "#f87171" }}>{k.change}</span>
          </div>
        ))}
      </div>
      <div className="p-3 rounded-xl" style={{ background: "#111827" }}>
        <p className="text-xs mb-3" style={{ color: "#6b7280" }}>Monthly Revenue</p>
        <div className="flex items-end gap-2 h-24">
          {bars.map((b, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: `${(b / 100) * 80}px` }}
                transition={{ delay: i * 0.05, duration: 0.5 }}
                className="w-full rounded-t-sm"
                style={{ background: "#0e7490", minHeight: "4px" }}
              />
              <span className="text-xs" style={{ color: "#4b5563", fontSize: "9px" }}>{months[i]}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Inline Ecommerce Preview
function EcommercePreview() {
  const [cart, setCart] = useState([]);
  const products = [
    { id: 1, name: "Headphones", price: 149, emoji: "🎧" },
    { id: 2, name: "Keyboard", price: 229, emoji: "⌨️" },
    { id: 3, name: "Webcam", price: 99, emoji: "📷" },
    { id: 4, name: "Desk Lamp", price: 59, emoji: "💡" },
  ];

  return (
    <div className="min-h-full p-4" style={{ background: "#ffffff", fontFamily: "system-ui, sans-serif" }}>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-lg font-bold" style={{ color: "#111827" }}>TechStore</h1>
        <div className="relative">
          <span className="text-xl">🛒</span>
          {cart.length > 0 && (
            <span
              className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-white text-xs flex items-center justify-center"
              style={{ background: "#2563eb", fontSize: "10px" }}
            >
              {cart.length}
            </span>
          )}
        </div>
      </div>
      {cart.length > 0 && (
        <div className="p-2 rounded-lg mb-3 flex justify-between text-sm"
          style={{ background: "#eff6ff", color: "#1d4ed8" }}>
          <span>{cart.length} items</span>
          <span className="font-bold">${cart.reduce((s, p) => s + p.price, 0)}</span>
        </div>
      )}
      <div className="grid grid-cols-2 gap-3">
        {products.map(p => (
          <div key={p.id} className="p-3 rounded-xl border" style={{ borderColor: "#e5e7eb" }}>
            <div className="text-3xl text-center mb-2">{p.emoji}</div>
            <p className="font-medium text-sm mb-2" style={{ color: "#111827" }}>{p.name}</p>
            <div className="flex items-center justify-between">
              <span className="font-bold text-sm" style={{ color: "#111827" }}>${p.price}</span>
              <button
                onClick={() => setCart(c => [...c, p])}
                className="px-2 py-1 rounded-lg text-xs text-white"
                style={{ background: "#2563eb" }}
              >
                Add
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const PREVIEWS = { todo: TodoPreview, dashboard: DashboardPreview, ecommerce: EcommercePreview };

export default function PreviewPanel({ projectType, isGenerating }) {
  const [viewMode, setViewMode] = useState("desktop");
  const [refreshKey, setRefreshKey] = useState(0);

  const PreviewComp = PREVIEWS[projectType];

  const widths = { mobile: "w-64", tablet: "w-80", desktop: "w-full" };

  return (
    <div className="flex flex-col h-full" style={{ background: "#0a0f1a" }}>
      {/* Browser chrome */}
      <div className="flex items-center gap-2 px-3 py-2.5 flex-shrink-0"
        style={{ background: "#010409", borderBottom: "1px solid #21262d" }}>
        <div className="flex items-center gap-1.5 mr-2">
          <div className="w-3 h-3 rounded-full" style={{ background: "#ff5f57" }} />
          <div className="w-3 h-3 rounded-full" style={{ background: "#febc2e" }} />
          <div className="w-3 h-3 rounded-full" style={{ background: "#28c840" }} />
        </div>
        <div
          className="flex-1 flex items-center gap-2 px-3 py-1 rounded-lg text-xs"
          style={{ background: "#161b22", border: "1px solid #30363d", color: "#848d97" }}
        >
          <span className="text-green-500">🔒</span>
          <span>localhost:3000</span>
        </div>
        <div className="flex items-center gap-1 ml-2">
          {[
            { id: "mobile", Icon: Smartphone },
            { id: "tablet", Icon: Tablet },
            { id: "desktop", Icon: Monitor },
          ].map(({ id, Icon }) => (
            <button
              key={id}
              data-testid={`view-${id}`}
              onClick={() => setViewMode(id)}
              className="p-1.5 rounded transition-colors"
              style={{
                color: viewMode === id ? "#06b6d4" : "#4b5563",
                background: viewMode === id ? "rgba(6,182,212,0.1)" : "transparent",
              }}
            >
              <Icon className="w-3.5 h-3.5" />
            </button>
          ))}
          <button
            data-testid="refresh-preview"
            onClick={() => setRefreshKey(k => k + 1)}
            className="p-1.5 rounded ml-1 transition-colors"
            style={{ color: "#4b5563" }}
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
          <button
            data-testid="open-external"
            className="p-1.5 rounded transition-colors"
            style={{ color: "#4b5563" }}
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Preview Area */}
      <div className="flex-1 overflow-hidden flex items-start justify-center p-3">
        <AnimatePresence mode="wait">
          {isGenerating ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center h-full w-full gap-4"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="w-10 h-10 rounded-full border-2 border-cyan-800 border-t-cyan-400"
              />
              <p className="text-xs text-slate-500">Building preview...</p>
            </motion.div>
          ) : PreviewComp ? (
            <motion.div
              key={`${projectType}-${refreshKey}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className={`overflow-auto rounded-xl ${viewMode !== "desktop" ? widths[viewMode] : "w-full"} h-full`}
              style={{ border: "1px solid #21262d" }}
            >
              <PreviewComp key={refreshKey} />
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center h-full gap-4 text-center"
            >
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
                style={{ background: "rgba(6,182,212,0.08)", border: "1px solid rgba(6,182,212,0.12)" }}>
                <Monitor className="w-7 h-7 text-slate-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">No preview yet</p>
                <p className="text-xs text-slate-700 mt-1">Type your idea to get started</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
