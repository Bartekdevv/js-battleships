const COLS = 10
const ROWS = 10
const COLS_LABELS = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j']
const TILE_WIDTH = 45
const TILE_HEIGHT = 45

const GameState = {
    initial: 0,
    preparation: 1,
    battle: 2,
}

class Game {
    constructor() {
        this.players = [new Player(0), new Player(1)]
        this.currentPlayer = this.players[0]
        this.state = GameState.initial
        this.lastHover = null

        let boards = document.getElementsByClassName('game-board')
        let colLabels = document.getElementsByClassName('col-labels')
        let rowLabels = document.getElementsByClassName('row-labels')

        for(var i = 0; i < boards.length; i++) {
            boards[i].style.width = COLS * TILE_WIDTH + 'px'
            boards[i].style.height = ROWS * TILE_HEIGHT + 'px'
            boards[i].style.cursor = 'pointer'
            
            for(var j = 0; j < ROWS; j++) {
                var rowLabel = document.createElement('div')
                rowLabel.innerHTML = j + 1
                rowLabel.style.lineHeight = TILE_HEIGHT + 'px'
                rowLabel.style.height = TILE_HEIGHT + 'px'
                rowLabels[i].appendChild(rowLabel)
                var colLabel = document.createElement('div')
                colLabel.innerHTML = COLS_LABELS[j]
                colLabel.style.textAlign = 'end'
                colLabel.style.width = TILE_WIDTH + 'px'
                colLabels[i].appendChild(colLabel)
                for(var k = 0; k < COLS; k++) {
                    var tile = document.createElement('div')
                    tile.id = i + '-' + k + '-' + j
                    tile.classList += 'tile'
                    tile.onmouseover = (event) => this.onTileMouseOver(event)
                    tile.onmouseleave = (event) => this.onTileMouseLeave(event)
                    tile.onclick = (event) => this.onTileClicked(event)
                    tile.style.top = j * TILE_HEIGHT + 'px'
                    tile.style.left = k * TILE_WIDTH + 'px'
                    tile.style.height = TILE_HEIGHT + 'px'
                    tile.style.width = TILE_WIDTH + 'px'
                    boards[i].appendChild(tile)
                }
            }
        }
    }

    updateState(state) {
        if(this.state == state) return
        this.state = state
    }

    onTileMouseOver(event) {
        if(GameState.initial) return;
        let id = event.target.id.split('-')
        if(Number(id[0]) != this.currentPlayer.boardIndex) return
        this.clearShipPlacementPreview()
        this.lastHover = event.target
        let column = Number(id[1])
        let row = Number(id[2])
        let isVertical =  this.currentPlayer.shipAlignment == Alignment.vertical
        let startIndex = isVertical ? row : column
        let endIndex = startIndex + this.currentPlayer.shipsToPlace[0]
        for(var i = startIndex; i < endIndex; i++) {
            let tile = null;
            tile = document.getElementById(currentPlayerIndex + '-' + column + '-' + row)
            if(tile != null) {
                let backgroundColor = endIndex <= (isVertical ? ROWS : COLS) ? 'lightgreen' : 'red'
                tile.style.backgroundColor = backgroundColor;
            }
            this.currentPlayer.shipAlignment == Alignment.vertical ? row++ : column++
        }
    }

    onTileMouseLeave() {
        let tiles = document.getElementsByClassName('tile')
        for(var i = 0; i < tiles.length; i++)
            tiles[i].style.backgroundColor = 'transparent'
        this.lastHover = null
    }

    toggleShipRotation (event) {
        if(event.key != 'r' || this.state != GameState.preparation) return
        let nextShipAlignment = this.currentPlayer.shipsToPlace[0].alignment
        this.currentPlayer.shipsToPlace[0].alignment = nextShipAlignment == Alignment.vertical ? Alignment.horizontal : Alignment.vertical
        this.lastHover?.dispatchEvent(new CustomEvent('mouseover', {target: this.lastHover}))
    }

    placeShip(event) {
        console.log(event)
        if(this.state == GameState.initial) return
        this.state = this.allShipsPlaced() ? GameState.battle : GameState.preparation
        if(this.state == GameState.preparation) {
            if(this.currentPlayer.hasFinishedPlacing()) {
                this.currentPlayer = this.currentPlayer == this.players[0] ? this.players[1] : this.players[0]
            }
            this.currentPlayer.placeNextShipOn(tile)
        }
        else if(this.state == GameState.battle) {
        }
        this.lastHover?.dispatchEvent(new CustomEvent('mouseover', {target: this.lastHover}))
    }
}

class Player {
    constructor(boardIndex) {
        this.boardIndex = boardIndex
        this.shipsToPlace = [
            new Battleship(5),
            new Battleship(4),
            new Battleship(4),
            new Battleship(3),
            new Battleship(3),
            new Battleship(3),
            new Battleship(2),
            new Battleship(2),
            new Battleship(2),
            new Battleship(2),
        ]
        this.shipsPlaced = []
    }

    hasFinishedPlacing() {
        return this.shipsToPlace.length == 0
    }

    placeNextShipOn(startTile) {
        this.shipsPlaced.push(this.shipsToPlace.shift())
    }
}

class Battleship {
    constructor(size, alignment = Alignment.vertical) {
        this.size = size
        this.alignment = alignment
    }
}

const Alignment = {
    vertical: 0,
    horizontal: 1,
}

document.addEventListener('DOMContentLoaded', (_) => {
        let game = new Game()
        document.getElementById('start-button').addEventListener('click', () => game.updateState(GameState.preparation))
    }
);