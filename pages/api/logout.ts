import { NextApiRequest, NextApiResponse } from 'next';
  const cookie = require("cookie");
// import cookie from 'cookie';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader(
    'Set-Cookie',
    cookie.serialize('token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: -1,
      path: '/',
    })
  );
  res.status(200).json({ message: 'Logged out' });
} 