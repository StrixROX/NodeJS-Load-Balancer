import type { ServerInstance } from '../types';

export const EVENT_TYPES = {
  CONNECTION_COUNT_CHANGED: 'connectionCountChanged',
};

export const parseEventToString = (
  eventType: keyof typeof EVENT_TYPES,
  server: ServerInstance
): string => {
  if (eventType === 'CONNECTION_COUNT_CHANGED') {
    return `connectionCount_server#${server.id}:${server.getConnectionsSync()}`;
  }

  return '';
};
