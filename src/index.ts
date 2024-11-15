import { setupDatabase } from './db/setup';
import app from './app';

const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    // Initialize database
    await setupDatabase();

    // Start server
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
