#!/bin/bash
cd backend
NODE_ENV=test npx jest tests/integration/auth-flow.test.ts --no-cache
