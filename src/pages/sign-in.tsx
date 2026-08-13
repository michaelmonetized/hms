import { SignIn } from "@clerk/react";

export default function SignInPage() {
  return (
    <div className="flex min-h-svh items-center justify-center bg-background p-4">
      <SignIn routing="path" path="/sign-in" />
    </div>
  );
}
