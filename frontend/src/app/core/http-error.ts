import { HttpErrorResponse } from '@angular/common/http';

// Turns failed requests into texts
export function errorMessage(err: unknown): string {
  if (err instanceof HttpErrorResponse) {
    if (err.status === 0) return 'Cannot reach the server. Is the backend running?';
    return err.error?.error ?? 'Something went wrong. Please try again.';
  }
  return 'Something went wrong. Please try again.';
}