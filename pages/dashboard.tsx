import React from 'react';
import { useRouter } from 'next/router';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "../components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { LogOut, User, Settings, Home, Mail, Calendar, Shield } from "lucide-react";

export async function getServerSideProps({ req }) {
  const protocol = req.headers['x-forwarded-proto'] || 'http';
  const host = req.headers.host;
  const baseUrl = `${protocol}://${host}`;
  const res = await fetch(`${baseUrl}/api/profile`, {
    headers: { cookie: req.headers.cookie || "" },
  });

  if (res.status !== 200) {
    return { redirect: { destination: '/login', permanent: false } };
  }

  const user = await res.json();
  return { props: { user } };
}

function Sidebar({ user, onLogout }) {
  return (
    <aside className="flex flex-col w-64 h-screen border-r bg-white">
      <div className="flex items-center gap-3 px-4 py-6 border-b">
        <Avatar className="h-10 w-10">
          <AvatarImage src={user.avatar_urls?.['96'] || "/placeholder.svg"} alt={user.name} />
          <AvatarFallback>{user.name?.charAt(0)}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{user.name}</p>
          <p className="text-xs text-muted-foreground truncate">{user.email}</p>
        </div>
      </div>
      <nav className="flex-1 px-2 py-4 space-y-1">
        <a href="/dashboard" className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium hover:bg-muted">
          <Home className="h-4 w-4" /> Dashboard
        </a>
        <a href="#" className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium hover:bg-muted">
          <User className="h-4 w-4" /> Profile
        </a>
        <a href="#" className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium hover:bg-muted">
          <Settings className="h-4 w-4" /> Settings
        </a>
      </nav>
      <div className="mt-auto p-4 border-t">
        <Button variant="outline" className="w-full justify-start bg-transparent" onClick={onLogout}>
          <LogOut className="mr-2 h-4 w-4" /> Sign out
        </Button>
      </div>
    </aside>
  );
}

// Helper to format date strings
function formatDate(dateString) {
  if (!dateString) return 'Unknown';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

export default function Dashboard({ user }) {
  const router = useRouter();

  const handleLogout = async () => {
    await fetch('/api/logout', { method: 'POST' });
    router.push('/login');
  };

  return (
    <div className="flex min-h-screen bg-muted">
      <Sidebar user={user} onLogout={handleLogout} />
      <main className="flex-1 flex flex-col">
        <header className="flex h-16 items-center gap-2 border-b px-6 bg-white">
          <h1 className="text-lg font-semibold">Dashboard</h1>
        </header>
        <div className="flex-1 space-y-6 p-6">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Welcome back, {user.name}!</h2>
            <p className="text-muted-foreground">Here's what's happening with your account today.</p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader className="!flex-row items-center gap-2 p-6">
                <User className="h-4 w-4 text-muted-foreground" />
                <CardTitle className="text-sm font-medium inline-flex">Profile</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={user.avatar_urls?.['96'] || "/placeholder.svg"} alt={user.name} />
                    <AvatarFallback className="text-lg">
                      {user.name ? user.name.split(" ").map((n) => n[0]).join("") : "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="space-y-1">
                    <h3 className="font-semibold">{user.name}</h3>
                    <Badge variant="secondary" className="text-xs">
                      <Shield className="mr-1 h-3 w-3" />
                      {user.role}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="!flex-row items-center gap-2 p-6">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <CardTitle className="text-sm font-medium inline-flex">Contact</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium">{user.email}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="!flex-row items-center gap-2 p-6">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <CardTitle className="text-sm font-medium inline-flex">Account</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div>
                    <p className="text-sm text-muted-foreground">Member since</p>
                    <p className="font-medium">{formatDate(user.joined || user.joinDate)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Last login</p>
                    <p className="font-medium">{formatDate(user.last_login)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Account Overview</CardTitle>
              <CardDescription>Your account information and recent activity</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <h4 className="font-semibold">Personal Information</h4>
                  <div className="space-y-1 text-sm">
                    <p><span className="text-muted-foreground">Name:</span> {user.name}</p>
                    <p><span className="text-muted-foreground">Email:</span> {user.email}</p>
                    <p><span className="text-muted-foreground">Role:</span> {user.role}</p>
                    <p><span className="text-muted-foreground">User ID:</span> {user.id}</p>
                    <p><span className="text-muted-foreground">Joined:</span> {formatDate(user.joined || user.joinDate)}</p>
                    <p><span className="text-muted-foreground">Last login:</span> {formatDate(user.last_login)}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold">Account Status</h4>
                  <div className="space-y-1 text-sm">
                    <p><span className="text-muted-foreground">Status:</span> <Badge variant="outline" className="text-green-600">Active</Badge></p>
                    <p><span className="text-muted-foreground">Last login:</span> {formatDate(user.last_login)}</p>
                    <p><span className="text-muted-foreground">Joined:</span> {formatDate(user.joined || user.joinDate)}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Capabilities</CardTitle>
              <CardDescription>All permissions granted to your account</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                {user.capabilities && Object.entries(user.capabilities).map(([cap, val]) => (
                  <div key={cap} className="flex items-center gap-2">
                    <Badge variant={val ? 'secondary' : 'outline'}>{cap}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
} 