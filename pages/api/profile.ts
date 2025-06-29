import axios from 'axios';
import type { NextApiRequest, NextApiResponse } from 'next';
import { handlerPromise } from "../../server-wp";
import { fetchCookie } from "../../utils/fetchCookie";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { token } = req.cookies;

  if (!token) return res.status(401).json({ message: 'Not authenticated' });
  
  const playgroundHandler = await handlerPromise;
  try {
    const wpRestUrl = new URL(playgroundHandler.absoluteUrl);
    wpRestUrl.pathname = "/wp-json/wp/v2/users/me";
    const urlToFetch = wpRestUrl.toString();

    const myHeaders = new Headers();
    myHeaders.append("Authorization", `Bearer ${token}`);

    const requestOptions = {
      method: "GET",
      headers: myHeaders
    };
    console.log({ urlToFetch, requestOptions });
    const response = await fetchCookie(urlToFetch, requestOptions);
    const data = await response.json();
    console.log(data);

    // const response = await axios.get(`${process.env.NEXT_PUBLIC_WP_API_URL}/wp/v2/users/me`, {
    //   headers: { Authorization: `Bearer ${token}` },
    // });
    console.log(response);
    res.status(200).json(data);
  } catch (error) {
    console.error(error);
    res.status(401).json({ message: 'Token invalid or expired' });
  }
} 