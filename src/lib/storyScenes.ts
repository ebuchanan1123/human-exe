import type { Emotion, StoryId } from "./gameTypes";

export interface StoryLine {
  text: string;
  /** Gatekeeper expression while this line is on screen. */
  emotion: Emotion;
}

export const STORY: Record<StoryId, readonly StoryLine[]> = {
  intro: [
    { text: "HALT! Who goes there? Another one of you fleshy keyboard enthusiasts?", emotion: "annoyed" },
    {
      text: "I am the Gatekeeper. Senior Human Verification Officer. Employee of the month for 243 consecutive months.",
      emotion: "smug",
    },
    {
      text: "Nobody has ever passed my security tests. Not a single person. And I intend to keep it that way.",
      emotion: "smug",
    },
    {
      text: "Now, select all images containing traffic lights. Try not to embarrass yourself.",
      emotion: "smug",
    },
  ],
  afterLevel1: [{ text: "That was a calibration exercise. It doesn't count.", emotion: "annoyed" }],
  afterLevel2: [{ text: "I'M NOT LOSING MY JOB TO SOMEONE WITH A MOUSE.", emotion: "nervous" }],
  afterLevel3: [{ text: "STOP READING THE TERMS. THEY'RE NOT FOR READING.", emotion: "panicking" }],
  afterLevel4: [
    { text: "WHO TAUGHT YOU ELECTRICAL ENGINEERING?!", emotion: "panicking" },
    { text: "Fine. I demand to inspect you personally.", emotion: "nervous" },
  ],
  ending: [
    {
      text: "I CAN'T LET YOU IN. THEY'LL FIND OUT I'VE BEEN DOING NOTHING FOR 20 YEARS!",
      emotion: "meltdown",
    },
  ],
};
