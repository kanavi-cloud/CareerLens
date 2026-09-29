import { Link } from "expo-router";
import React from "react";
import { Pressable, Text } from "react-native";

export function LinkButton({
  href,
  children,
  variant = "primary",
  className = "",
}: {
  href: string;
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "subtle";
  className?: string;
}) {
  const baseStyle =
    variant === "primary" ? "bg-teal-700" : "bg-white border border-slate-200";

  return (
    <Link href={href as any} asChild>
      <Pressable
        className={`items-center justify-center rounded-full px-5 py-3 ${baseStyle} ${className}`}
      >
        <Text
          className={`text-sm font-bold ${
            variant === "primary" ? "text-white" : "text-slate-700"
          }`}
        >
          {children}
        </Text>
      </Pressable>
    </Link>
  );
}
