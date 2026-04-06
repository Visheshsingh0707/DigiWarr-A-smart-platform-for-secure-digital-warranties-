# DigiWarr Vault Setup Guide

Welcome to DigiWarr Vault. This guide helps you set up the project on your local machine.

## Prerequisites
- Node.js (v18+)
- npm or yarn

## Installation Steps

1. **Install Dependencies**
   ```bash
   cd digiwarr
   npm install --legacy-peer-deps
   ```

2. **Configure Database**
   The project uses SQLite by default for simple local setup. To initialize the database:
   ```bash
   npx prisma db push
   ```

3. **Start the Development Server**
   ```bash
   npm run dev
   ```
   Server will start at `http://localhost:3000`.

## Key Security Features Implemented

1. **AES-256-GCM Encryption**: All documents are encrypted locally before being stored in the `uploads/` directory. If the database or server is compromised, the files remain unreadable.
2. **Per-User Key Derivation**: A master encryption key is combined with a unique `encryptionKeySalt` generated for each user using `PBKDF2`.
3. **Local OCR Extraction**: The `tesseract.js` engine runs locally in Node.js to extract text from images in-memory, ensuring sensitive documents are never sent to external AI APIs.
4. **JWT Sessions & Bcrypt**: Passwords are hashed automatically via `bcrypt` and session states are maintained with secure JWTs via NextAuth.

## Important Note for Production
- Change the `NEXTAUTH_SECRET` and `ENCRYPTION_MASTER_KEY` variables in `.env`.
- Ensure `ENCRYPTION_MASTER_KEY` is a strong, completely secure 32-byte hex string (64 characters). If this key is lost, **all encrypted files become permanently unrecoverable.** 
- Do not check the `.env` file or `dev.db` into source control.
