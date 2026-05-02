/**
 * 0G Storage client — KV (live state) and Log (append-only history).
 *
 * Real impl writes to 0G Storage via @0glabs/0g-ts-sdk. Local fallback uses
 * an in-memory map so the agent loop runs offline during development.
 */

type LogEntry = Record<string, unknown> & { ts: number };

const kv = new Map<string, Record<string, unknown>>();
const logs = new Map<string, LogEntry[]>();

export const ogStorage = {
  async readKv(key: string): Promise<Record<string, unknown> | null> {
    return kv.get(key) ?? null;
  },
  async writeKv(key: string, value: Record<string, unknown>): Promise<string> {
    kv.set(key, value);
    return `og-kv://${key}@${Date.now()}`;
  },
  async readLog(key: string): Promise<LogEntry[]> {
    return logs.get(key) ?? [];
  },
  async appendLog(key: string, entry: LogEntry): Promise<string> {
    const arr = logs.get(key) ?? [];
    arr.push(entry);
    logs.set(key, arr);
    return `og-log://${key}#${arr.length}`;
  }
};
