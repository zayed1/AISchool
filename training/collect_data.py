"""
سكربت جمع بيانات التدريب — يعمل في Google Colab
يجمع نصوص عربية بشرية + يولّد نصوص AI تلقائياً

التشغيل:
  pip install datasets google-generativeai tqdm
  python collect_data.py
"""
import json
import os
import random
import time
from pathlib import Path

OUTPUT_DIR = Path("training_data")
OUTPUT_DIR.mkdir(exist_ok=True)

# ========================
# مصدر 1: بيانات جاهزة من HuggingFace
# ========================
def collect_huggingface_datasets():
    """جمع datasets عربية جاهزة — مجانية بالكامل."""
    from datasets import load_dataset

    all_data = []

    # 1. KFUPM Arabic AI Detection Dataset
    print("📥 جمع KFUPM dataset...")
    try:
        ds = load_dataset("KFUPM-JRCAI/arabic-generated-abstracts", split="train")
        for row in ds:
            text = row.get("text", row.get("abstract", ""))
            label = row.get("label", "")
            if text and len(text.split()) >= 30:
                is_ai = label in ("machine", "generated", "ai", "1", 1)
                all_data.append({"text": text[:2000], "label": 1 if is_ai else 0, "source": "kfupm"})
        print(f"  ✓ {len([d for d in all_data if d['source'] == 'kfupm'])} عينة")
    except Exception as e:
        print(f"  ✗ KFUPM failed: {e}")

    # 2. Arabic Wikipedia (بشري)
    print("📥 جمع Wikipedia العربية...")
    try:
        ds = load_dataset("wikipedia", "20220301.ar", split="train", streaming=True)
        wiki_count = 0
        for row in ds:
            text = row.get("text", "")
            # أخذ فقرة واحدة بحجم معقول
            paragraphs = [p.strip() for p in text.split("\n") if len(p.split()) >= 50]
            for p in paragraphs[:1]:
                all_data.append({"text": p[:2000], "label": 0, "source": "wikipedia"})
                wiki_count += 1
                if wiki_count >= 8000:
                    break
            if wiki_count >= 8000:
                break
        print(f"  ✓ {wiki_count} عينة بشرية من ويكيبيديا")
    except Exception as e:
        print(f"  ✗ Wikipedia failed: {e}")

    # 3. Arabic News (بشري)
    print("📥 جمع أخبار عربية...")
    try:
        ds = load_dataset("arbml/Arabic_News", split="train", streaming=True)
        news_count = 0
        for row in ds:
            text = row.get("text", row.get("content", ""))
            if text and len(text.split()) >= 50:
                all_data.append({"text": text[:2000], "label": 0, "source": "news"})
                news_count += 1
                if news_count >= 4000:
                    break
        print(f"  ✓ {news_count} عينة بشرية من الأخبار")
    except Exception as e:
        print(f"  ✗ Arabic News failed: {e}")

    return all_data


# ========================
# مصدر 2: توليد نصوص AI مجاناً بـ Gemini
# ========================
TOPICS = [
    "التعليم الإلكتروني", "الذكاء الاصطناعي", "التغير المناخي", "الصحة النفسية",
    "ريادة الأعمال", "الثقافة العربية", "التكنولوجيا الحديثة", "الاقتصاد الرقمي",
    "حقوق الإنسان", "الطاقة المتجددة", "التنمية المستدامة", "العولمة",
    "التعليم عن بعد", "الأمن السيبراني", "الروبوتات", "الفضاء",
    "علم النفس", "التاريخ الإسلامي", "الأدب العربي", "الفلسفة",
    "الطب الحديث", "الزراعة الذكية", "المدن الذكية", "السياحة",
    "الرياضة والصحة", "التربية والتعليم", "الإعلام الرقمي", "القانون الدولي",
    "الفنون والموسيقى", "العمارة الإسلامية",
]

STYLES = [
    "اكتب مقالاً أكاديمياً رسمياً عن",
    "اكتب فقرتين عن",
    "اكتب تحليلاً مفصلاً عن",
    "اشرح أهمية",
    "ناقش تأثير",
    "قدم نظرة شاملة عن",
    "اكتب ملخصاً عن",
]


def generate_ai_texts_gemini(count=5000):
    """توليد نصوص AI باستخدام Gemini المجاني."""
    try:
        import google.generativeai as genai
    except ImportError:
        print("⚠️  pip install google-generativeai")
        return []

    api_key = os.environ.get("GEMINI_API_KEY", "")
    if not api_key:
        print("⚠️  ضع GEMINI_API_KEY (مجاني من https://aistudio.google.com/apikey)")
        return []

    genai.configure(api_key=api_key)
    model = genai.GenerativeModel("gemini-2.0-flash")

    generated = []
    print(f"🤖 توليد {count} نص AI بـ Gemini...")

    for i in range(count):
        topic = random.choice(TOPICS)
        style = random.choice(STYLES)
        prompt = f"{style} {topic}. اكتب بالعربية الفصحى في 100-300 كلمة."

        try:
            response = model.generate_content(prompt)
            text = response.text.strip()
            if text and len(text.split()) >= 50:
                generated.append({"text": text[:2000], "label": 1, "source": "gemini"})
                if (i + 1) % 100 == 0:
                    print(f"  {i + 1}/{count} ({len(generated)} نجحت)")
            time.sleep(0.5)  # rate limit
        except Exception as e:
            if "quota" in str(e).lower() or "rate" in str(e).lower():
                print(f"  ⏸ Rate limit — waiting 60s...")
                time.sleep(60)
            continue

    print(f"  ✓ {len(generated)} نص AI مولّد")
    return generated


# ========================
# مصدر 3: توليد بديل بدون API (نصوص قالبية)
# ========================
def generate_template_ai_texts(count=3000):
    """توليد نصوص بأسلوب AI نمطي — بدون API."""
    templates = [
        "يُعدّ {topic} من أبرز المجالات التي شهدت تطوراً ملحوظاً في الآونة الأخيرة. بالإضافة إلى ذلك، فإن {topic} يلعب دوراً محورياً في تشكيل مستقبل المجتمعات. من الجدير بالذكر أن الدراسات الحديثة تُشير إلى أهمية {topic} في تحقيق التنمية المستدامة. علاوة على ذلك، يسهم {topic} في تحسين جودة الحياة بشكل عام. في هذا السياق، تبرز الحاجة إلى مزيد من البحث والتطوير في مجال {topic}. من ناحية أخرى، يثير {topic} تساؤلات مهمة حول التحديات المستقبلية.",
        "في ضوء التطورات الراهنة، يكتسب {topic} أهمية متزايدة في عالمنا المعاصر. تتمثل أهمية {topic} في قدرته على إحداث تحولات جوهرية في مختلف المجالات. وفقاً للمتخصصين، فإن {topic} يُشكّل ركيزة أساسية للتقدم والازدهار. بناءً على ذلك، تسعى المؤسسات إلى تبني استراتيجيات فعالة في مجال {topic}. في الختام، يمكن القول إن {topic} يمثل فرصة حقيقية لتحقيق التطور المنشود.",
        "يحظى {topic} باهتمام واسع من قبل الباحثين والمتخصصين على حد سواء. تجدر الإشارة إلى أن {topic} قد أثبت فعاليته في العديد من التطبيقات العملية. استناداً إلى الأدلة المتاحة، يتضح أن {topic} يُسهم بشكل فعّال في تطوير المجتمعات. على صعيد آخر، يواجه {topic} عدداً من التحديات التي تستلزم معالجة شاملة. في نهاية المطاف، يبقى {topic} عنصراً حيوياً في مسيرة التقدم البشري.",
    ]

    generated = []
    for _ in range(count):
        topic = random.choice(TOPICS)
        template = random.choice(templates)
        text = template.replace("{topic}", topic)
        generated.append({"text": text, "label": 1, "source": "template"})

    print(f"  ✓ {len(generated)} نص قالبي AI")
    return generated


# ========================
# التجميع النهائي
# ========================
def main():
    print("=" * 50)
    print("  جمع بيانات تدريب كاشف النصوص العربية")
    print("=" * 50)

    all_data = []

    # 1. بيانات جاهزة
    all_data.extend(collect_huggingface_datasets())

    # 2. نصوص AI مولّدة
    if os.environ.get("GEMINI_API_KEY"):
        all_data.extend(generate_ai_texts_gemini(5000))
    else:
        print("\n⚠️  لم يتم تعيين GEMINI_API_KEY — استخدام نصوص قالبية بديلة")
        all_data.extend(generate_template_ai_texts(5000))

    # خلط البيانات
    random.shuffle(all_data)

    # إحصائيات
    ai_count = sum(1 for d in all_data if d["label"] == 1)
    human_count = len(all_data) - ai_count

    print(f"\n{'=' * 50}")
    print(f"  إجمالي العينات: {len(all_data)}")
    print(f"  AI: {ai_count} | بشري: {human_count}")
    print(f"  المصادر: {set(d['source'] for d in all_data)}")
    print(f"{'=' * 50}")

    # حفظ
    output_file = OUTPUT_DIR / "arabic_ai_detection_dataset.jsonl"
    with open(output_file, "w", encoding="utf-8") as f:
        for item in all_data:
            f.write(json.dumps(item, ensure_ascii=False) + "\n")

    print(f"\n✅ تم الحفظ في: {output_file}")
    print(f"   الحجم: {output_file.stat().st_size / 1024 / 1024:.1f} MB")


if __name__ == "__main__":
    main()
