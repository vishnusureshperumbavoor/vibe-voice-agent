# Vibe Voice Agent (vibe-voice-agent)

Full-Duplex Speech-to-Speech Conversational Voice UI & Agent Pipeline powered by **GLM-4-Voice**, running on **Google Colab A100/L4 GPUs** via the **vspagent Colab MCP bridge**.

---

## 🌟 Highlights

- **Native Speech-to-Speech**: Built for end-to-end discrete audio token processing (audio in, audio out), capturing human vocal nuances, emotion, and pacing.
- **Dynamic 3D Voice Orb**: Real-time canvas audio visualizer with multi-harmonic waves reacting to speech volume and agent states (`listening`, `thinking`, `speaking`).
- **Google Colab A100/L4 GPU Bridge**: Connects seamlessly via `vspagent` Colab MCP client to orchestrate remote cloud GPUs with zero local hardware load.
- **Instant Interruption (Barge-in)**: Built-in voice activity detection and interruption controls to stop the agent instantly when you speak.
- **Vocal Emotion Prompting**: Tune vocal emotion on the fly (cheerful, calm, excited, whisper, empathic) alongside speed and pitch.

---

## 🏗️ Architecture

```
┌────────────────────────────────────────────────────────┐
│                   React Frontend                       │
│    • Real-time Microphone Capture (PCM Int16)          │
│    • Organic Voice Orb & Dual Frequency Visualizer     │
│    • Low-Latency Audio Queue Player (24kHz Mono)       │
│    • Colab Status HUD (A100/L4 GPU, VRAM, Latency)     │
└──────────────────────────┬─────────────────────────────┘
                           │ (Full-Duplex WebSocket)
                           ▼
┌────────────────────────────────────────────────────────┐
│                  FastAPI Backend                       │
│    • Bidirectional WebSocket `/ws/voice`               │
│    • Audio Chunk Streaming & VAD Energy Tracking       │
│    • Colab Bridge via vspagent MCP Client              │
└──────────────────────────┬─────────────────────────────┘
                           │ (Remote MCP Tunnel)
                           ▼
┌────────────────────────────────────────────────────────┐
│            Google Colab Pro (A100 / L4 GPU)            │
│    • glm-4-voice-tokenizer (Audio In ➔ Tokens)         │
│    • glm-4-voice-9b (Speech-to-Speech Core LLM)        │
│    • glm-4-voice-decoder (Tokens ➔ 24kHz Audio Out)    │
└────────────────────────────────────────────────────────┘
```

---

## 🚀 Quick Start

### 1. Start Both Frontend & Backend (One Command)
```bash
./scripts/start_all.sh
```

### Or Start Individually:
* **Backend (FastAPI)**:
  ```bash
  ./scripts/start_backend.sh
  ```
  Runs at: `http://localhost:8000`

* **Frontend (React + Vite)**:
  ```bash
  ./scripts/start_frontend.sh
  ```
  Runs at: `http://localhost:5173`

---

## 🎙️ Usage

1. Open `http://localhost:5173` in your browser.
2. Allow microphone access when prompted (ensure *Digital Microphone* is active).
3. Tap the **Voice Orb** or click the **Microphone Button** to begin speaking.
4. Speak normally: your audio streams to the backend, and GLM-4-Voice streams spoken responses directly back to your speakers!
5. Click **Settings** to adjust vocal emotion styles (*cheerful, calm, excited, whisper, empathic*), speaking speed, and pitch.
