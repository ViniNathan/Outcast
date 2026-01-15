import type { AppProps } from "next/app";
import { SessionProvider } from "next-auth/react";
import type { Session } from "next-auth";

type AppPropsWithSession = AppProps<{
  session: Session | null;
}>;

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
