import { useState, useEffect, useRef } from 'react';
import Video from 'twilio-video';
import type { Room, LocalVideoTrack, LocalAudioTrack, RemoteParticipant } from 'twilio-video';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Video as VideoIcon, VideoOff, Mic, MicOff, PhoneOff, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface VideoCallRoomProps {
  appointmentId: string;
  onLeave: () => void;
  isDoctorView?: boolean;
}

export function VideoCallRoom({ appointmentId, onLeave, isDoctorView = false }: VideoCallRoomProps) {
  const { toast } = useToast();
  const [room, setRoom] = useState<Room | null>(null);
  const [isConnecting, setIsConnecting] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [remoteParticipants, setRemoteParticipants] = useState<RemoteParticipant[]>([]);
  
  const localVideoRef = useRef<HTMLDivElement>(null);
  const remoteVideoRef = useRef<HTMLDivElement>(null);
  const roomRef = useRef<Room | null>(null);

  const brandColor = isDoctorView ? 'bg-orange-600 hover:bg-orange-700' : 'bg-blue-600 hover:bg-blue-700';

  useEffect(() => {
    let mounted = true;
    let localRoom: Room | null = null;

    const connectToRoom = async () => {
      try {
        setIsConnecting(true);

        // Get access token from backend
        const response = await fetch('/api/video/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ roomName: `appointment-${appointmentId}` })
        });

        if (!response.ok) {
          throw new Error('Failed to get video token');
        }

        const { token } = await response.json();

        // Connect to Twilio Video room
        localRoom = await Video.connect(token, {
          name: `appointment-${appointmentId}`,
          audio: true,
          video: { width: 640, height: 480 }
        });

        if (!mounted) {
          localRoom.disconnect();
          return;
        }

        roomRef.current = localRoom;
        setRoom(localRoom);

        console.log('[Twilio Video] Connected to room:', localRoom.name);

        // Attach local video track
        const localParticipant = localRoom.localParticipant;
        localParticipant.videoTracks.forEach(publication => {
          const track = publication.track as LocalVideoTrack;
          if (localVideoRef.current && track) {
            localVideoRef.current.appendChild(track.attach());
          }
        });

        // Handle remote participants already in room
        localRoom.participants.forEach(participant => {
          console.log('[Twilio Video] Participant already in room:', participant.identity);
          attachRemoteParticipant(participant);
        });

        // Listen for new participants joining
        localRoom.on('participantConnected', participant => {
          console.log('[Twilio Video] Participant connected:', participant.identity);
          attachRemoteParticipant(participant);
          setRemoteParticipants(Array.from(localRoom!.participants.values()));
        });

        // Listen for participants leaving
        localRoom.on('participantDisconnected', participant => {
          console.log('[Twilio Video] Participant disconnected:', participant.identity);
          detachRemoteParticipant(participant);
          setRemoteParticipants(Array.from(localRoom!.participants.values()));
        });

        setIsConnecting(false);
        setRemoteParticipants(Array.from(localRoom.participants.values()));

        toast({
          title: "Connesso",
          description: "Sei entrato nella videochiamata",
        });
      } catch (error: any) {
        console.error('[Twilio Video] Connection error:', error);
        
        if (!mounted) return;

        setIsConnecting(false);
        toast({
          title: "Errore di connessione",
          description: error.message || "Impossibile connettersi alla videochiamata",
          variant: "destructive",
        });
      }
    };

    const attachRemoteParticipant = (participant: RemoteParticipant) => {
      participant.tracks.forEach(publication => {
        if (publication.isSubscribed && publication.track) {
          attachTrack(publication.track);
        }
      });

      participant.on('trackSubscribed', track => {
        attachTrack(track);
      });

      participant.on('trackUnsubscribed', track => {
        detachTrack(track);
      });
    };

    const attachTrack = (track: any) => {
      if (remoteVideoRef.current && track.kind === 'video') {
        const existingElement = remoteVideoRef.current.querySelector(`[data-track-sid="${track.sid}"]`);
        if (!existingElement) {
          const element = track.attach();
          element.setAttribute('data-track-sid', track.sid);
          remoteVideoRef.current.appendChild(element);
        }
      } else if (track.kind === 'audio') {
        track.attach();
      }
    };

    const detachTrack = (track: any) => {
      track.detach().forEach((element: HTMLElement) => {
        element.remove();
      });
    };

    const detachRemoteParticipant = (participant: RemoteParticipant) => {
      participant.tracks.forEach(publication => {
        if (publication.track) {
          detachTrack(publication.track);
        }
      });
    };

    connectToRoom();

    return () => {
      mounted = false;
      if (roomRef.current) {
        roomRef.current.disconnect();
      }
    };
  }, [appointmentId, toast]);

  const toggleVideo = () => {
    if (!room) return;

    room.localParticipant.videoTracks.forEach(publication => {
      const track = publication.track as LocalVideoTrack;
      if (isVideoEnabled) {
        track.disable();
      } else {
        track.enable();
      }
    });
    setIsVideoEnabled(!isVideoEnabled);
  };

  const toggleAudio = () => {
    if (!room) return;

    room.localParticipant.audioTracks.forEach(publication => {
      const track = publication.track as LocalAudioTrack;
      if (isAudioEnabled) {
        track.disable();
      } else {
        track.enable();
      }
    });
    setIsAudioEnabled(!isAudioEnabled);
  };

  const handleLeaveRoom = () => {
    if (room) {
      room.disconnect();
      setRoom(null);
    }
    onLeave();
  };

  if (isConnecting) {
    return (
      <Card className="w-full h-[600px] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
          <p className="text-lg font-medium">Connessione alla videochiamata...</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="w-full space-y-4" data-testid="video-call-room">
      {/* Remote video (main view) */}
      <Card className="relative w-full h-[500px] bg-gray-900 overflow-hidden">
        {remoteParticipants.length === 0 ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center text-white">
              <VideoIcon className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">In attesa del medico...</p>
              <p className="text-sm text-gray-400 mt-2">La chiamata inizierà quando il medico si unirà</p>
            </div>
          </div>
        ) : (
          <div 
            ref={remoteVideoRef} 
            className="w-full h-full"
            data-testid="remote-video-container"
          />
        )}

        {/* Local video (picture-in-picture) */}
        <div className="absolute bottom-4 right-4 w-48 h-36 bg-gray-800 rounded-lg overflow-hidden shadow-xl border-2 border-white">
          <div 
            ref={localVideoRef} 
            className="w-full h-full"
            data-testid="local-video-container"
          />
          {!isVideoEnabled && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-700">
              <VideoOff className="w-8 h-8 text-white" />
            </div>
          )}
        </div>
      </Card>

      {/* Controls */}
      <div className="flex justify-center items-center gap-4">
        <Button
          variant={isAudioEnabled ? "outline" : "destructive"}
          size="lg"
          onClick={toggleAudio}
          className="w-14 h-14 rounded-full"
          data-testid="button-toggle-audio"
        >
          {isAudioEnabled ? (
            <Mic className="w-6 h-6" />
          ) : (
            <MicOff className="w-6 h-6" />
          )}
        </Button>

        <Button
          variant={isVideoEnabled ? "outline" : "destructive"}
          size="lg"
          onClick={toggleVideo}
          className="w-14 h-14 rounded-full"
          data-testid="button-toggle-video"
        >
          {isVideoEnabled ? (
            <VideoIcon className="w-6 h-6" />
          ) : (
            <VideoOff className="w-6 h-6" />
          )}
        </Button>

        <Button
          variant="destructive"
          size="lg"
          onClick={handleLeaveRoom}
          className="w-14 h-14 rounded-full bg-red-600 hover:bg-red-700"
          data-testid="button-leave-call"
        >
          <PhoneOff className="w-6 h-6" />
        </Button>
      </div>

      {/* Status info */}
      <div className="text-center text-sm text-gray-600">
        <p>
          {remoteParticipants.length === 0 ? (
            "Nessun altro partecipante"
          ) : (
            `${remoteParticipants.length} partecipante${remoteParticipants.length > 1 ? 'i' : ''} nella chiamata`
          )}
        </p>
      </div>
    </div>
  );
}
