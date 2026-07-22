import os
from flask import Flask, render_template
from flask_socketio import SocketIO, emit

app = Flask(__name__)
app.config['SECRET_KEY'] = 'super_secret_study_key'
socketio = SocketIO(app, cors_allowed_origins="*")

# --- WEB ROUTE ---
@app.route('/')
def index():
    return render_template('index.html')

# --- WEBSOCKET EVENTS ---
@socketio.on('sync_matrix')
def handle_matrix_sync(data):
    emit('partner_matrix_updated', data, broadcast=True, include_self=False)

@socketio.on('send_xp_boost')
def handle_boost(data):
    emit('receive_xp_boost', data, broadcast=True, include_self=False)

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5000))
    socketio.run(app, host='0.0.0.0', port=port)