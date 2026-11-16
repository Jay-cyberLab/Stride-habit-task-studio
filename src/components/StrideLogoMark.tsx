interface StrideLogoMarkProps {
  size?: 'sm' | 'md';
}

export function StrideLogoMark({ size = 'sm' }: StrideLogoMarkProps) {
  const boxClass = size === 'md' ? 'h-10 w-10 rounded-xl' : 'h-8 w-8 rounded-lg';
  const svgClass = size === 'md' ? 'h-6 w-6' : 'h-5 w-5';

  return (
    <span
      className={`flex shrink-0 items-center justify-center bg-cta text-cta-fg shadow-xs ${boxClass}`}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 32 32"
        className={svgClass}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M23.5 7.5H13.2C10.3 7.5 8.2 9.2 8.2 11.7C8.2 14.3 10.3 15.6 13.7 16L18.4 16.5"
          stroke="currentColor"
          strokeWidth="3.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M13.5 16L18.8 16.5C22 16.9 23.8 18.2 23.8 20.6C23.8 23.1 21.6 24.7 18.6 24.7H8.5"
          stroke="var(--accent)"
          strokeWidth="3.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}
