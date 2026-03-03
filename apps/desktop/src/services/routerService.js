function routeModel(input) {
  const {
    offline,
    sensitivity,
    enterprisePolicy,
    userPreference,
    quotaRemaining,
    costCapReached
  } = input;

  const localRequired = offline || sensitivity === 'high' || enterprisePolicy?.allowLocalOnly === true;
  const cloudAllowed = !offline && enterprisePolicy?.allowLocalOnly !== true && !costCapReached && quotaRemaining > 0;

  const provider = localRequired ? 'local' : cloudAllowed && userPreference !== 'local-first' ? 'cloud' : 'local';

  return {
    provider,
    limits: provider === 'cloud' ? { maxInputTokens: 32000, maxOutputTokens: 4000 } : { maxInputTokens: 8000, maxOutputTokens: 2000 },
    safetyFlags: {
      enforcePromptSanitization: true,
      toolAllowlistOnly: true,
      redactSecrets: true,
      provenanceTracking: true
    }
  };
}

module.exports = { routeModel };
