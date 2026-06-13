const apiKey = 'AIzaSyDrUrUMSG_PIsqbghYF7fAiUY6e0xD10xc';

async function callGemini(prompt: string): Promise<string> {
  if (!apiKey) {
    throw new Error('مفتاح API الخاص بـ Gemini غير مهيأ في ملف البيئة VITE_GEMINI_API_KEY');
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': apiKey,
    },
    body: JSON.stringify({
      contents: [{
        parts: [{
          text: prompt
        }]
      }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 1024,
      }
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const message = errorData.error?.message || `خطأ من خادم Google (كود ${response.status})`;
    
    if (response.status === 401) {
      throw new Error('مفتاح الـ API غير صالح أو مقيد من Google (حدث خطأ 401). يرجى التأكد من استخدام مفتاح AIzaSy قياسي صالح.');
    }
    throw new Error(message);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error('لم يتم إرجاع محتوى من الذكاء الاصطناعي');
  }

  return text.trim();
}

export async function generateProductDescription(productName: string, categoryName: string, tags: string, language: 'ar' | 'en'): Promise<string> {
  const prompt = language === 'ar'
    ? `اكتب وصفاً جذاباً واحترافياً لمنتج باللغة العربية لمتجر إلكتروني. اسم المنتج: "${productName}". الفئة: "${categoryName}". الوسوم: "${tags}". اكتب الوصف مباشرة بطريقة تسويقية ممتازة ومختصرة دون أي مقدمات أو هوامش.`
    : `Write a compelling and professional product description in English for an e-commerce store. Product Name: "${productName}". Category: "${categoryName}". Tags: "${tags}". Write only the description directly without any introduction or formatting like 'Here is the description'.`;

  return callGemini(prompt);
}

export async function translateText(text: string, toLanguage: 'ar' | 'en'): Promise<string> {
  if (!text.trim()) return '';
  const prompt = toLanguage === 'ar'
    ? `ترجم النص التالي إلى اللغة العربية بدقة واحترافية وبطريقة تسويقية جذابة لمتجر إلكتروني. النص: "${text}". اكتب الترجمة مباشرة دون مقدمات أو هوامش.`
    : `Translate the following text to English accurately and professionally for an e-commerce store. Text: "${text}". Write only the translation directly without introduction.`;

  return callGemini(prompt);
}

export async function suggestTags(productName: string, categoryName: string): Promise<string[]> {
  const prompt = `اقترح 5 وسوم (tags) قصيرة ومناسبة لمنتج باللغة العربية. اسم المنتج: "${productName}". الفئة: "${categoryName}". يجب أن تكون الوسوم مفصولة بفواصل فقط (مثال: ريزين, إكسسوارات, هدية) دون ترقيم أو تفاصيل أخرى.`;
  
  const result = await callGemini(prompt);
  return result
    .split(',')
    .map(tag => tag.trim())
    .filter(Boolean);
}
