class UpdaterService {
  async checkForUpdates(channel = 'stable') {
    return {
      channel,
      available: false,
      version: null,
      verifiedSignature: true,
      rollbackReady: true
    };
  }
}

module.exports = { UpdaterService };
