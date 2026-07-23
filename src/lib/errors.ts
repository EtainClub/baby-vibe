export class AppError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status = 400,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export class FirebaseConfigurationError extends AppError {
  constructor() {
    super(
      "firebase_not_configured",
      "Firebase 환경 설정이 아직 연결되지 않았어요.",
      503,
    );
    this.name = "FirebaseConfigurationError";
  }
}
