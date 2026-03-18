"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";
import LoginFooter from "@/components/login/loginFooter";
import Header from "@/components/header";
import {
  ClipboardPaste,
  Highlighter,
  Mic,
  Mic2,
  MicOff,
  Minus,
  Plus,
  Speaker,
} from "lucide-react";
import SpeakerMoadal from "@/components/mictalk/speakerModal";
import { useMictalkModal } from "@/contextApi/mictalkModal";
import { useSpeaker } from "@/contextApi/speakerContext";
import { useMicrophone } from "@/contextApi/microphoneContext";
import MicrophoneModal from "@/components/mictalk/microphoneModal";

const WORD_LIMIT = 1000;

type HighlightRange = {
  start: number;
  end: number;
  id: string;
};

function Page() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const dataArrayRef = useRef<Uint8Array<ArrayBuffer> | null>(null);
  const textContainerRef = useRef<HTMLPreElement>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const destinationRef = useRef<MediaStreamAudioDestinationNode | null>(null);
  const audioElRef = useRef<HTMLAudioElement | null>(null);
  const requestAnimationRef = useRef<number | null>(null);
  const [text, setText] = useState("");
  const [highlights, setHighlights] = useState<HighlightRange[]>([]);
  const [fontSize, setFontSize] = useState(18);
  const [isClicked, setIsClicked] = useState(false);
  const {
    isMicModalOpen,
    toggleMicModal,
    isSpeakerModalOpen,
    toggleSpeakerModal,
  } = useMictalkModal();
  const { selectedSpeaker } = useSpeaker();
  const { selectedMic } = useMicrophone();

  const animateAudioVisualizer = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");

    if (!canvas || !ctx || !dataArrayRef.current || !analyserRef.current)
      return;

    const barWidth = 6;
    const gap = 4;
    const centerX = canvas.width / 2;
    const halfBars = Math.floor(centerX / (barWidth + gap));
    const step = Math.floor((dataArrayRef.current.length * 0.7) / halfBars);

    const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
    gradient.addColorStop(0, "#3b82f6");
    gradient.addColorStop(0.5, "#8b5cf6");
    gradient.addColorStop(1, "#ec4899");

    const draw = () => {
      if (!dataArrayRef.current || !analyserRef.current) return;

      analyserRef.current.getByteFrequencyData(dataArrayRef.current);

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = gradient;

      for (let i = 0; i < halfBars; i++) {
        let value = 0;
        for (let j = 0; j < step; j++) {
          value += dataArrayRef.current[i * step + j] || 0;
        }
        value = value / step;

        const percent = value / 255;
        const barHeight = Math.max(4, percent * canvas.height * 0.8);
        const y = (canvas.height - barHeight) / 2;
        const xRight = centerX + gap / 2 + i * (barWidth + gap);
        const xLeft = centerX - gap / 2 - barWidth - i * (barWidth + gap);

        const drawBar = (xPos: number) => {
          ctx.beginPath();
          if (ctx.roundRect) {
            ctx.roundRect(xPos, y, barWidth, barHeight, [barWidth / 2]);
          } else {
            ctx.fillRect(xPos, y, barWidth, barHeight);
          }
          ctx.fill();
        };

        drawBar(xRight);
        drawBar(xLeft);
      }

      requestAnimationRef.current = requestAnimationFrame(draw);
    };
    draw();
  };

  const stopAudioProcessing = () => {
    if (requestAnimationRef.current)
      cancelAnimationFrame(requestAnimationRef.current);
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    if (canvasRef.current && canvasRef.current.getContext("2d")) {
      const ctx = canvasRef.current.getContext("2d");
      ctx?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
  };

  const handleClick = async () => {
    setIsClicked((prev) => !prev);
  };

  const handleHighlight = () => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    const selectedStr = selection.toString();
    if (!selectedStr.trim()) return;

    const pre = textContainerRef.current;
    if (!pre) return;

    let offset = 0;
    const preRange = document.createRange();
    preRange.selectNodeContents(pre);
    preRange.setEnd(range.startContainer, range.startOffset);
    offset = preRange.toString().length;

    const newHighlight: HighlightRange = {
      start: offset,
      end: offset + selectedStr.length,
      id: `${offset}-${selectedStr.length}`,
    };

    setHighlights((prev) => {
      const overlapping = prev.filter(
        (h) =>
          Math.max(h.start, newHighlight.start) <
          Math.min(h.end, newHighlight.end),
      );

      if (overlapping.length > 0) {
        return prev.filter((h) => !overlapping.includes(h));
      }
      return [...prev, newHighlight].sort((a, b) => a.start - b.start);
    });

    selection.removeAllRanges();
  };

  const handlePaste = async () => {
    try {
      const clipText = await navigator.clipboard.readText();
      if (!clipText) return;

      const words = clipText.trim().split(/\s+/);
      if (words.length > WORD_LIMIT) {
        alert(`Text is too long! Clipping to the first ${WORD_LIMIT} words.`);
        setText(words.slice(0, WORD_LIMIT).join(" "));
      } else {
        setText(clipText);
      }
      setHighlights([]);
    } catch (err) {
      console.error("Failed to read clipboard", err);
    }
  };

  const renderContent = useMemo(() => {
    if (highlights.length === 0) return text;

    const result = [];
    let lastIndex = 0;

    highlights.forEach((h, index) => {
      // Add text before the highlight
      if (h.start > lastIndex) {
        result.push(text.slice(lastIndex, h.start));
      }
      // Add the highlighted span
      result.push(
        <mark
          key={`hl-${index}`}
          className="bg-yellow-300 dark:bg-yellow-500 text-black px-1 rounded"
        >
          {text.slice(h.start, h.end)}
        </mark>,
      );
      lastIndex = h.end;
    });

    // Add remaining text
    if (lastIndex < text.length) {
      result.push(text.slice(lastIndex));
    }

    return result;
  }, [text, highlights]);

  useEffect(() => {
    return () => stopAudioProcessing();
  }, []);

  useEffect(() => {
    const resize = () => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container) return;

      const dpr = window.devicePixelRatio || 1;
      const rect = container.getBoundingClientRect();

      // internal pixel buffer
      canvas.width = Math.floor(rect.width * dpr);
      canvas.height = Math.floor(rect.height * dpr);

      // CSS size to match container
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;

      // scale drawing context for DPR
      const ctx = canvas.getContext("2d");
      if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);

  useEffect(() => {
    let cancelled = false;

    const setupAudio = async () => {
      if (!isClicked) return;

      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContext();
      } else if (audioContextRef.current.state === "suspended") {
        try {
          await audioContextRef.current.resume();
        } catch {}
      }
      const audioContext = audioContextRef.current;

      const analyser = audioContext.createAnalyser();
      const compressor = audioContext.createDynamicsCompressor();
      const gainNode = audioContext.createGain();
      const destination = audioContext.createMediaStreamDestination();

      analyserRef.current = analyser;
      gainNodeRef.current = gainNode;
      destinationRef.current = destination;

      dataArrayRef.current = new Uint8Array(analyser.frequencyBinCount);

      try {
        const constraints = {
          audio: selectedMic
            ? {
                deviceId: { exact: selectedMic.deviceId },
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true,
              }
            : {
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true,
              },
        };

        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;

        const source = audioContext.createMediaStreamSource(stream);
        sourceRef.current = source;

        compressor.threshold.value = -10;
        compressor.knee.value = 0;
        compressor.ratio.value = 20;
        compressor.attack.value = 0.005;
        compressor.release.value = 0.1;

        source.connect(analyser);
        analyser.connect(gainNode);
        gainNode.connect(destination);
        gainNode.gain.value = 1.5;

        const audioEl = new Audio();
        audioElRef.current = audioEl;
        audioEl.srcObject = destination.stream;

        if (selectedSpeaker && "setSinkId" in audioEl) {
          try {
            await (audioEl as any).setSinkId(selectedSpeaker.deviceId);
          } catch (e) {
            console.warn("setSinkId failed; using default output.", e);
          }
        }
        try {
          await audioEl.play();
        } catch (e) {
          console.warn("Audio play blocked by browser.", e);
        }

        animateAudioVisualizer();
      } catch (err) {
        console.error("Error accessing the microphone:", err);
      }
    };

    setupAudio();
    return () => {
      cancelled = true;
      if (requestAnimationRef.current)
        cancelAnimationFrame(requestAnimationRef.current);
      if (audioElRef.current) {
        try {
          audioElRef.current.pause();
        } catch {}
        audioElRef.current.srcObject = null;
        audioElRef.current = null;
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
      try {
        sourceRef.current?.disconnect();
        analyserRef.current?.disconnect();
        gainNodeRef.current?.disconnect();
        destinationRef.current?.disconnect();
      } catch {}

      sourceRef.current = null;
      analyserRef.current = null;
      gainNodeRef.current = null;
      destinationRef.current = null;
      dataArrayRef.current = null;
    };
  }, [isClicked, selectedMic?.deviceId, selectedSpeaker?.deviceId]);

  return (
    <div
      className="
        min-h-screen w-full
        flex flex-col
        bg-slate-300 dark:bg-slate-950
        supports-[height:100dvh]:min-h-[100dvh]
        supports-[height:100svh]:min-h-[100svh]
      "
    >
      <Header />
      <div className="flex flex-col items-center justify-center gap-6 w-auto h-auto mt-20 mx-4 px-3 lg:mx-16 lg:px-6 py-4">
        <div
          ref={containerRef}
          className={`relative w-full md:w-96 h-20 rounded-2xl p-6 overflow-hidden dark:bg-white/5 bg-white/20 backdrop-blur-[20px] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25),inset_0_1px_0_rgba(255,255,255,0.5)] dark:shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.1)]`}
        >
          <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
        </div>
        <div className="relative w-full  overflow-hidden bg-gray-100 dark:bg-gray-800 p-6 rounded-xl shadow-sm border-none">
          <div className="flex flex-row flex-wrap justify-around items-center mb-6">
            <button
              onClick={handlePaste}
              className="inline-flex items-center justify-center w-auto py-3 px-3 rounded-full border-none cursor-pointer  mr-4  focus-none outline-none border-none bg-gray-100 text-black hover:bg-gray-200 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700"
              title="Paste text from clipboard"
            >
              <ClipboardPaste className="w-5 h-5" />
            </button>
            <button
              onClick={handleClick}
              className="inline-flex items-center justify-center w-auto py-3 px-3 rounded-full border-none cursor-pointer  mr-4  focus-none outline-none border-none bg-gray-100 text-black hover:bg-gray-200 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700"
              title="Paste text from clipboard"
            >
              {isClicked ? (
                <Mic className="w-5 h-5" />
              ) : (
                <MicOff className="w-5 h-5 text-red-600 dark:text-red-400" />
              )}
            </button>
            <button
              onClick={toggleMicModal}
              className="inline-flex items-center justify-center w-auto py-3 px-3 rounded-full border-none cursor-pointer  mr-4  focus-none outline-none border-none bg-gray-100 text-black hover:bg-gray-200 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700"
              title="Paste text from clipboard"
            >
              <Mic2 className="w-5 h-5" />
            </button>
            <button
              onClick={toggleSpeakerModal}
              className="inline-flex items-center justify-center w-auto py-3 px-3 rounded-full border-none cursor-pointer  mr-4  focus-none outline-none border-none bg-gray-100 text-black hover:bg-gray-200 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700"
              title="Paste text from clipboard"
            >
              <Speaker className="w-5 h-5" />
            </button>
            <button
              onClick={() => setFontSize((prev) => Math.min(prev + 2, 48))}
              className="inline-flex items-center justify-center w-auto py-3 px-3 rounded-full border-none cursor-pointer  mr-4  focus-none outline-none border-none bg-gray-100 text-black hover:bg-gray-200 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700"
              title="Increase Text Size"
            >
              <Plus className="w-5 h-5" />
            </button>
            <button
              onClick={() => setFontSize((prev) => Math.max(prev - 2, 12))}
              className="inline-flex items-center justify-center w-auto py-3 px-3 rounded-full border-none cursor-pointer  mr-4  focus-none outline-none border-none bg-gray-100 text-black hover:bg-gray-200 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700"
              title="Decrease Text Size"
            >
              <Minus className="w-5 h-5" />
            </button>
            <button
              onMouseDown={(e) => {
                e.preventDefault();
                handleHighlight();
              }}
              className="inline-flex items-center justify-center w-auto py-3 px-3 rounded-full border-none cursor-pointer transition-all duration-150 ease-in-out focus-visible:outline-2 focus-visible:outline-blue-500/65 focus-visible:outline-offset-2 active:translate-y-[0.5px] bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700"
              title="Highlight Selected Text"
            >
              <Highlighter className="w-5 h-5" />
            </button>
          </div>
          <div className="h-96 md:h-[54rem] overflow-y-auto    [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-600 dark:[&::-webkit-scrollbar-thumb]:bg-gray-300">
            <pre
              ref={textContainerRef}
              className="whitespace-pre-wrap leading-relaxed tracking-wide font-medium text-black dark:text-white/90"
              style={{ fontSize: `${fontSize}px` }}
            >
              {text.trim().length === 0 ? (
                <span className="text-gray-400 dark:text-gray-500 italic">
                  Please paste your text here...
                </span>
              ) : (
                renderContent
              )}
            </pre>
          </div>
        </div>
      </div>
      <MicrophoneModal isOpen={isMicModalOpen} onClose={toggleMicModal} />
      <SpeakerMoadal isOpen={isSpeakerModalOpen} onClose={toggleSpeakerModal} />
      <LoginFooter />
    </div>
  );
}

export default Page;
