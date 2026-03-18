import { useState, useCallback } from 'react'

const BOARD_SIZE = 19

interface GoStone {
  color: 'black' | 'white' | null
}

const createEmptyBoard = (): GoStone[][] => {
  return Array(BOARD_SIZE).fill(null).map(() =>
    Array(BOARD_SIZE).fill({ color: null })
  )
}

function App() {
  const [board, setBoard] = useState(createEmptyBoard())
  const [currentPlayer, setCurrentPlayer] = useState<'black' | 'white'>('black')
  const [captured, setCaptured] = useState({ black: 0, white: 0 })
  const [message, setMessage] = useState('')
  const [passes, setPasses] = useState(0)

  const countLiberties = useCallback((
    board: GoStone[][],
    x: number,
    y: number,
    color: 'black' | 'white',
    visited: Set<string>
  ): number => {
    if (x < 0 || x >= BOARD_SIZE || y < 0 || y >= BOARD_SIZE) return 0
    const key = `${x},${y}`
    if (visited.has(key)) return 0
    visited.add(key)
    const stone = board[y][x]
    if (stone.color === null) return 1
    if (stone.color !== color) return 0
    let liberties = 0
    liberties += countLiberties(board, x - 1, y, color, visited)
    liberties += countLiberties(board, x + 1, y, color, visited)
    liberties += countLiberties(board, x, y - 1, color, visited)
    liberties += countLiberties(board, x, y + 1, color, visited)
    return liberties
  }, [])

  const removeCapturedStones = useCallback((
    board: GoStone[][],
    x: number,
    y: number,
    opponentColor: 'black' | 'white'
  ): { newBoard: GoStone[][], capturedCount: number } => {
    const newBoard = board.map(row => row.map(stone => ({ ...stone })))
    const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]]
    let capturedCount = 0
    for (const [dx, dy] of directions) {
      const nx = x + dx
      const ny = y + dy
      if (nx < 0 || nx >= BOARD_SIZE || ny < 0 || ny >= BOARD_SIZE) continue
      if (newBoard[ny][nx].color !== opponentColor) continue
      const visited = new Set<string>()
      const group: [number, number][] = []
      const stack: [number, number][] = [[nx, ny]]
      while (stack.length > 0) {
        const [cx, cy] = stack.pop()!
        const key = `${cx},${cy}`
        if (visited.has(key)) continue
        visited.add(key)
        if (newBoard[cy][cx].color !== opponentColor) continue
        group.push([cx, cy])
        stack.push([cx - 1, cy], [cx + 1, cy], [cx, cy - 1], [cx, cy + 1])
      }
      const groupVisited = new Set<string>()
      if (countLiberties(newBoard, nx, ny, opponentColor, groupVisited) === 0) {
        for (const [gx, gy] of group) {
          newBoard[gy][gx] = { color: null }
          capturedCount++
        }
      }
    }
    return { newBoard, capturedCount }
  }, [countLiberties])

  const handleStoneClick = (x: number, y: number) => {
    if (board[y][x].color !== null) {
      setMessage('그 자리에 이미 돌이 있습니다.')
      return
    }
    const newBoard = board.map(row => row.map(stone => ({ ...stone })))
    newBoard[y][x] = { color: currentPlayer }
    const opponent = currentPlayer === 'black' ? 'white' : 'black'
    const { newBoard: boardAfterCapture, capturedCount } = removeCapturedStones(
      newBoard, x, y, opponent
    )
    const visited = new Set<string>()
    const selfLiberties = countLiberties(boardAfterCapture, x, y, currentPlayer, visited)
    if (selfLiberties === 0 && capturedCount === 0) {
      setMessage('자살수는 둘 수 없습니다.')
      return
    }
    setBoard(boardAfterCapture)
    setCaptured(prev => ({ ...prev, [opponent]: prev[opponent] + capturedCount }))
    setCurrentPlayer(opponent)
    setMessage(`${capturedCount > 0 ? `${capturedCount}개의 돌을 잡았습니다! ` : ''}${opponent === 'black' ? '검은' : '흰'} 차례입니다.`)
    setPasses(0)
  }

  const handlePass = () => {
    const newPasses = passes + 1
    if (newPasses >= 2) {
      setMessage('게임이 끝났습니다! 점수를 확인하세요.')
      return
    }
    setPasses(newPasses)
    const nextPlayer = currentPlayer === 'black' ? 'white' : 'black'
    setCurrentPlayer(nextPlayer)
    setMessage(`${currentPlayer === 'black' ? '검은' : '흰'} 돌이 패스했습니다. ${nextPlayer === 'black' ? '검은' : '흰'} 차례입니다.`)
  }

  return (
    <div className="app">
      <h1>Go Master: Baduk Academy</h1>
      <div className="status">{currentPlayer === 'black' ? '검은' : '흰'} 차례</div>
      <div className="captures">
        <span>검은 돌 잡음: {captured.white}</span>
        <span>흰 돌 잡음: {captured.black}</span>
      </div>
      <div className="message">{message || '게임을 시작하세요!'}</div>
      <div className="board">
        {board.map((row, y) => (
          <div key={y} className="row">
            {row.map((stone, x) => (
              <div
                key={x}
                className={`cell ${stone.color || ''}`}
                onClick={() => handleStoneClick(x, y)}
              />
            ))}
          </div>
        ))}
      </div>
      <div className="controls">
        <button onClick={handlePass}>패스</button>
        <button onClick={() => {
          setBoard(createEmptyBoard())
          setCurrentPlayer('black')
          setCaptured({ black: 0, white: 0 })
          setMessage('새 게임을 시작합니다!')
          setPasses(0)
        }} className="new-game-btn">새 게임</button>
      </div>
    </div>
  )
}

export default App
