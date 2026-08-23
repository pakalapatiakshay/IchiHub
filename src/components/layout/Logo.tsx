import iconImage from '../../assets/icon.png';

interface LogoProps {
  /** Adjust styling for dark background usage */
  isDarkBg?: boolean;
  /** Custom class for styling wrapper */
  className?: string;
  /** Pixel height of the logo icon. Wordmark size will scale accordingly. */
  height?: number;
  /** Show tagline below logo (FIND • BOOK • GET IT DONE) */
  showTagline?: boolean;
}

export default function Logo({
  isDarkBg = false,
  className = '',
  height = 40,
  showTagline = false,
}: LogoProps) {
  const orange = '#FF5A1F';
  const ichiColor = isDarkBg ? '#D6D6D6' : '#6B6B6B';

  // Wordmark font size scales proportionally with icon height
  const fontSize = Math.round(height * 0.58);

  return (
    <div className={`flex flex-col items-start ${className}`}>
      <div className="flex items-center gap-3">
        {/* Icon Image */}
        <img 
          src={iconImage} 
          alt="IchiHub Icon" 
          style={{ height: `${height}px`, width: 'auto' }} 
          className="shrink-0 object-contain" 
        />

        {/* Wordmark */}
        <span
          className="font-display font-extrabold tracking-tight select-none whitespace-nowrap"
          style={{
            fontSize: `${fontSize}px`,
            lineHeight: '1',
          }}
        >
          <span style={{ color: ichiColor }}>Ichi</span>
          <span style={{ color: orange }}>Hub</span>
        </span>
      </div>

      {/* Tagline */}
      {showTagline && (
        <div
          className="mt-1.5 uppercase tracking-[0.18em] font-bold text-gray-500 flex items-center gap-1.5 whitespace-nowrap"
          style={{
            fontSize: `${Math.max(8, Math.round(height * 0.22))}px`,
            paddingLeft: `${Math.round(height * 0.05)}px`,
          }}
        >
          <span>Find</span>
          <span style={{ color: orange, fontSize: '1.2em', lineHeight: '0' }}>•</span>
          <span>Book</span>
          <span style={{ color: orange, fontSize: '1.2em', lineHeight: '0' }}>•</span>
          <span>Get It Done</span>
        </div>
      )}
    </div>
  );
}
