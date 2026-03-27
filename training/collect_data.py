"""
سكربت جمع بيانات التدريب — يعمل في Google Colab
يجمع نصوص عربية بشرية + يولّد نصوص AI تلقائياً
"""
import json
import os
import random
import time
from pathlib import Path

OUTPUT_DIR = Path("training_data")
OUTPUT_DIR.mkdir(exist_ok=True)


def collect_huggingface_datasets():
    from datasets import load_dataset

    all_data = []

    # 1. KFUPM Arabic AI Detection Dataset
    print("📥 جمع KFUPM dataset...")
    try:
        for split_name in ['from_title', 'from_title_and_content', 'by_polishing']:
            try:
                ds = load_dataset("KFUPM-JRCAI/arabic-generated-abstracts", split=split_name)
                for row in ds:
                    text = row.get("generated_text", row.get("text", row.get("abstract", "")))
                    if text and len(text.split()) >= 30:
                        all_data.append({"text": text[:2000], "label": 1, "source": "kfupm_ai"})
                    # Also get human text if available
                    human_text = row.get("original_text", row.get("human_text", ""))
                    if human_text and len(human_text.split()) >= 30:
                        all_data.append({"text": human_text[:2000], "label": 0, "source": "kfupm_human"})
            except Exception:
                continue
        print(f"  ✓ {len([d for d in all_data if 'kfupm' in d['source']])} عينة من KFUPM")
    except Exception as e:
        print(f"  ✗ KFUPM failed: {e}")

    # 2. Arabic text datasets (بشري)
    print("📥 جمع نصوص عربية بشرية...")
    human_datasets = [
        ("arbml/Arabic_Poems", "poem_text", None),
        ("Zaid/arabic_text_classification", "text", None),
    ]

    for ds_name, text_col, split in human_datasets:
        try:
            ds = load_dataset(ds_name, split=split or "train", streaming=True)
            count = 0
            for row in ds:
                text = row.get(text_col, row.get("text", ""))
                if text and len(text.split()) >= 30:
                    all_data.append({"text": text[:2000], "label": 0, "source": ds_name.split("/")[-1]})
                    count += 1
                    if count >= 3000:
                        break
            print(f"  ✓ {count} عينة من {ds_name}")
        except Exception as e:
            print(f"  ✗ {ds_name}: {e}")

    # 3. Arabic CC100 (نصوص ويب عربية بشرية — بديل ويكيبيديا)
    print("📥 جمع نصوص ويب عربية...")
    try:
        ds = load_dataset("cc100", lang="ar", split="train", streaming=True)
        count = 0
        for row in ds:
            text = row.get("text", "")
            if text and len(text.split()) >= 50 and len(text.split()) <= 500:
                all_data.append({"text": text[:2000], "label": 0, "source": "cc100"})
                count += 1
                if count >= 6000:
                    break
        print(f"  ✓ {count} عينة من CC100")
    except Exception as e:
        print(f"  ✗ CC100: {e}")

    return all_data


# ========================
# توليد نصوص AI بـ Gemini
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
    try:
        import google.generativeai as genai
    except ImportError:
        print("⚠️  pip install google-generativeai")
        return []

    api_key = os.environ.get("GEMINI_API_KEY", "")
    if not api_key:
        print("⚠️  لم يتم تعيين GEMINI_API_KEY")
        return []

    genai.configure(api_key=api_key)
    model = genai.GenerativeModel("gemini-2.0-flash")

    generated = []
    print(f"🤖 توليد {count} نص AI بـ Gemini...")

    for i in range(count):
        topic = random.choice(TOPICS)
        style = random.choice(STYLES)
        prompt = f"{style} {topic}. اكتب بالعربية الفصحى في 100-300 كلمة. لا تستخدم عناوين أو نقاط. فقط فقرات نصية."

        try:
            response = model.generate_content(prompt)
            text = response.text.strip()
            # تنظيف
            text = text.replace("##", "").replace("**", "").replace("*", "").strip()
            if text and len(text.split()) >= 50:
                generated.append({"text": text[:2000], "label": 1, "source": "gemini"})
                if (i + 1) % 100 == 0:
                    print(f"  {i + 1}/{count} ({len(generated)} نجحت)")
            time.sleep(0.3)
        except Exception as e:
            err = str(e).lower()
            if "quota" in err or "rate" in err or "resource" in err:
                print(f"  ⏸ Rate limit — waiting 60s... ({len(generated)} حتى الآن)")
                time.sleep(60)
            continue

    print(f"  ✓ {len(generated)} نص AI مولّد بـ Gemini")
    return generated


def generate_template_ai_texts(count=3000):
    templates = [
        "يُعدّ {topic} من أبرز المجالات التي شهدت تطوراً ملحوظاً في الآونة الأخيرة. بالإضافة إلى ذلك، فإن {topic} يلعب دوراً محورياً في تشكيل مستقبل المجتمعات. من الجدير بالذكر أن الدراسات الحديثة تُشير إلى أهمية {topic} في تحقيق التنمية المستدامة. علاوة على ذلك، يسهم {topic} في تحسين جودة الحياة بشكل عام. في هذا السياق، تبرز الحاجة إلى مزيد من البحث والتطوير في مجال {topic}. من ناحية أخرى، يثير {topic} تساؤلات مهمة حول التحديات المستقبلية.",
        "في ضوء التطورات الراهنة، يكتسب {topic} أهمية متزايدة في عالمنا المعاصر. تتمثل أهمية {topic} في قدرته على إحداث تحولات جوهرية في مختلف المجالات. وفقاً للمتخصصين، فإن {topic} يُشكّل ركيزة أساسية للتقدم والازدهار. بناءً على ذلك، تسعى المؤسسات إلى تبني استراتيجيات فعالة في مجال {topic}. في الختام، يمكن القول إن {topic} يمثل فرصة حقيقية لتحقيق التطور المنشود.",
        "يحظى {topic} باهتمام واسع من قبل الباحثين والمتخصصين على حد سواء. تجدر الإشارة إلى أن {topic} قد أثبت فعاليته في العديد من التطبيقات العملية. استناداً إلى الأدلة المتاحة، يتضح أن {topic} يُسهم بشكل فعّال في تطوير المجتمعات. على صعيد آخر، يواجه {topic} عدداً من التحديات التي تستلزم معالجة شاملة. في نهاية المطاف، يبقى {topic} عنصراً حيوياً في مسيرة التقدم البشري.",
        "تُشير الدراسات الحديثة إلى أن {topic} يمثل أحد أهم التوجهات المعاصرة. من المنظور الأكاديمي، يُعتبر {topic} مجالاً خصباً للبحث والاستكشاف. بالإضافة إلى ذلك، أظهرت التجارب العملية نتائج واعدة في مجال {topic}. وفي هذا الإطار، تعمل المؤسسات على تطوير برامج متخصصة في {topic}. خلاصة القول، يُعد {topic} من الركائز الأساسية لبناء مستقبل أفضل.",
        "لا يخفى على أحد الأهمية المتزايدة التي يكتسبها {topic} في عصرنا الحالي. فمن ناحية، يسهم {topic} في تعزيز الكفاءة والإنتاجية. ومن ناحية أخرى، يفتح {topic} آفاقاً جديدة للابتكار والإبداع. في السياق ذاته، تؤكد الأبحاث أن {topic} يحمل في طياته إمكانات هائلة لم تُستغل بعد. وبناءً على ما تقدم، نستنتج أن الاستثمار في {topic} يُعد خياراً استراتيجياً حكيماً.",
    ]

    generated = []
    for _ in range(count):
        topic = random.choice(TOPICS)
        template = random.choice(templates)
        text = template.replace("{topic}", topic)
        generated.append({"text": text, "label": 1, "source": "template"})

    print(f"  ✓ {len(generated)} نص قالبي AI")
    return generated


def main():
    print("=" * 50)
    print("  جمع بيانات تدريب كاشف النصوص العربية")
    print("=" * 50)

    all_data = []

    # 1. بيانات جاهزة
    all_data.extend(collect_huggingface_datasets())

    # 2. نصوص AI مولّدة
    if os.environ.get("GEMINI_API_KEY"):
        ai_texts = generate_ai_texts_gemini(5000)
        all_data.extend(ai_texts)
        # إضافة نصوص قالبية أيضاً لتنويع أكثر
        all_data.extend(generate_template_ai_texts(2000))
    else:
        print("\n⚠️  لم يتم تعيين GEMINI_API_KEY — استخدام نصوص قالبية")
        all_data.extend(generate_template_ai_texts(5000))

    # خلط
    random.shuffle(all_data)

    # إحصائيات
    ai_count = sum(1 for d in all_data if d["label"] == 1)
    human_count = len(all_data) - ai_count

    print(f"\n{'=' * 50}")
    print(f"  إجمالي العينات: {len(all_data)}")
    print(f"  AI: {ai_count} | بشري: {human_count}")
    sources = {}
    for d in all_data:
        sources[d["source"]] = sources.get(d["source"], 0) + 1
    for src, cnt in sorted(sources.items(), key=lambda x: -x[1]):
        print(f"    {src}: {cnt}")
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
