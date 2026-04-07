"""
POC: Prove E2B can run code-server (VS Code in browser)
- Creates a sandbox
- Installs + starts code-server with a password
- Writes sample code to workspace
- Returns the public URL and password
"""
import os
import sys
import time
import secrets
import string
from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

def generate_password(length=16):
    alphabet = string.ascii_letters + string.digits
    return ''.join(secrets.choice(alphabet) for _ in range(length))

def test_e2b_vscode():
    from e2b import Sandbox
    
    api_key = os.environ.get("E2B_API_KEY", "")
    if not api_key:
        print("ERROR: E2B_API_KEY not set")
        sys.exit(1)
    
    print(f"[POC] E2B API Key found: {api_key[:20]}...")
    password = generate_password()
    print(f"[POC] Generated password: {password}")
    
    print("[POC] Creating E2B sandbox (timeout=1800s)...")
    start = time.time()
    sandbox = Sandbox.create(api_key=api_key, timeout=1800)
    print(f"[POC] Sandbox created in {time.time()-start:.1f}s — ID: {sandbox.sandbox_id}")
    
    try:
        # Install code-server
        print("[POC] Installing code-server...")
        t = time.time()
        result = sandbox.commands.run(
            "curl -fsSL https://code-server.dev/install.sh | sh -s -- --method=standalone 2>&1 | tail -5",
            timeout=180
        )
        print(f"[POC] code-server installed in {time.time()-t:.1f}s")
        if result.error:
            print(f"[POC] Install stderr: {result.error[:200]}")
        
        # Create config directory and config file
        print("[POC] Configuring code-server with password...")
        sandbox.commands.run("mkdir -p /home/user/.config/code-server", timeout=10)
        
        config = f"""bind-addr: 0.0.0.0:8080
auth: password
password: {password}
cert: false
"""
        sandbox.files.write("/home/user/.config/code-server/config.yaml", config)
        
        # Create workspace directory
        sandbox.commands.run("mkdir -p /home/user/workspace", timeout=10)
        
        # Write sample code
        sample_code = """import React, { useState } from 'react';

export default function App() {
  const [count, setCount] = useState(0);
  
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Counter App</h1>
        <p className="text-6xl font-mono text-blue-600 mb-6">{count}</p>
        <div className="flex gap-4 justify-center">
          <button 
            onClick={() => setCount(c => c - 1)}
            className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
          >
            -1
          </button>
          <button 
            onClick={() => setCount(0)}
            className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
          >
            Reset
          </button>
          <button 
            onClick={() => setCount(c => c + 1)}
            className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
          >
            +1
          </button>
        </div>
      </div>
    </div>
  );
}
"""
        sandbox.files.write("/home/user/workspace/App.jsx", sample_code)
        print("[POC] Sample code written to /home/user/workspace/App.jsx")
        
        # Start code-server in background
        print("[POC] Starting code-server on port 8080...")
        sandbox.commands.run(
            "HOME=/home/user code-server --bind-addr 0.0.0.0:8080 /home/user/workspace &",
            background=True
        )
        
        # Wait for code-server to start
        print("[POC] Waiting for code-server to start...")
        time.sleep(5)
        
        # Check if it's running
        result = sandbox.commands.run("ps aux | grep code-server | grep -v grep", timeout=10)
        print(f"[POC] Process check: {result.stdout[:200]}")
        
        # Get public URL
        host = sandbox.get_host(8080)
        url = f"https://{host}"
        print(f"\n[POC] ✅ SUCCESS!")
        print(f"[POC] VS Code URL: {url}")
        print(f"[POC] Password: {password}")
        print(f"[POC] Sandbox ID: {sandbox.sandbox_id}")
        print(f"\n[POC] Open the URL in your browser and enter the password to access VS Code!")
        
        # Keep alive for testing
        print("\n[POC] Sandbox will stay alive for 5 minutes for manual testing...")
        print("[POC] Press Ctrl+C to kill early.")
        try:
            time.sleep(300)
        except KeyboardInterrupt:
            print("\n[POC] Interrupted by user")
        
        return True
        
    except Exception as e:
        print(f"[POC] ERROR: {e}")
        import traceback
        traceback.print_exc()
        return False
    finally:
        print("[POC] Killing sandbox...")
        try:
            sandbox.kill()
            print("[POC] Sandbox killed.")
        except:
            pass


if __name__ == "__main__":
    success = test_e2b_vscode()
    sys.exit(0 if success else 1)
