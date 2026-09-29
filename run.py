import subprocess
import sys
import signal
import os
import time

def main():
    print("=" * 60)
    print("   MODELBOUNTY — STARTING FULL STACK (BACKEND + FRONTEND)")
    print("=" * 60)

    python_executable = sys.executable
    is_windows = sys.platform == "win32"

    # 1. Start FastAPI Backend on port 8000
    backend_cmd = [
        python_executable,
        "-m",
        "uvicorn",
        "backend.main:app",
        "--host",
        "127.0.0.1",
        "--port",
        "8000",
        "--reload",
    ]
    print("[1/2] Starting FastAPI backend on http://127.0.0.1:8000 ...")
    backend_proc = subprocess.Popen(backend_cmd)

    # Allow backend 1 second to bind port
    time.sleep(1)

    # 2. Start Next.js Frontend on port 3000
    npm_cmd = "npm.cmd" if is_windows else "npm"
    frontend_cmd = [npm_cmd, "run", "dev"]
    print("[2/2] Starting Next.js frontend on http://localhost:3000 ...")
    frontend_proc = subprocess.Popen(frontend_cmd)

    print("\n" + "=" * 60)
    print(" ✓ ModelBounty is running!")
    print(" • Frontend: http://localhost:3000")
    print(" • Backend:  http://127.0.0.1:8000")
    print(" • API Docs: http://127.0.0.1:8000/docs")
    print("=" * 60)
    print("Press Ctrl+C to stop both servers gracefully.\n")

    def shutdown(sig=None, frame=None):
        print("\nStopping ModelBounty servers...")
        for proc, name in [(frontend_proc, "Frontend"), (backend_proc, "Backend")]:
            try:
                if is_windows:
                    subprocess.call(
                        ["taskkill", "/F", "/T", "/PID", str(proc.pid)],
                        stdout=subprocess.DEVNULL,
                        stderr=subprocess.DEVNULL,
                    )
                else:
                    proc.terminate()
            except Exception:
                pass
        print("✓ Both servers stopped cleanly.")
        sys.exit(0)

    signal.signal(signal.SIGINT, shutdown)
    signal.signal(signal.SIGTERM, shutdown)

    try:
        # Wait for either process to terminate
        while True:
            if backend_proc.poll() is not None:
                print("Backend stopped.")
                shutdown()
            if frontend_proc.poll() is not None:
                print("Frontend stopped.")
                shutdown()
            time.sleep(1)
    except KeyboardInterrupt:
        shutdown()

if __name__ == "__main__":
    main()
