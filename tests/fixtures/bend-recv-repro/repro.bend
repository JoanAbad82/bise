# TCP.recv decodes each recv on its own: a multi-byte UTF-8 char cut by a
# recv boundary comes back as U+FFFD. Run: bend repro.bend -o repro && ./repro &
# then: python3 send.py   (sends "aé─b" = 61 c3 a9 e2 94 80 62, 2 bytes a write)
import Base

def show(m: Maybe<&1, String>) -> String:
  match m:
    case None{}:
      "<closed>"
    case Some{+d}:
      d

@unsafe
def loop(s: Socket) -> IO(Unit):
  do IO<Unit>:
    rm : Socket & Result<&1, &1, U32 & String, Maybe<&1, String>> <- TCP.recv(s, 2)
    loop.after(rm)

@unsafe
def loop.after(rm: Socket & Result<&1, &1, U32 & String, Maybe<&1, String>>) -> IO(Unit):
  match rm:
    case (s, Fail{_}):
      IO.print("recv failed")
    case (s, Done{None{}}):
      IO.print("closed")
    case (s, Done{Some{+d}}):
      do IO<Unit>:
        IO.print(String.append("recv: ", d))
        loop(s)

@unsafe
def main() -> IO(Unit):
  do IO<Unit>:
    l : Listener <- IO.try(Listener, TCP.listen("127.0.0.1", 7799))
    am : Listener & Result<&1, &1, U32 & String, Socket> <- TCP.accept(l)
    main.after(am)

@unsafe
def main.after(am: Listener & Result<&1, &1, U32 & String, Socket>) -> IO(Unit):
  match am:
    case (l, Fail{_}):
      IO.print("accept failed")
    case (l, Done{s}):
      loop(s)
