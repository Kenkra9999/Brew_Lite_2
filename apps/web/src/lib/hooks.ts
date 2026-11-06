"use client";
import { useCallback, useEffect, useState } from "react";
import { api } from "./api";
export function useResource<T>(path: string | null, poll = 0) {
  const [data, setData] = useState<T | null>(null),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(true);
  const load = useCallback(async () => {
    if (!path) {
      setLoading(false);
      return;
    }
    try {
      setData(await api<T>(path));
      setError("");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [path]);
  useEffect(() => {
    setData(null);
    setLoading(true);
    void load();
    if (poll) {
      const id = setInterval(load, poll);
      return () => clearInterval(id);
    }
  }, [load, poll]);
  return { data, error, loading, reload: load };
}
export function useReady() {
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  return ready;
}
