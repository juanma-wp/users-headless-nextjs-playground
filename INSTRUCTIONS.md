## ✅ **Project Setup**

### 1. **Create a New Next.js App**

In Cursor terminal:

```bash
npx create-next-app@latest wp-auth-next --typescript
cd wp-auth-next
```

---

## 🔧 **Configure Environment**

### 2. **Install Dependencies**

```bash
npm install axios cookie
```

### 3. **Create `.env.local`**

Create a `.env.local` file in the project root:

```env
NEXT_PUBLIC_WP_API_URL=https://your-wp-site.com/wp-json
JWT_AUTH_URL=https://your-wp-site.com/wp-json/jwt-auth/v1/token
```

Replace `your-wp-site.com` with your actual WordPress site.

---

## 🔐 **Authentication Logic**

### 4. **Create API Route: `/pages/api/login.ts`**

```ts
// pages/api/login.ts
import axios from 'axios';
import type { NextApiRequest, NextApiResponse } from 'next';
import cookie from 'cookie';

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
```

---

### 5. **Create API Route: `/pages/api/profile.ts`**

```ts
// pages/api/profile.ts
import axios from 'axios';
import cookie from 'cookie';
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { token } = cookie.parse(req.headers.cookie || '');

  if (!token) return res.status(401).json({ message: 'Not authenticated' });

  try {
    const response = await axios.get(`${process.env.NEXT_PUBLIC_WP_API_URL}/wp/v2/users/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    res.status(200).json(response.data);
  } catch {
    res.status(401).json({ message: 'Token invalid or expired' });
  }
}
```

---

## 🧑‍💻 **Create Login Form**

### 6. **Component: `/pages/login.tsx`**

```tsx
import { useState } from 'react';
import { useRouter } from 'next/router';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });

    if (res.ok) {
      router.push('/dashboard');
    } else {
      setError('Login failed');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>Login</h2>
      <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Username" />
      <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" />
      <button type="submit">Login</button>
      {error && <p>{error}</p>}
    </form>
  );
}
```

---

## 🔒 **Protect Pages**

### 7. **Dashboard Page: `/pages/dashboard.tsx`**

```tsx
export async function getServerSideProps({ req }) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/profile`, {
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
```

---

## 🧼 **Log Out**

### 8. **Logout Route: `/pages/api/logout.ts`**

```ts
import { NextApiRequest, NextApiResponse } from 'next';
import cookie from 'cookie';

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
```

