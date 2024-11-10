const DIFFICULTY_SETTINGS = {
    noob: {
        speed: 200,
        gridCount: 15
    },
    player: {
        speed: 120,
        gridCount: 20
    },
    pro: {
        speed: 80,
        gridCount: 25
    },
    bestbr: {
        speed: 50,
        gridCount: 30
    }
};

const MIN_SPEED = 230;
const MAX_SPEED = 80;
const SPEED_INCREMENT = 2;
const GRID_SIZE = 15;
const GAME_GRID_COUNT = 20;

let currentDifficulty = 'player';
let highScore = 0;
let currentSpeed = MIN_SPEED;
let gameWidth, gameHeight;
let canvas, ctx;
let snake = [];
let food = {};
let direction = 'right';
let score = 0;
let lastRenderTime = 0;
let isPaused = false;
let isGameRunning = false;
let touchStartX = 0;
let touchStartY = 0;
let gameSpeed = 100;

document.addEventListener('DOMContentLoaded', () => {
    // Inicialização do jogo
    initializeGame();

    const difficultyOptionsList = document.querySelectorAll('.difficulty-option');

    // Evento para botão de jogar
    document.getElementById('playButton').addEventListener('click', () => {
        hideAllScreens();
        document.getElementById('difficultySelect').style.display = 'flex';
    });

    // Evento para voltar do menu de dificuldade
    document.getElementById('backToDifficultyMenu').addEventListener('click', () => {
        hideAllScreens();
        document.getElementById('menu').style.display = 'flex';
    });

    // Evento para confirmar dificuldade
    difficultyOptionsList.forEach((option) => {
        option.addEventListener('click', () => {
            // Remove a classe active de todas as opções
            difficultyOptionsList.forEach(opt => {
                opt.classList.remove('active');
            });

            // Adiciona a classe active na opção clicada
            option.classList.add('active');

            // Define a dificuldade
            currentDifficulty = option.dataset.difficulty;

            // Inicia o jogo com a dificuldade selecionada
            startGame();
        });
    });

    // Define o "Player" como padrão inicialmente
    difficultyOptionsList[1].classList.add('active');
});

function initializeGame() {
    // Recuperar recorde
    updateHighScore();

    // Event Listeners para botões
    document.getElementById('creditsButton').addEventListener('click', showCredits);
    document.getElementById('backButton').addEventListener('click', showMenu);
    document.getElementById('pauseBtn').addEventListener('click', togglePause);
    document.getElementById('continueButton').addEventListener('click', togglePause);
    document.getElementById('playAgainButton').addEventListener('click', startGame);
    document.getElementById('menuButton').addEventListener('click', showMenu);

    // Mostrar menu principal
    hideAllScreens();
    document.getElementById('menu').style.display = 'flex';
}

function startGame() {
    // Configurações de dificuldade
    const difficulty = DIFFICULTY_SETTINGS[currentDifficulty];
    gameSpeed = difficulty.speed;
    
    // Esconde todas as telas
    hideAllScreens();
    
    // Prepara a tela de jogo
    document.getElementById('game').style.display = 'flex';
    document.getElementById('score').textContent = 'Pontos: 0';
    
    // Mostra elementos de jogo
    document.getElementById('gameCanvas').style.display = 'block';
    document.getElementById('pauseBtn').style.display = 'block';
    document.getElementById('score').style.display = 'block';
    
    // Reinicia variáveis do jogo
    score = 0;
    direction = 'right';
    isPaused = false;
    isGameRunning = true;
    
    // Iniciar jogo
    initGame();
}

function initGame() {
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');
    
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Inicializar cobra no centro
    snake = [{
        x: Math.floor(canvas.width/2/GRID_SIZE) * GRID_SIZE,
        y: Math.floor(canvas.height/2/GRID_SIZE) * GRID_SIZE
    }];
    
    spawnFood();
    setupTouchControls();
    requestAnimationFrame(gameLoop);
}

function resizeCanvas() {
    const gameContainer = document.querySelector('.game-container');
    const containerWidth = gameContainer.clientWidth;
    const canvasSize = Math.floor(containerWidth / GRID_SIZE) * GRID_SIZE;
    
    canvas.width = canvasSize;
    canvas.height = canvasSize;
    
    // Centraliza o canvas
    canvas.style.margin = '0 auto';
}

function gameLoop(currentTime) {
    if (!isGameRunning) return;

    if (isPaused) {
        requestAnimationFrame(gameLoop);
        return;
    }

    window.requestAnimationFrame(gameLoop);

    const secondsSinceLastRender = (currentTime - lastRenderTime) / 1000;
    if (secondsSinceLastRender < gameSpeed / 1000) return;

    lastRenderTime = currentTime;

    updateGame();
    draw();
    checkAndUpdateHighScore();
}

function resizeCanvas() {
    const minDimension = Math.min(window.innerWidth, window.innerHeight);
    const canvasSize = Math.floor(minDimension * 0.9 / GRID_SIZE) * GRID_SIZE;
    
    canvas.width = canvasSize;
    canvas.height = canvasSize;
    
    // Centraliza o canvas
    canvas.style.position = 'absolute';
    canvas.style.left = '50%';
    canvas.style.top = '50%';
    canvas.style.transform = 'translate(-50%, -50%)';
}

function setupTouchControls() {
    document.addEventListener('touchstart', (e) => {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
    });

    document.addEventListener('touchmove', (e) => {
        if (isPaused) return;
        e.preventDefault();
        const touchEndX = e.touches[0].clientX;
        const touchEndY = e.touches[0].clientY;
        
        const dx = touchEndX - touchStartX;
        const dy = touchEndY - touchStartY;
        
        if (Math.abs(dx) > Math.abs(dy)) {
            if (dx > 0 && direction !== 'left') direction = 'right';
            else if (dx < 0 && direction !== 'right') direction = 'left';
        } else {
            if (dy > 0 && direction !== 'up') direction = 'down';
            else if (dy < 0 && direction !== 'down') direction = 'up';
        }
    });
}

function spawnFood() {
    food = {
        x: Math.floor(Math.random() * (canvas.width / GRID_SIZE)) * GRID_SIZE,
        y: Math.floor(Math.random() * (canvas.height / GRID_SIZE)) * GRID_SIZE
    };
}

function updateGame() {
    const head = {x: snake[0].x, y: snake[0].y};
    
    switch(direction) {
        case 'right': head.x += GRID_SIZE; break;
        case 'left': head.x -= GRID_SIZE; break;
        case 'up': head.y -= GRID_SIZE; break;
        case 'down': head.y += GRID_SIZE; break;
    }
    
    // Correção de colisão com bordas
    if (head.x < 0 || head.x >= canvas.width || 
        head.y < 0 || head.y >= canvas.height) {
        gameOver();
        return;
    }
    
    snake.unshift(head);
    
    if (head.x === food.x && head.y === food.y) {
        score++;
        document.getElementById('score').textContent = `Pontos: ${score}`;
        spawnFood();
    } else {
        snake.pop();
    }
}

function updateHighScore() {
    const storedHighScore = localStorage.getItem('snakeHighScore') || 0;
    highScore = parseInt(storedHighScore);
    document.getElementById('highScore').textContent = `Recorde: ${highScore}`;
}

function checkAndUpdateHighScore() {
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('snakeHighScore', highScore.toString());
        document.getElementById('highScore').textContent = `Recorde: ${highScore}`;
    }
}

function updateDifficultySelection() {
        const options = document.querySelectorAll('.difficulty-option');
        options.forEach((option, index) => {
            if (index === currentIndex) {
                option.classList.add('active');
                option.classList.remove('inactive');
            } else {
                option.classList.remove('active');
                option.classList.add('inactive');
            }
        });
    }

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Desenha a cobra
    snake.forEach((segment, index) => {
        ctx.beginPath();
        ctx.roundRect(segment.x, segment.y, GRID_SIZE-2, GRID_SIZE-2, 3);
        
        const gradient = ctx.createLinearGradient(
            segment.x, segment.y, 
            segment.x + GRID_SIZE, segment.y + GRID_SIZE
        );
        
        if (index === 0) {
            gradient.addColorStop(0, '#4cd137');
            gradient.addColorStop(1, '#44bd32');
        } else {
            gradient.addColorStop(0, '#20bf6b');
            gradient.addColorStop(1, '#26de81');
        }
        
        ctx.fillStyle = gradient;
        ctx.fill();
    });
    
    // Desenha a comida
    ctx.beginPath();
    ctx.roundRect(food.x, food.y, GRID_SIZE-2, GRID_SIZE-2, 3);
    const foodGradient = ctx.createRadialGradient(
        food.x + GRID_SIZE/2, food.y + GRID_SIZE/2, 0,
        food.x + GRID_SIZE/2, food.y + GRID_SIZE/2, GRID_SIZE
    );
    foodGradient.addColorStop(0, '#e84118');
    foodGradient.addColorStop(1, '#c23616');
    ctx.fillStyle = foodGradient;
    ctx.fill();
}

function togglePause() {
    if (!isGameRunning) return;
    
    isPaused = !isPaused;
    if (isPaused) {
        document.getElementById('pause').style.display = 'flex';
        document.getElementById('pauseScore').textContent = score;
    } else {
        document.getElementById('pause').style.display = 'none';
    }
}

function gameOver() {
    isGameRunning = false;
    document.getElementById('finalScore').textContent = score;
    document.getElementById('game').style.display = 'none';
    document.getElementById('gameOver').style.display = 'flex';
}

function showMenu() {
    isGameRunning = false;
    isPaused = false;
    hideAllScreens();
    document.getElementById('menu').style.display = 'flex';
}

function showCredits() {
    hideAllScreens();
    document.getElementById('credits').style.display = 'flex';
}

function hideAllScreens() {
    const screens = ['menu', 'game', 'credits', 'pause', 'gameOver', 'difficultySelect'];
    screens.forEach(screen => {
        document.getElementById(screen).style.display = 'none';
    });
}

// Chama updateHighScore no início
updateHighScore();