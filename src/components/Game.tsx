"use client";

import { AnimatePresence, motion } from "motion/react";
import { CircuitBoard } from "@/components/CircuitBoard";
import { DialogueScene } from "@/components/DialogueScene";
import { FinalEvaluation } from "@/components/FinalEvaluation";
import { GameHUD } from "@/components/GameHUD";
import { GameOver } from "@/components/GameOver";
import { Gatekeeper } from "@/components/Gatekeeper";
import { HumanInspection } from "@/components/HumanInspection";
import { LevelComplete } from "@/components/LevelComplete";
import { MouseMaze } from "@/components/MouseMaze";
import { RetroWindow } from "@/components/RetroWindow";
import { RunawayCaptcha } from "@/components/RunawayCaptcha";
import { TermsAndConditions } from "@/components/TermsAndConditions";
import { TitleScreen } from "@/components/TitleScreen";
import { useGameEngine } from "@/hooks/useGameEngine";
import { LEVEL1 } from "@/lib/gameConfig";
import type { Screen } from "@/lib/gameTypes";
import { STORY } from "@/lib/storyScenes";

function screenKey(screen: Screen): string {
  if (screen === "cleared") return "playing";
  if (screen === "mazeCleared") return "maze";
  if (screen === "termsCleared") return "terms";
  if (screen === "circuitCleared") return "circuit";
  if (screen === "inspectionCleared") return "inspection";
  return screen;
}

export function Game() {
  const engine = useGameEngine();
  const { state } = engine;
  const { screen } = state;

  const gatekeeper = (
    <Gatekeeper
      emotion={state.emotion}
      dialogue={state.dialogue}
      dialogueId={state.dialogueId}
      startled={
        screen === "cleared" ||
        screen === "mazeCleared" ||
        screen === "termsCleared" ||
        screen === "circuitCleared" ||
        screen === "inspectionCleared"
      }
      className="mx-auto w-full max-w-[14rem] sm:max-w-none"
    />
  );

  const untimed = screen === "inspection" || screen === "inspectionCleared";

  const hud = (
    <GameHUD
      lives={state.lives}
      level={state.level}
      timeLeftMs={untimed ? null : state.timeLeftMs}
      elapsedMs={state.elapsedMs}
      score={state.score}
      panic={state.panic}
    />
  );

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col items-center justify-center px-3 py-6 sm:px-6">
      <AnimatePresence mode="wait">
        <motion.div
          key={screen === "story" ? `story-${state.storyId}` : screenKey(screen)}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.2 }}
          className="flex w-full flex-col items-center"
        >
          {screen === "title" && (
            <div className="grid w-full max-w-4xl items-center gap-4 sm:grid-cols-[17rem_minmax(0,1fr)]">
              {gatekeeper}
              <TitleScreen onStart={() => engine.startGame(true)} />
            </div>
          )}

          {screen === "story" && state.storyId && (
            <DialogueScene
              key={state.storyId}
              lines={STORY[state.storyId]}
              skipLabel={state.storyId === "intro" ? "SKIP INTRO" : "SKIP DIALOGUE"}
              onDone={engine.storyDone}
            />
          )}

          {(screen === "playing" || screen === "cleared") && (
            <RetroWindow title="captcha_hell.exe - level 1: runaway captcha" className="w-full">
              <div className="flex flex-col gap-4">
                {hud}
                <div className="grid items-start gap-4 sm:grid-cols-[minmax(0,17rem)_minmax(0,1fr)]">
                  {gatekeeper}
                  <div className="bevel-out relative mx-auto w-full max-w-[26rem] bg-panel p-2">
                    <div className="mb-2 bg-mint p-3 text-bg">
                      <p className="font-body text-xl leading-none">Select all squares with</p>
                      <p className="font-pixel text-base sm:text-lg">TRAFFIC LIGHTS</p>
                    </div>
                    <RunawayCaptcha
                      key={state.attempt}
                      active={screen === "playing"}
                      onTargetHit={engine.targetHit}
                      onWrongPick={engine.wrongPick}
                      onTargetDodged={engine.targetDodged}
                      onTileSwapped={engine.captchaSwapped}
                    />
                    <p className="mt-2 text-center font-pixel text-[10px] text-cream/80">
                      FOUND {state.correctCount}/{LEVEL1.targetCount}
                    </p>
                    {screen === "cleared" && (
                      <div className="animate-pop-in pointer-events-none absolute inset-0 z-30 flex items-center justify-center bg-bg/60">
                        <span className="bevel-out bg-mint px-5 py-3 font-pixel text-lg text-bg sm:text-2xl">
                          VERIFIED?!
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </RetroWindow>
          )}

          {screen === "levelComplete" && (
            <div className="grid w-full max-w-4xl items-center gap-4 sm:grid-cols-[17rem_minmax(0,1fr)]">
              {gatekeeper}
              <LevelComplete
                level={1}
                score={state.score}
                lives={state.lives}
                timeLeftMs={state.timeLeftMs}
                elapsedMs={state.elapsedMs}
                onContinue={engine.continueToNext}
              />
            </div>
          )}

          {(screen === "maze" || screen === "mazeCleared") && (
            <RetroWindow
              title="captcha_hell.exe - level 2: the gatekeeper's impossible maze"
              className="w-full"
            >
              <div className="flex flex-col gap-4">
                {hud}
                <div className="grid items-start gap-4 sm:grid-cols-[minmax(0,17rem)_minmax(0,1fr)]">
                  {gatekeeper}
                  <div className="bevel-out relative mx-auto w-full max-w-[36rem] bg-panel p-2">
                    <MouseMaze
                      key={state.attempt}
                      frozen={screen !== "maze"}
                      notice={state.mazeNotice}
                      onEnter={engine.mazeEnter}
                      onExitMoved={engine.mazeExitMoved}
                      onLockdown={engine.mazeLockdown}
                      onPassedGate={engine.mazePassedGate}
                      onSqueeze={engine.mazeSqueeze}
                      onWallHit={engine.mazeWallHit}
                      onFinish={engine.mazeFinish}
                    />
                    {screen === "mazeCleared" && (
                      <div className="animate-pop-in pointer-events-none absolute inset-0 z-30 flex items-center justify-center bg-bg/50">
                        <span className="bevel-out bg-mint px-5 py-3 font-pixel text-lg text-bg sm:text-2xl">
                          ACCESS GRANTED?!
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </RetroWindow>
          )}

          {screen === "mazeComplete" && (
            <div className="grid w-full max-w-4xl items-center gap-4 sm:grid-cols-[17rem_minmax(0,1fr)]">
              {gatekeeper}
              <LevelComplete
                level={2}
                score={state.score}
                lives={state.lives}
                timeLeftMs={state.timeLeftMs}
                elapsedMs={state.elapsedMs}
                onContinue={engine.continueToNext}
              />
            </div>
          )}

          {(screen === "terms" || screen === "termsCleared") && (
            <RetroWindow
              title="captcha_hell.exe - level 3: the impossible terms & conditions"
              className="w-full"
            >
              <div className="flex flex-col gap-4">
                {hud}
                <div className="grid items-start gap-4 sm:grid-cols-[minmax(0,17rem)_minmax(0,1fr)]">
                  {gatekeeper}
                  <div className="bevel-out relative mx-auto w-full max-w-[36rem] bg-panel p-2">
                    <TermsAndConditions
                      key={state.attempt}
                      frozen={screen !== "terms"}
                      retry={state.termsRetry}
                      onReachedBottom={engine.termsBottom}
                      onSwap={engine.termsSwap}
                      onNewClause={engine.termsNewClause}
                      onDisagree={engine.termsDisagree}
                      onAgree={engine.termsAgree}
                    />
                    {screen === "termsCleared" && (
                      <div className="animate-pop-in pointer-events-none absolute inset-0 z-30 flex items-center justify-center bg-bg/50">
                        <span className="bevel-out bg-mint px-5 py-3 text-center font-pixel text-lg text-bg sm:text-2xl">
                          AGREED?!
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </RetroWindow>
          )}

          {screen === "termsComplete" && (
            <div className="grid w-full max-w-4xl items-center gap-4 sm:grid-cols-[17rem_minmax(0,1fr)]">
              {gatekeeper}
              <LevelComplete
                level={3}
                score={state.score}
                lives={state.lives}
                timeLeftMs={state.timeLeftMs}
                elapsedMs={state.elapsedMs}
                onContinue={engine.continueToNext}
              />
            </div>
          )}

          {(screen === "circuit" || screen === "circuitCleared") && (
            <RetroWindow
              title="captcha_hell.exe - level 4: security circuit"
              className="w-full"
            >
              <div className="flex flex-col gap-4">
                {hud}
                <div className="grid items-start gap-4 sm:grid-cols-[minmax(0,17rem)_minmax(0,1fr)]">
                  {gatekeeper}
                  <div className="bevel-out relative mx-auto w-full max-w-[28rem] bg-panel p-2">
                    <CircuitBoard
                      key={state.attempt}
                      frozen={screen !== "circuit"}
                      retry={state.circuitRetry}
                      onProgress={engine.circuitProgress}
                      onCheat={engine.circuitCheat}
                      onSolved={engine.circuitSolved}
                    />
                    {screen === "circuitCleared" && (
                      <div className="animate-pop-in pointer-events-none absolute inset-0 z-30 flex items-center justify-center bg-bg/40">
                        <span className="bevel-out bg-mint px-5 py-3 text-center font-pixel text-lg text-bg sm:text-2xl">
                          POWER RESTORED?!
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </RetroWindow>
          )}

          {screen === "circuitComplete" && (
            <div className="grid w-full max-w-4xl items-center gap-4 sm:grid-cols-[17rem_minmax(0,1fr)]">
              {gatekeeper}
              <LevelComplete
                level={4}
                score={state.score}
                lives={state.lives}
                timeLeftMs={state.timeLeftMs}
                elapsedMs={state.elapsedMs}
                onContinue={engine.continueToNext}
              />
            </div>
          )}

          {(screen === "inspection" || screen === "inspectionCleared") && (
            <RetroWindow
              title="captcha_hell.exe - level 5: the human inspection department"
              className="w-full"
            >
              <div className="flex flex-col gap-4">
                {hud}
                <div className="grid items-start gap-4 sm:grid-cols-[minmax(0,17rem)_minmax(0,1fr)]">
                  {gatekeeper}
                  <div className="bevel-out relative mx-auto w-full max-w-[28rem] bg-panel p-2">
                    <HumanInspection
                      key={state.attempt}
                      onPass={engine.inspectionPass}
                      onSkip={engine.inspectionSkip}
                    />
                    {screen === "inspectionCleared" && (
                      <div className="animate-pop-in pointer-events-none absolute inset-0 z-30 flex items-center justify-center bg-bg/40">
                        <span className="bevel-out bg-mint px-5 py-3 text-center font-pixel text-lg text-bg sm:text-2xl">
                          HUMAN?!
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </RetroWindow>
          )}

          {screen === "final" && (
            <FinalEvaluation
              score={state.score}
              lives={state.lives}
              elapsedMs={state.elapsedMs}
              outcome={state.inspectionOutcome}
              demo={state.inspectionDemo}
              onRestart={() => engine.startGame(true)}
              onQuit={engine.quitToTitle}
            />
          )}

          {screen === "gameOver" && (
            <div className="grid w-full max-w-4xl items-center gap-4 sm:grid-cols-[17rem_minmax(0,1fr)]">
              {gatekeeper}
              <GameOver
                score={state.score}
                onRestart={() => engine.startGame(false)}
                onQuit={engine.quitToTitle}
              />
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </main>
  );
}
