"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Play, 
  Square, 
  Video, 
  VideoOff,
  Mic,
  MicOff,
  Settings,
  Users,
  Clock,
  Signal,
  Monitor
} from "lucide-react";
import { io, Socket } from "socket.io-client";

interface Stream {
  id: string;
  title: string;
  platform: string;
  quality: string;
  status: string;
  streamKey: {
    id: string;
    name: string;
    platform: string;
  };
}

interface StreamMetrics {
  viewers: number;
  bitrate?: number;
  fps?: number;
  duration: number;
}

interface LiveStreamProps {
  userId: string;
  onStatsUpdate: () => void;
}

export default function LiveStream({ userId, onStatsUpdate }: LiveStreamProps) {
  const [streams, setStreams] = useState<Stream[]>([]);
  const [selectedStream, setSelectedStream] = useState<string>("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamMetrics, setStreamMetrics] = useState<StreamMetrics>({
    viewers: 0,
    duration: 0
  });
  const [cameraEnabled, setCameraEnabled] = useState(true);
  const [micEnabled, setMicEnabled] = useState(true);
  const [selectedCamera, setSelectedCamera] = useState<string>("");
  const [selectedMic, setSelectedMic] = useState<string>("");
  const [devices, setDevices] = useState<{
    cameras: MediaDeviceInfo[];
    microphones: MediaDeviceInfo[];
  }>({ cameras: [], microphones: [] });

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const startTimeRef = useRef<number>(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    fetchStreams();
    getMediaDevices();
    initializeSocket();

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [userId]);

  const initializeSocket = () => {
    socketRef.current = io(process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001');
    
    socketRef.current.on('streamStarted', (data) => {
      console.log('Stream started:', data);
      setIsStreaming(true);
      startTimeRef.current = Date.now();
      startDurationTimer();
      onStatsUpdate();
    });

    socketRef.current.on('streamStopped', () => {
      console.log('Stream stopped');
      setIsStreaming(false);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      onStatsUpdate();
    });

    socketRef.current.on('streamError', (error) => {
      console.error('Stream error:', error);
      setIsStreaming(false);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    });

    socketRef.current.on('streamMetrics', (metrics) => {
      setStreamMetrics(prev => ({
        ...prev,
        viewers: metrics.viewers,
        bitrate: metrics.bitrate,
        fps: metrics.fps
      }));
    });
  };

  const startDurationTimer = () => {
    intervalRef.current = setInterval(() => {
      if (startTimeRef.current > 0) {
        const duration = Math.floor((Date.now() - startTimeRef.current) / 1000);
        setStreamMetrics(prev => ({ ...prev, duration }));
      }
    }, 1000);
  };

  const fetchStreams = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/streams/user/${userId}?status=created`);
      if (response.ok) {
        const data = await response.json();
        setStreams(data.streams || []);
      }
    } catch (error) {
      console.error('Error fetching streams:', error);
    }
  };

  const getMediaDevices = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const cameras = devices.filter(device => device.kind === 'videoinput');
      const microphones = devices.filter(device => device.kind === 'audioinput');
      
      setDevices({ cameras, microphones });
      
      if (cameras.length > 0 && !selectedCamera) {
        setSelectedCamera(cameras[0].deviceId);
      }
      if (microphones.length > 0 && !selectedMic) {
        setSelectedMic(microphones[0].deviceId);
      }
    } catch (error) {
      console.error('Error getting media devices:', error);
    }
  };

  const startPreview = async () => {
    try {
      const constraints: MediaStreamConstraints = {
        video: cameraEnabled ? {
          deviceId: selectedCamera ? { exact: selectedCamera } : undefined,
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          frameRate: { ideal: 30 }
        } : false,
        audio: micEnabled ? {
          deviceId: selectedMic ? { exact: selectedMic } : undefined,
          echoCancellation: true,
          noiseSuppression: true
        } : false
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error('Error starting preview:', error);
    }
  };

  const stopPreview = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const startStream = async () => {
    if (!selectedStream || !socketRef.current) return;

    const stream = streams.find(s => s.id === selectedStream);
    if (!stream) return;

    try {
      await startPreview();
      
      socketRef.current.emit('startStream', {
        streamId: selectedStream,
        userId,
        streamKeyId: stream.streamKey.id,
        quality: stream.quality
      });

      // Start sending video data (simplified for demo)
      if (streamRef.current && videoRef.current) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = 1920;
        canvas.height = 1080;

        const sendFrame = () => {
          if (!isStreaming || !streamRef.current) return;
          
          if (ctx && videoRef.current) {
            ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
            canvas.toBlob((blob) => {
              if (blob && socketRef.current) {
                const reader = new FileReader();
                reader.onload = () => {
                  if (reader.result) {
                    socketRef.current?.emit('binarystream', reader.result);
                  }
                };
                reader.readAsArrayBuffer(blob);
              }
            }, 'video/webm');
          }
          
          setTimeout(sendFrame, 1000 / 30); // 30 FPS
        };

        setTimeout(sendFrame, 100);
      }
    } catch (error) {
      console.error('Error starting stream:', error);
    }
  };

  const stopStream = () => {
    if (socketRef.current) {
      socketRef.current.emit('stopStream');
    }
    stopPreview();
  };

  const toggleCamera = async () => {
    setCameraEnabled(!cameraEnabled);
    if (streamRef.current) {
      const videoTrack = streamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !cameraEnabled;
      }
    }
  };

  const toggleMic = async () => {
    setMicEnabled(!micEnabled);
    if (streamRef.current) {
      const audioTrack = streamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !micEnabled;
      }
    }
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    if (!isStreaming) {
      startPreview();
    }
    
    return () => {
      if (!isStreaming) {
        stopPreview();
      }
    };
  }, [selectedCamera, selectedMic, cameraEnabled, micEnabled]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Go Live</h2>
          <p className="text-muted-foreground">
            Start streaming to your audience
          </p>
        </div>
        {isStreaming && (
          <Badge variant="destructive" className="animate-pulse">
            🔴 LIVE
          </Badge>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Video Preview */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Stream Preview</span>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={toggleCamera}
                    className={!cameraEnabled ? "bg-red-100" : ""}
                  >
                    {cameraEnabled ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={toggleMic}
                    className={!micEnabled ? "bg-red-100" : ""}
                  >
                    {micEnabled ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
                <video
                  ref={videoRef}
                  autoPlay
                  muted
                  playsInline
                  className="w-full h-full object-cover"
                />
                {!cameraEnabled && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
                    <VideoOff className="h-12 w-12 text-gray-400" />
                  </div>
                )}
                {isStreaming && (
                  <div className="absolute top-4 left-4 flex items-center space-x-4">
                    <Badge variant="destructive" className="animate-pulse">
                      🔴 LIVE
                    </Badge>
                    <Badge variant="outline" className="bg-black/50 text-white">
                      {formatDuration(streamMetrics.duration)}
                    </Badge>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Controls */}
        <div className="space-y-4">
          {/* Stream Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Stream Setup</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Select Stream</label>
                <Select value={selectedStream} onValueChange={setSelectedStream} disabled={isStreaming}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a stream" />
                  </SelectTrigger>
                  <SelectContent>
                    {streams.map((stream) => (
                      <SelectItem key={stream.id} value={stream.id}>
                        {stream.title} ({stream.platform})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium">Camera</label>
                <Select value={selectedCamera} onValueChange={setSelectedCamera} disabled={isStreaming}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select camera" />
                  </SelectTrigger>
                  <SelectContent>
                    {devices.cameras.map((camera) => (
                      <SelectItem key={camera.deviceId} value={camera.deviceId}>
                        {camera.label || `Camera ${camera.deviceId.slice(0, 8)}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium">Microphone</label>
                <Select value={selectedMic} onValueChange={setSelectedMic} disabled={isStreaming}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select microphone" />
                  </SelectTrigger>
                  <SelectContent>
                    {devices.microphones.map((mic) => (
                      <SelectItem key={mic.deviceId} value={mic.deviceId}>
                        {mic.label || `Microphone ${mic.deviceId.slice(0, 8)}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="pt-4">
                {!isStreaming ? (
                  <Button 
                    onClick={startStream} 
                    disabled={!selectedStream}
                    className="w-full bg-red-600 hover:bg-red-700"
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Start Streaming
                  </Button>
                ) : (
                  <Button 
                    onClick={stopStream}
                    variant="outline"
                    className="w-full"
                  >
                    <Square className="h-4 w-4 mr-2" />
                    Stop Stream
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Stream Metrics */}
          {isStreaming && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Signal className="h-4 w-4 mr-2" />
                  Live Metrics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Viewers</span>
                  <div className="flex items-center">
                    <Users className="h-4 w-4 mr-1" />
                    <span className="font-medium">{streamMetrics.viewers}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Duration</span>
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-1" />
                    <span className="font-medium">{formatDuration(streamMetrics.duration)}</span>
                  </div>
                </div>
                {streamMetrics.bitrate && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Bitrate</span>
                    <span className="font-medium">{Math.round(streamMetrics.bitrate)}k</span>
                  </div>
                )}
                {streamMetrics.fps && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">FPS</span>
                    <span className="font-medium">{Math.round(streamMetrics.fps)}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {streams.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Monitor className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Streams Available</h3>
            <p className="text-muted-foreground text-center mb-4">
              Create a stream first to start broadcasting
            </p>
            <Button variant="outline">
              Create Stream
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
