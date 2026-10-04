"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type KeyboardEvent } from "react";
import styles from "@/css/chessGame.module.css";
import { ActionBar, type Action } from "@/components/games/chess/actionBar";
import { Board } from "@/components/games/chess/board";
import { ConfirmDialog } from "@/components/games/chess/confirmDialog";
import { EnginePanel } from "@/components/games/chess/enginePanel";
import { EvalBar } from "@/components/games/chess/evalBar";
import { GameOverDialog } from "@/components/games/chess/gameOverDialog";
import { Icon } from "@/components/games/chess/icons";
import { MoveList } from "@/components/games/chess/moveList";
import { NewGameDialog, type SideChoice } from "@/components/games/chess/newGameDialog";
import { PieceDefs } from "@/components/games/chess/pieceDefs";
import { PieceIcon } from "@/components/games/chess/pieceIcon";
import { PlayerBar } from "@/components/games/chess/playerBar";
import { RulesDialog } from "@/components/games/chess/rules/rulesDialog";
import { SettingsDialog } from "@/components/games/chess/settingsDialog";
import { StatusPanel } from "@/components/games/chess/statusPanel";
import { defaultLevel, hintSearch, levels } from "@/engines/chess/levels";
import { bookMove } from "@/engines/chess/openingBook";
import type { SearchReply } from "@/engines/chess/protocol";
import { useChessGame } from "@/hooks/useChessGame";
import { useEngine, type SearchTask, type WorkerFactory } from "@/hooks/useEngine";
import { usePersistentState } from "@/hooks/usePersistentState";
import { useSound } from "@/hooks/useSound";
import type { Color, EngineReport, GameConfig, GameMode, GameResult, PieceCode, Settings } from "@/lib/games/chess/types";
import { summarizeMaterial } from "@/lib/games/chess/material";
import { colorName, opposite } from "@/lib/games/chess/pieces";
import { describeResult } from "@/lib/games/chess/result";
import { readJSON, writeJSON } from "@/lib/games/chess/storage";

export interface ChessGameProps {
  /** Heading shown in the top bar. */
  title?: string;
  /** localStorage key prefix, so several boards on one site don't share a saved game. */
  storageKey?: string;
  /** Override how the engine worker is created (tests, custom bundlers). */
  workerFactory?: WorkerFactory;
  className?: string;
  /**
   * CSS height of the game area. Defaults to the full screen height. Inside a page layout, give the
   * game a sized container and pass "100%".
   */
  height?: string;
  /**
   * Light/dark palette: "system" follows the device setting, "class" follows a `dark` class on an
   * ancestor (Tailwind's class strategy), or force "light" / "dark".
   */
  colorScheme?: 'system' | 'class' | 'light' | 'dark';
}

interface SavedGame { config: GameConfig; moves: string[]; result: GameResult | null; flipped: boolean; started: boolean }

const defaultConfig: GameConfig = { mode: 'computer', humanColor: 'w', level: defaultLevel };
const defaultSettings: Settings = { theme: 'slate', sound: true, showLegalMoves: true, coordinates: true, autoRotate: false, showEvaluation: true };
const defaultSaved: SavedGame = { config: defaultConfig, moves: [], result: null, flipped: false, started: false };

const normalizeSettings = (s: Settings): Settings => ({ ...defaultSettings, ...s });
const normalizeSaved = (s: SavedGame): SavedGame => {
  const config = { ...defaultConfig, ...(s?.config ?? {}) };
  config.level = Math.min(levels.length - 1, Math.max(0, Math.round(config.level)));
  if (config.mode !== 'local') config.mode = 'computer';
  if (config.humanColor !== 'b') config.humanColor = 'w';
  return { ...defaultSaved, ...s, config, moves: Array.isArray(s?.moves) ? s.moves.filter((m) => typeof m === 'string') : [] };
};

type DialogName = 'new' | 'settings' | 'resign' | 'draw' | 'over' | 'rules' | null;
type Thinking = 'engine' | 'hint' | null;

const moverOfPly = (i: number): Color => (i % 2 === 0 ? 'w' : 'b');

export default function ChessGame({ title = 'Chess', storageKey = 'mu-chess', workerFactory, className, height, colorScheme = 'system' }: ChessGameProps) {
  const [saved] = useState(() => normalizeSaved(readJSON<SavedGame>(`${storageKey}:game`, defaultSaved)));
  const [settings, setSettings] = usePersistentState<Settings>(`${storageKey}:settings`, defaultSettings, normalizeSettings);
  const [config, setConfig] = useState<GameConfig>(saved.config);
  const [flipped, setFlipped] = useState(saved.flipped);
  const [started, setStarted] = useState(saved.started);
  const [dialog, setDialog] = useState<DialogName>(saved.started ? null : 'new');
  /** Dialog to return to when the rule book closes (e.g. New game). */
  const [rulesReturn, setRulesReturn] = useState<DialogName>(null);
  const [thinking, setThinking] = useState<Thinking>(null);
  const [report, setReport] = useState<EngineReport | null>(null);
  const [hint, setHint] = useState<{ uci: string; san: string } | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const game = useChessGame(saved.moves, saved.result);
  const { state } = game;
  const engine = useEngine(workerFactory);
  const sound = useSound(settings.sound);
  const hintTask = useRef<SearchTask | null>(null);

  const { mode, humanColor } = config;
  const level = levels[config.level];
  const engineColor = opposite(humanColor);
  const live = state.view === null;
  const { liveTurn, result } = state;

  // ---- persistence ----
  useEffect(() => {
    writeJSON(`${storageKey}:game`, { config, moves: state.moves, result: state.result, flipped, started } satisfies SavedGame);
  }, [storageKey, config, state.moves, state.result, flipped, started]);

  // ---- notices fade after a few seconds ----
  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(null), 3500);
    return () => clearTimeout(t);
  }, [notice]);

  const toReport = useCallback((r: Omit<SearchReply, 'move'>, sideToMove: Color): EngineReport => ({
    depth: r.depth, nodes: r.nodes, time: r.time, pv: r.pv, scoreWhite: sideToMove === 'w' ? r.score : -r.score,
  }), []);

  // ---- applying a move (from the board or the engine) ----
  const applyMove = useCallback((m: number) => {
    const outcome = game.play(m);
    if (!outcome) return;
    setHint(null);
    if (outcome.result) {
      const d = describeResult(outcome.result, mode, humanColor, level.name);
      sound.end(d.outcome);
      setTimeout(() => setDialog('over'), 650);
    } else if (outcome.check) sound.check();
    else if (outcome.castle) sound.castle();
    else if (outcome.capture) sound.capture();
    else sound.move();
  }, [game, mode, humanColor, level.name, sound]);

  // ---- the computer's turn ----
  const isComputerTurn = mode === 'computer' && !result && liveTurn === engineColor && started;
  useEffect(() => {
    if (!isComputerTurn) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let task: SearchTask | null = null;
    const moves = state.moves, t0 = Date.now();
    setThinking('engine');
    const finishWith = (uci: string | null) => {
      if (cancelled) return;
      setThinking(null);
      const m = uci ? game.moveFromUci(uci) : 0;
      applyMove(m || state.legal[0]);
    };
    const book = level.useBook ? bookMove(moves, (u) => game.moveFromUci(u) !== 0) : null;
    if (book) {
      timer = setTimeout(() => { if (!cancelled) { setReport({ depth: 0, nodes: 0, time: 0, pv: [], scoreWhite: report?.scoreWhite ?? 0, book: true }); finishWith(book); } }, 450 + Math.random() * 350);
    } else {
      task = engine.search(moves, level.search, (info) => { if (!cancelled) setReport(toReport(info, engineColor)); });
      void task.promise.then((reply) => {
        if (cancelled || !reply) return;
        setReport(toReport(reply, engineColor));
        // A short minimum delay so instant replies don't feel abrupt.
        timer = setTimeout(() => finishWith(reply.move), Math.max(0, 380 - (Date.now() - t0)));
      });
    }
    return () => { cancelled = true; clearTimeout(timer); task?.cancel(); setThinking(null); };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- re-run only when the position or turn changes
  }, [isComputerTurn, state.moves, config.level]);

  // Any change of position cancels a pending hint.
  useEffect(() => () => { hintTask.current?.cancel(); hintTask.current = null; }, [state.moves]);

  // ---- who may move, and board orientation ----
  const movable: Color | null = !live || result ? null
    : mode === 'computer' ? (liveTurn === humanColor && thinking !== 'engine' ? humanColor : null)
    : liveTurn;
  const bottom: Color = mode === 'local' && settings.autoRotate
    ? (flipped ? opposite(liveTurn) : liveTurn)
    : ((mode === 'computer' ? humanColor : 'w') === 'w') !== flipped ? 'w' : 'b';
  const top = opposite(bottom);

  const material = useMemo(() => summarizeMaterial(state.position.board), [state.position.board]);

  // ---- actions ----
  const canUndo = mode === 'computer' ? state.moves.some((_, i) => moverOfPly(i) === humanColor) : state.moves.length > 0;

  const undo = useCallback(() => {
    if (!canUndo) return;
    let n = 1;
    if (mode === 'computer') { while (state.moves.length - n > 0 && moverOfPly(state.moves.length - n) !== humanColor) n++; }
    game.undo(n);
    setHint(null); setThinking(null); setDialog(null);
    setNotice(mode === 'computer' && n > 1 ? 'Took back your last move and the reply.' : 'Took back the last move.');
  }, [canUndo, mode, state.moves, humanColor, game]);

  const requestHint = useCallback(() => {
    if (!movable || thinking) return;
    sound.unlock();
    const side = liveTurn;
    setThinking('hint');
    const task = engine.search(state.moves, hintSearch);
    hintTask.current = task;
    void task.promise.then((reply) => {
      if (hintTask.current !== task) return;
      hintTask.current = null;
      setThinking(null);
      if (!reply?.move) return;
      setHint({ uci: reply.move, san: game.sanOf(reply.move) });
      if (mode === 'computer') setReport(toReport(reply, side));
    });
  }, [movable, thinking, sound, liveTurn, engine, state.moves, game, mode, toReport]);

  const resign = useCallback(() => {
    setDialog(null);
    game.finish({ kind: 'resign', winner: mode === 'computer' ? engineColor : opposite(liveTurn) });
    sound.end(mode === 'computer' ? 'loss' : 'win');
    setTimeout(() => setDialog('over'), 200);
  }, [game, mode, engineColor, liveTurn, sound]);

  const agreeDraw = useCallback(() => {
    setDialog(null);
    game.finish({ kind: 'agreed', winner: null });
    sound.end('draw');
    setTimeout(() => setDialog('over'), 200);
  }, [game, sound]);

  const startGame = useCallback((m: GameMode, side: SideChoice, lvl: number, autoRotate: boolean) => {
    sound.unlock();
    const humanSide: Color = side === 'random' ? (Math.random() < 0.5 ? 'w' : 'b') : side;
    setConfig({ mode: m, humanColor: humanSide, level: lvl });
    setSettings((s) => ({ ...s, autoRotate }));
    setFlipped(false); setStarted(true); setHint(null); setReport(null); setThinking(null); setDialog(null);
    game.restart([]);
  }, [sound, setSettings, game]);

  const patchSettings = useCallback((patch: Partial<Settings>) => setSettings((s) => ({ ...s, ...patch })), [setSettings]);
  const openNew = useCallback(() => setDialog('new'), []);
  const openSettings = useCallback(() => setDialog('settings'), []);
  const closeDialog = useCallback(() => setDialog(null), []);
  const openRules = useCallback(() => { setRulesReturn(dialog === 'rules' ? null : dialog); setDialog('rules'); }, [dialog]);
  const closeRules = useCallback(() => { setDialog(rulesReturn); setRulesReturn(null); }, [rulesReturn]);
  const review = useCallback(() => { setDialog(null); game.goTo(0); }, [game]);
  const blocked = useCallback(() => setNotice(thinking === 'engine' ? `${level.name} is thinking\u2026` : 'It\u2019s not your move.'), [thinking, level.name]);

  const actions = useMemo<Action[]>(() => {
    const list: Action[] = [
      { id: 'undo', label: 'Undo', icon: 'undo', onClick: undo, disabled: !canUndo || !started },
      { id: 'hint', label: 'Hint', icon: 'hint', onClick: requestHint, disabled: !movable || !!thinking },
      { id: 'flip', label: 'Flip', icon: 'flip', onClick: () => setFlipped((f) => !f) },
    ];
    if (mode === 'local') list.push({ id: 'draw', label: 'Draw', icon: 'handshake', onClick: () => setDialog('draw'), disabled: !!result || !state.moves.length });
    list.push({ id: 'resign', label: 'Resign', icon: 'flag', onClick: () => setDialog('resign'), disabled: !!result || !state.moves.length, danger: true });
    return list;
  }, [undo, canUndo, started, requestHint, movable, thinking, mode, result, state.moves.length]);

  // ---- text ----
  const resultText = result ? describeResult(result, mode, humanColor, level.name) : null;
  let statusTitle: string, statusDetail: string;
  if (resultText) { statusTitle = resultText.title; statusDetail = resultText.detail; }
  else if (!live) { statusTitle = 'Reviewing'; statusDetail = `Move ${Math.ceil(state.position.ply / 2)} of ${Math.ceil(state.moves.length / 2)}. Tap the board to return to the game.`; }
  else if (mode === 'computer') {
    statusTitle = thinking === 'engine' ? `${level.name} is thinking` : state.position.checkSquare >= 0 ? 'Check. Your move' : 'Your move';
    statusDetail = notice ?? (hint ? `Hint: ${hint.san} is the engine\u2019s suggestion.` : `You play ${colorName(humanColor)} against ${level.name}.`);
  } else {
    statusTitle = `${state.position.checkSquare >= 0 ? 'Check. ' : ''}${colorName(liveTurn)} to move`;
    statusDetail = notice ?? (hint ? `Hint: ${hint.san} is the engine\u2019s suggestion.` : 'Two players on one device.');
  }

  const nameOf = (c: Color) => (mode === 'local' ? colorName(c) : c === humanColor ? 'You' : 'Computer');
  const tagOf = (c: Color) => (mode === 'computer' && c === engineColor ? level.name : undefined);
  const thinkingOf = (c: Color) => (thinking === 'engine' && c === engineColor ? 'Thinking' : thinking === 'hint' && c === liveTurn ? 'Analysing' : null);
  const showEval = mode === 'computer' && settings.showEvaluation;
  const overIcon: PieceCode = !resultText ? 'wK' : resultText.outcome === 'draw' ? `${mode === 'computer' ? humanColor : 'w'}N`
    : `${result!.winner!}K`;
  const pvLine = useMemo(() => (report && !report.book && report.pv.length ? game.lineToSan(report.pv, 8) : ''), [report, game]);

  const onRootKeyDown = useCallback((e: KeyboardEvent<HTMLDivElement>) => {
    const t = e.target as HTMLElement;
    if (dialog || t.closest('[role="grid"],input,textarea')) return;
    if (e.key === 'ArrowLeft') { e.preventDefault(); game.goTo(state.position.ply - 1); }
    else if (e.key === 'ArrowRight') { e.preventDefault(); game.goTo(state.position.ply + 1); }
  }, [dialog, game, state.position.ply]);

  const onInteract = useCallback(() => { sound.unlock(); if (!live) game.goTo(null); }, [sound, live, game]);

  return (
    <div
      className={`${styles.root} ${className ?? ''}`}
      style={height ? ({ '--chess-height': height } as CSSProperties) : undefined}
      data-scheme={colorScheme}
      onKeyDown={onRootKeyDown}
    >
      <PieceDefs />
      <div className={styles.shell}>
      <header className={styles.topbar}>
        <div className={styles.brand}><PieceIcon code="wK" /><h1>{title}</h1></div>
        <div className={styles.topActions}>
          <button type="button" className={`${styles.btn} ${styles.rulesBtn}`} aria-label="How to play" onClick={openRules}><Icon name="book" /><span className={styles.rulesBtnLabel}>Rules</span></button>
          <button type="button" className={styles.iconBtn} aria-label="Settings" onClick={openSettings}><Icon name="gear" /></button>
          <button type="button" className={`${styles.btn} ${styles.primary}`} onClick={openNew}>New game</button>
        </div>
      </header>

      <main className={styles.layout}>
        <div className={styles.playerTop}>
          <PlayerBar color={top} name={nameOf(top)} tag={tagOf(top)} active={live && !result && liveTurn === top} thinking={thinkingOf(top)} captured={material.captured[top]} lead={material.lead[top]} />
        </div>
        <div className={styles.boardArea}>
          {showEval && <EvalBar scoreWhite={report?.scoreWhite ?? 0} bottom={bottom} />}
          <div className={styles.boardFrame}>
            <Board
              pieces={state.position.pieces}
              bottom={bottom}
              theme={settings.theme}
              coordinates={settings.coordinates}
              showLegalMoves={settings.showLegalMoves}
              lastMove={state.position.lastMove}
              checkSquare={state.position.checkSquare}
              hint={live ? hint?.uci ?? null : null}
              legal={movable ? state.legal : []}
              movable={movable}
              decode={game.decode}
              onMove={applyMove}
              onBlocked={blocked}
              onInteract={onInteract}
              label={`Chess board, ${colorName(bottom)} at the bottom. ${statusTitle}.`}
            />
          </div>
        </div>
        <div className={styles.playerBottom}>
          <PlayerBar color={bottom} name={nameOf(bottom)} tag={tagOf(bottom)} active={live && !result && liveTurn === bottom} thinking={thinkingOf(bottom)} captured={material.captured[bottom]} lead={material.lead[bottom]} />
        </div>
        <aside className={styles.side}>
          <StatusPanel title={statusTitle} detail={statusDetail} />
          <ActionBar actions={actions} />
          <MoveList sans={state.sans} ply={state.position.ply} reviewing={!live} onSelect={game.goTo}
            emptyText={mode === 'computer' && humanColor === 'b' ? 'The computer opens with White.' : 'No moves yet. White moves first.'} />
          {showEval && <EnginePanel report={report} line={pvLine} />}
        </aside>
      </main>
      </div>

      <NewGameDialog open={dialog === 'new'} initial={config} autoRotate={settings.autoRotate} canCancel={started} onStart={startGame} onClose={closeDialog} onShowRules={openRules} />
      <RulesDialog open={dialog === 'rules'} onClose={closeRules} />
      <SettingsDialog open={dialog === 'settings'} settings={settings} mode={mode} onChange={patchSettings} onClose={closeDialog} />
      <ConfirmDialog open={dialog === 'resign'}
        title={mode === 'computer' ? 'Resign this game?' : `${colorName(liveTurn)} resigns?`}
        body={mode === 'computer' ? `${level.name} will be credited with the win.` : `${colorName(opposite(liveTurn))} will win the game.`}
        confirmLabel="Resign" cancelLabel="Keep playing" onConfirm={resign} onCancel={closeDialog} />
      <ConfirmDialog open={dialog === 'draw'} title="Agree to a draw?"
        body={`${colorName(liveTurn)} offers a draw. ${colorName(opposite(liveTurn))}, do you accept?`}
        confirmLabel="Accept draw" cancelLabel="Decline" onConfirm={agreeDraw} onCancel={closeDialog} />
      <GameOverDialog open={dialog === 'over' && !!resultText} title={resultText?.title ?? ''} detail={resultText?.detail ?? ''} icon={overIcon}
        onNewGame={openNew} onReview={review} onClose={closeDialog} />
    </div>
  );
}
