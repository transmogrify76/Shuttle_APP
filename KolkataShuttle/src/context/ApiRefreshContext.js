import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { useAuth } from './AuthContext';
import { API_BASE_URL } from '../config/api';
import { eventEmitter } from '../utils/eventEmitter';

/**
 * Passenger API refresh WebSocket.
 *
 * Connects to wss://<api-host>/passenger/ws/refresh?token=<access_token>.
 * This channel does NOT carry replacement domain objects — it tells the app
 * which API-backed resource groups may be stale so screens can refetch their
 * existing REST queries. HTTP stays authoritative.
 *
 * It supplements (does not replace) the existing /notifications/ws and
 * /passenger/seatmap/ws connections, which keep their current jobs:
 *   - /notifications/ws        -> human-facing alerts, unread counts
 *   - /passenger/seatmap/ws    -> authoritative live seat snapshot for one leg
 *   - /passenger/ws/refresh    -> "this REST data may be stale, refetch it"
 *
 * On every 'api.refresh' message this context emits a global 'refreshData'
 * event via the existing eventEmitter singleton, carrying the resource
 * groups (`resources`) that changed. Screens that already listen for
 * 'refreshData' (e.g. MyBookingsScreen) keep working unchanged; screens that
 * want to be selective can inspect `resources`/`event` before refetching.
 */

const RETRY_DELAYS_MS = [1000, 2000, 5000, 10000, 30000];
const BATCH_WINDOW_MS = 150; // coalesce bursts of duplicate invalidations

const ApiRefreshContext = createContext();

export const useApiRefresh = () => useContext(ApiRefreshContext);

export const ApiRefreshProvider = ({ children }) => {
  const { token, user, logout } = useAuth();

  const [connectionState, setConnectionState] = useState('disconnected'); // 'connecting' | 'connected' | 'disconnected'
  const [lastEventAt, setLastEventAt] = useState(null);

  const wsRef = useRef(null);
  const retryTimerRef = useRef(null);
  const retryAttemptRef = useRef(0);
  const batchTimerRef = useRef(null);
  const pendingEventsRef = useRef([]);
  const stoppedRef = useRef(true);
  const generationRef = useRef(0);
  const appState = useRef(AppState.currentState);
  const tokenRef = useRef(token);

  tokenRef.current = token;

  const isPassenger = !!(user && (user.role === 'passenger' || !user.role));

  const isRefreshMessage = (value) => {
    if (!value || typeof value !== 'object') return false;
    return (
      value.type === 'api.refresh' &&
      value.audience === 'passenger' &&
      typeof value.event === 'string' &&
      Array.isArray(value.resources) &&
      Array.isArray(value.endpoints) &&
      value.data !== null &&
      typeof value.data === 'object' &&
      typeof value.occurred_at === 'string'
    );
  };

  const flushBatch = () => {
    batchTimerRef.current = null;
    const batch = pendingEventsRef.current;
    pendingEventsRef.current = [];
    if (batch.length === 0) return;

    const resources = [...new Set(batch.flatMap((evt) => evt.resources || []))];
    const latest = batch[batch.length - 1];

    setLastEventAt(latest.occurred_at);

    // Back-compat with the existing eventEmitter contract used by
    // NotificationContext (data.refresh -> { keys }) and BookingConfirmationScreen.
    eventEmitter.emit('refreshData', {
      keys: resources,
      resources,
      event: latest.event,
      events: batch,
      occurred_at: latest.occurred_at,
    });
  };

  const enqueue = (message) => {
    pendingEventsRef.current.push(message);
    if (batchTimerRef.current === null) {
      batchTimerRef.current = setTimeout(flushBatch, BATCH_WINDOW_MS);
    }
  };

  const buildUrl = () => {
    const base = API_BASE_URL.replace(/^http/, 'ws');
    const path = base.endsWith('/') ? base.slice(0, -1) : base;
    return `${path}/passenger/ws/refresh?token=${encodeURIComponent(tokenRef.current)}`;
  };

  const scheduleReconnect = () => {
    if (stoppedRef.current || retryTimerRef.current !== null) return;
    const base = RETRY_DELAYS_MS[Math.min(retryAttemptRef.current, RETRY_DELAYS_MS.length - 1)];
    retryAttemptRef.current += 1;
    const jittered = Math.round(base * (0.8 + Math.random() * 0.4));
    retryTimerRef.current = setTimeout(() => {
      retryTimerRef.current = null;
      connect();
    }, jittered);
  };

  const connect = () => {
    if (stoppedRef.current || !tokenRef.current) return;
    if (
      wsRef.current?.readyState === WebSocket.OPEN ||
      wsRef.current?.readyState === WebSocket.CONNECTING
    ) {
      return;
    }

    const myGeneration = generationRef.current;
    setConnectionState('connecting');

    let ws;
    try {
      ws = new WebSocket(buildUrl());
    } catch (err) {
      console.error('[ApiRefresh] failed to construct WebSocket:', err);
      scheduleReconnect();
      return;
    }
    wsRef.current = ws;

    ws.onopen = () => {
      if (myGeneration !== generationRef.current) return;
      console.log('[ApiRefresh] connected');
      retryAttemptRef.current = 0;
      setConnectionState('connected');
    };

    ws.onmessage = (evt) => {
      if (myGeneration !== generationRef.current) return;
      let message;
      try {
        message = JSON.parse(evt.data);
      } catch (err) {
        console.error('[ApiRefresh] failed to parse message:', evt.data);
        return;
      }

      if (message?.type === 'ping') {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'pong' }));
        }
        return;
      }

      // ws.ready only confirms transport/auth; the channel.connected
      // api.refresh event (sent right after) is what triggers sync.
      if (message?.type === 'ws.ready') {
        console.log('[ApiRefresh] authenticated:', message.message);
        return;
      }

      if (isRefreshMessage(message)) {
        enqueue(message);
        return;
      }

      console.log('[ApiRefresh] unrecognized message, ignoring:', message);
    };

    ws.onerror = (err) => {
      console.error('[ApiRefresh] socket error:', err?.message || err);
    };

    ws.onclose = (evt) => {
      if (myGeneration !== generationRef.current) return;
      console.log(`[ApiRefresh] closed (code ${evt.code})`);
      wsRef.current = null;
      setConnectionState('disconnected');
      if (stoppedRef.current) return;

      if (evt.code === 1008) {
        // Missing/invalid/expired token or wrong role. Do not loop reconnect.
        console.log('[ApiRefresh] auth failure (1008) — logging out');
        stoppedRef.current = true;
        logout?.();
        return;
      }

      scheduleReconnect();
    };
  };

  const disconnect = () => {
    stoppedRef.current = true;
    generationRef.current += 1;
    if (retryTimerRef.current) {
      clearTimeout(retryTimerRef.current);
      retryTimerRef.current = null;
    }
    if (batchTimerRef.current) {
      clearTimeout(batchTimerRef.current);
      batchTimerRef.current = null;
    }
    pendingEventsRef.current = [];
    retryAttemptRef.current = 0;
    if (wsRef.current) {
      wsRef.current.close(1000, 'client shutdown');
      wsRef.current = null;
    }
    setConnectionState('disconnected');
  };

  const start = () => {
    if (!stoppedRef.current) return;
    stoppedRef.current = false;
    connect();
  };

  // Start/stop on session and role changes. Only passengers open this socket.
  useEffect(() => {
    if (token && user && isPassenger) {
      start();
    } else {
      disconnect();
    }
    return () => disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, user?.user_id, user?.role]);

  // Reconnect (and force a resync via channel.connected) when the app
  // returns to the foreground, mirroring NotificationContext's behavior.
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active' &&
        token &&
        user &&
        isPassenger
      ) {
        console.log('[ApiRefresh] app foregrounded, reconnecting');
        disconnect();
        stoppedRef.current = false;
        connect();
      }
      appState.current = nextAppState;
    });
    return () => subscription.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, user?.user_id, user?.role]);

  return (
    <ApiRefreshContext.Provider value={{ connectionState, lastEventAt }}>
      {children}
    </ApiRefreshContext.Provider>
  );
};