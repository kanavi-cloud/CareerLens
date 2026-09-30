import React from "react";
import { ActivityIndicator, Pressable, Text } from "react-native";

interface ButtonProps {
  children: React.ReactNode;
  onPress?: () => void;
  variant?: "primary" | "secondary" | "outline" | "ghost";
  disabled?: boolean;
  loading?: boolean;
  className?: string;
}

export const Button = ({
  children,
  onPress,
  variant = "primary",
  disabled = false,
  loading = false,
  className = "",
}: ButtonProps) => {
  const lightText = variant === "primary" || variant === "secondary";
  const getVariantStyle = () => {
    switch (variant) {
      case "primary":
        return "bg-night text-white";
      case "secondary":
        return "bg-teal-500 text-white";
      case "outline":
        return "border border-line bg-white text-night";
      case "ghost":
        return "bg-transparent text-night";
      default:
        return "bg-night text-white";
    }
  };

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || loading, busy: loading }}
      className={`flex-row min-h-10 items-center justify-center rounded-lg px-4 py-2 transition ${
        disabled ? "opacity-60" : "active:opacity-80"
      } ${getVariantStyle()} ${className}`}
    >
      {loading ? (
        <ActivityIndicator color={lightText ? "#ffffff" : "#111827"} />
      ) : typeof children === "string" ? (
        <Text className="text-center text-sm font-semibold" style={{ color: lightText ? "#ffffff" : "#111827" }}>{children}</Text>
      ) : (
        children
      )}
    </Pressable>
  );
};

export default Button;
