import { View, Text, Pressable } from 'react-native';
"use client";

import Link from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Badge, Button, Card, TextInput } from "@/components/ui";
import { authHeaders, getStoredUser, isAdminUser } from "@/lib/auth";

export type ResourceBoardPost = {
  id: string;
  category: string;
  title: string;
  date: string;
  summary: string;
  body: string[];
  author: string;
  views: number;
  priority?: string;
  status?: string;
  pinned?: boolean;
  tags?: string[];
  relatedHref?: string;
};

type ResourceType = "NOTICE" | "QNA" | "COUNTRY" | "VISA";

type EditorState = {
  category: string;
  title: string;
  summary: string;
  bodyText: string;
  author: string;
  priority: string;
  status: string;
  pinned: boolean;
  tagsText: string;
  relatedHref: string;
};

const emptyEditor: EditorState = {
  category: "일반",
  title: "",
  summary: "",
  bodyText: "",
  author: "CareerLens 운영",
  priority: "보통",
  status: "게시",
  pinned: false,
  tagsText: "",
  relatedHref: "/resources"
};

export function ResourceBoard({
  posts,
  apiType,
  allowQuestion = false,
  emptyMessage = "조건에 맞는 게시글이 없습니다."
}: {
  posts: ResourceBoardPost[];
  apiType?: ResourceType;
  allowQuestion?: boolean;
  emptyMessage?: string;
}) {
  const [loadedPosts, setLoadedPosts] = useState<ResourceBoardPost[]>(posts);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("전체");
  const [selectedId, setSelectedId] = useState(posts[0]?.id ?? "");
  const [isAdmin, setIsAdmin] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [editor, setEditor] = useState<EditorState>(defaultEditor(apiType));
  const [questionOpen, setQuestionOpen] = useState(false);
  const [question, setQuestion] = useState({ title: "", content: "", category: "서비스 질문", author: "", tagsText: "" });
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoadedPosts(posts);
    setSelectedId(posts[0]?.id ?? "");
  }, [posts]);

  useEffect(() => {
    setIsAdmin(isAdminUser(getStoredUser()));
  }, []);

  useEffect(() => {
    loadPosts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiType]);

  const categories = useMemo(() => ["전체", ...Array.from(new Set(loadedPosts.map((post) => post.category)))], [loadedPosts]);

  const filteredPosts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return loadedPosts.filter((post) => {
      const categoryMatched = category === "전체" || post.category === category;
      const queryMatched =
        !normalizedQuery ||
        [post.title, post.summary, post.author, post.category, ...(post.tags ?? [])]
          .join(" ")
          .toLowerCase()
          .includes(normalizedQuery);
      return categoryMatched && queryMatched;
    });
  }, [category, loadedPosts, query]);

  const selectedPost = filteredPosts.find((post) => post.id === selectedId) ?? filteredPosts[0] ?? loadedPosts[0];

  async function loadPosts() {
    if (!apiType) {
      return;
    }
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080";
    try {
      const response = await fetch(`${baseUrl}/api/resources/posts?type=${apiType}`, { cache: "no-store" });
      if (!response.ok) {
        return;
      }
      const data = (await response.json()) as ResourcePostApiResponse[];
      const nextPosts = data.map(toBoardPost);
      if (nextPosts.length > 0) {
        setLoadedPosts(nextPosts);
        setSelectedId((current) => current || nextPosts[0].id);
      }
    } catch {
      // 백엔드가 꺼져 있어도 정적 데이터 fallback으로 게시판은 계속 동작한다.
    }
  }

  function startCreate() {
    setEditingPostId(null);
    setEditor(defaultEditor(apiType));
    setEditorOpen(true);
    setMessage(null);
  }

  function startEdit(post: ResourceBoardPost) {
    setEditingPostId(post.id);
    setEditor({
      category: post.category,
      title: post.title,
      summary: post.summary,
      bodyText: post.body.join("\n\n"),
      author: post.author,
      priority: post.priority ?? "보통",
      status: post.status ?? "게시",
      pinned: Boolean(post.pinned),
      tagsText: (post.tags ?? []).join(", "),
      relatedHref: post.relatedHref ?? "/resources"
    });
    setEditorOpen(true);
    setMessage(null);
  }

  async function savePost() {
    if (!apiType || !editor.title.trim()) {
      setMessage("제목은 필수입니다.");
      return;
    }
    setLoading(true);
    setMessage(null);
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080";
    const editingNumericId = editingPostId && /^\d+$/.test(editingPostId) ? editingPostId : null;
    const endpoint = editingNumericId
      ? `${baseUrl}/api/resources/posts/${editingNumericId}`
      : `${baseUrl}/api/resources/posts`;

    try {
      const response = await fetch(endpoint, {
        method: editingNumericId ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders()
        },
        body: JSON.stringify({
          type: apiType,
          category: editor.category,
          title: editor.title,
          summary: editor.summary,
          body: splitLines(editor.bodyText || editor.summary),
          author: editor.author,
          priority: editor.priority,
          status: editor.status,
          pinned: editor.pinned,
          views: 0,
          tags: splitTags(editor.tagsText),
          related_href: editor.relatedHref,
          relatedHref: editor.relatedHref
        })
      });
      if (!response.ok) {
        throw new Error(await response.text());
      }
      setEditorOpen(false);
      await loadPosts();
      setMessage(editingNumericId ? "게시글을 수정했습니다." : "게시글을 등록했습니다.");
    } catch {
      setMessage("관리자 게시글 저장에 실패했습니다. ADMIN 계정으로 로그인했는지 확인해주세요.");
    } finally {
      setLoading(false);
    }
  }

  async function deletePost(post: ResourceBoardPost) {
    if (!/^\d+$/.test(post.id)) {
      setMessage("정적 fallback 게시글은 삭제할 수 없습니다. 백엔드 DB 게시글만 삭제됩니다.");
      return;
    }
    setLoading(true);
    setMessage(null);
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080";
    try {
      const response = await fetch(`${baseUrl}/api/resources/posts/${post.id}`, {
        method: "DELETE",
        headers: authHeaders()
      });
      if (!response.ok) {
        throw new Error(await response.text());
      }
      await loadPosts();
      setMessage("게시글을 삭제했습니다.");
    } catch {
      setMessage("게시글 삭제에 실패했습니다. ADMIN 권한을 확인해주세요.");
    } finally {
      setLoading(false);
    }
  }

  async function submitQuestion() {
    if (!question.title.trim() || !question.content.trim()) {
      setMessage("질문 제목과 내용을 입력해주세요.");
      return;
    }
    setLoading(true);
    setMessage(null);
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080";
    try {
      const response = await fetch(`${baseUrl}/api/resources/posts/qna/questions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: question.title,
          content: question.content,
          category: question.category,
          author: question.author || "익명 사용자",
          tags: splitTags(question.tagsText)
        })
      });
      if (!response.ok) {
        throw new Error(await response.text());
      }
      setQuestion({ title: "", content: "", category: "서비스 질문", author: "", tagsText: "" });
      setQuestionOpen(false);
      await loadPosts();
      setMessage("질문이 등록되었습니다. 관리자 답변 후 답변완료 상태로 전환할 수 있습니다.");
    } catch {
      setMessage("질문 등록에 실패했습니다. 백엔드 서버 실행 상태를 확인해주세요.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <View>
      <View className="flex-row flex-wrap items-center justify-between gap-3">
        <View className="flex-row flex-wrap gap-2">
          {isAdmin && apiType && (
            <Button  onPress={startCreate}>
              관리자 게시글 작성
            </Button>
          )}
          {allowQuestion && (
            <Button  variant="secondary" onPress={() => setQuestionOpen((open) => !open)}>
              질문 등록
            </Button>
          )}
        </View>
        {message && <Text className="text-sm font-semibold text-brand">{message}</Text>}
      </View>

      {questionOpen && allowQuestion && (
        <Card className="p-5">
          <View className="flex-row gap-4 md:flex-cols-2">
            <TextInput label="질문 제목" value={question.title} onChange={(event) => setQuestion({ ...question, title: event.target.value })} />
            <TextInput label="작성자" helper="선택" value={question.author} onChange={(event) => setQuestion({ ...question, author: event.target.value })} />
            <TextInput label="분류" value={question.category} onChange={(event) => setQuestion({ ...question, category: event.target.value })} />
            <TextInput label="태그" helper="쉼표로 구분" value={question.tagsText} onChange={(event) => setQuestion({ ...question, tagsText: event.target.value })} />
          </View>
          <View className="mt-4 ">
            <Text className="mb-1.5  text-sm font-medium text-slate-700">질문 내용</Text>
            <textarea
              className="min-h-28 w-full border border-line bg-white px-3 py-2 text-sm text-ink focus:border-brand"
              value={question.content}
              onChange={(event) => setQuestion({ ...question, content: event.target.value })}
            />
          </View>
          <View className="mt-4 flex-row flex-wrap gap-2">
            <Button  onPress={submitQuestion} disabled={loading}>
              질문 등록
            </Button>
            <Button  variant="subtle" onPress={() => setQuestionOpen(false)}>
              닫기
            </Button>
          </View>
        </Card>
      )}

      {editorOpen && isAdmin && (
        <Card className="p-5">
          <View className="flex-row flex-wrap items-center justify-between gap-3">
            <Text className="text-lg font-semibold text-night">{editingPostId ? "게시글 수정" : "게시글 작성"}</Text>
            <Badge tone="brand">ADMIN</Badge>
          </View>
          <View className="mt-4 flex-row gap-4 md:flex-cols-2">
            <TextInput label="분류" value={editor.category} onChange={(event) => setEditor({ ...editor, category: event.target.value })} />
            <TextInput label="제목" value={editor.title} onChange={(event) => setEditor({ ...editor, title: event.target.value })} />
            <TextInput label="요약" value={editor.summary} onChange={(event) => setEditor({ ...editor, summary: event.target.value })} />
            <TextInput label="작성자" value={editor.author} onChange={(event) => setEditor({ ...editor, author: event.target.value })} />
            <TextInput label="우선순위" value={editor.priority} onChange={(event) => setEditor({ ...editor, priority: event.target.value })} />
            <TextInput label="상태" value={editor.status} onChange={(event) => setEditor({ ...editor, status: event.target.value })} />
            <TextInput label="태그" helper="쉼표로 구분" value={editor.tagsText} onChange={(event) => setEditor({ ...editor, tagsText: event.target.value })} />
            <TextInput label="연결 화면" value={editor.relatedHref} onChange={(event) => setEditor({ ...editor, relatedHref: event.target.value })} />
          </View>
          <View className="mt-4 ">
            <Text className="mb-1.5  text-sm font-medium text-slate-700">본문</Text>
            <textarea
              className="min-h-32 w-full border border-line bg-white px-3 py-2 text-sm text-ink focus:border-brand"
              value={editor.bodyText}
              onChange={(event) => setEditor({ ...editor, bodyText: event.target.value })}
            />
          </View>
          <View className="mt-3 flex-row items-center gap-2 text-sm text-slate-600">
            <Switch value={editor.pinned} onValueChange={(val) => setEditor({ ...editor, pinned: val })} />
            상단 고정
          </View>
          <View className="mt-4 flex-row flex-wrap gap-2">
            <Button  onPress={savePost} disabled={loading}>
              저장
            </Button>
            <Button  variant="subtle" onPress={() => setEditorOpen(false)}>
              닫기
            </Button>
          </View>
        </Card>
      )}

      <View>
        <Card className="p-5">
          <View className="flex-row gap-3 lg:flex-cols-[1fr_auto]">
            <TextInput
              label="게시글 검색"
              helper="제목, 요약, 태그"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="검색어를 입력하세요"
            />
            <View>
              <Text className="mb-1.5  text-sm font-medium text-slate-700">카테고리</Text>
              <View className="flex min-h-10 flex-wrap gap-2">
                {categories.map((item) => (
                  <Pressable
                    key={item}
                    
                    onPress={() => setCategory(item)}
                    className={`border px-3 py-2 text-sm font-semibold transition ${
                      category === item ? "border-night bg-night text-white" : "border-line bg-white text-slate-600 hover:border-night"
                    }`}
                  >
                    {item}
                  </Pressable>
                ))}
              </View>
            </View>
          </View>

          <View className="mt-5 overflow-hidden border border-line">
            <View className="hidden flex-cols-[72px_110px_1fr_110px_90px] border-b border-line bg-panel px-4 py-3 text-xs font-bold text-slate-500 md:flex">
              <Text>번호</Text>
              <Text>분류</Text>
              <Text>제목</Text>
              <Text>작성일</Text>
              <Text>조회</Text>
            </View>

            {filteredPosts.length === 0 ? (
              <View className="bg-white p-8 text-center text-sm text-slate-500">{emptyMessage}</View>
            ) : (
              filteredPosts.map((post, index) => {
                const selected = selectedPost?.id === post.id;
                return (
                  <Pressable
                    key={post.id}
                    
                    onPress={() => setSelectedId(post.id)}
                    className={` w-full border-b border-line px-4 py-4 text-left last:border-b-0 ${
                      selected ? "bg-[#e8f2f1]" : "bg-white hover:bg-panel"
                    }`}
                  >
                    <View className="flex-row gap-3 md:flex-cols-[72px_110px_1fr_110px_90px] md:items-center">
                      <Text className="text-xs font-semibold text-slate-500">{post.pinned ? "공지" : String(index + 1).padStart(3, "0")}</Text>
                      <Text>
                        <Badge tone={post.pinned ? "warning" : "muted"}>{post.category}</Badge>
                      </Text>
                      <Text>
                        <Text className=" text-sm font-semibold text-night">{post.title}</Text>
                        <Text className="mt-1 line-clamp-1  text-xs text-slate-500">{post.summary}</Text>
                      </Text>
                      <Text className="text-xs font-semibold text-slate-500">{post.date}</Text>
                      <Text className="text-xs font-semibold text-slate-500">{post.views}</Text>
                    </View>
                  </Pressable>
                );
              })
            )}
          </View>
        </Card>

        <Card className="p-5 xl:sticky xl:top-24 xl:self-start">
          {selectedPost ? (
            <>
              <View className="flex-row flex-wrap items-center gap-2">
                {selectedPost.pinned && <Badge tone="warning">상단 고정</Badge>}
                <Badge tone="brand">{selectedPost.category}</Badge>
                {selectedPost.priority && <Badge tone="muted">{selectedPost.priority}</Badge>}
                {selectedPost.status && <Badge tone={selectedPost.status === "답변대기" ? "warning" : "success"}>{selectedPost.status}</Badge>}
              </View>
              <Text className="mt-4 text-xl font-semibold leading-7 text-night">{selectedPost.title}</Text>
              <View className="mt-3 flex-row gap-2 gap-2 border-y border-line py-3 text-xs text-slate-500">
                <Text>작성자: {selectedPost.author}</Text>
                <Text>작성일: {selectedPost.date}</Text>
                <Text>조회수: {selectedPost.views}</Text>
                <Text>글번호: {selectedPost.id}</Text>
              </View>
              <Text className="mt-4 text-sm leading-7 text-slate-700">{selectedPost.summary}</Text>
              <View className="mt-4 space-y-3">
                {selectedPost.body.map((paragraph) => (
                  <Text key={paragraph} className="text-sm leading-7 text-slate-700">
                    {paragraph}
                  </Text>
                ))}
              </View>
              {selectedPost.tags && (
                <View className="mt-4 flex-row flex-wrap gap-1.5">
                  {selectedPost.tags.map((tag) => (
                    <Badge key={tag} tone="muted">{tag}</Badge>
                  ))}
                </View>
              )}
              {selectedPost.relatedHref && (
                <View className="mt-5">
                  <Link
                    href={selectedPost.relatedHref}
                    className="flex-row items-center min-h-10 w-full items-center justify-center border border-line bg-white px-4 py-2 text-sm font-semibold text-night transition hover:border-night"
                  >
                    연결 화면으로 이동
                  </Link>
                </View>
              )}
              {isAdmin && (
                <View className="mt-3 flex-row gap-2 gap-2">
                  <Button  variant="secondary" onPress={() => startEdit(selectedPost)}>
                    수정
                  </Button>
                  <Button  variant="danger" onPress={() => deletePost(selectedPost)} disabled={loading}>
                    삭제
                  </Button>
                </View>
              )}
            </>
          ) : (
            <Text className="text-sm text-slate-500">{emptyMessage}</Text>
          )}
        </Card>
      </View>
    </View>
  );
}

type ResourcePostApiResponse = {
  id: number;
  type: string;
  category: string;
  title: string;
  date: string;
  summary: string;
  body: string[];
  author: string;
  views: number;
  priority?: string;
  status?: string;
  pinned?: boolean;
  tags?: string[];
  related_href?: string;
  relatedHref?: string;
};

function toBoardPost(post: ResourcePostApiResponse): ResourceBoardPost {
  return {
    id: String(post.id),
    category: post.category,
    title: post.title,
    date: post.date,
    summary: post.summary,
    body: post.body ?? [],
    author: post.author,
    views: post.views ?? 0,
    priority: post.priority,
    status: post.status,
    pinned: Boolean(post.pinned),
    tags: post.tags ?? [],
    relatedHref: post.related_href ?? post.relatedHref
  };
}

function defaultEditor(apiType?: ResourceType): EditorState {
  return {
    ...emptyEditor,
    category: apiType === "QNA" ? "서비스 질문" : "일반",
    status: apiType === "QNA" ? "답변완료" : "게시",
    relatedHref: apiType === "QNA" ? "/resources/qna" : "/resources/notices"
  };
}

function splitTags(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function splitLines(value: string) {
  return value
    .split(/\n{2,}/)
    .map((item) => item.trim())
    .filter(Boolean);
}
