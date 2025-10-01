import fetch from 'node-fetch'

const API_BASE = 'http://localhost:3001/api'

async function testAPI() {
  console.log('🧪 Testing Uproom API...\n')

  try {
    // Test health endpoint
    console.log('1. Testing health endpoint...')
    const healthResponse = await fetch(`${API_BASE}/health`)
    const healthData = await healthResponse.json()
    console.log('✅ Health check:', healthData.status)

    // Test signup
    console.log('\n2. Testing signup...')
    const signupResponse = await fetch(`${API_BASE}/auth/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'test@example.com',
        password: '123456',
        fullName: 'Test User'
      })
    })
    const signupData = await signupResponse.json()
    console.log('✅ Signup result:', signupData.success ? 'Success' : 'Failed')
    if (signupData.token) {
      console.log('   Token received:', signupData.token.substring(0, 20) + '...')
    }

    // Test signin
    console.log('\n3. Testing signin...')
    const signinResponse = await fetch(`${API_BASE}/auth/signin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'test@example.com',
        password: '123456'
      })
    })
    const signinData = await signinResponse.json()
    console.log('✅ Signin result:', signinData.success ? 'Success' : 'Failed')
    
    if (signinData.token) {
      // Test protected route
      console.log('\n4. Testing protected route (me)...')
      const meResponse = await fetch(`${API_BASE}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${signinData.token}`
        }
      })
      const meData = await meResponse.json()
      console.log('✅ Protected route result:', meData.success ? 'Success' : 'Failed')
      if (meData.user) {
        console.log('   User data:', meData.user.email)
      }
    }

    console.log('\n🎉 All API tests completed successfully!')
    
  } catch (error) {
    console.error('❌ API test failed:', error.message)
  }
}

// Run tests
testAPI()
