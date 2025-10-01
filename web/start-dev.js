import { spawn } from 'child_process'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

console.log('🚀 Starting Uproom development environment...\n')

// Start backend server
console.log('📡 Starting backend server on port 3001...')
const server = spawn('npm', ['run', 'dev'], {
  stdio: 'inherit',
  shell: true,
  cwd: path.join(__dirname, '../api')
})

// Start frontend dev server
console.log('⚛️  Starting frontend dev server on port 8080...')
const frontend = spawn('npm', ['run', 'dev'], {
  stdio: 'inherit',
  shell: true
})

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down development servers...')
  server.kill('SIGINT')
  frontend.kill('SIGINT')
  process.exit(0)
})

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down development servers...')
  server.kill('SIGTERM')
  frontend.kill('SIGTERM')
  process.exit(0)
})

// Handle server errors
server.on('error', (err) => {
  console.error('❌ Backend server error:', err)
})

frontend.on('error', (err) => {
  console.error('❌ Frontend server error:', err)
})

console.log('✅ Development environment started!')
console.log('📡 Backend API: http://localhost:3001/api')
console.log('⚛️  Frontend: http://localhost:8080')
console.log('\nPress Ctrl+C to stop both servers')
