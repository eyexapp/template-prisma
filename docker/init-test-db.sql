-- Create test database automatically on first start
SELECT 'CREATE DATABASE myapp_test'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'myapp_test')\gexec
