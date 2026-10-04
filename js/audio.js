/**
 * Áudio e acessibilidade sonora do modelo de teste
 * Reproduz com precisão os bips de teclas, confirmação e o clássico som "PILILI" de finalização,
 * usando Web Audio API para gerar sons e leitura por voz.
 * Também suporta síntese de voz para eleitores com deficiência visual.
 */

class UrnaAudio {
    constructor() {
        this.ctx = null;
        this.voiceEnabled = true;
        this.soundEnabled = true;
    }

    initContext() {
        if (!this.ctx) {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (AudioCtx) {
                this.ctx = new AudioCtx();
            }
        }
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    playAudioFile(filename, volume, onFallback, onComplete) {
        if (typeof Audio === 'undefined') {
            if (onFallback) onFallback();
            else if (onComplete) onComplete();
            return;
        }

        const audio = new Audio(`assets/sounds/${filename}`);
        audio.volume = volume;
        let fallbackStarted = false;
        const fallback = () => {
            if (fallbackStarted) return;
            fallbackStarted = true;
            if (onFallback) onFallback();
            else if (onComplete) onComplete();
        };

        audio.addEventListener('error', fallback, { once: true });
        audio.addEventListener('ended', () => {
            if (!fallbackStarted && onComplete) onComplete();
        }, { once: true });

        const playback = audio.play();
        if (playback && typeof playback.catch === 'function') {
            playback.catch(fallback);
        }
    }

    /**
     * Bip curto de digitação de tecla (números, branco, corrige)
     */
    playKeyBeep() {
        if (!this.soundEnabled) return;
        this.playAudioFile('confirm.mpeg', 0.5, () => this.playKeyBeepFallback());
    }

    playKeyBeepFallback() {
        this.initContext();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(1050, now);

        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.06);
    }

    /**
     * Bip de confirmação intermediária (entre cargos)
     * Som curto característico com tom duplo harmônico
     */
    playConfirmBeep() {
        if (!this.soundEnabled) return;
        this.playAudioFile('confirm.mpeg', 0.5, () => this.playConfirmBeepFallback());
    }

    playConfirmBeepFallback() {
        this.initContext();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        
        // Oscilador 1 (principal 1250 Hz)
        const osc1 = this.ctx.createOscillator();
        const gain1 = this.ctx.createGain();
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(1250, now);
        gain1.gain.setValueAtTime(0.15, now);
        gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
        osc1.connect(gain1);
        gain1.connect(this.ctx.destination);
        osc1.start(now);
        osc1.stop(now + 0.18);

        // Oscilador 2 (harmônico complementar 1875 Hz)
        const osc2 = this.ctx.createOscillator();
        const gain2 = this.ctx.createGain();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(1875, now);
        gain2.gain.setValueAtTime(0.075, now);
        gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
        osc2.connect(gain2);
        gain2.connect(this.ctx.destination);
        osc2.start(now);
        osc2.stop(now + 0.18);
    }

    /**
     * Som de aviso / erro (ex: tecla inválida ou número incompleto ao tentar confirmar)
     */
    playErrorBeep() {
        if (!this.soundEnabled) return;
        this.initContext();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(320, now);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.15);
    }

    /**
    * Som de finalização da simulação, executado após o último cargo.
     */
    playPilili(onComplete) {
        if (!this.soundEnabled) {
            if (onComplete) onComplete();
            return;
        }
        this.playAudioFile('finish.mpeg', 1, () => this.playPililiFallback(onComplete), onComplete);
    }

    playPililiFallback(onComplete) {
        this.initContext();
        if (!this.ctx) {
            if (onComplete) onComplete();
            return;
        }

        const now = this.ctx.currentTime;
        
        // Bips rápidos em escala ascendente seguidos por um tom longo.
        const tones = [
            { freq: 700, start: 0.00, dur: 0.08 },
            { freq: 880, start: 0.10, dur: 0.08 },
            { freq: 1050, start: 0.20, dur: 0.08 },
            { freq: 1400, start: 0.32, dur: 1.25 }
        ];

        tones.forEach(t => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(t.freq, now + t.start);

            gain.gain.setValueAtTime(0, now + t.start);
            gain.gain.linearRampToValueAtTime(0.35, now + t.start + 0.015);
            gain.gain.setValueAtTime(0.35, now + t.start + t.dur - 0.03);
            gain.gain.exponentialRampToValueAtTime(0.001, now + t.start + t.dur);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(now + t.start);
            osc.stop(now + t.start + t.dur);
        });

        const totalDuration = (0.32 + 1.25) * 1000;
        if (onComplete) {
            setTimeout(onComplete, totalDuration);
        }
    }

    /**
     * Acessibilidade auditiva por voz sintetizada (Lê cargo, números e nomes)
     */
    speak(text) {
        if (!this.voiceEnabled || !('speechSynthesis' in window)) return;
        window.speechSynthesis.cancel(); // Para falas anteriores
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'pt-BR';
        utterance.rate = 1.1;
        utterance.pitch = 1.0;
        window.speechSynthesis.speak(utterance);
    }
}

// Instância global disponível
window.urnaAudio = new UrnaAudio();
