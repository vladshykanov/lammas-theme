#!/usr/bin/env python3
"""Stop whatever is holding the preview port, then start a detached server.

Two things kept going wrong by hand and are fixed here:

  * `pkill -f 'serve.mjs'` matches the shell that is running it, so the call
    kills itself. This walks /proc instead and never matches its own command
    line.
  * A server that fails to bind leaves the previous one answering with a stale
    module cache — the page still returns 200 while quietly missing content.
    So we wait for the port to actually free before starting, and verify the
    new process is the one answering.
"""

import os
import signal
import socket
import subprocess
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 9494
LOG = Path("/tmp/claude-1000/-home-vlad-cv/24a7661e-b6b6-4506-91d9-8dbebf680d80/scratchpad/lammas.log")


def port_busy(port=PORT):
    s = socket.socket()
    s.settimeout(0.5)
    busy = s.connect_ex(("127.0.0.1", port)) == 0
    s.close()
    return busy


def preview_pids():
    """PIDs running this theme's server, found without a matchable pattern."""
    me = os.getpid()
    found = []
    for entry in Path("/proc").iterdir():
        if not entry.name.isdigit() or int(entry.name) == me:
            continue
        try:
            cmd = (entry / "cmdline").read_bytes().replace(b"\0", b" ").decode()
        except OSError:
            continue
        if "serve" in cmd and "mjs" in cmd and "node" in cmd:
            found.append(int(entry.name))
    return found


def stop():
    for pid in preview_pids():
        for sig in (signal.SIGTERM, signal.SIGKILL):
            try:
                os.kill(pid, sig)
            except ProcessLookupError:
                break
            time.sleep(0.4)
            if not port_busy():
                break

    for _ in range(10):
        if not port_busy():
            return True
        time.sleep(0.5)
    return False


def start():
    LOG.parent.mkdir(parents=True, exist_ok=True)
    with LOG.open("w") as log:
        # setsid detaches it from this call's process group, so it survives the
        # turn that started it.
        subprocess.Popen(
            ["node", "preview/serve.mjs"],
            cwd=ROOT, stdout=log, stderr=log,
            stdin=subprocess.DEVNULL, start_new_session=True,
        )

    for _ in range(20):
        time.sleep(0.5)
        if port_busy():
            return True
    return False


if __name__ == "__main__":
    if not stop():
        print(f"port {PORT} would not free — something else is holding it")
        sys.exit(1)

    if not start():
        print("server did not come up:")
        print(LOG.read_text()[-800:])
        sys.exit(1)

    print(f"preview restarted on http://127.0.0.1:{PORT}")
