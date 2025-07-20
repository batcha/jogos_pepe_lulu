class PedroPotato {
    constructor() {
        this.gameArea = document.getElementById('gameArea');
        this.player = document.getElementById('player');
        this.house = document.getElementById('house');
        this.scoreElement = document.getElementById('score');
        this.livesElement = document.getElementById('lives');
        this.levelElement = document.getElementById('level');
        this.gameOverScreen = document.getElementById('gameOver');
        this.finalScoreElement = document.getElementById('finalScore');
        
        this.gameState = {
            isRunning: false,
            isPaused: false,
            score: 0,
            lives: 3,
            level: 1,
            playerPosition: 50, // percentual da largura
            potatoes: [],
            farts: [],
            gameSpeed: 1000, // ms entre spawns de batatas
            potatoSpeed: 2, // pixels por frame
            lastFartTime: 0, // controle de cooldown do pum
        };
        
        this.keys = {
            left: false,
            right: false,
            space: false
        };
        
        this.gameLoop = null;
        this.potatoSpawner = null;
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.updateDisplay();
    }
    
    setupEventListeners() {
        // Controles do teclado
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
        document.addEventListener('keyup', (e) => this.handleKeyUp(e));
        
        // Botões
        document.getElementById('startBtn').addEventListener('click', () => this.startGame());
        document.getElementById('pauseBtn').addEventListener('click', () => this.togglePause());
        document.getElementById('restartBtn').addEventListener('click', () => this.restartGame());
        
        // Prevenir scroll da página com as setas
        window.addEventListener('keydown', (e) => {
            if(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
                e.preventDefault();
            }
        });
    }
    
    handleKeyDown(e) {
        if (!this.gameState.isRunning || this.gameState.isPaused) return;
        
        switch(e.key) {
            case 'ArrowLeft':
                this.keys.left = true;
                break;
            case 'ArrowRight':
                this.keys.right = true;
                break;
            case ' ':
                if (!this.keys.space) {
                    this.keys.space = true;
                    this.fart();
                }
                break;
        }
    }
    
    handleKeyUp(e) {
        switch(e.key) {
            case 'ArrowLeft':
                this.keys.left = false;
                break;
            case 'ArrowRight':
                this.keys.right = false;
                break;
            case ' ':
                this.keys.space = false;
                break;
        }
    }
    
    startGame() {
        this.gameState.isRunning = true;
        this.gameState.isPaused = false;
        
        document.getElementById('startBtn').disabled = true;
        document.getElementById('pauseBtn').disabled = false;
        
        this.gameLoop = setInterval(() => this.update(), 16); // ~60 FPS
        this.potatoSpawner = setInterval(() => this.spawnPotato(), this.gameState.gameSpeed);
    }
    
    togglePause() {
        if (!this.gameState.isRunning) return;
        
        this.gameState.isPaused = !this.gameState.isPaused;
        const pauseBtn = document.getElementById('pauseBtn');
        
        if (this.gameState.isPaused) {
            clearInterval(this.gameLoop);
            clearInterval(this.potatoSpawner);
            pauseBtn.textContent = 'Continuar';
        } else {
            this.gameLoop = setInterval(() => this.update(), 16);
            this.potatoSpawner = setInterval(() => this.spawnPotato(), this.gameState.gameSpeed);
            pauseBtn.textContent = 'Pausar';
        }
    }
    
    restartGame() {
        this.stopGame();
        
        // Limpar elementos do jogo ANTES de resetar o estado
        this.clearGameElements();
        
        // Reset do estado do jogo
        this.gameState = {
            isRunning: false,
            isPaused: false,
            score: 0,
            lives: 3,
            level: 1,
            playerPosition: 50,
            potatoes: [],
            farts: [],
            gameSpeed: 1000,
            potatoSpeed: 2,
            lastFartTime: 0,
        };
        
        // Atualizar display e esconder game over
        this.updateDisplay();
        this.gameOverScreen.style.display = 'none';
        
        // Reset dos botões
        document.getElementById('startBtn').disabled = false;
        document.getElementById('pauseBtn').disabled = true;
        document.getElementById('pauseBtn').textContent = 'Pausar';
    }
    
    stopGame() {
        this.gameState.isRunning = false;
        this.gameState.isPaused = false;
        
        if (this.gameLoop) clearInterval(this.gameLoop);
        if (this.potatoSpawner) clearInterval(this.potatoSpawner);
    }
    
    update() {
        if (!this.gameState.isRunning || this.gameState.isPaused) return;
        
        this.updatePlayerPosition();
        this.updatePotatoes();
        this.updateFarts();
        this.checkCollisions();
        this.updateDisplay();
    }
    
    updatePlayerPosition() {
        const moveSpeed = 1.5; // Diminuído de 3 para 1.5
        
        if (this.keys.left && this.gameState.playerPosition > 5) {
            this.gameState.playerPosition -= moveSpeed;
        }
        if (this.keys.right && this.gameState.playerPosition < 95) {
            this.gameState.playerPosition += moveSpeed;
        }
        
        this.player.style.left = this.gameState.playerPosition + '%';
    }
    
    spawnPotato() {
        if (!this.gameState.isRunning || this.gameState.isPaused) return;
        
        const potato = {
            id: Date.now() + Math.random(),
            x: Math.random() * 80 + 10, // 10% a 90% da largura
            y: 460, // começa no fundo
            element: null
        };
        
        // Criar elemento visual
        const potatoElement = document.createElement('div');
        potatoElement.className = 'potato';
        potatoElement.textContent = '🥔';
        potatoElement.style.left = potato.x + '%';
        potatoElement.style.top = potato.y + 'px';
        
        potato.element = potatoElement;
        this.gameArea.appendChild(potatoElement);
        this.gameState.potatoes.push(potato);
    }
    
    updatePotatoes() {
        this.gameState.potatoes = this.gameState.potatoes.filter(potato => {
            if (!potato.element) return false;
            
            potato.y -= this.gameState.potatoSpeed; // Batatas sobem (valor negativo)
            potato.element.style.top = potato.y + 'px';
            
            // Verificar se chegou na casa (próximo ao topo)
            if (potato.y <= 60) { // próximo à casa
                if (potato.element && potato.element.parentNode) {
                    this.gameArea.removeChild(potato.element);
                }
                this.loseLife();
                return false;
            }
            
            return true;
        });
    }
    
    fart() {
        // Cooldown de 100ms entre puns para evitar spam (diminuído para melhor responsividade)
        const currentTime = Date.now();
        if (currentTime - this.gameState.lastFartTime < 100) {
            return;
        }
        this.gameState.lastFartTime = currentTime;
        
        // Criar pum na posição do jogador
        const fart = {
            id: Date.now(),
            x: this.gameState.playerPosition,
            y: 130, // posição inicial do pum (na frente da criança)
            element: null,
            lifeTime: 0 // controlar duração do pum
        };
        
        // Criar elemento visual do pum
        const fartElement = document.createElement('div');
        fartElement.className = 'fart';
        fartElement.textContent = '💨';
        fartElement.style.left = fart.x + '%';
        fartElement.style.top = fart.y + 'px';
        
        fart.element = fartElement;
        this.gameArea.appendChild(fartElement);
        this.gameState.farts.push(fart);
    }
    
    updateFarts() {
        this.gameState.farts = this.gameState.farts.filter(fart => {
            if (!fart.element) return false;
            
            // Incrementar tempo de vida do pum
            fart.lifeTime += 16; // ~16ms por frame a 60 FPS
            
            // Mover pum para baixo
            fart.y += 5;
            fart.element.style.top = fart.y + 'px';
            
            // Remove puns que saíram da tela ou que duraram muito tempo (1 segundo)
            if (fart.y > 500 || fart.lifeTime > 1000) {
                if (fart.element && fart.element.parentNode) {
                    this.gameArea.removeChild(fart.element);
                }
                return false;
            }
            
            return true;
        });
    }
    
    checkCollisions() {
        // Verificar colisão entre puns e batatas
        // Usar um loop reverso para evitar problemas ao remover elementos
        for (let fartIndex = this.gameState.farts.length - 1; fartIndex >= 0; fartIndex--) {
            const fart = this.gameState.farts[fartIndex];
            if (!fart.element || !fart.element.parentNode) continue;
            
            for (let potatoIndex = this.gameState.potatoes.length - 1; potatoIndex >= 0; potatoIndex--) {
                const potato = this.gameState.potatoes[potatoIndex];
                if (!potato.element || !potato.element.parentNode) continue;
                
                // Verificação simplificada de colisão (mais rápida)
                const fartX = fart.x;
                const fartY = fart.y;
                const potatoX = potato.x;
                const potatoY = potato.y;
                
                // Distância aproximada para colisão
                const distance = Math.abs(fartX - potatoX) + Math.abs(fartY - potatoY);
                
                if (distance < 8) { // Colisão detectada (ajuste este valor se necessário)
                    // Criar explosão
                    this.createExplosion(potato.x, potato.y);
                    
                    // Remover batata
                    if (potato.element.parentNode) {
                        this.gameArea.removeChild(potato.element);
                    }
                    this.gameState.potatoes.splice(potatoIndex, 1);
                    
                    // Remover pum
                    if (fart.element.parentNode) {
                        this.gameArea.removeChild(fart.element);
                    }
                    this.gameState.farts.splice(fartIndex, 1);
                    
                    // Aumentar pontuação
                    this.gameState.score += 10 * this.gameState.level;
                    
                    // Verificar se deve subir de nível
                    this.checkLevelUp();
                    
                    // Sair do loop interno já que o pum foi removido
                    break;
                }
            }
        }
    }
    
    getElementRect(element) {
        if (!element || !element.parentNode) {
            return { left: 0, top: 0, right: 0, bottom: 0 };
        }
        
        try {
            const rect = element.getBoundingClientRect();
            const gameRect = this.gameArea.getBoundingClientRect();
            
            return {
                left: rect.left - gameRect.left,
                top: rect.top - gameRect.top,
                right: rect.right - gameRect.left,
                bottom: rect.bottom - gameRect.top
            };
        } catch (error) {
            return { left: 0, top: 0, right: 0, bottom: 0 };
        }
    }
    
    isColliding(rect1, rect2) {
        return !(rect1.right < rect2.left || 
                rect1.left > rect2.right || 
                rect1.bottom < rect2.top || 
                rect1.top > rect2.bottom);
    }
    
    createExplosion(x, y) {
        const explosion = document.createElement('div');
        explosion.className = 'explosion';
        explosion.textContent = '💥';
        explosion.style.left = x + '%';
        explosion.style.top = y + 'px';
        
        this.gameArea.appendChild(explosion);
        
        // Usar requestAnimationFrame para melhor performance
        const startTime = Date.now();
        const animate = () => {
            const elapsed = Date.now() - startTime;
            if (elapsed >= 800) {
                if (explosion.parentNode) {
                    this.gameArea.removeChild(explosion);
                }
            } else {
                requestAnimationFrame(animate);
            }
        };
        requestAnimationFrame(animate);
    }
    
    checkLevelUp() {
        const newLevel = Math.floor(this.gameState.score / 100) + 1;
        
        if (newLevel > this.gameState.level) {
            this.gameState.level = newLevel;
            
            // Aumentar dificuldade
            this.gameState.potatoSpeed += 0.5;
            this.gameState.gameSpeed = Math.max(500, this.gameState.gameSpeed - 100);
            
            // Reiniciar o spawner com nova velocidade
            if (this.potatoSpawner) {
                clearInterval(this.potatoSpawner);
                this.potatoSpawner = setInterval(() => this.spawnPotato(), this.gameState.gameSpeed);
            }
        }
    }
    
    loseLife() {
        this.gameState.lives--;
        
        if (this.gameState.lives <= 0) {
            this.gameOver();
        }
    }
    
    gameOver() {
        this.stopGame();
        this.finalScoreElement.textContent = this.gameState.score;
        this.gameOverScreen.style.display = 'flex';
    }
    
    clearGameElements() {
        // Remover todas as batatas do estado
        this.gameState.potatoes.forEach(potato => {
            if (potato.element && potato.element.parentNode) {
                this.gameArea.removeChild(potato.element);
            }
        });
        
        // Remover todos os puns do estado
        this.gameState.farts.forEach(fart => {
            if (fart.element && fart.element.parentNode) {
                this.gameArea.removeChild(fart.element);
            }
        });
        
        // Limpar arrays do estado
        this.gameState.potatoes = [];
        this.gameState.farts = [];
        
        // Remover qualquer elemento órfão que possa ter ficado no DOM
        const allPotatoes = this.gameArea.querySelectorAll('.potato');
        allPotatoes.forEach(potato => {
            if (potato.parentNode) {
                this.gameArea.removeChild(potato);
            }
        });
        
        const allFarts = this.gameArea.querySelectorAll('.fart');
        allFarts.forEach(fart => {
            if (fart.parentNode) {
                this.gameArea.removeChild(fart);
            }
        });
        
        // Remover explosões e outros elementos temporários
        const explosions = this.gameArea.querySelectorAll('.explosion');
        explosions.forEach(explosion => {
            if (explosion.parentNode) {
                this.gameArea.removeChild(explosion);
            }
        });
    }
    
    updateDisplay() {
        this.scoreElement.textContent = this.gameState.score;
        this.livesElement.textContent = this.gameState.lives;
        this.levelElement.textContent = this.gameState.level;
    }
}

// Função global para reiniciar (chamada pelo botão Game Over)
function restartGame() {
    if (window.game) {
        window.game.restartGame();
    }
}

// Inicializar o jogo quando a página carregar
document.addEventListener('DOMContentLoaded', () => {
    window.game = new PedroPotato();
});
