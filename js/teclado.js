/**
 * Teclado numérico do modelo de teste
 * Teclado físico virtual com feedback háptico, som tátil e pareamento por código ou QR Code
 */

class TecladoController {
    constructor() {
        this.sessionId = null;
        this.pairingCode = null;
        this.isConnected = false;
        this.currentStepName = 'Aguardando conexão';
    }

    init() {
        document.addEventListener('pointerdown', () => {
            if (screen.orientation && typeof screen.orientation.lock === 'function') {
                screen.orientation.lock('landscape').catch(() => {});
            }
        }, { once: true, passive: true });
        this.bindDOM();
        this.checkUrlParams();
        this.setupEventListeners();
    }

    bindDOM() {
        this.elements = {
            connectScreen: document.getElementById('connectScreen'),
            tecladoFrame: document.getElementById('tecladoFrame'),
            inputPairingCode: document.getElementById('inputPairingCode'),
            btnConnectCode: document.getElementById('btnConnectCode'),
            btnDesconectarCelular: document.getElementById('btnDesconectarCelular'),
            statusDot: document.getElementById('statusDot'),
            statusText: document.getElementById('statusText'),
            sessionInfo: document.getElementById('sessionInfo'),
            currentStepDisplay: document.getElementById('currentStepDisplay')
        };
    }

    checkUrlParams() {
        const params = new URLSearchParams(window.location.search);
        const code = params.get('code');
        const session = params.get('session');

        // Se veio pela câmera nativa do celular lendo o QR Code:
        if (code && session) {
            this.sessionId = session;
            this.pairingCode = code;
            this.connectToSession(session, code);
        } else {
            // Tenta recuperar sessão salva anteriormente
            const savedSession = localStorage.getItem('teclado_saved_session');
            const savedCode = localStorage.getItem('teclado_saved_code');
            if (savedSession && savedCode) {
                this.sessionId = savedSession;
                this.pairingCode = savedCode;
                this.connectToSession(savedSession, savedCode);
            }
        }
    }

    setupEventListeners() {
        // Máscara e auto-formatação do código ####-####-####
        if (this.elements.inputPairingCode) {
            this.elements.inputPairingCode.addEventListener('input', (e) => {
                let v = e.target.value.replace(/\D/g, '').substring(0, 12);
                let formatted = '';
                for (let i = 0; i < v.length; i++) {
                    if (i === 4 || i === 8) formatted += '-';
                    formatted += v[i];
                }
                e.target.value = formatted;
            });
        }

        // Botão de conexão por código manual
        if (this.elements.btnConnectCode) {
            this.elements.btnConnectCode.addEventListener('click', () => {
                const code = this.elements.inputPairingCode.value.trim();
                if (code.length === 14) {
                    this.attemptPairingByCode(code);
                } else {
                    alert('Por favor, digite o código completo de 12 dígitos (formato: ####-####-####).');
                }
            });
        }

        // Botão Desconectar Celular
        if (this.elements.btnDesconectarCelular) {
            this.elements.btnDesconectarCelular.addEventListener('click', () => {
                if (confirm('Deseja desconectar este celular da Urna?')) {
                    this.desconectarTeclado();
                }
            });
        }

        // Teclas do Teclado Numérico
        const keys = document.querySelectorAll('.key-btn');
        keys.forEach(btn => {
            const handlePress = (e) => {
                e.preventDefault();
                const key = btn.getAttribute('data-key');
                if (key) {
                    this.sendKey(key);
                }
            };
            btn.addEventListener('pointerdown', handlePress);
        });
    }

    desconectarTeclado() {
        this.isConnected = false;
        localStorage.removeItem('teclado_saved_session');
        localStorage.removeItem('teclado_saved_code');

        if (this.sessionId) {
            window.UrnaSync.set(`sessions/${this.sessionId}/status`, {
                phoneConnected: false,
                votingActive: false,
                disconnectedAt: Date.now()
            });
        }

        this.elements.tecladoFrame.style.display = 'none';
        this.elements.connectScreen.style.display = 'flex';
        this.elements.statusDot.classList.remove('online');
        this.elements.statusText.textContent = 'DESCONECTADO';
        this.elements.sessionInfo.textContent = 'Aguardando código';
        if (this.elements.btnDesconectarCelular) {
            this.elements.btnDesconectarCelular.style.display = 'none';
        }
        if (this.elements.currentStepDisplay) {
            this.elements.currentStepDisplay.textContent = 'Conecte o teclado para iniciar';
        }
    }

    async attemptPairingByCode(code) {
        this.elements.btnConnectCode.textContent = 'Verificando...';
        this.elements.btnConnectCode.disabled = true;

        try {
            // Procura o código no sync
            const pairData = await window.UrnaSync.get(`pairing/${code}`);
            if (pairData && pairData.sessionId) {
                this.connectToSession(pairData.sessionId, code);
            } else {
                // Tenta fallback com a sessão local se estiver na mesma máquina/aba
                const localSession = localStorage.getItem('urna_session_id');
                if (localSession) {
                    this.connectToSession(localSession, code);
                } else {
                    alert('Código não encontrado ou expirado! Verifique a tela da urna.');
                    this.elements.btnConnectCode.textContent = 'CONECTAR TECLADO';
                    this.elements.btnConnectCode.disabled = false;
                }
            }
        } catch (e) {
            console.error('Erro ao parear por código:', e);
            this.elements.btnConnectCode.textContent = 'CONECTAR TECLADO';
            this.elements.btnConnectCode.disabled = false;
        }
    }

    async connectToSession(sessionId, code) {
        this.sessionId = sessionId;
        this.pairingCode = code;
        this.isConnected = true;

        localStorage.setItem('teclado_saved_session', sessionId);
        localStorage.setItem('teclado_saved_code', code);

        // Notifica a Urna que o celular conectou
        await window.UrnaSync.set(`sessions/${this.sessionId}/status`, {
            phoneConnected: true,
            connectedAt: Date.now()
        });

        // Alterna telas
        this.elements.connectScreen.style.display = 'none';
        this.elements.tecladoFrame.style.display = 'flex';
        this.elements.statusDot.classList.add('online');
        this.elements.statusText.textContent = 'CONECTADO À URNA';
        this.elements.sessionInfo.textContent = `ID: ${code || sessionId.substring(0, 10)}`;
        if (this.elements.btnDesconectarCelular) {
            this.elements.btnDesconectarCelular.style.display = 'inline-block';
        }

        // Escuta atualizações de etapas da votação e status da urna
        window.UrnaSync.on(`sessions/${this.sessionId}/current_step`, (stepData) => {
            if (stepData && this.elements.currentStepDisplay) {
                this.elements.currentStepDisplay.textContent = stepData.stepName || 'Pronto para votar';
            }
        });

        window.UrnaSync.on(`sessions/${this.sessionId}/status`, (statusData) => {
            if (statusData && (statusData.phoneConnected === false || statusData.resetSecao) && this.isConnected) {
                alert('A simulação foi encerrada ou o teclado foi desconectado.');
                this.desconectarTeclado();
            }
        });
    }

    sendKey(key) {
        if (!this.isConnected || !this.sessionId) return;

        // Feedback de Vibração Háptica no Celular
        if ('vibrate' in navigator) {
            try {
                if (key === 'CONFIRMA') {
                    navigator.vibrate([40, 30, 40]);
                } else if (key === 'CORRIGE') {
                    navigator.vibrate(60);
                } else {
                    navigator.vibrate(25);
                }
            } catch (e) {}
        }

        // Feedback Sonoro Local
        if (window.urnaAudio) {
            window.urnaAudio.playKeyBeep();
        }

        // Envia para a Urna
        window.UrnaSync.set(`sessions/${this.sessionId}/key_pressed`, {
            key: key,
            timestamp: Date.now()
        });
    }
}

window.addEventListener('DOMContentLoaded', () => {
    window.tecladoController = new TecladoController();
    window.tecladoController.init();
});
