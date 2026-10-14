import { useId } from 'react'
import clsx from 'clsx'

type AvatarProps = {
  variant?: 'male' | 'female'
  className?: string
}

const STROKE = '#4a90d9'
const HAIR = '#b3dbf7'

export default function Avatar({ variant = 'male', className }: AvatarProps) {
  const clipId = useId()

  return (
    <svg viewBox="0 0 48 48" className={clsx('shrink-0', className)} aria-hidden="true">
      <clipPath id={clipId}>
        <circle cx="24" cy="24" r="22.5" />
      </clipPath>
      <circle cx="24" cy="24" r="22.5" fill="#e3f1fd" />
      <g clipPath={`url(#${clipId})`} stroke={STROKE} strokeWidth="1.4" strokeLinejoin="round" strokeLinecap="round">
        {variant === 'female' ? (
          <path
            d="M12.5 31c-1.5-3-.5-6.5-.5-10.5C12 14 17 10 24 10s12 4 12 10.5c0 4 1 7.5-.5 10.5-1 2-3.5 2.5-5.5 2.5H18c-2 0-4.5-.5-5.5-2.5z"
            fill={HAIR}
          />
        ) : (
          <path d="M15.5 26c-1.5-2-2-4.5-1.5-7.5 1-5 5-8.5 10-8.5s9 3.5 10 8c.5 2.5 0 5.5-1.5 8z" fill={HAIR} />
        )}
        <path d="M10 46c2-6 7-9.5 14-9.5s12 3.5 14 9.5" fill="#fff" />
        <path d="M17 21c3-1 6-3.5 7.5-6 1.5 3 4.5 5 6.5 5.5V27c0 4.5-3.2 8-7 8s-7-3.5-7-8z" fill="#fff" />
      </g>
      <circle cx="24" cy="24" r="22.5" fill="none" stroke={STROKE} strokeWidth="1.5" />
    </svg>
  )
}
