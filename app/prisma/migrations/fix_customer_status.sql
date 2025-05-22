-- Fix Customer Status Values Migration
-- Updates existing customer data to use uppercase status values

-- Update customer statuses from lowercase to uppercase
UPDATE "Customer" 
SET status = 'ACTIVE' 
WHERE status = 'active';

UPDATE "Customer" 
SET status = 'INACTIVE' 
WHERE status = 'inactive';

UPDATE "Customer" 
SET status = 'DELETED' 
WHERE status = 'deleted';

UPDATE "Customer" 
SET status = 'SUSPENDED' 
WHERE status = 'suspended';

-- Update customer types from lowercase to uppercase  
UPDATE "Customer" 
SET type = 'PRIVATE' 
WHERE type = 'private';

UPDATE "Customer" 
SET type = 'BUSINESS' 
WHERE type = 'business';

-- Update appointment statuses to be consistent
UPDATE "Appointment" 
SET status = 'PLANNED' 
WHERE status = 'planned';

UPDATE "Appointment" 
SET status = 'CONFIRMED' 
WHERE status = 'confirmed';

UPDATE "Appointment" 
SET status = 'COMPLETED' 
WHERE status = 'completed';

UPDATE "Appointment" 
SET status = 'CANCELLED' 
WHERE status = 'cancelled';

-- Update contact request statuses to be consistent
UPDATE "ContactRequest" 
SET status = 'NEW' 
WHERE status = 'new';

UPDATE "ContactRequest" 
SET status = 'IN_PROGRESS' 
WHERE status = 'in_progress';

UPDATE "ContactRequest" 
SET status = 'COMPLETED' 
WHERE status = 'completed';

UPDATE "ContactRequest" 
SET status = 'CANCELLED' 
WHERE status = 'cancelled';
