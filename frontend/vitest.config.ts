import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  // 测试不经过 Tailwind v4 PostCSS 管线
  css: { postcss: { plugins: [] } },
  test: {
    environment: 'jsdom',
    globals: true,
    css: false,
    include: ['src/**/*.test.{ts,tsx}'],
  },
});
