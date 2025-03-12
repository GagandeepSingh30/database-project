-- PostgreSQL schema for Helpdesk Application

-- Create Offices table
CREATE TABLE "Offices" (
  "id" SERIAL PRIMARY KEY,
  "name" VARCHAR(255) NOT NULL UNIQUE,
  "location" VARCHAR(255) NOT NULL,
  "address" VARCHAR(255) NOT NULL,
  "phone" VARCHAR(50),
  "isActive" BOOLEAN DEFAULT TRUE,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create Users table
CREATE TABLE "Users" (
  "id" SERIAL PRIMARY KEY,
  "firstName" VARCHAR(255) NOT NULL,
  "lastName" VARCHAR(255) NOT NULL,
  "email" VARCHAR(255) NOT NULL UNIQUE,
  "password" VARCHAR(255) NOT NULL,
  "role" VARCHAR(20) NOT NULL CHECK ("role" IN ('helpdesk', 'technician', 'manager')),
  "officeId" INTEGER REFERENCES "Offices"("id") ON DELETE SET NULL,
  "isActive" BOOLEAN DEFAULT TRUE,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create Equipment table
CREATE TABLE "Equipment" (
  "id" SERIAL PRIMARY KEY,
  "name" VARCHAR(255) NOT NULL,
  "type" VARCHAR(20) NOT NULL CHECK ("type" IN ('computer', 'printer', 'phone', 'network', 'server', 'other')),
  "serialNumber" VARCHAR(255) UNIQUE,
  "model" VARCHAR(255),
  "purchaseDate" DATE,
  "warrantyExpiration" DATE,
  "status" VARCHAR(20) NOT NULL DEFAULT 'active' CHECK ("status" IN ('active', 'maintenance', 'retired')),
  "notes" TEXT,
  "officeId" INTEGER NOT NULL REFERENCES "Offices"("id") ON DELETE CASCADE,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create Tickets table
CREATE TABLE "Tickets" (
  "id" SERIAL PRIMARY KEY,
  "title" VARCHAR(255) NOT NULL,
  "description" TEXT NOT NULL,
  "priority" VARCHAR(20) NOT NULL DEFAULT 'medium' CHECK ("priority" IN ('low', 'medium', 'high', 'critical')),
  "status" VARCHAR(20) NOT NULL DEFAULT 'open' CHECK ("status" IN ('open', 'assigned', 'in_progress', 'on_hold', 'resolved', 'closed')),
  "resolutionNotes" TEXT,
  "resolvedAt" TIMESTAMP WITH TIME ZONE,
  "closedAt" TIMESTAMP WITH TIME ZONE,
  "createdBy" INTEGER NOT NULL REFERENCES "Users"("id") ON DELETE CASCADE,
  "assignedTo" INTEGER REFERENCES "Users"("id") ON DELETE SET NULL,
  "equipmentId" INTEGER REFERENCES "Equipment"("id") ON DELETE SET NULL,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create Comments table
CREATE TABLE "Comments" (
  "id" SERIAL PRIMARY KEY,
  "content" TEXT NOT NULL,
  "isInternal" BOOLEAN DEFAULT FALSE,
  "ticketId" INTEGER NOT NULL REFERENCES "Tickets"("id") ON DELETE CASCADE,
  "userId" INTEGER NOT NULL REFERENCES "Users"("id") ON DELETE CASCADE,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX "idx_users_email" ON "Users"("email");
CREATE INDEX "idx_users_role" ON "Users"("role");
CREATE INDEX "idx_equipment_type" ON "Equipment"("type");
CREATE INDEX "idx_equipment_status" ON "Equipment"("status");
CREATE INDEX "idx_tickets_status" ON "Tickets"("status");
CREATE INDEX "idx_tickets_priority" ON "Tickets"("priority");
CREATE INDEX "idx_tickets_created_by" ON "Tickets"("createdBy");
CREATE INDEX "idx_tickets_assigned_to" ON "Tickets"("assignedTo");
CREATE INDEX "idx_comments_ticket" ON "Comments"("ticketId"); 