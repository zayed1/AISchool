# تدريب نموذج كشف النصوص العربية المولدة بالذكاء الاصطناعي

## الخطوات

### 1. افتح Google Colab
- اذهب إلى [colab.research.google.com](https://colab.research.google.com)
- اضغط **File → Upload notebook**
- ارفع ملف `train_model.ipynb`
- تأكد من تفعيل GPU: **Runtime → Change runtime type → T4 GPU**

### 2. (اختياري) مفتاح Gemini لبيانات أفضل
- اذهب إلى [aistudio.google.com/apikey](https://aistudio.google.com/apikey)
- انشئ مفتاح مجاني
- ضعه في الخلية الثانية من الـ notebook

### 3. شغّل الكل
- **Runtime → Run all**
- انتظر ~30 دقيقة
- سيتم تحميل ملف `onnx_arabic_ai_detector_v2.zip` تلقائياً

### 4. استبدل النموذج
```bash
# فك الضغط
unzip onnx_arabic_ai_detector_v2.zip

# انسخ الملفات للمشروع (استبدال النموذج القديم)
cp onnx_export/* backend/analysis/onnx_model/

# ارفع التغييرات
git add backend/analysis/onnx_model/
git commit -m "feat: custom trained Arabic AI detector v2"
git push
```

## النتائج المتوقعة

| المقياس | النموذج الحالي | النموذج الجديد |
|---------|---------------|---------------|
| Accuracy | ~75% | ~93-95% |
| F1 Score | ~70% | ~92-94% |
| حجم النموذج | ~540 MB | ~540 MB |

## البيانات المستخدمة

| المصدر | النوع | العدد التقريبي |
|--------|-------|---------------|
| KFUPM Dataset | AI + بشري | ~8,000 |
| Wikipedia العربية | بشري | ~8,000 |
| أخبار عربية | بشري | ~4,000 |
| Gemini / قوالب | AI | ~5,000 |
| **المجموع** | | **~25,000** |
