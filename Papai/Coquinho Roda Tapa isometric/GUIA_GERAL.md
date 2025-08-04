# Guia de Criação: Jogo Isométrico Coquinho Roda Tapa

Este guia apresenta as principais etapas e ideias para criar um jogo isométrico em JavaScript, com as características desejadas. O jogo será hospedado no navegador (Firebase Hosting) e usará Firebase para rankings e estatísticas.

O jogo poderá ser jogado com teclado ou com joystick (gamepad USB/Bluetooth), permitindo maior acessibilidade e experiência para diferentes jogadores.

## Estrutura Recomendada de Pastas
- `/assets/` — sprites, sons, tilesets
- `/src/` — scripts JS principais
- `/editor/` — editor de fases
- `/docs/` — documentação e guias

## 1. Editor de Fases
- Ferramenta visual para desenhar mapas isométricos, posicionar plataformas, perigos, inimigos e segredos.
- Exportação/importação de mapas em JSON.
- Interface para adicionar triggers de segredos e powerups.

## 2. Personagem Principal
- Animações: idle, walk, run, attack (giro/tapa estilo Crash Bandicoot), special attack, hitted, death, jump.
- Sistema de energia (vida), com barra visual.
- Powerups: aumento de velocidade, escudo temporário, ataque especial, salto duplo, magnetismo para coletáveis.

## 3. Sistema Rogue Lite
- A cada subida de nível, o personagem pode escolher entre novas habilidades (ex: ataque mais forte, pulo extra, resistência).
- Ideias para subir de nível: coletar pontos, derrotar chefes, completar desafios secretos, encontrar itens raros.

## 4. Inimigos
- Tipos variados, cada um com animações: idle, walk, run, attack, hitted, death, jump (para alguns).
- Movimentos: patrulha, perseguição, fuga, ataque à distância.
- Powerups podem afetar inimigos (ex: congelar, desacelerar).

## 5. Chefes
- Animações: attack, walk, idle, taunt, hitted, jump, death.
- Movimentos especiais: ataques em área, invocação de minions, mudança de fase.

## 6. Cenários e Perigos
- Espinhos, água (personagem não sabe nadar), buracos, plataformas móveis, lava, vento forte, áreas escorregadias, zonas de teleporte, blocos que caem, lasers, plantas carnívoras.
- Plataformas elevadas acessíveis por salto ou elevadores.

## 7. Segredos e Fases Secretas
- Portas ocultas, puzzles, áreas acessíveis apenas com powerup, coletar todos os itens de uma fase, derrotar todos inimigos.
- Pontuação extra por descobrir segredos.

## 8. Sistema de Ranking
- Top 10 global, nome com 3 caracteres.
- Firebase para armazenar ranking e estatísticas (jogadas, tempo, pontos).

## 9. Pontuação
- Tempo para finalizar, coletáveis, itens, vida restante.
- Multiplicadores por dificuldade e segredos encontrados.

## 10. Vidas/Energia
- Barra de energia, powerups para recuperar.
- Dificuldade afeta quantidade de energia disponível.

## 11. Cutscenes
- Opção de cutscene antes de cada fase (estática ou animada).

## 12. Tela de Fim de Jogo
- Tela estática ou animada, mostrando ranking, estatísticas e segredos encontrados.

## 13. Dificuldade
- 3 níveis: fácil, médio, difícil.
- Diferenças: energia do personagem, energia dos inimigos, velocidade dos ataques, quantidade de inimigos, menos powerups, tempo limite.
- Ideias extras: inimigos com habilidades especiais, chefes com mais fases, menos checkpoints.

## 14. Firebase
- Ranking, estatísticas de jogadores, número de jogadas, tempo total jogado, pontos por jogador.

---

Consulte os guias específicos em `/docs/` para detalhes de implementação de cada sistema.
