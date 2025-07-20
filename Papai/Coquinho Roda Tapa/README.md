# 🥥 Coquinho Roda Tapa

Um jogo de plataforma brasileiro divertido e cheio de ação, onde você controla um coquinho que usa o famoso "roda tapa" para derrotar turistas!

## 📋 Sobre o Jogo

**Coquinho Roda Tapa** é um jogo de plataforma 2D desenvolvido em HTML5 Canvas com JavaScript. O jogador controla um coquinho verde que deve derrotar todos os turistas no nível usando seu ataque especial "roda tapa" (um movimento giratório) e depois alcançar o objetivo.

## 🎮 Como Jogar

### Controles Desktop
- **Setas do Teclado**: Mover para esquerda/direita e pular
- **Tecla X**: Executar o ataque "Roda Tapa"

### Controles Mobile
- **Botões na Tela**: Use os botões de controle que aparecem automaticamente em dispositivos móveis
  - ← → : Mover para esquerda/direita
  - ↑ : Pular
  - **ATAQUE**: Executar o "Roda Tapa"

## 🎯 Objetivo

1. **Derrote todos os turistas** (representados pela letra 'T') usando o ataque roda tapa
2. **Colete o caju** (representado pela letra 'C') para ganhar um power-up que aumenta o poder do seu ataque
3. **Alcance o objetivo** (representado pela letra 'G') após derrotar todos os turistas para vencer

## 🏆 Sistema de Pontuação e Recordes

### Pontuação
- **100 pontos** por cada turista derrotado
- **Bônus de tempo**: 10 pontos por segundo restante (máximo de 60 segundos)
- A pontuação final é mostrada na tela de vitória

### Sistema de Recordes (Highscore)
- **Top 10**: O jogo mantém um ranking dos 10 melhores scores
- **Iniciais do Jogador**: Ao conseguir um score alto, digite suas 3 iniciais
- **Armazenamento Local**: Os recordes ficam salvos no seu computador
- **Medalhas**: Top 3 recebe medalhas especiais (🥇🥈🥉)
- **Visualização**: Acesse os recordes através do botão "Ver Recordes"

## 🌟 Características do Jogo

### Personagens e Objetos
- **Coquinho (Jogador)**: Personagem verde que pode pular, correr e atacar
- **Turistas (Inimigos)**: Personagens amarelos que se movem horizontalmente
- **Caju (Power-up)**: Fruta vermelha que aumenta temporariamente o poder de ataque
- **Plataformas**: Blocos amarelos com grama verde por onde o jogador pode andar
- **Objetivo**: Bandeira verde que marca o fim do nível

### Mecânicas Especiais
- **Roda Tapa**: Ataque giratório com animação das mãos
- **Power-up do Caju**: Aumenta o raio e poder do ataque por 5 segundos
- **Física**: Gravidade, colisões com plataformas e bordas da tela
- **Cronômetro**: Contador de tempo para bônus de pontuação

### Design Visual
- **Tema Brasileiro**: Cores tropicais e elementos brasileiros
- **Pixel Art Style**: Visual retrô com fonte "Press Start 2P"
- **Interface Responsiva**: Adapta-se a dispositivos móveis e desktop
- **Animações**: Movimento dos inimigos, ataque do jogador e efeitos visuais

## 🛠️ Tecnologias Utilizadas

- **HTML5**: Estrutura da página
- **CSS3**: Estilos e layout responsivo
- **JavaScript**: Lógica do jogo, física e animações
- **Canvas API**: Renderização dos gráficos 2D
- **Tailwind CSS**: Framework CSS para estilização rápida
- **Google Fonts**: Fonte "Press Start 2P" para tema retrô

## 📱 Compatibilidade

- ✅ **Desktop**: Windows, Mac, Linux (todos os navegadores modernos)
- ✅ **Mobile**: Android e iOS (Safari, Chrome, Firefox)
- ✅ **Tablets**: Suporte completo com controles touch

## 🎨 Paleta de Cores

- **Fundo**: Verde tropical (#00b894)
- **Céu do jogo**: Azul céu (#87CEEB)
- **Coquinho**: Verde (#2ecc71) / Dourado quando com power-up (#f1c40f)
- **Turistas**: Amarelo (#f1c40f) com roupa azul (#3498db)
- **Plataformas**: Laranja (#f39c12) com grama (#27ae60)
- **Caju**: Vermelho (#e74c3c)

## 🚀 Como Executar

1. Faça o download do arquivo `index.html`
2. Abra o arquivo em qualquer navegador web moderno
3. O jogo iniciará automaticamente
4. Divirta-se jogando!

## 🔄 Funcionalidades Implementadas

- [x] Movimento do jogador (andar e pular)
- [x] Sistema de física (gravidade e colisões)
- [x] Ataque "roda tapa" com animação
- [x] Inimigos que se movem horizontalmente
- [x] Sistema de power-up (caju)
- [x] Cronômetro e sistema de pontuação
- [x] Tela de vitória
- [x] Controles para mobile
- [x] Design responsivo
- [x] Botão de reiniciar
- [x] **Sistema de Highscore com Top 10**
- [x] **Armazenamento local de recordes**
- [x] **Interface para inserção de iniciais**
- [x] **Modal de visualização de recordes**

## 📄 Estrutura do Código

O jogo está organizado em:
- **Classes**: Player, Enemy, PowerUp, Platform, Goal
- **Sistema de física**: Gravidade, colisões e movimento
- **Game Loop**: Atualização e renderização contínua
- **Controles**: Eventos de teclado e touch
- **UI**: Interface de usuário e elementos informativos
- **Sistema de Highscore**: Armazenamento local, ranking e interface

---

*Desenvolvido com 💚 para celebrar a cultura brasileira através dos jogos!*
