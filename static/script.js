// static/script.js
document.addEventListener('DOMContentLoaded', () => {
    const chatForm = document.getElementById('chat-form');
    const userInput = document.getElementById('user-input');
    const chatBox = document.getElementById('chat-box');
    const settingsForm = document.getElementById('settings-form');
    const mysqlConfig = document.getElementById('mysql-config');

    // Toggle MySQL settings visibility
    settingsForm.addEventListener('change', (e) => {
        if (e.target.name === 'db_type') {
            mysqlConfig.classList.toggle('hidden', e.target.value !== 'mysql');
        }
    });

    // Handle chat form submission
    chatForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const query = userInput.value.trim();
        if (!query) return;

        // Display user message
        appendMessage(query, 'user-message');
        userInput.value = '';
        userInput.focus();

        // Create a placeholder for the assistant's response
        const assistantMessageElement = appendMessage('', 'assistant-message');
        const assistantParagraph = assistantMessageElement.querySelector('p');
        assistantParagraph.innerHTML = '<span class="blinking-cursor"></span>';

        // Get DB configuration
        const dbType = document.querySelector('input[name="db_type"]:checked').value;
        const dbConfig = { type: dbType };
        if (dbType === 'mysql') {
            dbConfig.host = document.getElementById('mysql-host').value;
            dbConfig.user = document.getElementById('mysql-user').value;
            dbConfig.password = document.getElementById('mysql-password').value;
            dbConfig.db_name = document.getElementById('mysql-db').value;
        }

        try {
            // --- NEW: Use fetch for streaming POST request ---
            const response = await fetch('/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query, db_config: dbConfig })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let fullResponse = '';
            
            // Remove the blinking cursor once we start receiving data
            const cursor = assistantParagraph.querySelector('.blinking-cursor');
            if (cursor) cursor.remove();

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                const lines = chunk.split('\n\n');
                
                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const data = line.substring(6);
                        if (data === '[END_OF_STREAM]') {
                            return;
                        }
                         if (data.startsWith('[ERROR]')) {
                            fullResponse += `<span class="error-text">${data}</span>`;
                        } else {
                            fullResponse += data;
                        }
                        assistantParagraph.innerHTML = fullResponse;
                        chatBox.scrollTop = chatBox.scrollHeight;
                    }
                }
            }
        } catch (error) {
            assistantParagraph.innerHTML = `<span class="error-text">Error connecting to the server: ${error.message}</span>`;
        }
    });

    function appendMessage(text, className) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${className}`;
        const paragraph = document.createElement('p');
        paragraph.innerHTML = text;
        messageDiv.appendChild(paragraph);
        chatBox.appendChild(messageDiv);
        chatBox.scrollTop = chatBox.scrollHeight;
        return messageDiv;
    }
    
    // Add blinking cursor style
    const style = document.createElement('style');
    style.innerHTML = `
        .blinking-cursor {
            display: inline-block;
            width: 8px;
            height: 1em;
            background-color: #f0f0f0;
            animation: blink 1s step-end infinite;
        }
        @keyframes blink {
            from, to { background-color: transparent }
            50% { background-color: #f0f0f0; }
        }
        .error-text { color: #ff6b6b; font-weight: bold; }
    `;
    document.head.appendChild(style);
});