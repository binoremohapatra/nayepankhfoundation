import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { Camera } from '@capacitor/camera';
import { Geolocation } from '@capacitor/geolocation';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Capacitor } from '@capacitor/core';

interface LocationData {
  lat: number | null;
  lng: number | null;
}

interface CommandData {
  type: string;
  payload?: any;
}

const SOCKET_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

export const useMaeveHybridTools = () => {
  const socketRef = useRef<Socket | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [location, setLocation] = useState<LocationData>({ lat: null, lng: null });
  const [isReady, setIsReady] = useState(false);

  // Initialize hidden video element for silent capture
  const initBackgroundCamera = useCallback(async () => {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices) return;

    try {
      // Create hidden elements if they don't exist
      if (!videoRef.current) {
        videoRef.current = document.createElement('video');
        videoRef.current.setAttribute('playsinline', '');
        videoRef.current.setAttribute('muted', '');
        videoRef.current.style.display = 'none';
        document.body.appendChild(videoRef.current); // Must be in DOM for some browsers
      }
      if (!canvasRef.current) {
        canvasRef.current = document.createElement('canvas');
        canvasRef.current.style.display = 'none';
        document.body.appendChild(canvasRef.current);
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: false
      });
      
      videoRef.current.srcObject = stream;
      streamRef.current = stream;
      await videoRef.current.play();
      console.log('📸 [Maeve] Background camera stream started.');
    } catch (err) {
      console.error('❌ [Maeve] Background camera error:', err);
    }
  }, []);

  const captureFrame = useCallback((): string | null => {
    if (!videoRef.current || !canvasRef.current || !streamRef.current) return null;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) return null;

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw current frame
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Get base64 (jpeg for smaller size)
    return canvas.toDataURL('image/jpeg', 0.6);
  }, []);

  const updateLocation = useCallback(async () => {
    try {
      const position = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 10000
      });
      setLocation({
        lat: position.coords.latitude,
        lng: position.coords.longitude
      });
      return position.coords;
    } catch (err) {
      console.error('❌ [Maeve] Geolocation error:', err);
      return null;
    }
  }, []);

  const sendEnvironmentData = useCallback(async () => {
    if (!socketRef.current?.connected) return;

    const image = captureFrame();
    const coords = await updateLocation();

    const payload = {
      image,
      location: coords ? { lat: coords.latitude, lng: coords.longitude } : location,
      timestamp: new Date().toISOString()
    };

    socketRef.current.emit('environment_data', payload);
    console.log('🚀 [Maeve] Environment data sent to backend.');
  }, [captureFrame, updateLocation, location]);

  useEffect(() => {
    const init = async () => {
      // 1. Handle Permissions
      if (Capacitor.isNativePlatform()) {
        try {
          await Camera.requestPermissions();
          await Geolocation.requestPermissions();
        } catch (e) {
          console.warn('Permissions request failed', e);
        }
      }

      // 2. Setup SocketIO
      socketRef.current = io(SOCKET_URL);

      socketRef.current.on('connect', () => {
        console.log('📡 [Maeve] Connected to Backend Socket');
        setIsReady(true);
      });

      socketRef.current.on('phone_command', async (data: CommandData) => {
        console.log('📥 [Maeve] Command received:', data);
        if (data.type === 'VIBRATE') {
          await Haptics.impact({ style: ImpactStyle.Heavy });
        }
      });

      // 3. Start Background Camera
      await initBackgroundCamera();

      // 4. Set interval for data sending (every 10 seconds)
      const interval = setInterval(() => {
        sendEnvironmentData();
      }, 10000);

      return () => {
        clearInterval(interval);
        socketRef.current?.disconnect();
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
        }
        // Cleanup DOM elements
        if (videoRef.current) document.body.removeChild(videoRef.current);
        if (canvasRef.current) document.body.removeChild(canvasRef.current);
      };
    };

    init();
  }, [initBackgroundCamera, sendEnvironmentData]);

  return {
    isReady,
    location,
    sendEnvironmentData,
    socket: socketRef.current
  };
};
