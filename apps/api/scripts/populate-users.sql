-- First, delete all existing users
DELETE FROM users;

-- Generate 100 users
WITH RECURSIVE numbers AS (
  SELECT 1 as n
  UNION ALL
  SELECT n + 1 FROM numbers WHERE n < 100
)
INSERT INTO users (id, email, firstName, lastName, phoneNumber, role, status, createdAt, updatedAt)
VALUES
  (
    '00000000-0000-0000-0000-000000000000',
    'admin@example.com',
    'Admin',
    'User',
    '+1234567890',
    'admin',
    'active',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  );
