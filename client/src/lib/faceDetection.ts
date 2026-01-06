import * as faceapi from 'face-api.js';

const MODEL_URL = 'https://justadudewhohacks.github.io/face-api.js/models';

let modelsLoaded = false;
let loadingPromise: Promise<void> | null = null;

export async function loadModels(): Promise<void> {
  if (modelsLoaded) return;
  
  if (loadingPromise) {
    return loadingPromise;
  }
  
  loadingPromise = (async () => {
    try {
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
      ]);
      modelsLoaded = true;
    } catch (error) {
      console.error('Error loading face-api.js models:', error);
      throw error;
    }
  })();
  
  return loadingPromise;
}

export function areModelsLoaded(): boolean {
  return modelsLoaded;
}

export interface FaceDetectionResult {
  embedding: number[];
  bbox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

function toPlainObject(detection: faceapi.WithFaceDescriptor<faceapi.WithFaceLandmarks<{ detection: faceapi.FaceDetection }>>): FaceDetectionResult {
  const embeddingArray: number[] = [];
  const descriptor = detection.descriptor;
  for (let i = 0; i < descriptor.length; i++) {
    embeddingArray.push(Number(descriptor[i]));
  }
  
  return {
    embedding: embeddingArray,
    bbox: {
      x: Number(detection.detection.box.x),
      y: Number(detection.detection.box.y),
      width: Number(detection.detection.box.width),
      height: Number(detection.detection.box.height),
    },
  };
}

export async function detectFace(imageSource: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement): Promise<FaceDetectionResult | null> {
  if (!modelsLoaded) {
    await loadModels();
  }
  
  const detection = await faceapi
    .detectSingleFace(imageSource, new faceapi.TinyFaceDetectorOptions())
    .withFaceLandmarks()
    .withFaceDescriptor();
  
  if (!detection) {
    return null;
  }
  
  return toPlainObject(detection);
}

export async function detectMultipleFaces(imageSource: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement): Promise<FaceDetectionResult[]> {
  if (!modelsLoaded) {
    await loadModels();
  }
  
  const detections = await faceapi
    .detectAllFaces(imageSource, new faceapi.TinyFaceDetectorOptions())
    .withFaceLandmarks()
    .withFaceDescriptors();
  
  return detections.map(toPlainObject);
}

export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;
  
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  
  const magnitude = Math.sqrt(normA) * Math.sqrt(normB);
  if (magnitude === 0) return 0;
  
  return dotProduct / magnitude;
}

export async function imageDataUrlToImage(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = dataUrl;
  });
}

export async function extractEmbeddingFromDataUrl(dataUrl: string): Promise<FaceDetectionResult | null> {
  const img = await imageDataUrlToImage(dataUrl);
  return detectFace(img);
}
