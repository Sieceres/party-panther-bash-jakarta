const Proofing = () => {
  const iframeSrc = `https://lexium-42-2otpje2eb-jorgen1977-yahoocoms-projects.vercel.app/?v=${Date.now()}`;
  
  return (
    <iframe
      src={iframeSrc}
      className="w-full h-screen border-0"
      title="Norwegian Editor"
    />
  );
};

export default Proofing;
