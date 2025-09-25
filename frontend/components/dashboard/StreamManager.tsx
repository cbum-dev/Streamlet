"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Play, 
  Square, 
  Video, 
  Users, 
  Clock,
  Plus,
  Eye,
  Calendar,
  BarChart3,
  Trash2
} from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface Stream {
  id: string;
  title: string;
  description?: string;
  platform: string;
  quality: string;
  status: string;
  startedAt?: string;
  endedAt?: string;
  createdAt: string;
  peakViewers: number;
  duration: number;
  streamKey: {
    name: string;
    platform: string;
  };
  recording?: {
    id: string;
    filename: string;
    duration: number;
    fileSize: number;
    isProcessed: boolean;
  };
}

interface StreamKey {
  id: string;
  name: string;
  platform: string;
  isActive: boolean;
}

interface StreamManagerProps {
  userId: string;
  onStatsUpdate: () => void;
}

export default function StreamManager({ userId, onStatsUpdate }: StreamManagerProps) {
  const [streams, setStreams] = useState<Stream[]>([]);
  const [streamKeys, setStreamKeys] = useState<StreamKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  
  // Form state
  const [newStream, setNewStream] = useState({
    title: "",
    description: "",
    streamKeyId: "",
    quality: "medium"
  });

  useEffect(() => {
    if (!userId) return;
    fetchStreams();
    fetchStreamKeys();
  }, [userId]);

  const fetchStreams = async () => {
    try {
      setLoading(true);
      if (!userId) return;
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/streams/user/${userId}?limit=20`);
      if (response.ok) {
        const data = await response.json();
        setStreams(data.streams || []);
      }
    } catch (error) {
      console.error('Error fetching streams:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStreamKeys = async () => {
    try {
      if (!userId) return;
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/stream-keys/user/${userId}`);
      if (response.ok) {
        const data = await response.json();
        setStreamKeys(data.streamKeys?.filter((key: StreamKey) => key.isActive) || []);
      }
    } catch (error) {
      console.error('Error fetching stream keys:', error);
    }
  };

  const createStream = async () => {
    try {
      if (!userId) return;
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/streams/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          ...newStream
        }),
      });

      if (response.ok) {
        setNewStream({ title: "", description: "", streamKeyId: "", quality: "medium" });
        setShowCreateDialog(false);
        fetchStreams();
        onStatsUpdate();
      }
    } catch (error) {
      console.error('Error creating stream:', error);
    }
  };

  const deleteStream = async (streamId: string) => {
    try {
      if (!userId) return;
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/streams/${streamId}?userId=${userId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchStreams();
        onStatsUpdate();
      }
    } catch (error) {
      console.error('Error deleting stream:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'live': return 'bg-red-100 text-red-800';
      case 'ended': return 'bg-green-100 text-green-800';
      case 'created': return 'bg-blue-100 text-blue-800';
      case 'error': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPlatformColor = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'youtube': return 'bg-red-100 text-red-800';
      case 'twitch': return 'bg-purple-100 text-purple-800';
      case 'facebook': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  const formatFileSize = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  if (loading) {
    return <div>Loading streams...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Stream Management</h2>
          <p className="text-muted-foreground">
            Create and manage your streaming sessions
          </p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button disabled={streamKeys.length === 0}>
              <Plus className="h-4 w-4 mr-2" />
              Create Stream
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Stream</DialogTitle>
              <DialogDescription>
                Set up a new streaming session
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Stream Title</Label>
                <Input
                  id="title"
                  placeholder="Enter stream title"
                  value={newStream.title}
                  onChange={(e) => setNewStream(prev => ({ ...prev, title: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="description">Description (Optional)</Label>
                <Input
                  id="description"
                  placeholder="Stream description"
                  value={newStream.description}
                  onChange={(e) => setNewStream(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="streamKey">Stream Key</Label>
                <Select value={newStream.streamKeyId} onValueChange={(value) => setNewStream(prev => ({ ...prev, streamKeyId: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select stream key" />
                  </SelectTrigger>
                  <SelectContent>
                    {streamKeys.map((key) => (
                      <SelectItem key={key.id} value={key.id}>
                        {key.name} ({key.platform})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="quality">Quality</Label>
                <Select value={newStream.quality} onValueChange={(value) => setNewStream(prev => ({ ...prev, quality: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select quality" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low (1000k bitrate, 15fps)</SelectItem>
                    <SelectItem value="medium">Medium (2500k bitrate, 25fps)</SelectItem>
                    <SelectItem value="high">High (4000k bitrate, 30fps)</SelectItem>
                    <SelectItem value="ultra">Ultra (6000k bitrate, 60fps)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={createStream} disabled={!newStream.title || !newStream.streamKeyId}>
                  Create Stream
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {streamKeys.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Video className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Stream Keys Available</h3>
            <p className="text-muted-foreground text-center mb-4">
              You need to add at least one stream key before creating streams
            </p>
            <Button variant="outline">
              Go to Stream Keys
            </Button>
          </CardContent>
        </Card>
      )}

      {streams.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Video className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Streams Yet</h3>
            <p className="text-muted-foreground text-center mb-4">
              Create your first stream to get started
            </p>
            {streamKeys.length > 0 && (
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Stream
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {streams.map((stream) => (
            <Card key={stream.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Video className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <CardTitle className="text-lg">{stream.title}</CardTitle>
                      <CardDescription className="flex items-center space-x-2">
                        <Badge className={getStatusColor(stream.status)}>
                          {stream.status.toUpperCase()}
                        </Badge>
                        <Badge className={getPlatformColor(stream.platform)}>
                          {stream.platform.toUpperCase()}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {stream.streamKey.name}
                        </span>
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteStream(stream.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div className="flex items-center space-x-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{stream.peakViewers}</p>
                      <p className="text-muted-foreground">Peak Viewers</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium">
                        {stream.duration > 0 ? formatDuration(stream.duration) : 'N/A'}
                      </p>
                      <p className="text-muted-foreground">Duration</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium">
                        {new Date(stream.createdAt).toLocaleDateString()}
                      </p>
                      <p className="text-muted-foreground">Created</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <BarChart3 className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{stream.quality.toUpperCase()}</p>
                      <p className="text-muted-foreground">Quality</p>
                    </div>
                  </div>
                </div>
                
                {stream.description && (
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-sm text-muted-foreground">{stream.description}</p>
                  </div>
                )}
                
                {stream.recording && (
                  <div className="mt-4 pt-4 border-t">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Video className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Recording Available</span>
                        <Badge variant={stream.recording.isProcessed ? "default" : "secondary"}>
                          {stream.recording.isProcessed ? "Processed" : "Processing"}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {formatFileSize(stream.recording.fileSize)} • {formatDuration(stream.recording.duration)}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
