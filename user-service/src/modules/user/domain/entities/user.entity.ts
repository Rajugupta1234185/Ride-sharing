export class User {
  constructor(
    public readonly id: string,
    public readonly email: string,
    public readonly phone: string,
    public readonly passwordHash: string,
    public readonly role: 'RIDER' | 'DRIVER',
  ) {}
}