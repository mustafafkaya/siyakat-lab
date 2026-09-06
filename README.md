# SİYAKAT-LAB — V1 İskeleti

Bu depo, `SIYAKAT-LAB-Yol-Haritasi.md` dosyasındaki yol haritasına göre V1
("Dijital Siyakat Atlası") aşamasının veri bağımsız iskeletidir.

## Mimari

```
siyakat-lab/
  backend/     FastAPI + PostgreSQL (V1'den V4'e kadar tek backend)
  frontend/    Next.js + TypeScript + Tailwind
  docker-compose.yml
```

### Neden bu mimari genişletilebilir?

- **Storage soyutlaması** (`backend/app/services/storage.py`): Bugün dosyalar
  yerelde tutuluyor. İleride S3'e geçmek için tek yapılacak şey yeni bir
  `StorageBackend` sınıfı yazmak — API kodu değişmez.
- **AI servis arayüzü** (`backend/app/services/ai_service.py`): V1'de
  `DummyAIService` sahte sonuç döner. V2'de gerçek model `RealAIService` olarak
  eklenecek; `/api/v1/ai/predict` endpoint'inin sözleşmesi hiç değişmeyecek.
- **Veri modeli** (`backend/app/models/sample.py`): V2/V3'te gelecek AI ve
  biçimsel analiz alanları (grid_features, ductus_annotation, embedding, vb.)
  şimdiden nullable olarak tabloya eklendi. Böylece büyük migration'lar yerine
  sadece bu alanlar doldurulacak.
- **Modüler router** (`backend/app/api/v1/router.py`): Her yeni özellik modülü
  kendi endpoint dosyasında yaşar, tek satırla router'a bağlanır.

## Çalıştırma

```bash
cp backend/.env.example backend/.env
docker compose up --build
```

- Backend: http://localhost:8000/docs (Swagger UI)
- Frontend: http://localhost:3000

İlk çalıştırmada veritabanı tabloları için migration oluşturmanız gerekir:

```bash
docker compose exec backend alembic revision --autogenerate -m "ilk semalar"
docker compose exec backend alembic upgrade head
```

## Şu an tamamlanan (Yol haritası madde 4-A, 4-B, 4-C, 4-D, 4-E)

- [x] Proje repository yapısı
- [x] Backend/Frontend teknoloji seçimi
- [x] Auth (kayıt/giriş, JWT, rol bazlı yetkilendirme: admin/expert/user)
- [x] Belge yükleme/listeleme
- [x] Siyakat örneği oluşturma (kırpılmış görsel + koordinat)
- [x] Arama / filtreleme (bölge, dönem, belge türü, doğrulama durumu, serbest metin)
- [x] Karşılaştırma endpoint'i ve arayüzü
- [x] Uzman doğrulama akışı (draft → pending_review → verified/rejected) + değişiklik geçmişi
- [x] AI servis arayüzü (dummy, V2'de gerçek modelle değiştirilecek)
- [x] Dummy veriyle çalışan arayüz ekranları (ana sayfa, atlas, arama, detay, karşılaştırma, uzman paneli, giriş)

## Sırada ne var

Yol haritası madde 9'a göre öncelik:
- Ductus anotasyon aracı (madde 4-F) — görsel üzerinde nokta/çizgi işaretleme arayüzü
- Frontend'i gerçek backend API'sine bağlama (şu an dummy veri kullanıyor)
- Dosya/görsel yükleme arayüzünün (kırpma aracı dahil) frontend'de geliştirilmesi
- Test altyapısı (pytest + backend, gerekirse Playwright + frontend)

Gerçek veri geldiğinde: `backend/app/models/` içindeki alanlar bilimsel ekiple
netleştirilip küçük migration'larla genişletilecek — mevcut sistem bozulmayacak.
