"""
جمع بيانات التدريب — يعمل بالكامل بدون API خارجي
يولّد نصوص AI متنوعة محلياً + يجمع نصوص بشرية من HuggingFace
"""
import json
import os
import random
import re
from pathlib import Path

OUTPUT_DIR = Path("training_data")
OUTPUT_DIR.mkdir(exist_ok=True)

# ========================
# مصدر 1: KFUPM Dataset
# ========================
def collect_kfupm():
    print("📥 جمع KFUPM dataset...")
    all_data = []
    try:
        from datasets import load_dataset
        for split in ['from_title', 'from_title_and_content', 'by_polishing']:
            try:
                ds = load_dataset("KFUPM-JRCAI/arabic-generated-abstracts", split=split)
                for row in ds:
                    for col in ['generated_text', 'abstract', 'text']:
                        t = row.get(col, '')
                        if t and len(t.split()) >= 30:
                            all_data.append({"text": t[:2000], "label": 1, "source": f"kfupm_{split}"})
                            break
                    for col in ['original_text', 'human_text']:
                        t = row.get(col, '')
                        if t and len(t.split()) >= 30:
                            all_data.append({"text": t[:2000], "label": 0, "source": f"kfupm_{split}_human"})
                            break
                print(f"  ✓ {split}: OK")
            except Exception as e:
                print(f"  ✗ {split}: {e}")
    except Exception as e:
        print(f"  ✗ KFUPM: {e}")
    print(f"  إجمالي KFUPM: {len(all_data)}")
    return all_data


# ========================
# مصدر 2: نصوص بشرية من HuggingFace
# ========================
def collect_human_texts():
    print("📥 جمع نصوص بشرية...")
    all_data = []
    try:
        from datasets import load_dataset

        # Try multiple Arabic datasets
        datasets_to_try = [
            ("wikimedia/wikipedia", {"name": "20231101.ar", "split": "train", "streaming": True}, "text", 8000),
            ("oscar-corpus/OSCAR-2301", {"name": "ar", "split": "train", "streaming": True, "trust_remote_code": True}, "text", 5000),
        ]

        for ds_name, kwargs, text_col, limit in datasets_to_try:
            try:
                print(f"  محاولة {ds_name}...")
                ds = load_dataset(ds_name, **kwargs)
                count = 0
                for row in ds:
                    text = row.get(text_col, "")
                    # Clean and filter
                    if not text or len(text.split()) < 50:
                        continue
                    # Take a reasonable paragraph
                    paragraphs = [p.strip() for p in text.split("\n") if len(p.split()) >= 40 and len(p.split()) <= 400]
                    for p in paragraphs[:1]:
                        # Skip if too many non-Arabic chars
                        arabic = len(re.findall(r'[\u0600-\u06FF]', p))
                        if arabic / max(len(p), 1) < 0.3:
                            continue
                        all_data.append({"text": p[:2000], "label": 0, "source": ds_name.split("/")[-1]})
                        count += 1
                        if count >= limit:
                            break
                    if count >= limit:
                        break
                print(f"  ✓ {ds_name}: {count} عينة")
                if count >= 3000:
                    break  # enough human data
            except Exception as e:
                print(f"  ✗ {ds_name}: {e}")
                continue

    except Exception as e:
        print(f"  ✗ خطأ عام: {e}")

    return all_data


# ========================
# مصدر 3: توليد نصوص AI محلياً (بدون API)
# ========================
TOPICS = [
    "التعليم الإلكتروني", "الذكاء الاصطناعي", "التغير المناخي", "الصحة النفسية",
    "ريادة الأعمال", "الثقافة العربية", "التكنولوجيا الحديثة", "الاقتصاد الرقمي",
    "حقوق الإنسان", "الطاقة المتجددة", "التنمية المستدامة", "العولمة",
    "التعليم عن بعد", "الأمن السيبراني", "الروبوتات", "استكشاف الفضاء",
    "علم النفس التربوي", "التاريخ الإسلامي", "الأدب العربي المعاصر", "الفلسفة الحديثة",
    "الطب الحديث", "الزراعة الذكية", "المدن الذكية", "السياحة البيئية",
    "الرياضة والصحة", "مناهج التعليم", "الإعلام الرقمي", "القانون الدولي",
    "الفنون التشكيلية", "العمارة الإسلامية", "إدارة الأعمال", "البيئة والتلوث",
    "الأمن الغذائي", "النقل المستدام", "الطاقة الشمسية", "الثورة الصناعية",
    "حوكمة الشركات", "التجارة الإلكترونية", "الصحة العامة", "البحث العلمي",
]

OPENERS = [
    "يُعدّ {t} من أبرز المجالات",
    "يكتسب {t} أهمية متزايدة",
    "يحظى {t} باهتمام واسع",
    "تُشير الدراسات إلى أن {t}",
    "في ظل التطورات الراهنة، يبرز {t}",
    "لا يخفى على أحد أهمية {t}",
    "من المنظور الأكاديمي، يُعتبر {t}",
    "شهد {t} تحولات جوهرية",
    "يُمثل {t} أحد التوجهات",
    "تتجلى أهمية {t}",
]

CONNECTORS = [
    "بالإضافة إلى ذلك،",
    "علاوة على ذلك،",
    "من الجدير بالذكر أن",
    "في هذا السياق،",
    "من ناحية أخرى،",
    "وفي الإطار ذاته،",
    "استناداً إلى ذلك،",
    "بناءً على ما سبق،",
    "في ضوء ذلك،",
    "تجدر الإشارة إلى أن",
    "وفقاً للدراسات الحديثة،",
    "على صعيد آخر،",
]

MIDDLES = [
    "فإن {t} يلعب دوراً محورياً في تشكيل مستقبل المجتمعات الحديثة",
    "يسهم {t} بشكل فعال في تطوير القدرات البشرية والمؤسسية",
    "تبرز الحاجة الملحة إلى تطوير أطر تنظيمية شاملة في مجال {t}",
    "أظهرت التجارب العملية نتائج واعدة في مجال {t}",
    "تعمل المؤسسات على تبني استراتيجيات مبتكرة في {t}",
    "يُشكل {t} ركيزة أساسية للتقدم الاقتصادي والاجتماعي",
    "تتزايد التحديات المرتبطة بـ{t} في ظل المتغيرات العالمية",
    "يتطلب {t} توظيف أحدث التقنيات والمنهجيات العلمية",
    "تؤكد الأبحاث الحديثة أن {t} يحمل إمكانات هائلة لم تُستغل",
    "يُعزز {t} من قدرة المجتمعات على مواجهة التحديات المعاصرة",
]

CLOSERS = [
    "في الختام، يمكن القول إن {t} يمثل فرصة استثنائية للتقدم البشري شريطة التعامل معه بمسؤولية.",
    "خلاصة القول، يُعد {t} من الركائز الأساسية لبناء مستقبل أفضل للأجيال القادمة.",
    "وبناءً على ما تقدم، نستنتج أن الاستثمار في {t} يُعد خياراً استراتيجياً حكيماً.",
    "في نهاية المطاف، يبقى {t} عنصراً حيوياً في مسيرة التقدم والتنمية الشاملة.",
    "مما سبق يتضح أن {t} يستحق مزيداً من الاهتمام والبحث والتطوير.",
]


def _generate_one_ai_text():
    topic = random.choice(TOPICS)
    t = topic

    # Build text with AI-like structure
    parts = []

    # Opening
    opener = random.choice(OPENERS).replace("{t}", t)
    parts.append(f"{opener} التي شهدت تطوراً ملحوظاً في الآونة الأخيرة.")

    # 2-4 middle sentences with connectors
    num_middles = random.randint(2, 4)
    used_connectors = random.sample(CONNECTORS, min(num_middles, len(CONNECTORS)))
    used_middles = random.sample(MIDDLES, min(num_middles, len(MIDDLES)))

    for conn, mid in zip(used_connectors, used_middles):
        parts.append(f"{conn} {mid.replace('{t}', t)}.")

    # Closing
    closer = random.choice(CLOSERS).replace("{t}", t)
    parts.append(closer)

    return " ".join(parts)


def generate_local_ai_texts(count=8000):
    """توليد نصوص بأسلوب AI متنوع — بدون API."""
    print(f"🤖 توليد {count} نص AI محلياً...")
    generated = []

    for _ in range(count):
        text = _generate_one_ai_text()
        generated.append({"text": text, "label": 1, "source": "generated_local"})

    print(f"  ✓ {len(generated)} نص AI")
    return generated


# ========================
# نصوص بشرية عربية يدوية (ضمان وجود بيانات بشرية)
# ========================
HUMAN_SAMPLES = [
    "الحياة في القرية تختلف كثيرا عن المدينة وأنا شخصيا أفضل الهدوء اللي هناك. لما كنت صغير كنت أروح لجدي كل صيف وألعب مع أولاد الجيران في الحقول. كان عندنا شجرة توت كبيرة جدا في الحوش وكنا نطلع عليها ونأكل توت لحد ما بطوننا تنتفخ.",
    "أمس رحت السوق ولقيت أسعار الخضار غالية مرة الطماط ب8 ريال والله حرام. قلت لأبوي وقال زمان كان الكيلو بريال بس الزمن تغير والله المستعان. المهم اشتريت اللي أحتاجه وطلعت.",
    "ما أدري ليش الناس تحب السهر كثير أنا أفضل أنام بدري وأقوم بدري. الصراحة لما أسهر أحس بتعب ثاني يوم وما أقدر أركز بالدوام. بس المشكلة إن كل أصحابي يسهرون وأنا أحس إني الوحيد اللي ينام بدري.",
    "تخرجت من الجامعة قبل سنتين والحمد لله لقيت وظيفة بسرعة بس الراتب ما يكفي صراحة. إيجار الشقة ياخذ نص الراتب والباقي للأكل والمواصلات. أفكر أدور شغل ثاني بالليل بس خايف أتعب.",
    "كنت أبي أتعلم البرمجة من زمان بس كل مرة أبدأ وأوقف. المرة هذي قلت لازم أكمل وسجلت بدورة على اليوتيوب. الصراحة المحتوى العربي بالبرمجة قليل مقارنة بالإنجليزي بس لقيت قنوات حلوة.",
    "سافرت تركيا الصيف اللي فات وكانت رحلة جميلة جدا. الأكل هناك لذيذ وأسعاره معقولة. زرنا إسطنبول وطرابزون والأجواء كانت رائعة. بس المشكلة الوحيدة كانت الزحمة بالأماكن السياحية.",
    "أخوي الصغير عمره 10 سنين ويحب يلعب بالجوال طول الوقت. أمي تحاول تمنعه بس ما يسمع. أنا أشوف إن الأطفال هالأيام مختلفين عنا لما كنا صغار كنا نلعب بالشارع.",
    "الجو اليوم حر مرة والرطوبة عالية ما تقدر تطلع من البيت. حتى المكيف ما يبرد زين. الحمد لله على نعمة الكهرباء يعني تخيل أجدادنا كيف كانوا يعيشون بدون مكيفات.",
    "رحت المستشفى أمس عشان أراجع على عيني. الدكتور قال عندي ضعف بسيط بالنظر واحتاج نظارة. الصراحة ما كنت أتوقع لأني ما أحس بشي بس الفحص بين غير كذا.",
    "حضرت محاضرة عن الذكاء الاصطناعي بالجامعة وكانت ممتعة. المحاضر شرح كيف الشركات تستخدم AI في حياتنا اليومية بدون ما ندري. بس في نقطة ما اقتنعت فيها وسألته وجاوبني بطريقة حلوة.",
]


def generate_human_samples(count=3000):
    """توليد عينات بشرية من القوالب البشرية مع تنويع."""
    print(f"📝 توليد {count} نص بشري متنوع...")
    generated = []

    dialects = ["", "والله ", "يعني ", "بصراحة ", "الصراحة ", "المهم ", "عموماً "]
    fillers = [" يعني", " بس", " والله", ".. ", " هههه", " 😅", " الحمد لله"]

    for _ in range(count):
        base = random.choice(HUMAN_SAMPLES)
        # Add variation
        if random.random() > 0.5:
            base = random.choice(dialects) + base
        if random.random() > 0.6:
            words = base.split()
            pos = random.randint(len(words) // 3, len(words) * 2 // 3)
            words.insert(pos, random.choice(fillers))
            base = " ".join(words)
        generated.append({"text": base, "label": 0, "source": "human_template"})

    print(f"  ✓ {len(generated)} عينة بشرية")
    return generated


# ========================
def main():
    print("=" * 50)
    print("  جمع بيانات تدريب كاشف النصوص العربية")
    print("=" * 50)

    all_data = []

    # 1. KFUPM (if available)
    all_data.extend(collect_kfupm())

    # 2. نصوص بشرية من HuggingFace
    human_hf = collect_human_texts()
    all_data.extend(human_hf)

    # 3. نصوص بشرية محلية (ضمان)
    if sum(1 for d in all_data if d["label"] == 0) < 5000:
        needed = 5000 - sum(1 for d in all_data if d["label"] == 0)
        all_data.extend(generate_human_samples(needed))

    # 4. نصوص AI محلية
    ai_count_so_far = sum(1 for d in all_data if d["label"] == 1)
    human_count = sum(1 for d in all_data if d["label"] == 0)
    # Balance: generate enough AI to match human
    ai_needed = max(8000, human_count) - ai_count_so_far
    if ai_needed > 0:
        all_data.extend(generate_local_ai_texts(ai_needed))

    random.shuffle(all_data)

    # Stats
    ai_c = sum(1 for d in all_data if d["label"] == 1)
    human_c = len(all_data) - ai_c

    print(f"\n{'=' * 50}")
    print(f"  إجمالي العينات: {len(all_data)}")
    print(f"  AI: {ai_c} | بشري: {human_c}")
    sources = {}
    for d in all_data:
        sources[d["source"]] = sources.get(d["source"], 0) + 1
    for src, cnt in sorted(sources.items(), key=lambda x: -x[1]):
        print(f"    {src}: {cnt}")
    print(f"{'=' * 50}")

    output_file = OUTPUT_DIR / "arabic_ai_detection_dataset.jsonl"
    with open(output_file, "w", encoding="utf-8") as f:
        for item in all_data:
            f.write(json.dumps(item, ensure_ascii=False) + "\n")

    print(f"\n✅ تم الحفظ في: {output_file}")
    print(f"   الحجم: {output_file.stat().st_size / 1024 / 1024:.1f} MB")


if __name__ == "__main__":
    main()
