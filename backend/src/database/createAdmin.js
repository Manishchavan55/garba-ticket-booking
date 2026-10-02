import 'dotenv/config';
import { createDevelopmentAdmin } from '../services/adminAuth.service.js';

const username = process.env.ADMIN_BOOTSTRAP_USERNAME?.trim();
const email = process.env.ADMIN_BOOTSTRAP_EMAIL?.trim();
const password = process.env.ADMIN_BOOTSTRAP_PASSWORD;
const nodeEnv = process.env.NODE_ENV ?? 'development';
const productionConfirmation = process.env.ADMIN_BOOTSTRAP_CONFIRM;

if (nodeEnv === 'production' && productionConfirmation !== 'CREATE_ADMIN') {
  console.error('Production admin bootstrap requires ADMIN_BOOTSTRAP_CONFIRM=CREATE_ADMIN.');
  process.exitCode = 1;
} else if (!username || !email || !password) {
  console.error('ADMIN_BOOTSTRAP_USERNAME, ADMIN_BOOTSTRAP_EMAIL and ADMIN_BOOTSTRAP_PASSWORD are required.');
  process.exitCode = 1;
} else if (password.length < 12) {
  console.error('ADMIN_BOOTSTRAP_PASSWORD must contain at least 12 characters.');
  process.exitCode = 1;
} else {
  try {
    await createDevelopmentAdmin({ username, email, password });
    console.log(`Admin account created: ${username}`);
  } catch (error) {
    console.error(`Admin account creation failed: ${error.message}`);
    process.exitCode = 1;
  }
}
