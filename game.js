class Player {
    constructor(canvas, image) {
        this.canvas = canvas;
        this.image = image;
        this.width = 80;
        this.height = 80;
        this.x = canvas.width / 2 - this.width / 2;
        this.y = canvas.height - this.height - 60; // Above the queue bar
        this.baseSpeed = 5;
        this.speed = this.baseSpeed;
    }

    update(keys, speedMultiplier = 1) {
        this.speed = this.baseSpeed * speedMultiplier;
        if (keys.ArrowLeft && this.x > 0) {
            this.x -= this.speed;
        }
        if (keys.ArrowRight && this.x < this.canvas.width - this.width) {
            this.x += this.speed;
        }
    }

    draw(ctx) {
        ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
    }
}

class FallingObject {
    constructor(canvas, image, type, gameSpeed, label) {
        this.canvas = canvas;
        this.image = image;
        this.type = type; // 'good', 'bad', 'goodbot'
        this.label = label || '';
        this.width = 50;
        this.height = 50;
        this.x = Math.random() * (canvas.width - this.width);
        this.y = -this.height;
        this.baseSpeed = 2.5;
        this.speed = this.baseSpeed * gameSpeed;
    }

    update(gameSpeed) {
        this.speed = this.baseSpeed * gameSpeed;
        this.y += this.speed;
    }

    draw(ctx) {
        ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
    }
}

class PartyPopper {
    constructor(canvas, x, y) {
        this.canvas = canvas;
        this.x = x;
        this.y = y;
        this.particles = [];
        this.gravity = 0.5;
        this.fade = 0.02;
        this.colors = ['#00b4e6', '#48d597', '#FFD700', '#FF6B6B', '#FF69B4'];
        this.createParticles();
    }

    createParticles() {
        for (let i = 0; i < 50; i++) {
            const angle = (Math.random() * Math.PI * 2);
            const speed = 2 + Math.random() * 6;
            this.particles.push({
                x: this.x, y: this.y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: 3 + Math.random() * 4,
                color: this.colors[Math.floor(Math.random() * this.colors.length)],
                opacity: 1
            });
        }
    }

    update() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx; p.y += p.vy;
            p.vy += this.gravity; p.opacity -= this.fade;
            if (p.opacity <= 0) this.particles.splice(i, 1);
        }
        return this.particles.length > 0;
    }

    draw(ctx) {
        this.particles.forEach(p => {
            ctx.save();
            ctx.globalAlpha = p.opacity;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        });
    }
}

class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.canvas.width = 900;
        this.canvas.height = 700;

        this.keys = {};
        this.initializeBackground();
        this.loadAssets();
        this.loadScores();
        this.partyPoppers = [];
        this.queue = []; // Caught items queue at the bottom
        this.setupGame();
        this.setupEventListeners();
    }

    initializeBackground() {
        const background = document.getElementById('game-background');
        background.style.position = 'fixed';
        background.style.top = '0';
        background.style.left = '0';
        background.style.width = '100%';
        background.style.height = '100%';
        background.style.zIndex = '-1';

        const bgCanvas = document.createElement('canvas');
        bgCanvas.width = window.innerWidth;
        bgCanvas.height = window.innerHeight;
        const bgCtx = bgCanvas.getContext('2d');

        // Queue-it branded background - clean digital theme
        const gradient = bgCtx.createLinearGradient(0, 0, 0, bgCanvas.height);
        gradient.addColorStop(0, '#0a1628');
        gradient.addColorStop(0.5, '#112240');
        gradient.addColorStop(1, '#0d1b2a');
        bgCtx.fillStyle = gradient;
        bgCtx.fillRect(0, 0, bgCanvas.width, bgCanvas.height);

        // Digital grid lines
        bgCtx.strokeStyle = 'rgba(0, 180, 230, 0.05)';
        bgCtx.lineWidth = 1;
        for (let x = 0; x < bgCanvas.width; x += 40) {
            bgCtx.beginPath();
            bgCtx.moveTo(x, 0);
            bgCtx.lineTo(x, bgCanvas.height);
            bgCtx.stroke();
        }
        for (let y = 0; y < bgCanvas.height; y += 40) {
            bgCtx.beginPath();
            bgCtx.moveTo(0, y);
            bgCtx.lineTo(bgCanvas.width, y);
            bgCtx.stroke();
        }

        // Floating dots
        for (let i = 0; i < 80; i++) {
            const x = Math.random() * bgCanvas.width;
            const y = Math.random() * bgCanvas.height;
            const size = Math.random() * 2;
            bgCtx.fillStyle = `rgba(0, 180, 230, ${0.1 + Math.random() * 0.3})`;
            bgCtx.beginPath();
            bgCtx.arc(x, y, size, 0, Math.PI * 2);
            bgCtx.fill();
        }

        background.style.background = `url(${bgCanvas.toDataURL()})`;
        background.style.backgroundSize = 'cover';
    }

    loadAssets() {
        // --- Queue-it logo (catcher for level 1) ---
        const createQueueItLogo = (withYear) => {
            const canvas = document.createElement('canvas');
            canvas.width = 80;
            canvas.height = 80;
            const ctx = canvas.getContext('2d');

            // Shield/badge shape
            ctx.fillStyle = '#00b4e6';
            ctx.beginPath();
            ctx.moveTo(40, 5);
            ctx.lineTo(70, 15);
            ctx.lineTo(70, 50);
            ctx.quadraticCurveTo(70, 70, 40, 75);
            ctx.quadraticCurveTo(10, 70, 10, 50);
            ctx.lineTo(10, 15);
            ctx.closePath();
            ctx.fill();

            // Inner shield
            ctx.fillStyle = '#0091b8';
            ctx.beginPath();
            ctx.moveTo(40, 12);
            ctx.lineTo(63, 20);
            ctx.lineTo(63, 48);
            ctx.quadraticCurveTo(63, 64, 40, 68);
            ctx.quadraticCurveTo(17, 64, 17, 48);
            ctx.lineTo(17, 20);
            ctx.closePath();
            ctx.fill();

            // Q letter
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 30px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('Q', 40, 38);

            // Small "-it" text
            ctx.font = 'bold 11px Arial';
            ctx.fillText('-it', 58, 52);

            if (withYear) {
                // 2026 banner on top
                ctx.fillStyle = '#48d597';
                ctx.beginPath();
                ctx.roundRect(15, 0, 50, 16, 3);
                ctx.fill();
                ctx.fillStyle = '#fff';
                ctx.font = 'bold 11px Arial';
                ctx.fillText('2026', 40, 10);
            }

            const img = new Image();
            img.src = canvas.toDataURL();
            return img;
        };

        // --- Device sprites (Level 1: browsers on devices) ---
        const createDevice = (type) => {
            const canvas = document.createElement('canvas');
            canvas.width = 50;
            canvas.height = 50;
            const ctx = canvas.getContext('2d');

            if (type === 'laptop') {
                // Laptop screen
                ctx.fillStyle = '#2c3e50';
                ctx.beginPath();
                ctx.roundRect(5, 5, 40, 28, 2);
                ctx.fill();
                // Screen content - browser
                ctx.fillStyle = '#3498db';
                ctx.fillRect(8, 8, 34, 22);
                // Browser bar
                ctx.fillStyle = '#ecf0f1';
                ctx.fillRect(8, 8, 34, 5);
                ctx.fillStyle = '#e74c3c';
                ctx.beginPath(); ctx.arc(12, 10.5, 1.5, 0, Math.PI * 2); ctx.fill();
                ctx.fillStyle = '#f1c40f';
                ctx.beginPath(); ctx.arc(16, 10.5, 1.5, 0, Math.PI * 2); ctx.fill();
                ctx.fillStyle = '#2ecc71';
                ctx.beginPath(); ctx.arc(20, 10.5, 1.5, 0, Math.PI * 2); ctx.fill();
                // Keyboard base
                ctx.fillStyle = '#95a5a6';
                ctx.beginPath();
                ctx.moveTo(2, 35);
                ctx.lineTo(48, 35);
                ctx.lineTo(45, 40);
                ctx.lineTo(5, 40);
                ctx.closePath();
                ctx.fill();
            } else if (type === 'phone') {
                // Phone body
                ctx.fillStyle = '#2c3e50';
                ctx.beginPath();
                ctx.roundRect(14, 3, 22, 42, 4);
                ctx.fill();
                // Screen
                ctx.fillStyle = '#3498db';
                ctx.fillRect(16, 8, 18, 30);
                // Browser bar
                ctx.fillStyle = '#ecf0f1';
                ctx.fillRect(16, 8, 18, 4);
                // Home button
                ctx.strokeStyle = '#7f8c8d';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.arc(25, 43, 2, 0, Math.PI * 2);
                ctx.stroke();
            } else if (type === 'tablet') {
                // Tablet body
                ctx.fillStyle = '#2c3e50';
                ctx.beginPath();
                ctx.roundRect(6, 4, 38, 42, 3);
                ctx.fill();
                // Screen
                ctx.fillStyle = '#3498db';
                ctx.fillRect(9, 7, 32, 33);
                // Browser bar
                ctx.fillStyle = '#ecf0f1';
                ctx.fillRect(9, 7, 32, 5);
                ctx.fillStyle = '#e74c3c';
                ctx.beginPath(); ctx.arc(13, 9.5, 1.5, 0, Math.PI * 2); ctx.fill();
                ctx.fillStyle = '#f1c40f';
                ctx.beginPath(); ctx.arc(17, 9.5, 1.5, 0, Math.PI * 2); ctx.fill();
                ctx.fillStyle = '#2ecc71';
                ctx.beginPath(); ctx.arc(21, 9.5, 1.5, 0, Math.PI * 2); ctx.fill();
                // Home button
                ctx.strokeStyle = '#7f8c8d';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.arc(25, 43, 2, 0, Math.PI * 2);
                ctx.stroke();
            } else if (type === 'desktop') {
                // Monitor
                ctx.fillStyle = '#2c3e50';
                ctx.beginPath();
                ctx.roundRect(5, 2, 40, 28, 2);
                ctx.fill();
                ctx.fillStyle = '#3498db';
                ctx.fillRect(8, 5, 34, 22);
                // Browser bar
                ctx.fillStyle = '#ecf0f1';
                ctx.fillRect(8, 5, 34, 5);
                ctx.fillStyle = '#e74c3c';
                ctx.beginPath(); ctx.arc(12, 7.5, 1.5, 0, Math.PI * 2); ctx.fill();
                ctx.fillStyle = '#f1c40f';
                ctx.beginPath(); ctx.arc(16, 7.5, 1.5, 0, Math.PI * 2); ctx.fill();
                ctx.fillStyle = '#2ecc71';
                ctx.beginPath(); ctx.arc(20, 7.5, 1.5, 0, Math.PI * 2); ctx.fill();
                // Stand
                ctx.fillStyle = '#95a5a6';
                ctx.fillRect(22, 32, 6, 6);
                ctx.fillRect(17, 38, 16, 3);
            }

            const img = new Image();
            img.src = canvas.toDataURL();
            return img;
        };

        // --- User with device sprites (Level 2) ---
        const createUserWithDevice = (deviceType, color) => {
            const canvas = document.createElement('canvas');
            canvas.width = 50;
            canvas.height = 50;
            const ctx = canvas.getContext('2d');

            // Person head
            ctx.fillStyle = color || '#f0c987';
            ctx.beginPath();
            ctx.arc(25, 12, 9, 0, Math.PI * 2);
            ctx.fill();

            // Body
            ctx.fillStyle = ['#3498db', '#e74c3c', '#2ecc71', '#9b59b6', '#f39c12'][Math.floor(Math.random() * 5)];
            ctx.beginPath();
            ctx.moveTo(15, 20);
            ctx.lineTo(35, 20);
            ctx.lineTo(38, 38);
            ctx.lineTo(12, 38);
            ctx.closePath();
            ctx.fill();

            // Device in hands
            if (deviceType === 'phone') {
                ctx.fillStyle = '#2c3e50';
                ctx.fillRect(20, 28, 10, 14);
                ctx.fillStyle = '#5dade2';
                ctx.fillRect(21, 30, 8, 9);
            } else if (deviceType === 'tablet') {
                ctx.fillStyle = '#2c3e50';
                ctx.fillRect(16, 26, 18, 14);
                ctx.fillStyle = '#5dade2';
                ctx.fillRect(17, 28, 16, 10);
            } else if (deviceType === 'laptop') {
                ctx.fillStyle = '#2c3e50';
                ctx.fillRect(12, 28, 26, 14);
                ctx.fillStyle = '#5dade2';
                ctx.fillRect(13, 29, 24, 9);
                ctx.fillStyle = '#95a5a6';
                ctx.fillRect(12, 40, 26, 3);
            }

            const img = new Image();
            img.src = canvas.toDataURL();
            return img;
        };

        // --- Good bot sprite ---
        const createGoodBot = () => {
            const canvas = document.createElement('canvas');
            canvas.width = 50;
            canvas.height = 50;
            const ctx = canvas.getContext('2d');

            // Robot body
            ctx.fillStyle = '#48d597';
            ctx.beginPath();
            ctx.roundRect(12, 14, 26, 28, 4);
            ctx.fill();

            // Head
            ctx.fillStyle = '#3bc284';
            ctx.beginPath();
            ctx.roundRect(15, 4, 20, 14, 3);
            ctx.fill();

            // Eyes (friendly)
            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.arc(21, 10, 3, 0, Math.PI * 2);
            ctx.arc(29, 10, 3, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#333';
            ctx.beginPath();
            ctx.arc(21, 10, 1.5, 0, Math.PI * 2);
            ctx.arc(29, 10, 1.5, 0, Math.PI * 2);
            ctx.fill();

            // Smile
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.arc(25, 13, 4, 0, Math.PI);
            ctx.stroke();

            // Antenna
            ctx.strokeStyle = '#48d597';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(25, 4);
            ctx.lineTo(25, 0);
            ctx.stroke();
            ctx.fillStyle = '#48d597';
            ctx.beginPath();
            ctx.arc(25, 0, 2, 0, Math.PI * 2);
            ctx.fill();

            // Check mark on body
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(18, 28);
            ctx.lineTo(23, 34);
            ctx.lineTo(33, 22);
            ctx.stroke();

            const img = new Image();
            img.src = canvas.toDataURL();
            return img;
        };

        // --- Bad bot sprite ---
        const createBadBot = () => {
            const canvas = document.createElement('canvas');
            canvas.width = 50;
            canvas.height = 50;
            const ctx = canvas.getContext('2d');

            // Robot body
            ctx.fillStyle = '#e74c3c';
            ctx.beginPath();
            ctx.roundRect(12, 14, 26, 28, 4);
            ctx.fill();

            // Head
            ctx.fillStyle = '#c0392b';
            ctx.beginPath();
            ctx.roundRect(15, 4, 20, 14, 3);
            ctx.fill();

            // Eyes (angry)
            ctx.fillStyle = '#ff0';
            ctx.beginPath();
            ctx.arc(21, 10, 3, 0, Math.PI * 2);
            ctx.arc(29, 10, 3, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#c0392b';
            ctx.beginPath();
            ctx.arc(21, 10, 1.5, 0, Math.PI * 2);
            ctx.arc(29, 10, 1.5, 0, Math.PI * 2);
            ctx.fill();

            // Angry eyebrows
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(17, 5);
            ctx.lineTo(24, 7);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(33, 5);
            ctx.lineTo(26, 7);
            ctx.stroke();

            // X on body
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(18, 22);
            ctx.lineTo(32, 36);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(32, 22);
            ctx.lineTo(18, 36);
            ctx.stroke();

            // Antenna with skull
            ctx.strokeStyle = '#e74c3c';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(25, 4);
            ctx.lineTo(25, 0);
            ctx.stroke();
            ctx.fillStyle = '#e74c3c';
            ctx.beginPath();
            ctx.arc(25, 0, 2, 0, Math.PI * 2);
            ctx.fill();

            const img = new Image();
            img.src = canvas.toDataURL();
            return img;
        };

        // --- Thief sprite (person in hoodie with device) ---
        const createThief = (deviceType) => {
            const canvas = document.createElement('canvas');
            canvas.width = 50;
            canvas.height = 50;
            const ctx = canvas.getContext('2d');

            // Hoodie
            ctx.fillStyle = '#1a1a2e';
            ctx.beginPath();
            ctx.moveTo(12, 16);
            ctx.lineTo(38, 16);
            ctx.lineTo(40, 42);
            ctx.lineTo(10, 42);
            ctx.closePath();
            ctx.fill();

            // Hood
            ctx.fillStyle = '#1a1a2e';
            ctx.beginPath();
            ctx.arc(25, 14, 12, Math.PI, 0);
            ctx.fill();

            // Shadowed face
            ctx.fillStyle = '#0f0f23';
            ctx.beginPath();
            ctx.arc(25, 14, 8, 0, Math.PI * 2);
            ctx.fill();

            // Glowing eyes
            ctx.fillStyle = '#e74c3c';
            ctx.beginPath();
            ctx.arc(21, 13, 2, 0, Math.PI * 2);
            ctx.arc(29, 13, 2, 0, Math.PI * 2);
            ctx.fill();

            // Stolen device
            if (deviceType === 'phone') {
                ctx.fillStyle = '#2c3e50';
                ctx.fillRect(20, 30, 10, 14);
                ctx.fillStyle = '#5dade2';
                ctx.fillRect(21, 32, 8, 9);
            } else if (deviceType === 'tablet') {
                ctx.fillStyle = '#2c3e50';
                ctx.fillRect(16, 28, 18, 14);
                ctx.fillStyle = '#5dade2';
                ctx.fillRect(17, 30, 16, 10);
            } else {
                ctx.fillStyle = '#2c3e50';
                ctx.fillRect(12, 30, 26, 12);
                ctx.fillStyle = '#5dade2';
                ctx.fillRect(13, 31, 24, 8);
            }

            const img = new Image();
            img.src = canvas.toDataURL();
            return img;
        };

        // Store all sprite sets
        this.sprites = {
            logoNoYear: createQueueItLogo(false),
            logoWithYear: createQueueItLogo(true),
            devices: [
                createDevice('laptop'),
                createDevice('phone'),
                createDevice('tablet'),
                createDevice('desktop')
            ],
            users: [
                createUserWithDevice('phone', '#f0c987'),
                createUserWithDevice('tablet', '#d4a574'),
                createUserWithDevice('laptop', '#c68642'),
                createUserWithDevice('phone', '#ffe0bd'),
                createUserWithDevice('tablet', '#f0c987'),
                createUserWithDevice('laptop', '#d4a574')
            ],
            goodBot: createGoodBot(),
            badBots: [
                createBadBot()
            ],
            thieves: [
                createThief('phone'),
                createThief('tablet'),
                createThief('laptop')
            ]
        };

        // Game background
        this.gameBackground = (() => {
            const canvas = document.createElement('canvas');
            canvas.width = this.canvas.width;
            canvas.height = this.canvas.height;
            const ctx = canvas.getContext('2d');

            // Digital gradient background
            const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
            gradient.addColorStop(0, '#1a2744');
            gradient.addColorStop(0.7, '#1e3a5f');
            gradient.addColorStop(1, '#0d2137');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Subtle grid
            ctx.strokeStyle = 'rgba(0, 180, 230, 0.06)';
            ctx.lineWidth = 1;
            for (let x = 0; x < canvas.width; x += 30) {
                ctx.beginPath();
                ctx.moveTo(x, 0);
                ctx.lineTo(x, canvas.height);
                ctx.stroke();
            }
            for (let y = 0; y < canvas.height; y += 30) {
                ctx.beginPath();
                ctx.moveTo(0, y);
                ctx.lineTo(canvas.width, y);
                ctx.stroke();
            }

            // Queue bar area at bottom
            ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
            ctx.fillRect(0, canvas.height - 50, canvas.width, 50);

            // Queue bar label
            ctx.fillStyle = 'rgba(0, 180, 230, 0.4)';
            ctx.font = '11px Arial';
            ctx.textAlign = 'left';
            ctx.fillText('QUEUE', 10, canvas.height - 35);

            // Dotted line separating queue
            ctx.strokeStyle = 'rgba(0, 180, 230, 0.3)';
            ctx.setLineDash([5, 5]);
            ctx.beginPath();
            ctx.moveTo(0, canvas.height - 50);
            ctx.lineTo(canvas.width, canvas.height - 50);
            ctx.stroke();
            ctx.setLineDash([]);

            const img = new Image();
            img.src = canvas.toDataURL();
            return img;
        })();

        // Silent audio
        const silentAudio = new Audio("data:audio/mp3;base64,SUQzBAAAAAABEVRYWFgAAAAtAAADY29tbWVudABCaWdTb3VuZEJhbmsuY29tIC8gTGFTb25vdGhlcXVlLm9yZwBURU5DAAAAHQAAA1N3aXRjaCBQbHVzIMKpIE5DSCBTb2Z0d2FyZQBUSVQyAAAABgAAAzIyMzUAVFNTRQAAAA8AAANMYXZmNTcuODMuMTAwAAAAAAAAAAAAAAD/80DEAAAAA0gAAAAATEFNRTMuMTAwVVVVVVVVVVVVVUxBTUUzLjEwMFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVf/zQsRbAAADSAAAAABVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVf/zQMSkAAADSAAAAABVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV");
        this.sounds = {
            background: silentAudio,
            collect: silentAudio,
            collision: silentAudio
        };
        this.sounds.background.loop = true;
    }

    setupGame() {
        this.score = 0;
        this.gameLevel = 1; // 1=devices, 2=users+bots
        this.itemsCaught = 0;
        this.itemsForLevelUp = 15;
        this.gameSpeed = 1;
        this.isPaused = false;
        this.isGameOver = false;
        this.playerName = document.getElementById('player-name').value || 'Anonymous';
        this.lastSpawn = 0;
        this.spawnInterval = 1500;
        this.fallingObjects = [];
        this.queue = [];
        this.partyPoppers = [];
        this.levelTransition = false;
        this.lives = 3;

        // Level 1 catcher = Queue-it logo (no year)
        this.player = new Player(this.canvas, this.sprites.logoNoYear);

        this.ctx.fillStyle = '#1a2744';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    getLevelConfig() {
        if (this.gameLevel === 1) {
            return {
                name: 'Level 1: Build Your Queue',
                description: 'Catch the devices! Fill your waiting room queue.',
                goodItems: this.sprites.devices,
                badItems: [],
                goodBotChance: 0,
                badChance: 0,
                catcher: this.sprites.logoNoYear
            };
        } else if (this.gameLevel === 2) {
            return {
                name: 'Level 2: Protect Your Users',
                description: 'Catch real users. Avoid the bots and thieves!',
                goodItems: this.sprites.users,
                badItems: [...this.sprites.badBots, ...this.sprites.thieves],
                goodBotChance: 0.15,
                badChance: 0.25,
                catcher: this.sprites.logoWithYear
            };
        } else {
            // Level 3+: harder
            return {
                name: `Level ${this.gameLevel}: Bot Attack!`,
                description: 'More bots! More thieves! Catch users and good bots.',
                goodItems: this.sprites.users,
                badItems: [...this.sprites.badBots, ...this.sprites.thieves],
                goodBotChance: 0.2,
                badChance: 0.3 + (this.gameLevel - 3) * 0.05,
                catcher: this.sprites.logoWithYear
            };
        }
    }

    spawnObject() {
        if (this.levelTransition) return;
        if (Date.now() - this.lastSpawn < this.spawnInterval) return;

        const config = this.getLevelConfig();
        const rand = Math.random();
        let obj;

        if (rand < config.badChance && config.badItems.length > 0) {
            // Spawn bad item
            const badImg = config.badItems[Math.floor(Math.random() * config.badItems.length)];
            obj = new FallingObject(this.canvas, badImg, 'bad', this.gameSpeed);
        } else if (rand < config.badChance + config.goodBotChance) {
            // Spawn good bot
            obj = new FallingObject(this.canvas, this.sprites.goodBot, 'goodbot', this.gameSpeed);
        } else {
            // Spawn good item
            const goodImg = config.goodItems[Math.floor(Math.random() * config.goodItems.length)];
            obj = new FallingObject(this.canvas, goodImg, 'good', this.gameSpeed);
        }

        this.fallingObjects.push(obj);
        this.lastSpawn = Date.now();
    }

    updateDifficulty() {
        const baseSpeed = 1 + (this.gameLevel - 1) * 0.15;
        const scoreBonus = Math.floor(this.score / 100) * 0.05;
        this.gameSpeed = Math.min(baseSpeed + scoreBonus, 2.5);
        this.spawnInterval = Math.max(600, 1500 - (this.gameLevel - 1) * 150 - Math.floor(this.score / 50) * 30);

        if (this.player) {
            this.player.update(this.keys, this.gameSpeed);
        }
    }

    update() {
        if (this.isPaused || this.levelTransition) return;

        this.updateDifficulty();
        this.spawnObject();

        this.partyPoppers = this.partyPoppers.filter(p => p.update());

        this.fallingObjects = this.fallingObjects.filter(obj => {
            obj.update(this.gameSpeed);

            if (this.checkCollision(this.player, obj)) {
                if (obj.type === 'good' || obj.type === 'goodbot') {
                    this.score += obj.type === 'goodbot' ? 20 : 10;
                    this.itemsCaught++;

                    // Add to visual queue
                    if (this.queue.length < 16) {
                        this.queue.push({ image: obj.image, time: Date.now() });
                    }

                    // Check level up
                    if (this.itemsCaught >= this.itemsForLevelUp) {
                        this.levelUp();
                    }

                    this.sounds.collect.play();
                } else {
                    // Bad item
                    this.lives--;
                    if (this.lives <= 0) {
                        this.gameOver("A bot/thief got through!");
                    }
                }
                return false;
            }

            // Hit ground
            if (obj.y + obj.height >= this.canvas.height - 50) {
                if (obj.type === 'good' || obj.type === 'goodbot') {
                    // Missed a good item - lose a life in level 2+
                    if (this.gameLevel >= 2) {
                        this.lives--;
                        if (this.lives <= 0) {
                            this.gameOver("Too many users lost!");
                        }
                    }
                }
                return false; // Remove
            }

            return true;
        });
    }

    levelUp() {
        this.gameLevel++;
        this.itemsCaught = 0;
        this.queue = [];
        this.levelTransition = true;

        // Update catcher
        const config = this.getLevelConfig();
        this.player.image = config.catcher;

        // Party poppers
        for (let i = 0; i < 5; i++) {
            this.partyPoppers.push(new PartyPopper(
                this.canvas,
                Math.random() * this.canvas.width,
                Math.random() * (this.canvas.height - 100)
            ));
        }

        // Show level message
        this.showLevelUpMessage(config.name, config.description);

        setTimeout(() => {
            this.levelTransition = false;
            this.fallingObjects = [];
        }, 3000);
    }

    checkCollision(player, object) {
        return player.x < object.x + object.width &&
               player.x + player.width > object.x &&
               player.y < object.y + object.height &&
               player.y + player.height > object.y;
    }

    draw() {
        // Background
        this.ctx.drawImage(this.gameBackground, 0, 0, this.canvas.width, this.canvas.height);

        // Draw queue at bottom
        this.drawQueue();

        // Draw falling objects
        this.fallingObjects.forEach(obj => obj.draw(this.ctx));

        // Draw player
        this.player.draw(this.ctx);

        // Draw party poppers
        this.partyPoppers.forEach(p => p.draw(this.ctx));

        // Draw UI
        this.drawUI();
    }

    drawQueue() {
        const queueY = this.canvas.height - 45;
        const itemSize = 32;
        const spacing = 4;
        const startX = 50;

        for (let i = 0; i < this.queue.length; i++) {
            const x = startX + i * (itemSize + spacing);
            if (x + itemSize > this.canvas.width - 10) break;

            // Slot background
            this.ctx.fillStyle = 'rgba(0, 180, 230, 0.15)';
            this.ctx.beginPath();
            this.ctx.roundRect(x - 2, queueY - 2, itemSize + 4, itemSize + 4, 3);
            this.ctx.fill();

            // Border
            this.ctx.strokeStyle = 'rgba(0, 180, 230, 0.4)';
            this.ctx.lineWidth = 1;
            this.ctx.stroke();

            // Item image
            this.ctx.drawImage(this.queue[i].image, x, queueY, itemSize, itemSize);
        }

        // Queue count
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        this.ctx.font = '10px Arial';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(`${this.queue.length} in queue`, 50, this.canvas.height - 8);
    }

    drawUI() {
        this.ctx.fillStyle = 'white';
        this.ctx.strokeStyle = 'rgba(0,0,0,0.5)';
        this.ctx.lineWidth = 2;
        this.ctx.font = 'bold 20px Arial';
        this.ctx.textAlign = 'left';

        // Score
        const scoreText = `Score: ${this.score}`;
        this.ctx.strokeText(scoreText, 10, 28);
        this.ctx.fillText(scoreText, 10, 28);

        // Level
        const config = this.getLevelConfig();
        this.ctx.textAlign = 'right';
        this.ctx.font = 'bold 18px Arial';
        this.ctx.fillStyle = '#00b4e6';
        this.ctx.strokeText(config.name, this.canvas.width - 10, 28);
        this.ctx.fillText(config.name, this.canvas.width - 10, 28);

        // Progress bar
        const barWidth = 200;
        const barX = this.canvas.width - barWidth - 10;
        const barY = 38;
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        this.ctx.beginPath();
        this.ctx.roundRect(barX, barY, barWidth, 12, 6);
        this.ctx.fill();

        const progress = Math.min(this.itemsCaught / this.itemsForLevelUp, 1);
        this.ctx.fillStyle = '#48d597';
        this.ctx.beginPath();
        this.ctx.roundRect(barX, barY, barWidth * progress, 12, 6);
        this.ctx.fill();

        this.ctx.fillStyle = 'white';
        this.ctx.font = '10px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(`${this.itemsCaught}/${this.itemsForLevelUp}`, barX + barWidth / 2, barY + 10);

        // Lives (level 2+)
        if (this.gameLevel >= 2) {
            this.ctx.textAlign = 'left';
            this.ctx.font = 'bold 18px Arial';
            this.ctx.fillStyle = this.lives <= 1 ? '#e74c3c' : 'white';
            const livesText = `Lives: ${'❤'.repeat(this.lives)}`;
            this.ctx.fillText(livesText, 10, 55);
        }
    }

    gameOver(message = "Game Over!") {
        this.isGameOver = true;
        this.sounds.background.pause();

        this.saveScore(this.score);

        document.getElementById('game-screen').classList.add('hidden');
        document.getElementById('game-over-screen').classList.remove('hidden');
        document.getElementById('final-score').textContent = this.score;

        const msgEl = document.getElementById('game-over-message');
        if (msgEl) msgEl.textContent = message;
    }

    setupEventListeners() {
        window.addEventListener('keydown', (e) => {
            this.keys[e.key] = true;
            if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') e.preventDefault();
        });

        window.addEventListener('keyup', (e) => {
            this.keys[e.key] = false;
        });

        document.getElementById('start-button').addEventListener('click', () => {
            const nameInput = document.getElementById('player-name');
            if (!nameInput.value.trim()) {
                const popup = document.getElementById('name-popup');
                popup.classList.remove('hidden');
                document.getElementById('popup-ok').onclick = () => {
                    popup.classList.add('hidden');
                    nameInput.focus();
                };
                return;
            }
            document.getElementById('start-screen').classList.add('hidden');
            document.getElementById('game-screen').classList.remove('hidden');
            this.start();
        });

        document.getElementById('pause-button').addEventListener('click', () => {
            this.isPaused = !this.isPaused;
        });

        document.getElementById('restart-button').addEventListener('click', () => {
            document.getElementById('game-over-screen').classList.add('hidden');
            document.getElementById('game-screen').classList.remove('hidden');
            this.setupGame();
            this.start();
        });
    }

    start() {
        this.setupGame();
        this.sounds.background.play().catch(() => {});
        this.gameLoop();
    }

    gameLoop() {
        if (!this.isGameOver) {
            this.update();
            this.draw();
            requestAnimationFrame(() => this.gameLoop());
        }
    }

    loadScores() {
        this.scores = JSON.parse(localStorage.getItem('queueitCatcherScores')) || [];
        if (this.scores.length === 0) {
            this.scores = [
                { name: 'Queue-it Pro', score: 200, level: 3 },
                { name: 'Bot Hunter', score: 150, level: 2 },
                { name: 'Gatekeeper', score: 100, level: 2 },
                { name: 'Rookie', score: 50, level: 1 }
            ];
            localStorage.setItem('queueitCatcherScores', JSON.stringify(this.scores));
        }
        this.updateScoreboardDisplay();
    }

    saveScore(score) {
        this.scores.push({
            name: this.playerName,
            score: score,
            level: this.gameLevel
        });
        this.scores.sort((a, b) => b.score - a.score);
        this.scores = this.scores.slice(0, 10);
        localStorage.setItem('queueitCatcherScores', JSON.stringify(this.scores));
        this.updateScoreboardDisplay();
    }

    updateScoreboardDisplay() {
        const scoresList = document.getElementById('scores-list');
        scoresList.innerHTML = '';

        const header = document.createElement('div');
        header.className = 'scores-header';
        header.innerHTML = '<div>Rank</div><div>Player</div><div>Level</div><div>Score</div>';
        scoresList.appendChild(header);

        this.scores.forEach((s, i) => {
            const entry = document.createElement('div');
            entry.className = 'score-entry';
            entry.innerHTML = `
                <div class="rank">#${i + 1}</div>
                <div class="player-name">${s.name || 'Anonymous'}</div>
                <div class="level">Lvl ${s.level || 1}</div>
                <div class="score">${s.score}</div>
            `;
            scoresList.appendChild(entry);
        });
    }

    showLevelUpMessage(title, description) {
        const levelUpDiv = document.createElement('div');
        levelUpDiv.className = 'level-up-message';
        levelUpDiv.innerHTML = `${title}<br><span style="font-size:20px;color:#aaa">${description}</span>`;

        const gameCanvas = document.getElementById('gameCanvas');
        gameCanvas.parentElement.appendChild(levelUpDiv);

        setTimeout(() => levelUpDiv.remove(), 3000);
    }
}

window.onload = () => {
    const game = new Game();
};
