# Sistema de Animações - Spritesheets

Este é o sistema de animações modular implementado para o jogo "Coquinho Roda Tapa". O sistema suporta tanto spritesheets quanto fallback para os visuais atuais.

## ❓ Como Funciona (Pergunta Frequente)

### 🖼️ **Um Único Arquivo de Imagem**
Sim! Cada personagem usa **apenas 1 arquivo PNG** com todos os frames organizados **horizontalmente** (lado a lado):

```
player.png: [Frame0][Frame1][Frame2][Frame3][Frame4][Frame5]...[FrameN]
Exemplo:     Idle0   Idle1   Idle2   Idle3   Walk0   Walk1  ...  HitN
```

### 📊 **Frames por Animação (CONFIGURÁVEL!)**
Você pode ter **quantos frames quiser** para cada animação! O sistema atual usa:
- **Idle**: 4 frames (mas pode ser 2, 6, 8, etc.)
- **Walking**: 4 frames 
- **Hit**: 4 frames (mas você pode usar 8, 12, etc!)

## 🛠️ Como Personalizar o Número de Frames

### Exemplo: Animação de "Hit" com 8 frames

**No arquivo `game.js`, linha 2-10, mude:**
```javascript
// ANTES (4 frames):
hit: { frames: [19, 20, 21, 22], frameRate: 8, repeat: 0, holdLastFrame: true }

// DEPOIS (8 frames):
hit: { frames: [19, 20, 21, 22, 23, 24, 25, 26], frameRate: 8, repeat: 0, holdLastFrame: true }
```

**E organize seu spritesheet assim:**
```
player.png: [Idle0][Idle1][Idle2][Idle3][Walk0][Walk1][Walk2][Walk3][Run0]...[Hit0][Hit1][Hit2][Hit3][Hit4][Hit5][Hit6][Hit7]
Posições:      0     1     2     3     4     5     6     7    8  ...  19   20   21   22   23   24   25   26
```

## Como Usar

### 1. Organização dos Arquivos

Coloque os spritesheets na pasta `assets/sprites/` com os seguintes nomes:

**Player (Jogador):**
- `player.png` - Spritesheet do jogador

**Inimigos:**
- `selfie_tourist.png` - Turista tirando selfie
- `child_float.png` - Criança com boia
- `sunscreen_guy.png` - Tiozão do bronzeador

### 2. ⚙️ Configuração ATUAL dos Spritesheets (Personalizável!)

#### Player:
- **idle**: Frames 0-3 (4 frames, 6fps) - Parado/respirando
- **walking**: Frames 4-7 (4 frames, 10fps) - Caminhando
- **running**: Frames 8-11 (4 frames, 14fps) - Correndo
- **attacking**: Frames 12-15 (4 frames, 12fps) - Atacando
- **jumping**: Frames 16-18 (3 frames, 8fps) - Pulando
- **hit**: Frames 19-22 (4 frames, 8fps) - Sendo atingido (hold last frame)

#### Inimigos (TODOS DIFERENTES - veja como personalizar):
**Selfie Tourist:**
- **idle**: Frames 0-3 (4 frames)
- **walking**: Frames 4-7 (4 frames)
- **hit**: Frames 15-17 (3 frames)

**Child Float:**
- **idle**: Frames 0-2 (3 frames)
- **walking**: Frames 3-6 (4 frames)
- **hit**: Frames 14-16 (3 frames)

**Sunscreen Guy:**
- **idle**: Frames 0-3 (4 frames)
- **running**: Frames 8-10 (3 frames)
- **attacking**: Frames 11-14 (4 frames)

### 3. 🎨 Formato dos Spritesheets

**📏 TAMANHOS EXATOS (IMPORTANTE!):**
- **Largura por frame**: 48 pixels
- **Altura por frame**: 48 pixels  
- **Organização**: Frames organizados horizontalmente (lado a lado)
- **Formato**: PNG com transparência

**📐 Exemplo de Dimensões Totais:**
- **Player** (23 frames): `1104 x 48 pixels` (48 × 23 = 1104)
- **Selfie Tourist** (18 frames): `864 x 48 pixels` (48 × 18 = 864)  
- **Child Float** (17 frames): `816 x 48 pixels` (48 × 17 = 816)
- **Sunscreen Guy** (18 frames): `864 x 48 pixels` (48 × 18 = 864)

**🖼️ Exemplo Visual de Spritesheet:**
```
player.png (1104 x 48 pixels):
[48x48][48x48][48x48][48x48][48x48]...[48x48]
Frame0 Frame1 Frame2 Frame3 Frame4   Frame22
Idle0  Idle1  Idle2  Idle3  Walk0    Hit3
```

**⚠️ IMPORTANTE:**
- Cada quadradinho é **exatamente 48x48 pixels**
- A imagem total deve ter **altura de 48 pixels**
- A largura depende do número de frames
- Frames devem estar perfeitamente alinhados, sem espaços

### 4. 💡 Calculadora de Tamanhos

**Para calcular o tamanho total da sua imagem:**
- Largura total = `48 × número de frames`
- Altura total = `48 pixels` (sempre)

**Exemplos:**
- 10 frames: `480 x 48 pixels`
- 15 frames: `720 x 48 pixels`  
- 20 frames: `960 x 48 pixels`
- 25 frames: `1200 x 48 pixels`

### 5. Sistema de Fallback

Se os arquivos de sprite não forem encontrados, o jogo automaticamente usará os visuais atuais (formas geométricas coloridas). Isso garante que o jogo sempre funcione, mesmo sem os spritesheets.

### 5. Logs do Sistema

O sistema registra no console:
- Quais spritesheets foram carregados com sucesso
- Quais falharam ao carregar
- Mudanças de estado de animação
- Se está usando sprites ou fallback

### 6. Como Expandir

Para adicionar mais animações:

1. **Modifique o AnimationManager**: Adicione novas configurações no método `getAnimationConfig()`
2. **Atualize os spritesheets**: Inclua os novos frames
3. **Implemente a lógica**: Use `playAnimation('nome_da_animacao')` nas classes dos personagens

### 7. Exemplo de Uso no Código

```javascript
// Tocar uma animação
this.playAnimation('walking');

// Verificar se tem animações disponíveis
if (this.hasAnimations) {
    this.playAnimation('attacking');
} else {
    // Lógica de fallback
}

// Bloquear animação durante ataque
this.lockAnimation(true);
this.playAnimation('attacking');
// A animação ficará bloqueada até lockAnimation(false)
```

### 8. Performance

O sistema é otimizado para:
- Carregar apenas os sprites que existem
- Não tentar recarregar sprites que falharam
- Usar cache eficiente das animações
- Minimizar chamadas desnecessárias de playAnimation

## Estados de Animação por Personagem

### Player:
- **Idle**: Quando parado
- **Walking**: Movimento normal
- **Running**: Movimento rápido (analógico > 0.8)
- **Jumping**: No ar (velocidade Y negativa)
- **Attacking**: Durante ataque (bloqueada por 300ms)
- **Hit**: Quando atingido por inimigo

### Inimigos:
- **Idle**: Estado de descanso/ação específica
- **Walking**: Patrulha normal
- **Running**: Perseguindo ou fugindo do jogador
- **Attacking**: Executando ataque específico
- **Hit**: Quando nocauteado pelo jogador

## Troubleshooting

1. **Sprites não aparecem**: Verifique se os arquivos estão na pasta correta e com os nomes exatos
2. **Animações não mudam**: Verifique o console para logs de erro
3. **Performance baixa**: Reduza o número de frames ou a taxa de FPS das animações
4. **Sprites cortados**: Ajuste o tamanho do frame nas configurações do AnimationManager

O sistema foi projetado para ser robusto e sempre funcionar, mesmo com problemas nos arquivos de sprite!
