"use client";

import { useVisualizer, VisualizerMode } from "@/contextApi/audioVizualizer";
import BarsVisualizer from "../visualizer/bar";
import SpiralVisualizer from "../visualizer/spiral";
import MatrixVisualizer from "../visualizer/matrix";


interface Props {
  analyser: AnalyserNode | null;
  isPlaying: boolean;
}

export default function AudioVisualizer(props: Props) {
  const { mode } = useVisualizer();

  switch (mode) {
    case VisualizerMode.Off:
      return null;
    case VisualizerMode.Bars:
      return <BarsVisualizer {...props} />;
    case VisualizerMode.Spiral:
      return <SpiralVisualizer {...props} />;
    case VisualizerMode.Matrix:
      return <MatrixVisualizer {...props} />;
    default:
      return null;
  }
}