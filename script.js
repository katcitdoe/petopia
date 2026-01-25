let coins = 100;
let pet = {
    name: "",
    species: "",
    hunger: 70,
    happiness: 85,
    health: 90,
    energy: 60,
    sleeping: false,
    sleepTimer: null
};
let gameActive = false;
let selectedSpecies = "cat";
let bedPurchased = false;
let inventory = {
    "Fish": 0,
    "Cake": 0,
    "Ball": 0,
    "Yarn": 0,
    "Potion": 0
};

const speciesData = [
    { id: "cat", emoji: "🐱", name: "Cat" },
    { id: "dog", emoji: "🐶", name: "Dog" },
    { id: "rabbit", emoji: "🐰", name: "Rabbit" },
    { id: "bear", emoji: "🐻", name: "Bear" },
    { id: "fox", emoji: "🦊", name: "Fox" },
    { id: "unicorn", emoji: "🦄", name: "Unicorn" },
    { id: "penguin", emoji: "🐧", name: "Penguin" },
    { id: "frog", emoji: "🐸", name: "Frog" }
];

const shopItems = [
    { name: "Fish", price: 15, emoji: "🐟", effect: { hunger: 30 }, type: "food" },
    { name: "Cake", price: 25, emoji: "🎂", effect: { hunger: 40, happiness: 10 }, type: "food" },
    { name: "Ball", price: 20, emoji: "⚽", effect: { happiness: 25, energy: -15 }, type: "toy" },
    { name: "Yarn", price: 15, emoji: "🧶", effect: { happiness: 20, energy: -10 }, type: "toy" },
    { name: "Potion", price: 40, emoji: "🧪", effect: { health: 50 }, type: "medicine" },
    { name: "Bed", price: 100, emoji: "🛏️", effect: { sleep: true }, oneTimeUse: true, type: "furniture" }
];

function init() {
    showMainMenu();
}

function showMainMenu() {
    document.getElementById('main-menu').style.display = 'flex';
    document.getElementById('setup-modal').style.display = 'none';
    document.getElementById('load-modal').style.display = 'none';
    document.getElementById('game-container').style.display = 'none';
}

function closeMainMenu() {
    document.getElementById('main-menu').style.display = 'none';
}

function showCreatePet() {
    closeMainMenu();
    showSetupModal();
}

function showLoadPet() {
    closeMainMenu();
    document.getElementById('load-modal').style.display = 'flex';
    document.getElementById('load-code-input').value = '';
    document.getElementById('load-code-input').focus();
}

function showSetupModal() {
    const speciesOptions = document.getElementById('species-options');
    speciesOptions.innerHTML = '';
    
    speciesData.forEach(species => {
        const div = document.createElement('div');
        div.className = 'species';
        if (species.id === "cat") {
            div.classList.add('selected');
            selectedSpecies = "cat";
        }
        
        div.innerHTML = `
            <div class="species-emoji">${species.emoji}</div>
            <div class="species-name">${species.name}</div>
        `;
        
        div.addEventListener('click', () => {
            document.querySelectorAll('.species').forEach(opt => {
                opt.classList.remove('selected');
            });
            div.classList.add('selected');
            selectedSpecies = species.id;
        });
        
        speciesOptions.appendChild(div);
    });
    
    document.getElementById('setup-modal').style.display = 'flex';
    document.getElementById('pet-name-input').focus();
}

function savePetSetup() {
    const nameInput = document.getElementById('pet-name-input');
    const name = nameInput.value.trim();
    
    if (!name) {
        notify("Please enter a name for your pet!");
        nameInput.focus();
        return;
    }
    
    pet.name = name;
    pet.species = selectedSpecies;
    
    document.getElementById('setup-modal').style.display = 'none';
    
    startGameMain();
    notify(`Welcome ${pet.name}! 🎉`);
}

function startGameMain() {
    updateUI();
    loadShop();
    updateInventoryDisplay();
    startGameLoop();
    document.getElementById('game-container').style.display = 'block';
    
    checkDailyBonus();
    
    if (pet.sleepTimer && Date.now() < pet.sleepTimer) {
        pet.sleeping = true;
        startSleepCountdown();
    } else if (pet.sleeping) {
        wakePet();
    }
    
    updateSleepButton();
    
    const petElement = document.getElementById('pet');
    if (petElement) {
        petElement.addEventListener('click', hugPet);
    }
    
    updateSaveCode();
}

function updateUI() {
    document.getElementById('coins').textContent = coins;
    document.getElementById('display-pet-name').textContent = pet.name;
    
    const currentSpecies = speciesData.find(s => s.id === pet.species);
    document.getElementById('pet').textContent = currentSpecies ? currentSpecies.emoji : "🐱";
    
    document.getElementById('hunger-bar').style.width = Math.min(100, Math.max(0, pet.hunger)) + '%';
    document.getElementById('happiness-bar').style.width = Math.min(100, Math.max(0, pet.happiness)) + '%';
    document.getElementById('health-bar').style.width = Math.min(100, Math.max(0, pet.health)) + '%';
    document.getElementById('energy-bar').style.width = Math.min(100, Math.max(0, pet.energy)) + '%';
    
    updateSleepStatus();
    updateSleepButton();
    
    updateSaveCode();
}

function updateSaveCode() {
    const saveCode = generateSaveCode();
    document.getElementById('current-save-code').textContent = saveCode;
}

function updateInventoryDisplay() {
    const headerRight = document.querySelector('.header-right');
    if (headerRight) {
        headerRight.innerHTML = `
            <button class="header-btn feed-btn" onclick="useItem('feed')" title="Feed your pet">
                Feed
            </button>
            <button class="header-btn play-btn" onclick="useItem('play')" title="Play with your pet">
                Play
            </button>
            <button class="header-btn heal-btn" onclick="useItem('heal')" title="Heal your pet">
                Heal
            </button>
            <button class="header-btn sleep-btn" onclick="putPetToSleep()" id="sleep-btn" title="Put pet to sleep">
                Sleep
            </button>
            <div class="coins"><span id="coins">${coins}</span> 🪙</div>
        `;
    }
    
    updateSleepButton();
}

function updateSleepStatus() {
    let status = "Feeling good";
    
    if (pet.sleeping) {
        status = "Sleeping...";
    } else {
        if (pet.hunger < 20) status = "Hungry!";
        else if (pet.happiness < 20) status = "Sad...";
        else if (pet.health < 20) status = "Sick!";
        else if (pet.energy < 20) status = "Tired";
        else status = "Feeling good";
    }
    document.getElementById('status').textContent = status;
}

function updateSleepButton() {
    const sleepBtn = document.getElementById('sleep-btn');
    if (!sleepBtn) return;
    
    if (pet.sleeping) {
        sleepBtn.textContent = "Sleeping";
        sleepBtn.disabled = true;
        sleepBtn.style.opacity = "0.6";
        sleepBtn.style.cursor = "not-allowed";
    } else {
        sleepBtn.textContent = "Sleep";
        sleepBtn.disabled = false;
        sleepBtn.style.opacity = "1";
        sleepBtn.style.cursor = "pointer";
    }
}

function loadShop() {
    const shopContainer = document.getElementById('shop-items');
    shopContainer.innerHTML = shopItems.map((item, index) => {
        const isPurchased = item.name === "Bed" && bedPurchased;
        const inventoryCount = inventory[item.name] || 0;
        
        return `
            <div class="item ${isPurchased ? 'purchased' : ''}" onclick="${isPurchased ? '' : `buyItem(${index})`}">
                <div class="item-emoji">${item.emoji}</div>
                <div class="item-name">${item.name}</div>
                <div class="item-price">${item.price} 🪙</div>
                ${!item.oneTimeUse ? `<div class="item-count">Owned: ${inventoryCount}</div>` : ''}
            </div>
        `;
    }).join('');
}

function buyItem(index) {
    const item = shopItems[index];
    
    if (coins < item.price) {
        notify("Not enough coins! 💰");
        return;
    }
    
    if (item.name === "Bed" && bedPurchased) {
        notify(`You already own a bed for ${pet.name}!`);
        return;
    }
    
    coins -= item.price;
    
    if (item.name === "Bed") {
        bedPurchased = true;
    } else {
        inventory[item.name] = (inventory[item.name] || 0) + 1;
    }
    
    updateUI();
    loadShop();
    updateInventoryDisplay();
}

function useItem(action) {
    if (pet.sleeping) {
        notify(`${pet.name} is sleeping, shh!`);
        return;
    }
    
    let itemToUse = null;
    
    switch(action) {
        case 'feed':
            if (inventory["Cake"] > 0) {
                itemToUse = "Cake";
            } else if (inventory["Fish"] > 0) {
                itemToUse = "Fish";
            } else {
                notify(`No food in inventory! Buy some from the shop.`);
                return;
            }
            break;
            
        case 'play':
            if (inventory["Ball"] > 0) {
                itemToUse = "Ball";
            } else if (inventory["Yarn"] > 0) {
                itemToUse = "Yarn";
            } else {
                notify(`No toys in inventory! Buy some from the shop.`);
                return;
            }
            break;
            
        case 'heal':
            if (inventory["Potion"] > 0) {
                itemToUse = "Potion";
            } else {
                notify(`No medicine in inventory! Buy some from the shop.`);
                return;
            }
            break;
    }
    
    if (!itemToUse) return;
    
    inventory[itemToUse]--;
    
    const item = shopItems.find(i => i.name === itemToUse);
    
    if (item.effect.hunger) {
        pet.hunger = Math.min(100, pet.hunger + item.effect.hunger);
    }
    if (item.effect.happiness) {
        pet.happiness = Math.min(100, pet.happiness + item.effect.happiness);
    }
    if (item.effect.health) {
        pet.health = Math.min(100, pet.health + item.effect.health);
    }
    if (item.effect.energy) {
        pet.energy = Math.max(0, Math.min(100, pet.energy + item.effect.energy));
    }
    
    let message = "";
    if (action === 'feed') {
        message = `${pet.name} ate ${item.name}`;
    } else if (action === 'play') {
        message = `${pet.name} played with ${item.name}`;
    } else if (action === 'heal') {
        message = `${pet.name} used ${item.name}`;
    }
    
    notify(message);
    
    updateUI();
    loadShop();
    updateInventoryDisplay();
}

function hugPet() {
    if (pet.sleeping) {
        notify(`${pet.name} is sleeping, shh!`);
        return;
    }
    
    pet.happiness = Math.min(100, pet.happiness + 10);
    pet.hunger = Math.max(0, pet.hunger - 2);
    notify(`${pet.name} loves the hug! 🤗`);
    updateUI();
}

function putPetToSleep() {
    if (pet.sleeping) return;
    
    if (!bedPurchased) {
        notify(`You need to buy a bed for ${pet.name} first! 🛏️`);
        return;
    }
    
    pet.sleeping = true;
    pet.sleepTimer = Date.now() + 15000;
    
    notify(`${pet.name} has been put to sleep for 15 seconds`);
    
    startSleepCountdown();
    updateSleepButton();
}

function startSleepCountdown() {
    updateUI();
    
    if (window.sleepInterval) {
        clearInterval(window.sleepInterval);
    }
    
    window.sleepInterval = setInterval(() => {
        if (!pet.sleeping || Date.now() >= pet.sleepTimer) {
            clearInterval(window.sleepInterval);
            wakePet();
        } else {
            updateSleepStatus();
        }
    }, 1000);
}

function wakePet() {
    if (!pet.sleeping) return;
    
    pet.sleeping = false;
    pet.sleepTimer = null;
    pet.energy = 100;
    pet.happiness = Math.min(100, pet.happiness + 10);
    
    if (window.sleepInterval) {
        clearInterval(window.sleepInterval);
        window.sleepInterval = null;
    }
    
    updateUI();
    updateSleepButton();
    notify(`${pet.name} woke up feeling refreshed! ⚡`);
}

function notify(msg) {
    const el = document.getElementById('notification');
    el.textContent = msg;
    el.style.display = 'block';
    setTimeout(() => el.style.display = 'none', 2000);
}

function startGameLoop() {
    if (window.gameLoopInterval) {
        clearInterval(window.gameLoopInterval);
    }
    
    window.gameLoopInterval = setInterval(() => {
        if (pet.sleeping) return;
        
        pet.hunger = Math.max(0, pet.hunger - 3);
        pet.happiness = Math.max(0, pet.happiness - 1.5);
        pet.energy = Math.min(100, pet.energy + 2);
        
        if (pet.hunger < 20) {
            pet.health = Math.max(0, pet.health - 1.5);
        }
        
        if (pet.hunger < 10) {
            pet.happiness = Math.max(0, pet.happiness - 1);
        }
        
        if (pet.happiness < 10) {
            pet.health = Math.max(0, pet.health - 1);
        }
        
        if (pet.energy > 80) {
            pet.happiness = Math.min(100, pet.happiness + 0.5);
        }
        
        updateUI();
    }, 10000);
}

function checkDailyBonus() {
    const today = new Date().toDateString();
    const lastPlayed = localStorage.getItem('petopia_lastPlayed');
    
    if (lastPlayed !== today) {
        const bonus = 50;
        coins += bonus;
        localStorage.setItem('petopia_lastPlayed', today);
        notify(`🎉 Daily Bonus: ${bonus} coins!`);
        updateUI();
    }
}

function startGame(type) {
    if (pet.sleeping) {
        notify(`${pet.name} is sleeping, shh!`);
        return;
    }
    
    if (pet.energy < 10) {
        notify(`${pet.name} is too tired to play!`);
        return;
    }
    
    document.getElementById('game-modal').style.display = 'flex';
    
    if (type === 'fishing') {
        setupFishingGame();
    } else if (type === 'puzzle') {
        setupPuzzleGame();
    }
}

function closeGame() {
    if (window.moveTile && gameActive) {
        pet.energy -= 5;
        pet.happiness = Math.min(100, pet.happiness + 3);
        updateUI();
        notify(`Puzzle game ended early. No coins earned. 🧩`);
    }
    
    if (window.fishingIntervals) {
        clearInterval(window.fishingIntervals.timer);
        clearInterval(window.fishingIntervals.fishInterval);
        window.fishingIntervals = null;
        window.fishingState = null;
    }
    
    if (window.moveTile) {
        window.moveTile = null;
    }
    
    document.getElementById('game-modal').style.display = 'none';
    gameActive = false;
}

function setupFishingGame() {
    document.getElementById('game-title').textContent = '🎣 Fishing Game';
    document.getElementById('game-area').innerHTML = `
        <div id="fishing-area"></div>
        <div class="game-stats">
            <div>Fish caught: <span id="fish-count">0</span></div>
            <div>Time: <span id="time-left">30</span>s</div>
        </div>
    `;
    startFishing();
}

function startFishing() {
    gameActive = true;
    
    window.fishingState = {
        fishCaught: 0,
        totalCoinsEarned: 0
    };
    
    const timer = setInterval(() => {
        if (!gameActive) {
            clearInterval(timer);
            return;
        }
        
        const timeLeftElement = document.getElementById('time-left');
        if (timeLeftElement) {
            let timeLeft = parseInt(timeLeftElement.textContent) || 30;
            timeLeft--;
            timeLeftElement.textContent = timeLeft;
            
            if (timeLeft <= 0) {
                endFishingGame();
            }
        }
    }, 1000);
    
    const fishInterval = setInterval(() => {
        if (!gameActive) {
            clearInterval(fishInterval);
            return;
        }
        
        const area = document.getElementById('fishing-area');
        const fish = document.createElement('div');
        fish.className = 'fish';
        fish.textContent = '🐟';
        fish.style.left = Math.random() * 90 + '%';
        fish.style.top = Math.random() * 80 + '%';
        
        fish.onclick = () => {
            if (!gameActive) return;
            
            window.fishingState.fishCaught++;
            window.fishingState.totalCoinsEarned += 2;
            
            const fishCountElement = document.getElementById('fish-count');
            if (fishCountElement) {
                fishCountElement.textContent = window.fishingState.fishCaught;
            }
            
            fish.classList.add('caught');
            
            setTimeout(() => {
                if (fish.parentNode) {
                    fish.remove();
                }
            }, 300);
        };
        
        area.appendChild(fish);
        
        setTimeout(() => {
            if (fish.parentNode && !fish.classList.contains('caught')) {
                fish.remove();
            }
        }, 2000);
    }, 600);
    
    window.fishingIntervals = { timer, fishInterval };
}

function endFishingGame() {
    if (window.fishingIntervals) {
        clearInterval(window.fishingIntervals.timer);
        clearInterval(window.fishingIntervals.fishInterval);
        window.fishingIntervals = null;
    }
    
    gameActive = false;
    
    let gameResults = null;
    if (window.fishingState) {
        gameResults = { ...window.fishingState };
        window.fishingState = null;
    }
    
    if (gameResults) {
        const { fishCaught, totalCoinsEarned } = gameResults;
        
        coins += totalCoinsEarned;
        pet.energy -= 10;
        pet.happiness = Math.min(100, pet.happiness + 5);
        
        updateUI();
        
        let message = `${pet.name} caught ${fishCaught} fish!`;
        if (totalCoinsEarned > 0) {
            message += ` Earned ${totalCoinsEarned} coins!`;
        } else {
            message += ` No coins earned.`;
        }
        
        notify(message);
    }
    
    setTimeout(() => {
        closeGame();
    }, 1500);
}

function setupPuzzleGame() {
    document.getElementById('game-title').textContent = '🧩 Puzzle Game';
    document.getElementById('game-area').innerHTML = `
        <div id="puzzle-grid"></div>
        <div class="game-stats">
            <div>Moves: <span id="move-count">0</span></div>
            <div>Time: <span id="puzzle-time">60</span>s</div>
        </div>
    `;
    startPuzzle();
}

function startPuzzle() {
    let numbers = [1, 2, 3, 4, 5, 6, 7, 8, 0];
    let emptyIndex = 8;
    let moves = 0;
    let timeLeft = 60;
    gameActive = true;
    
    function shufflePuzzle() {
        for (let i = 0; i < 100; i++) {
            const possibleMoves = [];
            const emptyRow = Math.floor(emptyIndex / 3);
            const emptyCol = emptyIndex % 3;
            
            if (emptyRow > 0) possibleMoves.push(emptyIndex - 3);
            if (emptyRow < 2) possibleMoves.push(emptyIndex + 3);
            if (emptyCol > 0) possibleMoves.push(emptyIndex - 1);
            if (emptyCol < 2) possibleMoves.push(emptyIndex + 1);
            
            const randomMove = possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
            
            [numbers[emptyIndex], numbers[randomMove]] = [numbers[randomMove], numbers[emptyIndex]];
            emptyIndex = randomMove;
        }
    }
    
    shufflePuzzle();
    
    const timer = setInterval(() => {
        if (!gameActive) {
            clearInterval(timer);
            return;
        }
        
        timeLeft--;
        document.getElementById('puzzle-time').textContent = timeLeft;
        
        if (timeLeft <= 0) {
            endPuzzleGame(false, moves, timer);
        }
    }, 1000);
    
    function renderPuzzle() {
        const grid = document.getElementById('puzzle-grid');
        if (!grid) return;
        
        grid.innerHTML = '';
        
        numbers.forEach((num, index) => {
            const cell = document.createElement('div');
            cell.className = `puzzle-cell ${num === 0 ? 'empty' : ''}`;
            cell.textContent = num === 0 ? '' : num;
            cell.onclick = () => moveTile(index);
            grid.appendChild(cell);
        });
    }
    
    function moveTile(index) {
        if (!gameActive || numbers[index] === 0) return;
        
        const row = Math.floor(index / 3);
        const col = index % 3;
        const emptyRow = Math.floor(emptyIndex / 3);
        const emptyCol = emptyIndex % 3;
        
        const isAdjacent = (Math.abs(row - emptyRow) === 1 && col === emptyCol) || 
                          (Math.abs(col - emptyCol) === 1 && row === emptyRow);
        
        if (isAdjacent) {
            [numbers[index], numbers[emptyIndex]] = [numbers[emptyIndex], numbers[index]];
            emptyIndex = index;
            moves++;
            const moveCountElement = document.getElementById('move-count');
            if (moveCountElement) {
                moveCountElement.textContent = moves;
            }
            
            renderPuzzle();
            
            const isSolved = numbers.slice(0, 8).every((num, i) => num === i + 1) && numbers[8] === 0;
            if (isSolved) {
                endPuzzleGame(true, moves, timer);
            }
        }
    }
    
    window.moveTile = moveTile;
    renderPuzzle();
}

function endPuzzleGame(won, moves, timer) {
    clearInterval(timer);
    gameActive = false;
    
    let reward = 0;
    let message = "";
    
    if (won) {
        reward = 60;
        message = `${pet.name} solved the puzzle in ${moves} moves! Earned ${reward} coins! 🧩`;
    } else {
        reward = 0;
        message = `${pet.name} ran out of time! No coins earned.`;
    }
    
    coins += reward;
    pet.energy -= 10;
    pet.happiness = Math.min(100, pet.happiness + 5);
    
    updateUI();
    notify(message);
    
    window.moveTile = null;
    
    setTimeout(() => {
        closeGame();
    }, 1500);
}

function generateSaveCode() {
    const saveData = {
        petName: pet.name,
        petSpecies: pet.species,
        timestamp: Date.now()
    };
    
    const jsonString = JSON.stringify(saveData);
    const base64String = btoa(encodeURIComponent(jsonString));
    
    return base64String;
}

function loadFromCode() {
    const codeInput = document.getElementById('load-code-input');
    const saveCode = codeInput.value.trim();
    
    if (!saveCode) {
        notify("Please enter a save code!");
        return;
    }
    
    try {
        const decodedString = decodeURIComponent(atob(saveCode));
        const saveData = JSON.parse(decodedString);
        
        if (!saveData.petName || !saveData.petSpecies) {
            throw new Error("Invalid save code format");
        }
        
        pet.name = saveData.petName;
        pet.species = saveData.petSpecies;
        
        coins = 100;
        pet.hunger = 70;
        pet.happiness = 85;
        pet.health = 90;
        pet.energy = 60;
        pet.sleeping = false;
        pet.sleepTimer = null;
        bedPurchased = false;
        inventory = {
            "Fish": 0,
            "Cake": 0,
            "Ball": 0,
            "Yarn": 0,
            "Potion": 0
        };
        
        updateUI();
        loadShop();
        updateInventoryDisplay();
        
        document.getElementById('load-modal').style.display = 'none';
        document.getElementById('game-container').style.display = 'block';
        
        startGameLoop();
        
        updateSleepButton();
        
        const petElement = document.getElementById('pet');
        if (petElement) {
            petElement.addEventListener('click', hugPet);
        }
        
        updateSaveCode();
        
        notify(`Game loaded! Welcome back ${pet.name}! 🎉`);
        
    } catch (error) {
        notify("Invalid save code! Please check and try again.");
    }
}

function copySaveCode() {
    const saveCode = document.getElementById('current-save-code').textContent;
    navigator.clipboard.writeText(saveCode).then(() => {
        notify("Save code copied to clipboard! 📋");
    }).catch(() => {
        document.execCommand('copy');
        notify("Save code copied to clipboard! 📋");
    });
}

init();