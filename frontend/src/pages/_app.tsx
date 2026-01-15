import { SessionProvider } from "next-auth/react";
import type { AppPropsWithSession } from "@/types/next-auth"

export default function App({
  Component,
  pageProps: { session, ...pageProps },
}: AppPropsWithSession) {
  return (
    <SessionProvider session={session}>
      <Component {...pageProps} />
    </SessionProvider>
  );
}
