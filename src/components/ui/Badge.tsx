import { type ReactNode } from "react";
import { Text, View } from "react-native";
import { badgeClass } from "./style-helpers";
import type { Tone } from "./types";

export function Badge({
  children,
  tone = "default",
  className = "",
}: {
  children: ReactNode;
  tone?: Tone;
  className?: string;
}) {
  return (
    <View
      className={`self-start rounded border px-2.5 py-1 ${badgeClass(
        tone
      )} ${className}`}
    >
      <Text className="text-xs font-semibold">{children}</Text>
    </View>
  );
}

export function StatusPill({
  children,
  tone = "muted",
}: {
  children: ReactNode;
  tone?: Tone;
}) {
  return <Badge tone={tone}>{children}</Badge>;
}
