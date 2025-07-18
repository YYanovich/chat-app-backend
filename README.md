# Real-Time Chat Application (Backend)

Це серверна частина для [**додатку Real-Time Chat (Frontend)**](https://github.com/YYanovich/chat-app-frontend). Цей сервер відповідає за бізнес-логіку, автентифікацію користувачів, збереження даних та обмін повідомленнями в реальному часі.

## Опис проекту

Сервер побудований на Node.js та Express, використовує MongoDB як базу даних для зберігання користувачів та повідомлень. Для обміну повідомленнями в реальному часі інтегровано Socket.IO, що дозволяє миттєво доставляти повідомлення всім підключеним клієнтам. Автентифікація реалізована за допомогою JWT (JSON Web Tokens).

## Стек технологій

   **Node.js:** Середовище виконання JavaScript.
   **Express:** Веб-фреймворк для створення REST API.
   **MongoDB:** NoSQL база даних для зберігання даних.
   **Mongoose:** ODM для моделювання об'єктів та роботи з MongoDB.
   **Socket.IO:** Бібліотека для обміну даними в реальному часі.
   **JSON Web Token (JWT):** Для безпечної автентифікації та авторизації.
   **bcryptjs:** Для хешування паролів користувачів.

## API та Функціонал

### REST API Endpoints:
   `POST /api/auth/register`: Реєстрація нового користувача.
   `POST /api/auth/login`: Вхід користувача та отримання JWT.
   `GET /api/messages/general`: Отримання історії повідомлень загального чату.
   `GET /api/messages/:userId`: Отримання історії приватного чату з іншим користувачем.

### WebSocket Events:
   `connection`: Обробка нового підключення клієнта.
   `getUsers`: Відправка списку онлайн-користувачів.
   `message`: Обробка нового повідомлення в загальному чаті.
   `private_message`: Обробка приватного повідомлення.
   `disconnect`: Обробка відключення клієнта.

## Як запустити локально

1.  Клонуйте репозиторій:
    ```bash
    git clone https://github.com/YYanovich/chat-app-backend.git
    ```
2.  Встановіть залежності:
    ```bash
    npm install
    ```
3.  Створіть файл `.env` в кореневій папці проекту та додайте до нього ваші змінні середовища:
    ```env
    MONGO_URI=your_mongodb_connection_string
    JWT_SECRET=your_super_secret_key
    PORT=5001
    ```
4.  Запустіть сервер:
    ```bash
    npm start
    ```
5.  **Важливо:** Для тестування функціоналу потрібен запущений [клієнт (фронтенд)](https://github.com/YYanovich/chat-app-frontend).