"use client";

import * as React from "react";
import { NextUIProvider } from "@nextui-org/system";
import { useRouter } from "next/navigation";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { ThemeProviderProps } from "next-themes/dist/types";
import WalletProvider from "@/components/contexts/wallet/WalletProvider";
import SellerProvider from "@/components/contexts/seller/SellerProvider";

export interface ProvidersProps {
  children: React.ReactNode;
  themeProps?: ThemeProviderProps;
}

export function Providers({ children, themeProps }: ProvidersProps) {
  const router = useRouter();
  const Children = () => <>{children}</>;

  return (
    <NextUIProvider navigate={router.push}>
      <NextThemesProvider {...themeProps}>
        <WalletProvider>
          <SellerProvider>
            <Children />
          </SellerProvider>
        </WalletProvider>
      </NextThemesProvider>
    </NextUIProvider>
  );
}