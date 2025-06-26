import React from 'react';

export async function getServerSideProps({ req }) {
  const protocol = req.headers['x-forwarded-proto'] || 'http';
  const host = req.headers.host;
  const baseUrl = `${protocol}://${host}`;
  const res = await fetch(`${baseUrl}/api/profile`, {
    headers: { cookie: req.headers.cookie || '' },
  });

  if (res.status !== 200) {
    return { redirect: { destination: '/login', permanent: false } };
  }

  const user = await res.json();
  return { props: { user } };
}

export default function Dashboard({ user }) {
  return <div>Welcome, {user.name}</div>;
} 