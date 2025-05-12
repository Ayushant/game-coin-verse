
// This is a placeholder service that replaced the AdMob implementation
// It contains empty methods to prevent import errors

export const AdService = {
  initialize: async (): Promise<void> => {
    // No-op function
    return Promise.resolve();
  },

  showGameEntryAd: async (): Promise<void> => {
    // No-op function
    return Promise.resolve();
  },
};

export default AdService;
