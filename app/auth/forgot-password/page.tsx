import { PageContainer } from "@/components/page-container";
import { ForgotPasswordForm } from "@/components/forgot-password-form";

export default function Page() {
  return (
    <PageContainer className="flex items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <ForgotPasswordForm />
      </div>
    </PageContainer>
  );
}
