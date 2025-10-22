export const AmbientEffects = () => {
  // Floating orbs configuration
  const orbs = [
    { color: 'bg-cyan-500', size: 80, blur: 50, left: '15%', top: '20%', duration: 25 },
    { color: 'bg-blue-500', size: 100, blur: 55, left: '75%', top: '40%', duration: 30 },
    { color: 'bg-purple-500', size: 90, blur: 48, left: '40%', top: '70%', duration: 28 },
    { color: 'bg-indigo-500', size: 70, blur: 45, left: '85%', top: '80%', duration: 22 },
  ];

  // Ambient light streaks configuration
  const streaks = [
    { width: 150, angle: 45, left: '10%', top: '30%', delay: 0, duration: 12 },
    { width: 120, angle: -30, left: '70%', top: '50%', delay: 4, duration: 15 },
    { width: 180, angle: 60, left: '30%', top: '80%', delay: 8, duration: 14 },
  ];

  return (
    <>
      {/* Floating Light Orbs */}
      <div className="fixed inset-0 pointer-events-none z-[1] overflow-hidden">
        {orbs.map((orb, i) => (
          <div
            key={`orb-${i}`}
            className={`absolute ${orb.color} rounded-full opacity-[0.08] ambient-orb`}
            style={{
              width: `${orb.size}px`,
              height: `${orb.size}px`,
              filter: `blur(${orb.blur}px)`,
              left: orb.left,
              top: orb.top,
              animation: `ambient-float ${orb.duration}s ease-in-out infinite`,
              animationDelay: `${i * 2}s`,
            }}
          />
        ))}
      </div>

      {/* Subtle Scan Lines */}
      <div className="fixed inset-0 pointer-events-none z-[1] overflow-hidden">
        <div className="absolute inset-0 scan-lines opacity-[0.03]" />
      </div>

      {/* Ambient Light Streaks */}
      <div className="fixed inset-0 pointer-events-none z-[1] overflow-hidden">
        {streaks.map((streak, i) => (
          <div
            key={`streak-${i}`}
            className="absolute bg-gradient-to-r from-transparent via-cyan-400/20 to-transparent ambient-streak"
            style={{
              width: `${streak.width}px`,
              height: '1px',
              left: streak.left,
              top: streak.top,
              transform: `rotate(${streak.angle}deg)`,
              animation: `ambient-streak-move ${streak.duration}s ease-in-out ${streak.delay}s infinite`,
              filter: 'blur(1px)',
            }}
          />
        ))}
      </div>
    </>
  );
};