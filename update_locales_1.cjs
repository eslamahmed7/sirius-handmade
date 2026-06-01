const fs = require('fs');
const path = require('path');

const arPath = path.join(__dirname, 'src', 'locales', 'ar.json');
const enPath = path.join(__dirname, 'src', 'locales', 'en.json');

const ar = JSON.parse(fs.readFileSync(arPath, 'utf8'));
const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));

ar.footer = {
  "desc": "منتجات ريزين يدوية الصنع فاخرة، مصنوعة بحب وإبداع لكل منزلك",
  "quick_links": "روابط سريعة",
  "contact": "تواصل معنا",
  "follow_us": "تابعنا",
  "rights": "جميع الحقوق محفوظة."
};

en.footer = {
  "desc": "Luxury handmade resin products, crafted with love and creativity for your home",
  "quick_links": "Quick Links",
  "contact": "Contact Us",
  "follow_us": "Follow Us",
  "rights": "All rights reserved."
};

ar.product_card = {
  "add_favorite": "إضافة للمفضلة",
  "remove_favorite": "إزالة من المفضلة",
  "add_cart": "إضافة للسلة",
  "currency": "ج.م",
  "discount": "خصم"
};

en.product_card = {
  "add_favorite": "Add to Favorites",
  "remove_favorite": "Remove from Favorites",
  "add_cart": "Add to Cart",
  "currency": "EGP",
  "discount": "Discount"
};

fs.writeFileSync(arPath, JSON.stringify(ar, null, 2));
fs.writeFileSync(enPath, JSON.stringify(en, null, 2));
