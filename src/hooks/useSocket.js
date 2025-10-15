import { useEffect, useRef } from 'react';
import io from 'socket.io-client';

const useSocket = (serverPath = 'http://localhost:5003') => {
  const socketRef = useRef();

  useEffect(() => {
    console.log('🔌 [useSocket] Inicializando conexión WebSocket...');
    console.log('🔌 [useSocket] Server:', serverPath);
    
    // Crear conexión de socket
    socketRef.current = io(serverPath, {
      transports: ['websocket', 'polling']
    });

    // Agregar eventos de conexión para debugging
    socketRef.current.on('connect', () => {
      console.log('✅ [useSocket] Conectado al servidor WebSocket');
      console.log('✅ [useSocket] Socket ID:', socketRef.current.id);
    });

    socketRef.current.on('disconnect', (reason) => {
      console.log('❌ [useSocket] Desconectado del servidor WebSocket:', reason);
    });

    socketRef.current.on('connect_error', (error) => {
      console.log('🚨 [useSocket] Error de conexión:', error);
    });

    // Cleanup al desmontar
    return () => {
      console.log('🧹 [useSocket] Limpiando conexión WebSocket');
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [serverPath]);

  return socketRef.current;
};

export default useSocket;