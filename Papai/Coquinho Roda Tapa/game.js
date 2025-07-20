// === CONFIGURAÇÃO PRINCIPAL DO PHASER ===
class GameConfig {
    static get() {
        return {
            type: Phaser.AUTO,
            width: 800,
            height: 480,
            parent: 'gameCanvas',
            backgroundColor: '#87CEEB',
            scale: {
                mode: Phaser.Scale.FIT,
                autoCenter: Phaser.Scale.CENTER_BOTH,
                min: {
                    width: 400,
                    height: 240
                },
                max: {
                    width: 1200,
                    height: 720
                }
            },
            physics: {
                default: 'arcade',
                arcade: {
                    gravity: { y: 500 },
                    debug: false // Garantir que debug está desabilitado
                }
            },
            scene: [MenuScene, GameScene, MapCompleteScene, GameCompleteScene],
            input: {
                gamepad: true
            }
        };
    }
}

// === SISTEMA DE INPUT UNIFICADO ===
class InputManager {
    constructor(scene) {
        this.scene = scene;
        this.keys = {};
        this.touchControls = {};
        this.gamepadManager = window.gamepadManager;
        this.lastAttackTime = 0;
        this.attackCooldown = 150; // ms entre ataques
        this.setupInputs();
    }

    setupInputs() {
        // Teclado
        this.keys = this.scene.input.keyboard.addKeys('LEFT,RIGHT,UP,X,SPACE,ESC');
        
        // Touch Controls (configurados na UI)
        this.setupTouchControls();
        
        // Configurar callbacks do gamepad
        if (this.gamepadManager) {
            window.gameAPI.onGamepadConnected = (gamepad) => {
                // Feedback quando gamepad é conectado
                this.showGamepadFeedback(gamepad);
            };
        }
    }

    setupTouchControls() {
        this.touchControls = {
            left: false,
            right: false,
            up: false,
            attack: false
        };
    }

    update() {
        // Atualizar gamepad manager se disponível
        if (this.gamepadManager) {
            this.gamepadManager.update();
        }
    }

    isLeftPressed() {
        const gamepadInput = this.gamepadManager ? this.gamepadManager.getInput() : null;
        
        return this.keys.LEFT.isDown || 
               (gamepadInput && gamepadInput.left) ||
               this.touchControls.left;
    }

    isRightPressed() {
        const gamepadInput = this.gamepadManager ? this.gamepadManager.getInput() : null;
        
        return this.keys.RIGHT.isDown || 
               (gamepadInput && gamepadInput.right) ||
               this.touchControls.right;
    }

    isUpPressed() {
        const gamepadInput = this.gamepadManager ? this.gamepadManager.getInput() : null;
        
        return this.keys.UP.isDown || 
               (gamepadInput && gamepadInput.up) ||
               this.touchControls.up;
    }

    isAttackJustPressed() {
        const currentTime = Date.now();
        if (currentTime - this.lastAttackTime < this.attackCooldown) {
            return false;
        }

        const keyPressed = Phaser.Input.Keyboard.JustDown(this.keys.X) || 
                          Phaser.Input.Keyboard.JustDown(this.keys.SPACE);
        const gamepadPressed = this.gamepadManager ? 
                              this.gamepadManager.isButtonJustPressed('attack') : false;
        const touchPressed = this.touchControls.attack;

        if (keyPressed || gamepadPressed || touchPressed) {
            this.lastAttackTime = currentTime;
            return true;
        }

        return false;
    }

    isAttackPressed() {
        const gamepadInput = this.gamepadManager ? this.gamepadManager.getInput() : null;
        
        return this.keys.X.isDown || 
               this.keys.SPACE.isDown ||
               (gamepadInput && gamepadInput.attack) ||
               this.touchControls.attack;
    }

    // Métodos para touch controls
    setTouchControl(control, state) {
        this.touchControls[control] = state;
    }

    // Feedback de gamepad
    showGamepadFeedback(gamepad) {
        if (this.scene && this.scene.add) {
            const text = this.scene.add.text(
                this.scene.cameras.main.centerX, 
                50, 
                `🎮 ${gamepad.id.substring(0, 20)}... Conectado!`,
                {
                    fontSize: '16px',
                    fontFamily: 'Arial',
                    fill: '#00ff00',
                    backgroundColor: '#000000',
                    padding: { x: 10, y: 5 }
                }
            ).setOrigin(0.5);

            // Fade out após 3 segundos
            this.scene.tweens.add({
                targets: text,
                alpha: 0,
                duration: 3000,
                delay: 1000,
                onComplete: () => text.destroy()
            });
        }
    }

    // Vibração para feedback
    vibrate(weak = 0.3, strong = 0.5, duration = 100) {
        if (this.gamepadManager) {
            this.gamepadManager.vibrateAll(weak, strong, duration);
        }
    }

    // Obter força do analógico para movimento mais suave
    getMovementStrength() {
        const gamepadInput = this.gamepadManager ? this.gamepadManager.getInput() : null;
        
        if (gamepadInput && Math.abs(gamepadInput.leftStick.x) > 0.1) {
            return Math.abs(gamepadInput.leftStick.x);
        }
        
        return 1.0; // Movimento digital padrão
    }
}

// === CLASSE DO JOGADOR ===
class Player extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        super(scene, x, y, null);
        
        this.scene = scene;
        scene.add.existing(this);
        scene.physics.add.existing(this);
        
        // Tornar o sprite físico invisível para evitar mostrar a hitbox
        this.setVisible(false);
        
        // Propriedades do jogador
        this.setSize(32, 32);
        this.setBounce(0);
        this.setCollideWorldBounds(true);
        
        // Estados
        this.isAttacking = false;
        this.attackTimer = 0;
        this.attackDuration = 300; // ms
        this.isPoweredUp = false;
        this.powerUpTimer = 0;
        this.powerUpDuration = 5000; // ms
        
        // Área de ataque (invisível por padrão)
        this.attackArea = scene.add.circle(x, y, 0, 0xff0000, 0.2);
        this.attackArea.setVisible(false);
        this.attackArea.setStrokeStyle(2, 0xff0000, 0.8);
        
        // Timers
        this.lastAttackTime = 0;
        this.attackCooldown = 100; // ms
        
        // Sprite visual do jogador (em vez de desenhar manualmente)
        this.createPlayerVisual();
    }
    
    createPlayerVisual() {
        // Criar um container para a aparência do jogador
        this.visualContainer = this.scene.add.container(this.x, this.y);
        
        // Corpo do coquinho
        this.bodySprite = this.scene.add.rectangle(0, 0, 30, 30, 0x2ecc71);
        this.bodySprite.setStrokeStyle(2, 0x27ae60, 1);
        
        // Olhos brancos
        this.leftEye = this.scene.add.rectangle(-8, -8, 6, 6, 0xffffff);
        this.rightEye = this.scene.add.rectangle(8, -8, 6, 6, 0xffffff);
        
        // Pupilas pretas
        this.leftPupil = this.scene.add.rectangle(-8, -8, 3, 3, 0x000000);
        this.rightPupil = this.scene.add.rectangle(8, -8, 3, 3, 0x000000);
        
        // Adicionar ao container na ordem correta
        this.visualContainer.add([this.bodySprite, this.leftEye, this.rightEye, this.leftPupil, this.rightPupil]);
    }

    update(time, delta) {
        const input = this.scene.inputManager;
        
        // Movimento horizontal com suporte a analógico
        const movementStrength = input.getMovementStrength();
        const baseSpeed = 160;
        
        if (input.isLeftPressed()) {
            this.setVelocityX(-baseSpeed * movementStrength);
            this.setFlipX(true);
        } else if (input.isRightPressed()) {
            this.setVelocityX(baseSpeed * movementStrength);
            this.setFlipX(false);
        } else {
            this.setVelocityX(0);
        }
        
        // Pulo
        if (input.isUpPressed() && this.body.touching.down) {
            this.setVelocityY(-400);
            // Vibração para pulo
            input.vibrate(0.1, 0.1, 50);
        }
        
        // Ataque
        if (input.isAttackJustPressed()) {
            this.attack(time);
        }
        
        // Atualizar timers
        this.updateTimers(time, delta);
        
        // Atualizar área de ataque
        this.updateAttackArea();
        
        // Atualizar posição visual
        this.updateVisualPosition();
        
        // Atualizar animações
        this.updateAnimations();
    }

    attack(time) {
        if (this.isAttacking) return;
        
        this.isAttacking = true;
        this.attackTimer = this.attackDuration;
        this.lastAttackTime = time;
        
        // Feedback de vibração para ataque
        this.scene.inputManager.vibrate(0.4, 0.6, 200);
        
        // Mostrar área de ataque
        const radius = this.isPoweredUp ? 60 : 40;
        this.attackArea.setRadius(radius);
        this.attackArea.setVisible(true);
        
        // Som de ataque (se disponível)
        if (this.scene.sound && this.scene.attackSound) {
            this.scene.attackSound.play();
        }
        
        // Animação de rotação
        this.scene.tweens.add({
            targets: this,
            rotation: this.rotation + Math.PI * 4,
            duration: this.attackDuration,
            ease: 'Power2'
        });
        
        // Ocultar área de ataque após o tempo
        this.scene.time.delayedCall(this.attackDuration, () => {
            this.attackArea.setVisible(false);
            this.isAttacking = false;
        });
    }

    updateAnimations() {
        // Animação baseada no movimento
        if (Math.abs(this.body.velocity.x) > 10) {
            // Animação de corrida (pode ser expandida com sprites)
            this.scaleX = 1 + Math.sin(Date.now() * 0.01) * 0.05;
        } else {
            this.scaleX = 1;
        }
        
        // Animação de pulo
        if (this.body.velocity.y < -100) {
            this.scaleY = 1.1;
        } else if (this.body.velocity.y > 100) {
            this.scaleY = 0.9;
        } else {
            this.scaleY = 1;
        }
    }

    updateTimers(time, delta) {
        if (this.isPoweredUp) {
            this.powerUpTimer -= delta;
            if (this.powerUpTimer <= 0) {
                this.isPoweredUp = false;
                // Voltar cor normal e contorno
                this.bodySprite.setFillStyle(0x2ecc71);
                this.bodySprite.setStrokeStyle(2, 0x27ae60, 1);
            }
        }
    }

    updateAttackArea() {
        this.attackArea.setPosition(this.x, this.y);
    }
    
    updateVisualPosition() {
        // Sincronizar posição visual com física
        if (this.visualContainer) {
            this.visualContainer.setPosition(this.x, this.y);
            this.visualContainer.setRotation(this.rotation);
        }
    }

    powerUp() {
        this.isPoweredUp = true;
        this.powerUpTimer = this.powerUpDuration;
        // Mudar cor para dourado e manter o contorno
        this.bodySprite.setFillStyle(0xf1c40f);
        this.bodySprite.setStrokeStyle(2, 0xe67e22, 1); // Contorno laranja para destacar
    }

    destroy() {
        // Limpar container visual
        if (this.visualContainer) {
            this.visualContainer.destroy();
        }
        super.destroy();
    }
}

// === CONFIGURAÇÕES DOS TIPOS DE INIMIGOS ===
class EnemyTypes {
    static getConfig(type) {
        const configs = {
            // Turista que tira selfie
            selfie_tourist: {
                name: 'Turista Selfie',
                colors: {
                    shirt: 0xe74c3c,
                    pants: 0x34495e,
                    head: 0xfdbcb4
                },
                behavior: {
                    canWalk: true,
                    canRun: true,
                    canAttack: true,
                    runFromPlayer: false, // Corre PARA o jogador
                    visionRange: 100,
                    attackRange: 50,
                    baseSpeed: 25,
                    runSpeed: 60,
                    idleAction: 'selfie',
                    attackAction: 'photo'
                },
                animations: {
                    idle: { duration: 2000, description: 'Tira selfie' },
                    walk: { duration: 1500, description: 'Caminha olhando o celular' },
                    run: { duration: 500, description: 'Corre desesperado para foto' },
                    attack: { duration: 800, description: 'Tira foto com flash' }
                }
            },
            
            // Criança com boia
            child_float: {
                name: 'Criança de Boia',
                colors: {
                    shirt: 0xf39c12,
                    pants: 0xe67e22,
                    head: 0xfdbcb4
                },
                behavior: {
                    canWalk: true,
                    canRun: true,
                    canAttack: true,
                    runFromPlayer: false,
                    visionRange: 80,
                    attackRange: 35,
                    baseSpeed: 35,
                    runSpeed: 70,
                    idleAction: 'bounce',
                    attackAction: 'hug'
                },
                animations: {
                    idle: { duration: 1500, description: 'Pula na boia' },
                    walk: { duration: 1200, description: 'Caminha com boia' },
                    run: { duration: 400, description: 'Corre animada' },
                    attack: { duration: 600, description: 'Abraço apertado' }
                }
            },
            
            // Tiozão do bronzeador
            sunscreen_guy: {
                name: 'Tiozão Bronzeador',
                colors: {
                    shirt: 0x3498db,
                    pants: 0x2980b9,
                    head: 0xd35400
                },
                behavior: {
                    canWalk: true,
                    canRun: true,
                    canAttack: true,
                    runFromPlayer: true, // Foge do jogador
                    visionRange: 120,
                    attackRange: 60,
                    baseSpeed: 20,
                    runSpeed: 45,
                    idleAction: 'sunscreen',
                    attackAction: 'spray'
                },
                animations: {
                    idle: { duration: 3000, description: 'Passa bronzeador' },
                    walk: { duration: 2000, description: 'Caminha relaxado' },
                    run: { duration: 600, description: 'Corre com medo' },
                    attack: { duration: 700, description: 'Joga bronzeador' }
                }
            }
        };
        
        return configs[type] || configs.selfie_tourist;
    }
    
    static getAllTypes() {
        return ['selfie_tourist', 'child_float', 'sunscreen_guy'];
    }
}

// === CLASSE BASE DO INIMIGO (REFATORADA) ===
class Enemy extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, enemyType = 'selfie_tourist') {
        super(scene, x, y, null);
        
        this.scene = scene;
        scene.add.existing(this);
        scene.physics.add.existing(this);
        
        // Tornar o sprite físico invisível para evitar mostrar a hitbox
        this.setVisible(false);
        
        this.setSize(32, 48);
        this.setBounce(0);
        this.setCollideWorldBounds(true);
        
        // Configuração do tipo de inimigo
        this.enemyType = enemyType;
        this.config = EnemyTypes.getConfig(enemyType);
        
        // Propriedades básicas
        this.isHit = false;
        this.direction = Math.random() > 0.5 ? 1 : -1;
        this.initialX = x;
        this.moveRange = 120;
        
        // Estados de comportamento
        this.currentState = 'idle';
        this.stateTimer = 0;
        this.lastPlayerPosition = null;
        this.isPlayerVisible = false;
        this.attackCooldown = 0;
        
        // Criar sprite visual do inimigo
        this.createEnemyVisual();
        
        // Estado inicial
        this.changeState('idle');
    }
    
    createEnemyVisual() {
        // Container para a aparência do inimigo
        this.visualContainer = this.scene.add.container(this.x, this.y);
        
        const colors = this.config.colors;
        
        // Corpo (camisa)
        this.bodySprite = this.scene.add.rectangle(0, 0, 30, 45, colors.shirt);
        this.bodySprite.setStrokeStyle(1, 0x000000, 1);
        
        // Roupa (calça/short)
        this.clothesSprite = this.scene.add.rectangle(0, 8, 30, 20, colors.pants);
        this.clothesSprite.setStrokeStyle(1, 0x000000, 1);
        
        // Cabeça
        this.headSprite = this.scene.add.rectangle(0, -15, 25, 20, colors.head);
        this.headSprite.setStrokeStyle(1, 0x000000, 1);
        
        // Elementos específicos do tipo
        this.createTypeSpecificVisuals();
        
        // Adicionar ao container na ordem correta
        this.visualContainer.add([this.bodySprite, this.clothesSprite, this.headSprite]);
        
        // Adicionar elementos específicos se existirem
        if (this.typeSpecificElements) {
            this.typeSpecificElements.forEach(element => {
                this.visualContainer.add(element);
            });
        }
    }
    
    createTypeSpecificVisuals() {
        this.typeSpecificElements = [];
        
        switch(this.enemyType) {
            case 'selfie_tourist':
                // Celular
                this.phone = this.scene.add.rectangle(15, -5, 8, 12, 0x2c3e50);
                this.phone.setStrokeStyle(1, 0x000000, 1);
                this.typeSpecificElements.push(this.phone);
                break;
                
            case 'child_float':
                // Boia (anel ao redor da cintura)
                this.floatRing = this.scene.add.circle(0, 5, 20, 0xff6b6b, 0.7);
                this.floatRing.setStrokeStyle(2, 0xff5252, 1);
                // Colocar a boia atrás do corpo
                this.typeSpecificElements.unshift(this.floatRing);
                break;
                
            case 'sunscreen_guy':
                // Frasco de bronzeador
                this.sunscreenBottle = this.scene.add.rectangle(-18, 0, 6, 15, 0xffffff);
                this.sunscreenBottle.setStrokeStyle(1, 0x000000, 1);
                this.typeSpecificElements.push(this.sunscreenBottle);
                break;
        }
    }

    update() {
        if (this.isHit) return;
        
        // Atualizar timers
        this.stateTimer += this.scene.sys.game.loop.delta;
        if (this.attackCooldown > 0) {
            this.attackCooldown -= this.scene.sys.game.loop.delta;
        }
        
        // Detectar jogador
        this.detectPlayer();
        
        // Executar comportamento baseado no estado
        this.executeCurrentState();
        
        // Atualizar posição visual
        this.updateVisualPosition();
        
        // Atualizar animações específicas
        this.updateTypeAnimations();
    }
    
    detectPlayer() {
        if (!this.scene.player) return;
        
        const player = this.scene.player;
        const distance = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);
        
        // Verificar se o jogador está no campo de visão
        this.isPlayerVisible = distance <= this.config.behavior.visionRange;
        
        if (this.isPlayerVisible) {
            this.lastPlayerPosition = { x: player.x, y: player.y };
            
            // Determinar próximo estado baseado na distância e comportamento
            if (distance <= this.config.behavior.attackRange && this.attackCooldown <= 0) {
                if (this.config.behavior.canAttack) {
                    this.changeState('attack');
                }
            } else if (this.config.behavior.canRun) {
                this.changeState('run');
            } else if (this.config.behavior.canWalk) {
                this.changeState('walk');
            }
        } else {
            // Sem jogador visível - voltar para comportamento padrão
            if (this.currentState === 'run' || this.currentState === 'attack') {
                this.changeState('walk');
            }
        }
    }
    
    executeCurrentState() {
        switch(this.currentState) {
            case 'idle':
                this.executeIdleState();
                break;
            case 'walk':
                this.executeWalkState();
                break;
            case 'run':
                this.executeRunState();
                break;
            case 'attack':
                this.executeAttackState();
                break;
        }
    }
    
    executeIdleState() {
        this.setVelocityX(0);
        
        // Verificar se deve sair do estado idle
        const idleDuration = this.config.animations.idle.duration;
        if (this.stateTimer >= idleDuration) {
            this.changeState('walk');
        }
    }
    
    executeWalkState() {
        if (!this.isPlayerVisible) {
            // Movimento de patrulha normal
            this.setVelocityX(this.config.behavior.baseSpeed * this.direction);
            
            // Verificar limites de movimento
            if (Math.abs(this.x - this.initialX) > this.moveRange) {
                this.direction *= -1;
            }
            
            // Detectar borda da plataforma
            this.detectPlatformEdge();
            
            // Chance de parar para descansar
            if (this.stateTimer >= this.config.animations.walk.duration) {
                if (Math.random() < 0.4) {
                    this.changeState('idle');
                } else {
                    this.stateTimer = 0; // Continuar andando
                }
            }
        } else {
            // Jogador visível - movimento já será tratado pela detecção
            this.setVelocityX(0);
        }
    }
    
    executeRunState() {
        if (this.isPlayerVisible && this.lastPlayerPosition) {
            const targetX = this.lastPlayerPosition.x;
            let runDirection;
            
            if (this.config.behavior.runFromPlayer) {
                // Fugir do jogador
                runDirection = this.x > targetX ? 1 : -1;
            } else {
                // Correr em direção ao jogador
                runDirection = this.x > targetX ? -1 : 1;
            }
            
            this.setVelocityX(this.config.behavior.runSpeed * runDirection);
            this.direction = runDirection;
            
            // Detectar bordas mesmo quando correndo
            this.detectPlatformEdge();
        }
    }
    
    executeAttackState() {
        // Parar para atacar
        this.setVelocityX(0);
        
        // Executar ataque específico do tipo
        if (this.stateTimer >= this.config.animations.attack.duration) {
            this.performTypeSpecificAttack();
            this.attackCooldown = 2000; // 2 segundos de cooldown
            this.changeState('walk');
        }
    }
    
    performTypeSpecificAttack() {
        switch(this.enemyType) {
            case 'selfie_tourist':
                this.photoFlashAttack();
                break;
            case 'child_float':
                this.hugAttack();
                break;
            case 'sunscreen_guy':
                this.sunscreenSprayAttack();
                break;
        }
    }
    
    photoFlashAttack() {
        // Flash da câmera
        const flash = this.scene.add.circle(this.x, this.y, 50, 0xffffff, 0.8);
        this.scene.tweens.add({
            targets: flash,
            alpha: 0,
            scaleX: 2,
            scaleY: 2,
            duration: 200,
            onComplete: () => flash.destroy()
        });
        
        // Som de câmera (se disponível)
        console.log(`${this.config.name}: *FLASH* Que foto incrível!`);
    }
    
    hugAttack() {
        // Animação de abraço (pular em direção ao jogador)
        this.scene.tweens.add({
            targets: this.visualContainer,
            scaleX: 1.2,
            scaleY: 0.8,
            duration: 150,
            yoyo: true
        });
        
        console.log(`${this.config.name}: Abraço! ❤️`);
    }
    
    sunscreenSprayAttack() {
        // Spray de bronzeador
        const spray = this.scene.add.particles(this.x + (this.direction * 20), this.y - 10, 'white', {
            scale: { start: 0.3, end: 0 },
            alpha: { start: 0.8, end: 0 },
            speed: { min: 50, max: 100 },
            lifespan: 300,
            quantity: 8
        });
        
        // Remover partículas após um tempo
        this.scene.time.delayedCall(500, () => {
            if (spray) spray.destroy();
        });
        
        console.log(`${this.config.name}: Take bronzeador! ☀️`);
    }
    
    changeState(newState) {
        this.currentState = newState;
        this.stateTimer = 0;
        
        // Debug
        // console.log(`${this.config.name} mudou para estado: ${newState}`);
    }
    
    detectPlatformEdge() {
        const checkDistance = 40;
        const futureX = this.x + (this.direction * checkDistance);
        const groundCheckY = this.y + 30;
        
        let hasGroundAhead = false;
        
        this.scene.platforms.children.entries.forEach(platform => {
            const platBounds = platform.getBounds();
            if (futureX >= platBounds.left && futureX <= platBounds.right &&
                groundCheckY >= platBounds.top && groundCheckY <= platBounds.bottom) {
                hasGroundAhead = true;
            }
        });
        
        if (!hasGroundAhead) {
            this.direction *= -1;
            // Pausar quando vira por causa da borda
            if (Math.random() < 0.5) {
                this.changeState('idle');
            }
        }
    }
    
    updateTypeAnimations() {
        if (!this.visualContainer) return;
        
        const time = Date.now();
        
        switch(this.enemyType) {
            case 'selfie_tourist':
                if (this.currentState === 'idle') {
                    // Balançar o celular como se estivesse tirando selfie
                    const selfieWave = Math.sin(time * 0.008) * 0.1;
                    if (this.phone) {
                        this.phone.setRotation(selfieWave);
                        this.phone.setPosition(15 + selfieWave * 5, -5);
                    }
                } else if (this.currentState === 'attack') {
                    // Flash do celular
                    if (this.phone) {
                        // Usar setFillStyle em vez de setTint para Rectangle
                        this.phone.setFillStyle(0xffffff);
                        this.scene.time.delayedCall(100, () => {
                            if (this.phone) this.phone.setFillStyle(0x2c3e50); // Voltar cor original
                        });
                    }
                }
                break;
                
            case 'child_float':
                if (this.currentState === 'idle') {
                    // Pular na boia
                    const bounce = Math.sin(time * 0.015) * 8;
                    this.visualContainer.setY(this.y + bounce);
                    
                    // Boia balança também
                    if (this.floatRing) {
                        const floatBounce = Math.sin(time * 0.01) * 0.1;
                        this.floatRing.setScale(1 + floatBounce, 1 - floatBounce * 0.5);
                    }
                } else {
                    this.visualContainer.setY(this.y);
                }
                break;
                
            case 'sunscreen_guy':
                if (this.currentState === 'idle') {
                    // Movimento de passar bronzeador
                    const sunscreenMotion = Math.sin(time * 0.006) * 0.2;
                    if (this.sunscreenBottle) {
                        this.sunscreenBottle.setPosition(-18, sunscreenMotion * 10);
                        this.sunscreenBottle.setRotation(sunscreenMotion);
                    }
                }
                break;
        }
        
        // Orientação baseada na direção
        const facingScale = this.direction > 0 ? 1 : -1;
        this.visualContainer.setScale(facingScale, 1);
        
        // Animação de caminhada geral
        if (this.currentState === 'walk' && Math.abs(this.body.velocity.x) > 5) {
            const walkCycle = Math.sin(time * 0.008) * 0.05;
            this.visualContainer.setScale(facingScale * (1 + walkCycle), 1 - walkCycle * 0.5);
        } else if (this.currentState === 'run' && Math.abs(this.body.velocity.x) > 10) {
            const runCycle = Math.sin(time * 0.015) * 0.08;
            this.visualContainer.setScale(facingScale * (1 + runCycle), 1 - runCycle * 0.3);
        }
    }
    
    updateVisualPosition() {
        // Sincronizar posição visual com física
        if (this.visualContainer) {
            this.visualContainer.setPosition(this.x, this.y);
            this.visualContainer.setRotation(this.rotation);
        }
    }

    hit() {
        if (this.isHit) return;
        
        this.isHit = true;
        this.setVelocity(0);
        
        // Efeitos visuais do nocaute
        if (this.visualContainer) {
            // Rotacionar para mostrar que foi nocauteado
            this.scene.tweens.add({
                targets: this.visualContainer,
                rotation: Math.PI / 2,
                duration: 300,
                ease: 'Power2'
            });
            
            // Mudar cor para cinza
            this.bodySprite.setFillStyle(0x888888);
            this.clothesSprite.setFillStyle(0x666666);
            this.headSprite.setFillStyle(0x999999);
            
            // Efeito de queda
            this.scene.tweens.add({
                targets: this.visualContainer,
                y: this.visualContainer.y + 15,
                duration: 500,
                ease: 'Bounce'
            });
            
            // Adicionar "Zzz" para indicar que está dormindo/nocauteado
            const sleepText = this.scene.add.text(0, -30, 'Zzz', {
                fontSize: '12px',
                fontFamily: 'Arial',
                fill: '#ffff00'
            }).setOrigin(0.5);
            
            this.visualContainer.add(sleepText);
            
            // Animar o "Zzz"
            this.scene.tweens.add({
                targets: sleepText,
                alpha: 0.3,
                yoyo: true,
                repeat: -1,
                duration: 1000
            });
        }
    }

    destroy() {
        // Limpar container visual
        if (this.visualContainer) {
            this.visualContainer.destroy();
        }
        super.destroy();
    }
}

// === SCENE DO MENU ===
class MenuScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MenuScene' });
        this.gamepadManager = null;
    }

    create() {
        // Configurar gamepad manager
        this.gamepadManager = window.gamepadManager;
        
        // Título
        this.add.text(400, 100, 'Coquinho Roda Tapa', {
            fontSize: '32px',
            fontFamily: 'Press Start 2P',
            fill: '#ffffff',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5);

        // Instruções
        const isMobile = this.sys.game.device.input.touch;
        let instructions = '';
        
        if (isMobile) {
            instructions = 'Toque nos botões na tela para jogar\nToque em INICIAR JOGO para começar';
        } else {
            instructions = 'Use as setas para mover\nX ou Espaço para atacar\nGamepad suportado!\n\nPressione ENTER ou START para iniciar';
        }
            
        this.add.text(400, 200, instructions, {
            fontSize: '16px',
            fontFamily: 'Press Start 2P',
            fill: '#ffffff',
            align: 'center'
        }).setOrigin(0.5);

        // Botão de iniciar
        this.startButton = this.add.text(400, 320, 'INICIAR JOGO', {
            fontSize: '24px',
            fontFamily: 'Press Start 2P',
            fill: '#00ff00',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5);

        this.startButton.setInteractive();
        this.startButton.on('pointerdown', () => {
            this.startGame();
        });

        // Efeito hover
        this.startButton.on('pointerover', () => {
            this.startButton.setFill('#ffff00');
        });
        this.startButton.on('pointerout', () => {
            this.startButton.setFill('#00ff00');
        });
        
        // Configurar input do teclado
        this.keys = this.input.keyboard.addKeys('ENTER');
        
        // Indicador de gamepad (se conectado)
        this.createGamepadIndicator();
    }
    
    createGamepadIndicator() {
        if (this.gamepadManager && this.gamepadManager.hasAnyGamepad()) {
            const connectedGamepads = this.gamepadManager.getConnectedGamepads();
            const gamepadInfo = connectedGamepads[0];
            
            this.gamepadText = this.add.text(400, 400, `🎮 ${gamepadInfo.id.substring(0, 25)}... conectado!\nPressione START para iniciar`, {
                fontSize: '12px',
                fontFamily: 'Arial',
                fill: '#00ff00',
                align: 'center'
            }).setOrigin(0.5);
            
            // Animação piscante para chamar atenção
            this.tweens.add({
                targets: this.gamepadText,
                alpha: 0.3,
                duration: 1000,
                yoyo: true,
                repeat: -1
            });
        }
    }

    update() {
        // Verificar input do teclado
        if (Phaser.Input.Keyboard.JustDown(this.keys.ENTER)) {
            this.startGame();
        }
        
        // Verificar input do gamepad
        if (this.gamepadManager) {
            // Atualizar gamepad
            this.gamepadManager.update();
            
            // Verificar botão Start/Menu
            if (this.gamepadManager.isButtonJustPressed('menu')) {
                this.startGame();
            }
            
            // Verificar se um gamepad foi conectado durante o menu
            if (!this.gamepadText && this.gamepadManager.hasAnyGamepad()) {
                this.createGamepadIndicator();
            }
        }
    }
    
    startGame() {
        // Efeito de feedback
        this.startButton.setFill('#ffff00');
        
        // Vibração se gamepad disponível
        if (this.gamepadManager) {
            this.gamepadManager.vibrateAll(0.3, 0.5, 200);
        }
        
        // Som (se disponível)
        // this.sound.play('startSound');
        
        // Pequeno delay para feedback visual
        this.time.delayedCall(100, () => {
            // Iniciar com o primeiro mapa
            this.scene.start('GameScene', {
                mapId: 1,
                totalScore: 0,
                gameProgress: {
                    currentMap: 1,
                    totalMaps: MapManager.getTotalMaps(),
                    totalScore: 0,
                    totalTime: 0,
                    mapsCompleted: 0,
                    mapStats: []
                }
            });
        });
    }
}

// === SCENE DE MAPA COMPLETO ===
class MapCompleteScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MapCompleteScene' });
    }

    init(data) {
        console.log('=== INICIALIZANDO MAPCOMPLETESCENE ===');
        console.log('Dados recebidos:', data);
        
        // Dados passados da GameScene
        this.mapScore = data.mapScore || 0;
        this.timeBonus = data.timeBonus || 0;
        this.gameProgress = data.gameProgress || {};
        this.nextMapId = data.nextMapId || null;
        this.currentMapData = data.currentMapData || {};
        
        console.log('Dados do mapa atual:', this.currentMapData);
        console.log('===================================');
    }

    create() {
        // Configurar gamepad manager
        this.gamepadManager = window.gamepadManager;
        
        // Fundo com gradiente
        this.cameras.main.setBackgroundColor('#1a1a2e');
        
        // Título principal
        this.add.text(400, 80, 'MAPA CONCLUÍDO! 🎉', {
            fontSize: '32px',
            fontFamily: 'Press Start 2P',
            fill: '#00ff00',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5);
        
        // Nome do mapa completado
        this.add.text(400, 140, `"${this.currentMapData.name}"`, {
            fontSize: '20px',
            fontFamily: 'Press Start 2P',
            fill: '#ffff00',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5);
        
        // Descrição do mapa
        this.add.text(400, 170, this.currentMapData.description, {
            fontSize: '14px',
            fontFamily: 'Press Start 2P',
            fill: '#74b9ff',
            stroke: '#000000',
            strokeThickness: 1
        }).setOrigin(0.5);
        
        // Resumo da performance
        const performanceY = 210;
        const elapsedTime = this.gameProgress.mapStats.length > 0 ? 
            this.gameProgress.mapStats[this.gameProgress.mapStats.length - 1].timeSpent : 0;
        
        const stats = [
            `Pontuação do Mapa: ${this.mapScore - this.timeBonus}`,
            `Tempo: ${elapsedTime.toFixed(2)}s`,
            `Bônus de Tempo: ${this.timeBonus}`,
            `Inimigos Derrotados: ${this.gameProgress.mapStats.length > 0 ? this.gameProgress.mapStats[this.gameProgress.mapStats.length - 1].enemiesDefeated : 0}`,
            '',
            `PONTUAÇÃO TOTAL: ${this.gameProgress.totalScore}`
        ];
        
        stats.forEach((stat, index) => {
            if (stat === '') return; // Pular linha vazia
            
            const color = stat.includes('TOTAL') ? '#ff6b6b' : '#ffffff';
            const fontSize = stat.includes('TOTAL') ? '20px' : '16px';
            
            this.add.text(400, performanceY + (index * 30), stat, {
                fontSize: fontSize,
                fontFamily: 'Press Start 2P',
                fill: color,
                stroke: '#000000',
                strokeThickness: 2
            }).setOrigin(0.5);
        });
        
        // Progresso do jogo
        const progressY = 400;
        const currentMapNumber = this.gameProgress.mapsCompleted;
        const totalMaps = this.gameProgress.totalMaps;
        
        this.add.text(400, progressY, `Mapa ${currentMapNumber} de ${totalMaps} completado!`, {
            fontSize: '14px',
            fontFamily: 'Press Start 2P',
            fill: '#74b9ff',
            stroke: '#000000',
            strokeThickness: 1
        }).setOrigin(0.5);
        
        // Barra de progresso visual
        const barWidth = 300;
        const barHeight = 20;
        const barX = 400 - barWidth/2;
        const barY = progressY + 30;
        
        // Fundo da barra
        this.add.rectangle(barX + barWidth/2, barY + barHeight/2, barWidth, barHeight, 0x2d3436)
            .setStrokeStyle(2, 0xddd, 1);
        
        // Progresso preenchido
        const progress = currentMapNumber / totalMaps;
        const fillWidth = barWidth * progress;
        this.add.rectangle(barX + fillWidth/2, barY + barHeight/2, fillWidth, barHeight, 0x00b894);
        
        // Instrução para continuar
        const isLastMap = this.nextMapId === null;
        const instruction = isLastMap ? 
            'Pressione qualquer botão para ver o resultado final!' :
            'Pressione qualquer botão para o próximo mapa!';
            
        this.continueText = this.add.text(400, 450, instruction, {
            fontSize: '14px',
            fontFamily: 'Press Start 2P',
            fill: '#ffeaa7',
            stroke: '#000000',
            strokeThickness: 1
        }).setOrigin(0.5);
        
        // Animação piscante
        this.tweens.add({
            targets: this.continueText,
            alpha: 0.3,
            duration: 1000,
            yoyo: true,
            repeat: -1
        });
        
        // Configurar inputs
        this.setupInputs();
    }
    
    setupInputs() {
        // Teclado
        this.input.keyboard.on('keydown', () => {
            this.proceedToNext();
        });
        
        // Mouse/Touch
        this.input.on('pointerdown', () => {
            this.proceedToNext();
        });
        
        // Gamepad
        if (this.gamepadManager) {
            this.gamepadConnected = false;
        }
    }
    
    update() {
        // Verificar gamepad
        if (this.gamepadManager) {
            this.gamepadManager.update();
            
            // Detectar qualquer botão pressionado
            if (this.gamepadManager.hasAnyGamepad()) {
                if (!this.gamepadConnected) {
                    this.gamepadConnected = true;
                }
                
                // Verificar se qualquer botão foi pressionado
                const gamepads = this.gamepadManager.getConnectedGamepads();
                for (const gamepad of gamepads) {
                    if (this.gamepadManager.isButtonJustPressed('attack') ||
                        this.gamepadManager.isButtonJustPressed('menu') ||
                        this.gamepadManager.isButtonJustPressed('jump')) {
                        this.proceedToNext();
                        break;
                    }
                }
            }
        }
    }
    
    proceedToNext() {
        const isLastMap = this.nextMapId === null;
        
        if (isLastMap) {
            // Ir para tela de fim de jogo
            this.scene.start('GameCompleteScene', {
                gameProgress: this.gameProgress
            });
        } else {
            // Ir para o próximo mapa
            this.scene.start('GameScene', {
                mapId: this.nextMapId,
                totalScore: this.gameProgress.totalScore,
                gameProgress: {
                    ...this.gameProgress,
                    currentMap: this.nextMapId
                }
            });
        }
    }
}

// === SCENE DE JOGO COMPLETO ===
class GameCompleteScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameCompleteScene' });
    }

    init(data) {
        this.gameProgress = data.gameProgress || {};
    }

    create() {
        // Configurar gamepad manager
        this.gamepadManager = window.gamepadManager;
        
        // Fundo especial para fim de jogo
        this.cameras.main.setBackgroundColor('#0d1421');
        
        // Efeito de partículas comemorativas
        this.createCelebrationEffects();
        
        // Título de parabéns
        this.add.text(400, 60, '🏆 PARABÉNS! 🏆', {
            fontSize: '36px',
            fontFamily: 'Press Start 2P',
            fill: '#ffd700',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5);
        
        this.add.text(400, 120, 'VOCÊ COMPLETOU TODOS OS MAPAS!', {
            fontSize: '16px',
            fontFamily: 'Press Start 2P',
            fill: '#ffffff',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5);
        
        // Estatísticas finais
        const finalStats = [
            `Pontuação Final: ${this.gameProgress.totalScore}`,
            `Mapas Completados: ${this.gameProgress.totalMaps}`,
            `Tempo Total: ${this.gameProgress.totalTime}s`,
            '',
            this.getRankMessage(this.gameProgress.totalScore)
        ];
        
        finalStats.forEach((stat, index) => {
            if (stat === '') return;
            
            const isRank = stat.includes('Rank') || stat.includes('Mestre') || stat.includes('Campeão');
            const color = isRank ? '#ff6b6b' : '#ffffff';
            const fontSize = isRank ? '18px' : '16px';
            
            this.add.text(400, 180 + (index * 30), stat, {
                fontSize: fontSize,
                fontFamily: 'Press Start 2P',
                fill: color,
                stroke: '#000000',
                strokeThickness: 2
            }).setOrigin(0.5);
        });
        
        // Botões de ação
        this.createActionButtons();
    }
    
    createCelebrationEffects() {
        // Partículas de comemoração
        const emitter = this.add.particles(400, 200, 'white', {
            scale: { start: 0.5, end: 0 },
            alpha: { start: 1, end: 0 },
            speed: { min: 100, max: 200 },
            lifespan: 1000,
            frequency: 100,
            emitZone: { 
                type: 'edge', 
                source: new Phaser.Geom.Rectangle(-50, -50, 100, 100),
                quantity: 5
            }
        });
        
        // Estrelas girando
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            const radius = 150;
            const x = 400 + Math.cos(angle) * radius;
            const y = 150 + Math.sin(angle) * radius;
            
            const star = this.add.text(x, y, '⭐', {
                fontSize: '24px'
            }).setOrigin(0.5);
            
            this.tweens.add({
                targets: star,
                rotation: Math.PI * 2,
                duration: 3000,
                repeat: -1,
                ease: 'Linear'
            });
        }
    }
    
    getRankMessage(score) {
        if (score >= 5000) return '🏅 Rank: MESTRE DO COQUINHO!';
        if (score >= 3000) return '🥇 Rank: CAMPEÃO DA PRAIA!';
        if (score >= 2000) return '🥈 Rank: GUERREIRO COQUINHO!';
        if (score >= 1000) return '🥉 Rank: DEFENSOR DA PRAIA!';
        return '🎖️ Rank: NOVATO CORAJOSO!';
    }
    
    createActionButtons() {
        // Botão Jogar Novamente
        this.playAgainBtn = this.add.text(400, 380, 'JOGAR NOVAMENTE', {
            fontSize: '18px',
            fontFamily: 'Press Start 2P',
            fill: '#00ff00',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5);
        
        this.playAgainBtn.setInteractive();
        this.playAgainBtn.on('pointerdown', () => {
            this.restartGame();
        });
        
        this.playAgainBtn.on('pointerover', () => {
            this.playAgainBtn.setFill('#ffff00');
        });
        this.playAgainBtn.on('pointerout', () => {
            this.playAgainBtn.setFill('#00ff00');
        });
        
        // Instruções
        this.add.text(400, 440, 'Pressione ENTER/START para jogar novamente', {
            fontSize: '12px',
            fontFamily: 'Press Start 2P',
            fill: '#74b9ff',
            stroke: '#000000',
            strokeThickness: 1
        }).setOrigin(0.5);
        
        // Configurar inputs
        this.input.keyboard.on('keydown-ENTER', () => {
            this.restartGame();
        });
    }
    
    update() {
        // Verificar gamepad
        if (this.gamepadManager) {
            this.gamepadManager.update();
            
            if (this.gamepadManager.hasAnyGamepad()) {
                if (this.gamepadManager.isButtonJustPressed('menu')) {
                    this.restartGame();
                }
            }
        }
    }
    
    restartGame() {
        // Vibração de feedback
        if (this.gamepadManager) {
            this.gamepadManager.vibrateAll(0.3, 0.5, 200);
        }
        
        // Voltar ao menu principal
        this.scene.start('MenuScene');
    }
}

// === SCENE PRINCIPAL DO JOGO ===
class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
    }

    init(data) {
        console.log('=== INICIALIZANDO GAMESCENE ===');
        console.log('Dados recebidos:', data);
        
        // Dados do sistema de progressão
        this.currentMapId = data.mapId || 1;
        this.totalScore = data.totalScore || 0;
        this.gameProgress = data.gameProgress || {
            currentMap: 1,
            totalMaps: MapManager.getTotalMaps(),
            totalScore: 0,
            totalTime: 0,
            mapsCompleted: 0,
            mapStats: []
        };
        
        console.log(`Mapa atual: ${this.currentMapId}`);
        console.log(`Progresso:`, this.gameProgress);
        console.log('===========================');
    }

    create() {
        // Sistema de input
        this.inputManager = new InputManager(this);
        
        // Configurar gamepad manager
        this.gamepadManager = window.gamepadManager;
        
        // Grupos de objetos
        this.platforms = this.physics.add.staticGroup();
        this.enemies = this.physics.add.group();
        this.powerups = this.physics.add.group();
        
        // Variáveis do jogo
        this.score = 0; // Pontuação do mapa atual
        this.enemiesRemaining = 0;
        this.startTime = Date.now();
        this.gameWon = false;
        
        // Obter dados do mapa atual
        this.currentMapData = MapManager.getCurrentMap(this.currentMapId);
        
        // Criar nível baseado no mapa atual
        this.createLevel();
        
        // Configurar câmera para seguir o jogador
        this.setupCamera();
        
        // UI (criar depois do nível para ter o valor correto)
        this.createUI();
        
        // Configurar colisões
        this.setupCollisions();
        
        // Controles touch para mobile
        this.setupTouchControls();
    }
    
    setupCamera() {
        if (this.player) {
            // Configurar câmera para seguir o jogador
            this.cameras.main.startFollow(this.player);
            
            // Configurar limites da câmera baseado no tamanho do mundo
            // Calcular dimensões do mundo baseado no mapa
            const worldWidth = this.levelWidth * this.tileSize;
            const worldHeight = this.levelHeight * this.tileSize;
            
            // Definir limites do mundo para física
            this.physics.world.setBounds(0, 0, worldWidth, worldHeight);
            
            // Definir limites da câmera
            this.cameras.main.setBounds(0, 0, worldWidth, worldHeight);
            
            // Configurações de seguimento da câmera
            this.cameras.main.setLerp(0.1, 0.1); // Suavização do movimento
            this.cameras.main.setDeadzone(100, 100); // Zona morta no centro
            
            // Zoom opcional (para mapas muito grandes)
            // this.cameras.main.setZoom(0.8);
            
            console.log(`Mundo configurado: ${worldWidth}x${worldHeight} pixels`);
        }
    }

    createLevel() {
        // Usar dados do mapa atual
        const levelData = this.currentMapData.data;
        
        // Armazenar dimensões do nível para configurar a câmera
        this.levelHeight = levelData.length;
        this.levelWidth = levelData[0].length;
        this.tileSize = 40;
        
        // Contador detalhado de inimigos
        this.enemyCount = {
            selfie_tourist: 0,
            child_float: 0,
            sunscreen_guy: 0,
            total: 0
        };
        
        for (let row = 0; row < levelData.length; row++) {
            for (let col = 0; col < levelData[row].length; col++) {
                const char = levelData[row][col];
                const x = col * this.tileSize + this.tileSize/2;
                const y = row * this.tileSize + this.tileSize/2;
                
                switch(char) {
                    case '#':
                        const platform = this.add.rectangle(x, y, this.tileSize, this.tileSize, 0xf39c12);
                        this.physics.add.existing(platform, true);
                        this.platforms.add(platform);
                        break;
                    case 'P':
                        this.player = new Player(this, x, y);
                        break;
                    case 'T':
                        const touristSelfie = new Enemy(this, x, y, 'selfie_tourist');
                        this.enemies.add(touristSelfie);
                        this.enemiesRemaining++;
                        this.enemyCount.selfie_tourist++;
                        this.enemyCount.total++;
                        break;
                    case 'K':
                        const childFloat = new Enemy(this, x, y, 'child_float');
                        this.enemies.add(childFloat);
                        this.enemiesRemaining++;
                        this.enemyCount.child_float++;
                        this.enemyCount.total++;
                        break;
                    case 'B':
                        const sunscreenGuy = new Enemy(this, x, y, 'sunscreen_guy');
                        this.enemies.add(sunscreenGuy);
                        this.enemiesRemaining++;
                        this.enemyCount.sunscreen_guy++;
                        this.enemyCount.total++;
                        break;
                    case 'C':
                        // Criar o caju com visual aprimorado
                        const powerup = this.add.container(x, y);
                        
                        // Corpo do caju (vermelho)
                        const cajuBody = this.add.circle(0, 0, 12, 0xe74c3c);
                        cajuBody.setStrokeStyle(2, 0xc0392b, 1);
                        
                        // Castanha (parte marrom em cima)
                        const cajuNut = this.add.rectangle(0, -8, 8, 6, 0x8b4513);
                        cajuNut.setStrokeStyle(1, 0x654321, 1);
                        
                        // Adicionar ao container
                        powerup.add([cajuBody, cajuNut]);
                        
                        // Adicionar física ao container
                        this.physics.add.existing(powerup);
                        powerup.body.setBounce(0.3);
                        powerup.body.setCollideWorldBounds(true);
                        powerup.body.setSize(24, 24); // Tamanho da hitbox
                        
                        // Animação de flutuação
                        this.tweens.add({
                            targets: powerup,
                            y: y - 5,
                            duration: 1000,
                            yoyo: true,
                            repeat: -1,
                            ease: 'Sine.easeInOut'
                        });
                        
                        // Animação de rotação
                        this.tweens.add({
                            targets: powerup,
                            rotation: Math.PI * 2,
                            duration: 3000,
                            repeat: -1,
                            ease: 'Linear'
                        });
                        
                        this.powerups.add(powerup);
                        break;
                    case 'G':
                        // Criar objetivo com visual mais chamativo e física correta
                        this.goal = this.add.rectangle(x, y, this.tileSize, this.tileSize*2, 0x2ecc71);
                        this.goal.setStrokeStyle(4, 0x27ae60, 1);
                        
                        // Adicionar física como sensor (não bloqueia movimento)
                        this.physics.add.existing(this.goal, true);
                        this.goal.body.setSize(this.tileSize, this.tileSize*2);
                        
                        // Adicionar efeito visual piscante para destacar
                        this.tweens.add({
                            targets: this.goal,
                            alpha: 0.5,
                            duration: 1000,
                            yoyo: true,
                            repeat: -1,
                            ease: 'Sine.easeInOut'
                        });
                        
                        console.log(`🎯 Objetivo criado na posição: x=${x}, y=${y}, tamanho: ${this.tileSize}x${this.tileSize*2}`);
                        break;
                }
            }
        }
        
        // Log das estatísticas do mapa criado
        console.log('=== ESTATÍSTICAS DO MAPA ===');
        console.log(`🗺️ Mapa: ${this.currentMapData.name} (${this.currentMapData.difficulty})`);
        console.log(`📏 Dimensões: ${this.levelWidth}x${this.levelHeight} tiles (${this.levelWidth * this.tileSize}x${this.levelHeight * this.tileSize} pixels)`);
        console.log('👥 Inimigos encontrados:');
        console.log(`   📱 Turistas Selfie: ${this.enemyCount.selfie_tourist}`);
        console.log(`   🏊 Crianças de Boia: ${this.enemyCount.child_float}`);
        console.log(`   🌞 Tiozões Bronzeador: ${this.enemyCount.sunscreen_guy}`);
        console.log(`   🎯 Total de Inimigos: ${this.enemyCount.total}`);
        console.log('========================');
        
        // IMPORTANTE: Definir inimigos restantes após criar todos
        this.enemiesRemaining = this.enemyCount.total;
        console.log('=== INICIALIZAÇÃO FINAL ===');
        console.log(`🎯 Inimigos restantes inicializados: ${this.enemiesRemaining}`);
        console.log(`📍 Objetivo criado: ${this.goal ? 'SIM' : 'NÃO'}`);
        console.log('===========================');
    }

    createUI() {
        // HUD fixo na tela (não se move com a câmera)
        this.scoreText = this.add.text(20, 20, 'Pontos: 0', {
            fontSize: '16px',
            fontFamily: 'Arial',
            fill: '#ffffff',
            backgroundColor: '#000000',
            padding: { x: 8, y: 4 }
        }).setScrollFactor(0); // Importante: não segue a câmera
        
        this.timerText = this.add.text(20, 50, 'Tempo: 0.00s', {
            fontSize: '16px',
            fontFamily: 'Arial',
            fill: '#ffffff',
            backgroundColor: '#000000',
            padding: { x: 8, y: 4 }
        }).setScrollFactor(0); // Importante: não segue a câmera
        
        this.touristText = this.add.text(20, 80, `Inimigos restantes: ${this.enemiesRemaining}`, {
            fontSize: '16px',
            fontFamily: 'Arial',
            fill: '#ffffff',
            backgroundColor: '#000000',
            padding: { x: 8, y: 4 }
        }).setScrollFactor(0); // Importante: não segue a câmera
        
        // Indicador de posição do jogador e detalhes do mapa
        this.positionText = this.add.text(20, 110, 'Posição: 0, 0', {
            fontSize: '14px',
            fontFamily: 'Arial',
            fill: '#ffffff',
            backgroundColor: '#000000',
            padding: { x: 6, y: 3 }
        }).setScrollFactor(0);
        
        // Contador detalhado de inimigos (canto superior direito)
        this.enemyDetailsText = this.add.text(this.cameras.main.width - 20, 20, 
            `📱${this.enemyCount.selfie_tourist} 🏊${this.enemyCount.child_float} 🌞${this.enemyCount.sunscreen_guy}`, {
            fontSize: '14px',
            fontFamily: 'Arial',
            fill: '#ffffff',
            backgroundColor: '#000000',
            padding: { x: 6, y: 3 }
        }).setOrigin(1, 0).setScrollFactor(0);
    }

    setupTouchControls() {
        if (!this.sys.game.device.input.touch) return;
        
        const buttonSize = 60;
        const margin = 20;
        
        // Botões de movimento (fixos na tela)
        const leftBtn = this.add.circle(margin + buttonSize/2, this.cameras.main.height - margin - buttonSize/2, buttonSize/2, 0xff7675, 0.7);
        const rightBtn = this.add.circle(margin*2 + buttonSize*1.5, this.cameras.main.height - margin - buttonSize/2, buttonSize/2, 0xff7675, 0.7);
        const jumpBtn = this.add.circle(this.cameras.main.width - margin*2 - buttonSize*1.5, this.cameras.main.height - margin - buttonSize/2, buttonSize/2, 0x74b9ff, 0.7);
        const attackBtn = this.add.circle(this.cameras.main.width - margin - buttonSize/2, this.cameras.main.height - margin - buttonSize/2, buttonSize/2, 0xfd79a8, 0.7);
        
        // Tornar os botões fixos na tela (não seguem a câmera)
        leftBtn.setScrollFactor(0);
        rightBtn.setScrollFactor(0);
        jumpBtn.setScrollFactor(0);
        attackBtn.setScrollFactor(0);
        
        // Textos dos botões
        const leftText = this.add.text(leftBtn.x, leftBtn.y, '←', { fontSize: '24px', fill: '#fff' }).setOrigin(0.5).setScrollFactor(0);
        const rightText = this.add.text(rightBtn.x, rightBtn.y, '→', { fontSize: '24px', fill: '#fff' }).setOrigin(0.5).setScrollFactor(0);
        const jumpText = this.add.text(jumpBtn.x, jumpBtn.y, '↑', { fontSize: '24px', fill: '#fff' }).setOrigin(0.5).setScrollFactor(0);
        const attackText = this.add.text(attackBtn.x, attackBtn.y, 'A', { fontSize: '20px', fill: '#fff' }).setOrigin(0.5).setScrollFactor(0);
        
        // Eventos touch
        leftBtn.setInteractive()
            .on('pointerdown', () => this.inputManager.setTouchControl('left', true))
            .on('pointerup', () => this.inputManager.setTouchControl('left', false));
            
        rightBtn.setInteractive()
            .on('pointerdown', () => this.inputManager.setTouchControl('right', true))
            .on('pointerup', () => this.inputManager.setTouchControl('right', false));
            
        jumpBtn.setInteractive()
            .on('pointerdown', () => this.inputManager.setTouchControl('up', true))
            .on('pointerup', () => this.inputManager.setTouchControl('up', false));
            
        attackBtn.setInteractive()
            .on('pointerdown', () => this.inputManager.setTouchControl('attack', true))
            .on('pointerup', () => this.inputManager.setTouchControl('attack', false));
    }

    setupCollisions() {
        // Jogador com plataformas
        this.physics.add.collider(this.player, this.platforms);
        
        // Inimigos com plataformas
        this.physics.add.collider(this.enemies, this.platforms);
        
        // Power-ups com plataformas (para não passarem através)
        this.physics.add.collider(this.powerups, this.platforms);
        
        // Jogador com power-ups
        this.physics.add.overlap(this.player, this.powerups, (player, powerup) => {
            powerup.destroy();
            player.powerUp();
            
            // Feedback de vibração para power-up
            this.inputManager.vibrate(0.2, 0.3, 150);
        });
        
        // Criar um sistema de detecção de ataque mais robusto
        this.physics.world.on('worldstep', () => {
            if (this.player && this.player.isAttacking) {
                this.checkAttackCollisions();
            }
        });
        
        // Jogador com objetivo - usar overlap para sensor
        if (this.goal) {
            console.log('🎯 Configurando colisão com objetivo...');
            this.physics.add.overlap(this.player, this.goal, () => {
                console.log('🎯 Jogador tocou no objetivo!');
                console.log('📊 Inimigos restantes:', this.enemiesRemaining);
                this.checkWinCondition();
            });
        } else {
            console.log('⚠️ ATENÇÃO: Objetivo não encontrado! O mapa pode não ter um objetivo definido.');
        }
    }
    
    // Nova função para verificar condição de vitória
    checkWinCondition() {
        console.log('=== VERIFICAÇÃO DE VITÓRIA ===');
        console.log(`Inimigos restantes: ${this.enemiesRemaining}`);
        console.log(`Jogo já ganho: ${this.gameWon}`);
        console.log(`Objetivo existe: ${this.goal ? 'SIM' : 'NÃO'}`);
        
        if (this.enemiesRemaining <= 0 && !this.gameWon) {
            console.log('✅ Condições de vitória atendidas - chamando winGame()');
            this.winGame();
        } else if (this.enemiesRemaining > 0) {
            console.log(`❌ Ainda há ${this.enemiesRemaining} inimigo(s) para derrotar!`);
            
            // Mostrar mensagem temporária
            if (this.warningMessage) {
                this.warningMessage.destroy();
            }
            this.warningMessage = this.add.text(this.cameras.main.centerX, this.cameras.main.centerY - 50, 
                `DERROTE TODOS OS INIMIGOS PRIMEIRO!\n${this.enemiesRemaining} restante(s)`, {
                fontSize: '16px',
                fontFamily: 'Press Start 2P',
                fill: '#ff0000',
                stroke: '#000000',
                strokeThickness: 2,
                align: 'center'
            }).setOrigin(0.5).setScrollFactor(0);
            
            // Remover mensagem após 2 segundos
            this.time.delayedCall(2000, () => {
                if (this.warningMessage) {
                    this.warningMessage.destroy();
                }
            });
        }
    }
    
    checkAttackCollisions() {
        const attackRadius = this.player.isPoweredUp ? 60 : 40;
        
        this.enemies.children.entries.forEach(enemy => {
            if (!enemy.isHit) {
                const distance = Phaser.Math.Distance.Between(
                    this.player.x, this.player.y,
                    enemy.x, enemy.y
                );
                
                if (distance <= attackRadius) {
                    console.log(`⚡ Atacando inimigo! Distância: ${distance.toFixed(2)}`);
                    enemy.hit();
                    this.score += 100;
                    this.enemiesRemaining = Math.max(0, this.enemiesRemaining - 1);
                    this.updateUI();
                    
                    // Feedback de vibração para hit
                    this.inputManager.vibrate(0.5, 0.7, 100);
                    
                    // Verificar se todos os inimigos foram nocauteados
                    console.log(`💥 Inimigo derrotado! Inimigos restantes: ${this.enemiesRemaining}`);
                    console.log('Inimigo derrotado! Inimigos restantes:', this.enemiesRemaining);
                    if (this.enemiesRemaining <= 0) {
                        console.log('Todos os inimigos derrotados! Agora precisa tocar no objetivo.');
                        // Mostrar mensagem para o jogador
                        if (this.goalMessage) {
                            this.goalMessage.destroy();
                        }
                        this.goalMessage = this.add.text(this.cameras.main.centerX, this.cameras.main.centerY - 100, 
                            'TODOS OS INIMIGOS DERROTADOS!\nVÁ PARA O OBJETIVO VERDE!', {
                            fontSize: '16px',
                            fontFamily: 'Press Start 2P',
                            fill: '#ffff00',
                            stroke: '#000000',
                            strokeThickness: 2,
                            align: 'center'
                        }).setOrigin(0.5).setScrollFactor(0);
                        
                        // Remover a mensagem após 3 segundos
                        this.time.delayedCall(3000, () => {
                            if (this.goalMessage) {
                                this.goalMessage.destroy();
                            }
                        });
                    }
                }
            }
        });
    }

    update(time, delta) {
        if (this.gameWon) return;
        
        // Atualizar objetos
        this.player?.update(time, delta);
        this.enemies.children.entries.forEach(enemy => enemy.update());
        
        // Atualizar input manager
        this.inputManager.update();
        
        // Verificação manual adicional para o objetivo
        if (this.player && this.goal && this.enemiesRemaining <= 0 && !this.gameWon) {
            const distance = Phaser.Math.Distance.Between(
                this.player.x, this.player.y,
                this.goal.x, this.goal.y
            );
            
            // Se estiver muito próximo do objetivo (sobreposição)
            if (distance < 50) {
                console.log('🎯 Detecção manual: Jogador próximo do objetivo!');
                this.checkWinCondition();
            }
        }
        
        // Atualizar UI
        const elapsedTime = (Date.now() - this.startTime) / 1000;
        this.timerText.setText(`Tempo: ${elapsedTime.toFixed(2)}s`);
        
        // Atualizar posição do jogador na UI (para debug/orientação)
        if (this.player && this.positionText) {
            const worldX = Math.floor(this.player.x / this.tileSize);
            const worldY = Math.floor(this.player.y / this.tileSize);
            this.positionText.setText(`Posição: ${worldX}, ${worldY}`);
        }
    }

    updateUI() {
        this.scoreText.setText(`Pontos: ${this.score}`);
        // Garantir que não mostre valores negativos
        const remainingEnemies = Math.max(0, this.enemiesRemaining);
        this.touristText.setText(`Inimigos restantes: ${remainingEnemies}`);
    }

    winGame() {
        console.log('🎉 JOGADOR VENCEU O MAPA! 🎉');
        
        this.gameWon = true;
        
        // Parar toda a música e efeitos sonoros
        // this.stopAllSounds(); // TODO: Implementar sistema de som
        
        // Parar todas as animações de inimigos
        this.enemies.children.entries.forEach(enemy => {
            if (enemy.body) {
                enemy.body.setVelocity(0, 0);
            }
            if (enemy.tween) {
                enemy.tween.stop();
            }
        });
        
        // Calcular pontuação do mapa atual
        const elapsedTime = (Date.now() - this.startTime) / 1000;
        const timeBonus = Math.max(0, 180 - elapsedTime) * 10; // Bônus de tempo
        const mapScore = this.score + timeBonus;
        
        // Parar o timer (se existir)
        if (this.gameTimerEvent) {
            this.gameTimerEvent.destroy();
        }
        
        // Atualizar dados de progresso
        this.gameProgress.totalScore += mapScore;
        this.gameProgress.mapsCompleted++;
        this.gameProgress.totalTime += elapsedTime;
        
        // Adicionar estatísticas do mapa
        if (!this.gameProgress.mapStats) {
            this.gameProgress.mapStats = [];
        }
        
        this.gameProgress.mapStats.push({
            mapId: this.currentMapId,
            mapName: this.currentMapData.name,
            score: this.score,
            timeBonus: timeBonus,
            totalScore: mapScore,
            timeSpent: elapsedTime,
            enemiesDefeated: this.enemyCount.total
        });
        
        console.log(`Mapa "${this.currentMapData.name}" completado!`);
        console.log(`Pontuação do mapa: ${mapScore} (Base: ${this.score} + Bônus tempo: ${timeBonus})`);
        console.log(`Pontuação total acumulada: ${this.gameProgress.totalScore}`);
        
        // Verificar se há próximo mapa
        const nextMapId = MapManager.getNextMapId(this.currentMapId);
        
        if (nextMapId) {
            console.log(`Próximo mapa: ${nextMapId}`);
            // Transição para tela de resumo do mapa
            this.scene.start('MapCompleteScene', {
                mapScore: mapScore,
                timeBonus: timeBonus,
                gameProgress: this.gameProgress,
                nextMapId: nextMapId,
                currentMapData: this.currentMapData
            });
        } else {
            console.log('🏆 TODOS OS MAPAS COMPLETADOS! 🏆');
            // Transição para tela de vitória final
            this.scene.start('GameCompleteScene', {
                gameProgress: this.gameProgress
            });
        }
    }
}

// === INICIALIZAÇÃO ===
window.addEventListener('load', () => {
    const game = new Phaser.Game(GameConfig.get());
});
