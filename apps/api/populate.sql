-- First batch of users (most recent)
INSERT INTO users (id, email, first_name, last_name, role, status, created_at, updated_at)
VALUES 
  ('1', 'sarah.rodriguez@example.com', 'Sarah', 'Rodriguez', 'superadmin', 'active', strftime('%Y-%m-%d %H:%M:%S', 'now'), strftime('%Y-%m-%d %H:%M:%S', 'now')),
  ('2', 'emma.johnson@example.com', 'Emma', 'Johnson', 'admin', 'active', strftime('%Y-%m-%d %H:%M:%S', 'now', '-5 minutes'), strftime('%Y-%m-%d %H:%M:%S', 'now', '-5 minutes')),
  ('3', 'michael.brown@example.com', 'Michael', 'Brown', 'manager', 'inactive', strftime('%Y-%m-%d %H:%M:%S', 'now', '-10 minutes'), strftime('%Y-%m-%d %H:%M:%S', 'now', '-10 minutes')),
  ('4', 'olivia.davis@example.com', 'Olivia', 'Davis', 'cashier', 'invited', strftime('%Y-%m-%d %H:%M:%S', 'now', '-15 minutes'), strftime('%Y-%m-%d %H:%M:%S', 'now', '-15 minutes')),
  ('5', 'william.miller@example.com', 'William', 'Miller', 'superadmin', 'active', strftime('%Y-%m-%d %H:%M:%S', 'now', '-20 minutes'), strftime('%Y-%m-%d %H:%M:%S', 'now', '-20 minutes'));

-- Second batch
INSERT INTO users (id, email, first_name, last_name, role, status, created_at, updated_at)
VALUES 
  ('6', 'ava.wilson@example.com', 'Ava', 'Wilson', 'admin', 'inactive', strftime('%Y-%m-%d %H:%M:%S', 'now', '-25 minutes'), strftime('%Y-%m-%d %H:%M:%S', 'now', '-25 minutes')),
  ('7', 'james.anderson@example.com', 'James', 'Anderson', 'manager', 'invited', strftime('%Y-%m-%d %H:%M:%S', 'now', '-30 minutes'), strftime('%Y-%m-%d %H:%M:%S', 'now', '-30 minutes')),
  ('8', 'sophia.taylor@example.com', 'Sophia', 'Taylor', 'cashier', 'active', strftime('%Y-%m-%d %H:%M:%S', 'now', '-35 minutes'), strftime('%Y-%m-%d %H:%M:%S', 'now', '-35 minutes')),
  ('9', 'benjamin.thomas@example.com', 'Benjamin', 'Thomas', 'superadmin', 'inactive', strftime('%Y-%m-%d %H:%M:%S', 'now', '-40 minutes'), strftime('%Y-%m-%d %H:%M:%S', 'now', '-40 minutes')),
  ('10', 'isabella.moore@example.com', 'Isabella', 'Moore', 'admin', 'invited', strftime('%Y-%m-%d %H:%M:%S', 'now', '-45 minutes'), strftime('%Y-%m-%d %H:%M:%S', 'now', '-45 minutes'));

-- Third batch
INSERT INTO users (id, email, first_name, last_name, role, status, created_at, updated_at)
VALUES 
  ('11', 'lucas.jackson@example.com', 'Lucas', 'Jackson', 'manager', 'active', strftime('%Y-%m-%d %H:%M:%S', 'now', '-50 minutes'), strftime('%Y-%m-%d %H:%M:%S', 'now', '-50 minutes')),
  ('12', 'mia.white@example.com', 'Mia', 'White', 'cashier', 'inactive', strftime('%Y-%m-%d %H:%M:%S', 'now', '-55 minutes'), strftime('%Y-%m-%d %H:%M:%S', 'now', '-55 minutes')),
  ('13', 'henry.harris@example.com', 'Henry', 'Harris', 'superadmin', 'invited', strftime('%Y-%m-%d %H:%M:%S', 'now', '-1 hours'), strftime('%Y-%m-%d %H:%M:%S', 'now', '-1 hours')),
  ('14', 'evelyn.martin@example.com', 'Evelyn', 'Martin', 'admin', 'active', strftime('%Y-%m-%d %H:%M:%S', 'now', '-65 minutes'), strftime('%Y-%m-%d %H:%M:%S', 'now', '-65 minutes')),
  ('15', 'alexander.thompson@example.com', 'Alexander', 'Thompson', 'manager', 'inactive', strftime('%Y-%m-%d %H:%M:%S', 'now', '-70 minutes'), strftime('%Y-%m-%d %H:%M:%S', 'now', '-70 minutes'));

-- Fourth batch
INSERT INTO users (id, email, first_name, last_name, role, status, created_at, updated_at)
VALUES 
  ('16', 'charlotte.garcia@example.com', 'Charlotte', 'Garcia', 'cashier', 'invited', strftime('%Y-%m-%d %H:%M:%S', 'now', '-75 minutes'), strftime('%Y-%m-%d %H:%M:%S', 'now', '-75 minutes')),
  ('17', 'daniel.martinez@example.com', 'Daniel', 'Martinez', 'superadmin', 'active', strftime('%Y-%m-%d %H:%M:%S', 'now', '-80 minutes'), strftime('%Y-%m-%d %H:%M:%S', 'now', '-80 minutes')),
  ('18', 'amelia.robinson@example.com', 'Amelia', 'Robinson', 'admin', 'inactive', strftime('%Y-%m-%d %H:%M:%S', 'now', '-85 minutes'), strftime('%Y-%m-%d %H:%M:%S', 'now', '-85 minutes')),
  ('19', 'sebastian.clark@example.com', 'Sebastian', 'Clark', 'manager', 'invited', strftime('%Y-%m-%d %H:%M:%S', 'now', '-90 minutes'), strftime('%Y-%m-%d %H:%M:%S', 'now', '-90 minutes')),
  ('20', 'harper.rodriguez@example.com', 'Harper', 'Rodriguez', 'cashier', 'active', strftime('%Y-%m-%d %H:%M:%S', 'now', '-95 minutes'), strftime('%Y-%m-%d %H:%M:%S', 'now', '-95 minutes'));

-- Fifth batch
INSERT INTO users (id, email, first_name, last_name, role, status, created_at, updated_at)
VALUES 
  ('21', 'ethan.lewis@example.com', 'Ethan', 'Lewis', 'superadmin', 'inactive', strftime('%Y-%m-%d %H:%M:%S', 'now', '-100 minutes'), strftime('%Y-%m-%d %H:%M:%S', 'now', '-100 minutes')),
  ('22', 'scarlett.lee@example.com', 'Scarlett', 'Lee', 'admin', 'invited', strftime('%Y-%m-%d %H:%M:%S', 'now', '-105 minutes'), strftime('%Y-%m-%d %H:%M:%S', 'now', '-105 minutes')),
  ('23', 'owen.walker@example.com', 'Owen', 'Walker', 'manager', 'active', strftime('%Y-%m-%d %H:%M:%S', 'now', '-110 minutes'), strftime('%Y-%m-%d %H:%M:%S', 'now', '-110 minutes')),
  ('24', 'victoria.hall@example.com', 'Victoria', 'Hall', 'cashier', 'inactive', strftime('%Y-%m-%d %H:%M:%S', 'now', '-115 minutes'), strftime('%Y-%m-%d %H:%M:%S', 'now', '-115 minutes')),
  ('25', 'joseph.allen@example.com', 'Joseph', 'Allen', 'superadmin', 'invited', strftime('%Y-%m-%d %H:%M:%S', 'now', '-120 minutes'), strftime('%Y-%m-%d %H:%M:%S', 'now', '-120 minutes'));

-- Sixth batch
INSERT INTO users (id, email, first_name, last_name, role, status, created_at, updated_at)
VALUES 
  ('26', 'elizabeth.young@example.com', 'Elizabeth', 'Young', 'admin', 'active', strftime('%Y-%m-%d %H:%M:%S', 'now', '-125 minutes'), strftime('%Y-%m-%d %H:%M:%S', 'now', '-125 minutes')),
  ('27', 'christopher.king@example.com', 'Christopher', 'King', 'manager', 'inactive', strftime('%Y-%m-%d %H:%M:%S', 'now', '-130 minutes'), strftime('%Y-%m-%d %H:%M:%S', 'now', '-130 minutes')),
  ('28', 'camila.wright@example.com', 'Camila', 'Wright', 'cashier', 'invited', strftime('%Y-%m-%d %H:%M:%S', 'now', '-135 minutes'), strftime('%Y-%m-%d %H:%M:%S', 'now', '-135 minutes')),
  ('29', 'david.lopez@example.com', 'David', 'Lopez', 'superadmin', 'active', strftime('%Y-%m-%d %H:%M:%S', 'now', '-140 minutes'), strftime('%Y-%m-%d %H:%M:%S', 'now', '-140 minutes')),
  ('30', 'madison.hill@example.com', 'Madison', 'Hill', 'admin', 'inactive', strftime('%Y-%m-%d %H:%M:%S', 'now', '-145 minutes'), strftime('%Y-%m-%d %H:%M:%S', 'now', '-145 minutes'));

-- Seventh batch
INSERT INTO users (id, email, first_name, last_name, role, status, created_at, updated_at)
VALUES 
  ('31', 'john.scott@example.com', 'John', 'Scott', 'manager', 'invited', strftime('%Y-%m-%d %H:%M:%S', 'now', '-150 minutes'), strftime('%Y-%m-%d %H:%M:%S', 'now', '-150 minutes')),
  ('32', 'avery.green@example.com', 'Avery', 'Green', 'cashier', 'active', strftime('%Y-%m-%d %H:%M:%S', 'now', '-155 minutes'), strftime('%Y-%m-%d %H:%M:%S', 'now', '-155 minutes')),
  ('33', 'sofia.adams@example.com', 'Sofia', 'Adams', 'superadmin', 'inactive', strftime('%Y-%m-%d %H:%M:%S', 'now', '-160 minutes'), strftime('%Y-%m-%d %H:%M:%S', 'now', '-160 minutes')),
  ('34', 'joseph.baker@example.com', 'Joseph', 'Baker', 'admin', 'invited', strftime('%Y-%m-%d %H:%M:%S', 'now', '-165 minutes'), strftime('%Y-%m-%d %H:%M:%S', 'now', '-165 minutes')),
  ('35', 'chloe.gonzalez@example.com', 'Chloe', 'Gonzalez', 'manager', 'active', strftime('%Y-%m-%d %H:%M:%S', 'now', '-170 minutes'), strftime('%Y-%m-%d %H:%M:%S', 'now', '-170 minutes'));

-- Eighth batch
INSERT INTO users (id, email, first_name, last_name, role, status, created_at, updated_at)
VALUES 
  ('36', 'andrew.nelson@example.com', 'Andrew', 'Nelson', 'cashier', 'inactive', strftime('%Y-%m-%d %H:%M:%S', 'now', '-175 minutes'), strftime('%Y-%m-%d %H:%M:%S', 'now', '-175 minutes')),
  ('37', 'grace.carter@example.com', 'Grace', 'Carter', 'superadmin', 'invited', strftime('%Y-%m-%d %H:%M:%S', 'now', '-180 minutes'), strftime('%Y-%m-%d %H:%M:%S', 'now', '-180 minutes')),
  ('38', 'julian.mitchell@example.com', 'Julian', 'Mitchell', 'admin', 'active', strftime('%Y-%m-%d %H:%M:%S', 'now', '-185 minutes'), strftime('%Y-%m-%d %H:%M:%S', 'now', '-185 minutes')),
  ('39', 'hannah.perez@example.com', 'Hannah', 'Perez', 'manager', 'inactive', strftime('%Y-%m-%d %H:%M:%S', 'now', '-190 minutes'), strftime('%Y-%m-%d %H:%M:%S', 'now', '-190 minutes')),
  ('40', 'christopher.roberts@example.com', 'Christopher', 'Roberts', 'cashier', 'invited', strftime('%Y-%m-%d %H:%M:%S', 'now', '-195 minutes'), strftime('%Y-%m-%d %H:%M:%S', 'now', '-195 minutes'));

-- Ninth batch
INSERT INTO users (id, email, first_name, last_name, role, status, created_at, updated_at)
VALUES 
  ('41', 'zoey.turner@example.com', 'Zoey', 'Turner', 'superadmin', 'active', strftime('%Y-%m-%d %H:%M:%S', 'now', '-200 minutes'), strftime('%Y-%m-%d %H:%M:%S', 'now', '-200 minutes')),
  ('42', 'gabriel.phillips@example.com', 'Gabriel', 'Phillips', 'admin', 'inactive', strftime('%Y-%m-%d %H:%M:%S', 'now', '-205 minutes'), strftime('%Y-%m-%d %H:%M:%S', 'now', '-205 minutes')),
  ('43', 'valentina.campbell@example.com', 'Valentina', 'Campbell', 'manager', 'invited', strftime('%Y-%m-%d %H:%M:%S', 'now', '-210 minutes'), strftime('%Y-%m-%d %H:%M:%S', 'now', '-210 minutes')),
  ('44', 'dylan.parker@example.com', 'Dylan', 'Parker', 'cashier', 'active', strftime('%Y-%m-%d %H:%M:%S', 'now', '-215 minutes'), strftime('%Y-%m-%d %H:%M:%S', 'now', '-215 minutes')),
  ('45', 'claire.evans@example.com', 'Claire', 'Evans', 'superadmin', 'inactive', strftime('%Y-%m-%d %H:%M:%S', 'now', '-220 minutes'), strftime('%Y-%m-%d %H:%M:%S', 'now', '-220 minutes'));

-- Tenth batch
INSERT INTO users (id, email, first_name, last_name, role, status, created_at, updated_at)
VALUES 
  ('46', 'nathan.edwards@example.com', 'Nathan', 'Edwards', 'admin', 'invited', strftime('%Y-%m-%d %H:%M:%S', 'now', '-225 minutes'), strftime('%Y-%m-%d %H:%M:%S', 'now', '-225 minutes')),
  ('47', 'audrey.collins@example.com', 'Audrey', 'Collins', 'manager', 'active', strftime('%Y-%m-%d %H:%M:%S', 'now', '-230 minutes'), strftime('%Y-%m-%d %H:%M:%S', 'now', '-230 minutes')),
  ('48', 'christopher.stewart@example.com', 'Christopher', 'Stewart', 'cashier', 'inactive', strftime('%Y-%m-%d %H:%M:%S', 'now', '-235 minutes'), strftime('%Y-%m-%d %H:%M:%S', 'now', '-235 minutes')),
  ('49', 'brooklyn.sanchez@example.com', 'Brooklyn', 'Sanchez', 'superadmin', 'invited', strftime('%Y-%m-%d %H:%M:%S', 'now', '-240 minutes'), strftime('%Y-%m-%d %H:%M:%S', 'now', '-240 minutes')),
  ('50', 'elijah.morris@example.com', 'Elijah', 'Morris', 'admin', 'active', strftime('%Y-%m-%d %H:%M:%S', 'now', '-245 minutes'), strftime('%Y-%m-%d %H:%M:%S', 'now', '-245 minutes'));

-- Eleventh batch
INSERT INTO users (id, email, first_name, last_name, role, status, created_at, updated_at)
VALUES 
  ('51', 'savannah.rogers@example.com', 'Savannah', 'Rogers', 'manager', 'inactive', strftime('%Y-%m-%d %H:%M:%S', 'now', '-250 minutes'), strftime('%Y-%m-%d %H:%M:%S', 'now', '-250 minutes')),
  ('52', 'adrian.reed@example.com', 'Adrian', 'Reed', 'cashier', 'invited', strftime('%Y-%m-%d %H:%M:%S', 'now', '-255 minutes'), strftime('%Y-%m-%d %H:%M:%S', 'now', '-255 minutes')),
  ('53', 'natalie.cook@example.com', 'Natalie', 'Cook', 'superadmin', 'active', strftime('%Y-%m-%d %H:%M:%S', 'now', '-260 minutes'), strftime('%Y-%m-%d %H:%M:%S', 'now', '-260 minutes')),
  ('54', 'kevin.morgan@example.com', 'Kevin', 'Morgan', 'admin', 'inactive', strftime('%Y-%m-%d %H:%M:%S', 'now', '-265 minutes'), strftime('%Y-%m-%d %H:%M:%S', 'now', '-265 minutes')),
  ('55', 'lily.bell@example.com', 'Lily', 'Bell', 'manager', 'invited', strftime('%Y-%m-%d %H:%M:%S', 'now', '-270 minutes'), strftime('%Y-%m-%d %H:%M:%S', 'now', '-270 minutes'));

-- Twelfth batch
INSERT INTO users (id, email, first_name, last_name, role, status, created_at, updated_at)
VALUES 
  ('56', 'brandon.murphy@example.com', 'Brandon', 'Murphy', 'cashier', 'active', strftime('%Y-%m-%d %H:%M:%S', 'now', '-275 minutes'), strftime('%Y-%m-%d %H:%M:%S', 'now', '-275 minutes')),
  ('57', 'anna.bailey@example.com', 'Anna', 'Bailey', 'superadmin', 'inactive', strftime('%Y-%m-%d %H:%M:%S', 'now', '-280 minutes'), strftime('%Y-%m-%d %H:%M:%S', 'now', '-280 minutes')),
  ('58', 'isaac.rivera@example.com', 'Isaac', 'Rivera', 'admin', 'invited', strftime('%Y-%m-%d %H:%M:%S', 'now', '-285 minutes'), strftime('%Y-%m-%d %H:%M:%S', 'now', '-285 minutes')),
  ('59', 'katherine.cooper@example.com', 'Katherine', 'Cooper', 'manager', 'active', strftime('%Y-%m-%d %H:%M:%S', 'now', '-290 minutes'), strftime('%Y-%m-%d %H:%M:%S', 'now', '-290 minutes')),
  ('60', 'thomas.richardson@example.com', 'Thomas', 'Richardson', 'cashier', 'inactive', strftime('%Y-%m-%d %H:%M:%S', 'now', '-295 minutes'), strftime('%Y-%m-%d %H:%M:%S', 'now', '-295 minutes'));

-- Thirteenth batch
INSERT INTO users (id, email, first_name, last_name, role, status, created_at, updated_at)
VALUES 
  ('61', 'madelyn.cox@example.com', 'Madelyn', 'Cox', 'superadmin', 'invited', strftime('%Y-%m-%d %H:%M:%S', 'now', '-300 minutes'), strftime('%Y-%m-%d %H:%M:%S', 'now', '-300 minutes')),
  ('62', 'joshua.howard@example.com', 'Joshua', 'Howard', 'admin', 'active', strftime('%Y-%m-%d %H:%M:%S', 'now', '-305 minutes'), strftime('%Y-%m-%d %H:%M:%S', 'now', '-305 minutes')),
  ('63', 'bella.ward@example.com', 'Bella', 'Ward', 'manager', 'inactive', strftime('%Y-%m-%d %H:%M:%S', 'now', '-310 minutes'), strftime('%Y-%m-%d %H:%M:%S', 'now', '-310 minutes')),
  ('64', 'ryan.torres@example.com', 'Ryan', 'Torres', 'cashier', 'invited', strftime('%Y-%m-%d %H:%M:%S', 'now', '-315 minutes'), strftime('%Y-%m-%d %H:%M:%S', 'now', '-315 minutes')),
  ('65', 'nora.peterson@example.com', 'Nora', 'Peterson', 'superadmin', 'active', strftime('%Y-%m-%d %H:%M:%S', 'now', '-320 minutes'), strftime('%Y-%m-%d %H:%M:%S', 'now', '-320 minutes'));

-- Fourteenth batch
INSERT INTO users (id, email, first_name, last_name, role, status, created_at, updated_at)
VALUES 
  ('66', 'christian.gray@example.com', 'Christian', 'Gray', 'admin', 'inactive', strftime('%Y-%m-%d %H:%M:%S', 'now', '-325 minutes'), strftime('%Y-%m-%d %H:%M:%S', 'now', '-325 minutes')),
  ('67', 'lucy.ramirez@example.com', 'Lucy', 'Ramirez', 'manager', 'invited', strftime('%Y-%m-%d %H:%M:%S', 'now', '-330 minutes'), strftime('%Y-%m-%d %H:%M:%S', 'now', '-330 minutes')),
  ('68', 'aaron.james@example.com', 'Aaron', 'James', 'cashier', 'active', strftime('%Y-%m-%d %H:%M:%S', 'now', '-335 minutes'), strftime('%Y-%m-%d %H:%M:%S', 'now', '-335 minutes')),
  ('69', 'elena.watson@example.com', 'Elena', 'Watson', 'superadmin', 'inactive', strftime('%Y-%m-%d %H:%M:%S', 'now', '-340 minutes'), strftime('%Y-%m-%d %H:%M:%S', 'now', '-340 minutes')),
  ('70', 'robert.brooks@example.com', 'Robert', 'Brooks', 'admin', 'invited', strftime('%Y-%m-%d %H:%M:%S', 'now', '-345 minutes'), strftime('%Y-%m-%d %H:%M:%S', 'now', '-345 minutes'));

-- Fifteenth batch
INSERT INTO users (id, email, first_name, last_name, role, status, created_at, updated_at)
VALUES 
  ('71', 'maya.kelly@example.com', 'Maya', 'Kelly', 'manager', 'active', strftime('%Y-%m-%d %H:%M:%S', 'now', '-350 minutes'), strftime('%Y-%m-%d %H:%M:%S', 'now', '-350 minutes')),
  ('72', 'jonathan.sanders@example.com', 'Jonathan', 'Sanders', 'cashier', 'inactive', strftime('%Y-%m-%d %H:%M:%S', 'now', '-355 minutes'), strftime('%Y-%m-%d %H:%M:%S', 'now', '-355 minutes')),
  ('73', 'gianna.price@example.com', 'Gianna', 'Price', 'superadmin', 'invited', strftime('%Y-%m-%d %H:%M:%S', 'now', '-360 minutes'), strftime('%Y-%m-%d %H:%M:%S', 'now', '-360 minutes')),
  ('74', 'tyler.bennett@example.com', 'Tyler', 'Bennett', 'admin', 'active', strftime('%Y-%m-%d %H:%M:%S', 'now', '-365 minutes'), strftime('%Y-%m-%d %H:%M:%S', 'now', '-365 minutes')),
  ('75', 'julia.wood@example.com', 'Julia', 'Wood', 'manager', 'inactive', strftime('%Y-%m-%d %H:%M:%S', 'now', '-370 minutes'), strftime('%Y-%m-%d %H:%M:%S', 'now', '-370 minutes'));

-- Sixteenth batch
INSERT INTO users (id, email, first_name, last_name, role, status, created_at, updated_at)
VALUES 
  ('76', 'nicholas.barnes@example.com', 'Nicholas', 'Barnes', 'cashier', 'invited', strftime('%Y-%m-%d %H:%M:%S', 'now', '-375 minutes'), strftime('%Y-%m-%d %H:%M:%S', 'now', '-375 minutes')),
  ('77', 'claire.ross@example.com', 'Claire', 'Ross', 'superadmin', 'active', strftime('%Y-%m-%d %H:%M:%S', 'now', '-380 minutes'), strftime('%Y-%m-%d %H:%M:%S', 'now', '-380 minutes')),
  ('78', 'dominic.henderson@example.com', 'Dominic', 'Henderson', 'admin', 'inactive', strftime('%Y-%m-%d %H:%M:%S', 'now', '-385 minutes'), strftime('%Y-%m-%d %H:%M:%S', 'now', '-385 minutes')),
  ('79', 'aubrey.coleman@example.com', 'Aubrey', 'Coleman', 'manager', 'invited', strftime('%Y-%m-%d %H:%M:%S', 'now', '-390 minutes'), strftime('%Y-%m-%d %H:%M:%S', 'now', '-390 minutes')),
  ('80', 'austin.jenkins@example.com', 'Austin', 'Jenkins', 'cashier', 'active', strftime('%Y-%m-%d %H:%M:%S', 'now', '-395 minutes'), strftime('%Y-%m-%d %H:%M:%S', 'now', '-395 minutes'));

-- Seventeenth batch
INSERT INTO users (id, email, first_name, last_name, role, status, created_at, updated_at)
VALUES 
  ('81', 'leah.perry@example.com', 'Leah', 'Perry', 'superadmin', 'inactive', strftime('%Y-%m-%d %H:%M:%S', 'now', '-400 minutes'), strftime('%Y-%m-%d %H:%M:%S', 'now', '-400 minutes')),
  ('82', 'chase.powell@example.com', 'Chase', 'Powell', 'admin', 'invited', strftime('%Y-%m-%d %H:%M:%S', 'now', '-405 minutes'), strftime('%Y-%m-%d %H:%M:%S', 'now', '-405 minutes')),
  ('83', 'eva.long@example.com', 'Eva', 'Long', 'manager', 'active', strftime('%Y-%m-%d %H:%M:%S', 'now', '-410 minutes'), strftime('%Y-%m-%d %H:%M:%S', 'now', '-410 minutes')),
  ('84', 'ian.patterson@example.com', 'Ian', 'Patterson', 'cashier', 'inactive', strftime('%Y-%m-%d %H:%M:%S', 'now', '-415 minutes'), strftime('%Y-%m-%d %H:%M:%S', 'now', '-415 minutes')),
  ('85', 'piper.hughes@example.com', 'Piper', 'Hughes', 'superadmin', 'invited', strftime('%Y-%m-%d %H:%M:%S', 'now', '-420 minutes'), strftime('%Y-%m-%d %H:%M:%S', 'now', '-420 minutes'));

-- Eighteenth batch
INSERT INTO users (id, email, first_name, last_name, role, status, created_at, updated_at)
VALUES 
  ('86', 'leonardo.flores@example.com', 'Leonardo', 'Flores', 'admin', 'active', strftime('%Y-%m-%d %H:%M:%S', 'now', '-425 minutes'), strftime('%Y-%m-%d %H:%M:%S', 'now', '-425 minutes')),
  ('87', 'ruby.washington@example.com', 'Ruby', 'Washington', 'manager', 'inactive', strftime('%Y-%m-%d %H:%M:%S', 'now', '-430 minutes'), strftime('%Y-%m-%d %H:%M:%S', 'now', '-430 minutes')),
  ('88', 'max.butler@example.com', 'Max', 'Butler', 'cashier', 'invited', strftime('%Y-%m-%d %H:%M:%S', 'now', '-435 minutes'), strftime('%Y-%m-%d %H:%M:%S', 'now', '-435 minutes')),
  ('89', 'stella.simmons@example.com', 'Stella', 'Simmons', 'superadmin', 'active', strftime('%Y-%m-%d %H:%M:%S', 'now', '-440 minutes'), strftime('%Y-%m-%d %H:%M:%S', 'now', '-440 minutes')),
  ('90', 'cole.foster@example.com', 'Cole', 'Foster', 'admin', 'inactive', strftime('%Y-%m-%d %H:%M:%S', 'now', '-445 minutes'), strftime('%Y-%m-%d %H:%M:%S', 'now', '-445 minutes'));

-- Nineteenth batch
INSERT INTO users (id, email, first_name, last_name, role, status, created_at, updated_at)
VALUES 
  ('91', 'paisley.gonzales@example.com', 'Paisley', 'Gonzales', 'manager', 'invited', strftime('%Y-%m-%d %H:%M:%S', 'now', '-450 minutes'), strftime('%Y-%m-%d %H:%M:%S', 'now', '-450 minutes')),
  ('92', 'carson.bryant@example.com', 'Carson', 'Bryant', 'cashier', 'active', strftime('%Y-%m-%d %H:%M:%S', 'now', '-455 minutes'), strftime('%Y-%m-%d %H:%M:%S', 'now', '-455 minutes')),
  ('93', 'violet.alexander@example.com', 'Violet', 'Alexander', 'superadmin', 'inactive', strftime('%Y-%m-%d %H:%M:%S', 'now', '-460 minutes'), strftime('%Y-%m-%d %H:%M:%S', 'now', '-460 minutes')),
  ('94', 'maxwell.russell@example.com', 'Maxwell', 'Russell', 'admin', 'invited', strftime('%Y-%m-%d %H:%M:%S', 'now', '-465 minutes'), strftime('%Y-%m-%d %H:%M:%S', 'now', '-465 minutes')),
  ('95', 'naomi.griffin@example.com', 'Naomi', 'Griffin', 'manager', 'active', strftime('%Y-%m-%d %H:%M:%S', 'now', '-470 minutes'), strftime('%Y-%m-%d %H:%M:%S', 'now', '-470 minutes'));

-- Twentieth batch
INSERT INTO users (id, email, first_name, last_name, role, status, created_at, updated_at)
VALUES 
  ('96', 'jaxon.diaz@example.com', 'Jaxon', 'Diaz', 'cashier', 'inactive', strftime('%Y-%m-%d %H:%M:%S', 'now', '-475 minutes'), strftime('%Y-%m-%d %H:%M:%S', 'now', '-475 minutes')),
  ('97', 'eva.hayes@example.com', 'Eva', 'Hayes', 'superadmin', 'invited', strftime('%Y-%m-%d %H:%M:%S', 'now', '-480 minutes'), strftime('%Y-%m-%d %H:%M:%S', 'now', '-480 minutes')),
  ('98', 'harrison.ford@example.com', 'Harrison', 'Ford', 'admin', 'active', strftime('%Y-%m-%d %H:%M:%S', 'now', '-485 minutes'), strftime('%Y-%m-%d %H:%M:%S', 'now', '-485 minutes')),
  ('99', 'melody.myers@example.com', 'Melody', 'Myers', 'manager', 'inactive', strftime('%Y-%m-%d %H:%M:%S', 'now', '-490 minutes'), strftime('%Y-%m-%d %H:%M:%S', 'now', '-490 minutes')),
  ('100', 'xavier.hamilton@example.com', 'Xavier', 'Hamilton', 'cashier', 'invited', strftime('%Y-%m-%d %H:%M:%S', 'now', '-495 minutes'), strftime('%Y-%m-%d %H:%M:%S', 'now', '-495 minutes')); 