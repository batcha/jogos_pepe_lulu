# 🐹 Hamo Heroes - Aventura do Hamster Gigante

Um épico jogo de plataforma onde você controla Hamo, um hamster gigante humanoide que precisa escapar dos caçadores em um vasto mundo aberto!

## 🎮 Como Jogar

### Controles
- **← →** (Setas Esquerda/Direita): Mover Hamo
- **↑** (Seta para Cima): Pulo normal
- **ESPAÇO**: Super pulo/ataque - destrói caçadores quando você cai sobre eles!
- **R**: Reiniciar o jogo (quando estiver em Game Over)

### Objetivo
- Explore um mundo 3x maior com diferentes biomas e desafios!
- Use o super pulo para destruir caçadores e ganhar pontos extras!
- Colete power-ups espalhados pelo mundo
- Descubra plataformas secretas nas alturas
- Sobreviva o máximo de tempo possível!

### Power-ups
- 💖 **Coração Rosa**: Ganha uma vida extra
- 💰 **Moeda Dourada**: +100 pontos
- ⚡ **Raio Verde**: Velocidade extra por 5 segundos
- 🛡️ **Escudo Azul**: Proteção contra dano por 6 segundos
- 🧲 **Ímã Rosa**: Atrai power-ups próximos por 4 segundos

### Inimigos
- 🎯 **Caçadores Caminhantes** (Marrom): Seguem Hamo horizontalmente e pulam quando necessário
- 🦘 **Caçadores Saltadores** (Marrom Escuro): Pulam frequentemente para alcançar plataformas e são mais agressivos
- 🤖 **Caçadores Inteligentes** (Vermelho Escuro): Aparecem com score alto (2000+), usam pathfinding avançado e são muito perigosos! Têm capacete militar com luz vermelha.

### Sistema de Pontuação e Recordes
- Você ganha pontos automaticamente por sobreviver (+1 por frame)
- Power-ups de moeda dão +100 pontos extras
- **Destruir caçadores** com super pulo dá +200 pontos! 🎯
- 🏆 **Sistema de HighScore**: Sua melhor pontuação é salva automaticamente no computador
- **Novo Recorde**: Uma mensagem especial aparece quando você bate seu próprio recorde!
- Quanto mais tempo sobreviver, mais difícil o jogo fica!
- 💀 **Animação de Morte**: Quando Hamo morre, ele roda 90 graus dramaticamente!

## 🚀 Como Executar

1. Abra o arquivo `index.html` em seu navegador
2. Use as setas do teclado para controlar Hamo
3. Divirta-se escapando dos caçadores!

## � Sistema de Recordes

- **Armazenamento Local**: Seu recorde é salvo automaticamente no seu computador
- **Persistente**: O recorde permanece mesmo após fechar o navegador
- **Exibição em Tempo Real**: Veja seu recorde atual no topo da tela durante o jogo
- **Animação Especial**: Quando você bate seu recorde, uma mensagem dourada animada aparece!
- **Identificador Único**: Os dados são salvos como "hamoHeroes_highScore" no localStorage

## �🎨 Características do Jogo

- **🌍 Mundo Gigante**: Explore um mundo 3000x1400 pixels com câmera que segue o Hamo
- **🗺️ Mini-mapa**: Navegue pelo mundo com um mini-mapa no canto superior direito
- **🏰 Biomas Variados**: 
  - Área inicial com plataformas básicas
  - Torres altas com desafios verticais
  - Castelo medieval com muralhas
  - Plataformas flutuantes mágicas
  - Áreas secretas nas alturas
- **⚔️ Sistema de Combate**: Super pulo para esmagar inimigos
- **🎯 Tipos de Plataformas**:
  - 🟤 **Normais**: Madeira básica
  - 🌉 **Pontes**: Plataformas suspensas
  - 🏰 **Castelo**: Plataformas de pedra
  - 🗼 **Torres**: Estruturas altas com janelas
  - 💜 **Flutuantes**: Plataformas mágicas
  - 💚 **Secretas**: Plataformas especiais brilhantes
  - 🔴 **Espinhos**: Obstáculos perigosos (apenas visuais por enquanto)
  - 🩷 **Móveis**: Plataformas que se movem (estáticas por enquanto)
- **🌤️ Ambiente Dinâmico**: Céu com gradiente, nuvens e montanhas de fundo
- **🤖 IA Avançada**: Caçadores que realmente perseguem o jogador
- **✨ Efeitos Visuais**: Sistema de partículas e efeitos especiais

## 🎯 Dicas de Estratégia

1. **🗺️ Use o mini-mapa** - Navegue pelo mundo gigante e encontre áreas interessantes
2. **⚔️ Use o super pulo ofensivamente** - Destrua caçadores caindo sobre eles para pontos extras!
3. **🕐 Gerencie seu cooldown** - O super pulo tem 1 segundo de recarga, use com sabedoria
4. **🏔️ Explore verticalmente** - Use torres e plataformas altas para vantagem tática
5. **💚 Procure por plataformas secretas** - Elas brilham em verde e podem ter recompensas
6. **🏰 Use o castelo como refúgio** - Estruturas complexas oferecem mais opções de fuga
7. **💜 Experimente plataformas flutuantes** - Elas podem levar a áreas especiais
8. **👀 Observe os padrões** dos diferentes tipos de caçadores:
   - Caminhantes são alvos fáceis para ataques aéreos
   - Saltadores são mais imprevisíveis
   - Inteligentes (score 2000+) são extremamente perigosos!
9. **🏃 Mantenha-se em movimento** - O mundo é grande, use isso a seu favor!
10. **⚡ Combine ataques com exploração** - Nem sempre lutar é a melhor opção

Explore, lute e sobreviva no vasto mundo de Hamo Heroes! 🐹🌍⚔️

## 🎨 Sistema de Sprites Customizadas

O jogo suporta sprites customizadas para o personagem! Você pode substituir o desenho padrão do Hamo pelas suas próprias criações.

### 📋 Sprites Necessárias:
- **hamo_idle.png** (60x80px) - Parado
- **hamo_running.png** (60x80px) - Correndo  
- **hamo_jumping.png** (60x80px) - Pulando (subindo)
- **hamo_falling.png** (60x80px) - Caindo (descendo)
- **hamo_attacking.png** (60x80px) - Atacando (super pulo)
- **hamo_dying.png** (60x80px) - Morrendo

### 🎯 Como Usar:
1. Crie sprites PNG transparentes (60x80 pixels)
2. Sprites devem estar voltadas para a **DIREITA**
3. Coloque na pasta `sprites/` com os nomes exatos acima
4. O jogo detecta automaticamente e usa suas sprites!

**Veja `sprites/README.md` para guia completo de criação!**

---
