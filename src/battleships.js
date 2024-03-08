const COLS = 10;
const ROWS = 10;
const COLS_LABELS = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j'];
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
        for(let i = 0; i < this.#players.length; i++) {
            this.#players[i].name = `Player ${i + 1}`;
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
                    tile.onclick = (event) => this.#onTileClicked(event);
                    tile.onmouseover = (event) => this.#onTileMouseOver(event);
                    tile.onmouseleave = () => this.#clearPreview();
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

    run() {
        this.#setState(GameState.initial);
    }

    #setState(state) {
        if(this.#state == state) return;
        if(state == GameState.preparation) {
            this.#showDialog('Game Started', `${this.#currentPlayer.name} turn`);
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

    #createPlayerBoard(index) {
        let row = document.createElement('div');
        row.className = 'row cross-axis-end';

        let rowLabels = document.createElement('div');
        rowLabels.className = 'column row-labels';
        rowLabels.id = `row-labels-p${index}`;

        let column = document.createElement('div');
        column.className = 'column cross-axis-center';

        let playerLabel = document.createElement('h2');
        playerLabel.innerHTML = this.#players[index].name;

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
        let player = this.#currentPlayer;
        let playerIndex = this.#players.indexOf(player);
        if(Number(id[0]) != playerIndex) return;
        switch(this.#state){
            case GameState.preparation:
                this.#clearPreview();
                let column = Number(id[1]);
                let row = Number(id[2]);
                let isVertical =  player.shipAlignment == Alignment.vertical;
                let nextShip = player.nextShip();
                let startIndex = isVertical ? row : column;
                let endIndex = startIndex + nextShip.size;
                let previewTiles = []
                for(let i = startIndex; i < endIndex; i++) {
                    let tile = document.getElementById(`${playerIndex}-${column}-${row}`);
                    previewTiles.push(tile);
                    isVertical ? row++ : column++;
                }
                nextShip.tiles = previewTiles;
                nextShip.showPreview(player.canPlaceShip() ? 'rgba(0, 255, 0, 0.5)' : 'rgba(255, 0, 0, 0.5)');
                this.#lastHover = event.target;
                break;
            case GameState.battle:
                break;
        }
    }

    #clearPreview() {
        for(let tile of document.getElementsByClassName('tile')) {
            tile.style.backgroundColor = 'transparent';
        }
        this.#lastHover = null;
    }

   #toggleShipRotation(event) {
        if(event.key != 'r' || this.#state != GameState.preparation) return;
        let alignment = this.#currentPlayer.shipAlignment;
        this.#currentPlayer.shipAlignment = alignment == Alignment.vertical ? Alignment.horizontal : Alignment.vertical;
        this.#lastHover?.dispatchEvent(new CustomEvent('mouseover', {target: this.#lastHover}));
    }

    #onTileClicked(event) {
        let tileId = event.target.id.split('-');
        let playerIndex = this.#players.indexOf(this.#currentPlayer)
        if(Number(tileId[0]) != playerIndex) return;
        switch(this.#state) {
            case GameState.initial:
                return;
            case GameState.preparation:
                if(this.#currentPlayer.canPlaceShip())
                    this.#currentPlayer.placeNextShip();
                if(this.#currentPlayer.allShipsPlaced()) {
                    this.#currentPlayer = this.#nextPlayer();
                    if(this.#currentPlayer.allShipsPlaced()) this.#setState(GameState.battle);
                    this.#clearPreview();
                };
                this.#lastHover?.dispatchEvent(new CustomEvent('mouseover', {target: this.#lastHover}));
            case GameState.battle:
                return;
        }
    }
}

class Player {
    constructor(name) {
        this.name = name;
        this.shipsToPlace = Array.from(REQUIRED_SHIPS, (shipSize, index) => new Battleship(shipSize));
        this.shipsPlaced = [];
        this.shipAlignment = Alignment.vertical;
    }

    nextShip() {
        return this.shipsToPlace[0];
    }

    canPlaceShip() {
        console.clear();
        let newShip = this.nextShip();
        if(newShip.tiles.includes(null)) return false;
        return true;
    }

    allShipsPlaced() {
        return this.shipsToPlace.length == 0;
    }

    placeNextShip() {
        this.nextShip().place();
        this.shipsPlaced.push(this.shipsToPlace.shift());
    }
}

class Battleship {
    constructor(size) {
        this.size = size;
        this.tiles = [];
    }

    place() {
        for(let tile of this.tiles) {
            tile.innerHTML = 'X';
        }
    }

    showPreview (color) {
        for(let tile of this.tiles) {
            if(tile != null) tile.style.backgroundColor = color;
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