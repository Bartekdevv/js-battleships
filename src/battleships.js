const COLS = 10
const ROWS = 10
const COLS_LABELS = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j']
const TILE_WIDTH = 50
const TILE_HEIGHT = 50

class Game {
    constructor() {
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
                    tile.addEventListener('click', (event) => this.#onTileClick(event.target))
                    tile.style.position = 'absolute'
                    tile.style.top = j * TILE_HEIGHT + 'px'
                    tile.style.left = k * TILE_WIDTH + 'px'
                    tile.style.height = TILE_HEIGHT + 'px'
                    tile.style.width = TILE_WIDTH + 'px'
                    tile.style.border = '1px solid grey'
                    boards[i].appendChild(tile)
                }
            }
        }
    }

    #onTileClick(tile) {
        tile.style.backgroundColor = 'darkgrey'
    }

    run() {}
}

document.addEventListener('DOMContentLoaded', (_) => {
        let game = new Game()
        game.run()
    }
);