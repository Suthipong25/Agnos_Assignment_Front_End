"use client";

import { createClient, type RealtimeChannel, type SupabaseClient } from "@supabase/supabase-js";
import type { PatientSessionState } from "@/lib/patient";

type RealtimeMessage = {
  type: "patient_state";
  payload: PatientSessionState;
};

type Subscription = {
  publish: (state: PatientSessionState) => Promise<void>;
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
    supabaseClient = createClient(url, anonKey, {
      realtime: {
        params: {
          eventsPerSecond: 12
        }
      }
    });
  }

  return supabaseClient;
}

export function connectPatientSession(
  sessionId: string,
  onMessage: (state: PatientSessionState) => void
): Subscription {
  const channelName = `patient-intake:${sessionId}`;
  const localChannel = typeof window !== "undefined" ? new BroadcastChannel(channelName) : null;
  const supabase = getSupabaseClient();
  let realtimeChannel: RealtimeChannel | null = null;

  localChannel?.addEventListener("message", (event: MessageEvent<RealtimeMessage>) => {
    if (event.data?.type === "patient_state") {
      onMessage(event.data.payload);
    }
  });

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

    void realtimeChannel.subscribe();
  }

  return {
    mode: supabase ? "supabase" : "local",
    async publish(state) {
      const message: RealtimeMessage = {
        type: "patient_state",
        payload: state
      };

      localChannel?.postMessage(message);

      if (realtimeChannel) {
        await realtimeChannel.send({
          type: "broadcast",
          event: "patient_state",
          payload: state
        });
      }
    },
    unsubscribe() {
      localChannel?.close();
      if (realtimeChannel) {
        void supabase?.removeChannel(realtimeChannel);
      }
    }
  };
}
