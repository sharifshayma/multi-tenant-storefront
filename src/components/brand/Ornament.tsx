export function Ornament({ size, color }: { size: number; color: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      <polygon
        points="8,20 8,80 50,50"
        stroke={color}
        strokeWidth={6}
        strokeLinejoin="round"
        fill="none"
      />
      <polygon
        points="92,20 92,80 50,50"
        stroke={color}
        strokeWidth={6}
        strokeLinejoin="round"
        fill="none"
      />
      <path d="M50,40 L60,50 L50,60 L40,50 Z" fill={color} />
      <path d="M8,12 L14,20 L8,28 L2,20 Z" fill={color} />
      <path d="M8,72 L14,80 L8,88 L2,80 Z" fill={color} />
      <path d="M92,12 L98,20 L92,28 L86,20 Z" fill={color} />
      <path d="M92,72 L98,80 L92,88 L86,80 Z" fill={color} />
    </svg>
  );
}
