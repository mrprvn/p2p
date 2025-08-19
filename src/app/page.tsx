"use client";

import ChatForm from "@/components/chat-form";
import ChatMessage from "@/components/chat-message";
import { useEffect, useRef, useState } from "react";
import {socket} from "@/lib/socket-client"
import { getOffer, getAnswer, addStream, acceptAnswer, onTrack, onIceCandidate, addIceCandidate } from "@/service/peer";
import { Button } from "@/components/ui/button";

export default function Home() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [room, setRoom] = useState("");
  const [joined, setJoined] = useState(false);
  const [username, setUsername] = useState("");
  const [messages, setMessages] = useState<{sender: string; message: string}[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);


  useEffect(() => {
    socket.on("message", (data) => {
      setMessages((prev) => [...prev, data]);
    })
    socket.on("user-joined", ({message}) => {
      setMessages((prev) => [...prev, {sender: "system", message}])
    })
    socket.on("offer-send", async ({from, offer}) => {
      // closePeer();
      const ans = await getAnswer(offer);
      socket.emit("offer-ack", {to: from, offerAck: ans});
      // start sending back ICE candidates to caller
      onIceCandidate((candidate) => socket.emit("ice-candidate", { to: from, candidate }));
    })
    socket.on("offer-accepted",async ({from, offerAck}) => {
      await acceptAnswer(offerAck)
      // start sending ICE candidates to callee
      onIceCandidate((candidate) => socket.emit("ice-candidate", { to: from, candidate }));
    })
    socket.on("ice-candidate", async ({ from, candidate }) => {
      await addIceCandidate(candidate);
    })
    return () => {
      socket.off("message");
      socket.off("user-joined");
      socket.off("offer-send");
      socket.off("ice-candidate");
    }
  }, [])

  // Register onTrack handler once (separate from socket events)
  useEffect(() => {
    onTrack((event) => {
      const [remote] = event.streams;
      const element = document.getElementById("remoteVideo") as HTMLVideoElement | null;
      if (element && remote) {
        element.srcObject = remote;
        element.play?.().catch(() => {});
      }
    });
  }, []);

  const handleSendMessage = (message: string) => {
    const data = {room, message, sender: username};
    setMessages((prev) => [...prev, {sender: username, message}]);
    socket.emit("message", data);
  };

  const handleJoinRoom = () => {
    if(room && username) {
      socket.emit("join-room", { room, username });
      setJoined(true);
    }
  };

  const handleShareVideo = async () => {
    const video = videoRef.current;
    if (!video) return;
    const capture = (video as HTMLVideoElement & { captureStream?: () => MediaStream }).captureStream;
    if (!capture) {
      console.warn("captureStream is not supported in this browser");
      return;
    }
    // ensure playback so captureStream has active tracks
    try { await video.play(); } catch {}
    const stream = capture.call(video);
    addStream(stream)
    const offer = await getOffer();
    socket.emit("offer", {room, offer});
  };

  return (
    <div className="flex w-full mt-24 justify-center">
      {!joined ? (
        <div className="flex gap-4 w-full max-w-3xl mx-auto flex-col items-center">
          <h1 className="text-2xl font-bold mb-4">Join a Chat Room</h1>
          <input type="text" placeholder="Enter your username" className="w-64 px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none" value={username} onChange={(e) => setUsername(e.target.value)} />
          <input type="text" placeholder="Enter the room name" className="w-64 px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none" value={room} onChange={(e) => setRoom(e.target.value)} />
          <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 cursor-pointer rounded-lg" onClick={handleJoinRoom}>Join Room</button>
        </div>
      ) : 
      (<div className="w-full max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-center text-gray-900">Chat Room ID : {room}</h1>
        <div className="h-[500px] overflow-y-auto p-4 mb-4 bg-gray-200 rounded-lg">
          {
            messages?.map((msg, i) => (
              <ChatMessage key={i} sender={msg.sender} message={msg.message} isOwnMessage={msg.sender === username} />
            ))
          }
        </div>
        <ChatForm onSendMessage={handleSendMessage} />
        <input type="file" onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} />
        <video
          ref={videoRef}
          controls
          src={selectedFile ? URL.createObjectURL(selectedFile) : ""}
        />
        <video id="remoteVideo" autoPlay playsInline />
        <Button className="cursor-pointer" onClick={handleShareVideo}>Share Video</Button>
      </div>)}
   
    </div>
  );
}
