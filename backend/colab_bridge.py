"""
Real Google Colab MCP Bridge via vspagent for vibe-voice-agent.
No faking: accurately probes live GPU hardware and connection states.
"""

from __future__ import annotations

import asyncio
import os
import sys
from datetime import datetime
from typing import Any, Dict, Optional

# Add local vspagent directory to python path
VSPAGENT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "vspagent"))
if VSPAGENT_ROOT not in sys.path:
    sys.path.insert(0, VSPAGENT_ROOT)

try:
    from vspagent.colab.client import ColabMCPClient
except ImportError:
    ColabMCPClient = None


class ColabVoiceBridge:
    def __init__(self):
        self.client: Optional[ColabMCPClient] = None
        self.status: str = "not_connected"  # not_connected, pairing, connected, disconnected, error
        self.status_message: str = "Not connected. Click 'Connect Colab' to pair with browser tab."
        self.gpu_info: Optional[str] = None
        self.colab_endpoint: Optional[str] = None
        self.last_probe_time: Optional[str] = None

    def get_status(self) -> Dict[str, Any]:
        """Returns the truthful, live connection status."""
        if self.client:
            # Sync live state from vspagent client
            self.status = getattr(self.client, "status", self.status)
            self.status_message = getattr(self.client, "status_message", self.status_message)
            self.gpu_info = getattr(self.client, "gpu_info", self.gpu_info)
            self.last_probe_time = getattr(self.client, "last_probe_time", self.last_probe_time)

        is_connected = self.status == "connected"

        return {
            "connected": is_connected,
            "status": self.status,
            "message": self.status_message,
            "gpu": self.gpu_info or ("Runtime paired (Select A100 in Colab)" if is_connected else "Not Connected"),
            "vramTotal": self.gpu_info.split("(")[-1].replace(")", "") if (self.gpu_info and "(" in self.gpu_info) else "",
            "modelReady": is_connected and bool(self.colab_endpoint),
            "endpoint": self.colab_endpoint,
            "verifiedAt": self.last_probe_time,
            "recent_logs": list(getattr(self.client, "logs", []))[-20:],
        }

    async def connect_and_launch(self) -> Dict[str, Any]:
        """Connects via real vspagent ColabMCP client without premature code execution."""
        if ColabMCPClient is None:
            self.status = "error"
            self.status_message = "vspagent library not found on system path."
            return self.get_status()

        try:
            if self.client is None:
                self.client = ColabMCPClient()

            self.status = "pairing"
            self.status_message = "Starting Colab MCP and waiting for browser tab authorization..."

            # 1. Start the MCP server process
            await self.client.start()

            # 2. Trigger browser tab connection
            res = await self.client.connect_browser()
            print("[ColabBridge] connect_browser result:", res)

            # Wait briefly for pairing handshake
            for _ in range(5):
                if self.client.status == "connected":
                    self.status = "connected"
                    self.status_message = (
                        "Connected to Colab tab! Switch runtime to A100 GPU in Colab (Runtime -> Change runtime type), "
                        "then click 'Verify A100 GPU'."
                    )
                    break
                await asyncio.sleep(0.5)

            return self.get_status()

        except Exception as e:
            self.status = "error"
            self.status_message = f"Colab pairing failed: {str(e)}"
            print(f"[ColabBridge Error] {e}")
            return self.get_status()

    async def probe_gpu(self, force: bool = True) -> Dict[str, Any]:
        """Probes live GPU hardware on the active Colab runtime on-demand via vspagent."""
        if not self.client or not self.client.is_connected:
            return self.get_status()

        try:
            self.status_message = "Probing Colab hardware via vspagent..."
            info = await self.client.probe_gpu_info(force=force)
            if info:
                self.gpu_info = info
                self.status = "connected"
                self.last_probe_time = getattr(self.client, "last_probe_time", None) or datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                self.status_message = f"Connected: {info} (Verified: {self.last_probe_time})"
                print(f"[ColabBridge] [{self.last_probe_time}] GPU verified via vspagent: {info}")
        except Exception as e:
            print(f"[ColabBridge Probe Error] {e}")

        return self.get_status()

    async def disconnect(self) -> Dict[str, Any]:
        """Disconnects the Colab MCP client and shuts down the subprocess via vspagent."""
        if self.client:
            try:
                await self.client.disconnect()
            except Exception as e:
                print(f"[ColabBridge Disconnect Error] {e}")
        self.status = "not_connected"
        self.status_message = "Disconnected from Colab."
        self.gpu_info = None
        self.colab_endpoint = None
        self.last_probe_time = None
        print("[ColabBridge] Disconnected from Colab MCP via vspagent.")
        return self.get_status()

    async def execute_remote_code(self, code: str) -> Dict[str, Any]:
        """Executes Python code on the connected Colab GPU runtime."""
        if not self.client or self.status != "connected":
            return {"success": False, "error": "Colab runtime is not connected."}
        return await self.client.execute_code(code)


bridge = ColabVoiceBridge()
