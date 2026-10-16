import { defineConfig, loadEnv, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import { handleLeadRequest } from './server/lead-handler'
import { buildSinksFromEnv } from './server/providers'

// Локальная разработка: тот же обработчик, что и в api/lead.ts
function leadDevApi(env: Record<string, string>): Plugin {
  return {
    name: 'lead-dev-api',
    configureServer(server) {
      server.middlewares.use('/api/lead', (req, res) => {
        const chunks: Buffer[] = []
        req.on('data', (c) => chunks.push(c))
        req.on('end', async () => {
          let body: unknown = null
          try {
            body = JSON.parse(Buffer.concat(chunks).toString('utf8') || 'null')
          } catch {
            body = null
          }
          const result = await handleLeadRequest(
            {
              method: req.method ?? 'GET',
              body,
              ip: req.socket.remoteAddress ?? 'local',
              origin: req.headers.origin,
              host: req.headers.host,
            },
            { sinks: buildSinksFromEnv(env), env },
          )
          res.statusCode = result.status
          res.setHeader('Content-Type', 'application/json; charset=utf-8')
          res.end(JSON.stringify(result.body))
        })
      })
    },
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [react(), leadDevApi(env)],
    test: {
      environment: 'jsdom',
      setupFiles: ['./src/test/setup.ts'],
      globals: true,
    },
  }
})
