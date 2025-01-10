-- Add slug column as nullable first
ALTER TABLE organizations ADD COLUMN slug text;

-- Create unique index
CREATE UNIQUE INDEX organizations_slug_unique ON organizations(slug);

-- Update existing rows with a generated slug (if any)
UPDATE organizations SET slug = LOWER(REPLACE(name, ' ', '-')) WHERE slug IS NULL;