import type { NextApiRequest, NextApiResponse } from 'next';
import { handlerPromise } from '../../server-wp.js';
const cookie = require("cookie");

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('=== LOGIN API CALLED ===');
  console.log('Method:', req.method);
  console.log('Headers:', req.headers);
  
  if (req.method !== 'POST') return res.status(405).end();

  const { username, password } = req.body;
  console.log('Login attempt:', { username, password });

  try {
    console.log('Getting playground handler...');
    const playgroundHandler = await handlerPromise;
    console.log('Playground handler obtained');
    
    // === ORIGINAL LOGIN LOGIC ===
    const bodyData = {
      username: username,
      password: password
    };

    console.log('Request body data:', bodyData);
    console.log('⚠️  Note: Blueprint expects admin/password, you are using:', `${username}/${password}`);
    console.log('Making request to WordPress JWT endpoint...');

    const response = await playgroundHandler.request({
      method: "POST",
      url: "/wp-json/jwt-auth/v1/token",
      headers: {
        "Content-Type": "application/json",
      },
      body: bodyData,
    });

    console.log('WordPress response status:', response.httpStatusCode);
    console.log('WordPress response headers:', response.headers);
    console.log('WordPress response text:', response.text);

    if (response.httpStatusCode !== 200) {
      console.error('❌ Non-200 status code received:', response.httpStatusCode);
      console.error('Response text:', response.text);
      
      try {
        const errorData = JSON.parse(response.text);
        console.error('Parsed error data:', errorData);
        return res.status(response.httpStatusCode).json({ message: errorData.message || 'Login failed' });
      } catch (parseError) {
        console.error('Failed to parse error response:', parseError);
        return res.status(response.httpStatusCode).json({ message: 'Login failed' });
      }
    }
    
    let data;
    try {
      data = JSON.parse(response.text);
      console.log('✅ Successfully parsed response:', data);
    } catch (parseError) {
      console.error('❌ Failed to parse success response:', parseError);
      console.error('Raw response text:', response.text);
      return res.status(500).json({ message: 'Invalid response format' });
    }
    
    if (data.code && data.message) {
      console.error('❌ WordPress error format detected:', data);
      return res.status(401).json({ message: data.message });
    }
    
    const { token } = data;
    console.log('✅ Token extracted:', token ? 'Token present' : 'No token');
    
    // Store user data in session cookie alongside token
    res.setHeader(
      "Set-Cookie",
      [
        cookie.serialize("token", token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          maxAge: 60 * 60 * 24,
          sameSite: "strict", 
          path: "/"
        })
      ]
    );
    
    console.log('✅ Returning success response');
    res.status(200).json(data);
  } catch (error) {
    console.error('❌ Caught exception in login handler:', error);
    console.error('Error stack:', error.stack);
    res.status(401).json({ message: 'Invalid credentials' });
  }
} 