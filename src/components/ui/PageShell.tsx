import React from "react";
import { ScrollView, View, ViewProps } from "react-native";

export function PageShell({
  children,
  className = "",
  scroll = true,
  ...props
}: {
  children: React.ReactNode;
  className?: string;
  /** false면 스크롤 없이 flex 컨테이너만 사용 (리스트/고정 레이아웃용) */
  scroll?: boolean;
} & ViewProps) {
  const items = React.Children.toArray(children);

  if (!scroll) {
    return (
      <View className={`flex-1 bg-[#f8faf9] ${className}`} {...props}>
        {children}
      </View>
    );
  }

  return (
    <View className={`flex-1 bg-[#f8faf9] ${className}`} {...props}>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 48 }}
        stickyHeaderIndices={items.length > 1 ? [0] : undefined}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        bounces
      >
        {children}
      </ScrollView>
    </View>
  );
}
