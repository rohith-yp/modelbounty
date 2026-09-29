import subprocess
import sys
import signal
import os
import time
import urllib.request
import urllib.error

# Ensure UTF-8 output on Windows terminal
if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

def wait_for_url(url: str, timeout: float = 30.0, interval: float = 0.5) -> bool:
    """Polls an HTTP URL until it returns a successful HTTP status code or times out."""
    start_time = time.time()
    while time.time() - start_time < timeout:
        try:
            req = urllib.request.Request(
                url,
                headers={"User-Agent": "ModelBounty-HealthCheck/1.0"}
            )
            with urllib.request.urlopen(req, timeout=2) as response:
                if response.status in (200, 204, 304, 307, 308):
                    return True
        except (urllib.error.URLError, OSError):
            pass
        time.sleep(interval)
    return False

def main():
    print("=" * 50, flush=True)
    print("ModelBounty", flush=True)
    print("=" * 50, flush=True)

    is_windows = sys.platform == "win32"
    python_executable = sys.executable

    # Ensure logs directory exists for server stdout/stderr
    logs_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "logs")
    os.makedirs(logs_dir, exist_ok=True)
    backend_log = open(os.path.join(logs_dir, "backend.log"), "w", encoding="utf-8")
    frontend_log = open(os.path.join(logs_dir, "frontend.log"), "w", encoding="utf-8")

    # 1. Start FastAPI Backend (internal port 8000)
    backend_cmd = [
        python_executable,
        "-m",
        "uvicorn",
        "backend.main:app",
        "--host",
        "127.0.0.1",
        "--port",
        "8000",
    ]
    backend_proc = subprocess.Popen(
        backend_cmd,
        stdout=backend_log,
        stderr=backend_log,
    )

    # Poll internal backend health
    backend_ready = wait_for_url("http://127.0.0.1:8000/api/health", timeout=20.0)
    if not backend_ready:
        print("[!] Backend initialization timed out. Check logs/backend.log", flush=True)
        sys.exit(1)
    print("✓ Backend initialized", flush=True)

    # 2. Start Next.js Frontend (port 3000)
    npm_cmd = "npm.cmd" if is_windows else "npm"
    frontend_cmd = [npm_cmd, "run", "dev"]
    frontend_proc = subprocess.Popen(
        frontend_cmd,
        stdout=frontend_log,
        stderr=frontend_log,
    )

    # Poll Next.js frontend readiness
    frontend_ready = wait_for_url("http://localhost:3000", timeout=30.0)
    if not frontend_ready:
        print("[!] Frontend initialization timed out. Check logs/frontend.log", flush=True)
        sys.exit(1)
    print("✓ Frontend initialized", flush=True)
    print("✓ All services are running\n", flush=True)
    print("Open:", flush=True)
    print("http://localhost:3000\n", flush=True)
    print("Press Ctrl+C to stop ModelBounty.", flush=True)
    print("=" * 50, flush=True)

    def shutdown(sig=None, frame=None):
        print("\nStopping ModelBounty...", flush=True)
        for proc in [frontend_proc, backend_proc]:
            try:
                proc.terminate()
            except Exception:
                pass
        time.sleep(0.5)
        for proc in [frontend_proc, backend_proc]:
            try:
                if is_windows and proc.poll() is None:
                    subprocess.call(
                        ["taskkill", "/F", "/T", "/PID", str(proc.pid)],
                        stdout=subprocess.DEVNULL,
                        stderr=subprocess.DEVNULL,
                    )
            except Exception:
                pass
        try:
            backend_log.close()
            frontend_log.close()
        except Exception:
            pass
        sys.exit(0)

    signal.signal(signal.SIGINT, shutdown)
    signal.signal(signal.SIGTERM, shutdown)

    try:
        while True:
            if backend_proc.poll() is not None:
                shutdown()
            if frontend_proc.poll() is not None:
                shutdown()
            time.sleep(1)
    except KeyboardInterrupt:
        shutdown()

if __name__ == "__main__":
    main()
