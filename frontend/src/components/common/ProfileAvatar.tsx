import React from 'react';

interface ProfileAvatarProps {
  photoUrl?: string | null;
  photo?: string | null;
  src?: string | null;
  name?: string;
  role?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  shape?: 'circle' | 'rounded';
  className?: string;
}

export const ProfileAvatar: React.FC<ProfileAvatarProps> = ({
  photoUrl,
  photo,
  src,
  name = 'User',
  role = 'PATIENT',
  size = 'md',
  shape = 'rounded',
  className = '',
}) => {
  const activePhoto = photoUrl || photo || src;
  const sizeClasses = {
    xs: 'w-6 h-6',
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-14 h-14',
    xl: 'w-20 h-20',
    '2xl': 'w-28 h-28',
  }[size];

  const roundedClasses = shape === 'circle' ? 'rounded-full' : 'rounded-2xl';

  // If actual photo exists, render without stretching
  if (typeof activePhoto === 'string' && activePhoto.trim().length > 0) {
    return (
      <div
        className={`${sizeClasses} ${roundedClasses} overflow-hidden border border-white/10 shadow-sm flex-shrink-0 bg-[#141416] ${className}`}
      >
        <img
          src={activePhoto}
          alt={name}
          className="w-full h-full object-cover object-center"
        />
      </div>
    );
  }

  // Clean Default Medical Avatar (Requirement 1: Do NOT show only initial letters R/RS)
  const isDoctor = role?.toUpperCase().includes('DOC');

  return (
    <div
      className={`${sizeClasses} ${roundedClasses} flex items-center justify-center flex-shrink-0 border shadow-sm ${
        isDoctor
          ? 'bg-gradient-to-br from-teal-600 to-teal-800 text-white border-teal-500/40'
          : 'bg-gradient-to-br from-health-600 to-health-800 text-white border-health-500/40'
      } ${className}`}
      title={name}
      aria-label={`${name} avatar`}
    >
      {isDoctor ? (
        // Professional Doctor Medical Avatar Icon
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-3/5 h-3/5 text-teal-50 drop-shadow-sm"
        >
          {/* Stethoscope + Doctor badge */}
          <path d="M4.5 3v5a3.5 3.5 0 0 0 7 0V3" />
          <path d="M8 11.5v3.5a4 4 0 0 0 8 0V11" />
          <circle cx="18" cy="10" r="2" />
          <path d="M11 3h2" />
          <path d="M3.5 3h2" />
          <circle cx="12" cy="18" r="3" fill="currentColor" fillOpacity="0.2" />
          <path d="M12 16.5v3M10.5 18h3" />
        </svg>
      ) : (
        // Clean Sovereign Patient Health Identity Avatar
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-3/5 h-3/5 text-health-50 drop-shadow-sm"
        >
          {/* Person silhouette with healthcare shield/heart */}
          <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
          <path
            d="M17 11l1.5 1.5L21 10"
            strokeWidth="1.6"
            className="text-emerald-300"
          />
        </svg>
      )}
    </div>
  );
};
