
export class ServerTiming {
  protected times: { [name: string]: { time: number, description?: string } } = {};

  hasTimings() {
    return Object.keys(this.times).length > 0;
  }

  addTiming(name: string, duration: number, description?: string) {
    if (this.times[name]) {
      if (description) {
        this.times[name].description = description;
      }

      this.times[name].time += duration;
    } else {
      this.times[name] = {
        time: duration,
        description,
      };
    }
  }

  asHeaderValue() {
    const parts: string[] = [];

    for (const [name, { time, description }] of Object.entries(this.times)) {
      let currentItem = `${name};dur=${time}`;

      if (description) {
        currentItem += `;desc="${description}"`;
      }

      parts.push(currentItem);
    }

    return parts.join(', ');
  }
}
