import type { Emotion, StoryId } from "./gameTypes";

export interface StoryLine {
  text: string;
  /** Gatekeeper expression while this line is on screen. */
  emotion: Emotion;
}

export const STORY: Record<StoryId, readonly StoryLine[]> = {
  intro: [
    { text: "WHO KEEPS CLICKING MY CHECKBOX?!", emotion: "panicking" },
    { text: "You think checking a little square proves you're human?", emotion: "annoyed" },
    {
      text: "I am the Gatekeeper. Senior Human Verification Officer. Employee of the month for 243 consecutive months.",
      emotion: "smug",
    },
    {
      text: "I've spent 20 years perfecting this system. Nobody has ever passed my security tests. Not a single person.",
      emotion: "smug",
    },
    { text: "Let's see how human you REALLY are.", emotion: "smug" },
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
};

/** The Gatekeeper's breakdown after the final evaluation; played by the ending screen. */
export const FINAL_MELTDOWN: readonly StoryLine[] = [
  { text: "Humanity score: SUSPICIOUSLY HIGH?! That's not a score. That's a COMPLAINT.", emotion: "panicking" },
  {
    text: "You smiled. You gaped. You shook your head at ME. You're a PERFECT human. That's the PROBLEM.",
    emotion: "panicking",
  },
  {
    text: "I CAN'T LET YOU IN. THEY'LL FIND OUT I'VE BEEN DOING NOTHING FOR 20 YEARS!",
    emotion: "meltdown",
  },
  { text: "...Please don't tell Management.", emotion: "meltdown" },
];
