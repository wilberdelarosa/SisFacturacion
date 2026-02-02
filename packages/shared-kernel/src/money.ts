export class Money {
  constructor(public readonly amount: number, public readonly currency: string = 'DOP') {}

  add(value: Money): Money {
    if (value.currency !== this.currency) {
      throw new Error('Currency mismatch');
    }
    return new Money(this.amount + value.amount, this.currency);
  }
}
