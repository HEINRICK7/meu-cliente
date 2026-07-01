import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) {
            return undefined;
          }

          if (
            id.includes('/react/') ||
            id.includes('/react-dom/') ||
            id.includes('/scheduler/') ||
            id.includes('/antd-mobile/') ||
            id.includes('/antd-mobile-icons/') ||
            id.includes('/@react-spring/') ||
            id.includes('/@use-gesture/') ||
            id.includes('/rc-')
          ) {
            return 'ui-vendor';
          }

          if (id.includes('/@firebase/firestore') || id.includes('/firebase/firestore')) {
            return 'firebase-firestore';
          }

          if (id.includes('/@firebase/auth') || id.includes('/firebase/auth')) {
            return 'firebase-auth';
          }

          if (id.includes('/@firebase/storage') || id.includes('/firebase/storage')) {
            return 'firebase-storage';
          }

          if (id.includes('/@firebase/messaging') || id.includes('/firebase/messaging')) {
            return 'firebase-messaging';
          }

          if (id.includes('/firebase/') || id.includes('/@firebase/')) {
            return 'firebase-core';
          }

          return undefined;
        },
      },
    },
  },
});
