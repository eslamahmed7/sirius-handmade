const fs = require('fs');
const path = require('path');

const arPath = path.join(__dirname, 'src', 'locales', 'ar.json');
const enPath = path.join(__dirname, 'src', 'locales', 'en.json');

const ar = JSON.parse(fs.readFileSync(arPath, 'utf8'));
const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));

ar.about = {
  "seo_title": "من نحن | سيريوس هاند ميد",
  "seo_desc": "تعرف على قصة سيريوس هاند ميد — علامة يدوية مصرية متخصصة في منتجات الريزين الفنية الفاخرة، من مجوهرات وديكورات وهدايا مميزة.",
  "badge": "صنع بحب منذ 2020",
  "hero_title": "نحن <1>سيريوس</1>",
  "hero_desc": "علامة يدوية مصرية أصيلة، متخصصة في إبداع قطع ريزين فنية فريدة — من المجوهرات إلى الديكور المنزلي، كل قطعة تحمل قصة ولمسة روح.",
  "stats": {
    "products": "منتج فريد",
    "clients": "عميل سعيد",
    "years": "سنوات إبداع"
  },
  "story_badge": "قصتنا",
  "story_title": "من شغف إلى علامة فارقة",
  "story_p1": "بدأت رحلة سيريوس هاند ميد عام 2020 من ورشة صغيرة بيد مبدعة وقلب مفعم بالحب لفن الريزين. كانت البداية بضع قطع تُصنع للأصدقاء والعائلة، لكن الإقبال الرائع جعلها تتحول إلى مشروع حقيقي.",
  "story_p2": "تخصصنا في فن الريزين الشفاف والملوّن لصنع مجوهرات، أدوات مكتبية، لوحات فنية، وإكسسوارات ديكور فريدة تجمع بين الجمال العصري والروح اليدوية الأصيلة.",
  "story_p3": "اليوم نفخر بخدمة آلاف العملاء في مصر وخارجها، ونواصل الإبداع برؤية واحدة: أن تحمل كل قطعة من قطعنا معنى خاصاً لمن يمتلكها.",
  "values_badge": "قيمنا",
  "values_title": "ما يُحرّكنا كل يوم",
  "testimonials_badge": "آراء العملاء",
  "testimonials_title": "يقولون عنّا",
  "why_us_badge": "لماذا نحن؟",
  "why_us_title": "تجربة تسوق متكاملة",
  "cta_title": "هل أنت مستعد للاكتشاف؟",
  "cta_desc": "تصفح مجموعتنا من القطع الفنية اليدوية الفريدة وأضف لمسة جمال خاصة لحياتك.",
  "shop_now": "تسوق الآن",
  "contact_us": "تواصل معنا"
};

en.about = {
  "seo_title": "About Us | Sirius Handmade",
  "seo_desc": "Learn about the story of Sirius Handmade — an Egyptian handmade brand specializing in luxury resin art products, from jewelry to decor and gifts.",
  "badge": "Crafted with love since 2020",
  "hero_title": "We are <1>Sirius</1>",
  "hero_desc": "An authentic Egyptian handmade brand, specializing in creating unique resin art pieces — from jewelry to home decor, every piece carries a story and a touch of soul.",
  "stats": {
    "products": "Unique Product",
    "clients": "Happy Client",
    "years": "Years of Creativity"
  },
  "story_badge": "Our Story",
  "story_title": "From passion to a milestone",
  "story_p1": "The Sirius Handmade journey started in 2020 from a small workshop with creative hands and a heart full of love for resin art. It started with a few pieces made for friends and family, but the wonderful response turned it into a real project.",
  "story_p2": "We specialize in clear and colored resin art to create jewelry, stationery, artwork, and unique decor accessories that combine modern beauty with an authentic handmade spirit.",
  "story_p3": "Today, we are proud to serve thousands of customers in Egypt and abroad, continuing to create with one vision: that every piece of ours carries a special meaning for its owner.",
  "values_badge": "Our Values",
  "values_title": "What drives us every day",
  "testimonials_badge": "Customer Reviews",
  "testimonials_title": "What they say about us",
  "why_us_badge": "Why Us?",
  "why_us_title": "A complete shopping experience",
  "cta_title": "Are you ready to discover?",
  "cta_desc": "Browse our collection of unique handmade art pieces and add a special touch of beauty to your life.",
  "shop_now": "Shop Now",
  "contact_us": "Contact Us"
};

ar.contact = {
  "seo_title": "تواصل معنا | سيريوس هاند ميد",
  "seo_desc": "تواصل مع فريق سيريوس هاند ميد لأي استفسار أو طلب مخصص. نحن هنا لمساعدتك.",
  "badge": "نحب نسمعك",
  "title": "تواصل معنا",
  "desc": "فريقنا جاهز للإجابة عن جميع استفساراتك وتلبية طلباتك. لا تتردد في التواصل معنا!",
  "info": {
    "instagram": "انستجرام",
    "facebook": "فيسبوك",
    "tiktok": "تيك توك",
    "email": "البريد الإلكتروني",
    "location": "الموقع"
  },
  "form_title": "أرسل رسالة",
  "labels": {
    "name": "الاسم",
    "phone": "رقم الهاتف",
    "phone_optional": "(اختياري)",
    "subject": "الموضوع",
    "message": "الرسالة"
  },
  "placeholders": {
    "name": "اسمك الكامل",
    "phone": "رقم هاتفك",
    "subject": "اختر موضوع الرسالة",
    "message": "اكتب رسالتك هنا..."
  },
  "errors": {
    "name_req": "الاسم مطلوب",
    "name_short": "الاسم قصير جداً",
    "phone_invalid": "رقم الهاتف غير صالح",
    "subject_req": "يرجى اختيار موضوع الرسالة",
    "msg_req": "الرسالة مطلوبة",
    "msg_short": "الرسالة قصيرة جداً (10 أحرف على الأقل)"
  },
  "submit": "إرسال الرسالة عبر الانستجرام",
  "submitting": "جاري التحويل...",
  "success_title": "تم إرسال رسالتك!",
  "success_desc": "شكراً لتواصلك معنا. سنرد عليك في أقرب وقت ممكن.",
  "send_another": "إرسال رسالة أخرى",
  "toast_success": "تم نسخ الرسالة بنجاح! قم بلصقها في المحادثة الآن",
  "toast_error": "لم نتمكن من نسخ الرسالة، يرجى كتابتها يدوياً"
};

en.contact = {
  "seo_title": "Contact Us | Sirius Handmade",
  "seo_desc": "Contact the Sirius Handmade team for any inquiry or custom order. We are here to help.",
  "badge": "We love hearing from you",
  "title": "Contact Us",
  "desc": "Our team is ready to answer all your inquiries and fulfill your requests. Do not hesitate to contact us!",
  "info": {
    "instagram": "Instagram",
    "facebook": "Facebook",
    "tiktok": "TikTok",
    "email": "Email",
    "location": "Location"
  },
  "form_title": "Send a Message",
  "labels": {
    "name": "Name",
    "phone": "Phone Number",
    "phone_optional": "(Optional)",
    "subject": "Subject",
    "message": "Message"
  },
  "placeholders": {
    "name": "Your full name",
    "phone": "Your phone number",
    "subject": "Choose message subject",
    "message": "Write your message here..."
  },
  "errors": {
    "name_req": "Name is required",
    "name_short": "Name is too short",
    "phone_invalid": "Invalid phone number",
    "subject_req": "Please select a message subject",
    "msg_req": "Message is required",
    "msg_short": "Message is too short (at least 10 characters)"
  },
  "submit": "Send via Instagram",
  "submitting": "Redirecting...",
  "success_title": "Message Sent!",
  "success_desc": "Thank you for contacting us. We will reply as soon as possible.",
  "send_another": "Send another message",
  "toast_success": "Message copied successfully! Paste it in the chat now",
  "toast_error": "Could not copy message, please type it manually"
};

fs.writeFileSync(arPath, JSON.stringify(ar, null, 2));
fs.writeFileSync(enPath, JSON.stringify(en, null, 2));
