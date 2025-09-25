"use client";

import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Play, 
  Square, 
  Key, 
  BarChart3, 
  Video, 
  Users, 
  Clock
} from "lucide-react";
import StreamKeyManager from "@/components/dashboard/StreamKeyManager";
import StreamAnalytics from "@/components/dashboard/StreamAnalytics";
import StreamManager from "@/components/dashboard/StreamManager";
interface UserStats {
  totalStreams: number;
  totalViewers: number;
  isLive: boolean;
  streamKeys: number;
}

export default function DashboardPage() {
  const { data: session } = useSession({
    required: true,
    onUnauthenticated() {
      redirect("/signin");
    },
  });

  const [userStats, setUserStats] = useState<UserStats>({
    totalStreams: 0,
    totalViewers: 0,
    isLive: false,
    streamKeys: 0
  });
  
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    if (session?.user?.id) {
      fetchUserStats();
    }
  }, [session?.user?.id]);

  const fetchUserStats = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/auth/profile/${session?.user?.id}`);
      if (response.ok) {
        const data = await response.json();
        setUserStats({
          totalStreams: data.user.totalStreams || 0,
          totalViewers: data.user.totalViewers || 0,
          isLive: data.user.isLive || false,
          streamKeys: data.user.streamKeys?.length || 0
        });
      }
    } catch (error) {
      console.error('Error fetching user stats:', error);
    }
  };

  if (!session?.user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {session.user.name}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {userStats.isLive && (
            <Badge variant="destructive" className="animate-pulse">
              🔴 LIVE
            </Badge>
          )}
          <Badge variant="outline">
            {userStats.streamKeys} Stream Keys
          </Badge>
          <a href="/stream">
            <Button className="bg-red-600 hover:bg-red-700">
              Go Live
            </Button>
          </a>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Streams</CardTitle>
            <Video className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userStats.totalStreams}</div>
            <p className="text-xs text-muted-foreground">
              All time streams
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Viewers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userStats.totalViewers}</div>
            <p className="text-xs text-muted-foreground">
              Lifetime viewers
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Stream Keys</CardTitle>
            <Key className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userStats.streamKeys}</div>
            <p className="text-xs text-muted-foreground">
              Active keys
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Status</CardTitle>
            <div className={`h-4 w-4 rounded-full ${userStats.isLive ? 'bg-red-500' : 'bg-gray-300'}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {userStats.isLive ? 'Live' : 'Offline'}
            </div>
            <p className="text-xs text-muted-foreground">
              Current status
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs (removed Go Live and Settings) */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="keys">Stream Keys</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <StreamManager userId={session.user.id} onStatsUpdate={fetchUserStats} />
        </TabsContent>

        <TabsContent value="keys" className="space-y-4">
          <StreamKeyManager userId={session.user.id} onUpdate={fetchUserStats} />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <StreamAnalytics userId={session.user.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}