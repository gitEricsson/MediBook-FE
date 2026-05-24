import { create } from 'zustand';
import { TelemedicineService, type VideoCallSession } from '@/services/telemedicine.service';

type TwilioTrack = {
  kind?: string;
  isEnabled?: boolean;
  enable?: () => void;
  disable?: () => void;
  stop?: () => void;
  attach?: () => HTMLMediaElement;
  detach?: () => HTMLMediaElement[];
};

type TwilioRoom = {
  disconnect: () => void;
  localParticipant?: {
    publishTrack?: (track: TwilioTrack) => Promise<unknown>;
    unpublishTrack?: (track: TwilioTrack) => void;
  };
  participants?: Map<string, TwilioParticipant>;
  on: (event: string, handler: (...args: unknown[]) => void) => void;
  name?: string;
};

type TwilioParticipant = {
  identity: string;
  tracks?: Map<string, TwilioPublication>;
  on: (event: string, handler: (...args: unknown[]) => void) => void;
};

type TwilioPublication = {
  isSubscribed?: boolean;
  track?: TwilioTrack;
  on?: (event: string, handler: (...args: unknown[]) => void) => void;
};

export interface RemoteParticipantState {
  identity: string;
  tracks: TwilioTrack[];
}

interface VideoCallState {
  activeCall: VideoCallSession | null;
  room: TwilioRoom | null;
  localTracks: TwilioTrack[];
  remoteParticipants: RemoteParticipantState[];
  isConnecting: boolean;
  isInCall: boolean;
  isMuted: boolean;
  isCameraOff: boolean;
  isAudioOnlyMedium: boolean;
  error: string | null;
  /** true when the last error was a browser mic/camera permission denial */
  isPermissionError: boolean;
  startCall: (appointmentId: number, audioOnly?: boolean) => Promise<void>;
  joinCall: (session: VideoCallSession, audioOnly?: boolean) => Promise<void>;
  leaveCall: () => Promise<void>;
  endCall: () => Promise<void>;
  toggleMicrophone: () => void;
  toggleCamera: () => Promise<void>;
  cleanupRoom: () => void;
  clearError: () => void;
}

function upsertParticipant(
  participants: RemoteParticipantState[],
  identity: string,
  updater: (current: RemoteParticipantState) => RemoteParticipantState,
) {
  const existing = participants.find((p) => p.identity === identity);
  if (!existing) {
    return [...participants, updater({ identity, tracks: [] })];
  }
  return participants.map((p) => (p.identity === identity ? updater(p) : p));
}

function attachParticipant(set: (partial: Partial<VideoCallState>) => void, get: () => VideoCallState, participant: TwilioParticipant) {
  const addTrack = (track: TwilioTrack) => {
    const current = get().remoteParticipants;
    set({
      remoteParticipants: upsertParticipant(current, participant.identity, (p) => ({
        ...p,
        tracks: p.tracks.includes(track) ? p.tracks : [...p.tracks, track],
      })),
    });
  };

  participant.tracks?.forEach((publication) => {
    if (publication.isSubscribed && publication.track) addTrack(publication.track);
    publication.on?.('subscribed', (track) => addTrack(track as TwilioTrack));
  });
  participant.on('trackSubscribed', (track) => addTrack(track as TwilioTrack));
  participant.on('trackUnsubscribed', (track) => {
    const current = get().remoteParticipants;
    set({
      remoteParticipants: upsertParticipant(current, participant.identity, (p) => ({
        ...p,
        tracks: p.tracks.filter((t) => t !== track),
      })),
    });
  });
}

/**
 * Check browser mic/camera permissions before touching any Twilio API.
 * Throws a PERMISSION_DENIED error with clear user instructions when the
 * browser has already blocked access — avoids cryptic Twilio trace output.
 */
async function assertMediaPermissions(audioOnly: boolean): Promise<void> {
  if (typeof navigator.permissions?.query !== 'function') return; // API not available — let getUserMedia handle it

  const check = async (name: 'microphone' | 'camera', label: string) => {
    try {
      const result = await navigator.permissions.query({ name: name as PermissionName });
      if (result.state === 'denied') {
        const err = new Error(
          `${label} access is blocked by your browser.\n\nTo fix: click the lock icon 🔒 in the address bar → "Site settings" → set ${label} to "Allow" → reload the page.`
        );
        (err as Error & { isPermissionError: boolean }).isPermissionError = true;
        throw err;
      }
    } catch (err) {
      if ((err as Error & { isPermissionError?: boolean }).isPermissionError) throw err;
      // permissions.query threw for another reason (e.g. unsupported constraint) — proceed
    }
  };

  await check('microphone', 'Microphone');
  if (!audioOnly) await check('camera', 'Camera');
}

/**
 * Core Twilio connection logic — no concurrency guard here, by design.
 *
 * Both startCall and joinCall call this directly. The guard lives at the
 * public API level so that startCall can set isConnecting:true and then
 * call connectToRoom without the guard seeing isConnecting:true and bailing.
 *
 * Stale track cleanup happens here so it runs regardless of entry point.
 */
async function connectToRoom(
  session: VideoCallSession,
  audioOnly: boolean,
  set: (partial: Partial<VideoCallState>) => void,
  get: () => VideoCallState,
) {
  // Stop any tracks leaked from a previous failed attempt — clears the OS
  // mic/camera indicator and prevents parallel enumerateDevices() calls.
  const stale = get().localTracks;
  if (stale.length > 0) {
    stale.forEach((t) => { t.detach?.().forEach((el) => el.remove()); t.stop?.(); });
    set({ localTracks: [] });
  }

  const mediumIsAudioOnly = Boolean(session.audioOnly);
  const effectiveAudioOnly = audioOnly || mediumIsAudioOnly;
  set({ activeCall: session, isCameraOff: effectiveAudioOnly, isAudioOnlyMedium: mediumIsAudioOnly });

  // Pre-flight: fail fast with a clear message if mic/camera are already blocked.
  await assertMediaPermissions(effectiveAudioOnly);

  const [twilioVideo, tokenResponse] = await Promise.all([
    /* @vite-ignore */ import('twilio-video') as Promise<unknown>,
    session.token
      ? Promise.resolve({ token: session.token, roomName: session.roomName, identity: session.identity ?? '', expiresAt: session.tokenExpiresAt ?? '' })
      : TelemedicineService.getVideoToken(session.sessionId),
  ]);

  const { connect, createLocalAudioTrack, createLocalVideoTrack } = twilioVideo as {
    connect: (token: string, options: { name: string; tracks: unknown[] }) => Promise<unknown>;
    createLocalAudioTrack: () => Promise<unknown>;
    createLocalVideoTrack: (options: { width: number; height: number }) => Promise<unknown>;
  };

  // Acquire media — catch NotAllowedError here so it surfaces as a readable
  // message rather than a cryptic Twilio internal stack trace.
  let localTracks: TwilioTrack[];
  try {
    localTracks = [await createLocalAudioTrack()] as TwilioTrack[];
    if (!effectiveAudioOnly) {
      localTracks.push(await createLocalVideoTrack({ width: 960, height: 540 }) as TwilioTrack);
    }
  } catch (err) {
    const domErr = err as DOMException;
    if (domErr.name === 'NotAllowedError' || domErr.name === 'PermissionDeniedError') {
      const friendly = new Error(
        'Microphone or camera access was denied.\n\nTo fix: click the lock icon 🔒 in the address bar → "Site settings" → set Microphone and Camera to "Allow" → reload the page.'
      );
      (friendly as Error & { isPermissionError: boolean }).isPermissionError = true;
      throw friendly;
    }
    throw err;
  }

  const room = await connect(tokenResponse.token, {
    name: tokenResponse.roomName,
    tracks: localTracks,
  }) as TwilioRoom;

  room.participants?.forEach((participant) => attachParticipant(set, get, participant));
  room.on('participantConnected', (participant) => attachParticipant(set, get, participant as TwilioParticipant));
  room.on('participantDisconnected', (participant) => {
    set({
      remoteParticipants: get().remoteParticipants.filter((p) => p.identity !== (participant as TwilioParticipant).identity),
    });
  });
  room.on('disconnected', () => {
    const tracks = get().localTracks;
    tracks.forEach((track) => {
      track.detach?.().forEach((el) => el.remove());
      track.stop?.();
    });
    set({
      activeCall: null,
      room: null,
      localTracks: [],
      remoteParticipants: [],
      isConnecting: false,
      isInCall: false,
      isMuted: false,
      isCameraOff: false,
      isAudioOnlyMedium: false,
    });
  });

  const joined = await TelemedicineService.joinCall(session.sessionId, !effectiveAudioOnly, true);
  set({
    activeCall: { ...joined, token: tokenResponse.token, identity: tokenResponse.identity, tokenExpiresAt: tokenResponse.expiresAt },
    room,
    localTracks,
    isConnecting: false,
    isInCall: true,
    isMuted: false,
    isCameraOff: effectiveAudioOnly,
    isAudioOnlyMedium: mediumIsAudioOnly,
  });
}

export const useVideoCallStore = create<VideoCallState>((set, get) => ({
  activeCall: null,
  room: null,
  localTracks: [],
  remoteParticipants: [],
  isConnecting: false,
  isInCall: false,
  isMuted: false,
  isCameraOff: false,
  isAudioOnlyMedium: false,
  error: null,
  isPermissionError: false,

  clearError: () => set({ error: null, isPermissionError: false }),

  startCall: async (appointmentId, audioOnly = false) => {
    // Guard: drop duplicate clicks — isConnecting covers the API-call phase too.
    if (get().isConnecting || get().isInCall) return;
    set({ isConnecting: true, error: null, isCameraOff: audioOnly });
    try {
      const session = await TelemedicineService.startVideoCall(appointmentId);
      // Call connectToRoom directly — not through get().joinCall() — so the
      // guard in joinCall doesn't see isConnecting:true and bail early.
      await connectToRoom(session, audioOnly, set, get);
    } catch (error) {
      get().cleanupRoom();
      const isPerm = Boolean((error as Error & { isPermissionError?: boolean }).isPermissionError);
      set({ error: error instanceof Error ? error.message : 'Could not start call', isConnecting: false, isPermissionError: isPerm });
      throw error;
    }
  },

  joinCall: async (session, audioOnly = false) => {
    // Guard: drop duplicate clicks.
    if (get().isConnecting || get().isInCall) return;
    set({ isConnecting: true, error: null, isPermissionError: false });
    try {
      await connectToRoom(session, audioOnly, set, get);
    } catch (error) {
      get().cleanupRoom();
      const isPerm = Boolean((error as Error & { isPermissionError?: boolean }).isPermissionError);
      set({ error: error instanceof Error ? error.message : 'Could not join call', isConnecting: false, isPermissionError: isPerm });
      throw error;
    }
  },

  leaveCall: async () => {
    const sessionId = get().activeCall?.sessionId;
    if (sessionId) {
      await TelemedicineService.leaveCall(sessionId, !get().isCameraOff, !get().isMuted).catch(() => undefined);
    }
    get().cleanupRoom();
  },

  endCall: async () => {
    const sessionId = get().activeCall?.sessionId;
    if (sessionId) {
      await TelemedicineService.endCall(sessionId, 'ended from chat').catch(() => undefined);
    }
    get().cleanupRoom();
  },

  toggleMicrophone: () => {
    const nextMuted = !get().isMuted;
    get().localTracks.filter((track) => track.kind === 'audio').forEach((track) => {
      if (nextMuted) track.disable?.(); else track.enable?.();
    });
    set({ isMuted: nextMuted });
  },

  toggleCamera: async () => {
    if (get().isAudioOnlyMedium) return;
    const nextCameraOff = !get().isCameraOff;
    const existingVideoTracks = get().localTracks.filter((track) => track.kind === 'video');

    if (!nextCameraOff && existingVideoTracks.length === 0) {
      try {
        const { createLocalVideoTrack } = await /* @vite-ignore */ import('twilio-video') as unknown as {
          createLocalVideoTrack: (options: { width: number; height: number }) => Promise<unknown>;
        };
        const videoTrack = await createLocalVideoTrack({ width: 960, height: 540 }) as TwilioTrack;
        await get().room?.localParticipant?.publishTrack?.(videoTrack);
        set({ localTracks: [...get().localTracks, videoTrack], isCameraOff: false });
        return;
      } catch (error) {
        set({ error: error instanceof Error ? error.message : 'Could not enable camera' });
        return;
      }
    }

    existingVideoTracks.forEach((track) => {
      if (nextCameraOff) track.disable?.(); else track.enable?.();
    });
    set({ isCameraOff: nextCameraOff });
  },

  cleanupRoom: () => {
    const { room, localTracks } = get();
    localTracks.forEach((track) => {
      room?.localParticipant?.unpublishTrack?.(track);
      track.detach?.().forEach((el) => el.remove());
      track.stop?.();
    });
    room?.disconnect();
    // Preserve error/isPermissionError so the UI can still display the banner
    // after cleanup. clearError() resets them explicitly.
    set({
      activeCall: null,
      room: null,
      localTracks: [],
      remoteParticipants: [],
      isConnecting: false,
      isInCall: false,
      isMuted: false,
      isCameraOff: false,
      isAudioOnlyMedium: false,
    });
  },
}));
