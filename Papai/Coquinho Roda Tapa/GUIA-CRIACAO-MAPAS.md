# 🗺️ Guia de Criação de Mapas e Personagens - Coquinho Roda Tapa

## 📋 Como Criar Mapas

### Legenda de Símbolos:
```
P = Jogador (Player) - Coquinho protagonista
T = Turista Selfie - Tira selfie quando parado, corre para o coquinho
K = Criança de Boia - Pula na boia quando parada, corre para abraçar
B = Tiozão Bronzeador - Passa bronzeador quando parado, foge do coquinho
C = Caju (Powerup) - Power-up que fortalece o coquinho
G = Goal (Objetivo) - Local onde o coquinho deve chegar para vencer
# = Plataforma - Blocos sólidos que servem de chão/parede
. = Espaço Vazio - Ar livre
```

### Exemplo de Mapa Atual (GRANDE com Câmera Dinâmica):
```javascript
const levelData = [
    '.......................C...................T......K...................', // 0
    '.................................................................###....', // 1
    '............T.............................###.......................', // 2
    '.........########.........................................B..........', // 3
    '..C..................................##########.........####.........', // 4
    '######..........................T................................C...', // 5
    '..........................................################...........', // 6
    '............K.................................................B......', // 7
    '........########.........C.........................................', // 8
    '....................................................T...............', // 9
    '...P.....................############################...............', // 10
    '########.................................................................', // 11
    '........................................B...........................', // 12
    '...............................#########............................', // 13
    '....................K...........................................C...', // 14
    '................########................................................', // 15
    '................................................................T.......', // 16
    '..............................................######################G', // 17
    '####################################################################', // 18
    '####################################################################'  // 19
];
```

### 🎯 Dicas para Criar Mapas (Atualizadas):

1. **Tamanho Flexível**: Mapas podem ter qualquer tamanho! A câmera segue automaticamente
2. **Dimensões**: Largura e altura são determinadas pelo array levelData
3. **Player**: Sempre incluir exatamente 1 'P' (jogador)
4. **Goal**: Sempre incluir exatamente 1 'G' (objetivo)
5. **Plataformas**: Use '#' para criar o chão e obstáculos
6. **Inimigos**: Distribua T, K, B estrategicamente pelo mapa grande
7. **Power-ups**: Use 'C' para dar vantagem ao jogador
8. **Exploração**: Crie caminhos que incentivem exploração horizontal e vertical

### 📐 Sistema de Câmera

- **Seguimento Automático**: A câmera segue o coquinho automaticamente
- **Limites Inteligentes**: Câmera não sai dos limites do mapa
- **Zona Morta**: Área de 100x100 pixels onde o jogador pode se mover sem mover a câmera
- **Suavização**: Movimento suave da câmera (lerp 0.1)
- **UI Fixa**: HUD e controles touch permanecem fixos na tela

## 🎭 Tipos de Personagens

### 1. Turista Selfie (T)
- **Comportamento**: Tira selfie → Anda → Corre para o coquinho → Ataca com foto
- **Características**:
  - Cor: Camisa vermelha, calça cinza
  - Item: Celular na mão
  - Velocidade: Médio (25 base, 60 correndo)
  - Alcance de visão: 100px
  - Alcance de ataque: 50px
- **Estados**:
  - Parado: Tira selfie balançando celular
  - Andando: Caminha olhando celular  
  - Correndo: Corre desesperado para tirar foto
  - Atacando: Flash da câmera

### 2. Criança de Boia (K)
- **Comportamento**: Pula na boia → Anda → Corre para o coquinho → Abraça
- **Características**:
  - Cor: Camisa amarela, short laranja
  - Item: Boia inflável ao redor da cintura
  - Velocidade: Rápido (35 base, 70 correndo)
  - Alcance de visão: 80px
  - Alcance de ataque: 35px
- **Estados**:
  - Parado: Pula animadamente na boia
  - Andando: Caminha com boia
  - Correndo: Corre animada
  - Atacando: Abraço apertado

### 3. Tiozão Bronzeador (B)
- **Comportamento**: Passa bronzeador → Anda → Foge do coquinho → Joga spray
- **Características**:
  - Cor: Camisa azul, short azul escuro, pele bronzeada
  - Item: Frasco de bronzeador
  - Velocidade: Lento (20 base, 45 correndo)
  - Alcance de visão: 120px (maior campo de visão)
  - Alcance de ataque: 60px
- **Estados**:
  - Parado: Passa bronzeador no corpo
  - Andando: Caminha relaxado
  - Correndo: Foge com medo do coquinho
  - Atacando: Joga spray de bronzeador

## 🔧 Como Adicionar Novos Tipos de Personagens

### 1. Definir Configuração
Adicione em `EnemyTypes.getConfig()`:

```javascript
novo_personagem: {
    name: 'Nome do Personagem',
    colors: {
        shirt: 0x??????,  // Cor da camisa (hex)
        pants: 0x??????,  // Cor da calça (hex)
        head: 0x??????    // Cor da cabeça (hex)
    },
    behavior: {
        canWalk: true,           // Pode andar?
        canRun: true,            // Pode correr?
        canAttack: true,         // Pode atacar?
        runFromPlayer: false,    // Foge (true) ou persegue (false)?
        visionRange: 100,        // Distância que vê o jogador
        attackRange: 50,         // Distância para atacar
        baseSpeed: 30,           // Velocidade normal
        runSpeed: 60,            // Velocidade correndo
        idleAction: 'custom',    // Animação quando parado
        attackAction: 'custom'   // Tipo de ataque
    },
    animations: {
        idle: { duration: 2000, description: 'O que faz parado' },
        walk: { duration: 1500, description: 'Como anda' },
        run: { duration: 500, description: 'Como corre' },
        attack: { duration: 800, description: 'Como ataca' }
    }
}
```

### 2. Criar Visual Específico
Adicione em `createTypeSpecificVisuals()`:

```javascript
case 'novo_personagem':
    // Criar elementos visuais únicos
    this.itemEspecial = this.scene.add.rectangle(x, y, w, h, cor);
    this.typeSpecificElements.push(this.itemEspecial);
    break;
```

### 3. Implementar Ataque
Adicione em `performTypeSpecificAttack()`:

```javascript
case 'novo_personagem':
    this.ataqueCustomizado();
    break;
```

### 4. Adicionar Animações
Adicione em `updateTypeAnimations()`:

```javascript
case 'novo_personagem':
    if (this.currentState === 'idle') {
        // Animação específica quando parado
    }
    break;
```

### 5. Usar no Mapa
Adicione uma nova letra na legenda e no switch do `createLevel()`.

## 🌟 Exemplos de Mapas

### Mapa Básico (Tutorial):
```javascript
const levelData = [
    '....................', 
    '....................', 
    '....................', 
    '....................', 
    '....................', 
    '....................', 
    '....................', 
    '....................', 
    '...P.......T.......G', 
    '####################', 
    '####################', 
    '####################'
];
```

### Mapa Médio com Plataformas:
```javascript
const levelData = [
    '....................', 
    '....................', 
    '............T.......', 
    '..........####......', 
    '..C.................', 
    '######..............', 
    '....................', 
    '..........K.........', 
    '...P....######......', 
    '########............', 
    '................B.G.', 
    '####################'
];
```

### Mapa Grande - Exploração Horizontal:
```javascript
const levelData = [
    '..............................................................................', 
    '..T.......K.......B.........C..........T.......K.......B................T...', 
    '.###.....###.....###......####......#####....#####....####............####..', 
    '..............................................................................', 
    '...C...........C...........C...........C..........C.........C...............', 
    '######.....################.....##############....#########.....#############', 
    '..............................................................................', 
    '........T...K.......B..........T......K.......B........T.......K............', 
    '...P..#######...#########....######.######...#####....####....#####.........', 
    '######......................##.............##.....................##........', 
    '................................................G.............................', 
    '##############################################################################'
];
```

### Mapa Torre - Exploração Vertical:
```javascript
const levelData = [
    '..........G.........', // Topo da torre - objetivo
    '......#########.....', 
    '......#.......#.....', 
    '......#...T...#.....', 
    '......#.......#.....', 
    '......###...###.....', 
    '..........C.........', 
    '......###...###.....', 
    '......#.......#.....', 
    '......#...K...#.....', 
    '......#.......#.....', 
    '......###...###.....', 
    '..........C.........', 
    '......###...###.....', 
    '......#.......#.....', 
    '......#...B...#.....', 
    '......#.......#.....', 
    '......#########.....', 
    '..........P.........', // Base - jogador começa aqui
    '####################'
];
```

### Mapa Labirinto:
```javascript
const levelData = [
    '####################################', 
    '#..T.....#.........C...#..........G#', 
    '#.####...#.####.#####..#.#######.#.#', 
    '#......#.#....#.....#..#.......#.#.#', 
    '###.##.#.####.#####.#..#######.#.#.#', 
    '#...#....#..........#..........#...#', 
    '#.#.######.#########.##########.###.#', 
    '#.#........#.......K.#........#.....#', 
    '#.##########.#######.#.######.#####.#', 
    '#..........#...C.....#......#.......#', 
    '#.#######.###.#####.########.#######.#', 
    '#.......#...#.....#........#.......#.#', 
    '#######.###.#####.#########.#######.#.#', 
    '#.......#.........#.......#.........#.#', 
    '#.#####.#.#######.#######.#.#######.#.#', 
    '#.....#...#.....#.......#...#.......#.#', 
    '#####.###.#.###.#######.###.#.#####.#.#', 
    '#.....#.#.#.#.#.......#.#.#.#.#...#...#', 
    '#.###.#.#.#.#.#######.#.#.#.#.#.#.###.#', 
    '#P..B...#...#.........#...#...#.......#', 
    '####################################'
];
```

## 📝 Notas Importantes

- **Balanceamento**: Teste diferentes combinações de personagens
- **Dificuldade**: Tiozão Bronzeador (foge) vs Turista/Criança (perseguem)
- **Power-ups**: Coloque cajus estrategicamente para ajudar em momentos difíceis
- **Plataformas**: Crie caminhos interessantes, mas não impossíveis
- **Objetivo**: Sempre acessível após derrotar todos os inimigos

## 🎮 Sistema de Jogo

O jogador vence quando:
1. Nocauteia todos os inimigos (T, K, B) 
2. Chega no objetivo (G)

Cada inimigo tem comportamentos únicos que criam diferentes desafios:
- **Turista**: Persegue para tirar foto
- **Criança**: Persegue para dar abraço  
- **Tiozão**: Foge mas ataca à distância

Use essas diferenças para criar mapas com estratégias variadas!
