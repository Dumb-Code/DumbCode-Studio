export class CommandParseError extends Error {
  constructor(message: string, public readonly errorData?: any) {
    super(message)
  }
}