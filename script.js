class BipBupClicker {
    constructor() {
        this.score = 0;
        this.clickPower = 1;
        this.perSecond = 0;
        this.playTime = 0;
        this.inventory = [];
        this.shopItems = {
            autoClicker: { basePrice: 50, owned: 0, type: 'upgrade' },
            doubleClick: { basePrice: 100, owned: 0, type: 'upgrade' },
            goldenClick: { basePrice: 200, owned: 0, type: 'upgrade' },
            buttonSkin1: { basePrice: 300, type: 'skin' },
            background1: { basePrice: 500, type: 'background' }
        };
        this.equipped = {
            skin: null,
            background: null
        };
        this.goldenClickChance = 0.1;
        this.leaderboard = [];
        this.playerId = this.generatePlayerId();
        this.playerName = `Игрок#${this.playerId.slice(0, 4)}`;
        
        this.initializeElements();
        this.setupEventListeners();
        this.loadGame();
        this.startGameLoop();
        this.updateLeaderboard();
    }

    generatePlayerId() {
        return Math.random().toString(36).substr(2, 9);
    }

    initializeElements() {
        this.scoreElement = document.getElementById('score');
        this.perSecondElement = document.getElementById('perSecond');
        this.clickPowerElement = document.getElementById('clickPower');
        this.clickerButton = document.getElementById('clicker');
        this.playerNameElement = document.getElementById('playerName');
        this.playTimeElement = document.getElementById('playTime');
        this.inventoryElement = document.getElementById('inventory');
        this.leaderboardElement = document.getElementById('leaderboard');
        this.particlesContainer = document.getElementById('particles');
        this.shopItemsElements = document.querySelectorAll('.shop-item');
    }

    setupEventListeners() {
        this.clickerButton.addEventListener('click', () => this.handleClick());
        
        this.shopItemsElements.forEach(item => {
            item.addEventListener('click', (e) => {
                const itemId = e.currentTarget.dataset.id;
                this.buyItem(itemId);
            });
        });

        // Секретная пасхалка: двойной клик по заголовку
        document.querySelector('h1').addEventListener('dblclick', () => {
            this.addScore(1000);
            this.createFloatingEmoji('🎉', 50);
            this.showMessage('+1000 за пасхалку!');
        });

        // Еще одна пасхалка: нажать клавиши B+I+P
        let keySequence = [];
        document.addEventListener('keydown', (e) => {
            keySequence.push(e.key.toLowerCase());
            if (keySequence.length > 3) keySequence.shift();
            
            if (keySequence.join('') === 'bip') {
                this.addScore(777);
                this.createFloatingEmoji('✨', 30);
                this.showMessage('BIP-пасхалка активирована!');
                keySequence = [];
            }
        });
    }

    handleClick() {
        let clickValue = this.clickPower;
        
        // Шанс золотого клика
        if (Math.random() < this.goldenClickChance * this.shopItems.goldenClick.owned) {
            clickValue *= 10;
            this.createFloatingEmoji('🌟', 20);
            this.showMessage('ЗОЛОТОЙ КЛИК! x10');
        }
        
        this.addScore(clickValue);
        this.createClickEffect();
        this.createParticles();
    }

    addScore(amount) {
        this.score += amount;
        this.updateUI();
        this.saveGame();
    }

    updateUI() {
        this.scoreElement.textContent = this.score.toLocaleString();
        this.perSecondElement.textContent = this.perSecond;
        this.clickPowerElement.textContent = this.clickPower;
        this.playerNameElement.textContent = this.playerName;
        
        this.updateShopPrices();
        this.updateInventory();
    }

    updateShopPrices() {
        this.shopItemsElements.forEach(item => {
            const itemId = item.dataset.id;
            const price = this.getItemPrice(itemId);
            const priceElement = item.querySelector('.item-price');
            
            priceElement.textContent = price;
            
            if (this.score >= price && !this.hasItem(itemId)) {
                item.style.opacity = '1';
                item.style.cursor = 'pointer';
            } else {
                item.style.opacity = '0.6';
                item.style.cursor = 'not-allowed';
            }
        });
    }

    getItemPrice(itemId) {
        const item = this.shopItems[itemId];
        if (!item) return Infinity;
        
        if (item.type === 'upgrade') {
            return item.basePrice * Math.pow(1.5, item.owned);
        }
        return item.basePrice;
    }

    hasItem(itemId) {
        if (this.shopItems[itemId]?.type === 'upgrade') {
            return this.shopItems[itemId].owned > 0;
        }
        return this.inventory.includes(itemId);
    }

    buyItem(itemId) {
        const price = this.getItemPrice(itemId);
        
        if (this.score >= price && !this.hasItem(itemId)) {
            this.score -= price;
            
            if (this.shopItems[itemId]?.type === 'upgrade') {
                this.shopItems[itemId].owned++;
                
                if (itemId === 'autoClicker') {
                    this.calculatePerSecond();
                } else if (itemId === 'doubleClick') {
                    this.clickPower = 1 + this.shopItems.doubleClick.owned;
                } else if (itemId === 'goldenClick') {
                    this.goldenClickChance += 0.05;
                }
            } else {
                this.inventory.push(itemId);
                
                if (itemId === 'buttonSkin1') {
                    this.equipSkin('cosmic');
                } else if (itemId === 'background1') {
                    this.equipBackground('galaxy');
                }
            }
            
            this.updateUI();
            this.saveGame();
            this.createFloatingEmoji('✅', 5);
        }
    }

    equipSkin(skin) {
        this.clickerButton.className = 'clicker-btn ' + skin;
        this.equipped.skin = skin;
    }

    equipBackground(background) {
        document.body.className = background;
        this.equipped.background = background;
    }

    calculatePerSecond() {
        this.perSecond = this.shopItems.autoClicker.owned;
    }

    updateInventory() {
        this.inventoryElement.innerHTML = '';
        
        this.inventory.forEach(itemId => {
            const itemDiv = document.createElement('div');
            itemDiv.className = 'inventory-item';
            itemDiv.innerHTML = `
                <span class="item-emoji">${this.getItemEmoji(itemId)}</span>
                <p>${this.getItemName(itemId)}</p>
            `;
            
            itemDiv.addEventListener('click', () => {
                if (confirm('Продать за половину цены?')) {
                    this.sellItem(itemId);
                }
            });
            
            this.inventoryElement.appendChild(itemDiv);
        });
    }

    getItemEmoji(itemId) {
        const emojis = {
            buttonSkin1: '🎨',
            background1: '🌌'
        };
        return emojis[itemId] || '📦';
    }

    getItemName(itemId) {
        const names = {
            buttonSkin1: 'Космический скин',
            background1: 'Галактика'
        };
        return names[itemId] || itemId;
    }

    sellItem(itemId) {
        const price = Math.floor(this.shopItems[itemId].basePrice / 2);
        this.score += price;
        this.inventory = this.inventory.filter(id => id !== itemId);
        
        // Снимаем экипировку если продали
        if (this.equipped.skin && itemId === 'buttonSkin1') {
            this.clickerButton.className = 'clicker-btn';
            this.equipped.skin = null;
        }
        if (this.equipped.background && itemId === 'background1') {
            document.body.className = '';
            this.equipped.background = null;
        }
        
        this.updateUI();
        this.saveGame();
        this.createFloatingEmoji('💰', 5);
    }

    createClickEffect() {
        const effect = document.createElement('div');
        effect.className = 'click-effect';
        effect.style.left = '50%';
        effect.style.top = '50%';
        this.clickerButton.appendChild(effect);
        
        setTimeout(() => effect.remove(), 600);
    }

    createParticles() {
        for (let i = 0; i < 15; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            
            const size = Math.random() * 8 + 4;
            const angle = Math.random() * Math.PI * 2;
            const distance = Math.random() * 100 + 50;
            
            particle.style.width = `${size}px`;
            particle.style.height = `${size}px`;
            particle.style.background = this.getRandomColor();
            particle.style.left = '50%';
            particle.style.top = '50%';
            particle.style.setProperty('--tx', `${Math.cos(angle) * distance}px`);
            particle.style.setProperty('--ty', `${Math.sin(angle) * distance}px`);
            
            this.particlesContainer.appendChild(particle);
            
            setTimeout(() => particle.remove(), 1000);
        }
    }

    getRandomColor() {
        const colors = ['#ff6b6b', '#4ecdc4', '#ffd166', '#6bff8f', '#9d6bff'];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    createFloatingEmoji(emoji, count) {
        const container = document.querySelector('.floating-emojis');
        
        for (let i = 0; i < count; i++) {
            const emojiElement = document.createElement('div');
            emojiElement.className = 'floating-emoji';
            emojiElement.textContent = emoji;
            emojiElement.style.left = `${Math.random() * 100}%`;
            emojiElement.style.animationDelay = `${Math.random() * 0.5}s`;
            
            container.appendChild(emojiElement);
            
            setTimeout(() => emojiElement.remove(), 3000);
        }
    }

    showMessage(text) {
        const message = document.createElement('div');
        message.textContent = text;
        message.style.position = 'fixed';
        message.style.top = '20px';
        message.style.left: '50%';
        message.style.transform = 'translateX(-50%)';
        message.style.background = 'rgba(0,0,0,0.8)';
        message.style.color: 'gold';
        message.style.padding = '10px 20px';
        message.style.borderRadius = '20px';
        message.style.zIndex = '1000';
        
        document.body.appendChild(message);
        
        setTimeout(() => {
            message.style.animation = 'fadeOut 0.5s ease';
            setTimeout(() => message.remove(), 500);
        }, 2000);
    }

    startGameLoop() {
        setInterval(() => {
            this.playTime++;
            this.updatePlayTime();
            this.addScore(this.perSecond);
        }, 1000);

        setInterval(() => {
            this.updateLeaderboard();
        }, 30000);
    }

    updatePlayTime() {
        const hours = Math.floor(this.playTime / 3600);
        const minutes = Math.floor((this.playTime % 3600) / 60);
        const seconds = this.playTime % 60;
        
        this.playTimeElement.textContent = 
            `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    updateLeaderboard() {
        // Обновляем свое время в таблице лидеров
        const existingIndex = this.leaderboard.findIndex(p => p.id === this.playerId);
        
        if (existingIndex !== -1) {
            this.leaderboard[existingIndex].score = this.score;
            this.leaderboard[existingIndex].playTime = this.playTime;
        } else {
            this.leaderboard.push({
                id: this.playerId,
                name: this.playerName,
                score: this.score,
                playTime: this.playTime
            });
        }

        // Сортируем и обновляем UI
        this.leaderboard.sort((a, b) => b.score - a.score);
        this.renderLeaderboard();
    }

    renderLeaderboard() {
        this.leaderboardElement.innerHTML = '';
        
        this.leaderboard.slice(0, 10).forEach((player, index) => {
            const item = document.createElement('div');
            item.className = `leaderboard-item ${player.id === this.playerId ? 'me' : ''}`;
            
            const hours = Math.floor(player.playTime / 3600);
            const minutes = Math.floor((player.playTime % 3600) / 60);
            
            item.innerHTML = `
                <span>${index + 1}. ${player.name}</span>
                <span>${player.score.toLocaleString()} | ${hours}ч ${minutes}м</span>
            `;
            
            this.leaderboardElement.appendChild(item);
        });
    }

    saveGame() {
        const gameData = {
            score: this.score,
            clickPower: this.clickPower,
            perSecond: this.perSecond,
            playTime: this.playTime,
            inventory: this.inventory,
            shopItems: this.shopItems,
            equipped: this.equipped,
            leaderboard: this.leaderboard,
            playerId: this.playerId,
            playerName: this.playerName
        };
        
        localStorage.setItem('bipBupClicker', JSON.stringify(gameData));
    }

    loadGame() {
        const savedData = localStorage.getItem('bipBupClicker');
        
        if (savedData) {
            const gameData = JSON.parse(savedData);
            
            Object.assign(this, gameData);
            this.updateUI();
            
            // Восстанавливаем экипировку
            if (this.equipped.skin) {
                this.equipSkin(this.equipped.skin);
            }
            if (this.equipped.background) {
                this.equipBackground(this.equipped.background);
            }
        }
    }
}

// Инициализация игры
document.addEventListener('DOMContentLoaded', () => {
    new BipBupClicker();
});
