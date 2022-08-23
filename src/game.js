var container = document.getElementById('game') 
var set3D = document.getElementById('set3D')

set3D.addEventListener("input", (ev) => {
    set3D.checked ? container.classList.add("is3d") : container.classList.remove("is3d")
})

var round = (value, step) => {
    step || (step = 1.0);
    var inv = 1.0 / step;
    return Math.round(value * inv) / inv;
}

/**
 * This is to have a clean board, the board data (array) is nested in this class.
 */
class CellManager {

    /**
     * Game configuration
     * @param {Object} settings 
     * @param {number} settings.rows Default is `11`
     * @param {number} settings.cellsPerRow Default is `11`
     * @param {number} settings.mineDensity Default is `5`
     */
    constructor(settings){
        this.rows = settings.rows ? settings.rows : 11
        this.cellsPerRow = settings.cellsPerRow ? settings.cellsPerRow : 11
        this.mineDensity = settings.mineDensity ? settings.mineDensity : 5
    }

    /**
     * Array of cells, all cells are added in here.
     */
    cells = []

    clearBoard = () => {
        this.cells = []
        container.innerHTML = ""
        return this.cells
    }

    getCell = (x,y) => {
        let search = this.cells.find(c => c.x === x && c.y === y)
        return search ? search : null
    }

    getAdjacentCells = (x,y) => {
        let result = []
        let cx = x
        let cy = y
        let calculations = [
            {x: cx - 0.5, y: cy - 1}, //top left (offset)
            {x: cx - 1, y: cy - 1}, //top left (inline)
            {x: cx + 0.5, y: cy - 1}, //top right (offset)
            {x: cx + 1, y: cy - 1}, //top right (inline)
            {x: cx - 0.5, y: cy}, //left (offset)
            {x: cx - 1, y: cy}, //left (inline)
            {x: cx + 0.5, y: cy}, //right (offset)
            {x: cx + 1, y: cy}, //right (inline)
            {x: cx - 0.5, y: cy + 1}, //bottom left (offset)
            {x: cx - 1, y: cy + 1}, //bottom left (inline)
            {x: cx + 0.5, y: cy + 1}, //bottom right (offset)
            {x: cx + 1, y: cy + 1} //bottom right (inline)
        ]

        for (const calc of calculations){
            let satisifiedCell = this.getCell(calc.x, calc.y)
            if (satisifiedCell){
                result.push(satisifiedCell)
            }
        }
        return result
    }

    /**
     * @param {Object} cellData New cell data
     * @param {number} cellData.x X pos, starts from 0
     * @param {number} cellData.y Y pos, starts from 0
     * @param {string} cellData.type Cell type, one of;
     * - bomb
     * - empty
     * - type1
     * - type2
     * - type3
     * - type4
     * - type5
     * - type6
     * - flag
     * @param {boolean} cellData.opened Whether the cell is opened
     * @param {HTMLDivElement} cellData.html The HTML element of the cell
     * @param {boolean} cellData.isOffset Whether it's an offsetted cell, half a X pos are applied.
     */
    add = (cellData) => {
        if (typeof cellData == "object"){
            this.cells.push(cellData)
        }else{
            throw "cellData must be type object"
        }
    }

    generateBoard = async () => {
        for (let row = 0; row < this.rows; row++){
            let rowHTML = document.createElement("row")
            let divider = document.createElement("br")
            container.append(rowHTML)
            container.append(divider)
            for (let cell = 0; cell < this.cellsPerRow; cell++){
                let isOffset = (row % 2 !== 0)
                let xPos = isOffset ? cell + 0.5 : cell
                let cellHTML = document.createElement("div")
                let obj = {x: xPos, y: row, type: null, opened: false, html: cellHTML, isOffset}
                this.add(obj)
                rowHTML.appendChild(cellHTML)
                cellHTML.addEventListener("click", (ev) => {
                    onClick(obj, ev.shiftKey)
                })
            }
        }
        return this.cells
    }

    generateMines = async () => {
        for (let mineCount = 0; mineCount < this.mineDensity; mineCount++){
            let randomPos = {x: round(Math.random() * this.rows, 0.5), y: Math.floor(Math.random() * this.cellsPerRow)}
            let wantedCell = this.getCell(randomPos.x, randomPos.y)
            if (wantedCell && wantedCell.type == null){
                wantedCell.type = "bomb"
                wantedCell.html.classList.add("bomb")
            }
            if (wantedCell == null) mineCount--
        }
    }

    generateNumbers = async () => {
        let mines = this.cells.filter(c => c.type == "bomb")
        for (const mine of mines){
            let surroundingCells = mine.adjacentCells
            for (const cell of surroundingCells){
                if (cell.type !== "bomb"){
                let touchingMines = cell.adjacentCells.filter(t => t.type == "bomb")
                cell.html.classList.add(`type${touchingMines.length}`)
                cell.type = touchingMines.length > 0 ? `type${touchingMines.length}` : 'empty'
                }
            }
        }
    }

    generateEmptyCells = async ()  => {
        let nullCells = this.cells.filter(c => c.type == null)
        for (const cell of nullCells){
            cell.type = "empty"
        }
    }

    setAdjacentCells = async () => {
        for (const cell of this.cells){
            cell.adjacentCells = this.getAdjacentCells(cell.x, cell.y, cell.isOffset)
        }
    }
}

/**
 * 
 * @param {any} cell The cell
 * @param {boolean} shiftKey Whether the shift key was pressed
 */
var onClick = (cell, shiftKey) => {
    if (cell.opened == false){
        switch (cell.type){
            case "bomb":
                console.log("bomb pressed")
            default:
                return null
        }
    }
}

var board = new CellManager({rows: 20, cellsPerRow: 20, mineDensity: 30})

board.generateBoard().then(async () => {
    await board.setAdjacentCells().then(async () => {
        await board.generateMines().then(async d => {
            await board.generateNumbers()
            await board.generateEmptyCells()
            board.cells.forEach((cell) => {
                cell.html.title = `x: ${cell.x}\ny: ${cell.y}\nType: ${cell.type}`
            })
        })
    })
})


console.log(board.cells)
