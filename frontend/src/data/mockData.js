// Mock project templates
export const PROJECT_TEMPLATES = {
  todo: {
    name: "Todo App",
    prompt: "Build a beautiful todo app with priority levels, due dates, and categories",
    preview: "todo",
    estimatedCost: "$0.08",
    estimatedTime: "35s",
  },
  dashboard: {
    name: "Analytics Dashboard",
    prompt: "Create a real-time analytics dashboard with charts, KPI cards, and user metrics",
    preview: "dashboard",
    estimatedCost: "$0.14",
    estimatedTime: "52s",
  },
  ecommerce: {
    name: "E-Commerce Store",
    prompt: "Build a modern e-commerce store with product grid, cart, and checkout flow",
    preview: "ecommerce",
    estimatedCost: "$0.19",
    estimatedTime: "68s",
  },
};

export const AGENT_STEPS = [
  { id: "planner", name: "Planner", icon: "Brain", description: "Analyzing requirements and planning architecture" },
  { id: "architect", name: "Architect", icon: "GitBranch", description: "Designing component structure and data models" },
  { id: "coder", name: "Coder", icon: "Code2", description: "Writing React components and business logic" },
  { id: "debugger", name: "Debugger", icon: "Bug", description: "Running tests and fixing edge cases" },
];

export const MODELS = [
  { id: "gpt-4o", label: "ChatGPT", provider: "openai", color: "#10B981" },
  { id: "claude-sonnet", label: "Claude", provider: "anthropic", color: "#D97757" },
  { id: "gemini-pro", label: "Gemini", provider: "google", color: "#4285F4" },
];

export const TODO_CODE = `import { useState } from "react";

const priorities = ["Low", "Medium", "High"];

export default function TodoApp() {
  const [todos, setTodos] = useState([
    { id: 1, text: "Design system architecture", done: false, priority: "High" },
    { id: 2, text: "Set up CI/CD pipeline", done: true, priority: "Medium" },
    { id: 3, text: "Write unit tests", done: false, priority: "High" },
    { id: 4, text: "Deploy to production", done: false, priority: "Low" },
  ]);
  const [input, setInput] = useState("");
  const [priority, setPriority] = useState("Medium");

  const add = () => {
    if (!input.trim()) return;
    setTodos([...todos, {
      id: Date.now(), text: input,
      done: false, priority
    }]);
    setInput("");
  };

  const toggle = (id) =>
    setTodos(todos.map(t => t.id === id ? { ...t, done: !t.done } : t));

  return (
    <div className="min-h-screen bg-gray-950 text-white p-8">
      <h1 className="text-3xl font-bold mb-2 text-cyan-400">My Tasks</h1>
      <p className="text-gray-400 mb-6">{todos.filter(t=>!t.done).length} remaining</p>
      <div className="flex gap-2 mb-6">
        <input value={input} onChange={e=>setInput(e.target.value)}
          placeholder="Add a task..." onKeyDown={e=>e.key==="Enter"&&add()}
          className="flex-1 bg-gray-800 rounded-lg px-4 py-2 outline-none" />
        <select value={priority} onChange={e=>setPriority(e.target.value)}
          className="bg-gray-800 rounded-lg px-3 py-2">
          {priorities.map(p => <option key={p}>{p}</option>)}
        </select>
        <button onClick={add} className="bg-cyan-500 hover:bg-cyan-400
          text-black font-semibold px-4 py-2 rounded-lg">Add</button>
      </div>
      <div className="space-y-2">
        {todos.map(todo => (
          <div key={todo.id} onClick={()=>toggle(todo.id)}
            className={\`flex items-center gap-3 p-4 rounded-xl cursor-pointer
              transition-all \${todo.done ? "opacity-40" : "bg-gray-800/60"}\`}>
            <div className={\`w-5 h-5 rounded-full border-2 flex items-center
              justify-center \${todo.done ? "bg-cyan-500 border-cyan-500" : 
              "border-gray-500"}\`}>
              {todo.done && <span className="text-xs">✓</span>}
            </div>
            <span className={\`flex-1 \${todo.done ? "line-through" : ""}\`}>
              {todo.text}
            </span>
            <span className={\`text-xs px-2 py-0.5 rounded-full \${
              todo.priority === "High" ? "bg-red-500/20 text-red-400" :
              todo.priority === "Medium" ? "bg-yellow-500/20 text-yellow-400" :
              "bg-green-500/20 text-green-400"}\`}>{todo.priority}</span>
          </div>
        ))}
      </div>
    </div>
  );
}`;

export const DASHBOARD_CODE = `import { useState } from "react";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis,
  Tooltip, ResponsiveContainer } from "recharts";

const revenue = [
  { month: "Jan", value: 42000 }, { month: "Feb", value: 53000 },
  { month: "Mar", value: 48000 }, { month: "Apr", value: 61000 },
  { month: "May", value: 79000 }, { month: "Jun", value: 95000 },
];

const kpis = [
  { label: "Total Revenue", value: "$378K", change: "+18.2%", up: true },
  { label: "Active Users", value: "24,891", change: "+5.4%", up: true },
  { label: "Conversion Rate", value: "3.24%", change: "-0.8%", up: false },
  { label: "Avg. Session", value: "4m 32s", change: "+12%", up: true },
];

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-gray-950 text-white p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Analytics Overview</h1>
        <span className="text-sm text-gray-400">Last 6 months</span>
      </div>
      <div className="grid grid-cols-2 gap-4 mb-6">
        {kpis.map(k => (
          <div key={k.label} className="bg-gray-800/60 rounded-xl p-4">
            <p className="text-gray-400 text-sm mb-1">{k.label}</p>
            <p className="text-2xl font-bold">{k.value}</p>
            <span className={\`text-xs \${k.up ? "text-emerald-400" : "text-red-400"}\`}>
              {k.change}
            </span>
          </div>
        ))}
      </div>
      <div className="bg-gray-800/60 rounded-xl p-4">
        <p className="text-sm text-gray-400 mb-3">Monthly Revenue</p>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={revenue}>
            <XAxis dataKey="month" tick={{fill:"#6b7280",fontSize:11}} />
            <YAxis hide />
            <Tooltip contentStyle={{background:"#1f2937",border:"none"}} />
            <Bar dataKey="value" fill="#06b6d4" radius={[4,4,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}`;

export const ECOMMERCE_CODE = `import { useState } from "react";

const products = [
  { id: 1, name: "Wireless Headphones", price: 149, rating: 4.8, img: "🎧" },
  { id: 2, name: "Mechanical Keyboard", price: 229, rating: 4.9, img: "⌨️" },
  { id: 3, name: "4K Webcam", price: 99, rating: 4.6, img: "📷" },
  { id: 4, name: "Desk Lamp", price: 59, rating: 4.7, img: "💡" },
  { id: 5, name: "USB-C Hub", price: 79, rating: 4.5, img: "🔌" },
  { id: 6, name: "Monitor Stand", price: 89, rating: 4.8, img: "🖥️" },
];

export default function Store() {
  const [cart, setCart] = useState([]);
  const total = cart.reduce((s, p) => s + p.price, 0);

  return (
    <div className="min-h-screen bg-white text-gray-900 p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">TechStore</h1>
        <div className="relative">
          <span className="text-2xl cursor-pointer">🛒</span>
          {cart.length > 0 && (
            <span className="absolute -top-1 -right-1 bg-blue-600 text-white
              text-xs w-4 h-4 rounded-full flex items-center justify-center">
              {cart.length}
            </span>
          )}
        </div>
      </div>
      {cart.length > 0 && (
        <div className="bg-blue-50 rounded-xl p-3 mb-4 flex justify-between">
          <span className="text-sm text-blue-700">{cart.length} items in cart</span>
          <span className="font-bold text-blue-700">\${total}</span>
        </div>
      )}
      <div className="grid grid-cols-2 gap-4">
        {products.map(p => (
          <div key={p.id} className="border border-gray-200 rounded-xl p-4
            hover:shadow-md transition-shadow">
            <div className="text-4xl mb-3 text-center">{p.img}</div>
            <p className="font-semibold text-sm mb-1">{p.name}</p>
            <p className="text-xs text-gray-400 mb-2">⭐ {p.rating}</p>
            <div className="flex items-center justify-between">
              <span className="font-bold">\${p.price}</span>
              <button onClick={()=>setCart([...cart,p])}
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs
                px-3 py-1.5 rounded-lg transition-colors">Add</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}`;

export const CODE_BY_PROJECT = {
  todo: TODO_CODE,
  dashboard: DASHBOARD_CODE,
  ecommerce: ECOMMERCE_CODE,
};

export const MOCK_LOGS = [
  "$ npm run build",
  "> react-scripts build",
  "Creating an optimized production build...",
  "Compiling...",
  "✓ Compiled successfully.",
  "File sizes after gzip:",
  "  48.23 kB  build/static/js/main.chunk.js",
  "  1.78 kB   build/static/js/runtime-main.js",
  "  531 B     build/static/css/main.chunk.css",
  "✓ Build complete.",
  "$ sonar deploy --env=production",
  "Uploading build artifacts...",
  "Provisioning edge network...",
  "✓ Deployed to https://my-app.sonar.sh",
  "✓ DNS propagated in 1.2s",
  "✓ Live at: https://my-app.sonar.sh",
];

export const CHAT_RESPONSES = {
  todo: [
    { role: "assistant", content: "I'll build you a beautiful todo app with priority levels, due dates, and categories. Let me start by planning the architecture..." },
    { role: "assistant", content: "Planning complete. Setting up React components: TodoItem, TodoList, AddTodoForm, FilterPanel..." },
    { role: "assistant", content: "Implementing priority color system and localStorage persistence..." },
    { role: "assistant", content: "Your Todo App is ready! Features: priority levels (High/Medium/Low), task completion, clean dark UI." },
  ],
  dashboard: [
    { role: "assistant", content: "Creating a real-time analytics dashboard with charts and KPI cards. Analyzing data structure..." },
    { role: "assistant", content: "Setting up Recharts for data visualization: BarChart for revenue, LineChart for user growth..." },
    { role: "assistant", content: "Building responsive grid layout with KPI summary cards..." },
    { role: "assistant", content: "Your Analytics Dashboard is ready! Includes revenue charts, KPI cards, and period comparison." },
  ],
  ecommerce: [
    { role: "assistant", content: "Building a modern e-commerce store with product grid, cart management, and checkout flow..." },
    { role: "assistant", content: "Setting up product catalog, cart state management, and pricing logic..." },
    { role: "assistant", content: "Implementing cart persistence, quantity controls, and responsive product grid..." },
    { role: "assistant", content: "Your E-Commerce Store is live! Includes product listings, add-to-cart, and cart summary." },
  ],
};
