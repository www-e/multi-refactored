/**
 * Environment Validation Utility
 * Validates required environment variables at runtime
 */
export interface ValidationResult {
  isValid: boolean;
  missingVariables: string[];
  warnings: string[];
}

/**
 * Validates required environment variables
 * @param requiredVars Array of environment variable names that must be present
 * @param optionalWithWarnings Optional array of variables that should be present but are not critical
 * @returns ValidationResult object with validation status and details
 */
export function validateEnvironment(
  requiredVars: string[] = [],
  optionalWithWarnings: string[] = []
): ValidationResult {
  const missingVariables: string[] = [];
  const warnings: string[] = [];

  // Check required variables
  for (const envVar of requiredVars) {
    const value = process.env[envVar];
    if (!value || value.trim() === '' || value === 'xxxxxxxxxxxxxxxxxxxxxxxxxxxx') {
      missingVariables.push(envVar);
    }
  }

  // Check optional variables that should have warnings
  for (const envVar of optionalWithWarnings) {
    const value = process.env[envVar];
    if (!value || value.trim() === '' || value === 'xxxxxxxxxxxxxxxxxxxxxxxxxxxx') {
      warnings.push(`Environment variable ${envVar} is not properly configured (using placeholder value)`);
    }
  }

  return {
    isValid: missingVariables.length === 0,
    missingVariables,
    warnings
  };
}

/**
 * Validates backend environment variables
 * @returns ValidationResult for backend API configuration
 */
export function validateBackendEnvironment(): ValidationResult {
  return validateEnvironment(
    ['NEXT_PUBLIC_BACKEND_URL'], // Required
    ['ELEVENLABS_API_KEY', 'NEXT_PUBLIC_ELEVENLABS_SUPPORT_AGENT_ID', 'NEXT_PUBLIC_ELEVENLABS_SALES_AGENT_ID'] // Should be set but not critical for startup
  );
}

/**
 * Validates ElevenLabs environment variables
 * @returns ValidationResult for ElevenLabs API configuration
 */
export function validateElevenLabsEnvironment(): ValidationResult {
  return validateEnvironment(
    ['ELEVENLABS_API_KEY', 'NEXT_PUBLIC_ELEVENLABS_SUPPORT_AGENT_ID', 'NEXT_PUBLIC_ELEVENLABS_SALES_AGENT_ID'], // Required for full functionality
    [] // No optional warnings for ElevenLabs
  );
}

/**
 * Validates all environment variables and logs issues
 * @param context Optional context string for logging
 * @returns True if all required variables are valid, false otherwise
 */
export function validateAllEnvironment(context: string = 'Environment'): boolean {
  const backendValidation = validateBackendEnvironment();
  const elevenLabsValidation = validateElevenLabsEnvironment();

  // Log validation results
  if (!backendValidation.isValid) {
    console.error(`${context}: Missing required backend environment variables:`, backendValidation.missingVariables);
  }

  if (!elevenLabsValidation.isValid) {
    console.error(`${context}: Missing required ElevenLabs environment variables:`, elevenLabsValidation.missingVariables);
  }

  // Log warnings
  [...backendValidation.warnings, ...elevenLabsValidation.warnings].forEach(warning => {
    console.warn(`${context}: Warning - ${warning}`);
  });

  return backendValidation.isValid && elevenLabsValidation.isValid;
}