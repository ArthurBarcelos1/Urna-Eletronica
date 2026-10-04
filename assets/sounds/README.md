# Sons

O arquivo `js/audio.js` reproduz os arquivos desta pasta:

- `confirm.mpeg`: usado ao pressionar teclas e confirmar votos, com volume de reprodução em 50%.
- `finish.mpeg`: usado ao finalizar a votação.

Se um arquivo não puder ser reproduzido, o sistema usa sons sintetizados pela Web Audio API como fallback. Avisos e erros também são sintetizados. A leitura de cargos e candidatos usa a síntese de voz do navegador.
