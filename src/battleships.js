const COLS = 10;
const ROWS = 10;
const TILE_WIDTH = 45;
const TILE_HEIGHT = 45;
const COL_LABELS = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'w', 'x', 'y', 'z'];
const REQUIRED_SHIPS = [5, 4, 4, 3, 3, 3, 2, 2, 2, 2];

const GameState = {
    initial: 0,
    preparation: 1,
    battle: 2,
};

class Game {
    constructor() {
        this.players = [new Player(), new Player()];
        this.playing = this.players[0];

        for(let i = 0; i < this.players.length; i++){
            this.players[i].init(`Player ${i+1}`, new Board(10, 10));
            this.players[i].board.ontilemouseover = (tile) => this.handleTileMouseOver(tile);
            this.players[i].board.ontilemouseleave = (tile) => this.handleTileMouseLeave(tile);
            this.players[i].board.ontileclicked = (tile) => this.handleTileClick(tile);
        }
        document.addEventListener('keypress', (event) => event.key == 'r' ? this.toggleCurrentPlayerShipRotation() : null);
    }

    run() {
        this.setState(GameState.initial);
    }
 
    setState(state) {
        if(this.state == state) return;
        switch(state) {
            case GameState.initial:
                break;
            case GameState.preparation:
                this.showDialog('Ship positioning phase', `${this.playing.name} turn`);
                break;
            case GameState.battle:
                this.showDialog('Battle phase', `${this.playing.name} turn`);
                break;
        }
        let stateBtn = document.getElementById('state-btn');
        stateBtn.innerHTML = state == GameState.initial ? 'Start' : 'Reset';
        stateBtn.style.backgroundColor = state == GameState.initial ? 'rgba(0, 255, 0, 0.5)' : 'rgba(255, 0, 0, 0.5)';
        stateBtn.onclick = () => this.setState(state == GameState.initial ? GameState.preparation : GameState.initial);
        this.state = state;
    }

    showDialog(title, content) {
        let dialog = document.createElement('dialog');
        dialog.className = 'column cross-axis-center';

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

    handleTileClick(tile) {
        switch(this.state){
            case GameState.initial:
                break;
            case GameState.preparation: 
                this.playing.placeShip();
                if(this.playing.allShipsPlaced){
                    this.switchPlayers();
                    if(this.playing.allShipsPlaced){
                        this.switchPlayers();
                        this.setState(GameState.battle);
                    }
                    else
                        this.showDialog('Ship positioning phase', `${this.playing.name} turn`);
                }
            case GameState.battle:
                break;
        }
    }

    handleTileMouseOver(tile) {
        switch(this.state){
            case GameState.initial:
                break;
            case GameState.preparation: 
                this.playing.determineShipTiles(tile);
            case GameState.battle:
                break;
        }
    }

    handleTileMouseLeave(tile) {
        switch(this.state){
            case GameState.initial:
                break;
            case GameState.preparation: 
                this.playing.determineShipTiles(null);
                break;
            case GameState.battle:
                break;
        }
    }

    switchPlayers() {
        this.playing = this.playing == this.players[0] ? this.players[1] : this.players[0];
    }

    toggleCurrentPlayerShipRotation() {
        this.playing.toggleShipAlignment();
    }
}

class Player {
    constructor() {
        this.shipsToPlace = Array.from(REQUIRED_SHIPS, (shipSize, index) => new Battleship(shipSize, Alignment.vertical));
        this.placedShips = [];
    }

    init(name, board){
        this.html = document.createElement('div');
        this.html.className = 'column cross-axis-center';
        
        this.name = name;
        let playerName = document.createElement('h2');
        playerName.innerHTML = this.name;

        this.board = board;

        this.html.appendChild(playerName);
        this.html.appendChild(this.board.html);

        const playerContainer = document.getElementById('player-container');
        playerContainer.appendChild(this.html);
    }

    toggleShipAlignment() {
        this.shipAlignment = this.shipAlignment == Alignment.vertical ? Alignment.horizontal : Alignment.vertical;
        this.determineShipTiles(this.nextShip?.tiles[0]);
    }

    set shipAlignment(alignment) {
        for(let ship of this.shipsToPlace)
            ship.alignment = alignment;
    }

    get shipAlignment() {
        return this.nextShip?.alignment;
    }

    get nextShip() {
        return this.shipsToPlace[0];
    }

    get canPlaceShip() {
    if (this.nextShip == null || this.nextShip.tiles.length < this.nextShip.size) return false;

    const neighbouringTilesSet = new Set();

    for (const ship of this.placedShips) {
        for (const tile of ship.tiles) {
            const neighbouringTiles = this.board.getNeighbouringTiles(tile);
            neighbouringTiles.forEach(t => neighbouringTilesSet.add(t));
        }
    }

    for (const tile of this.nextShip.tiles) {
        if (neighbouringTilesSet.has(tile)) return false;
    }

    return true;
}

    get allShipsPlaced() {
        return this.shipsToPlace.length == 0;
    }

    determineShipTiles(tile) {
        if(tile == null) return this.nextShip?.setTiles(new Array());
        else if(!this.board.tiles.includes(tile) || this.nextShip == null) return;
        this.nextShip.setTiles(this.board.getTilesInLine(tile, this.shipAlignment, this.nextShip.size));
        this.nextShip?.highlight(this.canPlaceShip ? 'lightgreen' : 'rgba(255, 0, 0, 0.5)');
    }
    
    placeShip() {
        if(this.canPlaceShip){
            this.nextShip.place(this.board);
            this.placedShips.push(this.shipsToPlace.shift());
        }
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
        grid.style.position = 'relative';

        this.tiles = [];
        for(let row = 0; row < rows; row++){
            let rowLabel = document.createElement('div');
            rowLabel.id = 'row-label';
            rowLabel.innerHTML = row + 1;
            rowLabels.appendChild(rowLabel);
            for(let col = 0; col < cols; col++){
                if(row == 0) {
                    let colLabel = document.createElement('div');
                    colLabel.id = 'col-label';
                    colLabel.innerHTML = COL_LABELS[col];
                    colLabels.appendChild(colLabel);
                }
                let tile = new Tile(col, row);
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

    clear () {
        this.tiles.forEach((tile) => tile.resetStyle());
    }

    getTilesInLine(startTile, alignment, length) {
        return this.tiles.filter(
            (tile) =>  {
                if(alignment == Alignment.vertical){
                    return (
                        tile.col == startTile.col &&
                         tile.row >= startTile.row && 
                         tile.row < startTile.row + length
                    );
                } else{
                    return (
                        tile.row == startTile.row &&
                         tile.col >= startTile.col &&
                          tile.col < startTile.col + length
                    );
                }
            }
        );
    }

    getNeighbouringTiles(tile) {
        return this.tiles.filter((item) => {
            if(item == tile) return false;
            if (Math.abs(item.row - tile.row) <= 1 && Math.abs(item.col - tile.col) <= 1)
                return true;
            return false;
        })
    }

    set ontileclicked(func) {
        for(let tile of this.tiles)
            tile.onclick = () => func(tile);
    }

    set ontilemouseover(func) {
        for(let tile of this.tiles)
            tile.onmouseover = () => func(tile);
    }

    set ontilemouseleave(func) {
        for(let tile of this.tiles)
            tile.onmouseleave = () => func(tile);
    }
}

class Tile {
    constructor(col, row) {
        this.html = document.createElement('div');
        this.html.className = 'tile';
        this.col = col;
        this.row = row;
    }

    set onmouseover(func) {
        this.html.onmouseover = func;
    }

    set onmouseleave(func) {
        this.html.onmouseleave = func;
    }

    set onclick(func) {
        this.html.onclick = func;
    }

    set color(color) {
        this.html.style.backgroundColor = color;
    }

    resetStyle(){
        this.html.removeAttribute('style');
    }
}

const Alignment = {
    vertical: 0,
    horizontal: 1,
}

class Battleship {
    constructor(size, alignment) {
        this.size = size;
        this.tiles = [];
        this.alignment = alignment;
    }

    setTiles(tiles) {
        this.unhighlight();
        this.tiles = tiles;
    }

    unhighlight() {
        for(const tile of this.tiles)
            tile.resetStyle();
    }

    highlight(color) {
        for(const tile of this.tiles) {
            tile.color = color;
        }
    }

    place(board) {
        this.unhighlight();

        this.html = document.createElement('div');
        this.html.className = 'ship';
        this.html.style.animationName = this.alignment == Alignment.vertical ? 'slideInV' : 'slideInH';
        this.html.style.top = `${this.tiles[0].row * TILE_HEIGHT}px`;
        this.html.style.left = `${this.tiles[0].col * TILE_WIDTH}px`;
        this.html.style.width = `${this.alignment == Alignment.vertical ? TILE_WIDTH : this.size * TILE_WIDTH}px`;
        this.html.style.height = `${this.alignment != Alignment.vertical ? TILE_HEIGHT : this.size * TILE_HEIGHT}px`;

        const grid = board.html.lastChild;
        grid.appendChild(this.html);
    }
}

document.addEventListener(
    'DOMContentLoaded',
     () => {
        let game = new Game();
        game.run();
     }
);