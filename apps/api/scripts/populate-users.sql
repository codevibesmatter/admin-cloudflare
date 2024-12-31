-- First, delete all existing users
DELETE FROM users;

-- Generate 100 users
WITH RECURSIVE numbers AS (
  SELECT 1 as n
  UNION ALL
  SELECT n + 1 FROM numbers WHERE n < 100
)
INSERT INTO users (id, username, email, firstName, lastName, phoneNumber, role, status, createdAt, updatedAt)
SELECT 
  lower(hex(randomblob(4)) || '-' || hex(randomblob(2)) || '-4' || 
    substr(hex(randomblob(2)), 2) || '-' || 
    substr('89ab', abs(random() % 4) + 1, 1) || 
    substr(hex(randomblob(2)), 2) || '-' || 
    hex(randomblob(6))), -- UUID v4
  lower(
    CASE (abs(random()) % 10)
      WHEN 0 THEN 'john'
      WHEN 1 THEN 'jane'
      WHEN 2 THEN 'michael'
      WHEN 3 THEN 'emily'
      WHEN 4 THEN 'david'
      WHEN 5 THEN 'sarah'
      WHEN 6 THEN 'james'
      WHEN 7 THEN 'emma'
      WHEN 8 THEN 'william'
      WHEN 9 THEN 'olivia'
    END ||
    CASE (abs(random()) % 10)
      WHEN 0 THEN 'smith'
      WHEN 1 THEN 'johnson'
      WHEN 2 THEN 'williams'
      WHEN 3 THEN 'brown'
      WHEN 4 THEN 'jones'
      WHEN 5 THEN 'garcia'
      WHEN 6 THEN 'miller'
      WHEN 7 THEN 'davis'
      WHEN 8 THEN 'rodriguez'
      WHEN 9 THEN 'martinez'
    END || n
  ) as username,
  lower(
    CASE (abs(random()) % 10)
      WHEN 0 THEN 'john'
      WHEN 1 THEN 'jane'
      WHEN 2 THEN 'michael'
      WHEN 3 THEN 'emily'
      WHEN 4 THEN 'david'
      WHEN 5 THEN 'sarah'
      WHEN 6 THEN 'james'
      WHEN 7 THEN 'emma'
      WHEN 8 THEN 'william'
      WHEN 9 THEN 'olivia'
    END || '.' ||
    CASE (abs(random()) % 10)
      WHEN 0 THEN 'smith'
      WHEN 1 THEN 'johnson'
      WHEN 2 THEN 'williams'
      WHEN 3 THEN 'brown'
      WHEN 4 THEN 'jones'
      WHEN 5 THEN 'garcia'
      WHEN 6 THEN 'miller'
      WHEN 7 THEN 'davis'
      WHEN 8 THEN 'rodriguez'
      WHEN 9 THEN 'martinez'
    END || n ||
    CASE (abs(random()) % 5)
      WHEN 0 THEN '@example.com'
      WHEN 1 THEN '@test.com'
      WHEN 2 THEN '@mockdata.com'
      WHEN 3 THEN '@demo.org'
      WHEN 4 THEN '@sample.net'
    END
  ) as email,
  CASE (abs(random()) % 10)
    WHEN 0 THEN 'John'
    WHEN 1 THEN 'Jane'
    WHEN 2 THEN 'Michael'
    WHEN 3 THEN 'Emily'
    WHEN 4 THEN 'David'
    WHEN 5 THEN 'Sarah'
    WHEN 6 THEN 'James'
    WHEN 7 THEN 'Emma'
    WHEN 8 THEN 'William'
    WHEN 9 THEN 'Olivia'
  END as firstName,
  CASE (abs(random()) % 10)
    WHEN 0 THEN 'Smith'
    WHEN 1 THEN 'Johnson'
    WHEN 2 THEN 'Williams'
    WHEN 3 THEN 'Brown'
    WHEN 4 THEN 'Jones'
    WHEN 5 THEN 'Garcia'
    WHEN 6 THEN 'Miller'
    WHEN 7 THEN 'Davis'
    WHEN 8 THEN 'Rodriguez'
    WHEN 9 THEN 'Martinez'
  END as lastName,
  '+1-' || 
  substr('0123456789', abs(random() % 10) + 1, 1) ||
  substr('0123456789', abs(random() % 10) + 1, 1) ||
  substr('0123456789', abs(random() % 10) + 1, 1) || '-' ||
  substr('0123456789', abs(random() % 10) + 1, 1) ||
  substr('0123456789', abs(random() % 10) + 1, 1) ||
  substr('0123456789', abs(random() % 10) + 1, 1) || '-' ||
  substr('0123456789', abs(random() % 10) + 1, 1) ||
  substr('0123456789', abs(random() % 10) + 1, 1) ||
  substr('0123456789', abs(random() % 10) + 1, 1) ||
  substr('0123456789', abs(random() % 10) + 1, 1) as phoneNumber,
  CASE (abs(random()) % 4)
    WHEN 0 THEN 'superadmin'
    WHEN 1 THEN 'admin'
    WHEN 2 THEN 'cashier'
    WHEN 3 THEN 'manager'
  END as role,
  CASE (abs(random()) % 4)
    WHEN 0 THEN 'active'
    WHEN 1 THEN 'inactive'
    WHEN 2 THEN 'invited'
    WHEN 3 THEN 'suspended'
  END as status,
  datetime('now') as createdAt,
  datetime('now') as updatedAt
FROM numbers;
