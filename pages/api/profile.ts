import axios from 'axios';
import cookie from 'cookie';
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { token } = cookie.parse(req.headers.cookie || '');

  if (!token) return res.status(401).json({ message: 'Not authenticated' });

  try {
    const response = await axios.get(`${process.env.NEXT_PUBLIC_WP_API_URL}/wp/v2/users/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    res.status(200).json(response.data);
  } catch {
    res.status(401).json({ message: 'Token invalid or expired' });
  }
} 