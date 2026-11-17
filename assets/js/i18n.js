// Interface translations (navigation, greetings and main page titles).
// University and scholarship data stays in English, like on official sites.
const D = {
  en: {
    home: 'Home', explore: 'Explore', plan: 'Plan', create: 'Create', community: 'Community', library: 'Library',
    saved: 'Saved', universities: 'Universities', scholarships: 'Scholarships', majors: 'Majors', compare: 'Compare',
    dream: 'Dream School', applications: 'Applications', calendar: 'Calendar', tests: 'Tests & Prep',
    essays: 'Essays', 'essay-library': 'Essay library', ai: 'Vertex AI', channels: 'Channels',
    resources: 'Resources', files: 'Files', health: 'Data Health', profile: 'Profile & goals', personalize: 'Personalize', signout: 'Sign out',
    morning: 'Good morning', afternoon: 'Good afternoon', evening: 'Good evening', search: 'Search universities, scholarships, majors…',
  },
  uz: {
    home: 'Bosh sahifa', explore: 'Kashf qilish', plan: 'Reja', create: 'Yaratish', community: 'Hamjamiyat', library: 'Kutubxona',
    saved: 'Saqlanganlar', universities: 'Universitetlar', scholarships: 'Stipendiyalar', majors: 'Mutaxassisliklar', compare: 'Taqqoslash',
    dream: 'Orzudagi universitet', applications: 'Arizalar', calendar: 'Kalendar', tests: 'Testlar va tayyorgarlik',
    essays: 'Esselar', 'essay-library': 'Esse kutubxonasi', ai: 'Vertex AI', channels: 'Kanallar',
    resources: 'Manbalar', files: 'Fayllar', health: "Ma'lumotlar holati", profile: 'Profil va maqsadlar', personalize: 'Sozlash', signout: 'Chiqish',
    morning: 'Xayrli tong', afternoon: 'Xayrli kun', evening: 'Xayrli kech', search: 'Universitet, stipendiya, mutaxassislik qidirish…',
  },
  ru: {
    home: 'Главная', explore: 'Обзор', plan: 'План', create: 'Создать', community: 'Сообщество', library: 'Библиотека',
    saved: 'Избранное', universities: 'Университеты', scholarships: 'Стипендии', majors: 'Специальности', compare: 'Сравнить',
    dream: 'Университет мечты', applications: 'Заявки', calendar: 'Календарь', tests: 'Тесты и подготовка',
    essays: 'Эссе', 'essay-library': 'Библиотека эссе', ai: 'Vertex AI', channels: 'Каналы',
    resources: 'Ресурсы', files: 'Файлы', health: 'Качество данных', profile: 'Профиль и цели', personalize: 'Персонализация', signout: 'Выйти',
    morning: 'Доброе утро', afternoon: 'Добрый день', evening: 'Добрый вечер', search: 'Поиск университетов, стипендий, специальностей…',
  },
};
let lang = 'en';
export const setLang = (l) => { lang = D[l] ? l : 'en'; };
export const t = (k) => D[lang]?.[k] ?? D.en[k] ?? k;
