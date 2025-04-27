import http.server
import socketserver
import webbrowser
import os
from urllib.parse import urlparse

# Configuration
PORT = 8000
DIRECTORY = os.path.dirname(os.path.abspath(__file__))

class CustomHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def log_message(self, format, *args):
        # Custom logging format
        print(f"\033[94m[BookVerse]\033[0m {self.address_string()} - {args[0]} {args[1]} {args[2]}")

    def do_GET(self):
        # Handle root path
        if self.path == '/':
            self.path = '/index.html'
        
        # Handle other paths that don't have file extensions
        parsed_path = urlparse(self.path)
        if '.' not in os.path.basename(parsed_path.path):
            self.path = '/index.html'

        return super().do_GET()

def run_server():
    with socketserver.TCPServer(("", PORT), CustomHTTPRequestHandler) as httpd:
        print(f"\n\033[92m{'='*50}\033[0m")
        print(f"\033[92m🚀 BookVerse Server is running!\033[0m")
        print(f"\033[92m{'='*50}\033[0m")
        print(f"\n📚 Local: \033[94mhttp://localhost:{PORT}\033[0m")
        print(f"📂 Serving files from: \033[94m{DIRECTORY}\033[0m")
        print("\n\033[93mPress Ctrl+C to stop the server\033[0m\n")

        # Open the browser automatically
        webbrowser.open(f'http://localhost:{PORT}')

        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n\n\033[91m⛔ Shutting down the server...\033[0m")
            httpd.server_close()
            print("\033[91m✋ Server stopped\033[0m\n")

if __name__ == '__main__':
    run_server() 