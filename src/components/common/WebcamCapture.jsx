import React, { useRef, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Camera, RefreshCw, Check, X } from "lucide-react";

export default function WebcamCapture({ onCapture, onCancel }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [image, setImage] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, []);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: "user" } 
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setError(null);
    } catch (err) {
      console.error("Error accessing webcam:", err);
      setError("Não foi possível acessar a câmera. Verifique as permissões do navegador.");
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const capture = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext("2d");

      // Set canvas dimensions to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Draw video frame to canvas
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Convert to data URL for preview
      const dataUrl = canvas.toDataURL("image/jpeg");
      setImage(dataUrl);
    }
  };

  const confirm = () => {
    if (canvasRef.current) {
        canvasRef.current.toBlob((blob) => {
            const file = new File([blob], "webcam-photo.jpg", { type: "image/jpeg" });
            onCapture(file);
        }, "image/jpeg", 0.95);
    }
  };

  const retake = () => {
    setImage(null);
  };

  if (error) {
    return (
      <div className="text-center p-4 bg-red-50 rounded-lg border border-red-100">
        <p className="text-red-600 mb-4 font-medium">{error}</p>
        <Button onClick={onCancel} variant="outline">Voltar</Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4 w-full">
      {!image ? (
        <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden shadow-inner group">
          <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            muted 
            className="w-full h-full object-cover transform scale-x-[-1]" // Mirror effect
          />
          {/* Guide Overlay for centering */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
             <div className="w-48 h-48 border-2 border-white/70 border-dashed rounded-full shadow-[0_0_0_9999px_rgba(0,0,0,0.5)]" />
             <p className="absolute bottom-4 text-white/80 text-sm font-medium bg-black/50 px-3 py-1 rounded-full">
                Centralize o rosto no círculo
             </p>
          </div>
        </div>
      ) : (
        <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden">
          <img src={image} alt="Captured" className="w-full h-full object-contain transform scale-x-[-1]" />
        </div>
      )}

      <canvas ref={canvasRef} className="hidden" />

      <div className="flex gap-3 w-full justify-center">
        {!image ? (
          <>
            <Button onClick={onCancel} variant="outline" className="flex-1">Cancelar</Button>
            <Button onClick={capture} className="flex-1 bg-blue-600 hover:bg-blue-700">
              <Camera className="w-4 h-4 mr-2" />
              Capturar Foto
            </Button>
          </>
        ) : (
          <>
            <Button onClick={retake} variant="outline" className="flex-1">
              <RefreshCw className="w-4 h-4 mr-2" />
              Tentar Novamente
            </Button>
            <Button onClick={confirm} className="flex-1 bg-green-600 hover:bg-green-700">
              <Check className="w-4 h-4 mr-2" />
              Confirmar Foto
            </Button>
          </>
        )}
      </div>
    </div>
  );
}