# 🥥 Editor de Mapas - Coquinho Roda Tapa

## 📋 Como Usar o Editor

### 🎯 **Iniciando**
1. Abra o arquivo `map-editor.html` no seu navegador
2. O editor abrirá com um mapa vazio pronto para edição

### 🎨 **Ferramentas Disponíveis**
- **🔵 Espaço Vazio (.)** - Ar livre onde os personagens podem se mover
- **🟧 Plataforma (#)** - Blocos sólidos para chão e paredes
- **🥥 Jogador (P)** - Posição inicial do Coquinho (só pode haver 1)
- **📱 Turista Selfie (T)** - Inimigo que persegue para tirar foto
- **🏊 Criança de Boia (K)** - Inimigo que persegue para dar abraço
- **🌞 Tiozão Bronzeador (B)** - Inimigo que foge mas ataca à distância
- **🥜 Caju (C)** - Power-up que fortalece o Coquinho
- **🎯 Objetivo (G)** - Meta final do nível (só pode haver 1)

### 🖱️ **Como Desenhar**
1. **Clique na ferramenta** desejada na barra lateral
2. **Clique e arraste** no canvas para desenhar
3. **Mobile/Touch**: Toque e arraste com o dedo

### ⚙️ **Configurações do Mapa**
- **Largura**: 10-100 tiles (recomendado: 20-40)
- **Altura**: 10-50 tiles (recomendado: 12-20)
- **Tamanho automático**: O editor ajusta o tamanho dos tiles automaticamente

### 🗺️ **Mapas Prontos**
O editor inclui 5 templates prontos:
- **📚 Tutorial** - Mapa simples para aprender
- **🏗️ Médio** - Nível com plataformas básicas
- **🗺️ Grande** - Mapa extenso para exploração
- **🏢 Torre** - Desafio vertical
- **🌀 Labirinto** - Mapa complexo com caminhos

### 💻 **Gerando o Código**
1. Termine de desenhar seu mapa
2. Clique em **"💻 Gerar Código"**
3. O código JavaScript será gerado automaticamente
4. Clique em **"📋 Copiar"** para copiar o código
5. Cole no arquivo `game.js` substituindo o `levelData` existente

### 📊 **Estatísticas**
O painel mostra em tempo real:
- Quantidade de cada tipo de elemento
- Verificação automática de elementos obrigatórios (P e G)

### ✅ **Regras Importantes**
- **Deve haver exatamente 1 Jogador (P)** - posição inicial do Coquinho
- **Deve haver exatamente 1 Objetivo (G)** - meta do nível
- **Pelo menos 1 inimigo** para ter desafio
- **Plataformas (#) suficientes** para navegação
- **Power-ups (C) opcionais** para estratégia

### 🎮 **Dicas de Design**
1. **Teste a jogabilidade**: Imagine o caminho do jogador
2. **Balance a dificuldade**: Não coloque muitos inimigos juntos
3. **Use power-ups estrategicamente**: Perto de grupos de inimigos
4. **Crie caminhos interessantes**: Use plataformas para guiar o jogador
5. **Varie os inimigos**: Cada tipo tem comportamento diferente
6. **Deixe espaço**: Evite mapas muito apertados

### 🔄 **Integrando no Jogo**
1. **Copie o código gerado**
2. **Abra o arquivo `game.js`**
3. **Encontre a função `createLevel()`**
4. **Substitua o array `levelData`** pelo código copiado
5. **Salve e teste** no jogo

### 📱 **Compatibilidade**
- **Desktop**: Funciona em todos os navegadores modernos
- **Mobile**: Suporte completo a touch
- **Responsive**: Interface se adapta ao tamanho da tela

### 🛠️ **Atalhos Úteis**
- **🆕 Novo Mapa**: Limpa tudo e cria mapa vazio
- **🗑️ Limpar**: Remove todo o conteúdo atual
- **Templates**: Carregam mapas prontos como base

### 🎨 **Customização Visual**
- **Cores automáticas**: Cada elemento tem sua cor
- **Símbolos visuais**: Emojis facilitam identificação
- **Grid visível**: Bordas ajudam no alinhamento
- **Preview em tempo real**: Vê o resultado na hora

### 📋 **Exemplo de Uso**
1. Clique em **"📚 Tutorial"** para carregar um mapa simples
2. Modifique adicionando mais inimigos ou power-ups
3. Clique em **"💻 Gerar Código"**
4. Copie e cole no seu jogo
5. Teste e refine conforme necessário

### 🔧 **Solução de Problemas**
- **Mapa muito grande**: Reduza as dimensões ou o editor pode ficar lento
- **Código não funciona**: Verifique se há P e G no mapa
- **Canvas não aparece**: Atualize a página e tente novamente
- **Mobile não funciona**: Use toque simples, evite gestos complexos

---

**💡 Lembre-se**: O editor salva apenas o que você gera! Sempre copie o código antes de fechar a página.

**🎮 Divirta-se criando mapas incríveis para o Coquinho Roda Tapa!**
