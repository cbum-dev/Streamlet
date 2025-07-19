import { Alert, AlertDescription } from '@/components/ui/alert'

interface AlertMessagesProps {
  error: string | null
  success: string | null
}

export const AlertMessages = ({ error, success }: AlertMessagesProps) => {
  return (
    <>
      {error && (
        <Alert className="mb-6" variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {success && (
        <Alert className="mb-6">
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}
    </>
  )
}
