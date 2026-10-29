"""fake_tls: the fake provider over HTTPS (tests/fake_provider.py, FAKE_TLS=1).

The server's socket wrapped with tests/fixtures/tls's self-signed localhost certificate; the
client trusts it with SSL_CERT_FILE=<localhost-cert.pem> and calls https://localhost:<port>.
packaging/test-install.sh's TLS turn: the path every real provider takes, where -41's runtime
could not load Homebrew's libssl under the hardened runtime while the plain-http turn passed.
"""
import os
import ssl

CERTS = os.path.join(os.path.dirname(os.path.abspath(__file__)), "fixtures", "tls")


def wrap(srv, env=os.environ):
    """srv, its socket under TLS when env has FAKE_TLS=1."""
    if env.get("FAKE_TLS") == "1":
        ctx = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
        ctx.load_cert_chain(os.path.join(CERTS, "localhost-cert.pem"), os.path.join(CERTS, "localhost-key.pem"))
        srv.socket = ctx.wrap_socket(srv.socket, server_side=True)
    return srv
