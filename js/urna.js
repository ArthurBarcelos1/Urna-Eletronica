/**
 * Controle do visor LCD do modelo de teste
 * Gerencia as etapas da simulação de votação
 */

class UrnaController {
    constructor() {
        this.sessionId = null;
        this.pairingCode = null;
        this.isPhoneConnected = false;
        this.currentStatus = 'PAIRING'; // PAIRING, WAITING_MESARIO, VOTING, FINISHED
        
        // Estado da Votação
        this.currentCargoIndex = 0;
        this.enteredDigits = '';
        this.voteType = null; // 'CANDIDATO', 'LEGENDA', 'BRANCO', 'NULO'
        this.currentCandidate = null;
        this.currentLegenda = null;
        this.senador1Votado = null; // Para evitar votar no mesmo senador na 2ª vaga
        
        // "Confira o seu voto"
        this.canConfirm = false;
        this.confirmTimer = null;
        
        // Timer de Pareamento (30s)
        this.pairingTimer = null;
        this.timeLeftToRefresh = 30;

        // Votos da sessão atual para envio ao RDV
        this.currentSessionVotes = {};
    }

    init() {
        this.bindDOM();
        this.setupPairingSession();
        this.listenSyncUpdates();
    }

    bindDOM() {
        this.elements = {
            waitingScreen: document.getElementById('waitingScreen'),
            votingScreen: document.getElementById('votingScreen'),
            fimScreen: document.getElementById('fimScreen'),
            secaoEncerradaScreen: document.getElementById('secaoEncerradaScreen'),
            pairingCard: document.getElementById('pairingCard'),
            mesarioWaitingCard: document.getElementById('mesarioWaitingCard'),
            pairingCodeText: document.getElementById('pairingCodeText'),
            qrCanvas: document.getElementById('qrCanvas'),
            timerSeconds: document.getElementById('timerSeconds'),
            btnConfigHost: document.getElementById('btnConfigHost'),
            customHostDisplay: document.getElementById('customHostDisplay'),
            
            // Timeline
            timelineSteps: document.querySelectorAll('.timeline-step'),
            
            // Cargo & Digits
            roleSubtitle: document.getElementById('roleSubtitle'),
            roleTitle: document.getElementById('roleTitle'),
            digitBoxesContainer: document.getElementById('digitBoxesContainer'),
            
            // Candidato & Fotos
            candidateDetailsLayout: document.getElementById('candidateDetailsLayout'),
            candidateName: document.getElementById('candidateName'),
            candidateParty: document.getElementById('candidateParty'),
            candidateMainPhoto: document.getElementById('candidateMainPhoto'),
            viceGroup: document.getElementById('viceGroup'),
            viceTitle: document.getElementById('viceTitle'),
            viceName: document.getElementById('viceName'),
            vicePhotoCard: document.getElementById('vicePhotoCard'),
            vicePhoto: document.getElementById('vicePhoto'),
            
            suplente1Group: document.getElementById('suplente1Group'),
            suplente1Name: document.getElementById('suplente1Name'),
            suplente1PhotoCard: document.getElementById('suplente1PhotoCard'),
            suplente1Photo: document.getElementById('suplente1Photo'),
            
            suplente2Group: document.getElementById('suplente2Group'),
            suplente2Name: document.getElementById('suplente2Name'),
            suplente2PhotoCard: document.getElementById('suplente2PhotoCard'),
            suplente2Photo: document.getElementById('suplente2Photo'),
            
            // Estados especiais
            stateBannerCenter: document.getElementById('stateBannerCenter'),
            stateTitle: document.getElementById('stateTitle'),
            stateSubtitle: document.getElementById('stateSubtitle'),
            
            // Confirmação
            confiraVotoBanner: document.getElementById('confiraVotoBanner'),
            
        };

        // Permite ao usuário definir o IP da máquina na rede local caso queira ler com a câmera nativa do celular
        if (this.elements.btnConfigHost) {
            this.elements.btnConfigHost.addEventListener('click', () => {
                const current = localStorage.getItem('urna_custom_host') || (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1' && window.location.protocol !== 'file:' ? window.location.host : '192.168.1.100:5500');
                const newHost = prompt('Digite o IP local ou endereço do servidor para a câmera do celular abrir (ex: 192.168.0.15:5500 ou meusite.com):', current);
                if (newHost !== null) {
                    if (newHost.trim() === '') {
                        localStorage.removeItem('urna_custom_host');
                    } else {
                        localStorage.setItem('urna_custom_host', newHost.trim().replace(/^https?:\/\//, ''));
                    }
                    this.generateNewCode();
                }
            });
        }
    }

    setupPairingSession() {
        // Tenta recuperar sessão existente ou cria uma nova
        let storedSession = localStorage.getItem('urna_session_id');
        if (!storedSession) {
            storedSession = 'SECAO_01_' + Math.random().toString(36).substring(2, 8).toUpperCase();
            localStorage.setItem('urna_session_id', storedSession);
        }
        this.sessionId = storedSession;

        this.generateNewCode();
        this.startPairingCountdown();
    }

    generateNewCode() {
        this.pairingCode = window.generatePairingCode();
        this.timeLeftToRefresh = 30; // 30 segundos
        
        if (this.elements.pairingCodeText) {
            this.elements.pairingCodeText.textContent = this.pairingCode;
        }
        if (this.elements.timerSeconds) {
            this.elements.timerSeconds.textContent = this.timeLeftToRefresh;
        }

        // Monta a URL completa para que a câmera padrão de qualquer celular (iOS / Android)
        // abra imediatamente a página do teclado com o código preenchido!
        let pairingUrl;
        const customHost = localStorage.getItem('urna_custom_host');

        if (customHost) {
            const proto = customHost.includes('localhost') || customHost.includes(':') ? 'http' : 'https';
            pairingUrl = `${proto}://${customHost}/teclado.html?code=${this.pairingCode}&session=${this.sessionId}`;
            if (this.elements.customHostDisplay) {
                this.elements.customHostDisplay.textContent = `Host: ${customHost}`;
            }
        } else if (window.location.protocol !== 'file:') {
            const hostUrl = window.location.origin + window.location.pathname.replace('urna.html', 'teclado.html');
            pairingUrl = `${hostUrl}?code=${this.pairingCode}&session=${this.sessionId}`;
            if (this.elements.customHostDisplay) {
                this.elements.customHostDisplay.textContent = `Host: ${window.location.host}`;
            }
        } else {
            // Em caso de abertura direta de arquivo file://
            pairingUrl = `teclado.html?code=${this.pairingCode}&session=${this.sessionId}`;
            if (this.elements.customHostDisplay) {
                this.elements.customHostDisplay.textContent = `Aberto via arquivo local (configure o IP Wi-Fi se for usar outro aparelho)`;
            }
        }

        if (this.elements.qrCanvas && window.QRCodeLib) {
            window.QRCodeLib.renderToCanvas(this.elements.qrCanvas, pairingUrl, 160);
        }

        // Publica no sync para o teclado poder conectar com este código
        window.UrnaSync.set(`pairing/${this.pairingCode}`, {
            sessionId: this.sessionId,
            timestamp: Date.now()
        });

        // Publica para o terminal do Mesário poder exibir o código atualizado a cada 30 segundos
        window.UrnaSync.set(`sessions/${this.sessionId}/active_pairing_code`, {
            code: this.pairingCode,
            timeLeft: this.timeLeftToRefresh,
            timestamp: Date.now()
        });
    }

    startPairingCountdown() {
        if (this.pairingTimer) clearInterval(this.pairingTimer);
        this.pairingTimer = setInterval(() => {
            if (this.isPhoneConnected) {
                clearInterval(this.pairingTimer);
                return;
            }
            this.timeLeftToRefresh--;
            if (this.elements.timerSeconds) {
                this.elements.timerSeconds.textContent = this.timeLeftToRefresh;
            }

            // Sincroniza o contador regressivo com o Mesário a cada segundo
            window.UrnaSync.set(`sessions/${this.sessionId}/pairing_timer`, {
                timeLeft: this.timeLeftToRefresh
            });

            if (this.timeLeftToRefresh <= 0) {
                this.generateNewCode();
            }
        }, 1000);
    }

    listenSyncUpdates() {
        // 1. Escuta conexão do celular / teclado e comandos do Mesário
        window.UrnaSync.on(`sessions/${this.sessionId}/status`, (statusData) => {
            if (!statusData) return;

            // Teclado conectou
            if (statusData.phoneConnected && !this.isPhoneConnected) {
                this.isPhoneConnected = true;
                if (this.pairingTimer) clearInterval(this.pairingTimer);
                console.log('[Urna] Teclado do celular conectado com sucesso!');
                
                if (this.currentStatus === 'PAIRING') {
                    this.setUrnaState('WAITING_MESARIO');
                }
            }

            // Teclado foi desconectado (pelo celular ou pelo mesário)
            if (statusData.phoneConnected === false && this.isPhoneConnected) {
                this.isPhoneConnected = false;
                console.log('[Urna] Teclado desconectado.');
                this.setUrnaState('PAIRING');
                this.generateNewCode();
                this.startPairingCountdown();
            }

            // Comando do Mesário para iniciar votação do eleitor
            if (statusData.votingActive && this.currentStatus !== 'VOTING' && this.currentStatus !== 'FINISHED') {
                this.startVotingSession();
            }

            // Comando do Mesário para interromper / finalizar votação em andamento
            if (statusData.forceFinishVoting && this.currentStatus === 'VOTING') {
                console.log('[Urna] Votação interrompida pelo Mesário.');
                window.urnaAudio.playErrorBeep();
                this.resetCurrentCargo();
                if (this.isPhoneConnected) {
                    this.setUrnaState('WAITING_MESARIO');
                } else {
                    this.setUrnaState('PAIRING');
                    this.generateNewCode();
                    this.startPairingCountdown();
                }
            }

            // Comando do terminal de teste para encerrar a simulação
            if (statusData.secaoEncerrada) {
                console.log('[Urna] Simulação encerrada pelo terminal de teste.');
                this.setUrnaState('SECAO_ENCERRADA');
            }

            // Comando do Mesário para Reiniciar Seção (zerar tudo para nova eleição)
            if (statusData.resetSecao) {
                console.log('[Urna] Seção reiniciada e zerada pelo Mesário.');
                this.resetUrnaTotal();
            }
        });

        // 2. Escuta teclas enviadas pelo celular
        window.UrnaSync.on(`sessions/${this.sessionId}/key_pressed`, (keyData) => {
            if (!keyData || !keyData.key) return;
            // Previne comandos repetidos antigos por timestamp
            if (keyData.timestamp && Date.now() - keyData.timestamp > 4000) return;
            this.handleKeyPress(keyData.key);
        });
    }

    resetUrnaTotal() {
        this.isPhoneConnected = false;
        this.currentCargoIndex = 0;
        this.enteredDigits = '';
        this.voteType = null;
        this.currentCandidate = null;
        this.currentLegenda = null;
        this.senador1Votado = null;
        this.canConfirm = false;
        if (this.confirmTimer) clearTimeout(this.confirmTimer);
        this.currentSessionVotes = {};

        this.setUrnaState('PAIRING');
        this.generateNewCode();
        this.startPairingCountdown();
        if (window.urnaAudio) {
            window.urnaAudio.playConfirmBeep();
        }
    }

    setUrnaState(state) {
        this.currentStatus = state;
        console.log('[Urna State]', state);

        // Oculta tela de seção encerrada por padrão
        if (this.elements.secaoEncerradaScreen) {
            this.elements.secaoEncerradaScreen.style.display = 'none';
        }

        if (state === 'PAIRING') {
            this.elements.waitingScreen.style.display = 'flex';
            this.elements.votingScreen.style.display = 'none';
            this.elements.fimScreen.style.display = 'none';
            this.elements.pairingCard.style.display = 'flex';
            this.elements.mesarioWaitingCard.style.display = 'none';
        } else if (state === 'WAITING_MESARIO') {
            this.elements.waitingScreen.style.display = 'flex';
            this.elements.votingScreen.style.display = 'none';
            this.elements.fimScreen.style.display = 'none';
            this.elements.pairingCard.style.display = 'none';
            this.elements.mesarioWaitingCard.style.display = 'block';
            
            // Atualiza status para o Mesário
            window.UrnaSync.set(`sessions/${this.sessionId}/current_step`, {
                stepIndex: 0,
                stepName: 'AGUARDANDO ELEITOR',
                status: 'IDLE'
            });
        } else if (state === 'VOTING') {
            this.elements.waitingScreen.style.display = 'none';
            this.elements.votingScreen.style.display = 'flex';
            this.elements.fimScreen.style.display = 'none';
        } else if (state === 'FINISHED') {
            this.elements.waitingScreen.style.display = 'none';
            this.elements.votingScreen.style.display = 'none';
            this.elements.fimScreen.style.display = 'flex';
        } else if (state === 'SECAO_ENCERRADA') {
            this.elements.waitingScreen.style.display = 'none';
            this.elements.votingScreen.style.display = 'none';
            this.elements.fimScreen.style.display = 'none';
            if (this.elements.secaoEncerradaScreen) {
                this.elements.secaoEncerradaScreen.style.display = 'flex';
            }
        }
    }

    startVotingSession() {
        this.currentCargoIndex = 0;
        this.currentSessionVotes = {};
        this.senador1Votado = null;
        this.setUrnaState('VOTING');
        this.loadCargo(0);
    }

    loadCargo(cargoIndex) {
        this.currentCargoIndex = cargoIndex;
        this.enteredDigits = '';
        this.voteType = null;
        this.currentCandidate = null;
        this.currentLegenda = null;
        this.canConfirm = false;
        if (this.confirmTimer) clearTimeout(this.confirmTimer);

        const cargo = window.CARGOS_ELEICAO_2026[cargoIndex];
        if (!cargo) {
            this.finishVoting();
            return;
        }

        // Atualiza a linha do tempo da simulação
        this.updateTimeline(cargoIndex);

        // Atualiza Título do Cargo
        this.elements.roleTitle.textContent = cargo.nome;
        this.elements.roleSubtitle.textContent = `Cargo ${cargoIndex + 1} de 6`;

        // Monta as caixas de acordo com a quantidade de dígitos do cargo
        this.renderDigitBoxes(cargo.digitos);

        // Limpa visualização de candidato
        this.hideCandidateInfo();
        this.hideSpecialState();
        this.elements.confiraVotoBanner.style.display = 'none';

        // Acessibilidade por voz
        window.urnaAudio.speak(cargo.nome);

        // Notifica Mesário sobre a etapa atual
        window.UrnaSync.set(`sessions/${this.sessionId}/current_step`, {
            stepIndex: cargoIndex + 1,
            stepName: cargo.nome,
            totalSteps: 6,
            status: 'VOTING'
        });
    }

    updateTimeline(currentIndex) {
        this.elements.timelineSteps.forEach((step, idx) => {
            step.classList.remove('active', 'completed');
            if (idx < currentIndex) {
                step.classList.add('completed');
                step.querySelector('.step-node').textContent = '✓';
            } else if (idx === currentIndex) {
                step.classList.add('active');
                step.querySelector('.step-node').textContent = idx + 1;
            } else {
                step.querySelector('.step-node').textContent = idx + 1;
            }
        });
    }

    renderDigitBoxes(totalDigits) {
        this.elements.digitBoxesContainer.innerHTML = '';
        for (let i = 0; i < totalDigits; i++) {
            const box = document.createElement('div');
            box.className = 'digit-box' + (i === 0 ? ' active' : '');
            box.id = `digitBox_${i}`;
            this.elements.digitBoxesContainer.appendChild(box);
        }
    }

    updateDigitBoxes() {
        const cargo = window.CARGOS_ELEICAO_2026[this.currentCargoIndex];
        const boxes = this.elements.digitBoxesContainer.querySelectorAll('.digit-box');
        
        boxes.forEach((box, i) => {
            box.textContent = this.enteredDigits[i] || '';
            box.classList.remove('active');
            if (i === this.enteredDigits.length) {
                box.classList.add('active');
            }
        });
    }

    handleKeyPress(key) {
        if (this.currentStatus !== 'VOTING') return;
        const cargo = window.CARGOS_ELEICAO_2026[this.currentCargoIndex];

        // 1. Teclas Numéricas (0-9)
        if (/^[0-9]$/.test(key)) {
            if (this.voteType === 'BRANCO') return; // Se apertou branco, bloqueia números até corrigir
            if (this.enteredDigits.length < cargo.digitos) {
                this.enteredDigits += key;
                window.urnaAudio.playKeyBeep();
                this.updateDigitBoxes();
                this.evaluateEnteredDigits();
            }
            return;
        }

        // 2. Tecla BRANCO
        if (key === 'BRANCO') {
            if (this.enteredDigits.length === 0) {
                window.urnaAudio.playKeyBeep();
                this.setVotoBranco();
            } else {
                window.urnaAudio.playErrorBeep();
            }
            return;
        }

        // 3. Tecla CORRIGE
        if (key === 'CORRIGE') {
            window.urnaAudio.playKeyBeep();
            this.resetCurrentCargo();
            return;
        }

        // 4. Tecla CONFIRMA
        if (key === 'CONFIRMA') {
            this.handleConfirmaAction();
            return;
        }
    }

    evaluateEnteredDigits() {
        const cargo = window.CARGOS_ELEICAO_2026[this.currentCargoIndex];
        const len = this.enteredDigits.length;

        // Voto de legenda para cargos proporcionais (Deputado Federal e Estadual) ao digitar 2 dígitos
        if (cargo.isProporcional && len === 2) {
            const legenda = window.findLegenda(cargo.id, this.enteredDigits);
            if (legenda) {
                this.currentLegenda = legenda;
                // Exibe legenda preliminarmente
                this.showLegendaInfo(legenda);
            }
        }

        // Quando atinge a quantidade total de dígitos do cargo
        if (len === cargo.digitos) {
            const candidato = window.findCandidato(cargo.id, this.enteredDigits);

            // Verificação especial de Senador: 2ª vaga não pode ser o mesmo candidato da 1ª vaga
            if (cargo.id === 'senador_2' && this.senador1Votado && candidato && candidato.numero === this.senador1Votado.numero) {
                this.showSpecialState('CANDIDATO JÁ VOTADO', 'Você já votou neste candidato para a 1ª vaga de Senador.');
                this.voteType = 'NULO';
                this.startConfiraVotoTimer();
                return;
            }

            if (candidato) {
                this.voteType = 'CANDIDATO';
                this.currentCandidate = candidato;
                this.showCandidateInfo(candidato, cargo);
                this.startConfiraVotoTimer();
            } else {
                // Se for proporcional e tem legenda válida, considera voto de legenda
                const numLegenda = this.enteredDigits.substring(0, 2);
                const legenda = window.findLegenda(cargo.id, numLegenda);
                if (cargo.isProporcional && legenda) {
                    this.voteType = 'LEGENDA';
                    this.currentLegenda = legenda;
                    this.showLegendaInfo(legenda);
                    this.startConfiraVotoTimer();
                } else {
                    // Candidato inexistente -> Voto Nulo
                    this.voteType = 'NULO';
                    this.showSpecialState('NÚMERO ERRADO', 'VOTO NULO');
                    this.startConfiraVotoTimer();
                }
            }
        }
    }

    showCandidateInfo(candidato, cargo) {
        this.hideSpecialState();
        this.elements.candidateDetailsLayout.style.display = 'flex';
        this.elements.candidateName.textContent = candidato.nome;
        this.elements.candidateParty.textContent = candidato.partido;
        this.elements.candidateMainPhoto.src = candidato.foto;

        // Suplentes para Senador
        if (cargo.suplentes && candidato.suplente1) {
            this.elements.suplente1Group.style.display = 'block';
            this.elements.suplente1Name.textContent = candidato.suplente1.nome;
            this.elements.suplente1Photo.src = candidato.suplente1.foto;
            this.elements.suplente1PhotoCard.style.display = 'block';

            if (candidato.suplente2) {
                this.elements.suplente2Group.style.display = 'block';
                this.elements.suplente2Name.textContent = candidato.suplente2.nome;
                this.elements.suplente2Photo.src = candidato.suplente2.foto;
                this.elements.suplente2PhotoCard.style.display = 'block';
            }
        } else {
            this.elements.suplente1Group.style.display = 'none';
            this.elements.suplente2Group.style.display = 'none';
            this.elements.suplente1PhotoCard.style.display = 'none';
            this.elements.suplente2PhotoCard.style.display = 'none';
        }

        // Vice para Governador ou Presidente
        if (cargo.vice && candidato.vice) {
            this.elements.viceGroup.style.display = 'block';
            this.elements.viceTitle.textContent = (cargo.id === 'presidente') ? 'Vice-Presidente' : 'Vice-Governador';
            this.elements.viceName.textContent = candidato.vice.nome;
            this.elements.vicePhoto.src = candidato.vice.foto;
            this.elements.vicePhotoCard.style.display = 'block';
        } else {
            this.elements.viceGroup.style.display = 'none';
            this.elements.vicePhotoCard.style.display = 'none';
        }

        window.urnaAudio.speak(candidato.nome);
    }

    showLegendaInfo(legenda) {
        this.hideSpecialState();
        this.elements.candidateDetailsLayout.style.display = 'flex';
        this.elements.candidateName.textContent = `(VOTO DE LEGENDA)`;
        this.elements.candidateParty.textContent = `${legenda.sigla} - ${legenda.nome}`;
        this.elements.candidateMainPhoto.src = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="380" viewBox="0 0 300 380"><rect width="300" height="380" fill="#1e293b"/><text x="150" y="190" font-family="Arial" font-size="28" font-weight="bold" fill="#f8fafc" text-anchor="middle">LEGENDA</text><text x="150" y="230" font-family="Arial" font-size="36" font-weight="900" fill="#38bdf8" text-anchor="middle">${legenda.sigla}</text></svg>`;
        
        this.elements.viceGroup.style.display = 'none';
        this.elements.suplente1Group.style.display = 'none';
        this.elements.suplente2Group.style.display = 'none';
        this.elements.vicePhotoCard.style.display = 'none';
        this.elements.suplente1PhotoCard.style.display = 'none';
        this.elements.suplente2PhotoCard.style.display = 'none';
    }

    setVotoBranco() {
        this.voteType = 'BRANCO';
        this.enteredDigits = '';
        this.updateDigitBoxes();
        this.hideCandidateInfo();
        this.showSpecialState('VOTO EM BRANCO', 'Aperte VERDE para confirmar ou LARANJA para reiniciar');
        window.urnaAudio.speak('Voto em branco');
        this.startConfiraVotoTimer();
    }

    showSpecialState(title, subtitle) {
        this.hideCandidateInfo();
        this.elements.stateBannerCenter.style.display = 'flex';
        this.elements.stateTitle.textContent = title;
        this.elements.stateSubtitle.textContent = subtitle;
    }

    hideCandidateInfo() {
        this.elements.candidateDetailsLayout.style.display = 'none';
    }

    hideSpecialState() {
        this.elements.stateBannerCenter.style.display = 'none';
    }

    resetCurrentCargo() {
        this.enteredDigits = '';
        this.voteType = null;
        this.currentCandidate = null;
        this.currentLegenda = null;
        this.canConfirm = false;
        if (this.confirmTimer) clearTimeout(this.confirmTimer);
        
        this.updateDigitBoxes();
        this.hideCandidateInfo();
        this.hideSpecialState();
        this.elements.confiraVotoBanner.style.display = 'none';
        
        const cargo = window.CARGOS_ELEICAO_2026[this.currentCargoIndex];
    }

    /**
     * 10 e 11: A mensagem "CONFIRA O SEU VOTO"
     * Fica na tela piscando durante um intervalo inicial (1.2s) antes de liberar confirmação
     */
    startConfiraVotoTimer() {
        this.canConfirm = false;
        this.elements.confiraVotoBanner.style.display = 'block';
        this.elements.confiraVotoBanner.className = 'confira-voto-banner blink-text';
        
        if (this.confirmTimer) clearTimeout(this.confirmTimer);
        
        // Pausa de conferência antes de liberar a confirmação
        this.confirmTimer = setTimeout(() => {
            this.canConfirm = true;
            this.elements.confiraVotoBanner.classList.remove('blink-text');
        }, 1200);
    }

    handleConfirmaAction() {
        // Se ainda não preencheu e não for branco, não confirma
        if (!this.voteType) {
            window.urnaAudio.playErrorBeep();
            return;
        }

        // Durante o intervalo de conferência inicial, a tecla não confirma
        if (!this.canConfirm) {
            window.urnaAudio.playErrorBeep();
            return;
        }

        // Confirmação válida!
        window.urnaAudio.playConfirmBeep();

        // Salva voto do cargo
        const cargo = window.CARGOS_ELEICAO_2026[this.currentCargoIndex];
        let voteRecord = {
            cargoId: cargo.id,
            cargoNome: cargo.nome,
            tipo: this.voteType,
            numero: this.enteredDigits || 'BRANCO',
            candidatoNome: this.currentCandidate ? this.currentCandidate.nome : (this.currentLegenda ? this.currentLegenda.sigla : this.voteType),
            partido: this.currentCandidate ? this.currentCandidate.partido : (this.currentLegenda ? this.currentLegenda.nome : '')
        };

        this.currentSessionVotes[cargo.id] = voteRecord;

        // Se for Senador 1ª vaga, salva para evitar repetição na 2ª vaga
        if (cargo.id === 'senador_1' && this.currentCandidate) {
            this.senador1Votado = this.currentCandidate;
        }

        // Avança para o próximo cargo
        const nextCargoIndex = this.currentCargoIndex + 1;
        if (nextCargoIndex < window.CARGOS_ELEICAO_2026.length) {
            this.loadCargo(nextCargoIndex);
        } else {
            // FIM da votação!
            this.finishVoting();
        }
    }

    /**
     * 19 e 20: Tela final "FIM" e som "PILILI"
     */
    finishVoting() {
        this.setUrnaState('FINISHED');
        window.urnaAudio.speak('Fim da votação');

        // Notifica Mesário
        window.UrnaSync.set(`sessions/${this.sessionId}/current_step`, {
            stepIndex: 6,
            stepName: 'VOTAÇÃO CONCLUÍDA',
            status: 'FINISHED'
        });

        // Envia votos registrados para o RDV (Registro Digital do Voto) para embaralhamento
        window.UrnaSync.set(`sessions/${this.sessionId}/vote_completed`, {
            votes: this.currentSessionVotes,
            voteId: `${Date.now()}_${Math.random().toString(36).substring(2, 10)}`,
            timestamp: Date.now()
        });

        // Toca o lendário som "PILILI"
        window.urnaAudio.playPilili(() => {
            // Após tocar o pilili e pequena pausa, retorna a aguardar o próximo eleitor no mesário
            setTimeout(() => {
                // Limpa flag de votação ativa na sessão
                window.UrnaSync.set(`sessions/${this.sessionId}/status`, {
                    phoneConnected: true,
                    votingActive: false
                });
                this.setUrnaState('WAITING_MESARIO');
            }, 3000);
        });
    }

}

// Inicializa a Urna quando a página carregar
window.addEventListener('DOMContentLoaded', () => {
    window.urnaController = new UrnaController();
    window.urnaController.init();
});
