export const ContinuousStarfield = () => {
  // Generate 60 star particles with varied properties
  const stars = Array.from({ length: 60 }, (_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    top: `${Math.random() * 100}%`,
    size: Math.random() * 2 + 2, // 2-4px
    opacity: Math.random() * 0.4 + 0.2, // 0.2-0.6
    duration: Math.random() * 15 + 15, // 15-30s
    delay: Math.random() * 10, // 0-10s delay
  }));

  return (
    <div className="fixed inset-0 pointer-events-none z-[1] overflow-hidden">
      {stars.map((star) => (
        <div
          key={star.id}
          className="absolute rounded-full bg-white/80 continuous-star"
          style={{
            left: star.left,
            top: star.top,
            width: `${star.size}px`,
            height: `${star.size}px`,
            opacity: star.opacity,
            animation: `starfield-drift ${star.duration}s linear ${star.delay}s infinite, starfield-twinkle ${star.duration * 0.5}s ease-in-out ${star.delay}s infinite`,
          }}
        />
      ))}
    </div>
  );
};