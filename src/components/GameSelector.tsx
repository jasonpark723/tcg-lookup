import { CATEGORY_POKEMON_JP, CATEGORY_ONE_PIECE } from '../lib/api'

interface GameSelectorProps {
  selectedCategoryId: number
  onChange: (categoryId: number) => void
}

const GAMES = [
  { id: CATEGORY_POKEMON_JP, name: 'Pokemon JP' },
  { id: CATEGORY_ONE_PIECE, name: 'One Piece' },
]

export function GameSelector({ selectedCategoryId, onChange }: GameSelectorProps) {
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange(Number(e.target.value))
  }

  return (
    <div className="w-full max-w-md">
      <select
        value={selectedCategoryId}
        onChange={handleChange}
        className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
      >
        {GAMES.map(game => (
          <option key={game.id} value={game.id}>
            {game.name}
          </option>
        ))}
      </select>
    </div>
  )
}
