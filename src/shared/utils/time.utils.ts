
export class Timing {
  protected constructor(protected time: number) {}

  static milliseconds(ms: number) {
    return new Timing(ms);
  }

  static seconds(s: number) {
    return this.milliseconds(s * 1000);
  }

  static minutes(min: number) {
    return this.seconds(min * 60);
  }

  static hours(hour: number) {
    return this.minutes(hour * 60);
  }

  static days(day: number) {
    return this.hours(day * 24);
  }

  get asMilliseconds() {
    return this.time;
  }

  get asSeconds() {
    return this.time / 1000;
  }

  get asMinutes() {
    return this.asSeconds / 60;
  }

  get asHours() {
    return this.asMinutes / 60;
  }

  get asDays() {
    return this.asHours / 24;
  }
}
