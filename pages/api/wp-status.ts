import type { NextApiRequest, NextApiResponse } from 'next';
import { handlerPromise } from '../../server-wp.js';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).end();

  try {
    const playgroundHandler = await handlerPromise;
    res.status(200).json({ 
      status: 'ready',
      initialized: true 
    });
  } catch (error) {
    res.status(503).json({ 
      status: 'error',
      initialized: false,
      error: error.message 
    });
  }
}