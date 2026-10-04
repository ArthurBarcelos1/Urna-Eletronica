/**
 * Urna Eletrônica 2026 - Base de Dados de Candidatos Oficiais
 * Ordem oficial das Eleições Gerais de 2026:
 * 1. Deputado Federal (4 dígitos)
 * 2. Deputado Estadual ou Distrital (5 dígitos)
 * 3. Senador - 1ª vaga (3 dígitos)
 * 4. Senador - 2ª vaga (3 dígitos)
 * 5. Governador (2 dígitos)
 * 6. Presidente da República (2 dígitos)
 */

// Gera avatares SVG estilizados de alta definição para os candidatos, vices e suplentes
function generateCandidateAvatar(name, gender = 'm', role = 'CANDIDATO', color = '#1e3a8a') {
    const initials = name.split(' ').map(n => n[0]).slice(0, 2).join('');
    const bgColors = ['#1e293b', '#0f766e', '#1d4ed8', '#7c2d12', '#4c1d95', '#166534'];
    const chosenBg = bgColors[Math.abs(name.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)) % bgColors.length];
    
    return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="380" viewBox="0 0 300 380">
        <defs>
            <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style="stop-color:${chosenBg};stop-opacity:1" />
                <stop offset="100%" style="stop-color:#020617;stop-opacity:1" />
            </linearGradient>
            <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="8" stdDeviation="6" flood-opacity="0.3"/>
            </filter>
        </defs>
        <rect width="300" height="380" fill="url(#grad)" rx="8"/>
        
        <!-- Fundo institucional TSE / Selo marca d'água -->
        <circle cx="150" cy="140" r="85" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="4"/>
        <circle cx="150" cy="140" r="70" fill="none" stroke="rgba(255,255,255,0.04)" stroke-width="2"/>
        
        <!-- Silhueta / Busto Eleitoral -->
        <circle cx="150" cy="120" r="52" fill="#e2e8f0" filter="url(#shadow)"/>
        <path d="M 75 270 C 75 195 225 195 225 270 Z" fill="#cbd5e1"/>
        <path d="M 120 195 L 150 225 L 180 195 L 150 250 Z" fill="#94a3b8"/> <!-- Gravata / Gola -->
        
        <!-- Letras Iniciais no Busto -->
        <text x="150" y="132" font-family="Arial, sans-serif" font-size="34" font-weight="900" fill="#1e293b" text-anchor="middle">${initials}</text>
        
        <!-- Faixa inferior com o nome e justiça eleitoral -->
        <rect y="295" width="300" height="85" fill="#0f172a" fill-opacity="0.95"/>
        <rect y="292" width="300" height="3" fill="#22c55e"/>
        <text x="150" y="325" font-family="'Atkinson Hyperlegible', Arial, sans-serif" font-size="16" font-weight="700" fill="#f8fafc" text-anchor="middle">${name.toUpperCase()}</text>
        <text x="150" y="348" font-family="'Atkinson Hyperlegible', Arial, sans-serif" font-size="11" font-weight="600" fill="#94a3b8" letter-spacing="1.5" text-anchor="middle">JUSTIÇA ELEITORAL 2026</text>
        <text x="150" y="366" font-family="'Atkinson Hyperlegible', Arial, sans-serif" font-size="9" fill="#22c55e" text-anchor="middle">FOTO OFICIAL HOMOLOGADA</text>
    </svg>`;
}

const CARGOS_ELEICAO_2026 = [
    {
        id: 'deputado_federal',
        codigo: 1,
        nome: 'DEPUTADO FEDERAL',
        digitos: 4,
        isProporcional: true,
        suplentes: false,
        vice: false,
        librasSign: 'Deputado Federal'
    },
    {
        id: 'deputado_estadual',
        codigo: 2,
        nome: 'DEPUTADO ESTADUAL OU DISTRITAL',
        digitos: 5,
        isProporcional: true,
        suplentes: false,
        vice: false,
        librasSign: 'Deputado Estadual'
    },
    {
        id: 'senador_1',
        codigo: 3,
        nome: 'SENADOR — 1ª VAGA',
        digitos: 3,
        isProporcional: false,
        suplentes: true,
        vice: false,
        librasSign: 'Senador 1ª Vaga'
    },
    {
        id: 'senador_2',
        codigo: 4,
        nome: 'SENADOR — 2ª VAGA',
        digitos: 3,
        isProporcional: false,
        suplentes: true,
        vice: false,
        librasSign: 'Senador 2ª Vaga'
    },
    {
        id: 'governador',
        codigo: 5,
        nome: 'GOVERNADOR',
        digitos: 2,
        isProporcional: false,
        suplentes: false,
        vice: true,
        librasSign: 'Governador'
    },
    {
        id: 'presidente',
        codigo: 6,
        nome: 'PRESIDENTE DA REPÚBLICA',
        digitos: 2,
        isProporcional: false,
        suplentes: false,
        vice: true,
        librasSign: 'Presidente'
    }
];

const PARTIDOS = {
    '10': { numero: '10', sigla: 'REP', nome: 'Republicanos' },
    '12': { numero: '12', sigla: 'PDT', nome: 'Partido Democrático Trabalhista' },
    '13': { numero: '13', sigla: 'PT', nome: 'Partido dos Trabalhadores' },
    '15': { numero: '15', sigla: 'MDB', nome: 'Movimento Democrático Brasileiro' },
    '20': { numero: '20', sigla: 'PODE', nome: 'Podemos' },
    '22': { numero: '22', sigla: 'PL', nome: 'Partido Liberal' },
    '30': { numero: '30', sigla: 'NOVO', nome: 'Partido Novo' },
    '40': { numero: '40', sigla: 'PSB', nome: 'Partido Socialista Brasileiro' },
    '45': { numero: '45', sigla: 'PSDB', nome: 'Partido da Social Democracia Brasileira' },
    '50': { numero: '50', sigla: 'PSOL', nome: 'Partido Socialismo e Liberdade' },
    '55': { numero: '55', sigla: 'PSD', nome: 'Partido Social Democrático' },
    '44': { numero: '44', sigla: 'UNIÃO', nome: 'União Brasil' }
};

const CANDIDATOS_DATABASE = {
    // 1. DEPUTADO FEDERAL (4 dígitos)
    'deputado_federal': [
        {
            numero: '1322',
            nome: 'MARIA SILVA DA ESPERANÇA',
            partido: 'PARTIDO DOS TRABALHADORES — PT',
            legendaNumero: '13',
            foto: generateCandidateAvatar('Maria Silva da Esperança', 'f')
        },
        {
            numero: '2210',
            nome: 'CARLOS ALBERTO MENEZES',
            partido: 'PARTIDO LIBERAL — PL',
            legendaNumero: '22',
            foto: generateCandidateAvatar('Carlos Alberto Menezes', 'm')
        },
        {
            numero: '4501',
            nome: 'FERNANDA COSTA BITTENCOURT',
            partido: 'PARTIDO DA SOCIAL DEMOCRACIA — PSDB',
            legendaNumero: '45',
            foto: generateCandidateAvatar('Fernanda Costa Bittencourt', 'f')
        },
        {
            numero: '1515',
            nome: 'ROBERTO VIANA SANTOS',
            partido: 'MOVIMENTO DEMOCRÁTICO BRASILEIRO — MDB',
            legendaNumero: '15',
            foto: generateCandidateAvatar('Roberto Viana Santos', 'm')
        },
        {
            numero: '5050',
            nome: 'JULIANA MARTINS FREITAS',
            partido: 'PARTIDO SOCIALISMO E LIBERDADE — PSOL',
            legendaNumero: '50',
            foto: generateCandidateAvatar('Juliana Martins Freitas', 'f')
        }
    ],

    // 2. DEPUTADO ESTADUAL (5 dígitos)
    'deputado_estadual': [
        {
            numero: '13123',
            nome: 'PROFESSOR JOÃO BATISTA',
            partido: 'PARTIDO DOS TRABALHADORES — PT',
            legendaNumero: '13',
            foto: generateCandidateAvatar('Professor João Batista', 'm')
        },
        {
            numero: '22222',
            nome: 'CORONEL RICARDO LIMA',
            partido: 'PARTIDO LIBERAL — PL',
            legendaNumero: '22',
            foto: generateCandidateAvatar('Coronel Ricardo Lima', 'm')
        },
        {
            numero: '45555',
            nome: 'DRA. BEATRIZ AZEVEDO',
            partido: 'PARTIDO DA SOCIAL DEMOCRACIA — PSDB',
            legendaNumero: '45',
            foto: generateCandidateAvatar('Dra. Beatriz Azevedo', 'f')
        },
        {
            numero: '15000',
            nome: 'MARCELO ANDRADE JÚNIOR',
            partido: 'MOVIMENTO DEMOCRÁTICO BRASILEIRO — MDB',
            legendaNumero: '15',
            foto: generateCandidateAvatar('Marcelo Andrade Júnior', 'm')
        },
        {
            numero: '55123',
            nome: 'LUCIANA PINHEIRO MOURA',
            partido: 'PARTIDO SOCIAL DEMOCRÁTICO — PSD',
            legendaNumero: '55',
            foto: generateCandidateAvatar('Luciana Pinheiro Moura', 'f')
        }
    ],

    // 3. SENADOR - 1ª VAGA e 4. SENADOR - 2ª VAGA (3 dígitos)
    'senador': [
        {
            numero: '131',
            nome: 'PAULO CÉSAR CARDOSO',
            partido: 'PARTIDO DOS TRABALHADORES — PT',
            foto: generateCandidateAvatar('Paulo César Cardoso', 'm'),
            suplente1: {
                nome: 'HELENA MATTOS',
                foto: generateCandidateAvatar('Helena Mattos', 'f')
            },
            suplente2: {
                nome: 'JOSÉ MOREIRA',
                foto: generateCandidateAvatar('José Moreira', 'm')
            }
        },
        {
            numero: '222',
            nome: 'EDUARDO NOGUEIRA FILHO',
            partido: 'PARTIDO LIBERAL — PL',
            foto: generateCandidateAvatar('Eduardo Nogueira Filho', 'm'),
            suplente1: {
                nome: 'ALICE VASCONCELOS',
                foto: generateCandidateAvatar('Alice Vasconcelos', 'f')
            },
            suplente2: {
                nome: 'GABRIEL TEIXEIRA',
                foto: generateCandidateAvatar('Gabriel Teixeira', 'm')
            }
        },
        {
            numero: '151',
            nome: 'RENATA SOUZA DIAS',
            partido: 'MOVIMENTO DEMOCRÁTICO BRASILEIRO — MDB',
            foto: generateCandidateAvatar('Renata Souza Dias', 'f'),
            suplente1: {
                nome: 'MARCOS ANTÔNIO LEAL',
                foto: generateCandidateAvatar('Marcos Antônio Leal', 'm')
            },
            suplente2: {
                nome: 'PATRÍCIA NUNES',
                foto: generateCandidateAvatar('Patrícia Nunes', 'f')
            }
        },
        {
            numero: '456',
            nome: 'ÁLVARO GUIMARÃES PRADO',
            partido: 'PARTIDO DA SOCIAL DEMOCRACIA — PSDB',
            foto: generateCandidateAvatar('Álvaro Guimarães Prado', 'm'),
            suplente1: {
                nome: 'SUELI CARVALHO',
                foto: generateCandidateAvatar('Sueli Carvalho', 'f')
            },
            suplente2: {
                nome: 'BRUNO FONSECA',
                foto: generateCandidateAvatar('Bruno Fonseca', 'm')
            }
        },
        {
            numero: '555',
            nome: 'CLARA BEATRIZ VASCONCELLOS',
            partido: 'PARTIDO SOCIAL DEMOCRÁTICO — PSD',
            foto: generateCandidateAvatar('Clara Beatriz Vasconcellos', 'f'),
            suplente1: {
                nome: 'VITOR HUGO TAVARES',
                foto: generateCandidateAvatar('Vitor Hugo Tavares', 'm')
            },
            suplente2: {
                nome: 'SOLANGE RIBEIRO',
                foto: generateCandidateAvatar('Solange Ribeiro', 'f')
            }
        }
    ],

    // 5. GOVERNADOR (2 dígitos)
    'governador': [
        {
            numero: '13',
            nome: 'ANA CLÁUDIA CARVALHO',
            partido: 'COLIGAÇÃO ESPERANÇA E PROGRESSO (PT / PSB / PCdoB)',
            foto: generateCandidateAvatar('Ana Cláudia Carvalho', 'f'),
            vice: {
                nome: 'RODRIGO PEIXOTO',
                foto: generateCandidateAvatar('Rodrigo Peixoto', 'm')
            }
        },
        {
            numero: '22',
            nome: 'GUSTAVO HENRIQUE BARBOSA',
            partido: 'COLIGAÇÃO ORDEM E CRESCIMENTO (PL / PP / REPUBLICANOS)',
            foto: generateCandidateAvatar('Gustavo Henrique Barbosa', 'm'),
            vice: {
                nome: 'ADRIANA TOLEDO',
                foto: generateCandidateAvatar('Adriana Toledo', 'f')
            }
        },
        {
            numero: '15',
            nome: 'HENRIQUE MACEDO JORGE',
            partido: 'COLIGAÇÃO UNIDOS PELO ESTADO (MDB / UNIÃO)',
            foto: generateCandidateAvatar('Henrique Macedo Jorge', 'm'),
            vice: {
                nome: 'LÍVIA CASTRO',
                foto: generateCandidateAvatar('Lívia Castro', 'f')
            }
        },
        {
            numero: '45',
            nome: 'SÉRGIO BRAGANÇA NETO',
            partido: 'PARTIDO DA SOCIAL DEMOCRACIA BRASILEIRA — PSDB',
            foto: generateCandidateAvatar('Sérgio Bragança Neto', 'm'),
            vice: {
                nome: 'CARLA NOGUEIRA',
                foto: generateCandidateAvatar('Carla Nogueira', 'f')
            }
        }
    ],

    // 6. PRESIDENTE DA REPÚBLICA (2 dígitos)
    'presidente': [
        {
            numero: '13',
            nome: 'ALEXANDRE DE OLIVEIRA SILVA',
            partido: 'COLIGAÇÃO BRASIL DO POVO (PT / PSB / PSOL / REDE)',
            foto: generateCandidateAvatar('Alexandre de Oliveira Silva', 'm'),
            vice: {
                nome: 'BEATRIZ MENDONÇA ARRUDA',
                foto: generateCandidateAvatar('Beatriz Mendonça Arruda', 'f')
            }
        },
        {
            numero: '22',
            nome: 'WALTER MOURÃO CAVALCANTI',
            partido: 'COLIGAÇÃO BRASIL LIVRE E SOBERANO (PL / NOVO)',
            foto: generateCandidateAvatar('Walter Mourão Cavalcanti', 'm'),
            vice: {
                nome: 'LEONARDO BORGES GUEDES',
                foto: generateCandidateAvatar('Leonardo Borges Guedes', 'm')
            }
        },
        {
            numero: '15',
            nome: 'SIMONE MARQUES TELES',
            partido: 'COLIGAÇÃO DIÁLOGO E PAZ (MDB / CIDADANIA)',
            foto: generateCandidateAvatar('Simone Marques Teles', 'f'),
            vice: {
                nome: 'FÁBIO HENRIQUE RESENDE',
                foto: generateCandidateAvatar('Fábio Henrique Resende', 'm')
            }
        },
        {
            numero: '45',
            nome: 'EDUARDO LEITE MONTEIRO',
            partido: 'FEDERAÇÃO PSDB E CIDADANIA',
            foto: generateCandidateAvatar('Eduardo Leite Monteiro', 'm'),
            vice: {
                nome: 'MARIANA SALLES VIEIRA',
                foto: generateCandidateAvatar('Mariana Salles Vieira', 'f')
            }
        }
    ]
};

// Funções auxiliares de busca
function findCandidato(cargoId, numero) {
    if (!numero) return null;
    
    // Tratamento para senador (1ª e 2ª vaga usam a mesma lista)
    const dbKey = (cargoId === 'senador_1' || cargoId === 'senador_2') ? 'senador' : cargoId;
    const lista = CANDIDATOS_DATABASE[dbKey] || [];
    
    return lista.find(c => c.numero === numero) || null;
}

function findLegenda(cargoId, numeroLegenda) {
    const cargo = CARGOS_ELEICAO_2026.find(c => c.id === cargoId);
    if (!cargo || !cargo.isProporcional) return null;
    
    return PARTIDOS[numeroLegenda] || null;
}

window.CARGOS_ELEICAO_2026 = CARGOS_ELEICAO_2026;
window.PARTIDOS = PARTIDOS;
window.CANDIDATOS_DATABASE = CANDIDATOS_DATABASE;
window.findCandidato = findCandidato;
window.findLegenda = findLegenda;
