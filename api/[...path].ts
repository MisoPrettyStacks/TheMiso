// Vercel serverless catch-all: mounts the Express app from ../server.ts so every
// /api/* route keeps working unchanged (the frontend calls absolute /api/* paths).
// GEMINI_API_KEY is read from the environment only — never hardcode it.
import type { Request, Response } from 'express';
import { app } from '../server';

export default function handler(req: Request, res: Response): void {
  app(req, res);
}
