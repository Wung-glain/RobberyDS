import { useEffect, useRef, useState } from 'react';





export const VideoCanvas = ({ id, streamUrl, title }) => {
  const canvasRef = useRef(null);
  const [status, setStatus] = useState("CONNECTING");

  useEffect(() => {
    const ws = new WebSocket(streamUrl);
    ws.onopen = () => setStatus("LIVE");
    ws.onclose = () => setStatus("OFFLINE");
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.src = `data:image/jpeg;base64,${data.image}`;
      img.onload = () => {
        // --- CRITICAL FIX 1: MATCHING INTERNAL RESOLUTION ---
        // If we don't do this, the "brush" is drawing on a different scale than the image
        canvas.width = img.width;
        canvas.height = img.height;

        // Clear and Draw Frame
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        // --- CRITICAL FIX 2: VERIFYING DATA EXISTENCE ---
        if (!data.detections || data.detections.length === 0) return;

        data.detections.forEach(det => {
          // Destructure the box [x1, y1, x2, y2]
          const [x1, y1, x2, y2] = det.box;
          const width = x2 - x1;
          const height = y2 - y1;

          // Style Logic
          const isHighSuspicion = det.score > 70;
          const color = isHighSuspicion ? "#ff4444" : "#00ff88"; 
          
          ctx.strokeStyle = color;
          ctx.lineWidth = 4; // Make it thick so it's impossible to miss
          
          // --- CRITICAL FIX 3: THE DRAWING PATH ---
          ctx.beginPath();
          ctx.rect(x1, y1, width, height);
          ctx.stroke();

          // Draw Label
          ctx.fillStyle = color;
          ctx.font = "bold 20px Arial";
          ctx.fillText(`ID:${det.id} | ${det.score}%`, x1, y1 - 10);
          
          console.log(`Drawing Box for ID ${det.id} at:`, x1, y1); // Debug log
        });
      };
    };
    return () => ws.close();
  }, [streamUrl, id]);

  return (
    <div className="relative bg-black rounded-xl overflow-hidden shadow-2xl border border-white/10">
      <div className="absolute top-4 left-4 z-20 pointer-events-none">
        <div className="bg-black/60 backdrop-blur-sm px-3 py-1 rounded border border-white/20">
            <p className="text-white text-xs font-black tracking-widest uppercase">CAM {id} - {title}</p>
        </div>
      </div>
      {/* status indicator */}
      <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
         <div className={`w-2 h-2 rounded-full ${status === "LIVE" ? "bg-red-500 animate-pulse" : "bg-gray-500"}`}></div>
         <span className="text-[10px] font-mono text-white/80">{status}</span>
      </div>
      <canvas ref={canvasRef} className="w-full h-auto block" />
    </div>
  );
};
