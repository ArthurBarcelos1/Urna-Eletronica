/**
 * Dados de demonstração do modelo de teste
 * Ordem de exibição dos cargos:
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
        
        <!-- Silhueta / Busto Eleitoral -->
        <circle cx="150" cy="120" r="52" fill="#e2e8f0" filter="url(#shadow)"/>
        <path d="M 75 270 C 75 195 225 195 225 270 Z" fill="#cbd5e1"/>
        <path d="M 120 195 L 150 225 L 180 195 L 150 250 Z" fill="#94a3b8"/> <!-- Gravata / Gola -->
        
        <!-- Letras Iniciais no Busto -->
        <text x="150" y="132" font-family="Arial, sans-serif" font-size="34" font-weight="900" fill="#1e293b" text-anchor="middle">${initials}</text>
        
        <!-- Faixa inferior do modelo de demonstração -->
        <rect y="295" width="300" height="85" fill="#0f172a" fill-opacity="0.95"/>
        <rect y="292" width="300" height="3" fill="#22c55e"/>
        <text x="150" y="325" font-family="'Atkinson Hyperlegible', Arial, sans-serif" font-size="16" font-weight="700" fill="#f8fafc" text-anchor="middle">${name.toUpperCase()}</text>
        <text x="150" y="348" font-family="'Atkinson Hyperlegible', Arial, sans-serif" font-size="11" font-weight="600" fill="#94a3b8" letter-spacing="1.5" text-anchor="middle">MODELO DE TESTE</text>
        <text x="150" y="366" font-family="'Atkinson Hyperlegible', Arial, sans-serif" font-size="9" fill="#22c55e" text-anchor="middle">IMAGEM DE DEMONSTRAÇÃO</text>
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
    },
    {
        id: 'deputado_estadual',
        codigo: 2,
        nome: 'DEPUTADO ESTADUAL OU DISTRITAL',
        digitos: 5,
        isProporcional: true,
        suplentes: false,
        vice: false,
    },
    {
        id: 'senador_1',
        codigo: 3,
        nome: 'SENADOR — 1ª VAGA',
        digitos: 3,
        isProporcional: false,
        suplentes: true,
        vice: false,
    },
    {
        id: 'senador_2',
        codigo: 4,
        nome: 'SENADOR — 2ª VAGA',
        digitos: 3,
        isProporcional: false,
        suplentes: true,
        vice: false,
    },
    {
        id: 'governador',
        codigo: 5,
        nome: 'GOVERNADOR',
        digitos: 2,
        isProporcional: false,
        suplentes: false,
        vice: true,
    },
    {
        id: 'presidente',
        codigo: 6,
        nome: 'PRESIDENTE DA REPÚBLICA',
        digitos: 2,
        isProporcional: false,
        suplentes: false,
        vice: true,
    }
];

const PARTIDOS = {
    '10': { numero: '10', sigla: 'T10', nome: 'Partido Teste 10' },
    '12': { numero: '12', sigla: 'T12', nome: 'Partido Teste 12' },
    '13': { numero: '13', sigla: 'T13', nome: 'Partido Teste 13' },
    '15': { numero: '15', sigla: 'T15', nome: 'Partido Teste 15' },
    '20': { numero: '20', sigla: 'T20', nome: 'Partido Teste 20' },
    '22': { numero: '22', sigla: 'T22', nome: 'Partido Teste 22' },
    '30': { numero: '30', sigla: 'T30', nome: 'Partido Teste 30' },
    '40': { numero: '40', sigla: 'T40', nome: 'Partido Teste 40' },
    '45': { numero: '45', sigla: 'T45', nome: 'Partido Teste 45' },
    '50': { numero: '50', sigla: 'T50', nome: 'Partido Teste 50' },
    '55': { numero: '55', sigla: 'T55', nome: 'Partido Teste 55' },
    '44': { numero: '44', sigla: 'T44', nome: 'Partido Teste 44' },
    '91': { numero: '91', sigla: 'T91', nome: 'Partido Teste 91' },
    '92': { numero: '92', sigla: 'T92', nome: 'Partido Teste 92' },
    '93': { numero: '93', sigla: 'T93', nome: 'Partido Teste 93' },
    '94': { numero: '94', sigla: 'T94', nome: 'Partido Teste 94' },
    '95': { numero: '95', sigla: 'T95', nome: 'Partido Teste 95' }
};

const CANDIDATOS_DATABASE = {
    // 1. DEPUTADO FEDERAL (4 dígitos)
    'deputado_federal': [
        {
            numero: '1322',
            nome: 'Modelo Teste 01',
            partido: 'Partido Teste 01',
            legendaNumero: '13',
            foto: generateCandidateAvatar('Modelo Teste', 'f')
        },
        {
            numero: '2210',
            nome: 'Modelo Teste 02',
            partido: 'Partido Teste 02',
            legendaNumero: '22',
            foto: generateCandidateAvatar('Modelo Teste', 'm')
        },
        {
            numero: '4501',
            nome: 'Modelo Teste 03',
            partido: 'Partido Teste 03',
            legendaNumero: '45',
            foto: generateCandidateAvatar('Modelo Teste', 'f')
        },
        {
            numero: '1515',
            nome: 'Modelo Teste 04',
            partido: 'Partido Teste 04',
            legendaNumero: '15',
            foto: generateCandidateAvatar('Modelo Teste', 'm')
        },
        {
            numero: '5050',
            nome: 'Modelo Teste 05',
            partido: 'Partido Teste 05',
            legendaNumero: '50',
            foto: generateCandidateAvatar('Modelo Teste', 'f')
        }
    ],

    // 2. DEPUTADO ESTADUAL (5 dígitos)
    'deputado_estadual': [
        {
            numero: '13123',
            nome: 'Modelo Teste 06',
            partido: 'Partido Teste 01',
            legendaNumero: '13',
            foto: generateCandidateAvatar('Modelo Teste', 'm')
        },
        {
            numero: '22222',
            nome: 'Modelo Teste 07',
            partido: 'Partido Teste 02',
            legendaNumero: '22',
            foto: generateCandidateAvatar('Modelo Teste', 'm')
        },
        {
            numero: '45555',
            nome: 'Modelo Teste 08',
            partido: 'Partido Teste 03',
            legendaNumero: '45',
            foto: generateCandidateAvatar('Modelo Teste', 'f')
        },
        {
            numero: '15000',
            nome: 'Modelo Teste 09',
            partido: 'Partido Teste 04',
            legendaNumero: '15',
            foto: generateCandidateAvatar('Modelo Teste', 'm')
        },
        {
            numero: '55123',
            nome: 'Modelo Teste 10',
            partido: 'Partido Teste 05',
            legendaNumero: '55',
            foto: generateCandidateAvatar('Modelo Teste', 'f')
        }
    ],

    // 3. SENADOR - 1ª VAGA e 4. SENADOR - 2ª VAGA (3 dígitos)
    'senador': [
        {
            numero: '131',
            nome: 'Modelo Teste 11',
            partido: 'Partido Teste 01',
            foto: generateCandidateAvatar('Modelo Teste', 'm'),
            suplente1: {
                nome: 'Modelo Teste 12',
                foto: generateCandidateAvatar('Modelo Teste', 'f')
            },
            suplente2: {
                nome: 'Modelo Teste 13',
                foto: generateCandidateAvatar('Modelo Teste', 'm')
            }
        },
        {
            numero: '222',
            nome: 'Modelo Teste 14',
            partido: 'Partido Teste 02',
            foto: generateCandidateAvatar('Modelo Teste', 'm'),
            suplente1: {
                nome: 'Modelo Teste 15',
                foto: generateCandidateAvatar('Modelo Teste', 'f')
            },
            suplente2: {
                nome: 'Modelo Teste 16',
                foto: generateCandidateAvatar('Modelo Teste', 'm')
            }
        },
        {
            numero: '151',
            nome: 'Modelo Teste 17',
            partido: 'Partido Teste 03',
            foto: generateCandidateAvatar('Modelo Teste', 'f'),
            suplente1: {
                nome: 'Modelo Teste 18',
                foto: generateCandidateAvatar('Modelo Teste', 'm')
            },
            suplente2: {
                nome: 'Modelo Teste 19',
                foto: generateCandidateAvatar('Modelo Teste', 'f')
            }
        },
        {
            numero: '456',
            nome: 'Modelo Teste 20',
            partido: 'Partido Teste 04',
            foto: generateCandidateAvatar('Modelo Teste', 'm'),
            suplente1: {
                nome: 'Modelo Teste 21',
                foto: generateCandidateAvatar('Modelo Teste', 'f')
            },
            suplente2: {
                nome: 'Modelo Teste 22',
                foto: generateCandidateAvatar('Modelo Teste', 'm')
            }
        },
        {
            numero: '555',
            nome: 'Modelo Teste 23',
            partido: 'Partido Teste 05',
            foto: generateCandidateAvatar('Modelo Teste', 'f'),
            suplente1: {
                nome: 'Modelo Teste 24',
                foto: generateCandidateAvatar('Modelo Teste', 'm')
            },
            suplente2: {
                nome: 'Modelo Teste 25',
                foto: generateCandidateAvatar('Modelo Teste', 'f')
            }
        }
    ],

    // 5. GOVERNADOR (2 dígitos)
    'governador': [
        {
            numero: '13',
            nome: 'Modelo Teste 26',
            partido: 'Partido Teste 01',
            foto: generateCandidateAvatar('Modelo Teste', 'f'),
            vice: {
                nome: 'Modelo Teste 27',
                foto: generateCandidateAvatar('Modelo Teste', 'm')
            }
        },
        {
            numero: '22',
            nome: 'Modelo Teste 28',
            partido: 'Partido Teste 02',
            foto: generateCandidateAvatar('Modelo Teste', 'm'),
            vice: {
                nome: 'Modelo Teste 29',
                foto: generateCandidateAvatar('Modelo Teste', 'f')
            }
        },
        {
            numero: '15',
            nome: 'Modelo Teste 30',
            partido: 'Partido Teste 03',
            foto: generateCandidateAvatar('Modelo Teste', 'm'),
            vice: {
                nome: 'Modelo Teste 31',
                foto: generateCandidateAvatar('Modelo Teste', 'f')
            }
        },
        {
            numero: '45',
            nome: 'Modelo Teste 32',
            partido: 'Partido Teste 04',
            foto: generateCandidateAvatar('Modelo Teste', 'm'),
            vice: {
                nome: 'Modelo Teste 33',
                foto: generateCandidateAvatar('Modelo Teste', 'f')
            }
        }
    ],

    // 6. PRESIDENTE DA REPÚBLICA (2 dígitos)
    'presidente': [
        {
            numero: '13',
            nome: 'Modelo Teste 34',
            partido: 'Partido Teste 05',
            foto: generateCandidateAvatar('Modelo Teste', 'm'),
            vice: {
                nome: 'Modelo Teste 35',
                foto: generateCandidateAvatar('Modelo Teste', 'f')
            }
        },
        {
            numero: '22',
            nome: 'Modelo Teste 36',
            partido: 'Partido Teste 01',
            foto: generateCandidateAvatar('Modelo Teste', 'm'),
            vice: {
                nome: 'Modelo Teste 37',
                foto: generateCandidateAvatar('Modelo Teste', 'm')
            }
        },
        {
            numero: '15',
            nome: 'Modelo Teste 38',
            partido: 'Partido Teste 02',
            foto: generateCandidateAvatar('Modelo Teste', 'f'),
            vice: {
                nome: 'Modelo Teste 39',
                foto: generateCandidateAvatar('Modelo Teste', 'm')
            }
        },
        {
            numero: '45',
            nome: 'Modelo Teste 40',
            partido: 'Partido Teste 03',
            foto: generateCandidateAvatar('Modelo Teste', 'm'),
            vice: {
                nome: 'Modelo Teste 41',
                foto: generateCandidateAvatar('Modelo Teste', 'f')
            }
        }
    ]
};

const FALLBACK_CANDIDATE_NUMBERS = {
    deputado_federal: ['9101', '9102', '9201', '9202', '9203', '9301', '9302', '9303', '9401', '9402', '9501', '9502'],
    deputado_estadual: ['91001', '91002', '91003', '92001', '92002', '93001', '93002', '94001', '94002', '94003', '95001', '95002', '95003'],
    senador: ['911', '921', '931', '941', '951'],
    governador: ['91', '92', '93', '94', '95'],
    presidente: ['91', '92', '93', '94', '95']
};

function ensureFallbackCandidates(database) {
    Object.entries(FALLBACK_CANDIDATE_NUMBERS).forEach(([cargo, numbers]) => {
        numbers.forEach((numero, index) => {
            let candidate = database[cargo][index];
            if (!candidate) {
                candidate = {
                    numero,
                    nome: '',
                    partido: '',
                    foto: generateCandidateAvatar('Modelo Teste')
                };
                if (cargo === 'senador') {
                    candidate.suplente1 = { nome: '', foto: generateCandidateAvatar('Modelo Teste') };
                    candidate.suplente2 = { nome: '', foto: generateCandidateAvatar('Modelo Teste') };
                } else if (cargo === 'governador' || cargo === 'presidente') {
                    candidate.vice = { nome: '', foto: generateCandidateAvatar('Modelo Teste') };
                }
                database[cargo].push(candidate);
            }
            candidate.numero = numero;
            if (cargo === 'deputado_federal' || cargo === 'deputado_estadual') {
                candidate.legendaNumero = numero.substring(0, 2);
            }
        });
    });
}

ensureFallbackCandidates(CANDIDATOS_DATABASE);

function applyTestModelNames(database) {
    let modelNumber = 0;
    Object.values(database).forEach(candidates => {
        candidates.forEach(candidate => {
            modelNumber++;
            const suffix = String(modelNumber).padStart(2, '0');
            candidate.nome = `Modelo Teste ${suffix}`;
            candidate.partido = `Partido Teste ${String((modelNumber % 5) + 1).padStart(2, '0')}`;
            candidate.foto = generateCandidateAvatar(candidate.nome);

            [['vice', 'Vice'], ['suplente1', 'Suplente 1'], ['suplente2', 'Suplente 2']].forEach(([key, label]) => {
                if (candidate[key]) {
                    candidate[key].nome = `Modelo Teste ${suffix} - ${label}`;
                    candidate[key].foto = generateCandidateAvatar(candidate[key].nome);
                }
            });
        });
    });
}

applyTestModelNames(CANDIDATOS_DATABASE);

// Analisador do CSV de candidatos de teste
function parseCandidatosCSV(csvText) {
    if (!csvText) return;
    const lines = csvText.trim().split(/\r?\n/);
    if (lines.length <= 1) return;

    // Reinicia ou limpa as listas para carregar do CSV
    const newDb = {
        'deputado_federal': [],
        'deputado_estadual': [],
        'senador': [],
        'governador': [],
        'presidente': []
    };

    // Pula o cabeçalho (cargo,partido,nome,numero,foto)
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        // Parse simples respeitando vírgulas
        const cols = [];
        let cur = '';
        let inQuotes = false;
        for (let c = 0; c < line.length; c++) {
            const char = line[c];
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                cols.push(cur.trim());
                cur = '';
            } else {
                cur += char;
            }
        }
        cols.push(cur.trim());

        const [cargoRaw, partido, nome, numero, fotoUrl] = cols;
        if (!cargoRaw || !numero || !nome) continue;

        const cargo = cargoRaw.toLowerCase();
        const fotoFinal = (fotoUrl && fotoUrl.length > 5) ? fotoUrl : generateCandidateAvatar(nome);

        const candObj = {
            numero: String(numero).trim(),
            nome: nome.toUpperCase().trim(),
            partido: partido ? partido.trim() : 'PARTIDO INDEPENDENTE',
            foto: fotoFinal
        };

        if (cargo === 'deputado_federal') {
            candObj.legendaNumero = candObj.numero.substring(0, 2);
            newDb['deputado_federal'].push(candObj);
        } else if (cargo === 'deputado_estadual' || cargo === 'deputado_distrital') {
            candObj.legendaNumero = candObj.numero.substring(0, 2);
            newDb['deputado_estadual'].push(candObj);
        } else if (cargo === 'senador' || cargo === 'senador_1' || cargo === 'senador_2') {
            candObj.suplente1 = {
                nome: '1º SUPLENTE DE ' + candObj.nome.split(' ')[0],
                foto: generateCandidateAvatar('1º Suplente')
            };
            candObj.suplente2 = {
                nome: '2º SUPLENTE DE ' + candObj.nome.split(' ')[0],
                foto: generateCandidateAvatar('2º Suplente')
            };
            newDb['senador'].push(candObj);
        } else if (cargo === 'governador') {
            candObj.vice = {
                nome: 'VICE-GOVERNADOR(A)',
                foto: generateCandidateAvatar('Vice Governador')
            };
            newDb['governador'].push(candObj);
        } else if (cargo === 'presidente') {
            candObj.vice = {
                nome: 'VICE-PRESIDENTE DA REPÚBLICA',
                foto: generateCandidateAvatar('Vice Presidente')
            };
            newDb['presidente'].push(candObj);
        }
    }

    // Mescla / atualiza no banco global
    Object.keys(newDb).forEach(k => {
        if (newDb[k].length > 0) {
            CANDIDATOS_DATABASE[k] = newDb[k];
        }
    });
    applyTestModelNames(CANDIDATOS_DATABASE);

    console.log('[Carregamento CSV] Candidatos carregados da pasta carregamento com sucesso!', CANDIDATOS_DATABASE);
}

// Carrega automaticamente o arquivo CSV da pasta carregamento se disponível
async function autoLoadCandidatosCSV() {
    try {
        const res = await fetch('carregamento/candidatos.csv');
        if (res.ok) {
            const csvData = await res.text();
            parseCandidatosCSV(csvData);
        }
    } catch (e) {
        console.log('[Carregamento] CSV carregado com dados locais integrados.');
    }
}
autoLoadCandidatosCSV();

// Funções auxiliares de busca
function findCandidato(cargoId, numero) {
    if (!numero) return null;
    const normalizedNumber = String(numero).replace(/\D/g, '');
    if (!normalizedNumber) return null;
    
    // Tratamento para senador (1ª e 2ª vaga usam a mesma lista)
    const dbKey = (cargoId === 'senador_1' || cargoId === 'senador_2') ? 'senador' : cargoId;
    const lista = CANDIDATOS_DATABASE[dbKey] || [];
    
    return lista.find(c => String(c.numero).replace(/\D/g, '') === normalizedNumber) || null;
}

function findLegenda(cargoId, numeroLegenda) {
    const cargo = CARGOS_ELEICAO_2026.find(c => c.id === cargoId);
    if (!cargo || !cargo.isProporcional) return null;
    
    return PARTIDOS[numeroLegenda] || null;
}

window.CARGOS_ELEICAO_2026 = CARGOS_ELEICAO_2026;
window.PARTIDOS = PARTIDOS;
window.CANDIDATOS_DATABASE = CANDIDATOS_DATABASE;
window.parseCandidatosCSV = parseCandidatosCSV;
window.findCandidato = findCandidato;
window.findLegenda = findLegenda;

