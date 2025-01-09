from flask import Flask, request, jsonify
from flask_cors import CORS
from werkzeug.utils import secure_filename
import os
from cryptography.hazmat.primitives.asymmetric import rsa, padding
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.exceptions import InvalidSignature

app = Flask(__name__)
CORS(app)

UPLOAD_FOLDER = 'uploads'
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

@app.route('/api/create-keys', methods=['POST'])
def create_keys():
    try:
        # Membuat kunci privat dan publik
        private_key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
        public_key = private_key.public_key()

        # Serialize kunci ke format PEM
        private_pem = private_key.private_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PrivateFormat.PKCS8,
            encryption_algorithm=serialization.NoEncryption()
        )
        
        public_pem = public_key.public_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PublicFormat.SubjectPublicKeyInfo
        )

        return jsonify({
            'private_key': private_pem.decode(),
            'public_key': public_pem.decode()
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/sign', methods=['POST'])
def sign_data():
    try:
        if 'file' not in request.files or 'private_key' not in request.files:
            return jsonify({'error': 'Missing files'}), 400

        data_file = request.files['file']
        private_key_file = request.files['private_key']

        # Baca dan hash data
        data = data_file.read()
        data_hash = hashes.Hash(hashes.SHA256())
        data_hash.update(data)
        hash_value = data_hash.finalize()

        # Baca private key
        private_key = serialization.load_pem_private_key(
            private_key_file.read(),
            password=None
        )

        # Tanda tangan hash
        signature = private_key.sign(
            hash_value,
            padding.PSS(
                mgf=padding.MGF1(hashes.SHA256()),
                salt_length=padding.PSS.MAX_LENGTH
            ),
            hashes.SHA256()
        )

        return jsonify({
            'signature': signature.hex(),
            'hash': hash_value.hex()
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/verify', methods=['POST'])
def verify_data():
    try:
        if 'signature' not in request.files or 'public_key' not in request.files or 'hash' not in request.files:
            return jsonify({'error': 'Missing files'}), 400

        signature_file = request.files['signature']
        public_key_file = request.files['public_key']
        hash_file = request.files['hash']

        # Baca signature
        signature = bytes.fromhex(signature_file.read().decode())
        
        # Baca hash
        hash_value = bytes.fromhex(hash_file.read().decode())
        
        # Baca public key
        public_key = serialization.load_pem_public_key(public_key_file.read())

        # Verifikasi
        public_key.verify(
            signature,
            hash_value,
            padding.PSS(
                mgf=padding.MGF1(hashes.SHA256()),
                salt_length=padding.PSS.MAX_LENGTH
            ),
            hashes.SHA256()
        )

        return jsonify({'status': 'valid'})
    except InvalidSignature:
        return jsonify({'status': 'invalid', 'error': 'Invalid signature'}), 400
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)