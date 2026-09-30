import {
  getStoredUser,
  isAdminUser,
  loadStoredUserAsync,
  logout,
  type AuthUser,
} from "@/lib/auth";
import { mainMenus, type MenuChild } from "@/lib/menu";
import { Link, usePathname, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

export function SiteHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(getStoredUser());
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;
    loadStoredUserAsync().then((storedUser) => {
      if (isMounted) {
        setUser(storedUser);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  const isAdmin = isAdminUser(user);
  const visibleMenus = mainMenus.map((menu) => ({
    ...menu,
    children: filterVisibleChildren(menu.children || [], isAdmin),
  }));

  async function handleLogout() {
    await logout();
    setUser(null);
    setMenuOpen(false);
    router.replace("/login");
  }

  return (
    <View className="z-50 border-b border-white/10 bg-slate-900">
      <View className="flex-row items-center justify-between gap-3 px-4 py-3">
        <Link href="/" asChild>
          <Pressable className="min-w-0 flex-1 flex-row items-center gap-2.5">
            <View className="h-9 w-9 items-center justify-center border border-white/30 bg-white">
              <Text className="text-sm font-black text-slate-900">CL</Text>
            </View>
            <View className="min-w-0 flex-1">
              <Text className="text-base font-bold text-white" numberOfLines={1}>
                CareerLens
              </Text>
              <Text className="text-[10px] text-slate-300" numberOfLines={1}>
                Overseas Career
              </Text>
            </View>
          </Pressable>
        </Link>

        <View className="flex-row items-center gap-2">
          {user ? (
            <Pressable
              onPress={handleLogout}
              accessibilityRole="button"
              accessibilityLabel="로그아웃"
              className="min-h-[36px] items-center justify-center rounded border border-white/30 px-3 py-1.5"
            >
              <Text className="text-xs font-bold text-white">로그아웃</Text>
            </Pressable>
          ) : (
            <Link href="/login" asChild>
              <Pressable className="min-h-[36px] items-center justify-center border border-white/25 bg-white px-3 py-1.5">
                <Text className="text-xs font-bold text-slate-900">로그인</Text>
              </Pressable>
            </Link>
          )}

          <Pressable
            onPress={() => setMenuOpen((open) => !open)}
            accessibilityRole="button"
            accessibilityLabel="메뉴 열기"
            className="h-9 w-9 items-center justify-center rounded-md border border-white/25"
          >
            <Text className="text-lg font-black text-white">
              {menuOpen ? "✕" : "☰"}
            </Text>
          </Pressable>
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="border-t border-white/10"
        contentContainerStyle={{
          paddingHorizontal: 12,
          paddingVertical: 8,
          gap: 8,
          alignItems: "center",
        }}
      >
        {visibleMenus.map((menu) => {
          const active = isActive(
            pathname,
            menu.href,
            flattenHrefs(menu.children || [])
          );
          return (
            <Link key={menu.title} href={menu.href as any} asChild>
              <Pressable
                className={`min-h-[34px] flex-row items-center rounded-full px-3.5 ${
                  active ? "bg-white" : "bg-white/10"
                }`}
              >
                <Text
                  className={`text-xs font-bold ${
                    active ? "text-slate-900" : "text-slate-100"
                  }`}
                >
                  {menu.title}
                </Text>
              </Pressable>
            </Link>
          );
        })}
      </ScrollView>

      {menuOpen ? (
        <View className="border-t border-white/10 bg-slate-950 px-4 py-3">
          {visibleMenus.map((menu) => (
            <View key={menu.title} className="mb-3">
              <Link href={menu.href as any} asChild>
                <Pressable className="py-2">
                  <Text className="text-sm font-black text-white">
                    {menu.title}
                  </Text>
                </Pressable>
              </Link>
              {menu.children?.map((child) => (
                <Link key={child.href} href={child.href as any} asChild>
                  <Pressable className="py-1.5 pl-3">
                    <Text className="text-sm text-slate-300">{child.title}</Text>
                  </Pressable>
                </Link>
              ))}
            </View>
          ))}

          {user ? (
            <Pressable
              onPress={handleLogout}
              className="mt-1 min-h-[44px] items-center justify-center rounded-xl bg-white"
            >
              <Text className="text-sm font-bold text-slate-900">로그아웃</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

export function PageKicker({ children }: { children: React.ReactNode }) {
  return (
    <Text className="text-xs font-bold uppercase tracking-wider text-brand">
      {children}
    </Text>
  );
}

function isActive(pathname: string, href: string, childHrefs: string[]) {
  if (pathname.startsWith("/jobs/recommendation")) {
    return (
      href === "/jobs/recommendation" ||
      childHrefs.includes("/jobs/recommendation")
    );
  }
  if (pathname === href) {
    return true;
  }
  if (
    childHrefs.some(
      (childHref) =>
        pathname === childHref ||
        (childHref !== "/" && pathname.startsWith(`${childHref}/`))
    )
  ) {
    return true;
  }
  return href !== "/" && href !== "/jobs" && pathname.startsWith(`${href}/`);
}

function filterVisibleChildren(
  children: MenuChild[],
  isAdmin: boolean
): MenuChild[] {
  return (children || [])
    .filter((child) => !child.adminOnly || isAdmin)
    .map((child) => ({
      ...child,
      children: child.children
        ? filterVisibleChildren(child.children, isAdmin)
        : undefined,
    }));
}

function flattenHrefs(children: MenuChild[]): string[] {
  return (children || []).flatMap((child) => [
    child.href,
    ...(child.children ? flattenHrefs(child.children) : []),
  ]);
}
