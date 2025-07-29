# app.py

import os
from dotenv import load_dotenv
from flask import Flask, render_template, request, Response, jsonify
from langchain.sql_database import SQLDatabase
from langchain.agents import create_sql_agent
from langchain.agents.agent_toolkits import SQLDatabaseToolkit
from langchain_groq import ChatGroq
from sqlalchemy import create_engine
import traceback

# Load environment variables from .env file
load_dotenv()

# Initialize Flask app
app = Flask(__name__)

def get_db_connection(type, host=None, user=None, password=None, db_name=None): # <-- FIX IS HERE
    """Configures and returns the database connection."""
    if type == "sqlite":
        # Assumes student.db is in the same directory as app.py
        db_path = os.path.join(os.path.dirname(__file__), "student.db")
        if not os.path.exists(db_path):
            raise FileNotFoundError("student.db not found. Please run sqlite.py to create it.")
        return SQLDatabase.from_uri(f"sqlite:///{db_path}")
    elif type == "mysql":
        if not all([host, user, password, db_name]):
            raise ValueError("Missing MySQL connection details.")
        connection_string = f"mysql+mysqlconnector://{user}:{password}@{host}/{db_name}"
        return SQLDatabase(create_engine(connection_string))
    else:
        raise ValueError("Unsupported database type.")

def stream_agent_response(user_query, db_config):
    """
    Sets up the LangChain agent and streams its response.
    """
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        yield "data: [ERROR] Groq API key not found. Please set it in your .env file.\n\n"
        return

    try:
        db = get_db_connection(**db_config)
        llm = ChatGroq(model_name="llama3-8b-8192", groq_api_key=api_key, temperature=0)
        toolkit = SQLDatabaseToolkit(db=db, llm=llm)
        agent = create_sql_agent(llm=llm, toolkit=toolkit, verbose=True)

        # Use the agent's stream method
        for chunk in agent.stream({"input": user_query}):
            if "output" in chunk:
                yield f"data: {chunk['output'].replace('\n', '<br>')}\n\n"

    except Exception as e:
        # Log the full error for debugging
        print(f"An error occurred: {traceback.format_exc()}")
        # Send a user-friendly error message to the frontend
        yield f"data: [ERROR] An unexpected error occurred: {str(e)}\n\n"

    # Signal the end of the stream
    yield "data: [END_OF_STREAM]\n\n"

@app.route('/')
def index():
    """Renders the main chat page."""
    return render_template('index.html')

@app.route('/chat', methods=['POST'])
def chat():
    """Handles the chat request and returns a streaming response."""
    data = request.json
    user_query = data.get("query")
    db_config = data.get("db_config")

    if not user_query or not db_config:
        return jsonify({"error": "Missing query or db_config"}), 400
        
    return Response(stream_agent_response(user_query, db_config), mimetype='text/event-stream')

if __name__ == '__main__':
    app.run(debug=True, port=5001)