# Дизайн-система Image Pipeline

> Документ описывает визуальное оформление сайта imagepipeline.art — стили, цвета, типографику, отступы, компоненты и правила построения интерфейса.

---

## 1. Общая информация

| Параметр | Значение |
|----------|----------|
| Стек | React 19 + TypeScript 6 + Vite 8 |
| CSS-фреймворк | Tailwind CSS v4 (CSS-first конфигурация, без `tailwind.config.js`) |
| Иконки | Lucide React |
| Графический редактор | @xyflow/react (ReactFlow) |
| Анимации | CSS-переходы (Tailwind) + кастомные CSS-ключевые кадры (shimmer) |
| Режим | **Только тёмная тема** — светлой темы нет |

---

## 2. Цветовая палитра

### 2.1 Фоновые цвета

| Цвет | Tailwind / значение | Применение |
|------|---------------------|------------|
| `#0D0D14` | `bg-[#0D0D14]` | Основной фон страниц, канвас редактора |
| `#0D0D12` | `bg-[#0D0D12]` | Боковые панели (сайдбары) |
| `#111118` | `bg-[#111118]` | Шапка (header), модальные окна, скелетон-заглушки |
| `#1A1A24` | `bg-[#1A1A24]` | Фон ReactFlow, скроллбар, тултипы, карточки, MiniMap |
| `#2A2A3A` | `bg-[#2A2A3A]` | Cookie-баннер |
| `black/50` | `bg-black/50` | Затемнение (оверлей) модальных окон |
| `white/5` | `bg-white/5` | Поля ввода, кнопки, разделители, состояние hover |
| `white/[0.02]` | `bg-white/[0.02]` | Карточки, секции с фичами |
| `black/40` | `bg-black/40` | Подложка превью изображений |

### 2.2 Акцентные (брендовые) цвета

| Роль | Цвет | Tailwind | Применение |
|------|------|----------|------------|
| **Основной акцент** | `#F59E0B` | `amber-500` | Кнопки CTA, активные табы, бейджи, прогресс-бар, ползунки, рёбра ReactFlow, популярный план |
| Второстепенный | `#34D399` | `emerald-400` | Выделенные рёбра в ReactFlow |
| Успех | `#4ADE80` | `green-400` | Иконки готовых файлов, индикаторы |
| Ошибка | `#F87171` | `red-400` | Иконки ошибок |
| Предупреждение | `#F59E0B` | `amber-500` | Индикаторы заполнения (80%+) |

### 2.3 Цвета текста

| Цвет | Tailwind | Применение |
|------|----------|------------|
| `#E2E8F0` | (умолчание) | Основной текст body |
| `#F5F5F5` | `text-gray-100` | Заголовки, первичный текст |
| `#E2E8F0` | `text-gray-200` | Подписи узлов, кнопки, тело |
| `#D1D5DB` | `text-gray-300` | Вторичный текст, hover-состояния |
| `#9CA3AF` | `text-gray-400` | Описания, подсказки, метки секций |
| `#6B7280` | `text-gray-500` | Приглушённый текст, disabled |
| `#4B5563` | `text-gray-600` | Слабые подсказки |
| `#374151` | `text-gray-700` | Иконки disabled |
| `#FBBF24` | `text-amber-400` | Акцентный текст |
| `#F59E0B` | `text-amber-500` | Акцент, предупреждения |
| `#000000` | `text-black` | Текст на акцентных кнопках |
| `#FCD34D` | `text-amber-300` | Адрес кошелька |
| `#4ADE80` | `text-green-400` | Успешные состояния |
| `#F87171` | `text-red-400` | Ошибки, корзина при наведении |

### 2.4 Цвета границ

| Цвет | Tailwind | Применение |
|------|----------|------------|
| `rgba(255,255,255,0.05)` | `border-white/5` | Сайдбары, хедер, разделители, карточки |
| `rgba(255,255,255,0.10)` | `border-white/10` | Поля ввода, селекты, модалки, контейнеры превью |
| `rgba(255,255,255,0.20)` | `border-white/20` | Uploader при наведении |
| `rgba(245,158,11,0.40)` | `border-amber-500/40` | Популярный план (карточка Pricing) |
| `rgba(245,158,11,0.50)` | `border-amber-400/50` | Drag-and-drop индикатор |
| `#555570` | `border-[#555570]` | Кнопки cookie-баннера |

### 2.5 Цвета узлов (по типу)

| Тип узла | Граница | Фон |
|----------|---------|-----|
| load | `border-blue-500/50` | `bg-blue-500/10` |
| resize | `border-green-500/50` | `bg-green-500/10` |
| crop | `border-purple-500/50` | `bg-purple-500/10` |
| compress | `border-yellow-500/50` | `bg-yellow-500/10` |
| format | `border-cyan-500/50` | `bg-cyan-500/10` |
| watermark | `border-pink-500/50` | `bg-pink-500/10` |
| denoise | `border-indigo-500/50` | `bg-indigo-500/10` |
| emotion | `border-purple-500/50` | `bg-purple-500/10` |
| saturation | `border-pink-500/50` | `bg-pink-500/10` |
| brightness | `border-yellow-500/50` | `bg-yellow-500/10` |
| contrast | `border-blue-500/50` | `bg-blue-500/10` |
| exposure | `border-red-500/50` | `bg-red-500/10` |
| rename | `border-orange-500/50` | `bg-orange-500/10` |
| export | `border-red-500/50` | `bg-red-500/10` |

---

## 3. Типографика

### 3.1 Шрифт

```
font-family: system-ui, -apple-system, sans-serif;
```

Системный шрифт — без загрузки кастомных гарнитур.

### 3.2 Размеры

| Размер | Tailwind | Применение |
|--------|----------|------------|
| 10px | `text-[10px]` | Подсказки, таймстемпы, счётчики, бейджи |
| 11px | `text-[11px]` | Индикатор использования |
| 12px | `text-xs` | Описания, лейблы, имена файлов |
| 14px | `text-sm` | Основной текст, кнопки, поля ввода |
| 16px | `text-base` | Название приложения в шапке |
| 18px | `text-lg` | Заголовки модалок, заголовки узлов |
| 20px | `text-xl` | CTA-кнопки на лендинге |
| 24px | `text-2xl` | Секционные заголовки, цифры статистики |
| 30px | `text-3xl` | Заголовки страниц (Pricing, FAQ) |
| 48px | `text-5xl` | Главный заголовок лендинга (hero) |

### 3.3 Насыщенность

| Насыщенность | Tailwind | Применение |
|-------------|----------|------------|
| 500 | `font-medium` | Кнопки, лейблы табов, имена файлов |
| 600 | `font-semibold` | Заголовки секций, подписи |
| 700 | `font-bold` | Название приложения, цены, CTA |

### 3.4 Регистр и межбуквенный интервал

```css
className="text-xs font-semibold text-gray-400 uppercase tracking-wider"
```
Используется для: заголовков секций в сайдбаре, меток типов узлов, заголовков настроек.

---

## 4. Отступы и интервалы

### 4.1 Padding (внутренние отступы)

| Tailwind | Применение |
|----------|------------|
| `px-6 py-16` | Секции лендинга |
| `p-6` | Модальные окна, карточки |
| `p-4` | Панель настроек, cookie-баннер |
| `p-3` | Содержимое сайдбара, список узлов |
| `px-4 py-1.5` | Кнопки тулбара |
| `px-3 py-2.5` | Элементы сайдбара, кнопки |
| `px-3 py-2` | Поля ввода, select |
| `px-2 py-1.5` | Элементы списка файлов |
| `p-1.5` | Иконки-кнопки, действия над превью |
| `px-2 py-1` | Бейджи, переключатель языка |
| `px-5 py-2.5` | Кнопки CTA |
| `px-10 py-4` | CTA в hero-секции |

### 4.2 Gap (расстояния между элементами)

| Tailwind | Применение |
|----------|------------|
| `gap-1` | Группы иконок |
| `gap-1.5` | Пара иконка + текст в кнопке |
| `gap-2` | Элементы в flex, поля формы |
| `gap-3` | Действия в шапке, элементы сайдбара |
| `gap-4` | Секции страниц, группа CTA |
| `gap-6` | Сетки, секции лендинга |
| `gap-8` | Колонки статистики |

### 4.3 Margin (внешние отступы)

| Tailwind | Применение |
|----------|------------|
| `mb-2` | Подписи секций |
| `mb-3` | Заголовки карточек |
| `mb-4` | Контент модалок, группы форм |
| `mb-6` | Контент карточек Pricing, email-форма |
| `mb-8` | Описание в hero-секции |
| `mb-10` | Расстояние между секциями |
| `mb-12` | Секция перед Pricing |
| `mt-2` | Описание под CTA |
| `mt-4` | Кнопки cookie-баннера |
| `mt-8` | Секция CTA |

### 4.4 Space-Y

| Tailwind | Применение |
|----------|------------|
| `space-y-1` | Список файлов |
| `space-y-1.5` | Палитра узлов, группы полей |
| `space-y-2` | Список сохранённых пайплайнов |
| `space-y-2.5` | Списки фич |
| `space-y-3` | Секции CryptoModal |
| `space-y-4` | Секции настроек |

---

## 5. Скругления (Border Radius)

| Радиус | Tailwind | Применение |
|--------|----------|------------|
| 4px | `rounded` | Скелетоны |
| 8px | `rounded-lg` | **Основной**: кнопки, инпуты, карточки, файлы |
| 12px | `rounded-xl` | Модалки, узлы (node), uploader, карточки Pricing |
| 16px | `rounded-2xl` | Карточки фич, cookie-баннер, шаги лендинга |
| 9999px | `rounded-full` | Бейджи, тогглы, аватарки, ползунки |

---

## 6. Тени

| Тень | Применение |
|------|------------|
| `shadow-lg` | Базовые карточки узлов |
| `shadow-2xl` | Модальные окна, cookie-баннер |
| `shadow-[0_4px_15px_rgba(245,158,11,0.4)]` | CTA-кнопка (свечение) |
| `shadow-[0_8px_25px_rgba(245,158,11,0.5)]` | CTA-кнопка (hover) |
| `shadow-[0_20px_40px_rgba(0,0,0,0.3)]` | Демо-изображение |
| `shadow-amber-400/20` | Выделенный узел (в комбинации с ring) |
| `shadow-lg shadow-amber-500/25` | Кнопка Accept cookie |
| `box-shadow: 0 0 0 9999px rgba(0,0,0,0.6)` | Подсветка онбординга |

---

## 7. Структура макета

### 7.1 Лендинг

```
[Шапка]
[Hero (48px заголовок + CTA)]
[Демо]
[Как работает (3 шага)]
[Фичи (сетка)]
[Статистика]
[FAQ]
[Footer]
```

Контейнер: `max-w-6xl mx-auto px-6`

### 7.2 Редактор (3 колонки)

```
┌─────────────────────────────────────────────────┐
│  Header (h-14 = 56px) bg-[#111118]             │
├────────┬───────────────────────────┬─────────────┤
│ Левый  │      Flow Canvas          │  Правый     │
│ сайдбар│      (flex-1)             │  сайдбар    │
│ (w-60) │                           │  (w-72)     │
│        │                           │  (условно)  │
└────────┴───────────────────────────┴─────────────┘
```

- Шапка: `h-14 flex items-center justify-between px-4 bg-[#111118] border-b border-white/5`
- Левый сайдбар: `w-60 bg-[#0D0D12] border-r border-white/5`
- Правый сайдбар: `w-72 bg-[#0D0D12] border-l border-white/5`
- Canvas: `flex-1 relative`

### 7.3 Адаптивность

| Брейкпоинт | Ширина | Поведение |
|-----------|--------|-----------|
| `sm` | 640px | Показывать лейбл "Process" в шапке |
| `md` | 768px | 3-колоночная сетка Pricing |
| `lg` | 1024px | Сайдбары из overlay становятся статичными |

На мобильных: сайдбары — оверлеи `fixed z-40` с `translate-x` transition, фон — `bg-black/50`.

### 7.4 Страницы контента (FAQ, Privacy, Terms)

`min-h-screen max-w-3xl mx-auto px-6`

---

## 8. Компоненты

### 8.1 Кнопки

| Тип | Стиль |
|-----|-------|
| Основная (CTA) | `bg-amber-500 text-black font-bold rounded-lg px-5 py-2.5` |
| Основная (hover) | `hover:bg-amber-400 hover:-translate-y-0.5 hover:shadow-[0_8px_25px_rgba(245,158,11,0.5)]` |
| Вторичная | `bg-white/5 text-gray-200 border border-white/5 rounded-lg px-3 py-2` |
| Вторичная (hover) | `hover:bg-white/10` |
| Иконка-кнопка | `p-1.5 hover:bg-white/5 rounded-lg transition-colors` |
| Disabled | `opacity-50 cursor-not-allowed` |

### 8.2 Поля ввода

```tsx
className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-200
           placeholder:text-gray-500 focus:outline-none focus:border-amber-500/50"
```

- Числовые поля: `w-16 bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-sm text-gray-200 text-center`
- Range-ползунки: `w-full accent-amber-500`

### 8.3 Select

Стандартный Tailwind + переопределение option в глобальном CSS:
```css
select option { background: #0D0D14; color: #E2E8F0; }
```

### 8.4 Тоггл (переключатель)

Кастомный, без библиотек:
```tsx
<div className="w-9 h-5 bg-white/10 rounded-full peer peer-checked:bg-amber-500
  after:content-[''] after:absolute after:top-[2px] after:left-[2px]
  after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all
  peer-checked:after:translate-x-4" />
```

### 8.5 Модальные окна

- Фон: `bg-[#111118] border border-white/10 rounded-xl p-6`
- Затемнение: `bg-black/50`
- Размер: `max-w-md` (по умолчанию), `95vw` (сравнение)
- Shadow: `shadow-2xl`

### 8.6 Бейджи / План

```tsx
// Бесплатный
className="text-xs font-medium px-2 py-1 rounded-full bg-gray-800 text-gray-400"
// Платный
className="text-xs font-medium px-2 py-1 rounded-full bg-amber-500/20 text-amber-400"
```

### 8.7 Прогресс-бар

```tsx
<div className="w-full bg-white/5 rounded-full h-2">
  <div className="bg-amber-400 h-full rounded-full transition-all duration-300"
       style={{ width: `${percentage}%` }} />
</div>
```

### 8.8 Скелетон (загрузка)

Градиентная анимация:
```css
.skeleton {
  background: linear-gradient(90deg, #1A1A24 25%, #22222e 50%, #1A1A24 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s ease-in-out infinite;
}
```

### 8.9 File Uploader (drag-and-drop)

```tsx
className={cn(
  "border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-200",
  isDragOver
    ? "border-amber-400 bg-amber-400/5"       // состояние наведения файла
    : "border-white/10 hover:border-white/20 bg-white/[0.02]"  // обычное
)}
```

### 8.10 Spinner (лоадер)

```tsx
<span className="w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
```

---

## 9. Иконки

Библиотека: **Lucide React**

| Иконка | Использование |
|--------|---------------|
| `Play` | Кнопка процесса |
| `Ban` | Блокировка |
| `Save` | Сохранение |
| `Undo2` / `Redo2` | История |
| `Menu` | Мобильное меню |
| `HelpCircle` | FAQ / помощь |
| `Layers` | Палитра узлов |
| `FileImage` | Файлы |
| `Bookmark` | Сохранённое |
| `Trash2` | Удаление |
| `Upload` | Загрузка |
| `CheckCircle2` | Готово |
| `Loader2` | Обработка |
| `AlertCircle` | Ошибка |
| `Lock` | Блокировка (лимит) |
| `Download` | Скачивание |
| `ArrowRight` | Навигация, CTA |
| `ChevronDown` | FAQ-аккордеон |
| `ExternalLink` | Внешние ссылки |
| `Check` | Фичи в Pricing, успех |
| `Copy` | Копирование адреса |
| `Mail` | Отправка чека |
| `Shield` | Фича лендинга |

Эмодзи-иконки для типов узлов в палитре:
```
📂 📐 ✂️ 📦 🔄 © 🧹 🎭 🎨 ☀️ ◐ 🔆 ✏️ 💾
```

Размеры: `w-4 h-4` (16px), `w-5 h-5` (20px), `w-3.5 h-3.5` (14px)

---

## 10. Анимации и переходы

| Тип | Применение |
|-----|------------|
| `transition-colors` | Кнопки, ссылки, hover-эффекты (наиболее частый) |
| `transition-all duration-200` | Узлы, drag-and-drop зона |
| `transition-all duration-150` | Элементы палитры узлов |
| `transition-transform duration-200` | Сайдбары (мобильные) |
| `transition-opacity` | Кнопка удаления файла, мобильный оверлей |
| `animate-spin` | Spinner загрузки/обработки |
| `animate-pulse` | Скелетон редактора |
| `shimmer` (1.5s) | Скелетон страницы |
| `hover:-translate-y-0.5` | CTA-кнопка (подъём) |

---

## 11. ReactFlow (графический редактор)

| Элемент | Стиль |
|---------|-------|
| Фон | `color="#1A1A24" gap={20} size={1}` |
| Рёбра (по умолчанию) | `stroke: #F59E0B, strokeWidth: 2, animated: true` |
| Рёбра (выделенные) | `stroke: #34D399, strokeWidth: 3` |
| Элементы управления | `bg-[#1A1A24] border-white/10 fill-gray-400` |
| Элементы управления (hover) | `bg-[#22222e]` |
| MiniMap | Кастомный фон |
| Attribution | Скрыт |
| Zoom | `minZoom: 0.1, maxZoom: 4` |

---

## 12. Скроллбар

```css
scrollbar-width: thin;
scrollbar-color: #1A1A24 transparent;
```

---

## 13. Состояния файлов и иконки статусов

| Состояние | Иконка + цвет |
|-----------|---------------|
| Готово | `CheckCircle2 text-green-400` |
| Обрабатывается | `Loader2 text-amber-400 animate-spin` |
| Ошибка | `AlertCircle text-red-400` |
| Блокировка (размер) | `Lock text-amber-500/60` |
| Блокировка (формат) | `AlertCircle text-amber-500/60` |

---

## 14. Выделенный узел (selected state)

```tsx
className={cn(
  "ring-2 ring-amber-400/70 shadow-amber-400/20",
  selected && "shadow-lg"
)}
```

---

## 15. Ключевые файлы дизайн-системы

| Файл | Содержание |
|------|------------|
| `src/index.css` | Глобальные стили, импорт Tailwind, ReactFlow-оверрайды |
| `src/lib/utils.ts` | Функция `cn()` для мержа классов |
| `src/components/nodes/BaseNode.tsx` | Цветовая карта узлов |
| `src/components/layout/EditorLayout.tsx` | Основной 3-колоночный макет |
| `src/components/layout/Sidebar.tsx` | Стили сайдбара + адаптивность |
| `src/components/pipeline/NodeSettings.tsx` | Все стили форм (инпуты, тогглы, селекты) |
| `src/components/pricing/PricingPage.tsx` | Карточки Pricing |
| `src/components/landing/LandingPage.tsx` | Hero, CTA, фичи |
| `index.html` | Скелетон-заглушка, preload |

---

## 16. Зависимости, связанные с дизайном

| Пакет | Статус |
|-------|--------|
| `tailwindcss` 4.3.2 | Используется |
| `@tailwindcss/vite` 4.3.2 | Используется |
| `clsx` 2.1.1 | Используется (через `cn()`) |
| `tailwind-merge` 3.6.0 | Используется (через `cn()`) |
| `lucide-react` 1.22.0 | Используется |
| `class-variance-authority` 0.7.1 | Не используется (установлен) |
| `framer-motion` 12.42.0 | Не используется (установлен) |
