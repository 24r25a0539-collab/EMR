import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

export type RevealDirection = 'left' | 'right' | 'up' | 'down' | 'bottom' | 'top' | 'center' | 'scale' | 'none';

export interface ScrollRevealProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  direction?: RevealDirection;
  delay?: number; // in seconds (e.g. 0.08, 0.16)
  duration?: number; // in seconds (default 0.9s)
  distance?: number; // in px (default 80px)
  blur?: number; // in px (default 6px)
  threshold?: number; // 0.15 default
  className?: string;
  colorTransition?: boolean;
  glowColor?: string;
  as?: React.ElementType;
}

export const ScrollReveal: React.FC<ScrollRevealProps> = ({
  children,
  direction = 'up',
  delay = 0,
  duration = 0.9,
  distance = 80,
  blur = 6,
  threshold = 0.15,
  className = '',
  colorTransition = true,
  glowColor,
  as: Component = 'div',
  style,
  ...rest
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const [isRevealed, setIsRevealed] = useState<boolean>(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setIsRevealed(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsRevealed(true);
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold,
        rootMargin: '0px 0px -30px 0px',
      }
    );

    observer.observe(el);

    return () => {
      observer.disconnect();
    };
  }, [threshold]);

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;
  const resolvedDistance = isMobile ? 20 : distance;

  const getInitialTransform = () => {
    switch (direction) {
      case 'left':
        return isMobile ? 'translateY(15px)' : `translateX(-${resolvedDistance}px)`;
      case 'right':
        return isMobile ? 'translateY(15px)' : `translateX(${resolvedDistance}px)`;
      case 'up':
      case 'bottom':
      case 'center':
        return `translateY(${resolvedDistance * 0.6}px)`;
      case 'down':
      case 'top':
        return `translateY(-${resolvedDistance * 0.6}px)`;
      case 'scale':
        return `scale(0.95)`;
      case 'none':
      default:
        return 'none';
    }
  };

  const initialFilter = colorTransition
    ? `blur(${blur}px) saturate(0.5)`
    : `blur(${blur}px)`;

  const dynamicStyle: React.CSSProperties = {
    opacity: isRevealed ? 1 : 0,
    transform: isRevealed ? 'translate(0px, 0px) scale(1)' : getInitialTransform(),
    filter: isRevealed ? 'blur(0px) saturate(1)' : initialFilter,
    boxShadow: isRevealed && glowColor ? `0 12px 32px -4px ${glowColor}` : undefined,
    transition: `opacity ${duration}s cubic-bezier(0.22, 1, 0.36, 1) ${delay}s, transform ${duration}s cubic-bezier(0.22, 1, 0.36, 1) ${delay}s, filter ${duration}s cubic-bezier(0.22, 1, 0.36, 1) ${delay}s, box-shadow ${duration}s cubic-bezier(0.22, 1, 0.36, 1) ${delay}s`,
    willChange: 'opacity, transform, filter',
    ...style,
  };

  return (
    <Component
      ref={ref}
      style={dynamicStyle}
      className={`sr-element ${isRevealed ? 'sr-revealed' : ''} ${className}`}
      {...rest}
    >
      {children}
    </Component>
  );
};

export interface ScrollRevealGroupProps {
  children: React.ReactNode;
  staggerDelay?: number; // default 0.08s
  stagger?: number; // alias for staggerDelay
  delay?: number; // initial delay offset
  direction?: RevealDirection;
  alternateDirection?: boolean; // alternating left/right
  baseDirection?: RevealDirection;
  className?: string;
}

export const ScrollRevealGroup: React.FC<ScrollRevealGroupProps> = ({
  children,
  staggerDelay = 0.08,
  stagger,
  delay = 0,
  direction,
  alternateDirection = false,
  baseDirection = 'up',
  className = '',
}) => {
  const items = React.Children.toArray(children);
  const delayStep = stagger !== undefined ? stagger : staggerDelay;
  const effectiveDirection = direction || baseDirection;

  return (
    <div className={`w-full ${className}`}>
      {items.map((child, index) => {
        let dir: RevealDirection = effectiveDirection;
        if (alternateDirection) {
          dir = index % 2 === 0 ? 'left' : 'right';
        }
        return (
          <ScrollReveal key={index} direction={dir} delay={delay + index * delayStep} className="w-full">
            {child}
          </ScrollReveal>
        );
      })}
    </div>
  );
};

// Framer Motion Animated Section for rich directional entry
export interface AnimatedSectionProps {
  children: React.ReactNode;
  direction?: 'left' | 'right' | 'up' | 'down' | 'bottom' | 'top' | 'center';
  delay?: number;
  className?: string;
  glow?: 'blue' | 'teal' | 'cyan' | 'purple' | 'emergency' | 'none';
}

export const AnimatedSection: React.FC<AnimatedSectionProps> = ({
  children,
  direction = 'up',
  delay = 0,
  className = '',
  glow = 'none',
}) => {
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;
  const xOffset = isMobile ? 0 : direction === 'left' ? -80 : direction === 'right' ? 80 : 0;
  const yOffset = direction === 'up' || direction === 'bottom' || direction === 'center' ? (isMobile ? 20 : 50) : (direction === 'down' || direction === 'top') ? (isMobile ? -20 : -50) : 0;

  const glowClass = {
    blue: 'dark-radial-glow-blue',
    teal: 'dark-radial-glow-teal',
    cyan: 'dark-radial-glow-blue',
    purple: 'dark-radial-glow-purple',
    emergency: 'dark-radial-glow-emergency',
    none: '',
  }[glow];

  return (
    <motion.section
      initial={{ opacity: 0, x: xOffset, y: yOffset, filter: 'blur(7px) saturate(0.5)' }}
      whileInView={{ opacity: 1, x: 0, y: 0, filter: 'blur(0px) saturate(1)' }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.9, delay, ease: [0.22, 1, 0.36, 1] }}
      className={`relative w-full ${glowClass} ${className}`}
    >
      {children}
    </motion.section>
  );
};

// Animated Card for stagger inside grids
export interface AnimatedCardProps {
  children: React.ReactNode;
  index?: number;
  direction?: 'left' | 'right' | 'up' | 'down' | 'bottom' | 'top';
  className?: string;
  whileHover?: boolean;
}

export const AnimatedCard: React.FC<AnimatedCardProps> = ({
  children,
  index = 0,
  direction = 'up',
  className = '',
  whileHover = true,
}) => {
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;
  const xOffset = isMobile ? 0 : direction === 'left' ? -60 : direction === 'right' ? 60 : 0;
  const yOffset = (direction === 'up' || direction === 'bottom') ? (isMobile ? 20 : 45) : (direction === 'down' || direction === 'top') ? (isMobile ? -20 : -45) : 0;
  const delay = Math.min(index * 0.08, 0.4);

  return (
    <motion.div
      initial={{ opacity: 0, x: xOffset, y: yOffset, filter: 'blur(6px) saturate(0.6)' }}
      whileInView={{ opacity: 1, x: 0, y: 0, filter: 'blur(0px) saturate(1)' }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.85, delay, ease: [0.22, 1, 0.36, 1] }}
      whileHover={
        whileHover
          ? {
              scale: 1.015,
              filter: 'brightness(1.06) saturate(1.06)',
              transition: { duration: 0.25, ease: 'easeOut' },
            }
          : undefined
      }
      className={`relative w-full ${className}`}
    >
      {children}
    </motion.div>
  );
};

// Premium Pure Black Theme Card
export interface PremiumCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  accent?: 'blue' | 'teal' | 'cyan' | 'purple' | 'emergency' | 'slate' | 'amber' | 'gold' | 'gradient';
  category?: 'blue' | 'teal' | 'cyan' | 'purple' | 'emergency' | 'slate' | 'amber' | 'gold' | 'gradient';
  className?: string;
  hoverLift?: boolean;
}

export const PremiumCard: React.FC<PremiumCardProps> = ({
  children,
  accent,
  category,
  className = '',
  hoverLift = true,
  ...rest
}) => {
  const resolvedAccent = category || accent || 'slate';

  const getAccentClass = () => {
    switch (resolvedAccent) {
      case 'blue':
        return 'accent-card-blue';
      case 'teal':
        return 'accent-card-teal';
      case 'cyan':
        return 'accent-card-cyan';
      case 'purple':
        return 'accent-card-purple';
      case 'emergency':
        return 'accent-card-emergency';
      case 'gradient':
        return 'card-level-3';
      case 'amber':
      case 'gold':
        return 'bg-[#101012] border border-amber-500/25 hover:border-amber-500/50 shadow-lg transition-all duration-300';
      case 'slate':
      default:
        return 'card-level-1';
    }
  };

  return (
    <div
      className={`w-full rounded-[24px] sm:rounded-[28px] p-4 sm:p-6 ${getAccentClass()} ${hoverLift ? 'hover-lift' : ''} ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
};

// Glow Card for major feature highlight
export interface GlowCardProps {
  children: React.ReactNode;
  glowColor?: 'blue' | 'teal' | 'cyan' | 'purple' | 'emerald' | 'rose' | string;
  className?: string;
}

export const GlowCard: React.FC<GlowCardProps> = ({
  children,
  glowColor = 'blue',
  className = '',
}) => {
  const glowMap: Record<string, string> = {
    blue: 'from-blue-600/20 via-sky-500/10 to-transparent',
    teal: 'from-teal-500/20 via-emerald-500/10 to-transparent',
    cyan: 'from-cyan-500/20 via-blue-500/10 to-transparent',
    purple: 'from-purple-600/20 via-indigo-500/10 to-transparent',
    emerald: 'from-emerald-500/20 via-teal-500/10 to-transparent',
    rose: 'from-rose-600/25 via-orange-500/10 to-transparent',
  };
  const glowBg = glowMap[glowColor] || 'from-teal-500/20 via-blue-500/10 to-transparent';

  return (
    <div className={`w-full relative group ${className}`}>
      <div
        className={`absolute -inset-0.5 rounded-[30px] bg-gradient-to-r ${glowBg} opacity-40 group-hover:opacity-75 blur-xl transition-all duration-500 pointer-events-none`}
      />
      <div className="relative z-10 bg-[#101012] border border-white/[0.08] rounded-[28px] overflow-hidden p-4 sm:p-6 shadow-2xl">
        {children}
      </div>
    </div>
  );
};

// Spotlight Border Card
export interface SpotlightBorderProps {
  children: React.ReactNode;
  className?: string;
}

export const SpotlightBorder: React.FC<SpotlightBorderProps> = ({ children, className = '' }) => {
  return (
    <div
      className={`w-full relative rounded-[28px] p-[1px] bg-gradient-to-b from-white/[0.14] via-white/[0.04] to-transparent shadow-xl ${className}`}
    >
      <div className="rounded-[27px] bg-[#101012] p-4 sm:p-6 h-full">{children}</div>
    </div>
  );
};

// Standardized Page Header
export interface PageHeaderProps {
  badge?: string;
  badgeColor?: 'blue' | 'teal' | 'cyan' | 'purple' | 'rose' | 'amber';
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  badge,
  badgeColor = 'blue',
  title,
  subtitle,
  action,
  className = '',
}) => {
  const badgeClasses = {
    blue: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
    teal: 'text-teal-400 bg-teal-500/10 border-teal-500/20',
    cyan: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
    purple: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
    rose: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
    amber: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  }[badgeColor];

  return (
    <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 ${className}`}>
      <div>
        {badge && (
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider border ${badgeClasses} mb-2`}
          >
            {badge}
          </span>
        )}
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">{title}</h1>
        {subtitle && <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-3xl">{subtitle}</p>}
      </div>
      {action && <div className="flex items-center gap-3 flex-shrink-0">{action}</div>}
    </div>
  );
};

// Standardized Status Badge
export interface StatusBadgeProps {
  status: string;
  variant?: 'blue' | 'teal' | 'cyan' | 'purple' | 'success' | 'warning' | 'danger' | 'slate';
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, variant = 'slate', className = '' }) => {
  const variantClasses = {
    blue: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
    teal: 'bg-teal-500/15 text-teal-400 border-teal-500/30',
    cyan: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30',
    purple: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
    success: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    warning: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    danger: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
    slate: 'bg-white/[0.06] text-slate-300 border-white/[0.10]',
  }[variant];

  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold tracking-wide border ${variantClasses} ${className}`}
    >
      {status}
    </span>
  );
};
