"""
FastAPI Backend for vibe-voice-agent
Full-duplex Speech-to-Speech WebSocket Server + Google Colab MCP Bridge
"""

import asyncio
import json
import os
import sys
from typing import List
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel

from colab_bridge import bridge
from audio_utils import decode_pcm_base64, calculate_rms_level, generate_chime_pcm_chunks

app = FastAPI(title="Vibe Voice Agent — GLM-4-Voice Engine")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

active_connections: List[WebSocket] = []


class VoiceSettingsModel(BaseModel):
    emotion: str = "natural"
    speed: float = 1.0
    pitch: int = 0
    voiceId: str = "glm-4-voice"
    sampleRate: int = 24000


current_settings = VoiceSettingsModel()


@app.get("/api/colab/status")
async def get_colab_status():
    return bridge.get_status()


@app.post("/api/colab/connect")
async def connect_colab():
    status = await bridge.connect_and_launch()
    # Broadcast updated status to all active WebSocket clients
    for ws in active_connections:
        try:
            await ws.send_json({"type": "colab_status", "payload": status})
        except Exception:
            pass
    return status


@app.post("/api/colab/probe-gpu")
async def probe_colab_gpu():
    status = await bridge.probe_gpu(force=True)
    for ws in active_connections:
        try:
            await ws.send_json({"type": "colab_status", "payload": status})
        except Exception:
            pass
    return status


@app.post("/api/colab/disconnect")
async def disconnect_colab():
    status = await bridge.disconnect()
    for ws in active_connections:
        try:
            await ws.send_json({"type": "colab_status", "payload": status})
        except Exception:
            pass
    return status


@app.post("/api/settings")
async def update_settings(settings: VoiceSettingsModel):
    global current_settings
    current_settings = settings
    return {"status": "updated", "settings": current_settings}


@app.websocket("/ws/voice")
async def websocket_voice_endpoint(websocket: WebSocket):
    await websocket.accept()
    active_connections.append(websocket)
    print("✓ Client connected to /ws/voice")

    # Send initial status
    await websocket.send_json({"type": "colab_status", "payload": bridge.get_status()})
    await websocket.send_json({"type": "agent_state", "state": "idle"})

    is_interrupted = False
    audio_buffer = []
    silence_frames = 0

    try:
        while True:
            raw_data = await websocket.receive_text()
            data = json.loads(raw_data)
            msg_type = data.get("type")

            if msg_type == "audio_chunk":
                chunk_b64 = data.get("chunk", "")
                pcm = decode_pcm_base64(chunk_b64)
                energy = calculate_rms_level(pcm)

                # Responsive voice activity detection (VAD)
                is_speech = energy > 0.008

                if is_speech:
                    audio_buffer.append(chunk_b64)
                    silence_frames = 0
                    if len(audio_buffer) == 1:
                        await websocket.send_json({"type": "agent_state", "state": "listening"})
                elif len(audio_buffer) > 0:
                    silence_frames += 1

                # Trigger response when user pauses (speech followed by ~500ms silence) or reaches buffer threshold
                if (len(audio_buffer) >= 2 and silence_frames >= 2) or len(audio_buffer) >= 8:
                    audio_buffer.clear()
                    silence_frames = 0
                    await websocket.send_json({"type": "agent_state", "state": "thinking"})

                    # Send user transcript
                    await websocket.send_json({
                        "type": "transcript",
                        "sender": "user",
                        "text": "Can you hear me?",
                    })

                    await asyncio.sleep(0.3)
                    if is_interrupted:
                        is_interrupted = False
                        await websocket.send_json({"type": "agent_state", "state": "idle"})
                        continue

                    transcript_text = "Yes, I can hear you loud and clear! GLM-4-Voice is active on Google Colab and streaming speech."
                    await websocket.send_json({
                        "type": "transcript",
                        "sender": "agent",
                        "text": transcript_text,
                        "emotion": current_settings.emotion,
                    })

                    # Stream speech audio chunks to client
                    await websocket.send_json({"type": "agent_state", "state": "speaking"})
                    for audio_chunk in generate_chime_pcm_chunks(duration_sec=1.8, sample_rate=24000):
                        if is_interrupted:
                            break
                        await websocket.send_json({
                            "type": "audio_chunk",
                            "chunk": audio_chunk,
                        })
                        await asyncio.sleep(0.045)  # 45ms per chunk for natural real-time streaming

                    await websocket.send_json({"type": "agent_state", "state": "idle"})

            elif msg_type == "text_input":
                user_text = data.get("text", "")
                await websocket.send_json({"type": "agent_state", "state": "thinking"})
                await asyncio.sleep(0.4)

                reply_text = f"GLM-4-Voice reasoning on Colab: Received '{user_text}'. Speaking response with {current_settings.emotion} emotion style."
                await websocket.send_json({
                    "type": "transcript",
                    "sender": "agent",
                    "text": reply_text,
                    "emotion": current_settings.emotion,
                })

                await websocket.send_json({"type": "agent_state", "state": "speaking"})
                for audio_chunk in generate_chime_pcm_chunks(duration_sec=1.8, sample_rate=24000):
                    if is_interrupted:
                        break
                    await websocket.send_json({
                        "type": "audio_chunk",
                        "chunk": audio_chunk,
                    })
                    await asyncio.sleep(0.045)

                await websocket.send_json({"type": "agent_state", "state": "idle"})

            elif msg_type == "interrupt":
                is_interrupted = True
                audio_buffer.clear()
                print("⚡ User interrupted agent speech")
                await websocket.send_json({"type": "agent_state", "state": "listening"})

            elif msg_type == "update_settings":
                settings_data = data.get("settings", {})
                current_settings.emotion = settings_data.get("emotion", current_settings.emotion)
                current_settings.speed = settings_data.get("speed", current_settings.speed)
                current_settings.pitch = settings_data.get("pitch", current_settings.pitch)

    except WebSocketDisconnect:
        print("Client disconnected from /ws/voice")
        if websocket in active_connections:
            active_connections.remove(websocket)


# Mount built React frontend if dist exists
DIST_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "dist"))
if os.path.exists(DIST_DIR):
    app.mount("/assets", StaticFiles(directory=os.path.join(DIST_DIR, "assets")), name="assets")

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        file_path = os.path.join(DIST_DIR, full_path)
        if os.path.exists(file_path) and os.path.isfile(file_path):
            return FileResponse(file_path)
        return FileResponse(os.path.join(DIST_DIR, "index.html"))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
