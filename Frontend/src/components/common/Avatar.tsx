interface AvatarProps {
  username?: string
  src?: string
  size?: number
  className?: string
}

const AVATAR_COLORS: string[] = [
  'bg-red-500',
  'bg-orange-500',
  'bg-amber-500',
  'bg-yellow-500',
  'bg-lime-500',
  'bg-green-500',
  'bg-emerald-500',
  'bg-teal-500',
  'bg-cyan-500',
  'bg-sky-500',
  'bg-indigo-500',
  'bg-violet-500',
  'bg-purple-500',
  'bg-fuchsia-500',
  'bg-pink-500',
  'bg-rose-500',
]

export default function Avatar({ username, src, size = 40, className = '' }: AvatarProps) {
  const initial = username ? username.charAt(0).toUpperCase() : '?'
  const colorClass = AVATAR_COLORS[initial.charCodeAt(0) % AVATAR_COLORS.length]

  return (
    <div
      className={`inline-flex items-center justify-center rounded-full text-white font-bold select-none ${colorClass} ${className}`}
      style={{ width: size, height: size, fontSize: size * 0.4 }}
      title={username}
    >
      {src ? (
        <img
          src={src}
          alt={username}
          className="w-full h-full rounded-full object-cover"
          referrerPolicy="no-referrer"
        />
      ) : (
        initial
      )}
    </div>
  )
}