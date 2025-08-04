# Guia: Editor de Fases Isométrico

## Visão Geral
O editor de fases é a ferramenta central para criar, modificar e testar mapas isométricos. Ele deve ser intuitivo, visual e permitir integração com IA para geração ou sugestão de mapas.

## Funcionalidades
- **Desenho de Tiles:** Ferramenta para pintar tiles isométricos, com seleção de tipo (chão, plataforma, perigo, água, etc).
- **Posicionamento de Objetos:** Adicionar inimigos, powerups, segredos, triggers e plataformas elevadas.
- **Configuração de Perigos:** Espinhos, buracos, lava, água, lasers, blocos móveis, etc.
- **Exportação/Importação:** Mapas em JSON, integração com IA para sugerir ou gerar mapas.
- **Testes Rápidos:** Botão para jogar a fase imediatamente.

## Ideias de Implementação
- Use bibliotecas como Phaser ou Pixi.js para renderização isométrica.
- Para IA, integre APIs como OpenAI ou modelos locais para sugerir layouts, distribuir inimigos ou criar desafios.
- Permita que o usuário peça à IA para criar fases com base em temas, dificuldade ou objetivos.
- Salve mapas no Firebase para fácil compartilhamento.

## Exemplos de Uso de IA
- "Gerar fase fácil com 2 plataformas elevadas e 3 tipos de inimigos."
- "Adicionar segredos e perigos em locais estratégicos."
- "Balancear a distribuição de powerups conforme dificuldade."

## Referências
- [Phaser Isometric Plugin](https://github.com/lewster32/phaser-plugin-isometric)
- [Pixi.js](https://pixijs.com/)
- [OpenAI API](https://platform.openai.com/docs/guides/gpt)
