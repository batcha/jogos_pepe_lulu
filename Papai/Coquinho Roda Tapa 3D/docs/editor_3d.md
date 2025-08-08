# Guia do Editor 3D de Fases — Coquinho Roda Tapa

Este editor permite criar fases 3D de forma visual e simples, diretamente no navegador usando Babylon.js.

## Funcionalidades do Editor

- **Painel Lateral**
  - Botões para adicionar elementos básicos: cubo, esfera, plano.
  - Botão para importar assets 3D (.glb/.gltf).
  - Lista de objetos na cena, com seleção.
  - Propriedades do objeto selecionado (posição, escala, rotação, tipo).
  - Marcação de objetos (ex: móvel, perigo, plataforma, decorativo).
  - Botão para exportar a cena para JSON.

- **Seleção e Manipulação**
  - Clique para selecionar objetos.
  - Arrastar para mover objetos.
  - Controles para aumentar/diminuir escala.
  - Rotação dos objetos.
  - Marcação de propriedades especiais (móvel, trigger, etc).

- **Importação de Assets**
  - Importar modelos 3D (.glb/.gltf) para usar como elementos da fase.

- **Exportação**
  - Exportar toda a cena (objetos, propriedades, marcações) para JSON.
  - JSON pode ser carregado no jogo para montar a fase.

## Fluxo de Uso

1. Abra o editor no navegador (`index.html`).
2. Use o painel lateral para adicionar elementos básicos ou importar assets.
3. Selecione e mova objetos na cena.
4. Ajuste escala, rotação e propriedades especiais.
5. Marque objetos conforme função (móvel, perigo, plataforma, etc).
6. Exporte a fase para JSON.
7. Importe o JSON no jogo para jogar a fase criada.

## Recomendações de Simplicidade
- Interface minimalista, apenas o essencial.
- Elementos básicos sempre disponíveis.
- Importação/exportação fácil (JSON).
- Marcação de objetos por função para lógica do jogo.
- Código modular para fácil manutenção.

---
Se quiser adicionar mais funcionalidades, basta evoluir o painel lateral e lógica de manipulação dos objetos.
