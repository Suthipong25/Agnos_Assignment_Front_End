"use client";

import { createClient } from "@supabase/supabase-js";

let supabaseClient = null;

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
  sessionId,
  onMessage,
  onRequestLatest
) {
  const channelName = `patient-intake:${sessionId}`;
  const storageKey = `patient_session_cache:${sessionId}`;
  const localChannel = typeof window !== "undefined" ? new BroadcastChannel(channelName) : null;
  const supabase = getSupabaseClient();
  let realtimeChannel = null;
  let isSubscribed = false;
  let latestTimestamp = 0;

  const emitMessage = (state) => {
    if (!state) return;
    const stateTime = state.lastUpdatedAt ? new Date(state.lastUpdatedAt).getTime() : 0;
    if (stateTime >= latestTimestamp) {
      latestTimestamp = stateTime;
      onMessage(state);
    }
  };

  // 1. Initial hydration from localStorage if available
  if (typeof window !== "undefined") {
    try {
      const cached = localStorage.getItem(storageKey);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed?.lastUpdatedAt) {
          emitMessage(parsed);
        }
      }
    } catch {
      // ignore JSON parse error
    }
  }

  // 2. Window storage event listener for cross-tab sync in same browser
  const handleStorageChange = (e) => {
    if (e.key === storageKey && e.newValue) {
      try {
        const parsed = JSON.parse(e.newValue);
        if (parsed?.lastUpdatedAt) {
          emitMessage(parsed);
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
  localChannel?.addEventListener("message", (event) => {
    if (event.data?.type === "patient_state") {
      emitMessage(event.data.payload);
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
      emitMessage(payload);
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
      const message = {
        type: "patient_state",
        payload: state
      };

      // Update local timestamp guard
      if (state.lastUpdatedAt) {
        latestTimestamp = new Date(state.lastUpdatedAt).getTime();
      }

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
      const message = {
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
