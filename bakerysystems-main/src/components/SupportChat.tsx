import { useEffect, useRef, useState } from "react";
import { MessageCircle, X, Send } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { Link } from "@tanstack/react-router";
import { groqChat } from "@/lib/support-chat.functions";
import { supabase } from "@/lib/supabase";

type Msg = { role: "user" | "assistant"; content: string };

const WELCOME: Msg = {
  role: "assistant",
  content:
    "Hi! I'm the Bakery Assistant 🍞\n\nI can help you with our menu, orders, delivery info, and more. What can I help you with today?",
};

const LINK_RE = /\[([^\]]+)\]\((\/[^\s)]*)\)/g;

function renderWithLinks(text: string) {
  const parts: Array<string | { label: string; to: string }> = [];
  let last = 0;
  let m: RegExpExecArray | null;
  LINK_RE.lastIndex = 0;
  while ((m = LINK_RE.exec(text)) !== null) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    parts.push({ label: m[1], to: m[2] });
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts.map((p, i) =>
    typeof p === "string" ? (
      <span key={i}>{p}</span>
    ) : (
      <Link
        key={i}
        to={p.to}
        className="font-medium text-[#6b4423] underline underline-offset-2 hover:text-[#5a3719]"
      >
        {p.label}
      </Link>
    ),
  );
}

async function fetchMenu(): Promise<string> {
  try {
    const { data, error } = await supabase
      .from("products")
      .select("name, category, price")
      .eq("is_available", true);
    if (error || !data) return "";
    const rows = data as Array<{ name: string; category: string; price: number }>;
    if (rows.length === 0) return "";
    const byCat = new Map<string, string[]>();
    for (const r of rows) {
      const line = `- ${r.name} — ₦${(r.price / 100).toLocaleString()}`;
      const list = byCat.get(r.category) ?? [];
      list.push(line);
      byCat.set(r.category, list);
    }
    return Array.from(byCat.entries())
      .map(([cat, items]) => `${cat}:\n${items.join("\n")}`)
      .join("\n\n");
  } catch {
    return "";
  }
}

export function SupportChat() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([WELCOME]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const callGroq = useServerFn(groqChat);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading, open]);

  async function send() {
    const text = input.trim();
    if (!text || loading) return;
    const next: Msg[] = [...messages, { role: "user", content: text }];
    setMessages(next);
    setInput("");
    setLoading(true);
    try {
      const menu = await fetchMenu();
      const { reply } = await callGroq({
        data: {
          menu,
          messages: next.map((m) => ({ role: m.role, content: m.content })),
        },
      });
      setMessages((m) => [...m, { role: "assistant", content: reply }]);
    } catch (err) {
      console.error(err);
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          content: "Sorry, I'm having trouble responding right now. Please try again in a moment.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          aria-label="Open support chat"
          className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#6b4423] text-[#fdf6ec] shadow-lg transition-transform hover:scale-105 hover:bg-[#5a3719]"
        >
          <MessageCircle className="h-6 w-6" />
        </button>
      )}

      {open && (
        <div className="fixed bottom-6 right-6 z-50 flex h-[min(560px,80vh)] w-[min(380px,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-[#e7d6bf] bg-[#fdf6ec] shadow-2xl">
          <div className="flex items-center justify-between bg-[#6b4423] px-4 py-3 text-[#fdf6ec]">
            <div>
              <h3 className="text-sm font-semibold">The Bakery Support</h3>
              <p className="text-xs opacity-80">We typically reply instantly</p>
            </div>
            <button
              onClick={() => setOpen(false)}
              aria-label="Close support chat"
              className="rounded-full p-1 hover:bg-white/10"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] whitespace-pre-wrap rounded-2xl px-3 py-2 text-sm ${
                    m.role === "user"
                      ? "bg-[#6b4423] text-[#fdf6ec]"
                      : "bg-[#f1e3cc] text-[#3d2914]"
                  }`}
                >
                  {m.role === "assistant" ? renderWithLinks(m.content) : m.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="rounded-2xl bg-[#f1e3cc] px-3 py-2.5">
                  <div className="flex gap-1">
                    <span className="h-2 w-2 animate-bounce rounded-full bg-[#6b4423] [animation-delay:-0.3s]" />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-[#6b4423] [animation-delay:-0.15s]" />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-[#6b4423]" />
                  </div>
                </div>
              </div>
            )}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              send();
            }}
            className="flex gap-2 border-t border-[#e7d6bf] bg-[#fdf6ec] p-3"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 rounded-full border border-[#e7d6bf] bg-white px-4 py-2 text-sm text-[#3d2914] outline-none focus:border-[#6b4423]"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              aria-label="Send message"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-[#6b4423] text-[#fdf6ec] transition-colors hover:bg-[#5a3719] disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
