# ChatSQL 🦜

ChatSQL is a web application that allows you to interact with your SQL databases using natural language. Powered by LangChain and Groq's Llama3 model, it translates your questions into SQL queries, executes them, and returns the answers in a conversational format.

This project features a modern, real-time streaming interface built with Flask and JavaScript.

## ✨ Features

-   **Natural Language to SQL**: Ask complex questions in plain English without writing any SQL code.
-   **Real-time Streaming**: Watch the AI's response get generated token-by-token.
-   **Multi-Database Support**: Connect to either a local SQLite database or a remote MySQL server.
-   **Modern UI**: A clean, responsive chat interface for a seamless user experience.
-   **Secure Configuration**: Keep your API keys and database credentials safe using environment variables.

## 🛠️ Tech Stack

-   **Backend**: Flask (Python)
-   **AI/LLM**: Groq (Llama3), LangChain
-   **Database**: SQLAlchemy, SQLite, MySQL
-   **Frontend**: HTML, CSS, JavaScript (with Server-Sent Events for streaming)

## 🚀 Getting Started

Follow these steps to set up and run the project locally.

### 1. Clone the Repository

```bash
git clone [https://github.com/your-username/chatsql.git](https://github.com/your-username/chatsql.git)
cd chatsql
