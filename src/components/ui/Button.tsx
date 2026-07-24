import { ReactNode, ButtonHTMLAttributes, forwardRef } from 'react';
import { motion } from 'motion/react';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  isLoading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      className = '',
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyle =
      'inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-zinc-950 focus:ring-zinc-400 disabled:opacity-50 disabled:pointer-events-none cursor-pointer';

    const variants = {
      primary: 'bg-zinc-50 hover:bg-zinc-200 text-zinc-950 shadow-sm shadow-black/10',
      secondary: 'bg-zinc-900 hover:bg-zinc-800 text-zinc-100 border border-zinc-800',
      outline: 'bg-transparent hover:bg-zinc-900 text-zinc-300 border border-zinc-850 hover:text-zinc-100',
      danger: 'bg-red-600 hover:bg-red-500 text-white shadow-sm shadow-black/10',
      ghost: 'bg-transparent hover:bg-zinc-900 text-zinc-400 hover:text-zinc-100',
    };

    const sizes = {
      sm: 'px-3 py-1.5 text-xs h-8 gap-1.5',
      md: 'px-4 py-2 text-sm h-10 gap-2',
      lg: 'px-6 py-3 text-base h-12 gap-2.5',
      icon: 'p-2 h-10 w-10 justify-center',
    };

    const activeVariant = variants[variant] || variants.primary;
    const activeSize = sizes[size] || sizes.md;

    return (
      <motion.button
        ref={ref}
        whileTap={{ scale: 0.98 }}
        disabled={disabled || isLoading}
        className={`${baseStyle} ${activeVariant} ${activeSize} ${className}`}
        {...(props as any)}
      >
        {isLoading ? (
          <svg
            className="animate-spin -ml-1 mr-2 h-4 w-4 text-current"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            id="loading-spinner"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
        ) : (
          leftIcon && <span className="flex-shrink-0">{leftIcon}</span>
        )}
        {size !== 'icon' && children}
        {!isLoading && rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
      </motion.button>
    );
  }
);

Button.displayName = 'Button';
