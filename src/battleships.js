const COLS = 10;
const ROWS = 10;
const TILE_WIDTH = 45;
const TILE_HEIGHT = 45;
const COL_LABELS = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'w', 'x', 'y', 'z'];
const REQUIRED_SHIPS = [5, 4, 3, 3, 2];

const GameState = {
    initial: 0,
    preparation: 1,
    battle: 2,
    gameOver: 3
};

class Game {
    constructor() {
        this.players = null;
        this.inTurn = null;
        this.notInTurn = null;
    }

    init() {
        document.getElementById('player-container').innerHTML = '';

        this.players = [new Player(), new Player()];

        for(let i = 0; i < 2; i++){
            this.players[i].init(`Player ${i+1}`, new Board(COLS, ROWS));
            this.players[i].board.ontilemouseover = (tile) => this.handleTileMouseOver(tile);
            this.players[i].board.ontilemouseleave = (tile) => this.handleTileMouseLeave(tile);
            this.players[i].board.ontileclicked = (tile) => this.handleTileClick(tile);
        }

        this.inTurn = this.players[0];
        this.notInTurn = this.players[1];

        document.addEventListener('keypress', (event) => event.key == 'r' ? this.toggleCurrentPlayerShipAlignment() : null);
    }

    run() {
        this.setState(GameState.initial);
    }
 
    setState(state) {
        if(this.state == state) return;
        switch(state) {
            case GameState.initial:
                this.init();
                break;
            case GameState.preparation:
                this.showDialog('Ship Positioning Stage', `${this.inTurn.name} Turn`);
                break;
            case GameState.battle:
                this.showDialog('Battle Stage', `${this.inTurn.name} Turn`);
                break;
            case GameState.gameOver:
                this.showDialog('Game Over', `${this.inTurn.name} has won the Game!`, null);
                for(const player of this.players) player.showShips();
                break;
        }
        const stateBtn = document.getElementById('state-btn');
        stateBtn.innerHTML = state == GameState.initial ? 'Start' : 'Reset';
        stateBtn.style.backgroundColor = state == GameState.initial ? 'rgba(0, 255, 0, 0.5)' : 'rgba(255, 0, 0, 0.5)';
        stateBtn.onclick = () => this.setState(state == GameState.initial ? GameState.preparation : GameState.initial);
        this.state = state;
    }

    showDialog(title, content, duration = 2000) {
        const dialog = document.createElement('dialog');
        dialog.className = 'column main-axis-space-between cross-axis-center';

        dialog.innerHTML += `<h2>${title}</h2>`;
        dialog.innerHTML += `<h3>${content}</h3>`;
        
        if(duration == null)
            dialog.innerHTML += '<h5> click anywhere to continue... </h5>';
        
        document.body.appendChild(dialog);
        dialog.showModal();
        dialog.addEventListener(duration != null ? 'animationend' : 'click', () => {
            setTimeout(() => {
                dialog.classList.add('hide');
                dialog.addEventListener('animationend', () => dialog.remove());
            }, duration);
        })
    }

    handleTileClick(tile) {
        switch(this.state){
            case GameState.preparation:
                this.inTurn.placeShip();
                this.handleTileMouseOver(tile);
                if(this.allShipsPlaced){
                    this.inTurn.hideShips();
                    this.switchPlayers();
                    this.setState(GameState.battle);
                } else if(this.inTurn.allShipsPlaced){
                    this.inTurn.hideShips();
                    this.switchPlayers();
                    this.showDialog('Ship Positioning Stage', `${this.inTurn.name} turn`);
                };
                break;
            case GameState.battle:
                if(this.notInTurn.handleTileHit(tile)){
                    this.inTurn.totalAttempts++;
                    if(this.notInTurn.allShipsDestroyed)
                        this.setState(GameState.gameOver);
                    else
                        this.switchPlayers();
                }
                console.clear();
                console.log(`${this.players[0].name} : ${this.players[0].totalAttempts}, destroyed: ${this.players[0].destroyedShips.length}`);
                console.log(`${this.players[1].name} : ${this.players[1].totalAttempts}, destroyed: ${this.players[1].destroyedShips.length}`);
                break;
        }
    }

    handleTileMouseOver(tile) {
        switch(this.state){
            case GameState.preparation: 
                this.inTurn.determineShipTiles(tile);
                break;
            case GameState.battle:
                this.notInTurn.board.highlightTile(tile);
                break;
        }
    }

    handleTileMouseLeave(tile) {
        switch(this.state){
            case GameState.preparation:
                this.inTurn.determineShipTiles(null);
                break;
            case GameState.battle:
                this.notInTurn.board.unhighlightTile(tile);
                break;
        }
    }

    switchPlayers() {
        let temp = this.notInTurn;
        this.notInTurn = this.inTurn;
        this.inTurn = temp;
    }

    toggleCurrentPlayerShipAlignment() {
        this.inTurn.toggleShipAlignment();
    }

    get allShipsPlaced() {
        return this.inTurn.allShipsPlaced && this.notInTurn.allShipsPlaced;
    }
}

class Player {
    constructor() {
        this.shipsToPlace = Array.from(REQUIRED_SHIPS, (shipSize, index) => new Battleship(shipSize, Alignment.vertical));
        this.placedShips = new Array();
        this.destroyedShips = new Array();

        this.totalAttempts = 0;
        this.successfulHits = 0;
        this.shipsSunk = 0;
    }

    init(name, board){
        this.html = document.createElement('div');
        this.html.className = 'column cross-axis-center';

        this.name = name;
        this.board = board;

        this.html.innerHTML += `<h2>${this.name}</h2>`;
        this.html.appendChild(this.board.html);
        
        const playerContainer  = document.getElementById('player-container');
        playerContainer.appendChild(this.html);
    }

    toggleShipAlignment() {
        this.shipAlignment = this.shipAlignment == Alignment.vertical ? Alignment.horizontal : Alignment.vertical;
        this.determineShipTiles(this.nextShip?.tiles[0]);
    }

    set shipAlignment(alignment) {
        for(const ship of this.shipsToPlace)
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

    const neighboringTilesSet = new Set();

    for (const ship of this.placedShips) {
        for (const tile of ship.tiles) {
            const neighboringTiles = this.board.getNeighboringTiles(tile);
            neighboringTiles.forEach(t => neighboringTilesSet.add(t));
        }
    }

    for (const tile of this.nextShip.tiles) {
        if (neighboringTilesSet.has(tile)) return false;
    }

    return true;
    }

    get allShipsPlaced() {
        return this.shipsToPlace.length == 0;
    }

    determineShipTiles(tile) {
        if(tile == null || !this.board.tiles.includes(tile)) {
            this.nextShip?.setPlacement(null);
            return;
        }
        this.nextShip?.setPlacement(this.board.getTilesInLine(tile, this.shipAlignment, this.nextShip.size));
        this.nextShip?.highlight(this.canPlaceShip ? 'rgba(0, 255, 0, 0.5)' : 'rgba(255, 0, 0, 0.5)');
    }

    placeShip() {
        if(this.canPlaceShip){
            this.nextShip.show(this.board, true);
            this.placedShips.push(this.shipsToPlace.shift());
        }
    }

    hideShips(){
        for(const ship of this.placedShips)
            ship.hide();
    }

    showShips(){
        for(const ship of this.placedShips)
            ship.show(this.board);
    }

    handleTileHit(tile) {
        if(!this.board.tiles.includes(tile)) return false;
        tile.disable();
        tile.color = 'steelblue';
        for(const ship of this.placedShips){
            if(ship.tiles.includes(tile)){
                ship.markHit(tile);
                if(ship.hasSunk){
                    this.destroyedShips.push(
                        this.placedShips.splice(this.placedShips.indexOf(ship), 1)[0]
                    );
                }
            }
        }
        return true;
    }

    get allShipsDestroyed() {
        return this.placedShips.length == 0;
    }
}

class Board {
    constructor(cols, rows) {
        const rowLabels = document.createElement('div');
        rowLabels.className = 'column cross-axis-end';
        rowLabels.style.marginRight = '5px';
        
        const colLabels = document.createElement('div');
        colLabels.className = 'row';

        const grid = document.createElement('div');
        grid.id = 'player-grid';
        grid.style.gridTemplateColumns = `repeat(${cols}, ${TILE_WIDTH}px)`;   
        grid.style.gridTemplateRows = `repeat(${rows}, ${TILE_HEIGHT}px)`;
        grid.style.position = 'relative';

        this.disabledTiles = new Array();

        this.tiles = new Array();
        for(let row = 0; row < rows; row++){
            const rowLabel = document.createElement('div');
            rowLabel.id = 'row-label';
            rowLabel.innerHTML = row + 1;
            rowLabels.appendChild(rowLabel);
            for(let col = 0; col < cols; col++){
                if(row == 0) {
                    const colLabel = document.createElement('div');
                    colLabel.id = 'col-label';
                    colLabel.innerHTML = COL_LABELS[col];
                    colLabels.appendChild(colLabel);
                }
                const tile = new Tile(col, row);
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

    getTilesInLine(startTile, alignment, length) {
        return this.tiles.filter(
            (tile) => {
                if(alignment == Alignment.vertical){
                    return (
                        tile.col == startTile.col &&
                        tile.row >= startTile.row &&
                        tile.row < startTile.row + length
                    )
                } else {
                    return (
                        tile.row == startTile.row &&
                        tile.col >= startTile.col &&
                        tile.col < startTile.col + length
                    )
                }
            }
        );
    }

    getNeighboringTiles(tile) {
        return this.tiles.filter((item) => {
            if (
                Math.abs(item.row - tile.row) <= 1 &&
                Math.abs(item.col - tile.col) <= 1
            ) {
                return true;
            }
            return false;
        })
    }

    highlightTile(tile) {
        if(!this.tiles.includes(tile)) return;
        tile.raise();
    }

    unhighlightTile(tile) {
        if(!this.tiles.includes(tile)) return;
        tile.reset();
    }

    set ontileclicked(func) {
        for(const tile of this.tiles)
            tile.onclick = () => func(tile);
    }

    set ontilemouseover(func) {
        for(const tile of this.tiles)
            tile.onmouseover = () => func(tile);
    }

    set ontilemouseleave(func) {
        for(const tile of this.tiles)
            tile.onmouseleave = () => func(tile);
    }
}

class Battleship {
    constructor(size, alignment) {
        this.size = size;
        this.tiles = new Array();
        this.hitTiles = new Array();
        this.alignment = alignment;
    }

    setPlacement(tiles) {
        this.unhighlight();
        if(tiles == null || tiles.length == 0){
            this.tiles = new Array();
        }
        else
            this.tiles = tiles;
    }

    highlight(color) {
        for(const tile of this.tiles) {
            tile.color = color;
            tile.html.style.animation = 'pulse 1000ms forwards';
            tile.html.style.animationIterationCount = 'infinite';
            tile.html.style.zIndex = '2';
        }
    }
    
    unhighlight() {
        for(const tile of this.tiles) {
            tile.reset();
        }
    }

    show(board, animation) {
        this.unhighlight();
        this.html = document.createElement('div');
        this.html.className = 'ship';
        if(animation) this.html.style.animationName = this.alignment == Alignment.vertical ? 'slideInV' : 'slideInH';
        this.html.style.top = `${this.tiles[0].row * TILE_HEIGHT}px`;
        this.html.style.left = `${this.tiles[0].col * TILE_WIDTH}px`;
        this.html.style.width = `${this.alignment == Alignment.vertical ? TILE_WIDTH : this.size * TILE_WIDTH}px`;
        this.html.style.height = `${this.alignment != Alignment.vertical ? TILE_HEIGHT : this.size * TILE_HEIGHT}px`;
        this.html.style.backgroundColor = 'black';

        const grid = board.html.lastChild;
        grid.appendChild(this.html);
    }

    hide() {
        this.html.remove();
    }

    markHit(tile) {
        tile.color = 'red';
        this.hitTiles.push(tile);
    }

    get hasSunk() {
        return this.tiles.length == this.hitTiles.length;
    }
}

class Tile {
    constructor(col, row) {
        this.html = document.createElement('div');
        this.html.className = 'tile';
        this.col = col;
        this.row = row;

        this.html.addEventListener("animationstart", (evt) => {
            if (evt.animationName !== "pulse") return;
            const animation = evt.target.getAnimations().find((anim) => anim.animationName === 'pulse');
            if(animation != undefined && animation != null) animation.startTime = 1;
            
        });
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

    raise() {
        this.color = 'lightgrey';
        this.html.style.animation = 'bounce 500ms forwards';
    }

    reset() {
        this.html.removeAttribute('style');
    }

    disable() {
        this.onclick = null;
        this.onmouseover = null;
        this.onmouseleave = null;
        this.reset();
    }
}

const Alignment = {
    vertical: 0,
    horizontal: 1,
};

document.addEventListener(
    'DOMContentLoaded',
     () => {
        const game = new Game();
        game.run();
     }
);