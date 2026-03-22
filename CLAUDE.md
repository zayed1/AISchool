# كاشف النصوص العربية المولدة بالذكاء الاصطناعي

## التشغيل المحلي

### Backend
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

## الهيكل
- `backend/` — FastAPI + تحليل إحصائي + نموذج ML
- `frontend/` — React + Vite + Tailwind (RTL)
