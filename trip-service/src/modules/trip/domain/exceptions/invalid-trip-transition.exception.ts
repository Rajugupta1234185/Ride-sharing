export class InvalidTripTransitionException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidTripTransitionException';
  }
}