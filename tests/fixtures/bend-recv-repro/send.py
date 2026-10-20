import socket, time
s = socket.create_connection(("127.0.0.1", 7799))
b = "aé─b".encode()
for i in range(0, len(b), 2):
    s.sendall(b[i:i + 2]); time.sleep(0.2)
s.close()
# expected: a, é, ─, b across the recvs; observed: U+FFFD where a char is cut
