import { toast as sonnerToast, type ExternalToast } from "sonner"

const ERROR_DURATION = 10000

const toast = Object.assign(
  (...args: Parameters<typeof sonnerToast>) => sonnerToast(...args),
  sonnerToast
)

const originalError = sonnerToast.error
toast.error = (message: string | React.ReactNode, options?: ExternalToast) => {
  return originalError(message, { duration: ERROR_DURATION, ...options })
}

export { toast }
export type { ExternalToast }
