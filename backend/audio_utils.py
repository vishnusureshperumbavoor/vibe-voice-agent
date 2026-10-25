"""
Audio utilities for PCM conversion, VAD, and streaming chunk generation.
"""

import base64
import math
import struct
import numpy as np


def decode_pcm_base64(b64_str: str) -> np.ndarray:
    """Decodes base64 string to numpy int16 PCM array."""
    raw_bytes = base64.b64decode(b64_str)
    return np.frombuffer(raw_bytes, dtype=np.int16)


def encode_pcm_base64(pcm_data: np.ndarray) -> str:
    """Encodes numpy int16 PCM array to base64 string."""
    return base64.b64encode(pcm_data.tobytes()).decode("ascii")


def calculate_rms_level(pcm_data: np.ndarray) -> float:
    """Calculates normalized RMS audio energy level (0.0 to 1.0)."""
    if len(pcm_data) == 0:
        return 0.0
    float_data = pcm_data.astype(np.float32) / 32768.0
    rms = np.sqrt(np.mean(float_data ** 2))
    return float(min(1.0, rms * 4.0))


def generate_chime_pcm_chunks(duration_sec: float = 1.2, sample_rate: int = 24000):
    """
    Generates pleasant harmonic audio wave chunks (24kHz PCM)
    used for testing full-duplex player streaming.
    """
    total_samples = int(duration_sec * sample_rate)
    t = np.linspace(0, duration_sec, total_samples, endpoint=False)
    
    # Dual harmonic pleasant chime (440Hz A4 + 660Hz E5) with decaying envelope
    envelope = np.exp(-t * 2.8)
    waveform = (0.5 * np.sin(2 * np.pi * 440 * t) + 0.3 * np.sin(2 * np.pi * 659.25 * t)) * envelope
    
    # Convert to int16
    pcm_int16 = (waveform * 32767).astype(np.int16)
    
    # Split into 50ms chunks (1200 samples per chunk at 24kHz)
    chunk_size = 1200
    for i in range(0, total_samples, chunk_size):
        chunk = pcm_int16[i : i + chunk_size]
        yield encode_pcm_base64(chunk)
