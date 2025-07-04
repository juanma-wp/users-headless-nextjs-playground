import type { NextApiRequest, NextApiResponse } from 'next';
import { handlerPromise } from '../../server-wp';
const cookie = require("cookie");
import { fetchCookie } from "../../utils/fetchCookie";

// import cookie from 'cookie';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  const { username, password } = req.body;
  console.log({username, password});

  // get the singleton handler
  const playgroundHandler = await handlerPromise;
  
  try {
    
    const protocol = req.headers["x-forwarded-proto"] || "http";
    const host = req.headers.host;
    const baseUrl = `${protocol}://${host}`;
    const urlToFetch = `${baseUrl}/wp/wp-json/jwt-auth/v1/token`;

    const myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/x-www-form-urlencoded");
    myHeaders.append(
      "Cookie",
      "playground_auto_login_already_happened=1;"
    );

    const urlencoded = new URLSearchParams();
    urlencoded.append("username", username);
    urlencoded.append("password", password);

    const requestOptions = {
      method: "POST",
      headers: myHeaders,
      body: urlencoded.toString(),
    };

    console.log({ urlToFetch, headers: myHeaders, body: urlencoded.toString() });

    const response = await fetchCookie(urlToFetch, requestOptions);
    if (response.status !== 200) {
      const errorData: any = await response.json();
      console.error('Login error:', errorData);
      return res.status(response.status).json({ message: errorData.message || 'Login failed' });
    }
    const data: any = await response.json();
    if (data.code && data.message) {
      // WordPress error format
      console.error('Login error:', data);
      return res.status(401).json({ message: data.message });
    }
    console.log(data);
    const {token} = data;
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
    res.status(200).json(data);
  } catch (error) {
    console.log(error);
    res.status(401).json({ message: 'Invalid credentials' });
  }
} 