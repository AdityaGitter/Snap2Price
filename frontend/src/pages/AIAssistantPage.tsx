import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Bot, Send, Sparkles, ShoppingBag, ArrowRight, User, RefreshCw,
  Lightbulb, Zap, HelpCircle
} from 'lucide-react';
import { api } from '../services/api';
import { Product } from '../types';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  suggestedProducts?: Product[];
  quickActions?: string[];
}

export const AIAssistantPage: React.FC = () => {
  const { addToCart } = useCart();
  const { success } = useToast();

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'init',
      role: 'assistant',
      content:
        "Welcome to the dedicated ShopSmart AI Concierge workspace! I am 'Smarty', connected directly to our Google Gemini API backend. I have real-time access to our entire 48-product catalog. You can ask me to compare laptops, find gifts under a specific budget, explain audio specs, or recommend deals. How can I help you?",
      quickActions: [
        'Recommend laptops for software development',
        'Find top wireless headphones with active noise cancellation',
        'Show me products under ₹5,000',
        'Compare Apple MacBook Air M3 and Dell XPS 14',
      ],
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (customText?: string) => {
    const text = (customText || input).trim();
    if (!text || loading) return;

    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const history = messages.map((m) => ({ role: m.role, content: m.content }));
      const response = await api.chatAssistant(text, history);

      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.reply,
        suggestedProducts: response.suggested_products,
        quickActions: response.quick_actions,
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: 'I experienced a brief connection interruption. Please try rephrasing your question or check the catalog page!',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Smarty AI Shopping Assistant
            </h1>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-purple-600 text-white">
              Google Gemini
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Grounded LLM agent with direct access to catalog specifications, pricing, and stock
          </p>
        </div>

        <button
          onClick={() => {
            setMessages([
              {
                id: Date.now().toString(),
                role: 'assistant',
                content: "Chat session refreshed! What product or comparison would you like to explore?",
                quickActions: [
                  'Show me student laptops under ₹50,000',
                  'Best noise-canceling headphones',
                  'What active discount coupons exist?',
                ],
              },
            ]);
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition w-fit"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Reset Conversation</span>
        </button>
      </div>

      {/* Main Chat Area */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* Left Side Tips & Suggestions */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-800">
              <Lightbulb className="w-4 h-4 text-amber-500" />
              <span>Prompt Ideas</span>
            </div>
            <div className="space-y-1.5 text-xs">
              {[
                'Find laptops under ₹50,000',
                'Compare Sony XM5 & AirPods Pro 2',
                'What is the best smartwatch for battery?',
                'Are there any coupons active right now?',
                'Suggest workout gear and dumbbells',
              ].map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(p)}
                  className="w-full text-left p-2 rounded-xl text-slate-600 hover:bg-purple-50 hover:text-purple-700 transition"
                >
                  "{p}"
                </button>
              ))}
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-indigo-50 p-5 rounded-3xl border border-purple-200 shadow-xs space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-purple-900">
              <Zap className="w-4 h-4 text-purple-600" />
              <span>Architecture Note</span>
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Grounding prompt injects live SQL catalog inventory into Gemini 3.8 Flash context, ensuring recommendations only reference actual products.
            </p>
          </div>
        </div>

        {/* Right Chat Stream */}
        <div className="lg:col-span-3 bg-white rounded-3xl border border-slate-200/80 shadow-sm flex flex-col h-[650px] overflow-hidden">
          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-5 bg-slate-50/50">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`flex gap-3 max-w-[85%] ${
                    m.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold ${
                      m.role === 'user'
                        ? 'bg-purple-600 text-white'
                        : 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                    }`}
                  >
                    {m.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                  </div>

                  <div
                    className={`p-4 rounded-2xl text-sm leading-relaxed ${
                      m.role === 'user'
                        ? 'bg-purple-600 text-white rounded-tr-xs shadow-md shadow-purple-500/10'
                        : 'bg-white text-slate-800 rounded-tl-xs shadow-sm border border-slate-200'
                    }`}
                  >
                    <p className="whitespace-pre-line">{m.content}</p>
                  </div>
                </div>

                {/* Suggested Products Grid */}
                {m.suggestedProducts && m.suggestedProducts.length > 0 && (
                  <div className="mt-3 ml-11 w-full max-w-[85%] space-y-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Recommended From Catalog:
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {m.suggestedProducts.map((p) => (
                        <div
                          key={p.id}
                          className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3 hover:border-purple-300 transition"
                        >
                          <img
                            src={p.image_url}
                            alt={p.name}
                            className="w-14 h-14 rounded-xl object-cover bg-slate-100 flex-shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <Link
                              to={`/products/${p.slug || p.id}`}
                              className="font-bold text-xs text-slate-900 truncate hover:text-purple-600 block"
                            >
                              {p.name}
                            </Link>
                            <span className="text-xs font-extrabold text-slate-900 block mt-0.5">
                              ₹{p.price.toLocaleString('en-IN')}
                            </span>
                            <span className="text-[10px] text-amber-500 font-bold">★ {p.rating}</span>
                          </div>
                          <button
                            onClick={() => {
                              addToCart(p, 1);
                              success(`Added "${p.name}" to cart!`);
                            }}
                            className="p-2 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-xl transition"
                            title="Add to cart"
                          >
                            <ShoppingBag className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Quick actions chips */}
                {m.quickActions && m.quickActions.length > 0 && (
                  <div className="mt-2.5 ml-11 flex flex-wrap gap-1.5">
                    {m.quickActions.map((qa, i) => (
                      <button
                        key={i}
                        onClick={() => handleSend(qa)}
                        className="text-xs font-medium bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200/80 px-3 py-1 rounded-full transition"
                      >
                        {qa}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex items-center gap-2 text-slate-400 text-xs ml-11">
                <div className="w-2 h-2 rounded-full bg-purple-600 animate-bounce"></div>
                <div className="w-2 h-2 rounded-full bg-indigo-600 animate-bounce [animation-delay:-0.15s]"></div>
                <div className="w-2 h-2 rounded-full bg-blue-600 animate-bounce [animation-delay:-0.3s]"></div>
                <span className="text-purple-600 font-medium">Gemini 3.8 Flash analyzing catalog...</span>
              </div>
            )}

            <div ref={endRef} />
          </div>

          {/* Input Box */}
          <div className="p-4 border-t border-slate-200 bg-white">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex items-center gap-3"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about products, compare models, look up discounts..."
                className="flex-1 bg-slate-100 focus:bg-white text-slate-800 text-sm px-5 py-3 rounded-full border border-slate-200 focus:border-purple-600 outline-none transition"
                disabled={loading}
              />
              <button
                type="submit"
                disabled={!input.trim() || loading}
                className="px-6 py-3 rounded-full bg-purple-600 hover:bg-purple-700 disabled:opacity-40 text-white font-bold text-xs shadow-md shadow-purple-500/20 active:scale-98 transition flex items-center gap-1.5 flex-shrink-0"
              >
                <span>Send</span>
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
