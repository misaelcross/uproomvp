const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

console.log('🚀 Setting up Uproom database...')

// Check if .env exists
const envPath = path.join(__dirname, '..', '.env')
if (!fs.existsSync(envPath)) {
  console.log('📝 Creating .env file from .env.example...')
  const envExample = fs.readFileSync(path.join(__dirname, '..', '.env.example'), 'utf8')
  fs.writeFileSync(envPath, envExample)
  console.log('✅ .env file created! Please update the DATABASE_URL with your PostgreSQL credentials.')
}

// Check if Docker is running
try {
  execSync('docker --version', { stdio: 'ignore' })
  console.log('🐳 Docker is available')
} catch (error) {
  console.log('⚠️  Docker not found. Please install Docker or set up PostgreSQL manually.')
  console.log('   Update DATABASE_URL in .env file with your PostgreSQL connection string.')
  process.exit(1)
}

// Start PostgreSQL with Docker Compose
console.log('🐳 Starting PostgreSQL with Docker Compose...')
try {
  execSync('docker-compose up -d postgres', { stdio: 'inherit' })
  console.log('✅ PostgreSQL started successfully!')
} catch (error) {
  console.error('❌ Failed to start PostgreSQL:', error.message)
  process.exit(1)
}

// Wait a moment for PostgreSQL to be ready
console.log('⏳ Waiting for PostgreSQL to be ready...')
setTimeout(() => {
  try {
    console.log('🗄️  Running Prisma migrations...')
    execSync('npx prisma migrate dev --name init', { stdio: 'inherit' })
    console.log('✅ Database setup complete!')
    console.log('🎉 You can now run: npm run dev')
  } catch (error) {
    console.error('❌ Migration failed:', error.message)
    console.log('💡 Try running: npx prisma migrate dev --name init')
  }
}, 5000)
