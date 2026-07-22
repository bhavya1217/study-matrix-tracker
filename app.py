from flask import Flask
from flask_socketio import SocketIO, emit

app = Flask(__name__)
app.config['SECRET_KEY'] = 'super_secret_study_key'
# CORS allows your frontend HTML to talk to this Python backend securely
socketio = SocketIO(app, cors_allowed_origins="*")

@socketio.on('sync_matrix')
def handle_matrix_sync(data):
    emit('partner_matrix_updated', data, broadcast=True, include_self=False)


@socketio.on('send_xp_boost')
def handle_boost(data):
    emit('receive_xp_boost', data, broadcast=True, include_self=False)

if __name__ == '__main__':
    print("🚀 Study Buddy Server running on http://127.0.0.1:5000")
    socketio.run(app, debug=True, port=5000)