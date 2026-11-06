import { PageContainer } from "@/components/page-container";
import { UpdatePasswordForm } from "@/components/update-password-form";

export default function Page() {
  return (
    <PageContainer className="flex items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <UpdatePasswordForm />
      </div>
    </PageContainer>
  );
}
