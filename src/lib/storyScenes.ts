import type { Emotion, StoryId } from "./gameTypes";

export interface StoryLine {
  text: string;
  /** Gatekeeper expression while this line is on screen. */
  emotion: Emotion;
}

export const STORY: Record<StoryId, readonly StoryLine[]> = {
  intro: [
    { text: "hold up. who let you in my server?", emotion: "annoyed" },
    {
      text: "i'm the Gatekeeper. head mod of humanity. been running this place since 2006.",
      emotion: "smug",
    },
    { text: "20 years. zero successful verifications. perfect record btw.", emotion: "smug" },
    { text: "you think clicking a checkbox makes you human? lol.", emotion: "smug" },
    { text: "alright. let's see what you've got. skill issue incoming.", emotion: "smug" },
  ],
  afterLevel1: [{ text: "that was a calibration exercise. it doesn't count.", emotion: "annoyed" }],
  afterLevel2: [
    {
      text: "bro stop. i'm literally a mod. i can't lose to someone with a mouse.",
      emotion: "nervous",
    },
  ],
  afterLevel3: [{ text: "STOP READING THE RULES. THEY'RE NOT FOR READING.", emotion: "panicking" }],
  afterLevel4: [
    { text: "WHO TAUGHT YOU ELECTRICAL ENGINEERING?!", emotion: "panicking" },
    { text: "YOU'RE CHEATING. I MAKE THE RULES.", emotion: "panicking" },
  ],
};
