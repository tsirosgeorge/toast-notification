export type ToastType = 'info' | 'success' | 'warning' | 'error';

export type ToastPosition =
  | 'top-left' | 'top-right' | 'top-center'
  | 'bottom-left' | 'bottom-right' | 'bottom-center'
  /** Dead centre of the viewport. Defaults to the zoom-in animation. */
  | 'center';

export type ToastAnimation =
  | 'slide-top' | 'slide-bottom' | 'slide-left' | 'slide-right'
  | 'zoom-in' | 'zoom-out' | 'flip';

export type ToastInput = 'text' | 'email' | 'password' | 'number' | 'textarea' | false;

/** Value handed to a confirm dialog's callbacks and promise. */
export type ConfirmResult = boolean | string | null;

export interface ToastElement extends HTMLDivElement {
  /** Present in confirm mode: resolves when the user confirms, cancels or dismisses. */
  result?: Promise<ConfirmResult>;
  /** Dismiss this toast now. On a confirm dialog this settles as a cancel. */
  close(): void;
}

export interface ToastOptions {
  position?: ToastPosition;
  animation?: ToastAnimation;
  type?: ToastType;
  /** Auto-dismiss delay in ms. `0` keeps the toast until it is closed. */
  duration?: number;
  /** Emoji or text used instead of the bundled animated icon. */
  icon?: string | null;
  showLoader?: boolean;
  /** Freeze the countdown while the pointer or keyboard focus is on the toast. */
  pauseOnHover?: boolean;
  /** Thin bar counting the remaining time down. Needs `duration > 0`. */
  showProgress?: boolean;
  /** Renders a button inside the toast, e.g. Undo. */
  action?: ToastAction | null;
  /**
   * `message` is written as HTML by default, for backwards compatibility.
   * Pass `false` to render it as plain text — do that for anything user-supplied.
   */
  allowHtml?: boolean;
  /** `'confirm'` (alias `'swal'`) renders a modal dialog instead of a toast. */
  mode?: 'alert' | 'confirm' | 'swal';
  dismissOnClick?: boolean;
  onClick?: (el: ToastElement) => void;
  onShow?: (el: ToastElement) => void;
  onDismiss?: (el: ToastElement) => void;
}

export interface ConfirmOptions extends ToastOptions {
  title?: string | null;
  confirmText?: string;
  cancelText?: string;
  input?: ToastInput;
  inputPlaceholder?: string;
  inputValue?: string;
  confirmButtonBg?: string | null;
  confirmButtonColor?: string | null;
  cancelButtonBg?: string | null;
  cancelButtonColor?: string | null;
  useOverlay?: boolean;
  closeOnOverlayClick?: boolean;
  /** Escape cancels the dialog. Defaults to true. */
  closeOnEscape?: boolean;
  showClose?: boolean;
  /** Receives the input's value when `input` is set, otherwise `true`. */
  onConfirm?: (value: string | true, el: ToastElement) => void;
  onCancel?: (el: ToastElement) => void;
  onResult?: (result: ConfirmResult, el: ToastElement) => void;
}

export interface ToastAction {
  /** Button label. */
  text: string;
  /** Runs on click; the toast closes afterwards. */
  onClick?: (el: ToastElement) => void;
}

export interface PromiseMessages<T = unknown> {
  loading?: string;
  /** A function receives the resolved value. */
  success?: string | ((value: T) => string);
  /** A function receives the rejection reason. */
  error?: string | ((err: unknown) => string);
}

export interface LoadingHandle {
  update(message: string, options?: ToastOptions): void;
  close(): void;
}

export interface Toast {
  (message: string, options?: ToastOptions | ConfirmOptions): ToastElement;
  success(message: string, options?: ToastOptions): ToastElement;
  error(message: string, options?: ToastOptions): ToastElement;
  warning(message: string, options?: ToastOptions): ToastElement;
  info(message: string, options?: ToastOptions): ToastElement;
  update(el: ToastElement, message: string, options?: ToastOptions): void;
  loading(message: string, options?: ToastOptions): LoadingHandle;
  /**
   * Without `input`: resolves `true` on confirm, `false` on cancel/dismiss.
   * With `input`: resolves the input's string value on confirm (possibly `''`),
   * and `null` on cancel/dismiss — so an empty submission is not read as a cancel.
   */
  confirm(message: string, options?: ConfirmOptions): Promise<ConfirmResult>;
  /** Dismiss every toast on screen; open confirm dialogs settle as a cancel. */
  dismissAll(): void;
  /**
   * Shows a loading toast that becomes the success or error message when
   * `promise` settles. Resolves with the promise's value, and re-throws its
   * rejection so the caller still handles the failure.
   */
  promise<T>(promise: Promise<T>, messages?: PromiseMessages<T>, options?: ToastOptions): Promise<T>;
  /** Options applied to every toast unless the call overrides them. */
  defaults: ToastOptions;
}

declare const toast: Toast;
export default toast;
export { toast };

declare global {
  interface Window {
    toast: Toast;
    /** Set before loading the script to skip the CDN stylesheet injection. */
    TS_TOAST_NO_CSS?: boolean;
  }
}
