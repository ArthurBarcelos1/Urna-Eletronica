# Pasta de Sons Oficiais da Urna Eletrônica 2026

Os sons da urna são sintetizados em alta fidelidade com latência zero via Web Audio API pelo arquivo `js/audio.js`, que reproduz:

1. **Bip de Digitação (`bip_tecla`)**: Bip curto de ~1050 Hz (50ms) ao pressionar os números, branco ou corrige.
2. **Bip de Confirmação Intermediária (`bip_confirma`)**: Bip duplo com harmônico de 1250 Hz e 1875 Hz emitido ao confirmar cada cargo.
3. **Som de Aviso/Erro (`bip_erro`)**: Bip grave de 320 Hz ao tentar confirmar número incompleto ou ação inválida.
4. **O Lendário PILILI (`pilili_oficial`)**: A sequência melódica oficial do Tribunal Superior Eleitoral (TSE) que toca ao finalizar o último voto (Presidente), com arpeggio ascendente (700Hz -> 880Hz -> 1050Hz) seguido do tom longo e sustentado de 1400Hz.
5. **Síntese de Voz / Acessibilidade**: Leitura por voz dos nomes de cargos e candidatos para acessibilidade de eleitores com deficiência visual.
