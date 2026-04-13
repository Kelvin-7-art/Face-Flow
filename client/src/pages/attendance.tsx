import { useState, useCallback, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { Camera, Upload, CheckCircle, XCircle, AlertCircle, Loader2, UserCheck, Scan } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { WebcamCapture } from "@/components/webcam-capture";
import { ImageUpload } from "@/components/image-upload";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { loadModels, extractEmbeddingFromDataUrl, detectMultipleFaces, imageDataUrlToImage } from "@/lib/faceDetection";
import type { RecognitionResult } from "@shared/schema";

export default function Attendance() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"webcam" | "upload">("webcam");
  const [threshold, setThreshold] = useState([0.5]);
  const [results, setResults] = useState<RecognitionResult[]>([]);
  const [modelsLoading, setModelsLoading] = useState(true);
  const [processingImage, setProcessingImage] = useState(false);

  useEffect(() => {
    loadModels()
      .then(() => {
        setModelsLoading(false);
      })
      .catch((error) => {
        console.error("Failed to load face detection models:", error);
        toast({
          title: "Model loading failed",
          description: "Face detection may not work properly. Please refresh the page.",
          variant: "destructive",
        });
        setModelsLoading(false);
      });
  }, []);

  const recognitionMutation = useMutation({
    mutationFn: async (embeddings: Array<{ embedding: number[]; bbox: { x: number; y: number; width: number; height: number } }>) => {
      const response = await apiRequest("POST", "/api/attendance/check", {
        embeddings,
        threshold: threshold[0],
      });
      return response.json() as Promise<RecognitionResult[]>;
    },
    onSuccess: (data) => {
      setResults(data);
      const recognized = data.filter((r) => r.personId);
      const newMarks = data.filter((r) => r.isNew);
      
      if (recognized.length > 0) {
        toast({
          title: `${recognized.length} face(s) recognized`,
          description: newMarks.length > 0 
            ? `${newMarks.length} new attendance record(s) marked` 
            : "Already marked within cooldown period",
        });
      } else if (data.length > 0) {
        toast({
          title: "Unknown faces detected",
          description: "No matching profiles found. Please register first.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "No faces detected",
          description: "Please ensure faces are clearly visible in the image.",
          variant: "destructive",
        });
      }
      
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/attendance"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Recognition Failed",
        description: error.message || "Failed to process image",
        variant: "destructive",
      });
    },
  });

  const processAndRecognize = async (imageData: string) => {
    setProcessingImage(true);
    try {
      const img = await imageDataUrlToImage(imageData);
      const detections = await detectMultipleFaces(img);
      
      if (detections.length === 0) {
        toast({
          title: "No faces detected",
          description: "Please ensure faces are clearly visible in the image.",
          variant: "destructive",
        });
        setProcessingImage(false);
        return;
      }
      
      recognitionMutation.mutate(detections);
    } catch (error) {
      console.error("Error processing image:", error);
      toast({
        title: "Processing Failed",
        description: "Failed to detect faces in the image.",
        variant: "destructive",
      });
    }
    setProcessingImage(false);
  };

  const handleCapture = useCallback((imageData: string) => {
    processAndRecognize(imageData);
  }, [threshold]);

  const handleUpload = useCallback((images: string[]) => {
    if (images.length > 0) {
      processAndRecognize(images[0]);
    }
  }, [threshold]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 md:px-8">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold" data-testid="text-page-title">
          Take Attendance
        </h1>
        <p className="mt-1 text-muted-foreground">
          Capture or upload a photo to automatically recognize and mark attendance
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-5">
        <div className="lg:col-span-3 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Camera className="h-5 w-5" />
                Face Capture
              </CardTitle>
              <CardDescription>
                Take a photo or upload an image to check attendance
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {modelsLoading ? (
                <div className="flex flex-col items-center gap-4 py-8 text-center">
                  <Loader2 className="h-10 w-10 animate-spin text-primary" />
                  <div>
                    <p className="font-medium">Loading Face Detection</p>
                    <p className="text-sm text-muted-foreground">
                      Please wait while the AI models are being loaded...
                    </p>
                  </div>
                </div>
              ) : (
                <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "webcam" | "upload")}>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="webcam" data-testid="tab-webcam">
                      <Camera className="mr-2 h-4 w-4" />
                      Webcam
                    </TabsTrigger>
                    <TabsTrigger value="upload" data-testid="tab-upload">
                      <Upload className="mr-2 h-4 w-4" />
                      Upload
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value="webcam" className="mt-4">
                    <WebcamCapture
                      onCapture={handleCapture}
                      isCapturing={processingImage || recognitionMutation.isPending}
                    />
                    {processingImage && (
                      <div className="mt-4 flex items-center gap-2 justify-center text-sm text-muted-foreground">
                        <Scan className="h-4 w-4 animate-pulse" />
                        Detecting faces...
                      </div>
                    )}
                  </TabsContent>
                  <TabsContent value="upload" className="mt-4">
                    <ImageUpload
                      onUpload={handleUpload}
                      multiple={false}
                      maxFiles={1}
                    />
                    {processingImage && (
                      <div className="mt-4 flex items-center gap-2 justify-center text-sm text-muted-foreground">
                        <Scan className="h-4 w-4 animate-pulse" />
                        Processing image...
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recognition Threshold</CardTitle>
              <CardDescription>
                Adjust the sensitivity for face matching (lower = stricter)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Threshold</Label>
                  <span className="font-mono text-sm">{threshold[0].toFixed(2)}</span>
                </div>
                <Slider
                  value={threshold}
                  onValueChange={setThreshold}
                  min={0.3}
                  max={0.7}
                  step={0.05}
                  data-testid="slider-threshold"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Strict (0.3)</span>
                  <span>Recommended (0.5)</span>
                  <span>Lenient (0.7)</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Card className="sticky top-24">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserCheck className="h-5 w-5" />
                Recognition Results
              </CardTitle>
              <CardDescription>
                Detected faces and attendance status
              </CardDescription>
            </CardHeader>
            <CardContent>
              {recognitionMutation.isPending ? (
                <div className="flex flex-col items-center gap-4 py-8 text-center">
                  <Loader2 className="h-10 w-10 animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground">Processing image...</p>
                </div>
              ) : results.length > 0 ? (
                <div className="space-y-4">
                  {results.map((result, idx) => (
                    <div
                      key={idx}
                      className={`rounded-lg border p-4 ${
                        result.personId
                          ? "border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950"
                          : "border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950"
                      }`}
                      data-testid={`result-card-${idx}`}
                    >
                      <div className="flex items-start gap-3">
                        {result.personId ? (
                          <CheckCircle className="mt-0.5 h-5 w-5 text-green-600 dark:text-green-400" />
                        ) : (
                          <XCircle className="mt-0.5 h-5 w-5 text-amber-600 dark:text-amber-400" />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium truncate" data-testid={`result-name-${idx}`}>
                              {result.personId ? result.fullName : "Unknown Person"}
                            </span>
                            {result.isNew && (
                              <Badge variant="default" className="text-xs">
                                New
                              </Badge>
                            )}
                          </div>
                          {result.personId && (
                            <p className="font-mono text-xs text-muted-foreground">
                              {result.personId}
                            </p>
                          )}
                          <div className="mt-2 flex items-center gap-2 flex-wrap">
                            <Badge variant="secondary" className="text-xs">
                              {((1 - result.distance) * 100).toFixed(0)}% match
                            </Badge>
                            {result.personId && !result.isNew && (
                              <span className="text-xs text-muted-foreground">
                                Already marked
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center gap-4 py-8 text-center">
                  <AlertCircle className="h-10 w-10 text-muted-foreground" />
                  <div>
                    <p className="font-medium">No Results Yet</p>
                    <p className="text-sm text-muted-foreground">
                      Capture or upload an image to begin recognition
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
