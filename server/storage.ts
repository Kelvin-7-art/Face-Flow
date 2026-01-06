import {
  people,
  attendance,
  type Person,
  type InsertPerson,
  type Attendance,
  type InsertAttendance,
  type DashboardStats,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, gte, and, sql } from "drizzle-orm";

export interface IStorage {
  getAllPeople(): Promise<Person[]>;
  getPerson(personId: string): Promise<Person | undefined>;
  createPerson(person: InsertPerson): Promise<Person>;
  deletePerson(personId: string): Promise<void>;
  
  getAllAttendance(): Promise<Attendance[]>;
  getRecentAttendanceByPerson(personId: string, minutes: number): Promise<Attendance | undefined>;
  createAttendance(record: InsertAttendance): Promise<Attendance>;
  
  getStats(): Promise<DashboardStats>;
}

export class DatabaseStorage implements IStorage {
  async getAllPeople(): Promise<Person[]> {
    return db.select().from(people).orderBy(desc(people.createdAt));
  }

  async getPerson(personId: string): Promise<Person | undefined> {
    const [person] = await db.select().from(people).where(eq(people.personId, personId));
    return person || undefined;
  }

  async createPerson(person: InsertPerson): Promise<Person> {
    const [created] = await db.insert(people).values(person).returning();
    return created;
  }

  async deletePerson(personId: string): Promise<void> {
    await db.delete(people).where(eq(people.personId, personId));
  }

  async getAllAttendance(): Promise<Attendance[]> {
    return db.select().from(attendance).orderBy(desc(attendance.timestamp));
  }

  async getRecentAttendanceByPerson(personId: string, minutes: number): Promise<Attendance | undefined> {
    const cutoff = new Date(Date.now() - minutes * 60 * 1000);
    const [record] = await db
      .select()
      .from(attendance)
      .where(and(eq(attendance.personId, personId), gte(attendance.timestamp, cutoff)))
      .orderBy(desc(attendance.timestamp))
      .limit(1);
    return record || undefined;
  }

  async createAttendance(record: InsertAttendance): Promise<Attendance> {
    const [created] = await db.insert(attendance).values(record).returning();
    return created;
  }

  async getStats(): Promise<DashboardStats> {
    const [peopleCount] = await db.select({ count: sql<number>`count(*)` }).from(people);
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const [todayCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(attendance)
      .where(gte(attendance.timestamp, today));
    
    const recentActivity = await db
      .select()
      .from(attendance)
      .orderBy(desc(attendance.timestamp))
      .limit(5);

    return {
      totalPeople: Number(peopleCount?.count ?? 0),
      todayAttendance: Number(todayCount?.count ?? 0),
      recentActivity,
    };
  }
}

export const storage = new DatabaseStorage();
