import { pgTable, text, boolean, timestamp, integer } from "drizzle-orm/pg-core";

// Better Auth schema matching our Supabase tables
export const usersAuth = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  role: text("role").notNull().default("patient"), // 'patient' or 'doctor'
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id").notNull(),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id").notNull(),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at", { withTimezone: true }),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at", { withTimezone: true }),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }),
  updatedAt: timestamp("updated_at", { withTimezone: true }),
});

export const ratelimit = pgTable("ratelimit", {
  id: text("id").primaryKey(),
  key: text("key").notNull(),
  count: integer("count").notNull().default(0),
  lastRequest: timestamp("last_request", { withTimezone: true }).notNull().defaultNow(),
});

// Health & Wellness Tables
export const specialties = pgTable("specialties", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  icon: text("icon"),
});

export const doctors = pgTable("doctors", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  specialtyId: text("specialty_id").references(() => specialties.id),
  rating: text("rating"),
  bio: text("bio"),
  experience: text("experience"),
  availability: text("availability"), // e.g., "Online", "Away"
  image: text("image"),
  consultationFee: integer("consultation_fee"),
});

export const medicines = pgTable("medicines", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  category: text("category"),
  price: integer("price").notNull(),
  description: text("description"),
  image: text("image"),
  stock: integer("stock").notNull().default(100),
});

export const appointments = pgTable("appointments", {
  id: text("id").primaryKey(),
  userId: text("user_id").references(() => usersAuth.id).notNull(),
  doctorId: text("doctor_id").references(() => doctors.id).notNull(),
  date: timestamp("date", { withTimezone: true }).notNull(),
  status: text("status").notNull().default("scheduled"), // scheduled, completed, cancelled
  createdAt: timestamp("createdAt", { withTimezone: true }).notNull().defaultNow(),
});

export const cartItems = pgTable("cart_items", {
  id: text("id").primaryKey(),
  userId: text("user_id").references(() => usersAuth.id).notNull(),
  medicineId: text("medicine_id").references(() => medicines.id).notNull(),
  quantity: integer("quantity").notNull().default(1),
  createdAt: timestamp("createdAt", { withTimezone: true }).notNull().defaultNow(),
});

// Doctor Profiles - Extended information for doctor accounts
export const doctorProfiles = pgTable("doctor_profiles", {
  id: text("id").primaryKey(),
  userId: text("user_id").references(() => usersAuth.id).notNull().unique(), // Links to user account
  doctorId: text("doctor_id").references(() => doctors.id), // Links to existing doctors if migrating
  speciality: text("speciality").notNull(),
  description: text("description"),
  location: text("location").notNull(),
  experience: text("experience").notNull(), // e.g., "10 years"
  fee: integer("fee").notNull(), // Consultation fee
  qualifications: text("qualifications"), // degrees, certifications
  availableFrom: text("available_from"), // e.g., "9:00 AM"
  availableTo: text("available_to"), // e.g., "5:00 PM"
  rating: text("rating").default("4.5"),
  isVerified: boolean("is_verified").default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// Prescriptions - Doctors can send prescriptions to patients
export const prescriptions = pgTable("prescriptions", {
  id: text("id").primaryKey(),
  appointmentId: text("appointment_id").references(() => appointments.id).notNull(),
  doctorId: text("doctor_id").references(() => usersAuth.id).notNull(), // Doctor who created it
  patientId: text("patient_id").references(() => usersAuth.id).notNull(),
  diagnosis: text("diagnosis"),
  medicines: text("medicines").notNull(), // JSON string of medicines
  instructions: text("instructions"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// Medical Records - Patients can upload medical history
export const medicalRecords = pgTable("medical_records", {
  id: text("id").primaryKey(),
  patientId: text("patient_id").references(() => usersAuth.id).notNull(),
  title: text("title").notNull(),
  description: text("description"),
  fileUrl: text("file_url").notNull(), // URL to stored document
  fileType: text("file_type"), // pdf, jpg, png, etc.
  uploadedAt: timestamp("uploaded_at", { withTimezone: true }).notNull().defaultNow(),
});

// Notifications - System for appointment updates and communications
export const notifications = pgTable("notifications", {
  id: text("id").primaryKey(),
  userId: text("user_id").references(() => usersAuth.id).notNull(), // Receiver
  type: text("type").notNull(), // 'appointment_booked', 'appointment_cancelled', 'appointment_rescheduled', 'prescription_received'
  title: text("title").notNull(),
  message: text("message").notNull(),
  relatedId: text("related_id"), // ID of related appointment, prescription, etc.
  isRead: boolean("is_read").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

