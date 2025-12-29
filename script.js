document.addEventListener('DOMContentLoaded', () => {
    const gameBoardElement = document.getElementById('game-board');
    const statusMessageElement = document.getElementById('status-message');
    const playerInfoElement = document.getElementById('player-info');
    const btnMove = document.getElementById('btn-move');
    const btnObstacle = document.getElementById('btn-obstacle');

    const boardSize = 9;
    let board = Array(boardSize).fill(null).map(() => Array(boardSize).fill(' '));

    // Mapeamento de coordenadas (igual ao Python)
    const mapLetters = { 'A': 0, 'B': 1, 'C': 2, 'D': 3, 'E': 4, 'F': 5, 'G': 6, 'H': 7, 'I': 8 };
    const mapIndicesToLetters = { 0: 'A', 1: 'B', 2: 'C', 3: 'D', 4: 'E', 5: 'F', 6: 'G', 7: 'H', 8: 'I' };
    // Colunas: 1 (direita) a 9 (esquerda)
    const mapNumbers = { '1': 8, '2': 7, '3': 6, '4': 5, '5': 4, '6': 3, '7': 2, '8': 1, '9': 0 };
    const mapIndicesToNumbers = { 8: '1', 7: '2', 6: '3', 5: '4', 4: '5', 3: '6', 2: '7', 1: '8', 0: '9' };

    const initialPos_X = [0, 4]; // A5
    const initialPos_O = [8, 4]; // I5

    let playerPieces = {
        'X': [...initialPos_X],
        'O': [...initialPos_O]
    };

    const objectives = {
        'X': [...initialPos_O], // X quer ir para I5
        'O': [...initialPos_X]  // O quer ir para A5
    };

    let currentPlayer = 'X';
    let obstaclesRemaining = { 'X': 3, 'O': 3 };

    let currentAction = 'move'; // 'move' ou 'obstacle'
    let selectedPieceCoords = null; // Guarda as coordenadas da peça que está sendo movida

    // --- Funções de Utilitário ---
    function coordToString(row, col) {
        if (row === null || col === null) return null;
        const letter = mapIndicesToLetters[row];
        const number = mapIndicesToNumbers[col];
        return `${letter}${number}`;
    }

    function stringToCoord(coordStr) {
        if (coordStr.length !== 2) return [null, null];
        const letter = coordStr[0].toUpperCase();
        const number = coordStr[1];
        const row = mapLetters[letter];
        const col = mapNumbers[number];
        return [row, col];
    }

    function displayMessage(message, type = 'info') {
        statusMessageElement.textContent = message;
        statusMessageElement.className = `status-message ${type}`; // Para aplicar estilos diferentes (ex: erro, sucesso)
    }

    function updatePlayerInfo() {
        playerInfoElement.innerHTML = `
            <p>Jogador atual: <span class="${currentPlayer === 'X' ? 'player-X-text' : 'player-O-text'}">${currentPlayer}</span></p>
            <p>Obstáculos restantes para X: <span class="player-X-text">${obstaclesRemaining['X']}</span></p>
            <p>Obstáculos restantes para O: <span class="player-O-text">${obstaclesRemaining['O']}</span></p>
        `;
    }

    // --- Funções de Renderização do Tabuleiro ---
    function renderBoard() {
        gameBoardElement.innerHTML = ''; // Limpa o tabuleiro antes de renderizar
        board[playerPieces['X'][0]][playerPieces['X'][1]] = 'X';
        board[playerPieces['O'][0]][playerPieces['O'][1]] = 'O';

        for (let r = 0; r < boardSize; r++) {
            for (let c = 0; c < boardSize; c++) {
                const cell = document.createElement('div');
                cell.classList.add('cell');
                cell.dataset.row = r;
                cell.dataset.col = c;

                const cellContent = board[r][c];
                if (cellContent === 'X') {
                    cell.textContent = 'X';
                    cell.classList.add('player-X');
                } else if (cellContent === 'O') {
                    cell.textContent = 'O';
                    cell.classList.add('player-O');
                } else if (cellContent === '#') {
                    cell.textContent = '#';
                    cell.classList.add('obstacle');
                }
                // Se a célula estiver vazia (' '), não coloca texto.

                cell.addEventListener('click', handleCellClick);
                gameBoardElement.appendChild(cell);
            }
        }
        updatePlayerInfo();
        displayMessage(`É a vez do jogador ${currentPlayer}.`);
    }

    // --- Funções de Lógica do Jogo ---
    function isValidMove(fromRow, fromCol, toRow, toCol) {
        // Fora do tabuleiro
        if (toRow < 0 || toRow >= boardSize || toCol < 0 || toCol >= boardSize) {
            displayMessage("❌ Movimento inválido: Fora do tabuleiro.", 'error');
            return false;
        }

        // Não pode mover para obstáculo
        if (board[toRow][toCol] === '#') {
            displayMessage("❌ Movimento inválido: Caminho bloqueado por um obstáculo.", 'error');
            return false;
        }
        
        // Não pode mover para onde está a peça do oponente
        const opponent = currentPlayer === 'X' ? 'O' : 'X';
        if (board[toRow][toCol] === opponent) {
            displayMessage("❌ Movimento inválido: O quadrado já está ocupado pela peça do oponente.", 'error');
            return false;
        }

        // Apenas um quadrado na horizontal ou vertical
        const dr = Math.abs(toRow - fromRow);
        const dc = Math.abs(toCol - fromCol);
        if (dr + dc !== 1) {
            displayMessage("❌ Movimento inválido: Apenas um quadrado na horizontal ou vertical.", 'error');
            return false;
        }

        return true;
    }

    function performMove(fromRow, fromCol, toRow, toCol) {
        if (!isValidMove(fromRow, fromCol, toRow, toCol)) {
            return false;
        }

        // Limpa a posição antiga e atualiza a nova
        board[fromRow][fromCol] = ' ';
        board[toRow][toCol] = currentPlayer;
        playerPieces[currentPlayer] = [toRow, toCol];

        displayMessage(`✅ Jogador ${currentPlayer} moveu de ${coordToString(fromRow, fromCol)} para ${coordToString(toRow, toCol)}.`, 'success');
        return true;
    }

    function placeObstacle(row, col) {
        if (obstaclesRemaining[currentPlayer] <= 0) {
            displayMessage("❌ Você não tem mais obstáculos para colocar.", 'error');
            return false;
        }

        // Não pode colocar obstáculo onde já tem algo
        if (board[row][col] !== ' ') {
            displayMessage("❌ Não é possível colocar obstáculo em um quadrado já ocupado.", 'error');
            return false;
        }

        board[row][col] = '#';
        obstaclesRemaining[currentPlayer]--;
        displayMessage(`✅ Jogador ${currentPlayer} colocou um obstáculo em ${coordToString(row, col)}.`, 'success');
        return true;
    }

    function checkWinCondition() {
        const [currentRow, currentCol] = playerPieces[currentPlayer];
        const [objRow, objCol] = objectives[currentPlayer];
        return currentRow === objRow && currentCol === objCol;
    }

    function nextTurn() {
        currentPlayer = (currentPlayer === 'X') ? 'O' : 'X';
        selectedPieceCoords = null; // Reseta seleção
        renderBoard(); // Renderiza o tabuleiro para o próximo turno
        clearHighlighting(); // Remove quaisquer highlights de movimentos válidos
    }

    // --- Funções de Interação com a UI ---
    function highlightValidMoves(row, col) {
        clearHighlighting();
        for (let r = 0; r < boardSize; r++) {
            for (let c = 0; c < boardSize; c++) {
                if (isValidMove(row, col, r, c)) {
                    const cellElement = document.querySelector(`.cell[data-row="${r}"][data-col="${c}"]`);
                    if (cellElement) {
                        cellElement.classList.add('valid-move');
                    }
                }
            }
        }
    }

    function clearHighlighting() {
        document.querySelectorAll('.cell.selected').forEach(cell => cell.classList.remove('selected'));
        document.querySelectorAll('.cell.valid-move').forEach(cell => cell.classList.remove('valid-move'));
    }

    function handleCellClick(event) {
        const clickedCell = event.target;
        const row = parseInt(clickedCell.dataset.row);
        const col = parseInt(clickedCell.dataset.col);

        if (currentAction === 'move') {
            // Se nenhuma peça foi selecionada ainda, e a célula clicada é a peça do jogador atual
            if (!selectedPieceCoords && board[row][col] === currentPlayer) {
                selectedPieceCoords = [row, col];
                clickedCell.classList.add('selected');
                highlightValidMoves(row, col);
                displayMessage(`Peça ${currentPlayer} selecionada em ${coordToString(row, col)}. Agora clique no destino.`, 'info');
            }
            // Se uma peça foi selecionada, e a célula clicada é um destino potencial
            else if (selectedPieceCoords) {
                const [fromRow, fromCol] = selectedPieceCoords;
                if (performMove(fromRow, fromCol, row, col)) {
                    if (checkWinCondition()) {
                        displayMessage(`🎉 Parabéns! O jogador ${currentPlayer} venceu o jogo! 🎉`, 'success');
                        // Desativar interações ou mostrar botão de reiniciar
                        gameBoardElement.removeEventListener('click', handleCellClick);
                    } else {
                        nextTurn();
                    }
                }
                clearHighlighting(); // Sempre limpa os highlights após tentar um movimento
            } else {
                displayMessage("Clique na sua peça para mover.", 'info');
            }
        } else if (currentAction === 'obstacle') {
            if (placeObstacle(row, col)) {
                nextTurn();
            }
        }
    }

    // --- Listeners para Botões de Ação ---
    btnMove.addEventListener('click', () => {
        currentAction = 'move';
        btnMove.classList.add('active');
        btnObstacle.classList.remove('active');
        clearHighlighting();
        selectedPieceCoords = null; // Reseta seleção ao trocar de modo
        displayMessage(`É a vez do jogador ${currentPlayer}. Clique na sua peça para mover.`);
    });

    btnObstacle.addEventListener('click', () => {
        currentAction = 'obstacle';
        btnObstacle.classList.add('active');
        btnMove.classList.remove('active');
        clearHighlighting();
        selectedPieceCoords = null; // Reseta seleção ao trocar de modo
        displayMessage(`É a vez do jogador ${currentPlayer}. Clique em um quadrado vazio para colocar um obstáculo. Obstáculos restantes: ${obstaclesRemaining[currentPlayer]}`);
    });

    // --- Inicialização do Jogo ---
    function initGame() {
        // Posicionar peças iniciais no tabuleiro (apenas para a renderização inicial)
        board[initialPos_X[0]][initialPos_X[1]] = 'X';
        board[initialPos_O[0]][initialPos_O[1]] = 'O';
        renderBoard();
        displayMessage(`Bem-vindo! Jogador X começa em ${coordToString(...initialPos_X)} e busca ${coordToString(...objectives['X'])}. Jogador O começa em ${coordToString(...initialPos_O)} e busca ${coordToString(...objectives['O'])}. É a vez do jogador X.`);
    }

    initGame();
});
