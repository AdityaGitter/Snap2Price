import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Bot, Send, X, Sparkles, ShoppingBag, ArrowRight, User } from 'lucide-react';
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

export const AIChatDrawer: React.FC<{ isOpen: boolean; onClose: () => void }> = ({
  isOpen,
  onClose,
}) => {
  const { addToCart } = useCart();
  const { success } = useToast();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content:
        "Hello! I am 'Smarty', your ShopSmart AI Concierge powered by Google Gemini. I can help you discover products, compare specs, check coupon deals, or explain tech features. What can I find for you today?",
      quickActions: [
        'Best laptops for students under ₹50,000',
        'Top noise-canceling headphones',
        'What coupons can I use?',
        'Flagship phones with great cameras',
      ],
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputValue).trim();
    if (!text || loading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputValue('');
    setLoading(true);

    try {
      const history = messages.map((m) => ({ role: m.role, content: m.content }));
      const response = await api.chatAssistant(text, history);

      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.reply,
        suggestedProducts: response.suggested_products,
        quickActions: response.quick_actions,
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      console.error('Chat error', err);
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content:
            "I'm having a slight network connection hiccup, but you can browse our top categories above or ask about specific brands like Apple, Sony, Dell, or Samsung!",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-xs transition-opacity animate-in fade-in">
      <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col border-l border-slate-200">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 bg-gradient-to-r from-purple-700 via-indigo-700 to-purple-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-inner">
              <Bot className="w-6 h-6 text-yellow-300" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-bold text-base tracking-tight">Smarty AI Assistant</h3>
                <span className="bg-yellow-400 text-slate-900 text-[10px] font-black px-1.5 py-0.2 rounded uppercase">
                  Gemini
                </span>
              </div>
              <p className="text-xs text-purple-200 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                Online & Catalog Grounded
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/10 text-white/80 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Message Stream */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`flex gap-2 max-w-[88%] ${
                  m.role === 'user'
                    ? 'flex-row-reverse'
                    : 'flex-row'
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold ${
                    m.role === 'user'
                      ? 'bg-purple-600 text-white'
                      : 'bg-indigo-100 text-indigo-700 border border-indigo-200'
                  }`}
                >
                  {m.role === 'user' ? <User className="w-4 h-4" /> : <Sparkles className="w-4 h-4 text-purple-600" />}
                </div>

                <div
                  className={`p-3.5 rounded-2xl text-sm leading-relaxed ${
                    m.role === 'user'
                      ? 'bg-purple-600 text-white rounded-tr-xs shadow-md shadow-purple-500/10'
                      : 'bg-white text-slate-800 rounded-tl-xs shadow-sm border border-slate-200/80'
                  }`}
                >
                  <p className="whitespace-pre-line">{m.content}</p>
                </div>
              </div>

              {/* Recommended Product Chips */}
              {m.suggestedProducts && m.suggestedProducts.length > 0 && (
                <div className="mt-3 ml-9 w-full max-w-[85%] space-y-2">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    Catalog Suggestions:
                  </span>
                  <div className="flex flex-col gap-2">
                    {m.suggestedProducts.map((p) => (
                      <div
                        key={p.id}
                        className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3 hover:border-purple-300 transition"
                      >
                        <img
                          src={p.image_url}
                          alt={p.name}
                          className="w-12 h-12 rounded-lg object-cover bg-slate-100 flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <Link
                            to={`/products/${p.slug || p.id}`}
                            onClick={onClose}
                            className="font-medium text-xs text-slate-900 truncate hover:text-purple-600 block"
                          >
                            {p.name}
                          </Link>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs font-extrabold text-slate-900">
                              ₹{p.price.toLocaleString('en-IN')}
                            </span>
                            <span className="text-[10px] text-amber-500 font-bold">★ {p.rating}</span>
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            addToCart(p, 1);
                            success(`Added "${p.name}" to cart!`);
                          }}
                          className="p-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg transition"
                          title="Quick add to cart"
                        >
                          <ShoppingBag className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Quick Prompt Chips */}
              {m.quickActions && m.quickActions.length > 0 && (
                <div className="mt-2.5 ml-9 flex flex-wrap gap-1.5">
                  {m.quickActions.map((qa, i) => (
                    <button
                      key={i}
                      onClick={() => handleSendMessage(qa)}
                      className="text-xs font-medium bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200/60 px-3 py-1 rounded-full transition"
                    >
                      {qa}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-2 text-slate-400 text-xs ml-9">
              <div className="w-2 h-2 rounded-full bg-purple-600 animate-bounce"></div>
              <div className="w-2 h-2 rounded-full bg-indigo-600 animate-bounce [animation-delay:-0.15s]"></div>
              <div className="w-2 h-2 rounded-full bg-blue-600 animate-bounce [animation-delay:-0.3s]"></div>
              <span className="text-purple-600 font-medium">Gemini thinking...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-3 border-t border-slate-200 bg-white">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ask about products, deals, specs..."
              className="flex-1 bg-slate-100 focus:bg-white text-slate-800 text-sm px-4 py-2.5 rounded-full border border-slate-200 focus:border-purple-500 outline-none transition"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={!inputValue.trim() || loading}
              className="w-10 h-10 rounded-full bg-purple-600 hover:bg-purple-700 disabled:opacity-40 text-white flex items-center justify-center transition shadow-md shadow-purple-500/20"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
          <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2 px-2">
            <span>Powered by Gemini 3.8 Flash</span>
            <Link to="/assistant" onClick={onClose} className="hover:text-purple-600 flex items-center gap-0.5 font-medium">
              Full Screen Assistant <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
