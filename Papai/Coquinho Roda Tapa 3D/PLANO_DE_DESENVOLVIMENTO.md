
# Plano de Desenvolvimento — Coquinho Roda Tapa 3D Lowpoly

Checklist detalhado para acompanhar o progresso do desenvolvimento do jogo 3D lowpoly, com engine simples e fácil manutenção. Marque cada item conforme for concluído.

---


## 1. Estrutura Inicial do Projeto
- [x] Criar pastas principais (`/assets/`, `/src/`, `/docs/`)
- [x] Escolher engine 3D simples (Babylon.js, Three.js ou Godot)
- [x] Configurar ambiente de desenvolvimento (VS Code, engine escolhida)
- [x] Definir MVP (fase jogável, personagem, inimigo, pontuação)
- [x] Criar arquivo de configuração inicial do projeto (`index.html`, `main.js` ou projeto Godot)
- [x] Adicionar README com instruções básicas


## 2. Criação de Fases 3D
- [x] Definir ferramenta de criação de fases (editor visual da engine)
- [ ] Criar modelos lowpoly para chão, plataformas, perigos, inimigos, segredos
- [ ] Criar cenas/fases no editor visual
- [ ] Exportar fases para o formato da engine
- [ ] Implementar importação/carregamento das fases no jogo
- [ ] Testar carregamento e renderização das fases 3D


## 3. Personagem Principal 3D
- [ ] Criar modelo lowpoly do personagem
- [ ] Implementar animações básicas (idle, walk, run, attack, jump, death)
- [ ] Adicionar sistema de energia (barra visual)
- [ ] Implementar ataque principal (giro/tapa estilo Crash Bandicoot)
- [ ] Adicionar powerups (velocidade, escudo, ataque especial, salto duplo, magnetismo)


## 4. Sistema Rogue Lite
- [ ] Estruturar sistema de habilidades
- [ ] Implementar escolha de habilidades ao subir de nível
- [ ] Criar tela/modal de escolha de habilidades
- [ ] Integrar IA para sugerir habilidades
- [ ] Implementar lógica de progressão por nível
- [ ] Implementar desafios secretos para subir de nível


## 5. Inimigos e Chefes 3D
- [ ] Criar modelos lowpoly de inimigos
- [ ] Implementar animações básicas de inimigos (idle, walk, run, attack, death)
- [ ] Implementar lógica de patrulha, perseguição, fuga, ataque à distância
- [ ] Criar modelos de chefes
- [ ] Implementar animações de chefes (attack, walk, idle, taunt, hitted, jump, death)
- [ ] Implementar movimentos especiais de chefes


## 6. Cenários, Perigos e Plataformas 3D
- [ ] Implementar modelos lowpoly para chão, plataformas, perigos
- [ ] Adicionar espinhos, água, buracos, lava, vento, lasers, blocos móveis, plantas carnívoras, zonas de teleporte
- [ ] Implementar plataformas elevadas, móveis, blocos que caem
- [ ] Adicionar segredos e triggers para fases secretas


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
