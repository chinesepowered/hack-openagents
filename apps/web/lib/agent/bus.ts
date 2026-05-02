import type { AgentEvent } from "./types";

type Listener = (e: AgentEvent) => void;

const listeners = new Map<string, Set<Listener>>();

export function publish(strategyId: string, event: AgentEvent) {
  const set = listeners.get(strategyId);
  if (!set) return;
  for (const fn of set) fn(event);
}

export function subscribe(strategyId: string, fn: Listener) {
  let set = listeners.get(strategyId);
  if (!set) {
    set = new Set();
    listeners.set(strategyId, set);
  }
  set.add(fn);
  return () => set!.delete(fn);
}
