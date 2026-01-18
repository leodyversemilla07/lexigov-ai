import * as React from "react"
import { cn } from "../../lib/utils"

type ToastProps = {
  id?: string
  title?: string
  description?: string
  variant?: "default" | "destructive"
  duration?: number
  action?: {
    label: string
    onClick: () => void
  }
}

type ToasterToast = ToastProps & {
  promise?: Promise<any>
}

type ToasterContextType = {
  toasts: ToasterToast[]
  addToast: (toast: ToastProps) => void
  removeToast: (id: string) => void
}

const ToasterContext = React.createContext<ToasterContextType>({
  toasts: [],
  addToast: () => {},
  removeToast: () => {},
})

export const ToasterProvider = ({ children }: { children: React.ReactNode }) => {
  const [toasts, setToasts] = React.useState<ToasterToast[]>([])
  const toastCount = React.useRef(0)

  const addToast = React.useCallback((toast: ToastProps) => {
    const id = toast.id || `toast-${toastCount.current++}`
    const newToast: ToasterToast = {
      ...toast,
      id,
    }
    setToasts((prev) => [...prev, newToast])

    // Auto dismiss after duration
    if (toast.duration !== 0) {
      setTimeout(() => {
        removeToast(id)
      }, toast.duration || 3000)
    }
  }, [])

  const removeToast = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }, [])

  return (
    <ToasterContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
    </ToasterContext.Provider>
  )
}

const Toast = ({ toast }: { toast: ToasterToast }) => {
  const { removeToast } = React.useContext(ToasterContext)

  return (
    <div
      className={cn(
        "flex flex-col space-y-2 w-full max-w-sm pointer-events-auto relative rounded-lg border bg-white p-6 shadow-lg ring-1 ring-black/5 transition-all data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[swipe=move]:transition-none data-[swipe=cancel]:transition-[transform,opacity] data-[swipe=end]:transition-none",
        toast.variant === "destructive" && "border-red-500 bg-red-50"
      )}
    >
      <div className="flex gap-3">
        <div className="flex-1 space-y-1">
          {toast.title && (
            <div className="text-sm font-semibold">{toast.title}</div>
          )}
          {toast.description && (
            <div className="text-sm opacity-90">{toast.description}</div>
          )}
          {toast.action && (
            <button
              onClick={toast.action.onClick}
              className="mt-2 text-sm font-medium text-blue-600 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              {toast.action.label}
            </button>
          )}
        </div>
        <button
          onClick={() => removeToast(toast.id!)}
          className="rounded-md p-1 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <svg
            className="h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
    </div>
  )
}

export const Toaster = () => {
  const { toasts } = React.useContext(ToasterContext)

  return (
    <div className="fixed bottom-0 right-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px]">
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} />
      ))}
    </div>
  )
}

export const useToast = () => {
  const { addToast } = React.useContext(ToasterContext)

  const toast = React.useCallback(
    (props: ToastProps) => {
      addToast(props)
    },
    [addToast]
  )

  return {
    toast,
    success: (message: string) =>
      toast({
        title: "Success",
        description: message,
        variant: "default",
      }),
    error: (message: string) =>
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      }),
  }
}
