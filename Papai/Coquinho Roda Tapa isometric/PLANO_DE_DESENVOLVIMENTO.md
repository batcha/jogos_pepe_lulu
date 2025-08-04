# Plano de Desenvolvimento — Coquinho Roda Tapa Isometric

Checklist detalhado para acompanhar o progresso do desenvolvimento do jogo. Marque cada item conforme for concluído.

---

## 1. Estrutura Inicial do Projeto
- [x] Criar pastas principais (`/assets/`, `/src/`, `/editor/`, `/docs/`)
- [x] Configurar ambiente de desenvolvimento (VS Code, Node.js, servidor local)
- [x] Definir MVP (fase jogável, personagem, inimigo, pontuação)
- [x] Criar arquivo de configuração inicial do projeto (`index.html`, `main.js`)
- [x] Adicionar README com instruções básicas

## 2. Editor de Fases
- [x] Escolher biblioteca para renderização isométrica (Phaser, Pixi.js)
- [x] Implementar grid isométrico básico
- [ ] Adicionar ferramenta para desenhar tiles
- [ ] Adicionar ferramenta para posicionar plataformas
- [ ] Adicionar ferramenta para posicionar perigos
- [ ] Adicionar ferramenta para posicionar inimigos
- [ ] Adicionar ferramenta para posicionar segredos
- [ ] Permitir exportação/importação de mapas em JSON
- [ ] Integrar IA para sugestões de layout
- [ ] Implementar botão de teste rápido da fase criada

## 3. Personagem Principal
- [ ] Criar sprites básicos do personagem
- [ ] Implementar animação idle
- [ ] Implementar animação walk
- [ ] Implementar animação run
- [ ] Implementar animação attack (giro/tapa)
- [ ] Implementar animação special attack
- [ ] Implementar animação hitted
- [ ] Implementar animação death
- [ ] Implementar animação jump
- [ ] Adicionar sistema de energia (barra visual)
- [ ] Implementar ataque principal (giro/tapa estilo Crash Bandicoot)
- [ ] Adicionar powerup de velocidade
- [ ] Adicionar powerup de escudo
- [ ] Adicionar powerup de ataque especial
- [ ] Adicionar powerup de salto duplo
- [ ] Adicionar powerup de magnetismo
- [ ] Integrar IA para geração de sprites/animações

## 4. Sistema Rogue Lite
- [ ] Estruturar sistema de habilidades
- [ ] Implementar escolha de habilidades ao subir de nível
- [ ] Criar tela/modal de escolha de habilidades
- [ ] Integrar IA para sugerir habilidades
- [ ] Implementar lógica de progressão por nível
- [ ] Implementar desafios secretos para subir de nível

## 5. Inimigos e Chefes
- [ ] Criar sprites básicos de inimigos
- [ ] Implementar animação idle de inimigos
- [ ] Implementar animação walk de inimigos
- [ ] Implementar animação run de inimigos
- [ ] Implementar animação attack de inimigos
- [ ] Implementar animação hitted de inimigos
- [ ] Implementar animação death de inimigos
- [ ] Implementar animação jump de inimigos (para alguns)
- [ ] Implementar lógica de patrulha
- [ ] Implementar lógica de perseguição
- [ ] Implementar lógica de fuga
- [ ] Implementar lógica de ataque à distância
- [ ] Criar sprites de chefes
- [ ] Implementar animações de chefes (attack, walk, idle, taunt, hitted, jump, death)
- [ ] Implementar movimentos especiais de chefes
- [ ] Integrar IA para geração de inimigos, sprites e padrões de ataque

## 6. Cenários, Perigos e Plataformas
- [ ] Implementar tiles básicos (chão, plataforma, perigo)
- [ ] Adicionar espinhos
- [ ] Adicionar água
- [ ] Adicionar buracos
- [ ] Adicionar lava
- [ ] Adicionar vento
- [ ] Adicionar lasers
- [ ] Adicionar blocos móveis
- [ ] Adicionar plantas carnívoras
- [ ] Adicionar zonas de teleporte
- [ ] Implementar plataformas elevadas
- [ ] Implementar plataformas móveis
- [ ] Implementar blocos que caem
- [ ] Adicionar segredos
- [ ] Adicionar triggers para fases secretas
- [ ] Integrar IA para sugerir perigos, segredos e puzzles

## 7. Sistema de Ranking, Pontuação e Estatísticas
- [ ] Implementar sistema de pontuação por tempo
- [ ] Implementar sistema de pontuação por coletáveis
- [ ] Implementar sistema de pontuação por itens
- [ ] Implementar sistema de pontuação por vida restante
- [ ] Implementar sistema de pontuação por segredos
- [ ] Implementar multiplicadores por dificuldade
- [ ] Implementar multiplicadores por segredos encontrados
- [ ] Integrar Firebase para ranking
- [ ] Integrar Firebase para estatísticas
- [ ] Integrar IA para análise de dados e balanceamento

## 8. Vidas/Energia
- [ ] Implementar barra de energia
- [ ] Implementar powerups para recuperar energia
- [ ] Ajustar energia conforme dificuldade

## 9. Cutscenes
- [ ] Implementar cutscene estática antes de cada fase
- [ ] Implementar cutscene animada antes de cada fase

## 10. Tela de Fim de Jogo
- [ ] Implementar tela estática de fim de jogo
- [ ] Implementar tela animada de fim de jogo
- [ ] Mostrar ranking, estatísticas e segredos encontrados

## 11. Dificuldade
- [ ] Implementar seleção de dificuldade (fácil, médio, difícil)
- [ ] Ajustar energia do personagem conforme dificuldade
- [ ] Ajustar energia dos inimigos conforme dificuldade
- [ ] Ajustar velocidade dos ataques conforme dificuldade
- [ ] Ajustar quantidade de inimigos conforme dificuldade
- [ ] Ajustar quantidade de powerups conforme dificuldade
- [ ] Ajustar tempo limite conforme dificuldade
- [ ] Adicionar inimigos com habilidades especiais
- [ ] Adicionar chefes com mais fases
- [ ] Adicionar menos checkpoints conforme dificuldade

## 12. Firebase
- [ ] Implementar ranking no Firebase
- [ ] Implementar estatísticas de jogadores no Firebase
- [ ] Implementar número de jogadas no Firebase
- [ ] Implementar tempo total jogado no Firebase
- [ ] Implementar pontos por jogador no Firebase

## 13. Controles
- [ ] Implementar suporte ao teclado para movimentação, ataques e ações
- [ ] Implementar suporte a joystick/gamepad (USB/Bluetooth)
- [ ] Testar compatibilidade dos controles em diferentes navegadores
- [ ] Permitir configuração personalizada dos botões

---

> Atualize este arquivo conforme avança no desenvolvimento. Consulte os guias em `/docs/` para detalhes de cada sistema.
