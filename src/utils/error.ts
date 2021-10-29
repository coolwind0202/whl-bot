class EnvVarInvalidError extends Error {
    constructor(variableName: string, message?: string) {
      // Pass remaining arguments (including vendor specific ones) to parent constructor
      super(variableName)
  
      // Maintains proper stack trace for where our error was thrown (only available on V8)
      if (Error.captureStackTrace) {
        Error.captureStackTrace(this, EnvVarInvalidError)
      }
  
      this.name = "EnvVarInvalidError"
      this.message = message ?? `環境変数 ${variableName} に値が設定されていなかったか、不正でした。`
    }
}

export { EnvVarInvalidError }