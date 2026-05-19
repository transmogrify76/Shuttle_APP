import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { API_BASE_URL } from '../config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SeatmapContext = createContext();

export const useSeatmap = () => useContext(SeatmapContext);

export const SeatmapProvider = ({ children }) => {
  const [ws, setWs] = useState(null);
  const [connected, setConnected] = useState(false);
  const [currentTopic, setCurrentTopic] = useState(null);
  const [seatmapData, setSeatmapData] = useState(null);
  const reconnectTimer = useRef(null);
  const wsRef = useRef(null);

  const getToken = async () => {
    return await AsyncStorage.getItem('access_token');
  };

  const connect = async () => {
    const token = await getToken();
    if (!token) return;
    const wsUrl = `${API_BASE_URL.replace('https', 'wss')}/passenger/seatmap/ws?token=${encodeURIComponent(token)}`;
    const websocket = new WebSocket(wsUrl);
    wsRef.current = websocket;
    setWs(websocket);

    websocket.onopen = () => {
      console.log('Seatmap WebSocket connected');
      if (currentTopic) subscribe(currentTopic);
    };

    websocket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'ping') {
        websocket.send(JSON.stringify({ type: 'pong' }));
        return;
      }
      if (data.type === 'seat_map.connected') {
        setConnected(true);
        return;
      }
      if (data.type === 'seat_map.snapshot') {
        if (currentTopic &&
            data.scheduled_trip_id === currentTopic.scheduled_trip_id &&
            data.route_id === currentTopic.route_id &&
            data.pickup_stop_id === currentTopic.pickup_stop_id &&
            data.dropoff_stop_id === currentTopic.dropoff_stop_id) {
          setSeatmapData(data);
        }
        return;
      }
      if (data.type === 'seat_map.error') {
        console.error('Seatmap error:', data.message);
      }
    };

    websocket.onerror = (err) => {
      console.error('Seatmap WS error', err);
      setConnected(false);
    };

    websocket.onclose = () => {
      console.log('Seatmap WS closed');
      setConnected(false);
      scheduleReconnect();
    };
  };

  const scheduleReconnect = () => {
    if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
    reconnectTimer.current = setTimeout(() => {
      connect();
    }, 5000);
  };

  const subscribe = (topic) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      setCurrentTopic(topic);
      connect();
      return;
    }
    setCurrentTopic(topic);
    wsRef.current.send(JSON.stringify({
      type: 'seat_map.subscribe',
      ...topic,
    }));
  };

  const refresh = () => {
    if (!currentTopic || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    wsRef.current.send(JSON.stringify({
      type: 'seat_map.refresh',
      ...currentTopic,
    }));
  };

  const unsubscribe = () => {
    if (currentTopic && wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'seat_map.unsubscribe',
        ...currentTopic,
      }));
    }
    setCurrentTopic(null);
    setSeatmapData(null);
  };

  const close = () => {
    if (wsRef.current) wsRef.current.close();
    if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
    setConnected(false);
    setWs(null);
  };

  useEffect(() => {
    return () => close();
  }, []);

  return (
    <SeatmapContext.Provider value={{ connected, seatmapData, subscribe, refresh, unsubscribe, close }}>
      {children}
    </SeatmapContext.Provider>
  );
};