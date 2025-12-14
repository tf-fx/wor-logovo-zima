import { useState } from 'react'
import './App.css'

function App() {
  const [currentCell, setCurrentCell] = useState(504)

  // Определяем структуру карты - какие клетки видимы в виде 7x5 сетки
  const getVisibleCells = (centerCell) => {
    const row = Math.floor(centerCell / 33)
    const col = centerCell % 33

    const cells = []
    for (let r = row - 2; r <= row + 2; r++) {
      const rowCells = []
      for (let c = col - 3; c <= col + 3; c++) {
        const cellId = r * 33 + c
        rowCells.push(cellId)
      }
      cells.push(rowCells)
    }
    return cells
  }

  const visibleCells = getVisibleCells(currentCell)

  const handleCellClick = (cellId) => {
    // Проверяем, что клетка соседняя (можно двигаться только на 1 клетку)
    const currentRow = Math.floor(currentCell / 33)
    const currentCol = currentCell % 33
    const targetRow = Math.floor(cellId / 33)
    const targetCol = cellId % 33

    const rowDiff = Math.abs(targetRow - currentRow)
    const colDiff = Math.abs(targetCol - currentCol)

    if ((rowDiff <= 1 && colDiff <= 1) && !(rowDiff === 0 && colDiff === 0)) {
      setCurrentCell(cellId)
    }
  }

  return (
    <div className="game-container">
      <div className="header">
        <h1>WoR: Заброшенное логово</h1>
      </div>

      <div className="map-container">
        <table className="map-table">
          <tbody>
            {visibleCells.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {row.map((cellId) => {
                  const isCurrentCell = cellId === currentCell
                  return (
                    <td
                      key={cellId}
                      className={isCurrentCell ? 'current-cell' : ''}
                      onClick={() => handleCellClick(cellId)}
                    >
                      <div
                        className="cell"
                        style={{
                          backgroundImage: `url(/original_images/${cellId}_l11sd2.jpg)`
                        }}
                      >
                        {isCurrentCell && (
                          <div className="player-marker"></div>
                        )}
                      </div>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="info">
        <p>Текущая позиция: {currentCell}</p>
      </div>
    </div>
  )
}

export default App
