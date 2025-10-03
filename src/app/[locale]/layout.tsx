import { NextIntlClientProvider } from "next-intl";
import { ThemeProvider } from "@/components/ThemeProvider";
import ReduxProvider from "@/store/Provider";
import { Toaster } from "@/components/ui/sonner";
import LocaleUpdater from "@/components/LocaleUpdater";
import React from "react";

export default async function LocaleLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  let locale = (await params).locale;
  const supportedLocales = ["en", "ar"];

  if (!locale || !supportedLocales.includes(locale)) locale = "en";

  let messages;
  try {
    messages = (await import(`@/messages/${locale}.json`)).default;
  } catch (error) {
    console.log(error);
    messages = (await import(`@/messages/en.json`)).default;
  }

  // Set html attributes using script
  const htmlScript = `
    document.documentElement.lang = '${locale}';
    document.documentElement.dir = '${locale === "ar" ? "rtl" : "ltr"}';
  `;

  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: htmlScript }} />
      <NextIntlClientProvider
        key={locale}
        locale={locale}
        messages={messages}
      >
        <LocaleUpdater />
        <ReduxProvider>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            {children}
            <Toaster />
          </ThemeProvider>
        </ReduxProvider>
      </NextIntlClientProvider>
    </>
  );
}
