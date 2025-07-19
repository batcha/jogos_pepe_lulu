# 🎨 Sistema de Sprite Sheets do Hamo Heroes

## 📋 Sprites Necessários (com Animação!)

Para usar suas próprias sprites animadas no jogo, você precisa criar 6 arquivos PNG transparentes na pasta `sprites/`. Agora com suporte total a **sprite sheets** com múltiplos frames!

### 🎭 Estados do Personagem:

1. **`hamo_idle.png`** - Hamo parado (pode ter respiração, piscada)
2. **`hamo_running.png`** - Hamo correndo (ciclo de corrida animado)
3. **`hamo_jumping.png`** - Hamo pulando (pode ter preparação para salto)
4. **`hamo_falling.png`** - Hamo caindo (pode ter movimento no ar)
5. **`hamo_attacking.png`** - Hamo atacando (sequência completa de ataque)
6. **`hamo_dying.png`** - Hamo morrendo (animação dramática de morte)

## 🎬 Sistema de Sprite Sheets:

### 📐 Como Funciona:
- **Largura**: Múltiplos de 60px (60px × número de frames)
- **Altura**: Sempre 80px
- **Organização**: Frames lado a lado, da esquerda para direita
- **Detecção**: O jogo detecta automaticamente quantos frames existem

### 🎯 Exemplos de Tamanhos:

| Frames | Largura | Exemplo de Uso |
|--------|---------|----------------|
| 1 frame | 60x80px | Poses estáticas (jumping, falling) |
| 2 frames | 120x80px | Animação simples (idle piscando) |
| 3 frames | 180x80px | Animação suave (running básico) |
| 4 frames | 240x80px | Animação rica (running detalhado) |
| 6 frames | 360x80px | Animação complexa (attacking, dying) |
| 8 frames | 480x80px | Animação muito detalhada |

## ⚡ Velocidades de Animação:

Cada estado tem sua própria velocidade de animação otimizada:

- **🧍 idle**: 15 frames/mudança (lenta - respiração natural)
- **🏃 running**: 8 frames/mudança (rápida - corrida dinâmica)  
- **⬆️ jumping**: 10 frames/mudança (média - movimento no ar)
- **⬇️ falling**: 10 frames/mudança (média - queda controlada)
- **⚔️ attacking**: 6 frames/mudança (muito rápida - ação explosiva)
- **💀 dying**: 12 frames/mudança (dramática - morte impactante)

## 🎨 Guia de Criação:

### 🎯 Layout da Sprite Sheet:
```
Frame 1    Frame 2    Frame 3    Frame 4
[ 60px ]   [ 60px ]   [ 60px ]   [ 60px ]
   |          |          |          |
   v          v          v          v
+--------+--------+--------+--------+
|        |        |        |        |
| Pose 1 | Pose 2 | Pose 3 | Pose 4 | 80px
|        |        |        |        |
+--------+--------+--------+--------+
   240px total width (4 frames × 60px)
```

### 🎨 Recomendações por Estado:

#### 🧍 **Idle (Parado)**:
- 1-2 frames: Pose básica, talvez piscada
- 3-4 frames: Respiração sutil, movimento dos olhos

#### 🏃 **Running (Correndo)**:
- 4-6 frames: Ciclo completo de corrida
- Alternância de pernas, movimento de braços
- Frame 1: Perna direita na frente
- Frame 2: Posição intermediária  
- Frame 3: Perna esquerda na frente
- Frame 4: Posição intermediária

#### ⬆️ **Jumping (Pulando)**:
- 1-3 frames: Preparação para salto, impulso
- Pernas dobradas, braços para cima

#### ⬇️ **Falling (Caindo)**:
- 1-2 frames: Pose de queda, braços abertos
- Pode ter ligeiro movimento no ar

#### ⚔️ **Attacking (Atacando)**:
- 3-6 frames: Sequência completa de ataque
- Pose agressiva, efeitos visuais, impacto

#### 💀 **Dying (Morrendo)**:
- 4-8 frames: Animação dramática de morte
- Gradual queda, pode ter efeitos especiais

## 🔄 Sistema de Animação:

- **Loop Infinito**: Todas as animações fazem loop automaticamente
- **Transição Suave**: Ao mudar de estado, animação reinicia do frame 1
- **Debug Visual**: Mostra número do frame atual (pode ser removido)
- **Fallback**: Se sprite não carregar, usa desenho padrão

## 📚 Especificações Técnicas:

### Formato:
- **Tipo**: PNG com canal alpha (transparência)
- **Orientação**: Todas voltadas para a DIREITA
- **Qualidade**: Recomenda-se alta resolução
- **Cores**: Qualquer paleta, use cores vibrantes

### Dimensões Exatas:
- **Frame Width**: Exatamente 60 pixels
- **Frame Height**: Exatamente 80 pixels  
- **Total Width**: 60px × número de frames
- **Total Height**: 80px

## 🚀 Como Implementar:

1. **Crie** suas sprite sheets PNG
2. **Organize** os frames horizontalmente (lado a lado)
3. **Nomeie** exatamente como: `hamo_idle.png`, `hamo_running.png`, etc.
4. **Coloque** na pasta `sprites/`
5. **Execute** o jogo - as animações rodam automaticamente!

## � Dicas Profissionais:

- **Consistência**: Mantenha o mesmo estilo em todos os frames
- **Timing**: Teste diferentes números de frames para cada estado
- **Fluidez**: Frames intermediários tornam animação mais suave
- **Impacto**: Estados de ação (attack, dying) podem ter mais frames
- **Performance**: Muitos frames = animação mais rica, mas arquivos maiores

---

**O sistema detecta automaticamente quantos frames cada sprite tem!**
**Comece com 1 frame por estado, depois adicione mais conforme necessário.**
