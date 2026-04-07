import { useEffect, useRef, useState } from "react";

/**
 * PreviewFrame — Renders AI-generated React + Tailwind code in a sandboxed iframe.
 * Uses postMessage to inject code safely, avoiding escaping issues.
 */
export default function PreviewFrame({ code, refreshKey = 0 }) {
  const iframeRef = useRef(null);

  useEffect(() => {
    if (!code || !iframeRef.current) return;

    const iframe = iframeRef.current;
    
    // Set the base HTML first
    iframe.srcdoc = FRAME_HTML;

    // Wait for iframe to load, then send code via postMessage
    const handleLoad = () => {
      iframe.contentWindow.postMessage({ type: "render-code", code }, "*");
    };

    iframe.addEventListener("load", handleLoad);
    return () => iframe.removeEventListener("load", handleLoad);
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
        style={{
          width: "100%",
          height: "100%",
          border: "none",
          background: "#fff",
        }}
      />
    </div>
  );
}

const FRAME_HTML = `<!DOCTYPE html>
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
    #error-display { 
      padding: 20px; color: #ef4444; font-family: monospace; 
      font-size: 13px; background: #1a1a1a; min-height: 100vh;
      display: none;
    }
    #error-display.visible { display: block; }
    #error-display h3 { margin-bottom: 8px; }
    #error-display pre { white-space: pre-wrap; word-break: break-word; }
  </style>
</head>
<body>
  <div id="root"></div>
  <div id="error-display"><h3>Preview Error</h3><pre id="error-text"></pre></div>
  <script>
    // Listen for code from parent
    window.addEventListener("message", function(event) {
      if (event.data && event.data.type === "render-code") {
        renderCode(event.data.code);
      }
    });

    function renderCode(rawCode) {
      var root = document.getElementById("root");
      var errorDisplay = document.getElementById("error-display");
      var errorText = document.getElementById("error-text");
      
      root.style.display = "block";
      errorDisplay.className = "";

      try {
        // Clean the code
        var code = rawCode;
        
        // Remove import statements (React hooks are available globally)
        code = code.replace(/^\\s*import\\s+.*?from\\s+['\"]react['\"];?\\s*$/gm, "");
        code = code.replace(/^\\s*import\\s+.*?from\\s+['\"]recharts['\"];?\\s*$/gm, "");
        code = code.replace(/^\\s*import\\s+.*?from\\s+['\"]lucide-react['\"];?\\s*$/gm, "");
        code = code.replace(/^\\s*import\\s+.*?from\\s+['\"]react-dom['\"];?\\s*$/gm, "");
        
        // Replace "export default function X" with "function X"
        code = code.replace(/export\\s+default\\s+function\\s+/g, "function ");
        
        // Replace "export default " at the end with nothing
        code = code.replace(/^\\s*export\\s+default\\s+/gm, "var __DefaultExport__ = ");
        
        // Wrap the code to capture the component
        var wrappedCode = code + "\\n" +
          "// Find the default export component\\n" +
          "var _Component = typeof App !== 'undefined' ? App\\n" +
          "  : typeof Counter !== 'undefined' ? Counter\\n" +
          "  : typeof CounterApp !== 'undefined' ? CounterApp\\n" +
          "  : typeof TodoApp !== 'undefined' ? TodoApp\\n" +
          "  : typeof Dashboard !== 'undefined' ? Dashboard\\n" +
          "  : typeof Store !== 'undefined' ? Store\\n" +
          "  : typeof MainApp !== 'undefined' ? MainApp\\n" +
          "  : typeof Home !== 'undefined' ? Home\\n" +
          "  : typeof Main !== 'undefined' ? Main\\n" +
          "  : typeof Page !== 'undefined' ? Page\\n" +
          "  : typeof __DefaultExport__ !== 'undefined' ? __DefaultExport__\\n" +
          "  : null;\\n" +
          "if (_Component) {\\n" +
          "  var _root = ReactDOM.createRoot(document.getElementById('root'));\\n" +
          "  _root.render(React.createElement(_Component));\\n" +
          "} else {\\n" +
          "  document.getElementById('root').innerHTML = '<div style=\\\"padding:40px;color:#888\\\">No component found to render</div>';\\n" +
          "}\\n";

        // Make React hooks globally available
        var globals = 
          "var useState = React.useState;\\n" +
          "var useEffect = React.useEffect;\\n" +
          "var useCallback = React.useCallback;\\n" +
          "var useMemo = React.useMemo;\\n" +
          "var useRef = React.useRef;\\n" +
          "var useContext = React.useContext;\\n" +
          "var useReducer = React.useReducer;\\n" +
          "var createContext = React.createContext;\\n" +
          "var memo = React.memo;\\n" +
          "var Fragment = React.Fragment;\\n" +
          "var useId = React.useId || function() { return Math.random().toString(36).slice(2); };\\n";
        
        // Add recharts globals
        if (window.Recharts) {
          var rechartsKeys = Object.keys(window.Recharts);
          for (var i = 0; i < rechartsKeys.length; i++) {
            globals += "var " + rechartsKeys[i] + " = window.Recharts." + rechartsKeys[i] + ";\\n";
          }
        }

        var fullCode = globals + wrappedCode;

        // Transpile with Babel
        var output = Babel.transform(fullCode, {
          presets: ["react"],
          filename: "App.jsx"
        });

        // Execute
        var fn = new Function(output.code);
        fn();

      } catch (err) {
        root.style.display = "none";
        errorDisplay.className = "visible";
        errorText.textContent = err.message + "\\n\\n" + (err.stack || "");
      }
    }
  <\/script>
</body>
</html>`;
