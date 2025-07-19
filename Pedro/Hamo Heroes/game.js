// Hamo Heroes - Jogo de Plataforma
class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.score = 0;
        this.lives = 3;
        this.gameRunning = true;
        this.keys = {};
        this.platforms = [];
        this.hunters = [];
        this.powerUps = [];
        this.particles = [];
        this.gameSpeed = 1;
        this.hunterSpawnTimer = 0;
        this.powerUpSpawnTimer = 0;
        
        // Sistema de câmera para mundo expandido
        this.camera = {
            x: 0,
            y: 0,
            targetX: 0,
            targetY: 0,
            smoothing: 0.1
        };
        
        // Tamanho do mundo expandido
        this.worldWidth = 3000; // 3x maior que o canvas
        this.worldHeight = 1400; // 2x maior que o canvas
        
        // Sistema de áudio
        this.sounds = {
            jump: document.getElementById('jumpSound'),
            superJump: document.getElementById('superJumpSound'),
            landing: document.getElementById('landingSound'),
            powerUp: document.getElementById('powerUpSound'),
            hit: document.getElementById('hitSound'),
            destroy: document.getElementById('destroySound'),
            backgroundMusic: document.getElementById('backgroundMusic'),
            gameOver: document.getElementById('gameOverSound')
        };
        
        // Configurações de áudio
        this.audioSettings = {
            musicEnabled: true,
            soundEnabled: true,
            musicVolume: 0.3,
            soundVolume: 0.5
        };
        
        // Sistema de highscore
        this.highScore = this.loadHighScore();
        
        this.initAudio();
        this.initGame();
        this.bindEvents();
        this.gameLoop();
    }
    
    // Sistema de HighScore
    loadHighScore() {
        try {
            const saved = localStorage.getItem('hamoHeroes_highScore');
            return saved ? parseInt(saved) : 0;
        } catch (e) {
            console.log('Erro ao carregar highscore:', e);
            return 0;
        }
    }
    
    saveHighScore(score) {
        try {
            localStorage.setItem('hamoHeroes_highScore', score.toString());
            console.log('✅ Novo recorde salvo:', score);
        } catch (e) {
            console.log('Erro ao salvar highscore:', e);
        }
    }
    
    checkAndUpdateHighScore() {
        if (this.score > this.highScore) {
            this.highScore = this.score;
            this.saveHighScore(this.highScore);
            return true; // Retorna true se é novo recorde
        }
        return false;
    }
    
    initAudio() {
        // Configurar volumes iniciais
        for (let soundName in this.sounds) {
            if (this.sounds[soundName]) {
                if (soundName === 'backgroundMusic') {
                    this.sounds[soundName].volume = this.audioSettings.musicVolume;
                } else {
                    this.sounds[soundName].volume = this.audioSettings.soundVolume;
                }
            }
        }
        
        // Iniciar música de fundo quando o jogo começar
        if (this.sounds.backgroundMusic && this.audioSettings.musicEnabled) {
            this.sounds.backgroundMusic.play().catch(e => {
                console.log('Não foi possível reproduzir música automaticamente:', e);
            });
        }
    }
    
    playSound(soundName) {
        if (!this.audioSettings.soundEnabled || !this.sounds[soundName]) return;
        
        try {
            this.sounds[soundName].currentTime = 0; // Reinicia o som
            this.sounds[soundName].play();
        } catch (e) {
            console.log('Erro ao reproduzir som:', e);
        }
    }
    
    toggleMusic() {
        this.audioSettings.musicEnabled = !this.audioSettings.musicEnabled;
        const musicToggle = document.getElementById('musicToggle');
        
        if (this.audioSettings.musicEnabled) {
            musicToggle.textContent = '🎵 ON';
            if (this.sounds.backgroundMusic) {
                this.sounds.backgroundMusic.play();
            }
        } else {
            musicToggle.textContent = '🎵 OFF';
            if (this.sounds.backgroundMusic) {
                this.sounds.backgroundMusic.pause();
            }
        }
    }
    
    toggleSounds() {
        this.audioSettings.soundEnabled = !this.audioSettings.soundEnabled;
        const soundToggle = document.getElementById('soundToggle');
        
        if (this.audioSettings.soundEnabled) {
            soundToggle.textContent = '🔉 ON';
        } else {
            soundToggle.textContent = '🔉 OFF';
        }
    }
    
    // Função para testar todos os sons - útil para verificar se os arquivos estão corretos
    testAllSounds() {
        console.log('🎵 Testando todos os sons...');
        const soundNames = ['jump', 'superJump', 'landing', 'powerUp', 'hit', 'destroy', 'gameOver'];
        
        soundNames.forEach((soundName, index) => {
            setTimeout(() => {
                console.log(`🔊 Testando som: ${soundName}`);
                this.playSound(soundName);
            }, index * 1000); // 1 segundo entre cada som
        });
    }
    
    initGame() {
        // Sistema de sprites do Hamo com suporte a sprite sheets
        this.hamoSprites = {
            idle: { img: null, frames: 1, currentFrame: 0, frameTimer: 0, frameSpeed: 15 },
            running: { img: null, frames: 1, currentFrame: 0, frameTimer: 0, frameSpeed: 8 },
            jumping: { img: null, frames: 1, currentFrame: 0, frameTimer: 0, frameSpeed: 10 },
            falling: { img: null, frames: 1, currentFrame: 0, frameTimer: 0, frameSpeed: 10 },
            attacking: { img: null, frames: 1, currentFrame: 0, frameTimer: 0, frameSpeed: 6 },
            dying: { img: null, frames: 1, currentFrame: 0, frameTimer: 0, frameSpeed: 12 }
        };
        
        // Carregar sprites (substitua pelos seus arquivos PNG)
        this.loadHamoSprites();
        
        // Criar Hamo (personagem principal)
        this.hamo = {
            x: 100,
            y: 400,
            width: 60,
            height: 80,
            velocityX: 0,
            velocityY: 0,
            speed: 5,
            jumpPower: 15,
            superJumpPower: 22,
            onGround: false,
            color: '#D2691E',
            direction: 1, // 1 = direita, -1 = esquerda
            invulnerable: 0,
            attacking: false,
            attackCooldown: 0,
            superJumpCooldown: 0,
            // Estados de animação
            currentState: 'idle',
            lastState: 'idle',
            animationFrame: 0,
            animationSpeed: 8, // Frames entre mudanças de sprite
            // Efeito de morte com rotação
            dying: false,         // Estado de morte
            deathRotation: 0,     // Ângulo de rotação na morte (0 a 90 graus)
            deathRotationSpeed: 10, // Velocidade da rotação
            deathFalling: false,  // Se está caindo durante a morte
            deathCollisionEnabled: true, // Se colisão está ativa durante morte
            // Power-ups (apenas 3 tipos)
            speedBoost: 0,        // Velocidade extra (tempo em frames)
            shield: 0,            // Escudo protetor 
            magnet: 0,            // Atrai power-ups próximos
            ghostMode: 0          // Pode atravessar plataformas
        };
        
        // Criar plataformas iniciais
        this.createPlatforms();
        
        // Não criar caçadores iniciais - eles aparecerão conforme o jogo progride
        // this.createInitialHunters(); // Removido para dar ao jogador tempo para se acostumar
    }
    
    // Sistema de carregamento de sprites com suporte a sprite sheets
    loadHamoSprites() {
        const spriteNames = ['idle', 'running', 'jumping', 'falling', 'attacking', 'dying'];
        
        spriteNames.forEach(spriteName => {
            const img = new Image();
            img.src = `sprites/hamo_${spriteName}.png`;
            
            img.onload = () => {
                // Calcular número de frames baseado na largura da imagem
                const frameWidth = 60; // Largura padrão de cada frame
                const totalFrames = Math.floor(img.width / frameWidth);
                
                this.hamoSprites[spriteName].img = img;
                this.hamoSprites[spriteName].frames = totalFrames;
                this.hamoSprites[spriteName].currentFrame = 0;
                
                console.log(`✅ Sprite carregado: hamo_${spriteName}.png - ${totalFrames} frame(s) (${img.width}x${img.height}px)`);
            };
            
            img.onerror = () => {
                console.log(`⚠️ Sprite não encontrado: hamo_${spriteName}.png - usando desenho padrão`);
            };
        });
    }
    
    // Atualizar animações das sprites
    updateSpriteAnimations() {
        const currentSprite = this.hamoSprites[this.hamo.currentState];
        
        if (currentSprite && currentSprite.frames > 1) {
            currentSprite.frameTimer++;
            
            if (currentSprite.frameTimer >= currentSprite.frameSpeed) {
                currentSprite.currentFrame = (currentSprite.currentFrame + 1) % currentSprite.frames;
                currentSprite.frameTimer = 0;
            }
        }
        
        // Atualizar rotação de morte
        if (this.hamo.dying && this.hamo.deathRotation < 90) {
            this.hamo.deathRotation += this.hamo.deathRotationSpeed;
            if (this.hamo.deathRotation > 90) {
                this.hamo.deathRotation = 90; // Limitar a 90 graus
            }
        }
    }
    
    // Resetar animação quando muda de estado
    resetSpriteAnimation(stateName) {
        const sprite = this.hamoSprites[stateName];
        if (sprite) {
            sprite.currentFrame = 0;
            sprite.frameTimer = 0;
        }
    }
    
    // Atualizar estado de animação do Hamo
    updateHamoAnimation() {
        let newState = 'idle';
        
        // Determinar estado atual baseado no movimento e ações
        if (this.hamo.dying) {
            newState = 'dying';
        } else if (this.hamo.attacking) {
            newState = 'attacking';
        } else if (!this.hamo.onGround) {
            if (this.hamo.velocityY < 0) {
                newState = 'jumping'; // Subindo
            } else {
                newState = 'falling'; // Caindo
            }
        } else if (Math.abs(this.hamo.velocityX) > 1) {
            newState = 'running';
        } else {
            newState = 'idle';
        }
        
        // Atualizar estado se mudou
        if (newState !== this.hamo.currentState) {
            this.hamo.lastState = this.hamo.currentState;
            this.hamo.currentState = newState;
            this.hamo.animationFrame = 0;
            // Resetar animação da nova sprite
            this.resetSpriteAnimation(newState);
        } else {
            this.hamo.animationFrame++;
        }
        
        // Atualizar animações das sprites
        this.updateSpriteAnimations();
    }
    
    createPlatforms() {
        this.platforms = [
            // === ÁREA INICIAL (0-800) ===
            // Chão principal
            { x: 0, y: this.worldHeight - 100, width: this.worldWidth, height: 100, type: 'ground' },
            
            // Plataformas iniciais básicas
            { x: 200, y: this.worldHeight - 250, width: 150, height: 20, type: 'platform' },
            { x: 400, y: this.worldHeight - 350, width: 150, height: 20, type: 'platform' },
            { x: 600, y: this.worldHeight - 200, width: 100, height: 20, type: 'platform' },
            
            // === ÁREA DO MEIO (800-1600) ===
            // Torre de plataformas
            { x: 900, y: this.worldHeight - 200, width: 120, height: 20, type: 'platform' },
            { x: 950, y: this.worldHeight - 300, width: 100, height: 20, type: 'platform' },
            { x: 900, y: this.worldHeight - 400, width: 120, height: 20, type: 'platform' },
            { x: 950, y: this.worldHeight - 500, width: 100, height: 20, type: 'platform' },
            
            // Ponte suspensa
            { x: 1200, y: this.worldHeight - 300, width: 80, height: 15, type: 'bridge' },
            { x: 1300, y: this.worldHeight - 300, width: 80, height: 15, type: 'bridge' },
            { x: 1400, y: this.worldHeight - 300, width: 80, height: 15, type: 'bridge' },
            
            // Plataformas em zigue-zague
            { x: 1100, y: this.worldHeight - 450, width: 100, height: 20, type: 'platform' },
            { x: 1250, y: this.worldHeight - 400, width: 100, height: 20, type: 'platform' },
            { x: 1400, y: this.worldHeight - 500, width: 100, height: 20, type: 'platform' },
            { x: 1550, y: this.worldHeight - 350, width: 100, height: 20, type: 'platform' },
            
            // === ÁREA FINAL (1600-3000) ===
            // Castelo/Fortaleza
            { x: 1800, y: this.worldHeight - 150, width: 40, height: 150, type: 'wall' },
            { x: 1800, y: this.worldHeight - 250, width: 200, height: 20, type: 'castle' },
            { x: 1950, y: this.worldHeight - 150, width: 40, height: 150, type: 'wall' },
            
            // Plataformas do castelo
            { x: 1820, y: this.worldHeight - 350, width: 80, height: 20, type: 'castle' },
            { x: 1900, y: this.worldHeight - 350, width: 80, height: 20, type: 'castle' },
            { x: 1860, y: this.worldHeight - 450, width: 100, height: 20, type: 'castle' },
            
            // Torres altas
            { x: 2100, y: this.worldHeight - 300, width: 60, height: 300, type: 'tower' },
            { x: 2100, y: this.worldHeight - 350, width: 120, height: 20, type: 'platform' },
            
            { x: 2300, y: this.worldHeight - 400, width: 60, height: 400, type: 'tower' },
            { x: 2300, y: this.worldHeight - 450, width: 120, height: 20, type: 'platform' },
            
            // Plataformas flutuantes finais
            { x: 2500, y: this.worldHeight - 200, width: 100, height: 20, type: 'floating' },
            { x: 2650, y: this.worldHeight - 350, width: 100, height: 20, type: 'floating' },
            { x: 2800, y: this.worldHeight - 250, width: 150, height: 20, type: 'floating' },
            
            // Plataformas secretas superiores
            { x: 500, y: this.worldHeight - 600, width: 80, height: 15, type: 'secret' },
            { x: 800, y: this.worldHeight - 700, width: 100, height: 15, type: 'secret' },
            { x: 1300, y: this.worldHeight - 650, width: 120, height: 15, type: 'secret' },
            { x: 2000, y: this.worldHeight - 600, width: 100, height: 15, type: 'secret' },
            { x: 2500, y: this.worldHeight - 700, width: 80, height: 15, type: 'secret' },
            
            // Obstáculos e desafios
            { x: 700, y: this.worldHeight - 180, width: 20, height: 80, type: 'spike' },
            { x: 1600, y: this.worldHeight - 180, width: 30, height: 80, type: 'spike' },
            { x: 2200, y: this.worldHeight - 180, width: 25, height: 80, type: 'spike' },
            
            // Plataformas móveis (simuladas como estáticas por enquanto)
            { x: 1000, y: this.worldHeight - 600, width: 80, height: 15, type: 'moving' },
            { x: 1800, y: this.worldHeight - 550, width: 100, height: 15, type: 'moving' },
            
            // Área de respawn elevada
            { x: 50, y: this.worldHeight - 400, width: 100, height: 20, type: 'spawn' }
        ];
    }
    
    createInitialHunters() {
        for (let i = 0; i < 2; i++) {
            this.createHunter();
        }
    }
    
    createHunter() {
        // Spawna caçadores em diferentes áreas baseado na posição do Hamo
        const hamoArea = Math.floor(this.hamo.x / 1000); // Divide o mundo em 3 áreas
        let spawnX, spawnY;
        
        // Spawnar próximo à área atual do Hamo, mas não muito perto
        // Distância mínima maior no início do jogo para dar tempo ao jogador
        const minDistance = this.score < 500 ? 600 : 300; // Mais longe no início
        const spawnDistance = minDistance + Math.random() * 300;
        const spawnSide = Math.random() > 0.5 ? 1 : -1;
        
        spawnX = this.hamo.x + (spawnSide * spawnDistance);
        spawnY = this.worldHeight - 200 - Math.random() * 400;
        
        // Garantir que o spawn está dentro dos limites do mundo
        spawnX = Math.max(50, Math.min(this.worldWidth - 50, spawnX));
        spawnY = Math.max(100, Math.min(this.worldHeight - 150, spawnY));
        
        // Caçadores especiais aparecem com score mais alto
        let hunterType;
        if (this.score > 2000 && Math.random() > 0.8) {
            hunterType = 'smart'; // Caçador inteligente
        } else {
            hunterType = Math.random() > 0.4 ? 'walker' : 'jumper';
        }
        
        const hunter = {
            x: spawnX,
            y: spawnY,
            width: hunterType === 'smart' ? 45 : 40,
            height: hunterType === 'smart' ? 65 : 60,
            velocityX: 0, // Será calculado pela IA
            velocityY: 0,
            speed: 2.5 + Math.random() * 1.5 + (this.score / 1000), // Velocidade aumenta com o score
            onGround: false,
            color: hunterType === 'smart' ? '#8B0000' : (spawnSide > 0 ? '#8B4513' : '#A0522D'),
            type: hunterType,
            jumpTimer: Math.random() * 30, // Randomiza o timer inicial
            direction: spawnSide > 0 ? -1 : 1,
            spawnSide: spawnSide > 0 ? 'right' : 'left',
            pathfindingTimer: 0 // Para caçadores inteligentes
        };
        this.hunters.push(hunter);
    }
    
    createPowerUp() {
        if (Math.random() > 0.6) { // Mais frequentes agora
            // Tipos de power-ups com diferentes raridades
            const powerUpTypes = [
                // Comuns (60%)
                { type: 'health', weight: 20, duration: 0 },
                { type: 'points', weight: 25, duration: 0 },
                { type: 'speedBoost', weight: 15, duration: 300 }, // 5 segundos
                
                // Raros (30%)
                { type: 'jumpBoost', weight: 12, duration: 240 }, // 4 segundos
                { type: 'shield', weight: 10, duration: 360 }, // 6 segundos
                { type: 'doubleJump', weight: 8, duration: 300 }, // 5 segundos
                
                // Épicos (10%)
                { type: 'magnet', weight: 4, duration: 180 }, // 3 segundos
                { type: 'ghostMode', weight: 3, duration: 180 }, // 3 segundos
                { type: 'fireMode', weight: 2, duration: 240 }, // 4 segundos
                { type: 'sizeBoost', weight: 1, duration: 300 } // 5 segundos
            ];
            
            // Seleção baseada em peso
            const totalWeight = powerUpTypes.reduce((sum, item) => sum + item.weight, 0);
            let random = Math.random() * totalWeight;
            let selectedType = powerUpTypes[0];
            
            for (let powerType of powerUpTypes) {
                if (random <= powerType.weight) {
                    selectedType = powerType;
                    break;
                }
                random -= powerType.weight;
            }
        }
    }
    
    createPowerUp() {
        if (Math.random() > 0.7) {
            // Apenas 5 tipos simples de power-ups
            const powerUpTypes = ['life', 'points', 'speed', 'shield', 'magnet'];
            const powerUpType = powerUpTypes[Math.floor(Math.random() * powerUpTypes.length)];
            
            const powerUp = {
                x: this.hamo.x + (Math.random() - 0.5) * 400,
                y: this.worldHeight - 200 - Math.random() * 300,
                width: 40,
                height: 40,
                velocityX: 0,
                type: powerUpType,
                collected: false,
                bounce: Math.random() * Math.PI * 2,
                pulseScale: 1
            };
            
            // Garantir que está dentro dos limites
            powerUp.x = Math.max(30, Math.min(this.worldWidth - 30, powerUp.x));
            powerUp.y = Math.max(60, Math.min(this.worldHeight - 150, powerUp.y));
            
            this.powerUps.push(powerUp);
        }
    }
    
    bindEvents() {
        document.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            
            if (e.code === 'KeyR' && !this.gameRunning) {
                this.restartGame();
            }
            
            // Prevenir comportamento padrão da tecla espaço (rolar página)
            if (e.code === 'Space') {
                e.preventDefault();
            }
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });
    }
    
    update() {
        // Sempre atualizar animação de morte, mesmo se jogo parou
        if (this.hamo.dying) {
            this.updateHamoAnimation();
        }
        
        if (!this.gameRunning) return;
        
        this.updateHamo();
        this.updateHamoAnimation(); // Nova linha para animações
        this.updateCamera();
        this.updateHunters();
        this.updatePowerUps();
        this.updateParticles();
        this.checkCollisions();
        this.spawnEnemies();
        this.updateScore();
        this.checkGameOver();
    }
    
    updateCamera() {
        // Câmera segue o Hamo suavemente
        this.camera.targetX = this.hamo.x - this.canvas.width / 2;
        this.camera.targetY = this.hamo.y - this.canvas.height / 2;
        
        // Limites da câmera para não sair do mundo
        this.camera.targetX = Math.max(0, Math.min(this.worldWidth - this.canvas.width, this.camera.targetX));
        this.camera.targetY = Math.max(0, Math.min(this.worldHeight - this.canvas.height, this.camera.targetY));
        
        // Movimento suave da câmera
        this.camera.x += (this.camera.targetX - this.camera.x) * this.camera.smoothing;
        this.camera.y += (this.camera.targetY - this.camera.y) * this.camera.smoothing;
    }
    
    updateDeathPhysics() {
        // Durante a morte, aplicar apenas gravidade e colisão com plataformas
        const gravity = 0.8;
        
        // Aplicar gravidade
        this.hamo.velocityY += gravity;
        
        // Aplicar movimento vertical (queda)
        this.hamo.y += this.hamo.velocityY;
        
        // Reduzir movimento horizontal gradualmente
        this.hamo.velocityX *= 0.9;
        this.hamo.x += this.hamo.velocityX;
        
        // Limites do mundo
        if (this.hamo.x < 0) this.hamo.x = 0;
        if (this.hamo.x + this.hamo.width > this.worldWidth) {
            this.hamo.x = this.worldWidth - this.hamo.width;
        }
        
        // Colisão com plataformas durante a morte
        this.checkDeathCollisions();
    }
    
    checkDeathCollisions() {
        // Ajustar colisão baseado na rotação
        let collisionBox = this.getRotatedCollisionBox();
        
        for (let platform of this.platforms) {
            // Verificar colisão com a bounding box rotacionada
            if (this.checkRotatedCollision(collisionBox, platform)) {
                // Se está caindo e colidiu com uma plataforma
                if (this.hamo.velocityY > 0) {
                    // Calcular posição correta baseada na rotação
                    const groundY = platform.y - this.getCollisionHeight();
                    
                    if (this.hamo.y + this.getCollisionHeight() >= platform.y) {
                        this.hamo.y = groundY;
                        this.hamo.velocityY = 0;
                        this.hamo.onGround = true;
                        
                        // Parar movimento horizontal ao tocar o chão
                        this.hamo.velocityX = 0;
                        break;
                    }
                }
            }
        }
    }
    
    getRotatedCollisionBox() {
        // Calcular bounding box baseado na rotação atual
        const centerX = this.hamo.x + this.hamo.width / 2;
        const centerY = this.hamo.y + this.hamo.height / 2;
        const rotation = (this.hamo.deathRotation * Math.PI) / 180;
        
        // Para simplificar, usar uma aproximação da bounding box rotacionada
        const cos = Math.abs(Math.cos(rotation));
        const sin = Math.abs(Math.sin(rotation));
        
        const rotatedWidth = this.hamo.width * cos + this.hamo.height * sin;
        const rotatedHeight = this.hamo.width * sin + this.hamo.height * cos;
        
        return {
            x: centerX - rotatedWidth / 2,
            y: centerY - rotatedHeight / 2,
            width: rotatedWidth,
            height: rotatedHeight
        };
    }
    
    checkRotatedCollision(rotatedBox, platform) {
        return rotatedBox.x < platform.x + platform.width &&
               rotatedBox.x + rotatedBox.width > platform.x &&
               rotatedBox.y < platform.y + platform.height &&
               rotatedBox.y + rotatedBox.height > platform.y;
    }
    
    getCollisionHeight() {
        // Retorna altura efetiva baseada na rotação
        const rotation = (this.hamo.deathRotation * Math.PI) / 180;
        const cos = Math.abs(Math.cos(rotation));
        const sin = Math.abs(Math.sin(rotation));
        return this.hamo.width * sin + this.hamo.height * cos;
    }
    
    updateHamo() {
        // Se está morrendo, aplicar física específica de morte
        if (this.hamo.dying) {
            this.updateDeathPhysics();
            return; // Não processar movimento normal
        }
        
        // Calcular velocidade base com power-ups
        let currentSpeed = this.hamo.speed + (this.hamo.speedBoost > 0 ? 3 : 0);
        let currentJumpPower = this.hamo.jumpPower + (this.hamo.jumpBoost > 0 ? 7 : 0);
        
        // Movimento horizontal
        if (this.keys['ArrowLeft']) {
            this.hamo.velocityX = -currentSpeed;
            this.hamo.direction = -1;
        } else if (this.keys['ArrowRight']) {
            this.hamo.velocityX = currentSpeed;
            this.hamo.direction = 1;
        } else {
            this.hamo.velocityX *= 0.8; // Fricção
        }
        
        // Pulo normal
        if (this.keys['ArrowUp'] && this.hamo.onGround) {
            this.hamo.velocityY = -currentJumpPower;
            this.hamo.onGround = false;
            this.hamo.hasDoubleJumped = false;
            this.createJumpParticles();
            this.playSound('jump');
        }
        
        // Pulo duplo
        if (this.keys['ArrowUp'] && !this.hamo.onGround && !this.hamo.hasDoubleJumped && this.hamo.doubleJump > 0) {
            this.hamo.velocityY = -currentJumpPower * 0.8;
            this.hamo.hasDoubleJumped = true;
            this.createDoubleJumpParticles();
            this.playSound('jump');
        }
        
        // Super pulo/ataque (ESPAÇO)
        if (this.keys['Space'] && this.hamo.onGround && this.hamo.superJumpCooldown <= 0) {
            this.hamo.velocityY = -(this.hamo.superJumpPower + (this.hamo.jumpBoost > 0 ? 5 : 0));
            this.hamo.onGround = false;
            this.hamo.attacking = true;
            this.hamo.superJumpCooldown = 60; // 1 segundo de cooldown
            this.createSuperJumpParticles();
            this.playSound('superJump');
        }
        
        // Gravidade (reduzida no modo fantasma)
        let gravity = this.hamo.ghostMode > 0 ? 0.4 : 0.8;
        this.hamo.velocityY += gravity;
        
        // Aplicar velocidade
        this.hamo.x += this.hamo.velocityX;
        this.hamo.y += this.hamo.velocityY;
        
        // Limites da tela (mundo expandido)
        if (this.hamo.x < 0) this.hamo.x = 0;
        if (this.hamo.x + this.hamo.width > this.worldWidth) {
            this.hamo.x = this.worldWidth - this.hamo.width;
        }
        
        // Verificar colisão com todas as plataformas
        this.hamo.onGround = false;
        
        // Verificar colisão com todas as plataformas (incluindo o chão)
        for (let platform of this.platforms) {
            // Verificar se há sobreposição horizontal
            if (this.hamo.x < platform.x + platform.width &&
                this.hamo.x + this.hamo.width > platform.x) {
                
                // Verificar colisão de cima (pousando na plataforma)
                if (this.hamo.velocityY > 0 && // Está caindo
                    this.hamo.y < platform.y && // Vem de cima
                    this.hamo.y + this.hamo.height >= platform.y && // Está tocando
                    this.hamo.y + this.hamo.height <= platform.y + 20) { // Margem um pouco maior
                    
                    this.hamo.y = platform.y - this.hamo.height;
                    this.hamo.velocityY = 0;
                    this.hamo.onGround = true;
                    
                    if (this.hamo.attacking) {
                        this.hamo.attacking = false;
                        this.createLandingParticles();
                        this.playSound('landing');
                    }
                    break; // Parar após pousar
                }
                
                // Colisão lateral com paredes e torres
                if (platform.type === 'wall' || platform.type === 'tower') {
                    // Verificar colisão lateral
                    if (this.hamo.y + this.hamo.height > platform.y &&
                        this.hamo.y < platform.y + platform.height) {
                        
                        // Empurrar para fora da parede
                        if (this.hamo.velocityX > 0) {
                            // Movendo para direita, colidir com lado esquerdo da parede
                            this.hamo.x = platform.x - this.hamo.width;
                        } else if (this.hamo.velocityX < 0) {
                            // Movendo para esquerda, colidir com lado direito da parede
                            this.hamo.x = platform.x + platform.width;
                        }
                        this.hamo.velocityX = 0;
                    }
                }
                
                // Colisão com espinhos causa dano
                if (platform.type === 'spike' && this.hamo.invulnerable <= 0) {
                    if (this.hamo.y + this.hamo.height > platform.y &&
                        this.hamo.y < platform.y + platform.height) {
                        this.loseLife();
                        this.createHitParticles(this.hamo.x + this.hamo.width/2, this.hamo.y + this.hamo.height/2);
                    }
                }
            }
        }
        
        // Atualizar power-ups ativos
        this.updatePowerUpTimers();
        
        // Reduzir cooldowns
        if (this.hamo.superJumpCooldown > 0) {
            this.hamo.superJumpCooldown--;
        }
        
        // Atualizar timers dos power-ups
        if (this.hamo.speedBoost > 0) this.hamo.speedBoost--;
        if (this.hamo.shield > 0) this.hamo.shield--;
        if (this.hamo.magnet > 0) this.hamo.magnet--;
        
        // Reduzir invulnerabilidade
        if (this.hamo.invulnerable > 0) {
            this.hamo.invulnerable--;
        }
        
        // Morte por queda
        if (this.hamo.y > this.worldHeight) {
            this.loseLife();
        }
    }
    
    updatePowerUpTimers() {
        // Reduzir duração dos power-ups ativos
        if (this.hamo.speedBoost > 0) this.hamo.speedBoost--;
        if (this.hamo.jumpBoost > 0) this.hamo.jumpBoost--;
        if (this.hamo.shield > 0) this.hamo.shield--;
        if (this.hamo.magnet > 0) this.hamo.magnet--;
        if (this.hamo.doubleJump > 0) this.hamo.doubleJump--;
        if (this.hamo.ghostMode > 0) this.hamo.ghostMode--;
        if (this.hamo.fireMode > 0) this.hamo.fireMode--;
        
        // Size boost - restaurar tamanho original quando acaba
        if (this.hamo.sizeBoost > 0) {
            this.hamo.sizeBoost--;
            if (this.hamo.sizeBoost <= 0) {
                this.hamo.width = this.hamo.originalWidth;
                this.hamo.height = this.hamo.originalHeight;
            }
        }
    }
    
    updateHunters() {
        for (let i = this.hunters.length - 1; i >= 0; i--) {
            let hunter = this.hunters[i];
            
            // IA dos caçadores - agora eles perseguem o Hamo!
            const distanceToHamo = this.hamo.x - hunter.x;
            const verticalDistanceToHamo = this.hamo.y - hunter.y;
            const totalDistance = Math.sqrt(distanceToHamo * distanceToHamo + verticalDistanceToHamo * verticalDistanceToHamo);
            
            if (hunter.type === 'walker') {
                // Caçadores caminhantes seguem horizontalmente
                if (distanceToHamo > 0) {
                    hunter.velocityX = Math.min(hunter.speed, Math.abs(distanceToHamo) / 20);
                    hunter.direction = 1;
                } else {
                    hunter.velocityX = -Math.min(hunter.speed, Math.abs(distanceToHamo) / 20);
                    hunter.direction = -1;
                }
                hunter.x += hunter.velocityX;
                
                // Se estiver muito longe verticalmente, tenta pular
                if (Math.abs(verticalDistanceToHamo) > 50 && hunter.onGround && Math.abs(distanceToHamo) < 100) {
                    hunter.velocityY = -10;
                    hunter.onGround = false;
                }
                
            } else if (hunter.type === 'jumper') {
                // Caçadores saltadores são mais agressivos
                hunter.jumpTimer++;
                
                // Movimento horizontal em direção ao Hamo
                if (distanceToHamo > 0) {
                    hunter.velocityX = Math.min(hunter.speed * 1.2, Math.abs(distanceToHamo) / 15);
                    hunter.direction = 1;
                } else {
                    hunter.velocityX = -Math.min(hunter.speed * 1.2, Math.abs(distanceToHamo) / 15);
                    hunter.direction = -1;
                }
                hunter.x += hunter.velocityX;
                
                // Pula mais frequentemente quando perto do Hamo
                const jumpFrequency = totalDistance < 150 ? 30 : 60;
                
                if (hunter.jumpTimer > jumpFrequency && hunter.onGround) {
                    hunter.velocityY = -14;
                    hunter.jumpTimer = 0;
                    hunter.onGround = false;
                }
                
            } else if (hunter.type === 'smart') {
                // Caçadores inteligentes usam pathfinding básico
                hunter.pathfindingTimer++;
                
                // Movimento mais preciso em direção ao Hamo
                const moveSpeed = hunter.speed * 1.4;
                if (Math.abs(distanceToHamo) > 5) {
                    hunter.velocityX = (distanceToHamo > 0 ? moveSpeed : -moveSpeed);
                    hunter.direction = distanceToHamo > 0 ? 1 : -1;
                } else {
                    hunter.velocityX *= 0.5; // Desacelera quando muito próximo
                }
                hunter.x += hunter.velocityX;
                
                // Pula estrategicamente para alcançar o Hamo
                if (hunter.onGround && hunter.pathfindingTimer > 20) {
                    if (verticalDistanceToHamo < -30 || (Math.abs(distanceToHamo) < 120 && Math.abs(verticalDistanceToHamo) > 30)) {
                        hunter.velocityY = -16; // Pulo mais forte
                        hunter.onGround = false;
                        hunter.pathfindingTimer = 0;
                    }
                }
            }
            
            // Gravidade
            hunter.velocityY += 0.8;
            hunter.y += hunter.velocityY;
            
            // Verificar colisão com plataformas
            hunter.onGround = false;
            for (let platform of this.platforms) {
                // Verificar se há sobreposição horizontal
                if (hunter.x < platform.x + platform.width &&
                    hunter.x + hunter.width > platform.x) {
                    
                    // Verificar colisão de cima (pousando na plataforma)
                    if (hunter.velocityY > 0 && // Está caindo
                        hunter.y < platform.y && // Vem de cima
                        hunter.y + hunter.height >= platform.y && // Está tocando
                        hunter.y + hunter.height <= platform.y + 20) { // Margem
                        
                        hunter.y = platform.y - hunter.height;
                        hunter.velocityY = 0;
                        hunter.onGround = true;
                        break;
                    }
                    
                    // Colisão lateral com paredes e torres
                    if (platform.type === 'wall' || platform.type === 'tower') {
                        if (hunter.y + hunter.height > platform.y &&
                            hunter.y < platform.y + platform.height) {
                            
                            // Empurrar para fora da parede
                            if (hunter.velocityX > 0) {
                                hunter.x = platform.x - hunter.width;
                            } else if (hunter.velocityX < 0) {
                                hunter.x = platform.x + platform.width;
                            }
                            hunter.velocityX = 0;
                        }
                    }
                }
            }
            
            // Remover caçadores que saíram muito longe do Hamo (otimização)
            const distanceFromHamo = Math.abs(hunter.x - this.hamo.x);
            if (distanceFromHamo > 1000 || hunter.y > this.worldHeight) {
                this.hunters.splice(i, 1);
            }
        }
    }
    
    updatePowerUps() {
        for (let i = this.powerUps.length - 1; i >= 0; i--) {
            let powerUp = this.powerUps[i];
            
            // Efeito do ímã - atrai power-ups próximos
            if (this.hamo.magnet > 0) {
                const distanceToHamo = Math.sqrt(
                    Math.pow(powerUp.x - this.hamo.x, 2) + 
                    Math.pow(powerUp.y - this.hamo.y, 2)
                );
                
                if (distanceToHamo < 150) { // Raio do ímã
                    const attractionForce = 3;
                    const directionX = (this.hamo.x - powerUp.x) / distanceToHamo;
                    const directionY = (this.hamo.y - powerUp.y) / distanceToHamo;
                    
                    powerUp.x += directionX * attractionForce;
                    powerUp.y += directionY * attractionForce;
                }
            }
            
            // Adicionar gravidade aos power-ups
            if (!powerUp.velocityY) {
                powerUp.velocityY = 0;
            }
            powerUp.velocityY += 0.3; // Gravidade leve
            
            // Verificar colisão com plataformas
            let powerUpOnGround = false;
            for (let platform of this.platforms) {
                // Verificar se há sobreposição horizontal
                if (powerUp.x < platform.x + platform.width &&
                    powerUp.x + powerUp.width > platform.x) {
                    
                    // Verificar colisão de cima (pousando na plataforma)
                    if (powerUp.velocityY > 0 && // Está caindo
                        powerUp.y < platform.y && // Vem de cima
                        powerUp.y + powerUp.height >= platform.y && // Está tocando
                        powerUp.y + powerUp.height <= platform.y + 15) { // Margem
                        
                        powerUp.y = platform.y - powerUp.height;
                        powerUp.velocityY = 0;
                        powerUpOnGround = true;
                        break;
                    }
                }
            }
            
            // Aplicar movimento vertical
            powerUp.y += powerUp.velocityY;
            
            powerUp.bounce += 0.1;
            
            // Efeito de flutuação apenas se estiver em uma plataforma
            if (powerUpOnGround) {
                powerUp.y += Math.sin(powerUp.bounce) * 1;
            }
            
            powerUp.pulseScale = 1 + Math.sin(powerUp.bounce * 2) * 0.1;
            
            // Remover power-ups que estão muito longe do Hamo
            const distanceFromHamo = Math.abs(powerUp.x - this.hamo.x);
            if (distanceFromHamo > 800) {
                this.powerUps.splice(i, 1);
            }
        }
    }
    
    updateParticles() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            let particle = this.particles[i];
            
            particle.x += particle.velocityX;
            particle.y += particle.velocityY;
            particle.velocityY += 0.3;
            particle.life--;
            particle.alpha = particle.life / particle.maxLife;
            
            if (particle.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }
    
    checkCollisions() {
        // Colisão Hamo vs Caçadores
        for (let i = this.hunters.length - 1; i >= 0; i--) {
            let hunter = this.hunters[i];
            
            if (this.checkCollision(this.hamo, hunter)) {
                // Se Hamo está atacando (descendo com super pulo), destrói o caçador
                if (this.hamo.attacking && this.hamo.velocityY > 0) {
                    // Destruir caçador
                    this.hunters.splice(i, 1);
                    this.score += 200; // Bonus por destruir caçador
                    this.createDestroyParticles(hunter.x + hunter.width/2, hunter.y + hunter.height/2);
                    this.playSound('destroy');
                    
                    // Pequeno pulo após destruir
                    this.hamo.velocityY = -8;
                    continue;
                }
                
                // Se tem escudo ativo, só perde o escudo
                if (this.hamo.shield > 0) {
                    this.hamo.shield = 0; // Remove o escudo
                    this.hunters.splice(i, 1); // Remove o caçador também
                    this.createShieldBreakParticles();
                    continue;
                }
                
                // Se não está atacando e não tem escudo, perde vida
                if (this.hamo.invulnerable <= 0) {
                    this.loseLife();
                    this.createHitParticles(this.hamo.x + this.hamo.width/2, this.hamo.y + this.hamo.height/2);
                    this.playSound('hit');
                    break;
                }
            }
        }
        
        // Colisão Hamo vs Power-ups
        for (let i = this.powerUps.length - 1; i >= 0; i--) {
            let powerUp = this.powerUps[i];
            if (this.checkCollision(this.hamo, powerUp)) {
                switch (powerUp.type) {
                    case 'life':
                        this.lives++;
                        this.createPowerUpParticles(powerUp.x, powerUp.y, '#FF69B4');
                        this.playSound('powerUp');
                        break;
                    case 'points':
                        this.score += 100;
                        this.createPowerUpParticles(powerUp.x, powerUp.y, '#FFD700');
                        this.playSound('powerUp');
                        break;
                    case 'speed':
                        this.hamo.speedBoost = 300; // 5 segundos
                        this.createPowerUpParticles(powerUp.x, powerUp.y, '#00FF00');
                        this.playSound('powerUp');
                        break;
                    case 'shield':
                        this.hamo.shield = 360; // 6 segundos
                        this.createPowerUpParticles(powerUp.x, powerUp.y, '#00BFFF');
                        this.playSound('powerUp');
                        break;
                    case 'magnet':
                        this.hamo.magnet = 240; // 4 segundos
                        this.createPowerUpParticles(powerUp.x, powerUp.y, '#FF1493');
                        this.playSound('powerUp');
                        break;
                }
                this.powerUps.splice(i, 1);
            }
        }
    }
    
    checkCollision(rect1, rect2) {
        return rect1.x < rect2.x + rect2.width &&
               rect1.x + rect1.width > rect2.x &&
               rect1.y < rect2.y + rect2.height &&
               rect1.y + rect1.height > rect2.y;
    }
    
    checkPlatformCollision(rect, platform) {
        return rect.x < platform.x + platform.width &&
               rect.x + rect.width > platform.x &&
               rect.y < platform.y + platform.height &&
               rect.y + rect.height > platform.y;
    }
    
    spawnEnemies() {
        this.hunterSpawnTimer++;
        // Frequência aumenta com o score - fica mais difícil!
        // Delay inicial maior para dar tempo ao jogador se acostumar
        const baseFrequency = this.score < 500 ? 300 : 180; // 5 segundos iniciais, depois 3 segundos
        const spawnFrequency = Math.max(60, baseFrequency - (this.score / 200));
        
        if (this.hunterSpawnTimer > spawnFrequency) {
            this.createHunter();
            this.hunterSpawnTimer = 0;
            
            // Chance de spawnar um segundo caçador quando o score é alto
            if (this.score > 1500 && Math.random() > 0.7) {
                setTimeout(() => this.createHunter(), 500);
            }
        }
        
        this.powerUpSpawnTimer++;
        if (this.powerUpSpawnTimer > 300) {
            this.createPowerUp();
            this.powerUpSpawnTimer = 0;
        }
    }
    
    updateScore() {
        this.score += 1;
    }
    
    loseLife() {
        this.lives--;
        this.hamo.invulnerable = 120; // 2 segundos de invulnerabilidade
        
        if (this.lives <= 0) {
            this.gameOver();
        }
    }
    
    gameOver() {
        // Ativar estado de morte e iniciar rotação + queda
        this.hamo.dying = true;
        this.hamo.deathRotation = 0; // Resetar rotação para começar do 0
        this.hamo.deathFalling = true; // Ativar queda
        this.hamo.onGround = false; // Permitir que caia
        
        // Se não está no ar, dar um pequeno impulso para cair melhor
        if (Math.abs(this.hamo.velocityY) < 2) {
            this.hamo.velocityY = 2; // Pequeno impulso para baixo
        }
        
        // Pequeno delay para mostrar a animação completa de morte + rotação + queda
        setTimeout(() => {
            this.gameRunning = false;
            
            // Verificar se é novo recorde
            const isNewRecord = this.checkAndUpdateHighScore();
            
            // Mostrar tela de game over
            document.getElementById('gameOver').style.display = 'block';
            document.getElementById('finalScore').textContent = this.score;
            
            // Mostrar informações do highscore
            const highScoreElement = document.getElementById('highScore');
            const newRecordElement = document.getElementById('newRecord');
            
            if (highScoreElement) {
                highScoreElement.textContent = this.highScore;
            }
            
            if (newRecordElement) {
                if (isNewRecord && this.score > 0) {
                    newRecordElement.style.display = 'block';
                    newRecordElement.textContent = '🏆 NOVO RECORDE! 🏆';
                    console.log('🎉 NOVO RECORDE ALCANÇADO!', this.score);
                } else {
                    newRecordElement.style.display = 'none';
                }
            }
            
            // Parar música de fundo e tocar som de game over
            if (this.sounds.backgroundMusic) {
                this.sounds.backgroundMusic.pause();
            }
            this.playSound('gameOver');
        }, 2500); // 2.5 segundos para mostrar animação completa (rotação + queda)
    }
    
    checkGameOver() {
        if (this.lives <= 0 && this.gameRunning) {
            this.gameOver();
        }
    }
    
    createJumpParticles() {
        for (let i = 0; i < 8; i++) {
            this.particles.push({
                x: this.hamo.x + this.hamo.width/2,
                y: this.hamo.y + this.hamo.height,
                velocityX: (Math.random() - 0.5) * 6,
                velocityY: Math.random() * -3,
                life: 30,
                maxLife: 30,
                color: '#8B4513',
                alpha: 1,
                size: 3
            });
        }
    }
    
    createSuperJumpParticles() {
        for (let i = 0; i < 15; i++) {
            this.particles.push({
                x: this.hamo.x + this.hamo.width/2,
                y: this.hamo.y + this.hamo.height,
                velocityX: (Math.random() - 0.5) * 10,
                velocityY: Math.random() * -6,
                life: 40,
                maxLife: 40,
                color: '#FFD700',
                alpha: 1,
                size: 4
            });
        }
    }
    
    createLandingParticles() {
        for (let i = 0; i < 12; i++) {
            this.particles.push({
                x: this.hamo.x + this.hamo.width/2,
                y: this.hamo.y + this.hamo.height,
                velocityX: (Math.random() - 0.5) * 8,
                velocityY: Math.random() * -4,
                life: 25,
                maxLife: 25,
                color: '#CD853F',
                alpha: 1,
                size: 3
            });
        }
    }
    
    createDestroyParticles(x, y) {
        for (let i = 0; i < 20; i++) {
            this.particles.push({
                x: x,
                y: y,
                velocityX: (Math.random() - 0.5) * 12,
                velocityY: (Math.random() - 0.5) * 12,
                life: 35,
                maxLife: 35,
                color: ['#FF4500', '#FF6347', '#FFD700'][Math.floor(Math.random() * 3)],
                alpha: 1,
                size: 5
            });
        }
    }
    
    createHitParticles(x, y) {
        for (let i = 0; i < 15; i++) {
            this.particles.push({
                x: x,
                y: y,
                velocityX: (Math.random() - 0.5) * 8,
                velocityY: (Math.random() - 0.5) * 8,
                life: 20,
                maxLife: 20,
                color: '#FF0000',
                alpha: 1,
                size: 4
            });
        }
    }
    
    createPowerUpParticles(x, y, color) {
        for (let i = 0; i < 12; i++) {
            this.particles.push({
                x: x,
                y: y,
                velocityX: (Math.random() - 0.5) * 6,
                velocityY: (Math.random() - 0.5) * 6,
                life: 25,
                maxLife: 25,
                color: color,
                alpha: 1,
                size: 3
            });
        }
    }
    
    createShieldBreakParticles() {
        for (let i = 0; i < 15; i++) {
            this.particles.push({
                x: this.hamo.x + this.hamo.width/2,
                y: this.hamo.y + this.hamo.height/2,
                velocityX: (Math.random() - 0.5) * 8,
                velocityY: (Math.random() - 0.5) * 8,
                life: 20,
                maxLife: 20,
                color: '#00BFFF',
                alpha: 1,
                size: 4
            });
        }
    }
    
    render() {
        // Limpar canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Aplicar transformação da câmera
        this.ctx.save();
        this.ctx.translate(-this.camera.x, -this.camera.y);
        
        // Desenhar background expandido
        this.renderBackground();
        
        // Desenhar plataformas
        this.renderPlatforms();
        
        // Desenhar Hamo
        this.renderHamo();
        
        // Desenhar caçadores
        this.renderHunters();
        
        // Desenhar power-ups
        this.renderPowerUps();
        
        // Desenhar partículas
        this.renderParticles();
        
        // Restaurar transformação
        this.ctx.restore();
        
        // Desenhar UI (sem transformação de câmera)
        this.renderUI();
    }
    
    renderBackground() {
        // Céu com gradiente
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.worldHeight);
        gradient.addColorStop(0, '#87CEEB');
        gradient.addColorStop(0.7, '#98FB98');
        gradient.addColorStop(1, '#90EE90');
        
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.worldWidth, this.worldHeight);
        
        // Nuvens decorativas
        this.renderClouds();
        
        // Montanhas no fundo
        this.renderMountains();
    }
    
    renderClouds() {
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        
        // Nuvens estáticas baseadas na posição
        const clouds = [
            { x: 300, y: 100, size: 60 },
            { x: 700, y: 150, size: 80 },
            { x: 1200, y: 80, size: 70 },
            { x: 1800, y: 120, size: 90 },
            { x: 2400, y: 100, size: 65 },
            { x: 2800, y: 140, size: 75 }
        ];
        
        for (let cloud of clouds) {
            // Desenha nuvem simples com círculos
            this.ctx.beginPath();
            this.ctx.arc(cloud.x, cloud.y, cloud.size * 0.5, 0, Math.PI * 2);
            this.ctx.arc(cloud.x + cloud.size * 0.3, cloud.y, cloud.size * 0.7, 0, Math.PI * 2);
            this.ctx.arc(cloud.x + cloud.size * 0.6, cloud.y, cloud.size * 0.4, 0, Math.PI * 2);
            this.ctx.fill();
        }
    }
    
    renderMountains() {
        this.ctx.fillStyle = 'rgba(105, 105, 105, 0.6)';
        this.ctx.beginPath();
        this.ctx.moveTo(0, this.worldHeight - 200);
        this.ctx.lineTo(500, this.worldHeight - 400);
        this.ctx.lineTo(800, this.worldHeight - 300);
        this.ctx.lineTo(1200, this.worldHeight - 500);
        this.ctx.lineTo(1600, this.worldHeight - 350);
        this.ctx.lineTo(2000, this.worldHeight - 450);
        this.ctx.lineTo(2500, this.worldHeight - 300);
        this.ctx.lineTo(3000, this.worldHeight - 250);
        this.ctx.lineTo(3000, this.worldHeight);
        this.ctx.lineTo(0, this.worldHeight);
        this.ctx.closePath();
        this.ctx.fill();
    }
    
    renderPlatforms() {
        for (let platform of this.platforms) {
            // Diferentes estilos baseados no tipo
            switch (platform.type) {
                case 'ground':
                    this.ctx.fillStyle = '#8B4513';
                    this.ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
                    // Textura de grama
                    this.ctx.fillStyle = '#228B22';
                    this.ctx.fillRect(platform.x, platform.y, platform.width, 10);
                    break;
                    
                case 'platform':
                    this.ctx.fillStyle = '#654321';
                    this.ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
                    this.ctx.fillStyle = '#A0522D';
                    this.ctx.fillRect(platform.x, platform.y, platform.width, 3);
                    break;
                    
                case 'bridge':
                    this.ctx.fillStyle = '#DEB887';
                    this.ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
                    // Cordas da ponte
                    this.ctx.strokeStyle = '#8B4513';
                    this.ctx.lineWidth = 2;
                    this.ctx.beginPath();
                    this.ctx.moveTo(platform.x, platform.y + 5);
                    this.ctx.lineTo(platform.x + platform.width, platform.y + 5);
                    this.ctx.stroke();
                    break;
                    
                case 'castle':
                    this.ctx.fillStyle = '#696969';
                    this.ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
                    this.ctx.fillStyle = '#A9A9A9';
                    this.ctx.fillRect(platform.x, platform.y, platform.width, 4);
                    break;
                    
                case 'tower':
                    this.ctx.fillStyle = '#2F4F4F';
                    this.ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
                    // Janelas da torre
                    this.ctx.fillStyle = '#FFD700';
                    for (let i = 0; i < platform.height; i += 80) {
                        this.ctx.fillRect(platform.x + 15, platform.y + i + 20, 8, 12);
                        this.ctx.fillRect(platform.x + platform.width - 23, platform.y + i + 20, 8, 12);
                    }
                    break;
                    
                case 'wall':
                    this.ctx.fillStyle = '#696969';
                    this.ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
                    break;
                    
                case 'floating':
                    this.ctx.fillStyle = '#9370DB';
                    this.ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
                    // Efeito mágico
                    this.ctx.fillStyle = 'rgba(147, 112, 219, 0.5)';
                    this.ctx.fillRect(platform.x - 5, platform.y - 5, platform.width + 10, platform.height + 10);
                    break;
                    
                case 'secret':
                    this.ctx.fillStyle = '#32CD32';
                    this.ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
                    // Brilho especial
                    this.ctx.strokeStyle = '#00FF00';
                    this.ctx.lineWidth = 2;
                    this.ctx.strokeRect(platform.x - 2, platform.y - 2, platform.width + 4, platform.height + 4);
                    break;
                    
                case 'spike':
                    this.ctx.fillStyle = '#FF0000';
                    this.ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
                    // Desenhar espinhos
                    this.ctx.fillStyle = '#8B0000';
                    for (let i = 0; i < platform.width; i += 8) {
                        this.ctx.beginPath();
                        this.ctx.moveTo(platform.x + i, platform.y + platform.height);
                        this.ctx.lineTo(platform.x + i + 4, platform.y);
                        this.ctx.lineTo(platform.x + i + 8, platform.y + platform.height);
                        this.ctx.fill();
                    }
                    break;
                    
                case 'moving':
                    this.ctx.fillStyle = '#FF69B4';
                    this.ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
                    break;
                    
                case 'spawn':
                    this.ctx.fillStyle = '#00CED1';
                    this.ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
                    // Indicador de spawn
                    this.ctx.fillStyle = '#20B2AA';
                    this.ctx.fillRect(platform.x, platform.y, platform.width, 5);
                    break;
                    
                default:
                    this.ctx.fillStyle = '#654321';
                    this.ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
            }
        }
    }
    
    renderHamo() {
        this.ctx.save();
        
        // Efeito de piscar quando invulnerável
        if (this.hamo.invulnerable > 0 && Math.floor(this.hamo.invulnerable / 5) % 2) {
            this.ctx.globalAlpha = 0.5;
        }
        
        // Efeito visual quando atacando
        if (this.hamo.attacking) {
            this.ctx.shadowColor = '#FFD700';
            this.ctx.shadowBlur = 10;
        }
        
        // Efeito do escudo (desenhar antes das transformações)
        if (this.hamo.shield > 0) {
            this.ctx.shadowColor = '#00BFFF';
            this.ctx.shadowBlur = 15;
            this.ctx.strokeStyle = 'rgba(0, 191, 255, 0.7)';
            this.ctx.lineWidth = 3;
            this.ctx.beginPath();
            this.ctx.arc(this.hamo.x + this.hamo.width/2, this.hamo.y + this.hamo.height/2, 50, 0, Math.PI * 2);
            this.ctx.stroke();
        }
        
        // Efeito de velocidade
        if (this.hamo.speedBoost > 0) {
            this.ctx.shadowColor = '#00FF00';
            this.ctx.shadowBlur = 8;
        }
        
        // Centro do personagem para rotações e espelhamento
        const centerX = this.hamo.x + this.hamo.width/2;
        const centerY = this.hamo.y + this.hamo.height/2;
        
        // Mover para o centro do personagem
        this.ctx.translate(centerX, centerY);
        
        // Aplicar rotação de morte PRIMEIRO
        if (this.hamo.dying) {
            const rotationRadians = (this.hamo.deathRotation * Math.PI) / 180;
            this.ctx.rotate(rotationRadians);
        }
        
        // Espelhar Hamo baseado na direção
        if (this.hamo.direction === -1) {
            this.ctx.scale(-1, 1);
        }
        
        // Voltar para posição relativa ao centro
        const drawX = -this.hamo.width/2;
        const drawY = -this.hamo.height/2;
        
        // Tentar usar sprite primeiro, se não conseguir usar desenho padrão
        const currentSprite = this.hamoSprites[this.hamo.currentState];
        const spriteLoaded = currentSprite && currentSprite.img && currentSprite.img.complete && currentSprite.img.naturalWidth > 0;
        
        if (spriteLoaded) {
            // Calcular posição do frame atual na sprite sheet
            const frameWidth = 60; // Largura padrão de cada frame
            const frameHeight = 80; // Altura padrão
            const currentFrame = currentSprite.currentFrame;
            const sourceX = currentFrame * frameWidth;
            const sourceY = 0;
            
            // Desenhar sprite sheet (cortando o frame correto)
            this.ctx.drawImage(
                currentSprite.img,        // Imagem source
                sourceX, sourceY,         // Posição na sprite sheet (x, y)
                frameWidth, frameHeight,  // Tamanho do frame na sprite sheet
                drawX, drawY,             // Posição no canvas
                this.hamo.width, this.hamo.height  // Tamanho no canvas
            );
            
            // Debug: mostrar info da animação (remover em produção)
            if (currentSprite.frames > 1) {
                this.ctx.fillStyle = 'rgba(0,0,0,0.5)';
                this.ctx.font = '8px Arial';
                this.ctx.fillText(`Frame: ${currentFrame+1}/${currentSprite.frames}`, drawX, drawY - 5);
            }
        } else {
            // Fallback: desenhar Hamo padrão se sprite não carregou
            // Corpo do Hamo (muda cor quando atacando ou com power-ups)
            let bodyColor = this.hamo.color;
            if (this.hamo.dying) bodyColor = '#FF0000'; // Vermelho quando morrendo
            else if (this.hamo.attacking) bodyColor = '#FF8C00';
            else if (this.hamo.speedBoost > 0) bodyColor = '#32CD32';
            
            this.ctx.fillStyle = bodyColor;
            this.ctx.fillRect(drawX + 10, drawY + 20, this.hamo.width - 20, this.hamo.height - 20);
            
            // Cabeça
            this.ctx.fillStyle = '#DEB887';
            this.ctx.beginPath();
            this.ctx.arc(drawX + this.hamo.width/2, drawY + 25, 20, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Orelhas
            this.ctx.fillStyle = this.hamo.attacking ? '#FF8C00' : '#D2691E';
            this.ctx.beginPath();
            this.ctx.arc(drawX + this.hamo.width/2 - 15, drawY + 10, 8, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.beginPath();
            this.ctx.arc(drawX + this.hamo.width/2 + 15, drawY + 10, 8, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Olhos (ficam vermelhos quando atacando)
            this.ctx.fillStyle = this.hamo.attacking ? '#FF0000' : '#000000';
            this.ctx.beginPath();
            this.ctx.arc(drawX + this.hamo.width/2 - 8, drawY + 20, 3, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.beginPath();
            this.ctx.arc(drawX + this.hamo.width/2 + 8, drawY + 20, 3, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Nariz
            this.ctx.fillStyle = '#FF69B4';
            this.ctx.beginPath();
            this.ctx.arc(drawX + this.hamo.width/2, drawY + 28, 2, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Pernas
            this.ctx.fillStyle = bodyColor;
            this.ctx.fillRect(drawX + 15, drawY + this.hamo.height - 15, 10, 15);
            this.ctx.fillRect(drawX + this.hamo.width - 25, drawY + this.hamo.height - 15, 10, 15);
        }
        
        this.ctx.restore();
    }
    
    renderHunters() {
        for (let hunter of this.hunters) {
            this.ctx.save();
            
            // Definir posição base para desenhar
            let drawX = hunter.x;
            let drawY = hunter.y;
            
            // Espelhar caçador baseado na direção
            if (hunter.direction === -1) {
                this.ctx.translate(hunter.x + hunter.width/2, hunter.y + hunter.height/2);
                this.ctx.scale(-1, 1);
                this.ctx.translate(-hunter.width/2, -hunter.height/2);
                drawX = 0;
                drawY = 0;
            }
            
            // Corpo do caçador
            this.ctx.fillStyle = hunter.color;
            this.ctx.fillRect(drawX + 5, drawY + 15, hunter.width - 10, hunter.height - 15);
            
            // Cabeça
            this.ctx.fillStyle = hunter.type === 'smart' ? '#FFE4E1' : '#F4A460';
            this.ctx.beginPath();
            this.ctx.arc(drawX + hunter.width/2, drawY + 15, 12, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Chapéu (diferente para cada tipo)
            if (hunter.type === 'smart') {
                // Caçador inteligente tem capacete militar
                this.ctx.fillStyle = '#2F2F2F';
                this.ctx.fillRect(drawX + hunter.width/2 - 12, drawY + 2, 24, 10);
                this.ctx.fillStyle = '#556B2F';
                this.ctx.fillRect(drawX + hunter.width/2 - 15, drawY + 8, 30, 4);
            } else {
                // Caçadores normais têm chapéu simples
                this.ctx.fillStyle = '#2F4F4F';
                this.ctx.fillRect(drawX + hunter.width/2 - 10, drawY + 2, 20, 8);
                this.ctx.fillRect(drawX + hunter.width/2 - 15, drawY + 8, 30, 3);
            }
            
            // Olhos (vermelhos para mostrar agressividade)
            this.ctx.fillStyle = hunter.type === 'smart' ? '#FF4500' : '#FF0000';
            this.ctx.beginPath();
            this.ctx.arc(drawX + hunter.width/2 - 5, drawY + 12, 2, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.beginPath();
            this.ctx.arc(drawX + hunter.width/2 + 5, drawY + 12, 2, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Arma (diferente para caçador inteligente)
            this.ctx.fillStyle = '#2F2F2F';
            if (hunter.type === 'smart') {
                // Rifle mais avançado
                this.ctx.fillRect(drawX + hunter.width - 10, drawY + 22, 15, 4);
                this.ctx.fillRect(drawX + hunter.width - 8, drawY + 20, 3, 8);
            } else {
                // Rifle simples
                this.ctx.fillRect(drawX + hunter.width - 8, drawY + 25, 12, 3);
            }
            
            // Indicador visual para caçadores inteligentes (luz vermelha no capacete)
            if (hunter.type === 'smart') {
                this.ctx.fillStyle = '#FF0000';
                this.ctx.beginPath();
                this.ctx.arc(drawX + hunter.width/2, drawY + 6, 2, 0, Math.PI * 2);
                this.ctx.fill();
            }
            
            this.ctx.restore();
        }
    }
    
    renderPowerUps() {
        for (let powerUp of this.powerUps) {
            this.ctx.save();
            this.ctx.translate(powerUp.x + powerUp.width/2, powerUp.y + powerUp.height/2);
            this.ctx.rotate(powerUp.bounce);
            this.ctx.scale(powerUp.pulseScale, powerUp.pulseScale);
            
            switch (powerUp.type) {
                case 'life':
                    // Coração (maior)
                    this.ctx.fillStyle = '#FF69B4';
                    this.ctx.beginPath();
                    this.ctx.arc(-8, -4, 8, 0, Math.PI * 2);
                    this.ctx.fill();
                    this.ctx.beginPath();
                    this.ctx.arc(8, -4, 8, 0, Math.PI * 2);
                    this.ctx.fill();
                    this.ctx.fillRect(-8, -4, 16, 12);
                    this.ctx.beginPath();
                    this.ctx.moveTo(-8, 8);
                    this.ctx.lineTo(0, 16);
                    this.ctx.lineTo(8, 8);
                    this.ctx.fill();
                    break;
                    
                case 'points':
                    // Moeda (maior)
                    this.ctx.fillStyle = '#FFD700';
                    this.ctx.beginPath();
                    this.ctx.arc(0, 0, 16, 0, Math.PI * 2);
                    this.ctx.fill();
                    this.ctx.fillStyle = '#FFA500';
                    this.ctx.beginPath();
                    this.ctx.arc(0, 0, 14, 0, Math.PI * 2);
                    this.ctx.fill();
                    this.ctx.fillStyle = '#FFD700';
                    this.ctx.font = '18px Arial';
                    this.ctx.textAlign = 'center';
                    this.ctx.fillText('$', 0, 6);
                    break;
                    
                case 'speed':
                    // Raio de velocidade (maior)
                    this.ctx.fillStyle = '#00FF00';
                    this.ctx.beginPath();
                    this.ctx.moveTo(-14, 0);
                    this.ctx.lineTo(0, -12);
                    this.ctx.lineTo(14, 0);
                    this.ctx.lineTo(0, 12);
                    this.ctx.closePath();
                    this.ctx.fill();
                    this.ctx.fillStyle = '#32CD32';
                    this.ctx.font = '16px Arial';
                    this.ctx.textAlign = 'center';
                    this.ctx.fillText('⚡', 0, 5);
                    break;
                    
                case 'shield':
                    // Escudo (maior)
                    this.ctx.fillStyle = '#00BFFF';
                    this.ctx.beginPath();
                    this.ctx.moveTo(0, -16);
                    this.ctx.lineTo(12, -10);
                    this.ctx.lineTo(12, 6);
                    this.ctx.lineTo(0, 16);
                    this.ctx.lineTo(-12, 6);
                    this.ctx.lineTo(-12, -10);
                    this.ctx.closePath();
                    this.ctx.fill();
                    this.ctx.fillStyle = '#87CEEB';
                    this.ctx.font = '18px Arial';
                    this.ctx.textAlign = 'center';
                    this.ctx.fillText('🛡', 0, 5);
                    break;
                    break;
                    
                case 'magnet':
                    // Ímã (maior)
                    this.ctx.fillStyle = '#FF1493';
                    this.ctx.fillRect(-12, -14, 6, 28);
                    this.ctx.fillRect(6, -14, 6, 28);
                    this.ctx.fillStyle = '#DC143C';
                    this.ctx.fillRect(-12, -14, 24, 6);
                    this.ctx.fillStyle = '#00FF00';
                    this.ctx.fillRect(-12, 8, 24, 6);
                    // Símbolo de ímã
                    this.ctx.fillStyle = '#FFB6C1';
                    this.ctx.font = '16px Arial';
                    this.ctx.textAlign = 'center';
                    this.ctx.fillText('🧲', 0, 5);
                    break;
            }
            
            this.ctx.restore();
        }
    }
    
    renderParticles() {
        for (let particle of this.particles) {
            this.ctx.save();
            this.ctx.globalAlpha = particle.alpha;
            this.ctx.fillStyle = particle.color;
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.restore();
        }
    }
    
    updateUI() {
        document.getElementById('score').textContent = this.score;
        document.getElementById('lives').textContent = this.lives;
        
        // Atualizar highscore na interface
        const highScoreElement = document.getElementById('highScoreDisplay');
        if (highScoreElement) {
            highScoreElement.textContent = this.highScore;
        }
        
        // Atualizar status do super pulo
        const superJumpElement = document.getElementById('superJumpStatus');
        if (this.hamo.superJumpCooldown > 0) {
            superJumpElement.textContent = `${Math.ceil(this.hamo.superJumpCooldown / 60)}s`;
            superJumpElement.style.color = '#FF0000';
        } else {
            superJumpElement.textContent = 'PRONTO';
            superJumpElement.style.color = '#00FF00';
        }
        
        // Atualizar status dos power-ups
        const activePowerUpsElement = document.getElementById('activePowerUps');
        let activePowerUps = [];
        
        if (this.hamo.speedBoost > 0) {
            activePowerUps.push(`⚡Velocidade(${Math.ceil(this.hamo.speedBoost / 60)}s)`);
        }
        if (this.hamo.shield > 0) {
            activePowerUps.push(`🛡Escudo(${Math.ceil(this.hamo.shield / 60)}s)`);
        }
        if (this.hamo.magnet > 0) {
            activePowerUps.push(`🧲Ímã(${Math.ceil(this.hamo.magnet / 60)}s)`);
        }
        
        if (activePowerUps.length > 0) {
            activePowerUpsElement.textContent = activePowerUps.join(' | ');
            activePowerUpsElement.style.color = '#00FF00';
        } else {
            activePowerUpsElement.textContent = 'Nenhum';
            activePowerUpsElement.style.color = '#2F4F4F';
        }
    }
    
    renderUI() {
        // Atualizar elementos da UI
        this.updateUI();
        
        // Mini-mapa (canto superior direito)
        this.renderMinimap();
    }
    
    renderMinimap() {
        const mapWidth = 200;
        const mapHeight = 100;
        const mapX = this.canvas.width - mapWidth - 20;
        const mapY = 20;
        
        // Fundo do mini-mapa
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(mapX, mapY, mapWidth, mapHeight);
        
        // Bordas do mini-mapa
        this.ctx.strokeStyle = '#FFD700';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(mapX, mapY, mapWidth, mapHeight);
        
        // Escala do mundo para o mini-mapa
        const scaleX = mapWidth / this.worldWidth;
        const scaleY = mapHeight / this.worldHeight;
        
        // Desenhar plataformas principais no mini-mapa
        this.ctx.fillStyle = '#654321';
        for (let platform of this.platforms) {
            if (platform.type !== 'ground') {
                this.ctx.fillRect(
                    mapX + platform.x * scaleX,
                    mapY + platform.y * scaleY,
                    Math.max(2, platform.width * scaleX),
                    Math.max(1, platform.height * scaleY)
                );
            }
        }
        
        // Desenhar posição do Hamo
        this.ctx.fillStyle = '#FFD700';
        this.ctx.beginPath();
        this.ctx.arc(
            mapX + this.hamo.x * scaleX,
            mapY + this.hamo.y * scaleY,
            3,
            0,
            Math.PI * 2
        );
        this.ctx.fill();
        
        // Desenhar câmera/viewport
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(
            mapX + this.camera.x * scaleX,
            mapY + this.camera.y * scaleY,
            this.canvas.width * scaleX,
            this.canvas.height * scaleY
        );
    }
    
    restartGame() {
        // Resetar todas as variáveis
        this.score = 0;
        this.lives = 3;
        this.gameRunning = true;
        this.hunters = [];
        this.powerUps = [];
        this.particles = [];
        this.hunterSpawnTimer = 0;
        this.powerUpSpawnTimer = 0;
        
        // Ocultar tela de game over
        document.getElementById('gameOver').style.display = 'none';
        
        // Reiniciar música de fundo se estiver habilitada
        if (this.audioSettings.musicEnabled && this.sounds.backgroundMusic) {
            this.sounds.backgroundMusic.currentTime = 0;
            this.sounds.backgroundMusic.play();
        }
        
        // Reinicializar o jogo
        this.initGame();
        
        // Resetar estados específicos de morte
        this.hamo.dying = false;
        this.hamo.deathRotation = 0;
        this.hamo.deathFalling = false;
        this.hamo.deathCollisionEnabled = true;
    }
    
    gameLoop() {
        this.update();
        this.render();
        requestAnimationFrame(() => this.gameLoop());
    }
}

// Inicializar o jogo quando a página carregar
window.addEventListener('load', () => {
    new Game();
});
