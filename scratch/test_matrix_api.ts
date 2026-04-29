import 'dotenv/config'
import fetch from 'node-fetch'

async function test() {
  const baseUrl = 'http://localhost:3000' // Assuming local dev server
  const response = await fetch(`${baseUrl}/api/admin?resource=matrix`, {
    headers: {
      'Cookie': 'auth_token=...' // I don't have a valid token here easily
    }
  })
  const data = await response.json()
  console.log(JSON.stringify(data, null, 2))
}

// Since I can't easily run with a cookie, I'll just check the code in api/admin.ts again
