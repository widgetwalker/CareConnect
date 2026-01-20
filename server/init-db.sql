-- CareConnect Database Schema
-- Run this in Supabase SQL Editor to create all required tables

-- Better Auth Tables
CREATE TABLE IF NOT EXISTS "user" (
  "id" TEXT PRIMARY KEY,
  "name" TEXT NOT NULL,
  "email" TEXT NOT NULL UNIQUE,
  "email_verified" BOOLEAN NOT NULL DEFAULT false,
  "image" TEXT,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "session" (
  "id" TEXT PRIMARY KEY,
  "expires_at" TIMESTAMPTZ NOT NULL,
  "token" TEXT NOT NULL UNIQUE,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "ip_address" TEXT,
  "user_agent" TEXT,
  "user_id" TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS "account" (
  "id" TEXT PRIMARY KEY,
  "account_id" TEXT NOT NULL,
  "provider_id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "access_token" TEXT,
  "refresh_token" TEXT,
  "id_token" TEXT,
  "access_token_expires_at" TIMESTAMPTZ,
  "refresh_token_expires_at" TIMESTAMPTZ,
  "scope" TEXT,
  "password" TEXT,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "verification" (
  "id" TEXT PRIMARY KEY,
  "identifier" TEXT NOT NULL,
  "value" TEXT NOT NULL,
  "expires_at" TIMESTAMPTZ NOT NULL,
  "created_at" TIMESTAMPTZ,
  "updated_at" TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS "ratelimit" (
  "id" TEXT PRIMARY KEY,
  "key" TEXT NOT NULL,
  "count" INTEGER NOT NULL DEFAULT 0,
  "last_request" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Health & Wellness Tables
CREATE TABLE IF NOT EXISTS "specialties" (
  "id" TEXT PRIMARY KEY,
  "name" TEXT NOT NULL,
  "icon" TEXT
);

CREATE TABLE IF NOT EXISTS "doctors" (
  "id" TEXT PRIMARY KEY,
  "name" TEXT NOT NULL,
  "specialty_id" TEXT REFERENCES "specialties"("id"),
  "rating" TEXT,
  "bio" TEXT,
  "experience" TEXT,
  "availability" TEXT,
  "image" TEXT,
  "consultation_fee" INTEGER
);

CREATE TABLE IF NOT EXISTS "medicines" (
  "id" TEXT PRIMARY KEY,
  "name" TEXT NOT NULL,
  "category" TEXT,
  "price" INTEGER NOT NULL,
  "description" TEXT,
  "image" TEXT,
  "stock" INTEGER NOT NULL DEFAULT 100
);

CREATE TABLE IF NOT EXISTS "appointments" (
  "id" TEXT PRIMARY KEY,
  "user_id" TEXT REFERENCES "user"("id") NOT NULL,
  "doctor_id" TEXT REFERENCES "doctors"("id") NOT NULL,
  "date" TIMESTAMPTZ NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'scheduled',
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "cart_items" (
  "id" TEXT PRIMARY KEY,
  "user_id" TEXT REFERENCES "user"("id") NOT NULL,
  "medicine_id" TEXT REFERENCES "medicines"("id") NOT NULL,
  "quantity" INTEGER NOT NULL DEFAULT 1,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_session_user_id ON "session"("user_id");
CREATE INDEX IF NOT EXISTS idx_account_user_id ON "account"("user_id");
CREATE INDEX IF NOT EXISTS idx_appointments_user_id ON "appointments"("user_id");
CREATE INDEX IF NOT EXISTS idx_appointments_doctor_id ON "appointments"("doctor_id");
CREATE INDEX IF NOT EXISTS idx_cart_items_user_id ON "cart_items"("user_id");
