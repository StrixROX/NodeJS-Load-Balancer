import type { ServerInstance } from '../types';

export const EVENT_TYPES = {
  CONNECTION_COUNT_CHANGED: 'connectionCountChanged',
  NETWORK_MONITOR_CONNECTED: 'newListener',
};

export const parseEventToString = (
  eventType: keyof typeof EVENT_TYPES,
  server: ServerInstance
): string => {
  if (eventType === 'CONNECTION_COUNT_CHANGED') {
    return `connectionCount_server#${server.id}:${server.getConnectionsSync()}`;
  } else if (eventType === 'NETWORK_MONITOR_CONNECTED') {
    return `monitoring_server#${server.id}:${server.getConnectionsSync()}`;
  }

  return '';
};
