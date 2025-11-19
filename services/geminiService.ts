// Functionality removed based on user request.
export const generateTrackAnnouncement = async (
  artist: string,
  title: string
): Promise<AudioBuffer | null> => {
  console.warn("TTS functionality has been disabled.");
  return null;
};
