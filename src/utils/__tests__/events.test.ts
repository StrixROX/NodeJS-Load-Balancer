import { ServerInstance } from '../../types';
import { EVENT_TYPES, parseEventToString } from '../events';

describe('Events', () => {
  it('Exports the correct event types', () => {
    expect(Object.keys(EVENT_TYPES)).toContain('CONNECTION_COUNT_CHANGED');
    expect(Object.keys(EVENT_TYPES)).toContain('NETWORK_MONITOR_CONNECTED');

    expect(EVENT_TYPES.CONNECTION_COUNT_CHANGED).toBe('connectionCountChanged');
    expect(EVENT_TYPES.NETWORK_MONITOR_CONNECTED).toBe('newListener');
  });

  it('parseEventToString returns empty string for unknown event type', () => {
    /** @ts-expect-error: event is intentionally incorrect */
    expect(parseEventToString('randomevent', {} as ServerInstance)).toBe('');
  });

  it('parseEventToString returns the correct strings', () => {
    expect(
      parseEventToString('CONNECTION_COUNT_CHANGED', {
        id: 1021,
        getConnectionsSync: () => 2,
      } as ServerInstance)
    ).toBe('connectionCount_server#1021:2');

    expect(
      parseEventToString('NETWORK_MONITOR_CONNECTED', {
        id: 1021,
        getConnectionsSync: () => 2,
      } as ServerInstance)
    ).toBe('monitoring_server#1021:2');
  });
});
