#!/bin/bash

# Load environment variables from .dev.vars
export $(cat .dev.vars | xargs)

# Run the drizzle command with all arguments passed to this script
npx drizzle-kit "$@" 