import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const getSiteOrigin = () =>
    (loadEnv(mode, process.cwd(), '').VITE_SITE_URL || '').replace(/\/+$/, '')

  return {
    plugins: [
      react(),
      {
        name: 'html-site-origin',
        transformIndexHtml(html) {
          const origin = getSiteOrigin()
          let out = html.replaceAll('%SITE_ORIGIN%', origin)
          if (!origin) {
            out = out.replace(/\r?\n\s*<meta property="og:url"[^>]*>/, '')
          }
          return out
        },
      },
    ],
  }
})
