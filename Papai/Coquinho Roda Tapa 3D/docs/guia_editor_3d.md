# Guia do Editor 3D - Coquinho Roda Tapa

## Como Usar o Editor

### Inicializando o Editor
1. Execute o arquivo `run_server.sh` ou o comando `python -m http.server 8000`
2. Abra seu navegador e acesse `http://localhost:8000/editor/`

### Funcionalidades Básicas

#### Adicionando Objetos Primitivos
- **Cubo**: Clique em "Adicionar Cubo"
- **Esfera**: Clique em "Adicionar Esfera"
- **Plano**: Clique em "Adicionar Plano"

#### Selecionando Objetos
- **Clique** no objeto na cena 3D ou na lista lateral
- **ESC** para deselecionar
- Objeto selecionado fica destacado em laranja

#### Manipulando Objetos
- **Gizmos de Transformação**:
  - "Mover": Move o objeto no espaço
  - "Rotacionar": Rotaciona o objeto
  - "Escalar": Redimensiona o objeto

#### Bottom Bar - Painel de Atributos
Quando um objeto está selecionado, a barra inferior exibe todos os atributos:
- **Nome e Tipo** do objeto
- **Cor**: Altere a cor do material
- **Tamanho**: Escala uniforme
- **Posição**: Coordenadas X, Y, Z
- **Rotação**: Rotação em X, Y, Z
- **Propriedades**: Móvel, Perigo, Plataforma, Decorativo

#### Browser de Objetos 3D
1. Clique em "Escolher arquivos" na seção "Browser de Objetos 3D"
2. Selecione uma pasta contendo arquivos `.glb` ou `.gltf`
3. Os objetos aparecerão na lista com:
   - Nome do arquivo
   - Tamanho em KB
4. Clique em qualquer objeto da lista para adicioná-lo à cena

#### Deletando Objetos
- **Delete** ou **Backspace**: Deleta objeto selecionado
- **Botão "Deletar Selecionado"** no sidebar
- Confirmação é solicitada antes da exclusão

#### Exportar/Importar Fases
- **Exportar**: Salva toda a cena em formato JSON
- **Importar**: Carrega uma cena previamente salva

### Dicas e Truques

1. **Navegação na Cena**:
   - Mouse: Rotacionar câmera
   - Scroll: Zoom in/out
   - Botão direito + arrastar: Pan

2. **Seleção Múltipla**:
   - Use a lista lateral para alternar entre objetos rapidamente

3. **Objetos Importados**:
   - São automaticamente redimensionados se muito grandes
   - Mantêm suas texturas originais
   - Podem ser coloridos usando o painel de cor

4. **Propriedades de Jogo**:
   - **Móvel**: Objeto pode se mover durante o jogo
   - **Perigo**: Causa dano ao jogador
   - **Plataforma**: Jogador pode pisar/pular
   - **Decorativo**: Apenas visual

### Atalhos de Teclado
- **ESC**: Deselecionar objeto
- **Delete/Backspace**: Deletar objeto selecionado

### Formatos Suportados para Importação
- **.glb** (recomendado)
- **.gltf**

### Problemas Conhecidos e Soluções

1. **Objeto não aparece após importação**:
   - Verifique se o arquivo não está corrompido
   - Tente um arquivo .glb em vez de .gltf

2. **Objeto muito pequeno/grande**:
   - Use o campo "Tamanho" para ajustar
   - O editor tenta redimensionar automaticamente

3. **Cor não funciona em objeto importado**:
   - Alguns objetos 3D têm materiais complexos
   - A cor só funciona em materiais com diffuseColor

### Estrutura de Arquivos Recomendada
```
projeto/
├── editor/
│   ├── index.html
│   └── main.js
├── assets/
│   └── models/
│       ├── plataforma.glb
│       ├── inimigo.glb
│       └── decoracao.glb
└── run_server.sh
```
