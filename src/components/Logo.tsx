interface LogoProps {
  variant?: 'full' | 'compact';
  onClick?: () => void;
}

export const Logo = ({ variant = 'full', onClick }: LogoProps) => {
  return (
    <div 
      onClick={onClick}
      className="flex items-center gap-3 cursor-pointer"
    >
      {/* Panther Icon with Neon Glow */}
      <div className="relative">
        {/* Glow effect layers */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#00CFFF] to-[#4F8EFF] rounded-full blur-md opacity-60 animate-pulse"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-[#00CFFF] to-[#4F8EFF] rounded-full blur-sm opacity-40"></div>
        
        {/* Icon container */}
        <div className="relative w-10 h-10 flex items-center justify-center">
          <svg 
            viewBox="0 0 100 100" 
            className="w-full h-full"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Martini glass and panther silhouette */}
            <g>
              {/* Martini Glass */}
              {/* Glass bowl - triangular */}
              <path 
                d="M20 25 L80 25 L50 65 Z" 
                fill="none"
                stroke="#00CFFF"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              
              {/* Glass stem */}
              <line 
                x1="50" 
                y1="65" 
                x2="50" 
                y2="85" 
                stroke="#00CFFF"
                strokeWidth="2"
                strokeLinecap="round"
              />
              
              {/* Glass base */}
              <line 
                x1="42" 
                y1="85" 
                x2="58" 
                y2="85" 
                stroke="#00CFFF"
                strokeWidth="2"
                strokeLinecap="round"
              />
              
              {/* Panther Silhouette - sitting gracefully */}
              <g transform="translate(50, 20)">
                {/* Head */}
                <ellipse cx="0" cy="0" rx="6" ry="7" fill="#000000"/>
                
                {/* Left ear */}
                <path d="M-4 -6 L-6 -10 L-2 -7 Z" fill="#000000"/>
                
                {/* Right ear */}
                <path d="M4 -6 L6 -10 L2 -7 Z" fill="#000000"/>
                
                {/* Neck and body */}
                <path 
                  d="M0 6 Q-2 10 -3 15 Q-4 20 -3 25 L-3 30" 
                  fill="#000000"
                  stroke="#000000"
                  strokeWidth="5"
                  strokeLinecap="round"
                />
                
                {/* Body bulk - sitting position */}
                <ellipse cx="-1" cy="20" rx="7" ry="12" fill="#000000"/>
                
                {/* Chest */}
                <ellipse cx="-2" cy="12" rx="5" ry="6" fill="#000000"/>
                
                {/* Front leg */}
                <path 
                  d="M-6 25 L-7 35" 
                  stroke="#000000"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
                
                {/* Back haunch */}
                <ellipse cx="3" cy="24" rx="6" ry="8" fill="#000000"/>
                
                {/* Tail - elegant curve */}
                <path 
                  d="M5 20 Q12 18 16 12 Q18 8 17 4" 
                  stroke="#000000" 
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  fill="none"
                />
              </g>
            </g>
          </svg>
        </div>
      </div>

      {/* Text and Badge - Only shown in full variant */}
      {variant === 'full' && (
        <div className="flex items-center gap-2">
          {/* Party Panther Text */}
          <h1 
            className="text-lg font-extrabold bg-gradient-to-r from-[#00CFFF] to-[#4F8EFF] bg-clip-text text-transparent whitespace-nowrap"
            style={{ 
              fontFamily: 'Poppins, sans-serif',
              filter: 'drop-shadow(0 0 8px rgba(0, 207, 255, 0.4))'
            }}
          >
            Party Panther
          </h1>
          
          {/* BETA Pill Tag */}
          <div className="relative">
            {/* Glow for pill */}
            <div className="absolute inset-0 bg-[#00CFFF] rounded-full blur-sm opacity-50"></div>
            
            {/* Pill */}
            <div className="relative px-2 py-0.5 bg-gradient-to-r from-[#00CFFF] to-[#4F8EFF] rounded-full border border-[#00CFFF]/50">
              <span className="text-[10px] font-bold text-white uppercase tracking-wider">
                Beta
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
