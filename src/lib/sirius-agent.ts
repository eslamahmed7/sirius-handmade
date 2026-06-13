import { supabase } from './supabase';

let apiKey = import.meta.env.VITE_GEMINI_API_KEY;

export interface ChatMessage {
  role: 'user' | 'model';
  parts: any[];
}

export async function executeSiriusTool(name: string, args: any): Promise<any> {
  try {
    switch (name) {
      case 'create_category': {
        const { name_ar, name_en, description_ar, description_en, sort_order } = args;
        const toTitleCase = (str: string) => str.split(/\s+/).map(word => word ? word.charAt(0).toUpperCase() + word.slice(1).toLowerCase() : '').join(' ');
        const nameEnFormatted = name_en ? toTitleCase(name_en.trim()) : '';
        const slugSource = nameEnFormatted || name_ar.trim();
        const slug = slugSource.toLowerCase().replace(/[^a-z0-9\u0600-\u06FF]+/g, '-').replace(/(^-|-$)/g, '');

        const { data, error } = await supabase.from('categories').insert({
          name_ar: name_ar.trim(),
          name_en: nameEnFormatted,
          slug,
          description_ar: description_ar?.trim() || '',
          description_en: description_en?.trim() || '',
          sort_order: Number(sort_order || 0),
          is_active: true
        }).select().maybeSingle();

        if (error) throw error;
        return { status: 'success', message: `تم إنشاء الفئة "${name_ar}" بنجاح!`, category: data };
      }

      case 'create_product': {
        const { name_ar, name_en, price, discount_price, stock_quantity, category_id, description_ar, description_en, tags, image_urls } = args;
        const toTitleCase = (str: string) => str.split(/\s+/).map(word => word ? word.charAt(0).toUpperCase() + word.slice(1).toLowerCase() : '').join(' ');
        const nameEnFormatted = name_en ? toTitleCase(name_en.trim()) : '';
        const slugSource = nameEnFormatted || name_ar.trim();
        const slug = slugSource.toLowerCase().replace(/[^a-z0-9\u0600-\u06FF]+/g, '-').replace(/(^-|-$)/g, '');

        const { data, error } = await supabase.from('products').insert({
          name_ar: name_ar.trim(),
          name_en: nameEnFormatted,
          slug,
          description_ar: description_ar?.trim() || '',
          description_en: description_en?.trim() || '',
          price: Number(price),
          discount_price: discount_price ? Number(discount_price) : null,
          stock_quantity: Number(stock_quantity ?? 10),
          category_id: category_id || null,
          tags: tags ? tags.split(',').map((t: string) => t.trim()).filter(Boolean) : [],
          is_active: true,
          is_featured: false
        }).select().maybeSingle();

        if (error) throw error;

        // Link uploaded images to the new product
        if (data?.id && image_urls && image_urls.length > 0) {
          const imageRows = image_urls.map((url: string, i: number) => ({
            product_id: data.id,
            image_url: url,
            sort_order: i,
            is_primary: i === 0,
          }));
          await supabase.from('product_images').insert(imageRows);
        }

        return { status: 'success', message: `تم إضافة المنتج "${name_ar}" بنجاح!`, product: data };
      }

      case 'list_categories': {
        const { data, error } = await supabase.from('categories').select('id, name_ar, name_en').order('sort_order');
        if (error) throw error;
        return { status: 'success', categories: data };
      }

      case 'list_products': {
        const { search_query } = args;
        let query = supabase.from('products').select('id, name_ar, price, stock_quantity, category_id');
        if (search_query) {
          query = query.or(`name_ar.ilike.%${search_query}%,name_en.ilike.%${search_query}%`);
        }
        const { data, error } = await query.limit(15);
        if (error) throw error;
        return { status: 'success', products: data };
      }

      case 'delete_product': {
        const { product_id } = args;
        const { error } = await supabase.from('products').delete().eq('id', product_id);
        if (error) throw error;
        return { status: 'success', message: 'تم حذف المنتج بنجاح' };
      }

      case 'get_store_statistics': {
        const { count: productsCount } = await supabase.from('products').select('*', { count: 'exact', head: true });
        const { count: categoriesCount } = await supabase.from('categories').select('*', { count: 'exact', head: true });
        const { data: orders } = await supabase.from('orders').select('total_amount');
        
        const totalRevenue = orders?.reduce((sum, o) => sum + Number(o.total_amount || 0), 0) || 0;
        const totalOrders = orders?.length || 0;

        return {
          status: 'success',
          statistics: {
            total_products: productsCount || 0,
            total_categories: categoriesCount || 0,
            total_orders: totalOrders,
            total_revenue: totalRevenue
          }
        };
      }

      default:
        return { status: 'error', message: `أداة غير معروفة: ${name}` };
    }
  } catch (err: any) {
    return { status: 'error', message: err.message || 'فشل تنفيذ العملية في قاعدة البيانات' };
  }
}

export async function sendMessageToSiriusAgent(chatHistory: ChatMessage[], userText: string): Promise<{ history: ChatMessage[]; textResponse: string }> {
  let currentApiKey = apiKey || localStorage.getItem('gemini_api_key');
  
  if (!currentApiKey) {
    const userInput = prompt('الرجاء إدخال مفتاح Gemini API الخاص بك (سيتم حفظه في المتصفح الحالي):');
    if (userInput && userInput.trim()) {
      localStorage.setItem('gemini_api_key', userInput.trim());
      currentApiKey = userInput.trim();
    } else {
      throw new Error('مفتاح الـ API لـ Gemini غير متوفر. يرجى إدخال المفتاح للعمل.');
    }
  }

  // Add the user message to history
  const currentHistory: ChatMessage[] = [
    ...chatHistory,
    { role: 'user', parts: [{ text: userText }] }
  ];

  const toolsConfig = [{
    functionDeclarations: [
      {
        name: 'create_category',
        description: 'إنشاء فئة/قسم منتجات جديد في قاعدة البيانات (Create a new product category)',
        parameters: {
          type: 'OBJECT',
          properties: {
            name_ar: { type: 'STRING', description: 'الاسم بالعربية للفئة (مطلوب)' },
            name_en: { type: 'STRING', description: 'الاسم بالإنجليزية للفئة (اختياري)' },
            description_ar: { type: 'STRING', description: 'وصف الفئة بالعربية' },
            description_en: { type: 'STRING', description: 'وصف الفئة بالإنجليزية' },
            sort_order: { type: 'NUMBER', description: 'ترتيب العرض (الافتراضي 0)' }
          },
          required: ['name_ar']
        }
      },
      {
        name: 'create_product',
        description: 'إضافة منتج جديد للمتجر في قاعدة البيانات (Create a new product)',
        parameters: {
          type: 'OBJECT',
          properties: {
            name_ar: { type: 'STRING', description: 'اسم المنتج بالعربية (مطلوب)' },
            name_en: { type: 'STRING', description: 'اسم المنتج بالإنجليزية (اختياري)' },
            price: { type: 'NUMBER', description: 'سعر المنتج (مطلوب)' },
            discount_price: { type: 'NUMBER', description: 'سعر المنتج بعد الخصم (اختياري)' },
            stock_quantity: { type: 'NUMBER', description: 'كمية المخزون المتوفرة (الافتراضي 10)' },
            category_id: { type: 'STRING', description: 'معرف الفئة (ID) للمنتج. استخدم قائمة الفئات لمعرفة الـ ID المناسب' },
            description_ar: { type: 'STRING', description: 'وصف المنتج بالعربية' },
            description_en: { type: 'STRING', description: 'وصف المنتج بالإنجليزية' },
            tags: { type: 'STRING', description: 'وسوم للمنتج مفصولة بفواصل (مثل: ريزين, ساعة, هدية)' },
            image_urls: {
              type: 'ARRAY',
              items: { type: 'STRING' },
              description: 'روابط صور المنتج المرفقة (اختياري)'
            }
          },
          required: ['name_ar', 'price']
        }
      },
      {
        name: 'list_categories',
        description: 'جلب قائمة بجميع الفئات/الأقسام المتاحة في قاعدة البيانات لمعرفة أسمائها ومعرفاتها (Get list of all categories)',
        parameters: {
          type: 'OBJECT',
          properties: {}
        }
      },
      {
        name: 'list_products',
        description: 'البحث عن منتجات أو جلب قائمة بالمنتجات المتوفرة في المتجر (Search or list products)',
        parameters: {
          type: 'OBJECT',
          properties: {
            search_query: { type: 'STRING', description: 'كلمة للبحث في أسماء المنتجات (اختياري)' }
          }
        }
      },
      {
        name: 'delete_product',
        description: 'حذف منتج معين من المتجر باستخدام معرفه (ID) (Delete a product)',
        parameters: {
          type: 'OBJECT',
          properties: {
            product_id: { type: 'STRING', description: 'معرف المنتج (ID) المراد حذفه' }
          },
          required: ['product_id']
        }
      },
      {
        name: 'get_store_statistics',
        description: 'جلب ملخص الإحصائيات العامة للمتجر مثل إجمالي الإيرادات والطلبات والمنتجات والعملاء (Get overall store metrics)',
        parameters: {
          type: 'OBJECT',
          properties: {}
        }
      }
    ]
  }];

  const systemInstruction = {
    parts: [{
      text: "أنت Sirius AI، مساعد ذكي مدمج في لوحة إدارة متجر 'سيريوس هاند ميد' (Sirius Handmade). لديك الصلاحيات الكاملة لمساعدة مدير المتجر في إدارة موقعه بالكامل. يمكنك إضافة وحذف وتعديل المنتجات والأقسام وجلب إحصائيات المبيعات والأداء. تحدث دائماً باللغة العربية بأسلوب ودود واحترافي. عندما يطلب منك المستخدم القيام بإجراء، استخدم الأداة المناسبة لتنفيذه في قاعدة البيانات، ثم أخبر المستخدم بالنتيجة. إذا كانت هناك فئة مطلوبة لإضافة منتج ولم يوفر المستخدم الـ category_id، يمكنك أولاً استدعاء list_categories للبحث عنها، ثم القيام بإضافة المنتج بالمعرف الصحيح. إذا قام المستخدم بإرفاق روابط صور (تظهر كـ [روابط الصور المرفقة: ...]) وطلب إضافة منتج جديد، فتأكد من تمرير هذه الروابط في مصفوفة `image_urls` عند استدعاء أداة `create_product`."
    }]
  };

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${currentApiKey}`;

  // Start Agent Loop
  let loopCount = 0;
  const maxLoops = 5;

  while (loopCount < maxLoops) {
    loopCount++;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': currentApiKey,
      },
      body: JSON.stringify({
        contents: currentHistory,
        tools: toolsConfig,
        systemInstruction: systemInstruction,
        generationConfig: {
          temperature: 0.4,
          maxOutputTokens: 2048,
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      if (response.status === 401 || response.status === 400) {
        localStorage.removeItem('gemini_api_key');
        throw new Error('مفتاح الـ API غير صالح أو مقيد. تم مسح المفتاح، يرجى تحديث الصفحة وإدخال مفتاح صحيح.');
      }
      throw new Error(errorData.error?.message || `خطأ من خادم Google (كود ${response.status})`);
    }

    const data = await response.json();
    const candidate = data.candidates?.[0];
    const content = candidate?.content;
    const parts = content?.parts || [];

    const functionCallParts = parts.filter((p: any) => p.functionCall);
    const textParts = parts.filter((p: any) => p.text);

    if (functionCallParts.length > 0) {
      currentHistory.push(content);

      const responseParts: any[] = [];
      for (const p of functionCallParts) {
        const functionCall = p.functionCall;
        const result = await executeSiriusTool(functionCall.name, functionCall.args);
        
        const respPart: any = {
          functionResponse: {
            name: functionCall.name,
            response: result
          }
        };
        if (functionCall.id) {
          respPart.functionResponse.id = functionCall.id;
        }
        responseParts.push(respPart);
      }

      currentHistory.push({
        role: 'user',
        parts: responseParts
      });

      continue;
    }

    if (textParts.length > 0) {
      currentHistory.push(content);
      const combinedText = textParts.map((p: any) => p.text).join('\n');
      return {
        history: currentHistory,
        textResponse: combinedText
      };
    }

    throw new Error('لم يقم النموذج بإرجاع نص أو استدعاء دالة.');
  }

  throw new Error('تم تجاوز الحد الأقصى لدورات معالجة الطلبات.');
}
