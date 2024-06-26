const BOARD_SIZE = 10;
const TILE_SIZE = 45;
const COL_LABELS = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm',
                    'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z'];
const SHIP_SIZES = [5, 4, 3, 3, 2];

const GameState = {
    Initial: 'Initial',
    Preparation: 'Preparation',
    Battle: 'Battle',
    GameOver: 'GameOver'
};

const Alignment = {
    Vertical: 'Vertical',
    Horizontal: 'Horizontal'
};

class Game {
    init() {
        document.getElementById('player-container').innerHTML = '';
        document.getElementById('topbar').removeAttribute('style');

        this.players = new Array();
        for(let i = 1; i <= 2; i++){
            const player = new Player(`Player ${i}`, new Board(BOARD_SIZE));
            player.board.ontilemouseover = (tile) => this.handleTileMouseOver(tile);
            player.board.ontilemouseleave = (tile) => this.handleTileMouseLeave(tile);
            player.board.ontileclicked = (tile) => this.handleTileClick(tile);
            this.players.push(player);
        }

        this.inTurn = this.players[0];
        this.notInTurn = this.players[1];

        onkeydown = onkeyup = (event) => this.handleKeyEvents(event);
    }

    run() {
        this.setState(GameState.Initial);
    }
 
    setState(state) {
        if(this.state == state) return;
        switch(state) {
            case GameState.Initial:
                this.init();
                break;
            case GameState.Preparation:
                this.inTurn.updateUnplacedShips();
                this.showDialog('Ship Positioning Stage', `<h3>${this.inTurn.name} Turn</h3>`);
                break;
            case GameState.Battle:
                this.switchPlayers();
                this.showDialog('Battle Stage', `<h3>${this.inTurn.name} Turn</h3>`);
                break;
            case GameState.GameOver:
                const row = document.createElement('div');
                row.className = 'row';
                row.style.gap = '50px';

                for(const player of this.players){
                    const column = document.createElement('div');
                    column.className = 'column cross-axis-center';
                    column.innerHTML += `<h4>${player.name} ${player == this.inTurn ? '(Winner)' : ''}</h4>`;
                    column.innerHTML += `<p>Total attempts: ${player.totalAttempts}</p>`;
                    column.innerHTML += `<p>Successful Hits: ${player.successfulHits}</p>`;
                    column.innerHTML += `<p>Ships Destroyed: ${player.shipsDestroyed}</p>`;
                    column.innerHTML += `<p>Accuracy: ${(player.successfulHits / player.totalAttempts * 100).toFixed(2)}%</p>`;
                    row.appendChild(column);
                    player.showShips();
                }

                this.showDialog('Game Over!', row.outerHTML, null);
                break;
        }
        const stateBtn = document.getElementById('state-btn');
        stateBtn.innerHTML = state == GameState.Initial ? 'Start' : 'Reset';
        stateBtn.style.backgroundColor = state == GameState.Initial ? 'rgba(0, 255, 0, 0.5)' : 'rgba(255, 0, 0, 0.5)';
        stateBtn.onclick = () => this.setState(state == GameState.Initial ? GameState.Preparation : GameState.Initial);
        this.state = state;
    }
    
    showDialog(title, content, duration = 2000) {
        const dialog = document.createElement('dialog');
        
        dialog.className = 'column cross-axis-expand text-center';

        dialog.innerHTML += `<h2>${title}</h2>`;

        const divider = document.createElement('div');
        divider.className = 'horizontal-divider';

        dialog.appendChild(divider);
        dialog.innerHTML += content;
        
        if(!duration){
            dialog.appendChild(divider);
            dialog.innerHTML += '<h5> click anywhere to continue... </h5>';
        }

        document.body.appendChild(dialog);
        dialog.showModal();
        dialog.addEventListener(!duration ? 'click' : 'animationend', () => {
            setTimeout(() => {
                dialog.classList.add('hide');
                dialog.onanimationend = () => dialog.remove();
            }, duration);
        })
    }

    handleTileClick(tile) {
        switch(this.state){
            case GameState.Preparation:
                if(this.inTurn.allShipsPlaced) break;
                this.inTurn.placeShip();
                this.inTurn.updateUnplacedShips();
                this.handleTileMouseOver(tile);
                if(this.inTurn.allShipsPlaced) {
                    this.inTurn.placedShips[this.inTurn.placedShips.length - 1].html.addEventListener(
                        'animationend', 
                        () => {
                            this.inTurn.hideShips();
                            if(this.notInTurn.allShipsPlaced)
                                return this.setState(GameState.Battle);
                            this.switchPlayers();
                            this.inTurn.updateUnplacedShips();
                            this.showDialog('Ship Positioning Stage', `<h3>${this.inTurn.name} turn</h3>`);
                        }
                    )
                }
                break;
            case GameState.Battle:
                if(this.notInTurn.handleTileHit(tile)){
                    this.inTurn.totalAttempts++;
                    this.inTurn.successfulHits = this.notInTurn.hitTileCount;
                    this.inTurn.shipsDestroyed = this.notInTurn.destroyedShips.length;
                    if(this.notInTurn.allShipsDestroyed)
                        this.setState(GameState.GameOver);
                    else {
                        this.inTurn.hideShips();
                        this.switchPlayers();
                    }
                break;
            }
        }
    }

    handleTileMouseOver(tile) {
        switch(this.state){
            case GameState.Preparation:
                this.inTurn.determineShipPlacement(tile);
                break;
            case GameState.Battle:
                this.notInTurn.board.highlightTile(tile);
                break;
        }
    }

    handleTileMouseLeave(tile) {
        switch(this.state){
            case GameState.Preparation:
                this.inTurn.determineShipPlacement(null);
                break;
            case GameState.Battle:
                this.notInTurn.board.unhighlightTile(tile);
                break;
        }
    }

    switchPlayers() {
        let temp = this.notInTurn;
        this.notInTurn = this.inTurn;
        this.inTurn = temp;
    }

    handleKeyEvents(event) {
        switch(event.key) {
            case 'r':
                if(event.type == 'keydown' && this.state == GameState.Preparation)
                    this.inTurn.toggleShipAlignment();
                break;
            case 's':
                if(this.state == GameState.Battle)
                    if(event.type == 'keydown')
                        this.inTurn.showShips();
                    else 
                        this.inTurn.hideShips();
                break;
        }
    }
}

class Player {
    constructor(name, board) {
        this.board = board;

        this.html = document.createElement('div');
        this.html.className = 'column cross-axis-center';

        this.html.appendChild(document.createElement('h2'));
        this.html.childNodes[0].innerHTML = name;
        this.html.appendChild(this.board.html);
        const playerContainer = document.getElementById('player-container');
        playerContainer.appendChild(this.html);

        this.shipSizesToBePlaced = Array.from(SHIP_SIZES);
        this.shipAlignment = Alignment.Vertical;
        this.currentShipPlacement = new Array();
        this.placedShips = new Array();
        this.destroyedShips = new Array();

        this.totalAttempts = 0;
        this.successfulHits = 0;
        this.shipsDestroyed = 0;
    }

    get name() {
        return this.html.childNodes[0]?.innerHTML;
    }

    toggleShipAlignment() {
        this.shipAlignment = this.shipAlignment == Alignment.Vertical ? Alignment.Horizontal : Alignment.Vertical;;
        this.determineShipPlacement(this.currentShipPlacement[0]);
    }

    get nextShipSize() {
        return this.shipSizesToBePlaced[0];
    }

    get canPlaceShip() {
    if (!this.nextShipSize || this.currentShipPlacement.length < this.nextShipSize) return false;

    const neighbouringTilesSet = new Set();

    for (const ship of this.placedShips) {
        for (const tile of ship.tiles) {
            const neighbouringTiles = this.board.getNeighbouringTiles(tile);
            neighbouringTiles.forEach(t => neighbouringTilesSet.add(t));
        }
    }

    for (const tile of this.currentShipPlacement)
        if (neighbouringTilesSet.has(tile)) return false;

    return true;
    }

    get allShipsPlaced() {
        return this.shipSizesToBePlaced.length == 0;
    }

    determineShipPlacement(tile) {
        this.unhighlightPlacement();
        if(!tile || !this.board.tiles.includes(tile)) return this.currentShipPlacement = [];
        this.currentShipPlacement = this.board.getTilesInLine(tile, this.shipAlignment, this.nextShipSize);
        this.highlightPlacement(this.canPlaceShip ? 'rgba(0, 255, 0, 0.5)' : 'rgba(255, 0, 0, 0.5)');
    }
    
    placeShip() {
        if(this.canPlaceShip){
            this.unhighlightPlacement();
            let ship = new Battleship(this.currentShipPlacement, this.shipAlignment);
            ship.show(this.board, true);
            this.placedShips.push(ship);
            this.shipSizesToBePlaced.shift();
        }
    }

    hideShips(){
        for(const ship of this.placedShips.concat(this.destroyedShips))
            ship.hide();
    }

    showShips(){
        for(const ship of this.placedShips.concat(this.destroyedShips))
            ship.show(this.board, false);
    }

    handleTileHit(tile) {
        if(!this.board.tiles.includes(tile)) return false;
        tile.removeEvents();
        tile.resetStyle();
        tile.color = '#1ca9c9';
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
        tile.html.style.animation = 'rotateY180 500ms forwards';
        return true;
    }

    highlightPlacement(color){
        for(const tile of this.currentShipPlacement) {
            tile.color = color;
            tile.html.style.animation = 'pulse 1000ms forwards';
            tile.html.style.animationIterationCount = 'infinite';
            tile.html.style.zIndex = '2';
        }
    }

    unhighlightPlacement(){
        for(const tile of this.currentShipPlacement) {
            tile.resetStyle();
        }
    }

    get allShipsDestroyed() {
        return this.placedShips.length == 0;
    }

    get hitTileCount() {
        let count = 0;

        for(const ship of this.destroyedShips)
            count += ship.tiles.length;
        
        for(const ship of this.placedShips)
            count += ship.hitTiles.length;

        return count;
    }

    updateUnplacedShips() {
        const topbar = document.getElementById('topbar');
        const content = document.createElement('div');

        if(!this.nextShipSize)
            topbar.style.animation = 'topbarHide 500ms forwards';
        else 
            topbar.style.animation = 'topbarShow 500ms forwards';

        for(const size of this.shipSizesToBePlaced) {
            let img = document.createElement('img');
            img.style.height = `${size * TILE_SIZE}px`;
            img.style.width = `${TILE_SIZE}px`;
            img.style.paddingRight = img.style.height;
            img.style.transformOrigin = 'top left';
            img.style.transform = `rotateZ(90deg) translateY(-100%)`;
            img.src = `../assets/images/${size}.png`;
            content.appendChild(img);
        }
        topbar.innerHTML = content.innerHTML;
    }
}

class Board {
    constructor(size) {
        const rowLabels = document.createElement('div');
        rowLabels.className = 'column cross-axis-end';
        rowLabels.style.marginRight = '5px';

        const colLabels = document.createElement('div');
        colLabels.className = 'row';

        const grid = document.createElement('div');
        grid.className = 'player-grid';
        grid.style.gridTemplateColumns = `repeat(${size}, ${TILE_SIZE}px)`;   
        grid.style.gridTemplateRows = `repeat(${size}, ${TILE_SIZE}px)`;

        this.disabledTiles = new Array();
        this.tiles = new Array();
        for(let row = 0; row < size; row++){
            const rowLabel = document.createElement('div');
            rowLabel.id = 'row-label';
            rowLabel.innerHTML = row + 1;
            rowLabels.appendChild(rowLabel);
            for(let col = 0; col < size; col++){
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
                    if(alignment == Alignment.Vertical) 
                        return (
                            tile.col == startTile.col &&
                            tile.row >= startTile.row &&
                            tile.row < startTile.row + length
                        );
                    else 
                        return (
                            tile.row == startTile.row &&
                            tile.col >= startTile.col &&
                            tile.col < startTile.col + length
                        );
                }
            )
    }

    getNeighbouringTiles(tile) {
        return this.tiles.filter((item) => {
            if (
                Math.abs(item.row - tile.row) <= 1 &&
                Math.abs(item.col - tile.col) <= 1
            ) return true;
            return false;
        })
    }

    highlightTile(tile) {
        if(!this.tiles.includes(tile)) return;
        tile.highlight();
    }

    unhighlightTile(tile) {
        if(!this.tiles.includes(tile)) return;
        tile.resetStyle();
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
    constructor(tiles, alignment) {
        this.alignment = alignment,
        this.tiles = tiles,
        this.html = document.createElement('div');
        this.html.className = 'ship';
        this.html.style.top = `${this.tiles[0].row * TILE_SIZE}px`;
        this.html.style.left = `${this.tiles[0].col * TILE_SIZE}px`;
        this.html.style.width = `${this.alignment == Alignment.Vertical ? TILE_SIZE : this.size * TILE_SIZE}px`;
        this.html.style.height = `${this.alignment != Alignment.Vertical ? TILE_SIZE : this.size * TILE_SIZE}px`;

        let img = document.createElement('img');
		img.src = `../assets/images/${this.size}.png`;
        img.style.width = `${TILE_SIZE}px`;
        img.style.transformOrigin = 'top left';
        img.style.transform = alignment == Alignment.Horizontal ? `rotateZ(90deg)  translateY(-100%)` : '';

        this.html.appendChild(img);

        this.hitTiles = new Array();
    }

    get size() {
        return this.tiles.length;
    }

    show(board, animate) {
        const grid = board.html.lastChild;
        if(Array.from(grid.childNodes).includes(this.html)) return;
        this.html.style.animationName = '';
        if(animate) this.html.style.animationName = this.alignment == Alignment.Vertical ? 'slideInV' : 'slideInH';
        grid.appendChild(this.html);
    }

    hide() {
        this.html.remove();
    }

    markHit(tile) {
        tile.color = 'red';
        this.hitTiles.push(tile);
        if(this.hasSunk) this.html.style.backgroundColor = 'red';
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

        this.html.addEventListener('animationstart', (event) => {
            if (event.animationName !== 'pulse') return;
            const animation = event.target.getAnimations().find((anim) => anim.animationName === 'pulse');
            if(animation) animation.startTime = 1;
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

    highlight() {
        this.color = 'lightgrey';
        this.html.style.animation = 'bounce 500ms forwards';
    }

    resetStyle() {
        this.html.removeAttribute('style');
    }

    removeEvents() {
        this.onclick = null;
        this.onmouseover = null;
        this.onmouseleave = null;
    }
}

document.addEventListener(
    'DOMContentLoaded',
     () => {
        const game = new Game();
        game.run();
     }
);