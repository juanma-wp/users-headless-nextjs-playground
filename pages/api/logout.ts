import type { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  // Clear the 'token' cookie by setting it to an empty value and expiring it
  res.setHeader('Set-Cookie', 'token=; Path=/; HttpOnly; Max-Age=0; SameSite=Lax');
  res.status(200).json({ message: 'Logged out, token cleared.' });
} 