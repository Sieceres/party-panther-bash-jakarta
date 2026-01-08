const Proofing = () => {
  const iframeSrc = `https://lexium-42-409722247898.us-west1.run.app/?v=${Date.now()}`;
  
  return (
    <iframe
      src={iframeSrc}
      className="w-full h-screen border-0"
      title="Norwegian Editor"
    />
  );
};

export default Proofing;
