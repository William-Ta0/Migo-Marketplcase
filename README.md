# Migo Marketplace

## Sensitive Credentials Management

### Service Account Keys

For security reasons, service account keys and other sensitive credentials are not stored in this repository. Instead:

1. The structure of the required credentials is provided in example files: `backend/serviceAccountKey.example.json`
2. To set up your local development environment:
   - Create a copy of the example file, removing the `.example` part of the filename
   - Fill in the actual credentials (contact a team admin for access)
   - Never commit these files to Git (they are added to .gitignore)

### Environment Variables

For production deployments, use environment variables instead of JSON files. You can load these variables in your application code rather than using physical files.

## Development Setup

(Additional setup instructions here)
