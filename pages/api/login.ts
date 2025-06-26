import axios from 'axios';
import type { NextApiRequest, NextApiResponse } from 'next';
  const cookie = require("cookie");
// import cookie from 'cookie';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  const { username, password } = req.body;

  try {
    const response = await axios.post(process.env.JWT_AUTH_URL!, { username, password });

    const { token, user_display_name } = response.data;

    res.setHeader(
      'Set-Cookie',
      cookie.serialize('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 24, // 1 day
        sameSite: 'strict',
        path: '/',
      })
    );

    res.status(200).json({ user_display_name });
  } catch (error) {
    res.status(401).json({ message: 'Invalid credentials' });
  }
} 