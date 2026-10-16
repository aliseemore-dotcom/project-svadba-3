# Публикация на GitHub Pages (la-fete.ru) и приём заявок

GitHub Pages отдаёт только готовые файлы, поэтому заявки принимает отдельный адрес.
Здесь это Google Apps Script, который пишет заявки в Google Таблицу и по желанию шлёт уведомление в Telegram.
Файл скрипта: `docs/lead-endpoint.gs`.

## 1. Включить публикацию

1. Репозиторий → Settings → Pages → **Build and deployment → Source: GitHub Actions**.
2. Там же Custom domain: `la-fete.ru` (файл `public/CNAME` уже в репозитории). После успешной проверки DNS включите **Enforce HTTPS**.
3. Каждый push в основную ветку запускает workflow `.github/workflows/pages.yml`: тесты, сборка, публикация.

## 2. Приём заявок: Google Таблица

1. Создайте Google Таблицу (пустую), скопируйте её id из ссылки: `docs.google.com/spreadsheets/d/<ID>/edit`.
2. В таблице: Расширения → Apps Script. Вставьте содержимое `docs/lead-endpoint.gs`.
3. Project Settings (шестерёнка) → Script properties → добавьте:
   - `SHEET_ID` — id таблицы;
   - `PRIVACY_VERSION` — например `draft-0` (потом версия утверждённой политики);
   - по желанию `TELEGRAM_BOT_TOKEN` и `TELEGRAM_CHAT_ID`.
4. Deploy → New deployment → тип **Web app**: Execute as — *Me*, Who has access — *Anyone*. Разрешите доступ к таблице. Скопируйте адрес вида `https://script.google.com/macros/s/…/exec`.
5. GitHub → Settings → Secrets and variables → Actions → вкладка **Variables** → New repository variable:
   - имя `LEAD_ENDPOINT`, значение — адрес из шага 4.
6. Запустите публикацию заново: Actions → Deploy to GitHub Pages → Run workflow.

Адрес Apps Script виден в коде сайта. Это нормально: он принимает только заявки, а токены хранятся в свойствах скрипта и наружу не попадают.
После изменения кода скрипта нужно сделать **новое развёртывание** (Deploy → Manage deployments → Edit → New version), иначе действует старая версия.

## 3. Проверка

1. Откройте `https://la-fete.ru`, заполните форму и отправьте.
2. В таблице на листе «Заявки» появится строка. Если в форме показывается ошибка, проверьте, что `LEAD_ENDPOINT` задан и развёртывание открыто для *Anyone*.
3. Пока `LEAD_ENDPOINT` не задан, форма обращается к `/api/lead`, которого на Pages нет, и честно показывает ошибку.

## Ограничения
- У Apps Script нет IP посетителя, поэтому лимит общий (60 заявок в час), а не на каждого посетителя. Защита от повторов по `clientRequestId` работает 6 часов.
- Скрытое поле-ловушка отсекает простых ботов; для серьёзного спама подключите капчу.
- Адрес в браузере открывается без `/api`: страницы `/privacy`, `/terms`, `/raffle-rules` собираются как отдельные файлы (`scripts/postbuild.mjs`).
