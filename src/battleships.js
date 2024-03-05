const COLS = 10;
const ROWS = 10;
const COLS_LABELS = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j'];
const TILE_WIDTH = 45;
const TILE_HEIGHT = 45;
const REQUIRED_SHIPS = [5, 4, 4, 3, 3, 3, 2, 2, 2, 2]

const GameState = {
    initial: 0,
    preparation: 1,
    battle: 2,
};

class Game {
    #lastHover = null;
    #players = [new Player(), new Player()];
    #currentPlayer = this.#players[0];
    #state = GameState.initial;

    constructor() {
        document.addEventListener('keydown', (event) => this.#toggleShipRotation(event));
        for(let i = 0; i < this.#players.length; i++) {
            let playerContainer = document.getElementById('playerContainer');
            playerContainer.appendChild(this.#createPlayerBoard(i));

            let battlefield = document.getElementById(`battlefield-p${i}`);

            battlefield.style.width = `${COLS * TILE_WIDTH}px`;
            battlefield.style.height = `${ROWS * TILE_HEIGHT}px`;

            let rowLabels = document.getElementById(`row-labels-p${i}`);
            let colLabels = document.getElementById(`column-labels-p${i}`);
            
            for(let j = 0; j < ROWS; j++) {
                var rowLabel = document.createElement('div');
                rowLabel.innerHTML = j + 1;
                rowLabel.style.lineHeight = `${TILE_HEIGHT}px`;
                rowLabel.style.height = `${TILE_HEIGHT}px`;
                rowLabels.appendChild(rowLabel);
                var colLabel = document.createElement('div');
                colLabel.innerHTML = COLS_LABELS[j];
                colLabel.style.textAlign = 'center'
                colLabel.style.width = `${TILE_WIDTH}px`;
                colLabels.appendChild(colLabel);
                for(var k = 0; k < COLS; k++) {
                    var tile = document.createElement('div');
                    tile.className = 'tile';
                    tile.id = `${i}-${k}-${j}`;
                    tile.onmouseover = (event) => this.#onTileMouseOver(event);
                    tile.onmouseleave = (event) => this.#onTileMouseLeave(event);
                    tile.onclick = (event) => this.#onTileClicked(event);
                    tile.style.top = `${j * TILE_HEIGHT}px`;
                    tile.style.left = `${k * TILE_WIDTH}px`;
                    tile.style.height = `${TILE_HEIGHT}px`;
                    tile.style.width = `${TILE_WIDTH}px`;
                    tile.style.lineHeight = `${TILE_HEIGHT}px`;
                    tile.style.textAlign = 'center';
                    battlefield.appendChild(tile);
                }
            }
        }
    }

    updateState(state) {
        if(this.#state == state) return;
        this.#state = state;
    }

    #createPlayerBoard(index) {
        let row = document.createElement('div');
        row.className = 'row cross-axis-end';

        let rowLabels = document.createElement('div');
        rowLabels.className = 'column row-labels';
        rowLabels.id = `row-labels-p${index}`;

        let column = document.createElement('div');
        column.className = 'column cross-axis-center';

        let playerLabel = document.createElement('h2');
        playerLabel.innerHTML = `Player ${index + 1}`;

        let columnLabels = document.createElement('div');
        columnLabels.className = 'row col-labels';
        columnLabels.id = `column-labels-p${index}`;

        let battlefield = document.createElement('div');
        battlefield.className = 'battlefield';
        battlefield.id = `battlefield-p${index}`;

        column.append(playerLabel);
        column.appendChild(columnLabels);
        column.appendChild(battlefield);
        row.appendChild(rowLabels);
        row.appendChild(column);

        return row;
    }

    #nextPlayer() {
        return this.#currentPlayer == this.#players[0] ? this.#players[1] : this.#players[0];
    }

    #onTileMouseOver(event) {
        if(this.#state == GameState.initial) return;
        let id = event.target.id.split('-');
        let playerIndex = this.#players.indexOf(this.#currentPlayer);
        if(Number(id[0]) != playerIndex) return;
        switch(this.#state){
            case GameState.preparation:
                this.#onTileMouseLeave();
                let column = Number(id[1]);
                let row = Number(id[2]);
                let nextShip = this.#currentPlayer.shipsToPlace[0];
                let isVertical =  this.#currentPlayer.shipAlignment == Alignment.vertical;
                let startIndex = isVertical ? row : column;
                let endIndex = startIndex + nextShip.size;
                nextShip.tiles = [];
                for(let i = startIndex; i < endIndex; i++) {
                    let tile = null;
                    tile = document.getElementById(`${playerIndex}-${column}-${row}`);
                    for(let i = 0; i < this.#currentPlayer.shipsPlaced.length; i++)
                        if(this.#currentPlayer.shipsPlaced[i].tiles.includes(tile)) nextShip.tiles.push(null);
                    nextShip.tiles.push(tile);
                    isVertical ? row++ : column++;
                    nextShip.canBePlaced = this.#canShipBePlaced(tile, this.#currentPlayer.shipsPlaced)
                    let color = nextShip.canBePlaced ? 'lightgreen' : 'red';
                    if(tile != null) tile.style.backgroundColor = color;
                }
                this.#lastHover = event.target;
                break;
            case GameState.battle:
                break;
        }
    }

    #canShipBePlaced(tile, placedShips) {
        if(tile == null) return false;
        let tileId = tile.id.split('-');
        for(let i = 0; i < placedShips.length; i++) {
            for(let j = 0; j < placedShips[i].tiles.length; j++){
                let id = placedShips[i].tiles[j].id.split('-');
                if(id[1] == tileId[1] || tileId[1] - 1 == id[1] || tileId[1] + 1 == id[1] || id[2] == tileId[2] || tileId[2] - 1 == id[2] || tileId[2] + 1 == id[2])
                    return false;
            }
        }
        return true;
    }

    #onTileMouseLeave() {
        if(!this.#currentPlayer.allShipsPlaced())
            this.#currentPlayer.shipsToPlace[0].tiles = [];
        let tiles = document.getElementsByClassName('tile');
        for(let i = 0; i < tiles.length; i++){
            tiles[i].style.backgroundColor = 'transparent';
        }
        this.#lastHover = null;
    }

   #toggleShipRotation (event) {
        if(event.key != 'r' || this.#state != GameState.preparation) return;
        let alignment = this.#currentPlayer.shipAlignment;
        this.#currentPlayer.shipAlignment = alignment == Alignment.vertical ? Alignment.horizontal : Alignment.vertical;
        this.#lastHover?.dispatchEvent(new CustomEvent('mouseover', {target: this.#lastHover}));
    }

    #onTileClicked(event) {
        let id = event.target.id.split('-');
        let playerIndex = this.#players.indexOf(this.#currentPlayer)
        if(Number(id[0]) != playerIndex) return;
        switch(this.#state) {
            case GameState.initial:
                return;
            case GameState.preparation:
                if(this.#currentPlayer.shipsToPlace[0].canBePlaced)
                    this.#currentPlayer.placeNextShip();
                if(this.#currentPlayer.allShipsPlaced()) {
                    this.#currentPlayer = this.#nextPlayer();
                    if(this.#currentPlayer.allShipsPlaced()) this.updateState(GameState.battle);
                    this.#onTileMouseLeave();
                };
                this.#lastHover?.dispatchEvent(new CustomEvent('mouseover', {target: this.#lastHover}));
            case GameState.battle:
                return;
        }
    }
}

class Player {
    constructor() {
        this.shipsToPlace = Array.from(REQUIRED_SHIPS, (shipSize, index) => new Battleship(shipSize));
        this.shipsPlaced = [];
        this.shipAlignment = Alignment.vertical;
    }

    allShipsPlaced() {
        return this.shipsToPlace.length == 0;
    }

    placeNextShip() {
        this.shipsToPlace[0].place();
        this.shipsPlaced.push(this.shipsToPlace.shift());
    }
}

class Battleship {
    constructor(size) {
        this.size = size;
        this.tiles = [];
        this.canBePlaced = false;
    }

    place() {
        for(let i = 0; i < this.tiles.length; i++) {
            this.tiles[i].innerHTML = 'X';
        }
    }
}

const Alignment = {
    vertical: 0,
    horizontal: 1,
}

document.addEventListener('DOMContentLoaded', (_) => {
        let game = new Game();
        document.getElementById('start-button').onclick = () => game.updateState(GameState.preparation);
    }
);