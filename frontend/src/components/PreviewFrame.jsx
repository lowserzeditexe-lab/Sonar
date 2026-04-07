import { useEffect, useRef } from "react";

/**
 * PreviewFrame — Renders AI-generated React + Tailwind code in a sandboxed iframe.
 * Uses srcdoc directly with embedded code — no postMessage race condition.
 */
export default function PreviewFrame({ code, refreshKey = 0 }) {
  const iframeRef = useRef(null);

  useEffect(() => {
    if (!code || !iframeRef.current) return;
    iframeRef.current.srcdoc = buildFrameHtml(code);
  }, [code, refreshKey]);

  if (!code) {
    return (
      <div className="h-full flex items-center justify-center"
        style={{ background: "#0d1117", color: "rgba(100,120,150,0.5)", fontFamily: "'DM Sans', sans-serif", fontSize: 13 }}>
        Waiting for generated code...
      </div>
    );
  }

  return (
    <div className="h-full w-full relative" style={{ background: "#fff" }}>
      <iframe
        ref={iframeRef}
        title="App Preview"
        data-testid="preview-iframe"
        sandbox="allow-scripts"
        style={{ width: "100%", height: "100%", border: "none", background: "#fff" }}
      />
    </div>
  );
}

function jsonSafe(str) {
  return JSON.stringify(str).replace(/<\//g, "<\\/");
}

function buildFrameHtml(code) {
  const codeJson = jsonSafe(code);
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Preview</title>
  <script src="https://cdn.tailwindcss.com"><\/script>
  <script src="https://unpkg.com/react@18/umd/react.development.js" crossorigin><\/script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js" crossorigin><\/script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"><\/script>
  <script src="https://unpkg.com/recharts@2.12.7/umd/Recharts.js"><\/script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: system-ui, -apple-system, sans-serif; }
    #root { min-height: 100vh; }
    #err { padding: 20px; color: #ef4444; font-family: monospace; font-size: 12px;
           background: #1a1a1a; min-height: 100vh; display: none; }
    #err.show { display: block; }
  </style>
</head>
<body>
  <div id="root"></div>
  <div id="err"><h3>Preview Error</h3><pre id="err-text"></pre></div>
  <script>
    var EMBEDDED_CODE = ${codeJson};

    function renderCode(rawCode) {
      var root = document.getElementById("root");
      var err  = document.getElementById("err");
      var errT = document.getElementById("err-text");
      root.style.display = "block";
      err.className = "";
      try {
        var code = rawCode;
        code = code.replace(/^\\s*import\\s+.*?from\\s+['"]react['"];?\\s*$/gm, "");
        code = code.replace(/^\\s*import\\s+.*?from\\s+['"]recharts['"];?\\s*$/gm, "");
        code = code.replace(/^\\s*import\\s+.*?from\\s+['"]lucide-react['"];?\\s*$/gm, "");
        code = code.replace(/^\\s*import\\s+.*?from\\s+['"]react-dom['"];?\\s*$/gm, "");
        code = code.replace(/export\\s+default\\s+function\\s+/g, "function ");
        code = code.replace(/^\\s*export\\s+default\\s+/gm, "var __Default__ = ");
        var names = ["App","Counter","CounterApp","TodoApp","Dashboard","Store","MainApp","Home","Main","Page","__Default__"];
        var find = names.map(function(n){ return "typeof "+n+" !== 'undefined' ? "+n; }).join("\\n  : ");
        var wrapped = code + "\\nvar _C = " + find + "\\n  : null;\\n" +
          "if (_C) { ReactDOM.createRoot(document.getElementById('root')).render(React.createElement(_C)); }\\n" +
          "else { document.getElementById('root').innerHTML = '<div style=\\"padding:40px;color:#888\\">No component found</div>'; }";
        var globals = "var useState=React.useState,useEffect=React.useEffect,useCallback=React.useCallback," +
          "useMemo=React.useMemo,useRef=React.useRef,useContext=React.useContext," +
          "useReducer=React.useReducer,createContext=React.createContext,memo=React.memo," +
          "Fragment=React.Fragment,useId=React.useId||(function(){return Math.random().toString(36).slice(2);});\\n";
        if (window.Recharts) {
          Object.keys(window.Recharts).forEach(function(k){ globals += "var "+k+"=window.Recharts."+k+";\\n"; });
        }
        var out = Babel.transform(globals + wrapped, { presets: ["react"], filename: "App.jsx" });
        (new Function(out.code))();
      } catch(e) {
        root.style.display = "none";
        err.className = "show";
        errT.textContent = e.message + "\\n\\n" + (e.stack || "");
      }
    }

    window.addEventListener("load", function() { renderCode(EMBEDDED_CODE); });
  <\/script>
</body>
</html>`;
}
