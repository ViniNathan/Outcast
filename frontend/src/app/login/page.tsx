import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { AuthCard } from "@/components/auth/AuthCard";
import { authOptions } from "@/lib/auth";

export default async function LoginPage({
  searchParams,
}: {
  searchParams?:
    | Record<string, string | string[] | undefined>
    | Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await getServerSession(authOptions);
  if (session) redirect("/");

  const params = (await searchParams) ?? {};
  const error = Array.isArray(params.error) ? params.error[0] : params.error;

  return <AuthCard mode="login" error={error} />;
}

