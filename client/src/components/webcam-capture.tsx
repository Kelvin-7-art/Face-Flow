import { useRef, useState, useCallback, useEffect } from "react";
import { Camera, CameraOff, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface WebcamCaptureProps {
  onCapture: (imageData: string) => void;
  isCapturing?: boolean;
  showCaptureButton?: boolean;
  aspectRatio?: "4:3" | "16:9";
  className?: string;
}

export function WebcamCapture({
  onCapture,
  isCapturing = false,
  showCaptureButton = true,
  aspectRatio = "4:3",
  className,
}: WebcamCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startCamera = useCallback(async () => {
    try {
      setError(null);
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        await videoRef.current.play();
      }
      setStream(mediaStream);
      setIsActive(true);
    } catch (err) {
      setError("Unable to access camera. Please check permissions or try uploading an image instead.");
      console.error("Camera error:", err);
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    setIsActive(false);
  }, [stream]);

  const captureImage = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.drawImage(video, 0, 0);
      const imageData = canvas.toDataURL("image/jpeg", 0.9);
      onCapture(imageData);
    }
  }, [onCapture]);

  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [stream]);

  const aspectClass = aspectRatio === "16:9" ? "aspect-video" : "aspect-[4/3]";

  return (
    <Card className={`overflow-hidden ${className}`}>
      <div className={`relative w-full ${aspectClass} bg-muted`}>
        {isActive ? (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="absolute inset-0 h-full w-full object-cover"
              data-testid="video-webcam"
            />
            <div className="absolute bottom-2 left-2 flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-red-500" />
              <span className="text-xs font-medium text-white drop-shadow-md">Live</span>
            </div>
          </>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-muted-foreground">
            <CameraOff className="h-12 w-12" />
            <span className="text-sm">Camera is off</span>
            {error && <p className="max-w-xs text-center text-xs text-destructive">{error}</p>}
          </div>
        )}
        <canvas ref={canvasRef} className="hidden" />
      </div>

      <div className="flex items-center justify-center gap-3 p-4">
        {isActive ? (
          <>
            {showCaptureButton && (
              <Button
                onClick={captureImage}
                disabled={isCapturing}
                data-testid="button-capture"
              >
                <Camera className="mr-2 h-4 w-4" />
                {isCapturing ? "Processing..." : "Capture"}
              </Button>
            )}
            <Button variant="outline" onClick={stopCamera} data-testid="button-stop-camera">
              <CameraOff className="mr-2 h-4 w-4" />
              Stop
            </Button>
          </>
        ) : (
          <Button onClick={startCamera} data-testid="button-start-camera">
            <Camera className="mr-2 h-4 w-4" />
            Start Camera
          </Button>
        )}
      </div>
    </Card>
  );
}
