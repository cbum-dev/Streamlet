"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Plus, 
  Eye, 
  EyeOff, 
  Copy, 
  Trash2, 
  Edit,
  Key,
  Calendar,
  Activity
} from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface StreamKey {
  id: string;
  name: string;
  platform: string;
  maskedKey: string;
  isActive: boolean;
  createdAt: string;
  lastUsed?: string;
}

interface StreamKeyManagerProps {
  userId: string;
  onUpdate: () => void;
}

export default function StreamKeyManager({ userId, onUpdate }: StreamKeyManagerProps) {
  const [streamKeys, setStreamKeys] = useState<StreamKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set());
  
  // Form state
  const [newKey, setNewKey] = useState({
    name: "",
    platform: "",
    streamKey: ""
  });

  useEffect(() => {
    if (!userId) return;
    fetchStreamKeys();
  }, [userId]);

  const fetchStreamKeys = async () => {
    try {
      setLoading(true);
      if (!userId) return;
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/stream-keys/user/${userId}`);
      if (response.ok) {
        const data = await response.json();
        setStreamKeys(data.streamKeys || []);
      }
    } catch (error) {
      console.error('Error fetching stream keys:', error);
    } finally {
      setLoading(false);
    }
  };

  const createStreamKey = async () => {
    try {
      if (!userId) return;
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/stream-keys/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          ...newKey
        }),
      });

      if (response.ok) {
        setNewKey({ name: "", platform: "", streamKey: "" });
        setShowCreateDialog(false);
        fetchStreamKeys();
        onUpdate();
      }
    } catch (error) {
      console.error('Error creating stream key:', error);
    }
  };

  const deleteStreamKey = async (keyId: string) => {
    try {
      if (!userId) return;
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/stream-keys/${keyId}?userId=${userId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchStreamKeys();
        onUpdate();
      }
    } catch (error) {
      console.error('Error deleting stream key:', error);
    }
  };

  const toggleKeyVisibility = async (keyId: string) => {
    if (visibleKeys.has(keyId)) {
      setVisibleKeys(prev => {
        const newSet = new Set(prev);
        newSet.delete(keyId);
        return newSet;
      });
    } else {
      try {
        if (!userId) return;
        const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/stream-keys/decrypt/${keyId}?userId=${userId}`);
        if (response.ok) {
          const data = await response.json();
          // Store the decrypted key temporarily
          setStreamKeys(prev => prev.map(key => 
            key.id === keyId ? { ...key, decryptedKey: data.streamKey } : key
          ));
          setVisibleKeys(prev => new Set(prev).add(keyId));
        }
      } catch (error) {
        console.error('Error decrypting stream key:', error);
      }
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const getPlatformColor = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'youtube': return 'bg-red-100 text-red-800';
      case 'twitch': return 'bg-purple-100 text-purple-800';
      case 'facebook': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return <div>Loading stream keys...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Stream Keys</h2>
          <p className="text-muted-foreground">
            Manage your streaming platform keys securely
          </p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Stream Key
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Stream Key</DialogTitle>
              <DialogDescription>
                Add a new stream key for your preferred platform
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Key Name</Label>
                <Input
                  id="name"
                  placeholder="e.g., YouTube Main Channel"
                  value={newKey.name}
                  onChange={(e) => setNewKey(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="platform">Platform</Label>
                <Select value={newKey.platform} onValueChange={(value) => setNewKey(prev => ({ ...prev, platform: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select platform" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="youtube">YouTube</SelectItem>
                    <SelectItem value="twitch">Twitch</SelectItem>
                    <SelectItem value="facebook">Facebook</SelectItem>
                    <SelectItem value="custom">Custom RTMP</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="streamKey">Stream Key</Label>
                <Input
                  id="streamKey"
                  type="password"
                  placeholder="Enter your stream key"
                  value={newKey.streamKey}
                  onChange={(e) => setNewKey(prev => ({ ...prev, streamKey: e.target.value }))}
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={createStreamKey} disabled={!newKey.name || !newKey.platform || !newKey.streamKey}>
                  Create Key
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {streamKeys.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Key className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Stream Keys</h3>
            <p className="text-muted-foreground text-center mb-4">
              Add your first stream key to start streaming to your favorite platforms
            </p>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Stream Key
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {streamKeys.map((key) => (
            <Card key={key.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Key className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <CardTitle className="text-lg">{key.name}</CardTitle>
                      <CardDescription className="flex items-center space-x-2">
                        <Badge className={getPlatformColor(key.platform)}>
                          {key.platform.toUpperCase()}
                        </Badge>
                        {key.isActive ? (
                          <Badge variant="outline" className="text-green-600">
                            <Activity className="h-3 w-3 mr-1" />
                            Active
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-gray-600">
                            Inactive
                          </Badge>
                        )}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleKeyVisibility(key.id)}
                    >
                      {visibleKeys.has(key.id) ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(
                        visibleKeys.has(key.id) 
                          ? (key as any).decryptedKey || key.maskedKey 
                          : key.maskedKey
                      )}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteStreamKey(key.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Stream Key:</span>
                    <code className="bg-muted px-2 py-1 rounded text-sm">
                      {visibleKeys.has(key.id) 
                        ? (key as any).decryptedKey || key.maskedKey
                        : key.maskedKey
                      }
                    </code>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Created:</span>
                    <span className="flex items-center">
                      <Calendar className="h-3 w-3 mr-1" />
                      {new Date(key.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  {key.lastUsed && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Last Used:</span>
                      <span>{new Date(key.lastUsed).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
