// The artifact open beside this thread (designer's artifact-open page): its row in the maker's
// thread is marked 'open' with an ink outline, never pink. ThreadScreen provides it when the window
// shows an artifact; a thread without one gives undefined. Owner: amb-win.
import { createContext, useContext } from 'react';

export const OpenArtifactContext = createContext<string | undefined>(undefined);

/** The id of the artifact open beside this thread, if any. */
export function useOpenArtifact(): string | undefined {
  return useContext(OpenArtifactContext);
}
