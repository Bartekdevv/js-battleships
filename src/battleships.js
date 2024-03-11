const COLS = 10;
const ROWS = 10;
const COLS_LABELS = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'w', 'x', 'y', 'z'];
const TILE_WIDTH = 45;
const TILE_HEIGHT = 45;
const REQUIRED_SHIPS = [5, 4, 4, 3, 3, 3, 2, 2, 2, 2];

const GameState = {
    initial: 0,
    preparation: 1,
    battle: 2,
};

class Game {
    #lastHover = null;
    #players = [new Player(), new Player()];
    #currentPlayer = this.#players[0];
    #state = null;

    constructor() {
        for(let i = 0; i < this.#players.length; i++){
            this.#players[i].init(`Player ${i+1}`, new Board(10, 10));
            this.#players[i].board.ontileclicked = (event) => this.#onTileClicked(event);
            this.#players[i].board.ontilehover = (event) => this.#onTileMouseOver(event);
        }
    }

    run() {
        this.#setState(GameState.initial);
    }

    #setState(state) {
        if(this.#state == state) return;
        if(state == GameState.preparation) {
            this.#showDialog('Ship positioning phase', `${this.#currentPlayer.name} turn`);
            document.addEventListener('keydown', (event) => this.#toggleShipRotation(event));
        }
        let stateBtn = document.getElementById('state-btn');
        stateBtn.innerHTML = state == GameState.initial ? 'Start' : 'Reset';
        stateBtn.style.backgroundColor = state == GameState.initial ? 'rgba(0, 255, 0, 0.5)' : 'rgba(255, 0, 0, 0.5)';
        stateBtn.onclick = () => this.#setState( state == GameState.initial ? GameState.preparation : GameState.initial );
        this.#state = state;
    }

    #showDialog(title, content) {
        let dialog = document.createElement('dialog');
        dialog.className = 'column main-axis-space-between cross-axis-center';

        dialog.innerHTML += `<h2>${title}</h2>`;
        dialog.innerHTML += `<h3>${content}</h3>`;
        
        document.body.appendChild(dialog);
        dialog.showModal();
        dialog.addEventListener('animationend', () => {
            setTimeout(() => {
                dialog.classList.add('hide');
                dialog.addEventListener('animationend', () => dialog.remove());
            }, 2000);
        })
    }

    #nextPlayer() {
        return this.#currentPlayer == this.#players[0] ? this.#players[1] : this.#players[0];
    }

    #onTileMouseOver(event) {
        let player = this.#currentPlayer;
        switch(this.#state){
            case GameState.preparation:
                let tile = event.detail.tile;
                let isVertical = player.shipAlignment == Alignment.vertical;
                let tiles = player.board.tiles.filter((tile, index, arr) => tile.col < 5);
                for(let tile of tiles) tile.setColor('black');
                break;
            case GameState.battle:
                break;
        }
    }

   #toggleShipRotation(event) {
        if(event.key != 'r' || this.#state != GameState.preparation) return;
        let alignment = this.#currentPlayer.shipAlignment;
        this.#currentPlayer.shipAlignment = alignment == Alignment.vertical ? Alignment.horizontal : Alignment.vertical;
        this.#lastHover?.dispatchEvent(new CustomEvent('mouseover', {target: this.#lastHover}));
    }

    #onTileClicked(event) {
        switch(this.#state) {
            case GameState.initial:
                return;
            case GameState.preparation:
                let tile = event.detail.tile;
                if(this.#currentPlayer.canPlaceShip()){
                    this.#currentPlayer.placeNextShip();
                }
                if(this.#currentPlayer.allShipsPlaced()) {
                    this.#currentPlayer = this.#nextPlayer();
                    if(this.#currentPlayer.allShipsPlaced()) this.#setState(GameState.battle);
                };
                this.#lastHover?.dispatchEvent(new CustomEvent('mouseover', {target: this.#lastHover}));
            case GameState.battle:
                return;
        }
    }
}

class Player {
    constructor() {
        this.shipsToPlace = Array.from(REQUIRED_SHIPS, (shipSize, index) => new Battleship(shipSize, Alignment.vertical));
        this.shipsPlaced = [];
    }

    init(name, board){
        let html = document.createElement('div');
        html.className = 'column cross-axis-center';

        let playerName = document.createElement('h2');
        playerName.innerHTML = name;

        this.board = board;

        html.appendChild(playerName);
        html.appendChild(this.board.html);

        let playerContainer  = document.getElementById('player-container');
        playerContainer.appendChild(html);
    }

    set shipAlignment(alignment) {
        for(let ship of this.shipsToPlace)
            ship.alignment = alignment;
    }

    nextShip() {
        return this.shipsToPlace.length > 0 ? this.shipsToPlace[0] : null;
    }

    canPlaceShip() {
        let newShip = this.nextShip();
        if(newShip.tiles.includes(null)) return false;
        return true;
    }

    allShipsPlaced() {
        return this.shipsToPlace.length == 0;
    }

    placeNextShip() {
        this.shipsPlaced.push(this.shipsToPlace.shift());
    }
}

class Board {
    constructor(cols, rows) {
        let rowLabels = document.createElement('div');
        rowLabels.className = 'column cross-axis-end';
        rowLabels.style.marginRight = '5px';
        
        let colLabels = document.createElement('div');
        colLabels.className = 'row';

        let grid = document.createElement('div');
        grid.id = 'player-grid'
        grid.style.gridTemplateColumns = `repeat(${cols}, ${TILE_WIDTH}px)`;   
        grid.style.gridTemplateRows = `repeat(${rows}, ${TILE_HEIGHT}px)`;

        this.tiles = [];
        for(let col = 0; col < cols; col++){
            let colLabel = document.createElement('div');
            colLabel.id = 'col-label';
            colLabel.innerHTML = COLS_LABELS[col];
            colLabels.appendChild(colLabel);
            for(let row = 0; row < rows; row++){
                if(col == 0) {
                    let rowLabel = document.createElement('div');
                    rowLabel.id = 'row-label';
                    rowLabel.innerHTML = row + 1;
                    rowLabels.appendChild(rowLabel);
                }
                let tile = new Tile(col, row);
                tile.html.addEventListener('tileclicked', (event) => console.log(event.tile));
                this.tiles.push(tile);
                grid.appendChild(tile.html);
                }
            }

        this.html = document.createElement('div');
        this.html.style.display = 'inline-grid';
        this.html.style.gridTemplateColumns = 'auto auto';
        this.html.appendChild(document.createElement('div'));
        this.html.appendChild(colLabels);
        this.html.appendChild(rowLabels);
        this.html.appendChild(grid);
    }

    clearAllTiles() {
        for(let tile of this.tiles)
            tile.style.backgroundColor = 'transparent';
    }

    set ontileclicked(func) {
        for(let tile of this.tiles)
            tile.html.addEventListener('tileclick', func);
    }

    set ontilehover(func) {
        for(let tile of tiles)
            this.tiles.forEach((tile, idx) => tile.html.addEventListener('tilehover', func));
    }
}

class Tile {
    constructor(col, row) {
        this.html = document.createElement('div');
        this.html.className = 'tile';
        this.html.onclick = (event) => this.html.dispatchEvent(new CustomEvent('tileclick', {detail: {tile: this}}));
        this.html.onmouseover = (event) => this.html.dispatchEvent(new CustomEvent('tilehover', {detail: {tile: this}}));
        this.col = col;
        this.row = row;
    }

    setColor(color) {
        this.html.style.backgroundColor = color;
    }
}

class Battleship {
    constructor(size, alignment) {
        this.size = size;
        this.tiles = [];
        this.alignment = alignment;
    }

    showPreview(color) {
        for(let tile of this.tiles) {
            if(tile != null)
                tile.style.backgroundColor = color;
        }
    }
}

const Alignment = {
    vertical: 0,
    horizontal: 1,
}

document.addEventListener(
    'DOMContentLoaded',
     () => {
        let game = new Game();
        game.run();
     }
);