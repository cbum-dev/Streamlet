"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Clock,
  Video,
  Eye,
  Calendar,
  Download
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

interface Stream {
  id: string;
  title: string;
  platform: string;
  status: string;
  startedAt?: string;
  endedAt?: string;
  peakViewers: number;
  duration: number;
}

interface Analytics {
  timestamp: string;
  viewers: number;
  bitrate?: number;
  fps?: number;
}

interface StreamAnalyticsProps {
  userId: string;
}

export default function StreamAnalytics({ userId }: StreamAnalyticsProps) {
  const [streams, setStreams] = useState<Stream[]>([]);
  const [selectedStream, setSelectedStream] = useState<string>("");
  const [analytics, setAnalytics] = useState<Analytics[]>([]);
  const [summary, setSummary] = useState({
    totalDataPoints: 0,
    averageViewers: 0,
    peakViewers: 0,
    averageBitrate: 0,
    averageFps: 0
  });
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState("7d");

  useEffect(() => {
    fetchStreams();
  }, [userId]);

  useEffect(() => {
    if (selectedStream) {
      fetchStreamAnalytics(selectedStream);
    }
  }, [selectedStream]);

  const fetchStreams = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/streams/user/${userId}?limit=50`);
      if (response.ok) {
        const data = await response.json();
        const completedStreams = data.streams?.filter((s: Stream) => s.status === 'ended') || [];
        setStreams(completedStreams);
        if (completedStreams.length > 0 && !selectedStream) {
          setSelectedStream(completedStreams[0].id);
        }
      }
    } catch (error) {
      console.error('Error fetching streams:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStreamAnalytics = async (streamId: string) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/streams/${streamId}/analytics?userId=${userId}`);
      if (response.ok) {
        const data = await response.json();
        setAnalytics(data.analytics || []);
        setSummary(data.summary || {
          totalDataPoints: 0,
          averageViewers: 0,
          peakViewers: 0,
          averageBitrate: 0,
          averageFps: 0
        });
      }
    } catch (error) {
      console.error('Error fetching stream analytics:', error);
    }
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const getPlatformColor = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'youtube': return '#FF0000';
      case 'twitch': return '#9146FF';
      case 'facebook': return '#1877F2';
      default: return '#6B7280';
    }
  };

  // Prepare chart data
  const viewerChartData = analytics.map((item, index) => ({
    time: formatTimestamp(item.timestamp),
    viewers: item.viewers,
    index
  }));

  const bitrateChartData = analytics.filter(item => item.bitrate).map((item, index) => ({
    time: formatTimestamp(item.timestamp),
    bitrate: item.bitrate,
    index
  }));

  const fpsChartData = analytics.filter(item => item.fps).map((item, index) => ({
    time: formatTimestamp(item.timestamp),
    fps: item.fps,
    index
  }));

  // Platform distribution data
  const platformData = streams.reduce((acc, stream) => {
    acc[stream.platform] = (acc[stream.platform] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const platformChartData = Object.entries(platformData).map(([platform, count]) => ({
    name: platform.toUpperCase(),
    value: count,
    color: getPlatformColor(platform)
  }));

  if (loading) {
    return <div>Loading analytics...</div>;
  }

  const selectedStreamData = streams.find(s => s.id === selectedStream);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Stream Analytics</h2>
          <p className="text-muted-foreground">
            Detailed insights into your streaming performance
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="24h">Last 24h</SelectItem>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {streams.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <BarChart3 className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Analytics Available</h3>
            <p className="text-muted-foreground text-center mb-4">
              Complete some streams to see detailed analytics
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Stream Selector */}
          <Card>
            <CardHeader>
              <CardTitle>Select Stream</CardTitle>
              <CardDescription>Choose a stream to view detailed analytics</CardDescription>
            </CardHeader>
            <CardContent>
              <Select value={selectedStream} onValueChange={setSelectedStream}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a stream" />
                </SelectTrigger>
                <SelectContent>
                  {streams.map((stream) => (
                    <SelectItem key={stream.id} value={stream.id}>
                      <div className="flex items-center space-x-2">
                        <Badge className={`bg-${getPlatformColor(stream.platform)}`}>
                          {stream.platform.toUpperCase()}
                        </Badge>
                        <span>{stream.title}</span>
                        <span className="text-muted-foreground">
                          ({stream.startedAt ? new Date(stream.startedAt).toLocaleDateString() : 'N/A'})
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {selectedStreamData && (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Peak Viewers</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{summary.peakViewers}</div>
                    <p className="text-xs text-muted-foreground">
                      Highest concurrent viewers
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Avg Viewers</CardTitle>
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{summary.averageViewers}</div>
                    <p className="text-xs text-muted-foreground">
                      Average concurrent viewers
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Duration</CardTitle>
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatDuration(selectedStreamData.duration)}</div>
                    <p className="text-xs text-muted-foreground">
                      Total stream time
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Platform</CardTitle>
                    <Video className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{selectedStreamData.platform.toUpperCase()}</div>
                    <p className="text-xs text-muted-foreground">
                      Streaming platform
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Viewer Count Over Time */}
                <Card>
                  <CardHeader>
                    <CardTitle>Viewer Count Over Time</CardTitle>
                    <CardDescription>Real-time viewer engagement during the stream</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={viewerChartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="time" 
                          tick={{ fontSize: 12 }}
                          interval="preserveStartEnd"
                        />
                        <YAxis />
                        <Tooltip />
                        <Line 
                          type="monotone" 
                          dataKey="viewers" 
                          stroke="#8884d8" 
                          strokeWidth={2}
                          dot={{ r: 4 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Platform Distribution */}
                <Card>
                  <CardHeader>
                    <CardTitle>Platform Distribution</CardTitle>
                    <CardDescription>Your streaming activity across platforms</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={platformChartData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {platformChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Bitrate Over Time */}
                {bitrateChartData.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Bitrate Performance</CardTitle>
                      <CardDescription>Stream quality metrics over time</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={bitrateChartData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="time" tick={{ fontSize: 12 }} />
                          <YAxis />
                          <Tooltip />
                          <Line 
                            type="monotone" 
                            dataKey="bitrate" 
                            stroke="#82ca9d" 
                            strokeWidth={2}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                )}

                {/* FPS Performance */}
                {fpsChartData.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Frame Rate Performance</CardTitle>
                      <CardDescription>FPS stability during the stream</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={fpsChartData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="time" tick={{ fontSize: 12 }} />
                          <YAxis />
                          <Tooltip />
                          <Line 
                            type="monotone" 
                            dataKey="fps" 
                            stroke="#ffc658" 
                            strokeWidth={2}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Detailed Stats Table */}
              <Card>
                <CardHeader>
                  <CardTitle>Stream Details</CardTitle>
                  <CardDescription>Comprehensive information about the selected stream</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Started At</p>
                      <p className="font-medium">
                        {selectedStreamData.startedAt 
                          ? new Date(selectedStreamData.startedAt).toLocaleString()
                          : 'N/A'
                        }
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Ended At</p>
                      <p className="font-medium">
                        {selectedStreamData.endedAt 
                          ? new Date(selectedStreamData.endedAt).toLocaleString()
                          : 'N/A'
                        }
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Data Points</p>
                      <p className="font-medium">{summary.totalDataPoints}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Status</p>
                      <Badge variant="outline">{selectedStreamData.status.toUpperCase()}</Badge>
                    </div>
                    {summary.averageBitrate > 0 && (
                      <div>
                        <p className="text-muted-foreground">Avg Bitrate</p>
                        <p className="font-medium">{summary.averageBitrate}k</p>
                      </div>
                    )}
                    {summary.averageFps > 0 && (
                      <div>
                        <p className="text-muted-foreground">Avg FPS</p>
                        <p className="font-medium">{summary.averageFps}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </>
      )}
    </div>
  );
}
