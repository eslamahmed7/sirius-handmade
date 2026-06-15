import { useState, useRef, useEffect } from 'react';
import { Sparkles, Send, X, Trash2, Loader2, Bot, Paperclip } from 'lucide-react';
import { sendMessageToSiriusAgent, type ChatMessage } from '../../lib/sirius-agent';
import { useToast } from '../ui/Toast';
import { uploadImage } from '../../lib/upload';


export default function SiriusAIChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { showToast } = useToast();
  
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploadingImage(true);
    try {
      const urls: string[] = [];
      for (const file of Array.from(files)) {
        const url = await uploadImage(file);
        if (url) urls.push(url);
      }
      if (urls.length > 0) {
        setUploadedImages(prev => [...prev, ...urls]);
        showToast('تم رفع الصور بنجاح للإرفاق');
      }
    } catch {
      showToast('فشل رفع الصور المحددة', 'error');
    } finally {
      setUploadingImage(false);
    }
  };

  const removeUploadedImage = (urlToRemove: string) => {
    setUploadedImages(prev => prev.filter(url => url !== urlToRemove));
  };


  const suggestions = [
    'عرض إحصائيات المتجر الكلية',
    'جلب قائمة الأقسام/الفئات',
    'أضف قسم جديد باسم "ديكور ريزين"',
    'ابحث عن المنتجات المتاحة'
  ];

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSend = async (textToSend: string) => {
    if ((!textToSend.trim() && uploadedImages.length === 0) || loading) return;

    let userText = textToSend;
    if (uploadedImages.length > 0) {
      userText += `\n[روابط الصور المرفقة: ${uploadedImages.join(', ')}]`;
    }

    setInputText('');
    setUploadedImages([]);
    setLoading(true);

    // Append user message instantly to local state for fast UI feedback
    const formattedUserMsg: ChatMessage = {
      role: 'user',
      parts: [{ text: textToSend }]
    };
    setMessages(prev => [...prev, formattedUserMsg]);

    try {
      // Send to agent and get back the updated history and the text response
      const result = await sendMessageToSiriusAgent(messages, userText);
      setMessages(result.history);
    } catch (err: any) {
      console.error(err);
      showToast(err.message || 'حدث خطأ أثناء الاتصال بالمساعد الذكي', 'error');
      // Append error message to chat
      setMessages(prev => [
        ...prev,
        {
          role: 'model',
          parts: [{ text: `⚠️ عذراً، حدث خطأ أثناء تنفيذ الطلب: ${err.message}` }]
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const clearChat = () => {
    if (confirm('هل تريد مسح سجل المحادثة؟')) {
      setMessages([]);
      showToast('تم مسح سجل المحادثة');
    }
  };

  return (
    <div className="fixed bottom-6 left-6 z-50 print:hidden font-sans">
      {/* Floating Action Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="w-16 h-16 rounded-full flex items-center justify-center shadow-2xl hover:scale-110 active:scale-95 transition-all duration-300 relative group animate-bounce border-2 border-primary-500 overflow-hidden"
          style={{ animationDuration: '3s' }}
        >
          <img src="/female_robot_full_body.png" alt="AI Assistant" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
          <span className="absolute -top-1 -right-1 flex h-4 w-4 z-10">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-primary-500 border-2 border-white dark:border-gray-900"></span>
          </span>
          {/* Tooltip */}
          <span className="absolute right-16 bg-gray-900 text-white text-xs font-semibold px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-md pointer-events-none">
            مساعد الذكاء الاصطناعي Sirius AI ✨
          </span>
        </button>
      )}

      {/* Chat Window Container */}
      {isOpen && (
        <div className="w-[380px] sm:w-[420px] h-[550px] bg-white/95 dark:bg-darkbg-card/95 backdrop-blur-md border border-gray-200 dark:border-darkbg-lighter rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 duration-300">
          
          {/* Header */}
          <div className="p-4 bg-primary-600 text-white flex items-center justify-between shadow-md">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center overflow-hidden border border-white/20 shadow-sm relative group">
                <img src="/bot_avatar_with_logo.png" alt="Bot Avatar" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
              </div>
              <div>
                <h3 className="font-bold text-sm leading-none">Sirius AI</h3>
                <span className="text-[10px] text-primary-100 mt-1 block">مساعد الإدارة الذكي نشط حالياً</span>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              {messages.length > 0 && (
                <button
                  onClick={clearChat}
                  title="مسح المحادثة"
                  className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-white"
                >
                  <Trash2 size={16} />
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-white"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Chat Messages Area */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-gray-50/50 dark:bg-darkbg/30">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center px-4 space-y-6">
                <div className="w-20 h-20 rounded-2xl flex items-center justify-center overflow-hidden shadow-md border border-gray-100 dark:border-gray-800">
                  <img src="/bot_avatar_with_logo.png" alt="Bot Avatar" className="w-full h-full object-cover" />
                </div>
                <div className="space-y-2">
                  <h4 className="font-bold text-gray-900 dark:text-white text-base">مرحباً بك في Sirius AI! 👋</h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400 max-w-[280px]">
                    أنا مساعدك الذكي في لوحة الإدارة. يمكنك أن تطلب مني إنشاء أقسام، إضافة منتجات، أو البحث وعرض الإحصائيات مباشرة.
                  </p>
                </div>
                {/* Suggestions list */}
                <div className="w-full space-y-2 text-right">
                  <p className="text-xs font-semibold text-gray-400 pr-1 mb-2">جرب أن تطلب مني:</p>
                  {suggestions.map((s, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSend(s)}
                      className="w-full text-right text-xs bg-white dark:bg-darkbg-lighter hover:bg-primary-50 dark:hover:bg-primary-900/10 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 p-2.5 rounded-xl transition-all shadow-sm truncate hover:border-primary-500 block"
                    >
                      💡 {s}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((msg, index) => {
                  // Render only text parts for user/model messages
                  const textContent = msg.parts?.[0]?.text;
                  const isUser = msg.role === 'user';

                  // Don't render internal functionCalls / functionResponses to the user
                  if (!textContent) return null;

                  return (
                    <div
                      key={index}
                      className={`flex ${isUser ? 'justify-start' : 'justify-end'} animate-in fade-in duration-200`}
                    >
                      <div className="flex items-start gap-2.5 max-w-[85%]">
                        {!isUser && (
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 overflow-hidden shadow-sm border border-gray-100 dark:border-gray-800">
                            <img src="/bot_avatar_with_logo.png" alt="Bot" className="w-full h-full object-cover" />
                          </div>
                        )}
                        <div
                          className={`p-3 rounded-2xl text-sm shadow-sm whitespace-pre-wrap leading-relaxed ${
                            isUser
                              ? 'bg-primary-600 text-white rounded-tr-none'
                              : 'bg-white dark:bg-darkbg-lighter text-gray-800 dark:text-gray-200 border border-gray-200/50 dark:border-gray-700/50 rounded-tl-none'
                          }`}
                        >
                          {textContent}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Loading typing indicator */}
                {loading && (
                  <div className="flex justify-end animate-pulse">
                    <div className="flex items-start gap-2.5 max-w-[85%]">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 overflow-hidden shadow-sm border border-gray-100 dark:border-gray-800 relative">
                        <img src="/bot_avatar_with_logo.png" alt="Bot" className="w-full h-full object-cover opacity-50" />
                        <Loader2 size={16} className="animate-spin absolute text-primary-600 dark:text-primary-400" />
                      </div>
                      <div className="p-3 bg-white dark:bg-darkbg-lighter text-gray-500 dark:text-gray-400 border border-gray-200/50 dark:border-gray-700/50 rounded-2xl rounded-tl-none text-xs flex items-center gap-2">
                        <span>جاري معالجة الطلب وتحديث البيانات...</span>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Action Suggestions Bar (Only when chat is active) */}
          {messages.length > 0 && (
            <div className="p-2 border-t border-gray-200/50 dark:border-gray-700/50 overflow-x-auto flex gap-2 scrollbar-none whitespace-nowrap bg-gray-50/20">
              {suggestions.map((s, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(s)}
                  className="px-3 py-1.5 bg-white dark:bg-darkbg-lighter hover:bg-primary-50 dark:hover:bg-primary-900/10 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 rounded-full text-xs transition-all shadow-sm"
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Uploaded Images Preview */}
          {(uploadedImages.length > 0 || uploadingImage) && (
            <div className="px-4 py-2.5 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-darkbg/20 flex gap-2 overflow-x-auto items-center">
              {uploadedImages.map((url, idx) => (
                <div key={idx} className="relative w-14 h-14 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden flex-shrink-0 group shadow-sm">
                  <img src={url} alt="Attached preview" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeUploadedImage(url)}
                    className="absolute top-0 right-0 bg-red-500 hover:bg-red-600 text-white rounded-bl-xl p-1 transition-colors"
                  >
                    <X size={10} />
                  </button>
                </div>
              ))}
              {uploadingImage && (
                <div className="w-14 h-14 rounded-xl border border-dashed border-primary-400 flex flex-col items-center justify-center bg-primary-50/30 dark:bg-primary-950/10 flex-shrink-0 animate-pulse">
                  <Loader2 size={16} className="animate-spin text-primary-500" />
                </div>
              )}
            </div>
          )}

          {/* Input Form Bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend(inputText);
            }}
            className="p-4 border-t border-gray-200 dark:border-darkbg-lighter bg-white dark:bg-darkbg-card flex gap-2 items-center"
          >
            <label className="w-10 h-10 border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600 text-gray-500 dark:text-gray-400 rounded-xl flex items-center justify-center cursor-pointer transition-all flex-shrink-0 shadow-sm">
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageUpload}
                disabled={loading || uploadingImage}
                className="hidden"
              />
              {uploadingImage ? (
                <Loader2 size={18} className="animate-spin text-primary-500" />
              ) : (
                <Paperclip size={18} />
              )}
            </label>

            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="اكتب رسالة أو اطلب تنفيذ مهمة..."
              disabled={loading}
              className="flex-1 px-4 py-2.5 border border-gray-200 dark:border-darkbg-lighter rounded-xl bg-gray-50 dark:bg-darkbg/50 text-gray-900 dark:text-white text-sm outline-none focus:border-primary-500 transition-colors disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={loading || (!inputText.trim() && uploadedImages.length === 0)}
              className="w-10 h-10 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-200 dark:disabled:bg-gray-700 disabled:text-gray-400 text-white rounded-xl flex items-center justify-center transition-colors flex-shrink-0"
            >
              <Send size={18} className="transform rotate-180" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
