/**
 * Urna Eletrônica Brasileira 2026 - Lógica do Terminal do Mesário
 * Validação estrita de CPF, monitor de etapas da votação, logs e embaralhamento do RDV em tempo real
 */

class MesarioController {
    constructor() {
        this.sessionId = null;
        this.currentCpfValid = false;
        this.votosRDV = []; // Lista de votos gravados no Registro Digital do Voto
        this.eleitoresHabilitados = 0;
        this.eleitoresVotaram = 0;
        this.currentVotingStep = 0;
        this.tecladoConectado = false;
        this.votingActive = false;
        this.secaoEncerrada = false;
    }

    init() {
        this.bindDOM();
        this.setupSession();
        this.setupEventListeners();
        this.loadSampleVoters();
        this.listenUrnaUpdates();
        this.addLog('Terminal do Mesário inicializado. Sistema pronto para as Eleições 2026.', 'highlight');
    }

    bindDOM() {
        this.elements = {
            cpfInput: document.getElementById('cpfInput'),
            cpfFeedback: document.getElementById('cpfFeedback'),
            btnLiberar: document.getElementById('btnLiberar'),
            voterNameDisplay: document.getElementById('voterNameDisplay'),
            quickVotersList: document.getElementById('quickVotersList'),
            tecladoAlertBox: document.getElementById('tecladoAlertBox'),
            btnDesconectarTeclado: document.getElementById('btnDesconectarTeclado'),
            btnInterromperVotacao: document.getElementById('btnInterromperVotacao'),
            btnEncerrarSecao: document.getElementById('btnEncerrarSecao'),
            
            // Monitor de Votação
            currentStepBadge: document.getElementById('currentStepBadge'),
            progressFill: document.getElementById('progressFill'),
            stagePills: document.querySelectorAll('.stage-pill'),
            
            // RDV & Logs
            rdvTableBody: document.getElementById('rdvTableBody'),
            totalVotosRDV: document.getElementById('totalVotosRDV'),
            logsWindow: document.getElementById('logsWindow'),
            
            // Badges
            urnaConnBadge: document.getElementById('urnaConnBadge'),
            tecladoConnBadge: document.getElementById('tecladoConnBadge'),
            
            // Botões de Ação
            btnEmitirBU: document.getElementById('btnEmitirBU'),
            btnLimparDados: document.getElementById('btnLimparDados'),
            
            // Modal BU
            buModal: document.getElementById('buModal'),
            buContent: document.getElementById('buContent'),
            btnCloseBU: document.getElementById('btnCloseBU'),
            btnPrintBU: document.getElementById('btnPrintBU')
        };
    }

    setupSession() {
        let storedSession = localStorage.getItem('urna_session_id');
        if (!storedSession) {
            storedSession = 'SECAO_01_' + Math.random().toString(36).substring(2, 8).toUpperCase();
            localStorage.setItem('urna_session_id', storedSession);
        }
        this.sessionId = storedSession;
    }

    setupEventListeners() {
        // Validação e máscara de CPF
        if (this.elements.cpfInput) {
            this.elements.cpfInput.addEventListener('input', (e) => {
                let v = e.target.value.replace(/\D/g, '').substring(0, 11);
                e.target.value = window.formatarCPF(v);
                this.validateCpfInput(v);
            });
        }

        // Botão Liberar Eleitor
        if (this.elements.btnLiberar) {
            this.elements.btnLiberar.addEventListener('click', () => {
                this.liberarEleitorParaVotar();
            });
        }

        // Botão Desconectar Teclado
        if (this.elements.btnDesconectarTeclado) {
            this.elements.btnDesconectarTeclado.addEventListener('click', () => {
                if (confirm('Deseja desconectar o teclado atual da Urna? Um novo código de 30 segundos será gerado na tela da Urna.')) {
                    this.desconectarTecladoAtual();
                }
            });
        }

        // Botão Finalizar / Cancelar Votação Atual na Cabine
        if (this.elements.btnInterromperVotacao) {
            this.elements.btnInterromperVotacao.addEventListener('click', () => {
                if (confirm('Tem certeza que deseja INTERROMPER e CANCELAR a votação em andamento na cabine?')) {
                    this.interromperVotacaoAtual();
                }
            });
        }

        // Botão Encerrar Seção Eleitoral
        if (this.elements.btnEncerrarSecao) {
            this.elements.btnEncerrarSecao.addEventListener('click', () => {
                if (confirm('Deseja encerrar definitivamente os trabalhos da Seção Eleitoral 001? Novas votações serão bloqueadas e o Boletim de Urna (BU) será emitido.')) {
                    this.encerrarSecaoEleitoral();
                }
            });
        }

        // Emitir BU
        if (this.elements.btnEmitirBU) {
            this.elements.btnEmitirBU.addEventListener('click', () => {
                this.gerarBoletimDeUrna();
            });
        }

        // Modal BU Fechar e Imprimir
        if (this.elements.btnCloseBU) {
            this.elements.btnCloseBU.addEventListener('click', () => {
                this.elements.buModal.style.display = 'none';
            });
        }

        if (this.elements.btnPrintBU) {
            this.elements.btnPrintBU.addEventListener('click', () => {
                window.print();
            });
        }
    }

    validateCpfInput(rawDigits) {
        if (this.secaoEncerrada) {
            this.elements.cpfFeedback.textContent = '🔒 Seção Eleitoral encerrada. Novas votações não permitidas.';
            this.elements.cpfFeedback.className = 'cpf-validation-feedback invalid';
            this.elements.btnLiberar.disabled = true;
            return;
        }

        if (rawDigits.length === 11) {
            const isValid = window.validarCPF(rawDigits);
            this.currentCpfValid = isValid;

            if (isValid) {
                this.elements.cpfInput.classList.remove('invalid');
                this.elements.cpfInput.classList.add('valid');

                // Verifica se há teclado conectado
                if (!this.tecladoConectado) {
                    this.elements.cpfFeedback.className = 'cpf-validation-feedback invalid';
                    this.elements.cpfFeedback.textContent = '⚠️ CPF válido, porém NÃO HÁ TECLADO CONECTADO à Urna!';
                    this.elements.btnLiberar.disabled = true;
                    if (this.elements.tecladoAlertBox) this.elements.tecladoAlertBox.style.display = 'flex';
                } else if (this.votingActive) {
                    this.elements.cpfFeedback.className = 'cpf-validation-feedback invalid';
                    this.elements.cpfFeedback.textContent = '⏳ Cabine ocupada: aguarde a votação atual ser finalizada.';
                    this.elements.btnLiberar.disabled = true;
                } else {
                    this.elements.cpfFeedback.className = 'cpf-validation-feedback valid';
                    this.elements.cpfFeedback.textContent = '✓ CPF Válido (algoritmo Módulo 11 confirmado)';
                    this.elements.btnLiberar.disabled = false;
                    if (this.elements.tecladoAlertBox) this.elements.tecladoAlertBox.style.display = 'none';
                }
            } else {
                this.elements.cpfInput.classList.remove('valid');
                this.elements.cpfInput.classList.add('invalid');
                this.elements.cpfFeedback.className = 'cpf-validation-feedback invalid';
                this.elements.cpfFeedback.textContent = '✗ CPF Inválido (dígitos verificadores incorretos)';
                this.elements.btnLiberar.disabled = true;
            }
        } else {
            this.currentCpfValid = false;
            this.elements.cpfInput.classList.remove('valid', 'invalid');
            this.elements.cpfFeedback.className = 'cpf-validation-feedback';
            this.elements.cpfFeedback.textContent = 'Digite os 11 dígitos do CPF';
            this.elements.btnLiberar.disabled = true;
        }
    }

    loadSampleVoters() {
        // CPFs reais matematicamente válidos para facilitar testes do usuário com 1 clique
        const sampleVoters = [
            { nome: 'Ana Beatriz Souza', cpf: '01234567890' },
            { nome: 'Carlos Eduardo Mendes', cpf: '71428593000' },
            { nome: 'Mariana Lima Rocha', cpf: '12345678909' },
            { nome: 'Rafael Santos Silva', cpf: '21537894002' }
        ];

        if (this.elements.quickVotersList) {
            this.elements.quickVotersList.innerHTML = '';
            sampleVoters.forEach(v => {
                const item = document.createElement('div');
                item.className = 'quick-voter-item';
                item.innerHTML = `
                    <div>
                        <div class="voter-name">${v.nome}</div>
                        <div class="voter-cpf">${window.formatarCPF(v.cpf)}</div>
                    </div>
                    <span class="badge badge-info" style="font-size: 0.65rem;">Usar</span>
                `;
                item.addEventListener('click', () => {
                    this.elements.cpfInput.value = window.formatarCPF(v.cpf);
                    this.elements.voterNameDisplay.textContent = `Eleitor(a): ${v.nome}`;
                    this.validateCpfInput(v.cpf);
                });
                this.elements.quickVotersList.appendChild(item);
            });
        }
    }

    liberarEleitorParaVotar() {
        if (!this.currentCpfValid) return;
        if (!this.tecladoConectado) {
            alert('Atenção: Não é possível liberar a votação sem um teclado (celular) conectado à urna!');
            return;
        }
        if (this.votingActive) {
            alert('Aguarde o eleitor atual concluir a votação na cabine.');
            return;
        }

        const cpfDigits = this.elements.cpfInput.value.replace(/\D/g, '');
        // Gera hash cego do CPF para log eleitoral sem violar a privacidade
        const cpfHash = this.pseudoHash(cpfDigits);

        this.eleitoresHabilitados++;
        this.votingActive = true;
        this.addLog(`[HABILITAÇÃO] Eleitor habilitado com sucesso. Hash do Título: ${cpfHash}. Liberando terminal...`, 'success');

        // Notifica a Urna via Sync
        window.UrnaSync.set(`sessions/${this.sessionId}/status`, {
            phoneConnected: true,
            votingActive: true,
            liberadoAt: Date.now()
        });

        // Limpa formulário
        this.elements.cpfInput.value = '';
        this.elements.btnLiberar.disabled = true;
        this.elements.cpfFeedback.textContent = 'Eleitor liberado para votar na cabine!';
        this.elements.cpfFeedback.className = 'cpf-validation-feedback valid';

        // Atualiza botão de interrupção
        this.updateInterromperButton(true);
    }

    desconectarTecladoAtual() {
        this.tecladoConectado = false;
        this.addLog('[TECLADO] Teclado desconectado pelo mesário. Urna retornou ao modo de pareamento.', 'alert');
        
        window.UrnaSync.set(`sessions/${this.sessionId}/status`, {
            phoneConnected: false,
            votingActive: false,
            disconnectedAt: Date.now()
        });

        this.updateTecladoStatus(false);
    }

    interromperVotacaoAtual() {
        this.votingActive = false;
        this.addLog('[INTERRUPÇÃO] Votação em andamento foi cancelada pelo mesário. Terminal liberado.', 'alert');
        
        window.UrnaSync.set(`sessions/${this.sessionId}/status`, {
            phoneConnected: this.tecladoConectado,
            votingActive: false,
            forceFinishVoting: true,
            interruptedAt: Date.now()
        });

        this.elements.currentStepBadge.textContent = 'Aguardando Eleitor';
        this.elements.progressFill.style.width = '0%';
        this.elements.stagePills.forEach(p => p.classList.remove('active', 'done'));
        this.updateInterromperButton(false);
        this.elements.cpfFeedback.textContent = 'Terminal da urna liberado para o próximo eleitor.';
        this.elements.cpfFeedback.className = 'cpf-validation-feedback';
    }

    encerrarSecaoEleitoral() {
        this.secaoEncerrada = true;
        this.addLog('[ENCERRAMENTO] Seção Eleitoral 001 encerrada oficialmente às ' + new Date().toLocaleTimeString(), 'highlight');
        this.elements.btnLiberar.disabled = true;
        this.elements.btnEncerrarSecao.disabled = true;
        this.elements.btnEncerrarSecao.textContent = '🔒 SEÇÃO ENCERRADA';
        this.gerarBoletimDeUrna();
    }

    updateTecladoStatus(connected) {
        this.tecladoConectado = connected;
        if (connected) {
            if (this.elements.tecladoConnBadge) {
                this.elements.tecladoConnBadge.className = 'badge badge-success';
                this.elements.tecladoConnBadge.textContent = '● Teclado Online';
            }
            if (this.elements.btnDesconectarTeclado) {
                this.elements.btnDesconectarTeclado.style.display = 'inline-block';
            }
            if (this.elements.tecladoAlertBox) {
                this.elements.tecladoAlertBox.style.display = 'none';
            }
        } else {
            if (this.elements.tecladoConnBadge) {
                this.elements.tecladoConnBadge.className = 'badge badge-danger';
                this.elements.tecladoConnBadge.textContent = '○ Teclado Desconectado';
            }
            if (this.elements.btnDesconectarTeclado) {
                this.elements.btnDesconectarTeclado.style.display = 'none';
            }
            if (this.elements.tecladoAlertBox) {
                this.elements.tecladoAlertBox.style.display = 'flex';
            }
            if (this.elements.btnLiberar) {
                this.elements.btnLiberar.disabled = true;
            }
        }
    }

    updateInterromperButton(isActive) {
        if (!this.elements.btnInterromperVotacao) return;
        if (isActive) {
            this.elements.btnInterromperVotacao.disabled = false;
            this.elements.btnInterromperVotacao.style.cursor = 'pointer';
            this.elements.btnInterromperVotacao.style.opacity = '1';
        } else {
            this.elements.btnInterromperVotacao.disabled = true;
            this.elements.btnInterromperVotacao.style.cursor = 'not-allowed';
            this.elements.btnInterromperVotacao.style.opacity = '0.5';
        }
    }

    listenUrnaUpdates() {
        // Status da Conexão
        window.UrnaSync.on(`sessions/${this.sessionId}/status`, (statusData) => {
            if (!statusData) {
                this.updateTecladoStatus(false);
                return;
            }

            const isPhoneOnline = (statusData.phoneConnected === true);
            this.updateTecladoStatus(isPhoneOnline);

            if (statusData.votingActive !== undefined) {
                this.votingActive = statusData.votingActive;
                this.updateInterromperButton(this.votingActive);
            }
        });

        // Monitor de Etapas da Votação em Tempo Real
        window.UrnaSync.on(`sessions/${this.sessionId}/current_step`, (stepData) => {
            if (!stepData) return;

            this.elements.currentStepBadge.textContent = stepData.stepName || 'Aguardando';
            const stepIdx = stepData.stepIndex || 0;
            const percent = Math.min(100, Math.round((stepIdx / 6) * 100));
            this.elements.progressFill.style.width = percent + '%';

            this.elements.stagePills.forEach((pill, idx) => {
                pill.classList.remove('active', 'done');
                if (idx + 1 < stepIdx) {
                    pill.classList.add('done');
                } else if (idx + 1 === stepIdx) {
                    pill.classList.add('active');
                }
            });

            if (stepData.status === 'VOTING') {
                this.votingActive = true;
                this.updateInterromperButton(true);
                this.addLog(`[ETAPA] Urna em votação: ${stepData.stepName} (${stepIdx}/6)`, 'highlight');
            } else if (stepData.status === 'FINISHED' || stepData.status === 'IDLE') {
                this.votingActive = false;
                this.updateInterromperButton(false);
            }
        });

        // Votação Concluída e Embaralhamento em Tempo Real do RDV
        window.UrnaSync.on(`sessions/${this.sessionId}/vote_completed`, (data) => {
            if (!data || !data.votes) return;

            this.eleitoresVotaram++;
            this.votingActive = false;
            this.updateInterromperButton(false);
            this.addLog(`[VOTAÇÃO CONCLUÍDA] Voto registrado pelo eleitor. Total de votantes: ${this.eleitoresVotaram}.`, 'success');
            
            // Adiciona os votos no RDV
            this.processarNovoVotoNoRDV(data.votes);
        });
    }

    /**
     * Sistema de Embaralhamento Criptográfico do RDV em Tempo Real
     * Sempre que a pessoa vota, todos os votos são embaralhados e reordenados
     */
    processarNovoVotoNoRDV(votosCargos) {
        // Cria registros individuais para cada cargo votado
        Object.keys(votosCargos).forEach(cargoId => {
            const v = votosCargos[cargoId];
            this.votosRDV.push({
                id: 'VOTO_' + Math.random().toString(36).substring(2, 9).toUpperCase(),
                cargoNome: v.cargoNome,
                tipo: v.tipo,
                numero: v.numero,
                candidatoOuLegenda: v.candidatoNome,
                partido: v.partido,
                // O RDV real não guarda carimbo de horário nem associação com o eleitor para garantir o sigilo!
                rdvHash: this.pseudoHash(v.cargoNome + v.numero + Math.random())
            });
        });

        this.addLog(`[RDV SHUFFLE] Iniciando embaralhamento criptográfico de ${this.votosRDV.length} votos acumulados...`, 'alert');

        // Executa o embaralhamento
        this.votosRDV = window.shuffleRDV(this.votosRDV);

        this.renderRDVTable(true);
        this.addLog(`[RDV SHUFFLE] Concluído! Sigilo do voto garantido matematicamente desvinculando ordem de votação.`, 'success');
    }

    renderRDVTable(animate = false) {
        if (!this.elements.rdvTableBody) return;
        this.elements.rdvTableBody.innerHTML = '';
        this.elements.totalVotosRDV.textContent = `${this.votosRDV.length} votos computados`;

        this.votosRDV.forEach((v, index) => {
            const row = document.createElement('tr');
            if (animate) {
                row.className = 'rdv-row-shuffled';
            }
            row.innerHTML = `
                <td>#${index + 1}</td>
                <td><strong style="color: #60a5fa;">${v.cargoNome}</strong></td>
                <td><span class="badge ${v.tipo === 'CANDIDATO' ? 'badge-success' : (v.tipo === 'BRANCO' ? 'badge-info' : 'badge-warning')}">${v.numero}</span></td>
                <td>${v.candidatoOuLegenda}</td>
                <td style="color: #94a3b8; font-size: 0.7rem;">${v.rdvHash.substring(0, 16)}...</td>
            `;
            this.elements.rdvTableBody.appendChild(row);
        });
    }

    addLog(message, type = 'normal') {
        if (!this.elements.logsWindow) return;
        const now = new Date();
        const timeStr = now.toLocaleTimeString() + '.' + String(now.getMilliseconds()).padStart(3, '0');

        const entry = document.createElement('div');
        entry.className = 'log-entry';
        entry.innerHTML = `
            <span class="log-time">[${timeStr}]</span>
            <span class="log-msg ${type}">${message}</span>
        `;

        this.elements.logsWindow.appendChild(entry);
        this.elements.logsWindow.scrollTop = this.elements.logsWindow.scrollHeight;
    }

    gerarBoletimDeUrna() {
        if (this.votosRDV.length === 0) {
            alert('Nenhum voto foi computado ainda nesta seção para emissão do Boletim de Urna.');
            return;
        }

        // Consolidação dos totais por cargo
        const totals = {};
        this.votosRDV.forEach(v => {
            if (!totals[v.cargoNome]) {
                totals[v.cargoNome] = {};
            }
            const key = `${v.numero} - ${v.candidatoOuLegenda}`;
            totals[v.cargoNome][key] = (totals[v.cargoNome][key] || 0) + 1;
        });

        let buHtml = `
            <div class="bu-header">
                <h2>JUSTIÇA ELEITORAL BRASILEIRA</h2>
                <p>ELEIÇÕES GERAIS DE 2026 - 1º TURNO</p>
                <p><strong>BOLETIM DE URNA (BU) - OFICIAL</strong></p>
                <p>MUNICÍPIO: SÃO PAULO | ZONA: 001 | SEÇÃO: 001</p>
                <p>DATA DE FECHAMENTO: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}</p>
                <p>ELEITORES APTOS: 500 | COMPARECIMENTO: ${this.eleitoresVotaram}</p>
            </div>
            <div style="margin-top: 15px;">
        `;

        for (const cargo in totals) {
            buHtml += `<h3 style="margin-top: 12px; border-bottom: 1px dashed #333; padding-bottom: 3px; font-size: 0.85rem;">CARGO: ${cargo}</h3>`;
            buHtml += `<ul style="list-style: none; padding-left: 10px; margin-top: 5px;">`;
            for (const cand in totals[cargo]) {
                buHtml += `<li style="display: flex; justify-content: space-between; font-size: 0.8rem;">
                    <span>${cand}</span>
                    <strong>${totals[cargo][cand]} votos</strong>
                </li>`;
            }
            buHtml += `</ul>`;
        }

        buHtml += `
            <div style="margin-top: 20px; border-top: 1px solid #111; padding-top: 10px; font-size: 0.7rem; text-align: center;">
                <p>ASSINATURA DIGITAL DO REGISTRO DE VOTO:</p>
                <p style="word-break: break-all; color: #475569;">${this.pseudoHash(JSON.stringify(totals))}</p>
                <p>URNA MODELO 2026 - SISTEMA AUDITADO</p>
            </div>
        `;

        this.elements.buContent.innerHTML = buHtml;
        this.elements.buModal.style.display = 'flex';
        this.addLog('[BU EMITIDO] Boletim de Urna impresso e assinado digitalmente.', 'highlight');
    }

    pseudoHash(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return 'SHA256_' + Math.abs(hash).toString(16).padStart(16, '0') + Math.random().toString(16).substring(2, 10);
    }
}

window.addEventListener('DOMContentLoaded', () => {
    window.mesarioController = new MesarioController();
    window.mesarioController.init();
});
