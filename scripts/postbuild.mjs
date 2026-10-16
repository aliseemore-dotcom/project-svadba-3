// GitHub Pages не умеет «переписывать» адреса, поэтому для страниц /privacy, /terms, /raffle-rules
// кладём копию index.html в одноимённые папки (ответ 200) и добавляем 404.html на случай других адресов.
import { copyFileSync, mkdirSync, existsSync } from 'node:fs'

const dist = new URL('../dist/', import.meta.url)
const index = new URL('index.html', dist)
if (!existsSync(index)) throw new Error('dist/index.html не найден: сначала vite build')

for (const route of ['privacy', 'terms', 'raffle-rules']) {
  mkdirSync(new URL(`${route}/`, dist), { recursive: true })
  copyFileSync(index, new URL(`${route}/index.html`, dist))
}
copyFileSync(index, new URL('404.html', dist))
console.log('postbuild: страницы privacy, terms, raffle-rules и 404.html созданы')
