# 🎭 SPRITE DE MORTE COM LARGURA DOBRADA

## ✅ **Mudanças Implementadas:**

### 🚫 **Rotação Desabilitada:**
- Rotação de morte completamente removida
- `deathRotation` permanece em 0°
- Sem transformações de canvas

### 🎨 **Sprites de Largura Dobrada:**
- **Largura normal**: 60px por frame
- **Largura durante morte**: 120px por frame
- **Centralização automática** para sprites maiores

## 🔧 **Como Funciona:**

### 📐 **Sistema de Frames:**
```
NORMAL:  [60px][60px][60px] <- Frames normais
MORTE:   [120px][120px][120px] <- Frames de morte (dobro)
```

### 🎯 **Detecção Automática:**
- Quando `hamo.dying = true` → usa frames de 120px
- Quando `hamo.dying = false` → usa frames de 60px
- Centralização automática para que sprite não "pule"

## 📁 **Preparando Seus Sprites:**

### 🎮 **Para Sprites de Morte:**
1. **Arquivo**: `dying.png` 
2. **Largura por frame**: 120px (dobro do normal)
3. **Altura**: 80px (mesma de sempre)
4. **Exemplo**: Se tem 4 frames de morte → sprite sheet de 480px × 80px

### 🎨 **Layout da Sprite Sheet de Morte:**
```
[Frame1: 120px][Frame2: 120px][Frame3: 120px][Frame4: 120px]
|      dying1      |      dying2      |      dying3      |      dying4      |
```

## 🎭 **Efeito Visual:**

### ✅ **Agora:**
- ❌ Sem rotação
- ✅ Queda com gravidade
- ✅ Sprites 2x mais largos durante morte
- ✅ Centralização automática
- ✅ Animação de frames normal

### 🎯 **Ideal Para:**
- Sprites de morte horizontais (caindo de lado)
- Animações mais detalhadas
- Efeitos de "esticar" ou "esparramar"
- Sprites que precisam de mais espaço

## 🧪 **Para Testar:**
1. Crie um `dying.png` com frames de 120px cada
2. Coloque na pasta `sprites/`
3. Morra no jogo
4. Veja os sprites maiores sem rotação

---
**Status:** ✅ Rotação desabilitada, sprites com largura dobrada ativa!
