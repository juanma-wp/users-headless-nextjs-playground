import makeFetchCookie from "fetch-cookie";
import fetch from "node-fetch";
import { CookieJar } from "tough-cookie";

// Singleton jar and fetchCookie
const jar = new CookieJar();
const fetchCookie = makeFetchCookie(fetch, jar);

export { fetchCookie, jar };
