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
    
    const wpRestUrl = new URL(playgroundHandler.absoluteUrl);
    wpRestUrl.pathname = "/wp-json/jwt-auth/v1/token";
    const urlToFetch = wpRestUrl.toString();

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
    const data = await response.json();
    console.log(data);
    const { token, user_display_name } = data;
    console.log(token, user_display_name);
    res.setHeader(
      "Set-Cookie",
      cookie.serialize("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 60 * 60 * 24, // 1 day
        sameSite: "strict",
        path: "/",
      })
    );

    res.status(200).json({ token, user_display_name });
  } catch (error) {
    console.log(error);
    res.status(401).json({ message: 'Invalid credentials' });
  }
} 