import { useState, useCallback, useMemo } from 'react'

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

  const styles = useMemo(() => ({
    app: {
      minHeight: '100vh',
      padding: '20px',
      backgroundColor: '#f5f5f5',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
    },
    header: {
      fontSize: '28px',
      fontWeight: 'bold',
      marginBottom: '16px',
      color: '#1a1a1a',
    },
    status: {
      fontSize: '18px',
      marginBottom: '12px',
      color: '#444',
    },
    captures: {
      display: 'flex',
      gap: '24px',
      marginBottom: '12px',
      fontSize: '16px',
      color: '#555',
    },
    message: {
      fontSize: '16px',
      marginBottom: '16px',
      color: '#666',
      minHeight: '24px',
    },
    board: {
      display: 'grid',
      gridTemplateColumns: `repeat(${BOARD_SIZE}, 1fr)`,
      gap: '1px',
      backgroundColor: '#5c4033',
      padding: '4px',
      borderRadius: '4px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
      width: 'fit-content',
    },
    cell: {
      width: '24px',
      height: '24px',
      backgroundColor: '#dcb35c',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    },
    black: {
      width: '18px',
      height: '18px',
      borderRadius: '50%',
      backgroundColor: '#1a1a1a',
      boxShadow: 'inset -2px -2px 4px rgba(255,255,255,0.1)',
    },
    white: {
      width: '18px',
      height: '18px',
      borderRadius: '50%',
      backgroundColor: '#fafafa',
      boxShadow: 'inset -2px -2px 4px rgba(0,0,0,0.15), 1px 1px 2px rgba(0,0,0,0.1)',
    },
    controls: {
      display: 'flex',
      gap: '12px',
      marginTop: '20px',
    },
    button: {
      padding: '10px 24px',
      fontSize: '16px',
      border: 'none',
      borderRadius: '6px',
      cursor: 'pointer',
      fontWeight: '500',
      transition: 'all 0.2s',
    },
    passButton: {
      backgroundColor: '#666',
      color: 'white',
    },
    newGameButton: {
      backgroundColor: '#4a90d9',
      color: 'white',
    },
  }), [])

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
    <div style={styles.app}>
      <h1 style={styles.header}>Go Master: Baduk Academy</h1>
      <div style={styles.status}>{currentPlayer === 'black' ? '검은' : '흰'} 차례</div>
      <div style={styles.captures}>
        <span>검은 돌 잡음: {captured.white}</span>
        <span>흰 돌 잡음: {captured.black}</span>
      </div>
      <div style={styles.message}>{message || '게임을 시작하세요!'}</div>
      <div style={styles.board}>
        {board.map((row, y) => (
          <div key={y} style={{ display: 'contents' }}>
            {row.map((stone, x) => (
              <div
                key={`${x}-${y}`}
                style={{
                  ...styles.cell,
                  backgroundColor: ((x + y) % 2 === 0) ? '#c4a35a' : '#dcb35c',
                }}
                onClick={() => handleStoneClick(x, y)}
              >
                {stone.color && <div style={styles[stone.color]} />}
              </div>
            ))}
          </div>
        ))}
      </div>
      <div style={styles.controls}>
        <button onClick={handlePass} style={{ ...styles.button, ...styles.passButton }}>패스</button>
        <button
          onClick={() => {
            setBoard(createEmptyBoard())
            setCurrentPlayer('black')
            setCaptured({ black: 0, white: 0 })
            setMessage('새 게임을 시작합니다!')
            setPasses(0)
          }}
          style={{ ...styles.button, ...styles.newGameButton }}
        >새 게임</button>
      </div>
    </div>
  )
}

export default App
