"use client";

import { createClient, type RealtimeChannel, type SupabaseClient } from "@supabase/supabase-js";
import type { PatientSessionState } from "@/lib/patient";

type RealtimeMessage =
  | {
      type: "patient_state";
      payload: PatientSessionState;
    }
  | {
      type: "state_request";
      payload: {
        requestedAt: string;
      };
    };

type Subscription = {
  publish: (state: PatientSessionState) => Promise<void>;
  requestLatest: () => Promise<void>;
  unsubscribe: () => void;
  mode: "supabase" | "local";
};

let supabaseClient: SupabaseClient | null = null;

function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    return null;
  }

  if (!supabaseClient) {
    try {
      supabaseClient = createClient(url, anonKey, {
        realtime: {
          params: {
            eventsPerSecond: 12
          }
        }
      });
    } catch (err) {
      console.error("Supabase client initialization error:", err);
      return null;
    }
  }

  return supabaseClient;
}

export function connectPatientSession(
  sessionId: string,
  onMessage: (state: PatientSessionState) => void,
  onRequestLatest?: () => void
): Subscription {
  const channelName = `patient-intake:${sessionId}`;
  const storageKey = `patient_session_cache:${sessionId}`;
  const localChannel = typeof window !== "undefined" ? new BroadcastChannel(channelName) : null;
  const supabase = getSupabaseClient();
  let realtimeChannel: RealtimeChannel | null = null;
  let isSubscribed = false;

  // 1. Initial hydration from localStorage if available
  if (typeof window !== "undefined") {
    try {
      const cached = localStorage.getItem(storageKey);
      if (cached) {
        const parsed = JSON.parse(cached) as PatientSessionState;
        if (parsed?.lastUpdatedAt) {
          onMessage(parsed);
        }
      }
    } catch {
      // ignore JSON parse error
    }
  }

  // 2. Window storage event listener for cross-tab sync in same browser
  const handleStorageChange = (e: StorageEvent) => {
    if (e.key === storageKey && e.newValue) {
      try {
        const parsed = JSON.parse(e.newValue) as PatientSessionState;
        if (parsed?.lastUpdatedAt) {
          onMessage(parsed);
        }
      } catch {
        // ignore parse error
      }
    }
  };

  if (typeof window !== "undefined") {
    window.addEventListener("storage", handleStorageChange);
  }

  // 3. BroadcastChannel listener
  localChannel?.addEventListener("message", (event: MessageEvent<RealtimeMessage>) => {
    if (event.data?.type === "patient_state") {
      onMessage(event.data.payload);
    }

    if (event.data?.type === "state_request") {
      onRequestLatest?.();
    }
  });

  // 4. Supabase Realtime channel
  if (supabase) {
    realtimeChannel = supabase.channel(channelName, {
      config: {
        broadcast: {
          self: false
        }
      }
    });

    realtimeChannel.on("broadcast", { event: "patient_state" }, ({ payload }) => {
      onMessage(payload as PatientSessionState);
    });

    realtimeChannel.on("broadcast", { event: "state_request" }, () => {
      onRequestLatest?.();
    });

    realtimeChannel.subscribe((status) => {
      isSubscribed = status === "SUBSCRIBED";
    });
  }

  return {
    mode: supabase ? "supabase" : "local",
    async publish(state) {
      const message: RealtimeMessage = {
        type: "patient_state",
        payload: state
      };

      // Update localStorage for instant local tab sync
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem(storageKey, JSON.stringify(state));
        } catch {
          // ignore quota error
        }
      }

      // Publish via BroadcastChannel
      localChannel?.postMessage(message);

      // Publish via Supabase safely
      if (realtimeChannel) {
        try {
          if (isSubscribed) {
            await realtimeChannel.send({
              type: "broadcast",
              event: "patient_state",
              payload: state
            });
          } else {
            await realtimeChannel.httpSend("patient_state", state);
          }
        } catch (err) {
          console.warn("Supabase realtime broadcast fallback:", err);
        }
      }
    },
    async requestLatest() {
      // Re-check localStorage first
      if (typeof window !== "undefined") {
        try {
          const cached = localStorage.getItem(storageKey);
          if (cached) {
            const parsed = JSON.parse(cached) as PatientSessionState;
            if (parsed?.lastUpdatedAt) {
              onMessage(parsed);
            }
          }
        } catch {
          // ignore
        }
      }

      const message: RealtimeMessage = {
        type: "state_request",
        payload: {
          requestedAt: new Date().toISOString()
        }
      };

      localChannel?.postMessage(message);

      if (realtimeChannel) {
        try {
          if (isSubscribed) {
            await realtimeChannel.send({
              type: "broadcast",
              event: "state_request",
              payload: message.payload
            });
          } else {
            await realtimeChannel.httpSend("state_request", message.payload);
          }
        } catch (err) {
          console.warn("Supabase state_request error:", err);
        }
      }
    },
    unsubscribe() {
      if (typeof window !== "undefined") {
        window.removeEventListener("storage", handleStorageChange);
      }
      localChannel?.close();
      if (realtimeChannel) {
        void supabase?.removeChannel(realtimeChannel);
      }
    }
  };
}

