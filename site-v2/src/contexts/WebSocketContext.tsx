import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import type { Socket } from 'socket.io-client';
import { SOCKET_BASE_URL } from '@/lib/apiBaseUrl';

interface WebSocketContextType {
  socket: Socket | null;
  isConnected: boolean;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

export const WebSocketProvider = ({ children }: { children: ReactNode }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    let isMounted = true;
    let activeSocket: Socket | null = null;

    const connectSocket = async () => {
      const token = localStorage.getItem('access_token');

      if (!token) {
        setSocket(null);
        setIsConnected(false);
        return;
      }

      const { io } = await import('socket.io-client');
      if (!isMounted) {
        return;
      }

      const newSocket = io(SOCKET_BASE_URL, {
        auth: { token },
        transports: ['polling'],
        reconnection: true,
        reconnectionDelay: 500,
        reconnectionDelayMax: 3000,
        reconnectionAttempts: 10,
        autoConnect: true,
        forceNew: false,
        multiplex: true,
      });

      newSocket.on('connect', () => {
        console.log('✓ Global WebSocket connected');
        setIsConnected(true);
      });

      newSocket.on('connect_error', (error) => {
        console.warn('WebSocket connection error:', error?.message || error);
      });

      newSocket.on('disconnect', (reason) => {
        console.log('✗ Global WebSocket disconnected -', reason);
        setIsConnected(false);
      });

      newSocket.on('error', (error) => {
        console.error('WebSocket error:', error);
      });

      activeSocket = newSocket;
      setSocket(newSocket);
    };

    void connectSocket();

    return () => {
      isMounted = false;
      if (activeSocket) {
        activeSocket.close();
      }
    };
  }, []);

  return (
    <WebSocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (context === undefined) {
    throw new Error('useWebSocket must be used within WebSocketProvider');
  }
  return context;
};
