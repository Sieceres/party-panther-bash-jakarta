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
            {/* Panther silhouette sitting on martini glass */}
            <g>
              {/* Martini glass base */}
              <path 
                d="M35 85 L35 70 L40 70 L40 55 L30 55 L50 25 L70 55 L60 55 L60 70 L65 70 L65 85" 
                fill="none"
                stroke="#00CFFF"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              
              {/* Martini glass bowl */}
              <path 
                d="M25 30 L75 30 L50 60 Z" 
                fill="none"
                stroke="#00CFFF"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              
              {/* Panther body - sitting pose */}
              <ellipse cx="50" cy="35" rx="12" ry="15" fill="#000000"/>
              
              {/* Panther head */}
              <circle cx="50" cy="20" r="8" fill="#000000"/>
              
              {/* Panther ears */}
              <path d="M45 15 L43 12 L47 14 Z" fill="#000000"/>
              <path d="M55 15 L57 12 L53 14 Z" fill="#000000"/>
              
              {/* Panther tail - curved */}
              <path 
                d="M60 40 Q68 35 70 28" 
                stroke="#000000" 
                strokeWidth="3"
                strokeLinecap="round"
                fill="none"
              />
              
              {/* Panther legs */}
              <path d="M45 48 L43 55" stroke="#000000" strokeWidth="2.5" strokeLinecap="round"/>
              <path d="M55 48 L57 55" stroke="#000000" strokeWidth="2.5" strokeLinecap="round"/>
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
