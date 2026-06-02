// High-tech AI speech synthesis & cyber synthesizer sound engine for Perseus Studio
export function playSyntheticBeep(type: "signal" | "success" | "warning") {
  if (typeof window === "undefined" || !window.AudioContext && !(window as any).webkitAudioContext) return;

  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    const ctx = new AudioContextClass();
    
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    const now = ctx.currentTime;
    
    if (type === "signal") {
      // 8-bit sci-fi signal sweep
      osc.type = "sine";
      osc.frequency.setValueAtTime(587.33, now); // D5
      osc.frequency.exponentialRampToValueAtTime(1174.66, now + 0.15); // D6
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
      osc.start(now);
      osc.stop(now + 0.3);
    } else if (type === "success") {
      // Harmonic success scale chord
      osc.type = "triangle";
      osc.frequency.setValueAtTime(523.25, now); // C5
      osc.frequency.setValueAtTime(659.25, now + 0.08); // E5
      osc.frequency.setValueAtTime(783.99, now + 0.16); // G5
      gain.gain.setValueAtTime(0.07, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
      osc.start(now);
      osc.stop(now + 0.45);
    } else {
      // Warning hum
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(220, now); // A3
      osc.frequency.linearRampToValueAtTime(110, now + 0.25);
      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
      osc.start(now);
      osc.stop(now + 0.3);
    }
  } catch (e) {
    console.warn("Cyber audio synthesizer block prevented by browser policies:", e);
  }
}

export function announceWithVoice(text: string, lang: "ID" | "EN") {
  if (typeof window === "undefined" || !window.speechSynthesis) return;

  try {
    // Stop any ongoing announcements to prevent overlapping chaotic voices
    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    
    // Choose appropriate voice match
    utterance.lang = lang === "ID" ? "id-ID" : "en-US";
    utterance.pitch = lang === "ID" ? 1.05 : 0.95; // Slightly stylized high-tech voice pitches
    utterance.rate = 1.05; // Slightly faster for clean pacing
    utterance.volume = 0.85;

    // Optional style modification if specific voices exist
    const voices = window.speechSynthesis.getVoices();
    if (voices && voices.length > 0) {
      const preferred = voices.find(v => 
        lang === "ID" 
          ? v.lang.includes("ID") 
          : (v.lang.includes("EN") && v.name.toLowerCase().includes("google"))
      );
      if (preferred) {
        utterance.voice = preferred;
      }
    }

    window.speechSynthesis.speak(utterance);
  } catch (e) {
    console.warn("AI Speech synthesis prevented by browser policy restrictions:", e);
  }
}
