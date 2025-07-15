import type { NextApiRequest, NextApiResponse } from 'next';
import { handlerPromise } from "../../server-wp.js";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { token } = req.cookies;

  if (!token) return res.status(401).json({ message: 'Not authenticated' });
  
  try {
    const playgroundHandler = await handlerPromise;
    
    const response = await playgroundHandler.request({
      method: 'GET',
      url: '/wp-json/wp/v2/users/me',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (response.httpStatusCode === 200) {
      try {
        const data = JSON.parse(response.text);
        console.log(data);
        res.status(200).json(data);
      } catch (parseError) {
        console.error('Failed to parse profile response:', response.text);
        res.status(500).json({ message: 'Invalid response format' });
      }
    } else {
      console.error('Profile error response:', response.text);
      try {
        const errorData = JSON.parse(response.text);
        res.status(response.httpStatusCode).json({ message: errorData.message || 'Failed to fetch profile' });
      } catch (parseError) {
        res.status(response.httpStatusCode).json({ message: 'Failed to fetch profile' });
      }
    }
  } catch (error) {
    console.error('WordPress handler error:', error);
    res.status(503).json({ message: 'WordPress handler not ready. Please try again in a moment.' });
  }
} 