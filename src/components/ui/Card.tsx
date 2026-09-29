import React from "react";
import { View, ViewProps } from "react-native";

export function Card({
  children,
  className = "",
  ...props
}: { children: React.ReactNode; className?: string } & ViewProps) {
  return (
    <View
      className={`rounded-2xl border border-slate-200 bg-white p-4 ${className}`}
      {...props}
    >
      {children}
    </View>
  );
}
