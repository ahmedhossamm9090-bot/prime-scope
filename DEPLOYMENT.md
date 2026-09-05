# DEPLOYMENT.md - دليل نشر وتدشين منصة Prime Scope

يوضح هذا الملف بيئة العمل السحابية، الأدوات المستخدمة، وخطوات النشر المعتمدة لتشغيل المنصة على الإنترنت بشكل آمن.

---

## 🛠️ الأدوات المستخدمة في النشر (Deployment Stack)

تم اختيار منصات سحابية حديثة تتيح النشر التلقائي بمجرد دفع الكود إلى مستودع GitHub:
* **GitHub**: إدارة الكود والتنسيق البرمجي.
* **Vercel**: استضافة الواجهة الأمامية (React client) لسرعة استجابة الـ CDN الفائقة.
* **Render**: استضافة خادم الخلفية (Node.js Express App) كخدمة ويب (Web Service).
* **MongoDB Atlas**: قاعدة بيانات سحابية مدارة بالكامل لاستضافة بيانات المنتجات والطلبات.

---

## ⚙️ إعداد بيئة العمل والمتغيرات (.env Config)

يجب ضبط متغيرات البيئة بدقة في منصات الاستضافة لضمان حمايتها وعدم كشفها في كود المصدر.

### 1. متغيرات بيئة الواجهة الخلفية (Backend Environment Variables - Render)
يتم إضافتها في لوحة تحكم Render ضمن قسم **Environment**:

```ini
# المنفذ الذي سيعمل عليه الخادم
PORT=5000

# رابط الاتصال بقاعدة بيانات MongoDB Atlas السحابية
MONGO_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/primescope?retryWrites=true&w=majority

# مفتاح التشفير لجلسات تسجيل دخول المشرفين (JWT)
JWT_SECRET=super_secret_random_string_key_here

# مفتاح الوصول للذكاء الاصطناعي (Gemini API Key)
GEMINI_API_KEY=AIzaSyD-xxxxxxxxxxxxxxxxxxxxx

# إعدادات خادم البريد لإرسال إشعارات طلبات الأسعار (SMTP)
SMTP_HOST=smtp.mailtrap.io (أو Gmail SMTP)
SMTP_PORT=2525
SMTP_USER=your_smtp_username
SMTP_PASS=your_smtp_password
ADMIN_EMAIL=admin@primescope.com
```

### 2. متغيرات بيئة الواجهة الأمامية (Frontend Environment Variables - Vercel)
يتم إضافتها في لوحة تحكم Vercel:

```ini
# رابط خادم الخلفية المنشور على Render
VITE_API_URL=https://primescope-backend.onrender.com
```

---

## 🚀 خطوات النشر خطوة بخطوة (Step-by-Step Deployment)

### الخطوة الأولى: إعداد قاعدة البيانات (MongoDB Atlas)
1. قم بإنشاء حساب مجاني على [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. أنشئ قاعدة بيانات جديدة من نوع Shared Cluster (المستوى المجاني).
3. اضبط خيارات الأمان:
   * أنشئ مستخدم لقاعدة البيانات بكلمة مرور قوية.
   * أضف العنوان `0.0.0.0/0` في قسم Network Access للسماح لخادم Render بالاتصال بقاعدة البيانات.
4. انسخ رابط الاتصال (Connection String) لاستخدامه في متغير `MONGO_URI`.

### الخطوة الثانية: رفع الكود على GitHub
1. تأكد من إدراج ملفات `.env` وملفات الموديولات `node_modules` داخل ملف `.gitignore` لمنع رفعها.
2. افتح مبدل الأوامر في مجلد المشروع وقم بتنفيذ:
   ```bash
   git init
   git add .
   git commit -m "Initial commit - Prime Scope Project Plan & Docs"
   git remote add origin <URL_مستودع_GitHub>
   git branch -M main
   git push -u origin main
   ```

### الخطوة الثالثة: نشر الخلفية على Render
1. سجل الدخول إلى [Render](https://render.com) وقم بربط حسابك بـ GitHub.
2. اضغط على **New** ثم اختر **Web Service**.
3. اختر مستودع المشروع الخاص بـ Prime Scope.
4. اضبط إعدادات الخدمة:
   * **Root Directory**: `backend` (أو المجلد الرئيسي في حال كان المشروع Monorepo).
   * **Build Command**: `npm install`
   * **Start Command**: `node server.js` أو `npm start`
5. اذهب إلى قسم **Environment Variables** وأدخل المتغيرات المذكورة أعلاه.
6. اضغط على **Create Web Service** وانتظر اكتمال البناء وحصولك على رابط خادم الـ API المنشور (مثال: `https://primescope-backend.onrender.com`).

### الخطوة الرابعة: نشر الواجهة الأمامية على Vercel
1. سجل الدخول إلى [Vercel](https://vercel.com) واربط حسابك بـ GitHub.
2. اضغط على **Add New** ثم اختر **Project**.
3. اختر مستودع Prime Scope واضغط **Import**.
4. في إعدادات المشروع:
   * حدد إطار العمل كـ **Vite**.
   * حدد مجلد الواجهة الأمامية كـ Root Directory في حال كان منفصلاً.
5. افتح تبويب **Environment Variables** وأضف المتغير `VITE_API_URL` وقم بوضع رابط الخلفية الذي حصلت عليه من Render بالخطوة السابقة.
6. اضغط **Deploy**. سيقوم Vercel ببناء الموقع ونشره وتوفير رابط مباشر للعملاء.

---

## 🔍 التحقق والمتابعة بعد النشر (Post-Deployment Verification)

- [ ] قم بزيارة رابط الموقع المنشور على Vercel وتأكد من عمل الصفحات بشكل سليم وتجاوبها مع الهاتف.
- [ ] جرب الانتقال إلى كتالوج المنتجات وتأكد من سحب البيانات بنجاح من قاعدة البيانات عبر Render.
- [ ] اختبر حاسبة المقاسات وأضف منتجاً إلى السلة، ثم قم بتجربة ملء وإرسال نموذج طلب عرض الأسعار.
- [ ] تأكد من استلام بريد إلكتروني للإدارة يحتوي على تفاصيل طلب عرض السعر الجديد.
- [ ] افتح نافذة الشات بوت وتحدث مع مساعد الذكاء الاصطناعي للتأكد من ربط مفتاح API وإرجاع النصائح بدقة.
