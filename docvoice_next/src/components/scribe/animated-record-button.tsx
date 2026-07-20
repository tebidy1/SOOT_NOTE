'use client';

interface AnimatedRecordButtonProps {
  isRecording: boolean;
  onClick: () => void;
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
}

const sizeClasses = {
  small: 'w-12 h-12',
  medium: 'w-20 h-20',
  large: 'w-32 h-32',
};

const iconSizes = {
  small: 'w-6 h-6',
  medium: 'w-10 h-10',
  large: 'w-16 h-16',
};

const pulseSize = {
  small: 'w-16 h-16',
  medium: 'w-28 h-28',
  large: 'w-40 h-40',
};

export function AnimatedRecordButton({
  isRecording,
  onClick,
  size = 'medium',
  disabled = false,
}: AnimatedRecordButtonProps) {
  return (
    <div className="relative flex items-center justify-center">
      {isRecording && (
        <>
          <div className={`absolute ${pulseSize[size]} bg-red-500/20 rounded-full animate-ping`} />
          <div className={`absolute ${pulseSize[size]} bg-red-500/10 rounded-full animate-pulse`} />
        </>
      )}

      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className={`
          ${sizeClasses[size]}
          rounded-full flex items-center justify-center
          focus:outline-none focus:ring-4 focus:ring-red-300
          transition-all duration-200 ease-in-out
          relative z-10
          ${isRecording
            ? 'bg-red-600 hover:bg-red-700 shadow-lg shadow-red-500/30'
            : 'bg-gradient-to-r from-blue-600 to-teal-500 hover:from-blue-700 hover:to-teal-600 shadow-lg shadow-blue-500/30'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105 active:scale-95'}
        `}
      >
        <div className="relative">
          {isRecording ? (
            <div className="flex items-center justify-center">
              <div className="w-4 h-4 bg-white rounded-sm" />
            </div>
          ) : (
            <svg className={`${iconSizes[size]} text-white`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
              />
            </svg>
          )}

          {!isRecording && (
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-white rounded-full border-2 border-blue-600" />
          )}
        </div>
      </button>

      {isRecording && (
        <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2">
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="w-1 h-4 bg-red-500 rounded-full animate-wave"
                style={{ animationDelay: `${i * 0.1}s`, animationDuration: '1s' }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default AnimatedRecordButton;
