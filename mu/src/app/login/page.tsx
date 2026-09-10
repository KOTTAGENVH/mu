import { Suspense } from "react";
import Loader from "@/components/loader";
import LoginContent from "@/components/login/loginContent";

export default function Page() {
  return (
    <Suspense fallback={<Loader />}>
      <LoginContent />
    </Suspense>
  );
}
