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
  isAudioOnlyMedium: boolean;  // true when the appointment medium is AUDIO — camera permanently blocked
  error: string | null;
  startCall: (appointmentId: number, audioOnly?: boolean) => Promise<void>;
  joinCall: (session: VideoCallSession, audioOnly?: boolean) => Promise<void>;
  leaveCall: () => Promise<void>;
  endCall: () => Promise<void>;
  toggleMicrophone: () => void;
  toggleCamera: () => Promise<void>;
  cleanupRoom: () => void;
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

  startCall: async (appointmentId, audioOnly = false) => {
    set({ isConnecting: true, error: null, isCameraOff: audioOnly });
    try {
      const session = await TelemedicineService.startVideoCall(appointmentId);
      await get().joinCall(session, audioOnly);
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Could not start call', isConnecting: false });
      throw error;
    }
  },

  joinCall: async (session, audioOnly = false) => {
    // If the appointment medium is AUDIO, force audio-only regardless of what was requested.
    const mediumIsAudioOnly = Boolean(session.audioOnly);
    const effectiveAudioOnly = audioOnly || mediumIsAudioOnly;
    set({ isConnecting: true, error: null, activeCall: session, isCameraOff: effectiveAudioOnly, isAudioOnlyMedium: mediumIsAudioOnly });
    try {
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

      const localTracks: TwilioTrack[] = [await createLocalAudioTrack()] as TwilioTrack[];
      if (!effectiveAudioOnly) {
        localTracks.push(await createLocalVideoTrack({ width: 960, height: 540 }) as TwilioTrack);
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
    } catch (error) {
      get().cleanupRoom();
      set({ error: error instanceof Error ? error.message : 'Could not join call', isConnecting: false });
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
    // Block camera toggle entirely for AUDIO-medium appointments.
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
