import { useAppThemeAndColorModeContext } from '@/hooks/useAppThemeAndColorMode';

export const LogoShortIcon: React.FC<{ id?: string; width?: number; height?: number }> = ({
  id,
  width = 80,
  height = 145,
}: {
  id?: string;
  width?: number;
  height?: number;
}) => {
  const theme = useAppThemeAndColorModeContext();
  const fill = theme.logoFill;

  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 80 145"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient
          id={id ? `${id}_bottle_gradient` : 'bottleGradient'}
          x1="0%"
          y1="0%"
          x2="0%"
          y2="100%"
        >
          <stop offset="0%" stopColor="#1a1a1a" stopOpacity="1" />
          <stop offset="100%" stopColor="#000000" stopOpacity="1" />
        </linearGradient>
      </defs>

      {/* Bottle Body */}
      <path
        d="M 25 50 L 23 125 Q 23 135 30 135 L 50 135 Q 57 135 57 125 L 55 50 Z"
        fill={`url(#${id ? `${id}_bottle_gradient` : 'bottleGradient'})`}
      />

      {/* Bottle Neck */}
      <rect x="32" y="25" width="16" height="27" fill="#1a1a1a" rx="2" />

      {/* Bottle Cap */}
      <ellipse cx="40" cy="25" rx="10" ry="4" fill="#2a2a2a" />
      <ellipse cx="40" cy="22" rx="10" ry="3" fill="#3a3a3a" />

      {/* Highlight */}
      <ellipse cx="30" cy="75" rx="5" ry="20" fill="#ffffff" opacity="0.25" />

      {/* Blue Accent Label */}
      <rect x="27" y="85" width="26" height="20" fill="#3b82f6" opacity="0.2" rx="2" />
    </svg>
  );
};
