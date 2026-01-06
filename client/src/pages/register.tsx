import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { UserPlus, Camera, Upload, CheckCircle, AlertCircle, Loader2, Scan } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { WebcamCapture } from "@/components/webcam-capture";
import { ImageUpload } from "@/components/image-upload";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { loadModels, extractEmbeddingFromDataUrl, areModelsLoaded } from "@/lib/faceDetection";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

const registerFormSchema = z.object({
  personId: z
    .string()
    .min(2, "ID must be at least 2 characters")
    .max(50, "ID must be at most 50 characters")
    .regex(/^[a-zA-Z0-9_-]+$/, "ID can only contain letters, numbers, hyphens, and underscores"),
  fullName: z.string().min(2, "Name must be at least 2 characters"),
  role: z.string().optional(),
});

type RegisterFormValues = z.infer<typeof registerFormSchema>;

const MIN_SAMPLES = 3;
const MAX_SAMPLES = 10;

interface FaceSample {
  imageData: string;
  embedding: number[];
}

export default function Register() {
  const { toast } = useToast();
  const [capturedSamples, setCapturedSamples] = useState<FaceSample[]>([]);
  const [activeTab, setActiveTab] = useState<"webcam" | "upload">("webcam");
  const [modelsLoading, setModelsLoading] = useState(true);
  const [processingImage, setProcessingImage] = useState(false);

  useEffect(() => {
    loadModels()
      .then(() => {
        setModelsLoading(false);
        toast({
          title: "Face detection ready",
          description: "You can now capture face samples",
        });
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

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerFormSchema),
    defaultValues: {
      personId: "",
      fullName: "",
      role: "",
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (data: RegisterFormValues & { embeddings: number[][] }) => {
      const response = await apiRequest("POST", "/api/people", data);
      return response;
    },
    onSuccess: () => {
      toast({
        title: "Registration Successful",
        description: "Person has been registered successfully!",
      });
      form.reset();
      setCapturedSamples([]);
      queryClient.invalidateQueries({ queryKey: ["/api/people"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Registration Failed",
        description: error.message || "Failed to register person",
        variant: "destructive",
      });
    },
  });

  const processImage = async (imageData: string): Promise<FaceSample | null> => {
    try {
      const result = await extractEmbeddingFromDataUrl(imageData);
      if (result) {
        return {
          imageData,
          embedding: result.embedding,
        };
      }
      return null;
    } catch (error) {
      console.error("Error processing image:", error);
      return null;
    }
  };

  const handleWebcamCapture = async (imageData: string) => {
    if (capturedSamples.length >= MAX_SAMPLES || processingImage) return;
    
    setProcessingImage(true);
    const sample = await processImage(imageData);
    setProcessingImage(false);
    
    if (sample) {
      setCapturedSamples((prev) => [...prev, sample]);
      toast({
        title: `Face sample ${capturedSamples.length + 1} captured`,
        description: capturedSamples.length + 1 >= MIN_SAMPLES 
          ? "Ready to register!" 
          : `Need ${MIN_SAMPLES - capturedSamples.length - 1} more`,
      });
    } else {
      toast({
        title: "No face detected",
        description: "Please ensure your face is clearly visible and try again",
        variant: "destructive",
      });
    }
  };

  const handleUploadImages = async (images: string[]) => {
    if (capturedSamples.length >= MAX_SAMPLES) return;
    
    setProcessingImage(true);
    let successCount = 0;
    
    for (const img of images) {
      if (capturedSamples.length + successCount >= MAX_SAMPLES) break;
      
      const sample = await processImage(img);
      if (sample) {
        setCapturedSamples((prev) => [...prev, sample]);
        successCount++;
      }
    }
    
    setProcessingImage(false);
    
    if (successCount > 0) {
      toast({
        title: `${successCount} face(s) detected`,
        description: `Total: ${capturedSamples.length + successCount} samples`,
      });
    } else {
      toast({
        title: "No faces detected",
        description: "Please ensure faces are clearly visible in the images",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = (values: RegisterFormValues) => {
    if (capturedSamples.length < MIN_SAMPLES) {
      toast({
        title: "Not enough samples",
        description: `Please capture at least ${MIN_SAMPLES} face samples`,
        variant: "destructive",
      });
      return;
    }

    registerMutation.mutate({
      ...values,
      embeddings: capturedSamples.map((s) => s.embedding),
    });
  };

  const progress = (capturedSamples.length / MIN_SAMPLES) * 100;
  const isReady = capturedSamples.length >= MIN_SAMPLES && !modelsLoading;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 md:px-8">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold" data-testid="text-page-title">
          Register Person
        </h1>
        <p className="mt-1 text-muted-foreground">
          Add a new person to the system by capturing their face samples
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Camera className="h-5 w-5" />
                Capture Face Samples
              </CardTitle>
              <CardDescription>
                Capture {MIN_SAMPLES}-{MAX_SAMPLES} photos of the person's face from different angles
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
                      onCapture={handleWebcamCapture}
                      isCapturing={processingImage || registerMutation.isPending}
                    />
                    {processingImage && (
                      <div className="mt-4 flex items-center gap-2 justify-center text-sm text-muted-foreground">
                        <Scan className="h-4 w-4 animate-pulse" />
                        Detecting face...
                      </div>
                    )}
                  </TabsContent>
                  <TabsContent value="upload" className="mt-4">
                    <ImageUpload
                      onUpload={handleUploadImages}
                      multiple
                      maxFiles={MAX_SAMPLES - capturedSamples.length}
                    />
                    {processingImage && (
                      <div className="mt-4 flex items-center gap-2 justify-center text-sm text-muted-foreground">
                        <Scan className="h-4 w-4 animate-pulse" />
                        Processing images...
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between gap-4">
                <span>Sample Progress</span>
                <span className="text-sm font-normal text-muted-foreground">
                  {capturedSamples.length} / {MIN_SAMPLES} minimum
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Progress value={Math.min(progress, 100)} className="h-3" />
              <div className="mt-4 flex items-center gap-2">
                {isReady ? (
                  <>
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span className="text-sm text-green-600 dark:text-green-400">
                      Ready to register! You can add more samples for better accuracy.
                    </span>
                  </>
                ) : modelsLoading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      Loading face detection models...
                    </span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-5 w-5 text-amber-500" />
                    <span className="text-sm text-amber-600 dark:text-amber-400">
                      Need {MIN_SAMPLES - capturedSamples.length} more sample(s)
                    </span>
                  </>
                )}
              </div>
              {capturedSamples.length > 0 && (
                <div className="mt-4 grid grid-cols-5 gap-2">
                  {capturedSamples.slice(0, 10).map((sample, idx) => (
                    <div key={idx} className="aspect-square overflow-hidden rounded-md relative">
                      <img
                        src={sample.imageData}
                        alt={`Sample ${idx + 1}`}
                        className="h-full w-full object-cover"
                      />
                      <div className="absolute bottom-0 left-0 right-0 bg-green-500/80 text-white text-xs text-center py-0.5">
                        Face OK
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {capturedSamples.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4"
                  onClick={() => setCapturedSamples([])}
                  data-testid="button-clear-samples"
                >
                  Clear All Samples
                </Button>
              )}
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="h-5 w-5" />
                Person Details
              </CardTitle>
              <CardDescription>
                Enter the person's information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="personId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Person ID</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g., EMP001"
                            {...field}
                            data-testid="input-person-id"
                          />
                        </FormControl>
                        <FormDescription>
                          Unique identifier (letters, numbers, hyphens, underscores)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="fullName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g., John Smith"
                            {...field}
                            data-testid="input-full-name"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="role"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Role / Department (Optional)</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g., Engineering"
                            {...field}
                            data-testid="input-role"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    className="w-full"
                    size="lg"
                    disabled={!isReady || registerMutation.isPending}
                    data-testid="button-register"
                  >
                    {registerMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Registering...
                      </>
                    ) : (
                      <>
                        <UserPlus className="mr-2 h-4 w-4" />
                        Register Person
                      </>
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
