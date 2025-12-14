import { useState } from 'react'
import './App.css'

function App() {
  const [currentCell, setCurrentCell] = useState(504)
  const [showMinimap, setShowMinimap] = useState(false)
  const [season, setSeason] = useState('summer')

  const seasons = [
    { id: 'summer', name: 'Лето', folder: 'original_images', suffix: 'l11sd2' },
    { id: 'winter1', name: 'Зима 1', folder: 'zima1', suffix: 'l11sd2' },
    { id: 'winter2', name: 'Зима 2', folder: 'zima2', suffix: 'l11sd2' },
    { id: 'winter3', name: 'Зима 3', folder: 'original_images', suffix: 'l11sd4' },
    { id: 'winter4', name: 'Зима 4', folder: 'original_images', suffix: 'l11sd5' },
    { id: 'winter5', name: 'Зима 5', folder: 'original_images', suffix: 'l11sd6' }
  ]

  const currentSeason = seasons.find(s => s.id === season) || seasons[0]

  // Определяем источник миникарты в зависимости от сезона
  const minimapSrc = season === 'winter1' ? '/mini_maps/1.png' : '/mini_maps/map11.jpg'

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
                          backgroundImage: `url(/${currentSeason.folder}/${cellId}_${currentSeason.suffix}.jpg)`
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

      <div className="season-selector">
        {seasons.map((s) => (
          <button
            key={s.id}
            className={`season-button ${season === s.id ? 'active' : ''}`}
            onClick={() => setSeason(s.id)}
          >
            {s.name}
          </button>
        ))}
      </div>

      <div className="minimap-button-container">
        <button
          className="minimap-button"
          onClick={() => setShowMinimap(!showMinimap)}
        >
          Миникарта
        </button>
      </div>

      {showMinimap && (
        <div className="minimap-overlay" onClick={() => setShowMinimap(false)}>
          <div className="minimap-content" onClick={(e) => e.stopPropagation()}>
            <img src={minimapSrc} alt="Миникарта" />
            <button
              className="close-button"
              onClick={() => setShowMinimap(false)}
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
