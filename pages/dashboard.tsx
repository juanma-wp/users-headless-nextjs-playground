import React from 'react';
import { fetchCookie } from "../utils/fetchCookie";
import { useRouter } from 'next/router';

export async function getServerSideProps({ req }) {
  const protocol = req.headers['x-forwarded-proto'] || 'http';
  const host = req.headers.host;
  const baseUrl = `${protocol}://${host}`;
  const res = await fetchCookie(`${baseUrl}/api/profile`, {
    headers: { cookie: req.headers.cookie || "" },
  });

  if (res.status !== 200) {
    return { redirect: { destination: '/login', permanent: false } };
  }

  const user = await res.json();
  return { props: { user } };
}

export default function Dashboard({ user }) {
  const router = useRouter();

  const handleLogout = async () => {
    await fetch('/api/logout', { method: 'POST' });
    router.push('/login');
  };

  return (
    <div>
      <div>Welcome, {user.name}</div>
      <button onClick={handleLogout}>Logout</button>
    </div>
  );
} 