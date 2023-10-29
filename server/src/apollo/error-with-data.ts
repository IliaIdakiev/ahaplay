class ErrorWithData<T = any> extends Error {
  constructor(public message: string, public data: T) {
    super(message);
    this.name = this.constructor.name;
    this.data = data;
    Error.captureStackTrace(this, this.constructor);
  }
}
