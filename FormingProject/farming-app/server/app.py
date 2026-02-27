from flask import Flask, request, jsonify
from flask_cors import CORS
import os
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

# Initialize Groq client
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
client = Groq(api_key=GROQ_API_KEY)

# System prompt for the farming assistant
SYSTEM_PROMPT = """You are an expert farming assistant specializing in organic agriculture. 
You provide accurate, practical advice about crop cultivation, pest management, soil health, 
and sustainable farming practices. Base your answers on established agricultural knowledge 
and organic farming principles. Keep responses concise, practical, and focused on the specific 
crop and context provided. If the topic is not about agriculture, crops, farming, forms, kindly respond that you don't know. You should always talk about the organic way of farming, not using any chemical farming methods."""

app = Flask(__name__)

# Configure CORS properly
CORS(app, origins=["http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173"])

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'healthy', 'message': 'Farming Assistant API is running'})

@app.route('/api/chat', methods=['POST', 'OPTIONS'])  # Add OPTIONS method for preflight requests
def chat():
    # Handle preflight OPTIONS request
    if request.method == 'OPTIONS':
        response = jsonify({'status': 'ok'})
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type')
        response.headers.add('Access-Control-Allow-Methods', 'POST')
        return response
    
    try:
        data = request.json
        user_message = data.get('message', '')
        crop_context = data.get('cropContext', '')
        
        print(f"Received message: {user_message}")  # Debug log
        print(f"Crop context: {crop_context}")  # Debug log
        
        # Create conversation messages
        messages = [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "system", "content": f"Context about the current crop: {crop_context}"},
            {"role": "user", "content": user_message}
        ]
        
        # Call Groq API
        completion = client.chat.completions.create(
            model="openai/gpt-oss-120b",  # Free model
            messages=messages,
            temperature=0.7,
            max_tokens=1024,
            top_p=1,
            stream=False
        )
        
        reply = completion.choices[0].message.content
        print(f"Groq response: {reply}")  # Debug log
        
        return jsonify({
            'success': True,
            'reply': reply
        })
        
    except Exception as e:
        print(f"Error: {str(e)}")  # This will show in your Flask terminal
        import traceback
        traceback.print_exc()  # Print full stack trace
        return jsonify({
            'success': False,
            'reply': f'Sorry, I encountered an error: {str(e)}'
        }), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000, host='0.0.0.0')