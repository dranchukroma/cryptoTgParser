export function logger(type: string, message: string) {
    const time = new Date().toISOString();
    const logMsg = `[${time}] [${type}] ${message}`;
    console.log(logMsg);
    // TODO: тут можна замінити на надсилання іншому боту
  }