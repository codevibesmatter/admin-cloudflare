#!/bin/bash

# Delete existing data from both tables
echo "DELETE FROM users; DELETE FROM d1_migrations;" | turso db shell libsql://edgestack-elevraben.aws-us-east-1.turso.io

# Extract and import only INSERT statements, excluding sqlite_sequence
grep "^INSERT" d1-data.sql | grep -v "sqlite_sequence" | turso db shell libsql://edgestack-elevraben.aws-us-east-1.turso.io 