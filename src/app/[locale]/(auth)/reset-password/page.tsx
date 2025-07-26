import { AuthPageLayout } from "@/components/auth/AuthPageLayout"
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm"

export default function LoginPage() {
  return (
    <AuthPageLayout>
      <ResetPasswordForm />
    </AuthPageLayout>
  )
}