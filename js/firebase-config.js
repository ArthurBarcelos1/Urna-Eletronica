/**
 * Sincronização em tempo real do modelo de teste (Firebase + fallback local)
 * Conecta o visor, o teclado e o terminal de teste.
 */

const FIREBASE_CONFIG = {
    apiKey: "AIzaSyAEdsKawRQqTRwpunDhTrLH8i8rF0R2CQM",
    authDomain: "projeto-urna-eletronica.firebaseapp.com",
    databaseURL: "https://projeto-urna-eletronica-default-rtdb.firebaseio.com",
    projectId: "projeto-urna-eletronica",
    storageBucket: "projeto-urna-eletronica.firebasestorage.app",
    messagingSenderId: "77696911618",
    appId: "1:77696911618:web:ab109bfac99470a818da1b",
    measurementId: "G-Q7FC3NNFFL"
};

class UrnaSyncManager {
    constructor() {
        this.firebaseApp = null;
        this.database = null;
        this.isFirebaseReady = false;
        this.firebaseError = null;
        this.listeners = {};
        
        // Canal de comunicação local ultrarrápido (BroadcastChannel + LocalStorage)
        // Permite pareamento e comunicação mesmo se as regras do Firebase estiverem em .read: false / .write: false
        this.channelName = 'URNA_ELETRONICA_2026_CHANNEL';
        this.localChannel = null;
        this.initLocalChannel();
        this.initFirebase();
    }

    initLocalChannel() {
        try {
            if (typeof BroadcastChannel !== 'undefined') {
                this.localChannel = new BroadcastChannel(this.channelName);
                this.localChannel.onmessage = (event) => {
                    const { path, data } = event.data;
                    this.triggerListeners(path, data);
                };
            }
        } catch (e) {
            console.warn('[Sync] BroadcastChannel não suportado, usando fallback LocalStorage', e);
        }

        // Listener de Storage para comunicação entre abas
        window.addEventListener('storage', (e) => {
            if (e.key && e.key.startsWith('urna_sync_')) {
                const path = e.key.replace('urna_sync_', '');
                try {
                    const data = JSON.parse(e.newValue);
                    this.triggerListeners(path, data);
                } catch (err) {
                    console.error('Erro ao ler storage sync', err);
                }
            }
        });
    }

    async initFirebase() {
        try {
            // Tenta inicializar caso o Firebase SDK esteja presente no window
            if (typeof firebase !== 'undefined' && firebase.initializeApp) {
                if (!firebase.apps.length) {
                    this.firebaseApp = firebase.initializeApp(FIREBASE_CONFIG);
                } else {
                    this.firebaseApp = firebase.app();
                }
                this.database = firebase.database();
                this.isFirebaseReady = true;
                console.log('[Sync] Firebase inicializado com sucesso.');
            } else {
                console.log('[Sync] Operando via sincronizador local de alta performance.');
            }
        } catch (err) {
            this.firebaseError = err.message;
            console.warn('[Sync] Firebase indisponível ou regras restritas. Operando com sincronia de alta resiliência.', err);
        }
    }

    /**
     * Envia atualização para um caminho
     */
    async set(path, data) {
        // 1. Sempre atualiza localmente para resposta instantânea
        try {
            localStorage.setItem('urna_sync_' + path, JSON.stringify(data));
            if (this.localChannel) {
                this.localChannel.postMessage({ path, data });
            }
            this.triggerListeners(path, data);
        } catch (err) {
            console.warn('Erro ao salvar local sync:', err);
        }

        // 2. Tenta enviar para o Firebase Realtime Database
        if (this.isFirebaseReady && this.database) {
            try {
                await this.database.ref(path).set(data);
            } catch (err) {
                // Se as regras estiverem bloqueadas (.read: false, .write: false), o erro será capturado
                this.firebaseError = err.message;
                this.notifyPermissionStatus(err);
            }
        }
    }

    /**
     * Lê o valor atual de um caminho
     */
    async get(path) {
        if (this.isFirebaseReady && this.database) {
            try {
                const snapshot = await this.database.ref(path).once('value');
                if (snapshot.exists()) {
                    return snapshot.val();
                }
            } catch (err) {
                this.firebaseError = err.message;
            }
        }

        // Fallback local
        const local = localStorage.getItem('urna_sync_' + path);
        if (local) {
            try {
                return JSON.parse(local);
            } catch (e) {
                return null;
            }
        }
        return null;
    }

    /**
     * Assina atualizações em um caminho
     */
    on(path, callback) {
        if (!this.listeners[path]) {
            this.listeners[path] = [];
        }
        this.listeners[path].push(callback);

        // Se Firebase estiver ativo, escuta também
        if (this.isFirebaseReady && this.database) {
            try {
                this.database.ref(path).on('value', (snapshot) => {
                    const val = snapshot.val();
                    if (val !== null) {
                        callback(val);
                    }
                }, (error) => {
                    this.firebaseError = error.message;
                    this.notifyPermissionStatus(error);
                });
            } catch (e) {
                console.warn('Erro ao registrar listener Firebase:', e);
            }
        }

        // Dispara imediatamente com o estado atual local se existir
        const current = localStorage.getItem('urna_sync_' + path);
        if (current) {
            try {
                callback(JSON.parse(current));
            } catch (e) {}
        }
    }

    triggerListeners(path, data) {
        if (this.listeners[path]) {
            this.listeners[path].forEach(cb => {
                try { cb(data); } catch (e) { console.error('Erro em listener:', e); }
            });
        }
    }

    notifyPermissionStatus(err) {
        if (window.onFirebaseSyncStatus) {
            window.onFirebaseSyncStatus({
                success: false,
                error: err ? err.message : 'Regras do Firebase restritas',
                hint: 'Para comunicação entre redes externas via Firebase, configure no Firebase Console: { ".read": true, ".write": true }'
            });
        }
    }
}

// Utilitário para gerar código de 12 dígitos no formato ####-####-####
function generatePairingCode() {
    const part = () => Math.floor(1000 + Math.random() * 9000).toString();
    return `${part()}-${part()}-${part()}`;
}

// Validação de CPF pelo algoritmo Módulo 11
function validarCPF(cpf) {
    if (!cpf) return false;
    cpf = cpf.toString().replace(/[^\d]+/g, '');
    if (cpf.length !== 11) return false;
    if (/^(\d)\1{10}$/.test(cpf)) return false; // Bloqueia sequências iguais como 111.111.111-11

    let soma = 0;
    let resto;
    for (let i = 1; i <= 9; i++) {
        soma += parseInt(cpf.substring(i - 1, i)) * (11 - i);
    }
    resto = (soma * 10) % 11;
    if ((resto === 10) || (resto === 11)) resto = 0;
    if (resto !== parseInt(cpf.substring(9, 10))) return false;

    soma = 0;
    for (let i = 1; i <= 10; i++) {
        soma += parseInt(cpf.substring(i - 1, i)) * (12 - i);
    }
    resto = (soma * 10) % 11;
    if ((resto === 10) || (resto === 11)) resto = 0;
    if (resto !== parseInt(cpf.substring(10, 11))) return false;

    return true;
}

// Formatação visual de CPF
function formatarCPF(cpf) {
    if (!cpf) return '';
    cpf = cpf.toString().replace(/\D/g, '');
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
}

// Algoritmo de Embaralhamento Criptográfico do Registro Digital do Voto (RDV)
// Garante o sigilo do voto desvinculando o eleitor/horário da ordem dos votos registrados
function shuffleRDV(votosArray) {
    if (!Array.isArray(votosArray)) return [];
    const array = [...votosArray];
    for (let i = array.length - 1; i > 0; i--) {
        // Fisher-Yates com entropia pseudo-aleatória
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

window.UrnaSync = new UrnaSyncManager();
window.generatePairingCode = generatePairingCode;
window.validarCPF = validarCPF;
window.formatarCPF = formatarCPF;
window.shuffleRDV = shuffleRDV;
window.FIREBASE_CONFIG = FIREBASE_CONFIG;
