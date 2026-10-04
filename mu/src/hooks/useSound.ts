import { useCallback, useEffect, useMemo, useRef } from "react";

export interface SoundApi {
  unlock(): void;
  move(): void;
  capture(): void;
  castle(): void;
  check(): void;
  end(outcome: "win" | "loss" | "draw"): void;
}

type AudioCtor = typeof AudioContext;

export function useSound(enabled: boolean): SoundApi {
  const ctxRef = useRef<AudioContext | null>(null);
  const enabledRef = useRef(enabled);
  useEffect(() => {
    enabledRef.current = enabled;
  }, [enabled]);
  useEffect(
    () => () => {
      void ctxRef.current?.close().catch(() => undefined);
    },
    [],
  );

  const unlock = useCallback(() => {
    try {
      if (!ctxRef.current) {
        const Ctor = (window.AudioContext ||
          (window as unknown as { webkitAudioContext?: AudioCtor })
            .webkitAudioContext) as AudioCtor | undefined;
        if (Ctor) ctxRef.current = new Ctor();
      }
      if (ctxRef.current?.state === "suspended") void ctxRef.current.resume();
    } catch (error: any) {
      // console.error("Audio unavailable error ~!!!" + error);
    }
  }, []);

  return useMemo<SoundApi>(() => {
    const ready = (): AudioContext | null =>
      enabledRef.current ? ctxRef.current : null;
    const knock = (freq: number, vol: number, dur: number, bright: number) => {
      const ac = ready();
      if (!ac) return;
      try {
        const t = ac.currentTime,
          len = Math.floor(ac.sampleRate * dur);
        const buf = ac.createBuffer(1, len, ac.sampleRate),
          d = buf.getChannelData(0);
        for (let i = 0; i < len; i++) {
          const k = 1 - i / len;
          d[i] = (Math.random() * 2 - 1) * k * k * k;
        }
        const src = ac.createBufferSource(),
          filter = ac.createBiquadFilter(),
          gain = ac.createGain();
        src.buffer = buf;
        filter.type = "bandpass";
        filter.frequency.value = bright;
        filter.Q.value = 1.4;
        gain.gain.value = vol;
        src.connect(filter);
        filter.connect(gain);
        gain.connect(ac.destination);
        src.start(t);
        const osc = ac.createOscillator(),
          og = ac.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, t);
        osc.frequency.exponentialRampToValueAtTime(freq * 0.6, t + dur);
        og.gain.setValueAtTime(vol * 0.6, t);
        og.gain.exponentialRampToValueAtTime(0.0001, t + dur);
        osc.connect(og);
        og.connect(ac.destination);
        osc.start(t);
        osc.stop(t + dur + 0.02);
      } catch {
        //  console.error("Web api error!!");
      }
    };
    const chime = (notes: number[], vol: number) => {
      const ac = ready();
      if (!ac) return;
      try {
        const t = ac.currentTime;
        notes.forEach((f, i) => {
          const osc = ac.createOscillator(),
            g = ac.createGain(),
            s = t + i * 0.09;
          osc.type = "triangle";
          osc.frequency.value = f;
          g.gain.setValueAtTime(0.0001, s);
          g.gain.exponentialRampToValueAtTime(vol, s + 0.02);
          g.gain.exponentialRampToValueAtTime(0.0001, s + 0.5);
          osc.connect(g);
          g.connect(ac.destination);
          osc.start(s);
          osc.stop(s + 0.55);
        });
      } catch {
         //  console.error("Web api error2");
      }
    };
    return {
      unlock,
      move: () => knock(190, 0.5, 0.09, 1500),
      capture: () => {
        knock(150, 0.75, 0.13, 2300);
        setTimeout(() => knock(230, 0.35, 0.06, 3000), 35);
      },
      castle: () => {
        knock(190, 0.45, 0.08, 1500);
        setTimeout(() => knock(170, 0.45, 0.08, 1400), 110);
      },
      check: () => chime([880, 1175], 0.09),
      end: (o) =>
        chime(
          o === "win"
            ? [523, 659, 784, 1047]
            : o === "loss"
              ? [523, 440, 349]
              : [523, 523],
          0.1,
        ),
    };
  }, [unlock]);
}
