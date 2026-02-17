import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.js'],
      exclude: [
        'src/tests/**',
        'src/main.js',
        'src/renderer.js',
        'src/sound.js',
        'src/ui.js',
        'src/stars.js',
        'src/math.js'
      ]
    }
  }
})
