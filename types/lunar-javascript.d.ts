declare module 'lunar-javascript' {
  export class Solar {
    static fromYmdHms(year: number, month: number, day: number, hour: number, minute: number, second: number): Solar;
    getYear(): number;
    getMonth(): number;
    getDay(): number;
    getLunar(): Lunar;
    next(days: number): Solar;
  }

  export class Lunar {
    getYear(): number;
    getMonth(): number;
    getDay(): number;
    getYearInChinese(): string;
    getMonthInChinese(): string;
    getDayInChinese(): string;
    getEightChar(): BaZi;
  }

  export class BaZi {
    getYearGanZhi(): string;
    getMonthGanZhi(): string;
    getDayGanZhi(): string;
    getTimeGanZhi(): string;
    getYearNaYin(): string;
    getMonthNaYin(): string;
    getDayNaYin(): string;
    getTimeNaYin(): string;
  }
}
