// === CONFIGURAÇÕES AVANÇADAS DE GAMEPAD ===
class GamepadManager {
    constructor() {
        this.gamepads = [];
        this.deadzone = 0.1;
        this.buttonPressed = {};
        this.stickMoved = {};
        this.vibrationEnabled = true;
        
        // Mapeamento de controles por tipo de gamepad
        this.controlMaps = {
            'xbox': {
                buttons: {
                    jump: [0], // A
                    attack: [1, 2], // B, X
                    menu: [9], // Menu
                    select: [8] // View
                },
                axes: {
                    horizontal: 0,
                    vertical: 1
                }
            },
            'playstation': {
                buttons: {
                    jump: [0], // X
                    attack: [1, 2], // Circle, Square  
                    menu: [9], // Options
                    select: [8] // Share
                },
                axes: {
                    horizontal: 0,
                    vertical: 1
                }
            },
            'generic': {
                buttons: {
                    jump: [0, 1],
                    attack: [2, 3],
                    menu: [9],
                    select: [8]
                },
                axes: {
                    horizontal: 0,
                    vertical: 1
                }
            }
        };
        
        this.setupEventListeners();
    }

    setupEventListeners() {
        window.addEventListener('gamepadconnected', (e) => {
            console.log('Gamepad conectado:', e.gamepad.id);
            this.addGamepad(e.gamepad);
            this.notifyConnection(e.gamepad);
        });

        window.addEventListener('gamepaddisconnected', (e) => {
            console.log('Gamepad desconectado:', e.gamepad.id);
            this.removeGamepad(e.gamepad);
        });
    }

    addGamepad(gamepad) {
        this.gamepads[gamepad.index] = gamepad;
        
        // Auto-detectar tipo de gamepad
        const id = gamepad.id.toLowerCase();
        let type = 'generic';
        
        if (id.includes('xbox') || id.includes('xinput')) {
            type = 'xbox';
        } else if (id.includes('playstation') || id.includes('dualshock') || id.includes('dualsense')) {
            type = 'playstation';
        }
        
        gamepad.detectedType = type;
        
        // Testar vibração se disponível
        if (gamepad.vibrationActuator && this.vibrationEnabled) {
            this.testVibration(gamepad);
        }
    }

    removeGamepad(gamepad) {
        delete this.gamepads[gamepad.index];
    }

    update() {
        // Atualizar lista de gamepads
        const connectedGamepads = navigator.getGamepads();
        for (let i = 0; i < connectedGamepads.length; i++) {
            if (connectedGamepads[i]) {
                this.gamepads[i] = connectedGamepads[i];
            }
        }
    }

    getInput() {
        const input = {
            left: false,
            right: false,
            up: false,
            attack: false,
            menu: false,
            leftStick: { x: 0, y: 0 },
            rightStick: { x: 0, y: 0 }
        };

        for (let gamepad of Object.values(this.gamepads)) {
            if (!gamepad) continue;

            const controlMap = this.controlMaps[gamepad.detectedType] || this.controlMaps.generic;
            
            // Botões
            for (let buttonIndex of controlMap.buttons.jump) {
                if (gamepad.buttons[buttonIndex] && gamepad.buttons[buttonIndex].pressed) {
                    input.up = true;
                }
            }
            
            for (let buttonIndex of controlMap.buttons.attack) {
                if (gamepad.buttons[buttonIndex] && gamepad.buttons[buttonIndex].pressed) {
                    input.attack = true;
                }
            }

            // D-pad
            if (gamepad.buttons[14] && gamepad.buttons[14].pressed) input.left = true; // D-pad left
            if (gamepad.buttons[15] && gamepad.buttons[15].pressed) input.right = true; // D-pad right
            if (gamepad.buttons[12] && gamepad.buttons[12].pressed) input.up = true; // D-pad up

            // Analógicos
            const leftStickX = gamepad.axes[controlMap.axes.horizontal];
            const leftStickY = gamepad.axes[controlMap.axes.vertical];

            if (Math.abs(leftStickX) > this.deadzone) {
                input.leftStick.x = leftStickX;
                if (leftStickX < -this.deadzone) input.left = true;
                if (leftStickX > this.deadzone) input.right = true;
            }

            if (Math.abs(leftStickY) > this.deadzone) {
                input.leftStick.y = leftStickY;
                if (leftStickY < -this.deadzone) input.up = true;
            }

            // Stick direito (se necessário para câmera, etc.)
            if (gamepad.axes.length > 2) {
                const rightStickX = gamepad.axes[2];
                const rightStickY = gamepad.axes[3];
                
                if (Math.abs(rightStickX) > this.deadzone) {
                    input.rightStick.x = rightStickX;
                }
                
                if (Math.abs(rightStickY) > this.deadzone) {
                    input.rightStick.y = rightStickY;
                }
            }
        }

        return input;
    }

    isButtonJustPressed(buttonType) {
        for (let gamepad of Object.values(this.gamepads)) {
            if (!gamepad) continue;

            const controlMap = this.controlMaps[gamepad.detectedType] || this.controlMaps.generic;
            const buttons = controlMap.buttons[buttonType] || [];
            
            for (let buttonIndex of buttons) {
                const button = gamepad.buttons[buttonIndex];
                if (button && button.pressed && !this.buttonPressed[`${gamepad.index}_${buttonIndex}`]) {
                    this.buttonPressed[`${gamepad.index}_${buttonIndex}`] = true;
                    return true;
                }
                if (!button || !button.pressed) {
                    this.buttonPressed[`${gamepad.index}_${buttonIndex}`] = false;
                }
            }
        }
        return false;
    }

    vibrate(gamepadIndex, weakMagnitude = 0, strongMagnitude = 0, duration = 100) {
        if (!this.vibrationEnabled) return;
        
        const gamepad = this.gamepads[gamepadIndex];
        if (gamepad && gamepad.vibrationActuator) {
            gamepad.vibrationActuator.playEffect('dual-rumble', {
                startDelay: 0,
                duration: duration,
                weakMagnitude: weakMagnitude,
                strongMagnitude: strongMagnitude
            }).catch(err => {
                console.log('Vibração não suportada:', err);
            });
        }
    }

    vibrateAll(weakMagnitude = 0.3, strongMagnitude = 0.7, duration = 150) {
        for (let i = 0; i < this.gamepads.length; i++) {
            this.vibrate(i, weakMagnitude, strongMagnitude, duration);
        }
    }

    testVibration(gamepad) {
        if (gamepad.vibrationActuator) {
            gamepad.vibrationActuator.playEffect('dual-rumble', {
                startDelay: 0,
                duration: 200,
                weakMagnitude: 0.2,
                strongMagnitude: 0.4
            }).catch(() => {
                // Vibração não suportada
            });
        }
    }

    notifyConnection(gamepad) {
        // Notificar o jogo que um gamepad foi conectado
        if (window.gameAPI && window.gameAPI.onGamepadConnected) {
            window.gameAPI.onGamepadConnected(gamepad);
        }
        
        // Feedback visual/sonoro
        if (window.gameAPI && window.gameAPI.showNotification) {
            window.gameAPI.showNotification(`🎮 ${gamepad.id.substring(0, 30)}... conectado!`);
        }
    }

    getConnectedGamepads() {
        return Object.values(this.gamepads).filter(g => g !== undefined);
    }

    hasAnyGamepad() {
        return this.getConnectedGamepads().length > 0;
    }

    setDeadzone(value) {
        this.deadzone = Math.max(0, Math.min(1, value));
    }

    toggleVibration() {
        this.vibrationEnabled = !this.vibrationEnabled;
        return this.vibrationEnabled;
    }

    // Método para obter informações detalhadas do gamepad
    getGamepadInfo(gamepadIndex) {
        const gamepad = this.gamepads[gamepadIndex];
        if (!gamepad) return null;

        return {
            id: gamepad.id,
            index: gamepad.index,
            connected: gamepad.connected,
            timestamp: gamepad.timestamp,
            buttonsCount: gamepad.buttons.length,
            axesCount: gamepad.axes.length,
            detectedType: gamepad.detectedType,
            supportsVibration: !!gamepad.vibrationActuator
        };
    }

    // Método para calibrar analógicos
    calibrateSticks() {
        console.log('=== CALIBRAÇÃO DE ANALÓGICOS ===');
        console.log('Mova os analógicos e observe os valores:');
        
        const interval = setInterval(() => {
            for (let gamepad of Object.values(this.gamepads)) {
                if (!gamepad) continue;
                
                console.log(`Gamepad ${gamepad.index}:`);
                console.log(`  Stick Esquerdo: X=${gamepad.axes[0].toFixed(3)}, Y=${gamepad.axes[1].toFixed(3)}`);
                if (gamepad.axes.length > 2) {
                    console.log(`  Stick Direito: X=${gamepad.axes[2].toFixed(3)}, Y=${gamepad.axes[3].toFixed(3)}`);
                }
            }
        }, 1000);

        // Parar calibração após 10 segundos
        setTimeout(() => {
            clearInterval(interval);
            console.log('=== CALIBRAÇÃO FINALIZADA ===');
        }, 10000);
    }
}

// Instância global do gerenciador de gamepad
window.gamepadManager = new GamepadManager();

// Atualizar gamepad a cada frame
function updateGamepad() {
    window.gamepadManager.update();
    requestAnimationFrame(updateGamepad);
}
updateGamepad();

// Expor funções úteis para debug
window.debugGamepad = {
    calibrate: () => window.gamepadManager.calibrateSticks(),
    info: (index = 0) => window.gamepadManager.getGamepadInfo(index),
    test: (index = 0) => window.gamepadManager.vibrate(index, 0.5, 0.5, 500),
    list: () => window.gamepadManager.getConnectedGamepads().map(g => g.id)
};
