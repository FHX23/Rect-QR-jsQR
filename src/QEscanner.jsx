import { useEffect, useRef, useState } from "react";
import jsQR from "jsqr";

export default function QRScanner() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const requestRef = useRef(null);
  const [qrData, setQrData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: "environment" }

        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.setAttribute("playsinline", true); // necesario en iOS
          await videoRef.current.play();
          requestRef.current = requestAnimationFrame(scanFrame);
        }
      } catch (err) {
        console.error(err);
        setError("No se pudo acceder a la cámara.");
      }
    };

    startCamera();

    return () => {
      // detener cámara y animación
      if (videoRef.current?.srcObject) {
        videoRef.current.srcObject.getTracks().forEach(track => track.stop());
      }
      cancelAnimationFrame(requestRef.current);
    };
  }, []);

  const scanFrame = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (
      video.readyState === video.HAVE_ENOUGH_DATA &&
      canvas &&
      canvas.getContext
    ) {
      const ctx = canvas.getContext("2d");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, canvas.width, canvas.height);
      if (code) {
        setQrData(code.data);
        return; // para escanear solo una vez
      }
    }
    requestRef.current = requestAnimationFrame(scanFrame);
  };

  return (
    <div className="flex flex-col items-center p-4">
      <video
        ref={videoRef}
        className="w-full max-w-md rounded transform scale-x-100" // sin espejo
      />
      <canvas ref={canvasRef} className="hidden" />
      {qrData && (
        <p className="mt-4 text-green-600 font-semibold">Código QR: {qrData}</p>
      )}
      {error && <p className="text-red-600">{error}</p>}
    </div>
  );
}
