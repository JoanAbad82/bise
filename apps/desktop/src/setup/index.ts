// src/setup: setup with no terminal (bar S.2, S.4, S.7, S.9): the first
// launch. Owner: amb-home. model.ts is its steps and what ⏎ sends,
// Onboarding.tsx draws one step from props, screen.tsx feeds it from the
// store and the helper (OnboardingScreen) and sends a fresh home to it
// once (useFirstLaunch, called by the shell).
export { Onboarding, type OnboardingPorts, type OnboardingProps } from './Onboarding';
export { OnboardingScreen, useFirstLaunch } from './screen';
export { STEPS, type Step } from './model';
export { FirstRun, FIRST_RUN, DEMO, showsFirstRun, type FirstRunProps } from './FirstRun';
