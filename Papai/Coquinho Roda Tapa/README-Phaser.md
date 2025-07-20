# 🥥 Coquinho Roda Tapa - Phaser Edition

Uma versão modernizada do jogo "Coquinho Roda Tapa" utilizando a biblioteca Phaser.js, com suporte completo para gamepad, controles responsivos e otimização para mobile.

## 🎮 Características Principais

### ✨ Suporte Universal de Controles
- **🎯 Gamepad**: Suporte completo para Xbox, PlayStation e controles genéricos
- **⌨️ Teclado**: Controles tradicionais com setas e X/Espaço
- **📱 Touch**: Controles on-screen otimizados para mobile e tablet
- **🔄 Híbrido**: Todos os tipos de controle funcionam simultaneamente

### 🎮 Funcionalidades de Gamepad
- **Detecção Automática**: Reconhece automaticamente Xbox, PlayStation e controles genéricos
- **Vibração/Haptic Feedback**: Feedback tátil para ações como pulo e ataque
- **Analógicos**: Suporte para movimento com intensidade variável
- **D-pad**: Funciona como alternativa aos analógicos
- **Múltiplos Controles**: Suporte para múltiplos gamepads simultaneamente

### 📱 Responsividade e Mobile
- **Auto-scaling**: Interface se adapta automaticamente a diferentes tamanhos de tela
- **Touch Controls**: Botões virtuais otimizados para dispositivos touch
- **Orientação**: Funciona tanto em portrait quanto landscape
- **Performance**: Otimizado para dispositivos móveis com menor poder de processamento

## 🎯 Como Jogar

### Controles de Teclado
- **Setas Direcionais**: Mover o Coquinho
- **Seta para Cima**: Pular
- **X ou Espaço**: Executar o Roda Tapa

### Controles de Gamepad
- **Analógico Esquerdo/D-pad**: Mover o Coquinho
- **Botão A/X (PlayStation)**: Pular
- **Botão B/Círculo ou X/Quadrado**: Roda Tapa

### Controles Touch (Mobile)
- **Botões na Tela**: Aparecem automaticamente em dispositivos touch
- **←/→**: Mover para esquerda/direita
- **↑**: Pular
- **A**: Executar o Roda Tapa

## 🚀 Instalação e Execução

### Arquivos Necessários
1. `index-phaser.html` - Arquivo principal HTML
2. `game.js` - Lógica principal do jogo em Phaser
3. `gamepad.js` - Sistema avançado de controle de gamepad

### Como Executar
1. Abra o arquivo `index-phaser.html` em um navegador moderno
2. O jogo carregará automaticamente
3. Conecte um gamepad (opcional) - será detectado automaticamente
4. Use qualquer tipo de controle para jogar

### Requisitos do Sistema
- **Navegador**: Chrome 80+, Firefox 75+, Safari 13+, Edge 80+
- **WebGL**: Suporte necessário para melhor performance
- **Gamepad API**: Para suporte a controles (suportado na maioria dos navegadores modernos)

## 🛠️ Funcionalidades Técnicas

### Sistema de Input Unificado
```javascript
// O jogo detecta automaticamente todos os tipos de input
InputManager {
    - Teclado (KeyboardPlugin)
    - Gamepad (GamepadManager personalizado) 
    - Touch (Pointer events otimizados)
    - Híbrido (Todos funcionam simultaneamente)
}
```

### Gamepad Manager Avançado
- **Auto-detecção**: Identifica tipo de gamepad conectado
- **Mapeamento Inteligente**: Adapta controles baseado no tipo detectado
- **Deadzone Configurável**: Evita input fantasma dos analógicos
- **Vibração**: Feedback haptic para ações importantes
- **Debug Tools**: Ferramentas para calibração e teste

### Engine Phaser.js
- **Physics**: Sistema de física Arcade otimizado
- **Scaling**: Sistema de escala responsivo
- **Audio**: Suporte para efeitos sonoros
- **Tweens**: Animações suaves e efeitos visuais
- **Scene Management**: Sistema organizado de cenas

## 🎮 Comandos de Debug

### Console do Navegador (F12)
```javascript
// Testar gamepad
debugGamepad.test(0)        // Testa vibração do gamepad 0
debugGamepad.calibrate()    // Calibra analógicos
debugGamepad.info(0)        // Mostra informações do gamepad
debugGamepad.list()         // Lista gamepads conectados

// Performance
Ctrl+Shift+S                // Mostrar/ocultar stats de performance
F11                         // Fullscreen
```

## 🌟 Melhorias em Relação à Versão Original

### Performance
- **60 FPS**: Renderização otimizada com Phaser
- **Memory Management**: Gerenciamento automático de memória
- **Mobile Optimization**: Otimizações específicas para mobile

### Controles
- **Latência Reduzida**: Input mais responsivo
- **Feedback Haptic**: Vibração em gamepads
- **Precisão**: Movimento analógico com intensidade variável
- **Acessibilidade**: Múltiplas opções de controle

### Visual
- **Scaling Inteligente**: Interface se adapta a qualquer resolução
- **Animações Suaves**: Tweens e efeitos visuais aprimorados
- **Loading Screen**: Tela de carregamento profissional
- **UI Responsiva**: Interface adaptável

## 🔧 Configuração Avançada

### Gamepad Settings
```javascript
// Ajustar deadzone dos analógicos
gamepadManager.setDeadzone(0.15); // Padrão: 0.1

// Ativar/desativar vibração
gamepadManager.toggleVibration();

// Configurar mapeamento personalizado
gamepadManager.controlMaps.custom = { ... };
```

### Performance Settings
```javascript
// Mostrar FPS e estatísticas
// Usar Ctrl+Shift+S ou modificar CSS da classe .stats
```

## 🐛 Solução de Problemas

### Gamepad não Conecta
1. Verifique se o navegador suporta Gamepad API
2. Pressione qualquer botão no gamepad após conectar
3. Verifique o console para mensagens de debug

### Performance Lenta em Mobile
1. Feche outros apps/abas
2. Utilize Chrome ou Safari mais recentes
3. Verifique se WebGL está habilitado

### Controles não Respondem
1. Recarregue a página
2. Verifique se outro programa não está usando o gamepad
3. Teste os controles de teclado como alternativa

## 🎨 Personalização

O jogo foi estruturado para fácil personalização:

### Modificar Controles
```javascript
// Em game.js, classe InputManager
// Adicionar novos mapeamentos ou modificar existentes
```

### Adicionar Novos Gamepads
```javascript
// Em gamepad.js, adicionar ao controlMaps
this.controlMaps['novoGamepad'] = { ... };
```

### Modificar Visual
```javascript
// Em game.js, classes Player/Enemy
// Modificar métodos draw() ou adicionar sprites
```

## 📄 Licença

Este projeto é uma melhoria do jogo original "Coquinho Roda Tapa" com foco em modernização e acessibilidade.

---

**Desenvolvido com ❤️ utilizando Phaser.js**

*Para suporte técnico ou dúvidas, consulte o console do navegador ou os comandos de debug disponíveis.*
