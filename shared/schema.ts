import { pgTable, text, varchar, real, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const people = pgTable("people", {
  personId: varchar("person_id", { length: 50 }).primaryKey(),
  fullName: text("full_name").notNull(),
  role: text("role"),
  embedding: text("embedding").notNull(),
  sampleCount: integer("sample_count").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const attendance = pgTable("attendance", {
  id: serial("id").primaryKey(),
  personId: varchar("person_id", { length: 50 }).notNull(),
  fullName: text("full_name").notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  distance: real("distance"),
});

export const insertPersonSchema = createInsertSchema(people).omit({
  createdAt: true,
});

export const insertAttendanceSchema = createInsertSchema(attendance).omit({
  id: true,
  timestamp: true,
});

export type InsertPerson = z.infer<typeof insertPersonSchema>;
export type Person = typeof people.$inferSelect;

export type InsertAttendance = z.infer<typeof insertAttendanceSchema>;
export type Attendance = typeof attendance.$inferSelect;

export interface RecognitionResult {
  personId: string;
  fullName: string;
  distance: number;
  bbox: { x: number; y: number; width: number; height: number };
  isNew: boolean;
}

export interface DashboardStats {
  totalPeople: number;
  todayAttendance: number;
  recentActivity: Attendance[];
}
