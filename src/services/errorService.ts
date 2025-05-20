import { toast } from "react-toastify";

type ErrorHandler = (error: Error | string) => void;

class ErrorService {
  private listeners: ErrorHandler[] = [];

  public subscribe(listener: ErrorHandler) {
    this.listeners.push(listener);
  }

  public unsubscribe(listener: ErrorHandler) {
    this.listeners = this.listeners.filter((l) => l !== listener);
  }

  public notify(error: Error | string) {
    this.listeners.forEach((listener) => listener(error));
    console.error(error);

    // 토스트 알림 표시
    const message = error instanceof Error ? error.message : error;
    toast.error(message);
  }

  public handle(error: unknown) {
    if (error instanceof Error) {
      this.notify(error);
    } else {
      this.notify(String(error));
    }
  }
}

export const errorService = new ErrorService();
