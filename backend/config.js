/**
 * @fileoverview Loads environment variables from the workspace root or local backend folder.
 * This is imported first to prevent ES Modules hoisting issues where process.env is read before dotenv configures it.
 */
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 1. Try loading from workspace root (.env)
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// 2. Try loading from backend folder (.env) if not defined
dotenv.config({ path: path.resolve(__dirname, '.env') });
