
  let peer: RTCPeerConnection | null = null;

  const getPeer = (): RTCPeerConnection => {
    if (typeof window === "undefined") {
      throw new Error("RTCPeerConnection is only available in the browser");
    }
    if (!peer) {
      peer = new RTCPeerConnection({
        iceServers: [
          {
            urls: [
              "stun:stun.l.google.com:19302",
              "stun:global.stun.twilio.com:3478",
            ],
          },
        ],
      });
    }
    return peer;
  };

  const getOffer = async () => {
    const pc = getPeer();
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    return offer;
  };

  const getAnswer = async (offer: RTCSessionDescriptionInit) => {
    const pc = getPeer();
    await pc.setRemoteDescription(offer);
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    return answer;
  };

  const acceptAnswer = async (answer: RTCSessionDescriptionInit) => {
    const pc = getPeer();
    await pc.setRemoteDescription(answer);
  };

  const addStream = (stream: MediaStream) => {
    const pc = getPeer();
      stream.getTracks().forEach((track) => {
        pc.addTrack(track, stream);
      });
  };

  const onTrack = (handler: (event: RTCTrackEvent) => void) => {
    const pc = getPeer();
    pc.ontrack = handler;
  };

  const onIceCandidate = (emit: (candidate: RTCIceCandidateInit) => void) => {
    const pc = getPeer();
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        emit(event.candidate.toJSON());
      }
    };
  };

  const addIceCandidate = async (candidate: RTCIceCandidateInit) => {
    const pc = getPeer();
    await pc.addIceCandidate(candidate);
  };

  export {getOffer, getAnswer, acceptAnswer, addStream, onTrack, onIceCandidate, addIceCandidate };



