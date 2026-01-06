import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertPersonSchema, insertAttendanceSchema } from "@shared/schema";
import type { RecognitionResult } from "@shared/schema";

const COOLDOWN_MINUTES = 5;

function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

function cosineDistance(a: number[], b: number[]): number {
  return 1 - cosineSimilarity(a, b);
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  app.get("/api/stats", async (_req, res) => {
    try {
      const stats = await storage.getStats();
      res.json(stats);
    } catch (error) {
      console.error("Error getting stats:", error);
      res.status(500).json({ error: "Failed to get statistics" });
    }
  });

  app.get("/api/people", async (_req, res) => {
    try {
      const people = await storage.getAllPeople();
      const safepeople = people.map(({ embedding, ...rest }) => rest);
      res.json(safepeople);
    } catch (error) {
      console.error("Error getting people:", error);
      res.status(500).json({ error: "Failed to get people" });
    }
  });

  app.post("/api/people", async (req, res) => {
    try {
      const { personId, fullName, role, embeddings } = req.body;

      if (!personId || !fullName || !embeddings || !Array.isArray(embeddings) || embeddings.length < 1) {
        return res.status(400).json({ error: "Person ID, full name, and at least 1 face embedding are required" });
      }

      if (!/^[a-zA-Z0-9_-]+$/.test(personId)) {
        return res.status(400).json({ error: "Person ID can only contain letters, numbers, hyphens, and underscores" });
      }

      const existing = await storage.getPerson(personId);
      if (existing) {
        return res.status(409).json({ error: "Person with this ID already exists" });
      }

      const validEmbeddings = embeddings.filter((e: unknown) => 
        Array.isArray(e) && e.length === 128 && e.every((v: unknown) => typeof v === 'number')
      ) as number[][];

      if (validEmbeddings.length === 0) {
        return res.status(400).json({ error: "No valid face embeddings provided" });
      }

      const averageEmbedding = Array(128).fill(0);
      for (const emb of validEmbeddings) {
        for (let i = 0; i < 128; i++) {
          averageEmbedding[i] += emb[i] / validEmbeddings.length;
        }
      }
      
      const personData = {
        personId,
        fullName,
        role: role || null,
        embedding: JSON.stringify(averageEmbedding),
        sampleCount: validEmbeddings.length,
      };

      const result = insertPersonSchema.safeParse(personData);
      if (!result.success) {
        return res.status(400).json({ error: result.error.message });
      }

      const person = await storage.createPerson(personData);
      res.status(201).json({ success: true, personId: person.personId });
    } catch (error) {
      console.error("Error creating person:", error);
      res.status(500).json({ error: "Failed to register person" });
    }
  });

  app.delete("/api/people/:personId", async (req, res) => {
    try {
      const { personId } = req.params;
      
      if (!personId || !/^[a-zA-Z0-9_-]+$/.test(personId)) {
        return res.status(400).json({ error: "Invalid person ID" });
      }

      const existing = await storage.getPerson(personId);
      if (!existing) {
        return res.status(404).json({ error: "Person not found" });
      }

      await storage.deletePerson(personId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting person:", error);
      res.status(500).json({ error: "Failed to delete person" });
    }
  });

  app.get("/api/attendance", async (_req, res) => {
    try {
      const logs = await storage.getAllAttendance();
      res.json(logs);
    } catch (error) {
      console.error("Error getting attendance:", error);
      res.status(500).json({ error: "Failed to get attendance logs" });
    }
  });

  app.post("/api/attendance/check", async (req, res) => {
    try {
      const { embeddings, threshold = 0.5 } = req.body;

      if (!embeddings || !Array.isArray(embeddings) || embeddings.length === 0) {
        return res.status(400).json({ error: "At least one face embedding is required" });
      }

      const people = await storage.getAllPeople();
      const results: RecognitionResult[] = [];

      for (const faceData of embeddings) {
        const { embedding, bbox } = faceData as { embedding: number[]; bbox: { x: number; y: number; width: number; height: number } };

        if (!embedding || !Array.isArray(embedding) || embedding.length !== 128 || !embedding.every(v => typeof v === 'number' && !isNaN(v))) {
          console.warn("Invalid embedding received:", typeof embedding, Array.isArray(embedding) ? embedding.length : 'not array');
          continue;
        }

        if (people.length === 0) {
          results.push({
            personId: "",
            fullName: "",
            distance: 1,
            bbox: bbox || { x: 0, y: 0, width: 0, height: 0 },
            isNew: false,
          });
          continue;
        }

        let bestMatch: { person: typeof people[0]; distance: number } | null = null;

        for (const person of people) {
          try {
            const storedEmbedding = JSON.parse(person.embedding) as number[];
            const distance = cosineDistance(embedding, storedEmbedding);
            
            if (!bestMatch || distance < bestMatch.distance) {
              bestMatch = { person, distance };
            }
          } catch (e) {
            console.error(`Error parsing embedding for ${person.personId}:`, e);
          }
        }

        if (bestMatch && bestMatch.distance <= threshold) {
          const recentAttendance = await storage.getRecentAttendanceByPerson(
            bestMatch.person.personId,
            COOLDOWN_MINUTES
          );

          const isNew = !recentAttendance;

          if (isNew) {
            await storage.createAttendance({
              personId: bestMatch.person.personId,
              fullName: bestMatch.person.fullName,
              distance: bestMatch.distance,
            });
          }

          results.push({
            personId: bestMatch.person.personId,
            fullName: bestMatch.person.fullName,
            distance: bestMatch.distance,
            bbox: bbox || { x: 0, y: 0, width: 0, height: 0 },
            isNew,
          });
        } else {
          results.push({
            personId: "",
            fullName: "",
            distance: bestMatch?.distance ?? 1,
            bbox: bbox || { x: 0, y: 0, width: 0, height: 0 },
            isNew: false,
          });
        }
      }

      res.json(results);
    } catch (error) {
      console.error("Error checking attendance:", error);
      res.status(500).json({ error: "Failed to process attendance check" });
    }
  });

  return httpServer;
}
