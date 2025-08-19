"use client";

import {
  useState,
  useRef,
  useEffect,
  forwardRef,
  useImperativeHandle,
  type ChangeEvent,
} from "react";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  UploadCloud,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

export const VideoPlayer = forwardRef<HTMLVideoElement, {
  selectedFile?: File;
  setSelectedFile?: (file: File) => void;
}>(({ selectedFile, setSelectedFile }, ref) => {
  const [videoSrc, setVideoSrc] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isHovering, setIsHovering] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ✅ Expose videoRef to parent
  useImperativeHandle(ref, () => videoRef.current!, []);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith("video/")) {
      const url = URL.createObjectURL(file);
      setVideoSrc(url);
      setSelectedFile?.(file);
    } else {
      alert("Please select a valid video file (e.g., MP4).");
    }
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play();
        setIsPlaying(true);
      } else {
        videoRef.current.pause();
        setIsPlaying(false);
      }
    }
  };

  const handleSeek = (value: number[]) => {
    if (videoRef.current) {
      videoRef.current.currentTime = (value[0] / 100) * duration;
      setProgress(value[0]);
    }
  };

  const handleVolumeChange = (value: number[]) => {
    if (videoRef.current) {
      const newVolume = value[0] / 100;
      videoRef.current.volume = newVolume;
      setVolume(newVolume);
      setIsMuted(newVolume === 0);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      const newMutedState = !isMuted;
      videoRef.current.muted = newMutedState;
      setIsMuted(newMutedState);
      if (newMutedState) {
        setVolume(0);
      } else {
        setVolume(videoRef.current.volume || 0.5);
      }
    }
  };

  const toggleFullScreen = () => {
    if (videoRef.current?.parentElement) {
      if (!document.fullscreenElement) {
        videoRef.current.parentElement.requestFullscreen().catch(err => {
          alert(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
        });
      } else {
        document.exitFullscreen();
      }
    }
  };

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const updateProgress = () => {
      setProgress((video.currentTime / video.duration) * 100);
    };

    const handleLoadedMetadata = () => {
      setDuration(video.duration);
    };

    video.addEventListener("timeupdate", updateProgress);
    video.addEventListener("loadedmetadata", handleLoadedMetadata);
    video.addEventListener("play", () => setIsPlaying(true));
    video.addEventListener("pause", () => setIsPlaying(false));

    return () => {
      video.removeEventListener("timeupdate", updateProgress);
      video.removeEventListener("loadedmetadata", handleLoadedMetadata);
      video.removeEventListener("play", () => setIsPlaying(true));
      video.removeEventListener("pause", () => setIsPlaying(false));
    };
  }, [videoSrc, duration]);

  const formatTime = (timeInSeconds: number) => {
    if (isNaN(timeInSeconds) || timeInSeconds === Infinity) {
      return "00:00";
    }
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  };

  if (!videoSrc) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center bg-muted/20">
        <div
          className="flex w-3/4 max-w-2xl cursor-pointer flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed border-border p-12 text-center transition-colors hover:border-accent hover:bg-muted/50"
          onClick={() => fileInputRef.current?.click()}
        >
          <UploadCloud className="h-16 w-16 text-muted-foreground" />
          <h2 className="font-headline text-2xl font-bold">Select a Video File</h2>
          <p className="text-muted-foreground">
            You are the host. Choose a video from your computer to start the watch party.
            The file will be streamed directly to your friends, not uploaded.
          </p>
          <Button size="lg" className="mt-4 pointer-events-none">
            Choose File
          </Button>
        </div>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          accept="video/mp4,video/webm,video/ogg"
        />
      </div>
    );
  }

  return (
    <div
      className="group relative flex h-full w-full items-center justify-center overflow-hidden bg-black"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      <video
        ref={videoRef}
        src={videoSrc}
        className="h-full max-h-full w-auto max-w-full"
        onClick={togglePlay}
      />

      <div
        className={cn(
          "absolute bottom-0 left-0 right-0 z-10 flex flex-col gap-2 bg-gradient-to-t from-black/70 via-black/50 to-transparent p-4 transition-opacity duration-300",
          !isHovering && !videoRef.current?.paused ? "opacity-0" : "opacity-100"
        )}
      >
        <div className="flex items-center gap-2">
          <span className="font-mono text-sm text-white">{formatTime(videoRef.current?.currentTime || 0)}</span>
          <Slider value={[progress || 0]} onValueChange={handleSeek} className="w-full" />
          <span className="font-mono text-sm text-white">{formatTime(duration)}</span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={togglePlay} className="text-white hover:bg-white/10 hover:text-white">
              {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
            </Button>
            <div className="flex items-center gap-2 w-32">
              <Button variant="ghost" size="icon" onClick={toggleMute} className="text-white hover:bg-white/10 hover:text-white">
                {isMuted || volume === 0 ? <VolumeX className="h-6 w-6" /> : <Volume2 className="h-6 w-6" />}
              </Button>
              <Slider
                value={[isMuted ? 0 : volume * 100]}
                onValueChange={handleVolumeChange}
                className="w-full"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 rounded-full bg-green-500/20 px-3 py-1 text-xs text-green-300">
              <div className="h-2 w-2 rounded-full bg-green-400 animate-pulse"></div>
              P2P Connected
            </div>
            <Button variant="ghost" size="icon" onClick={toggleFullScreen} className="text-white hover:bg-white/10 hover:text-white">
              <Maximize className="h-6 w-6" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
});
