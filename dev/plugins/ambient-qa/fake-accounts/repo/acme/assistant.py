"""The in-app assistant: builds the prompt sent to the model for a user's question."""

SYSTEM = (
    "You are acme's assistant. You help teams plan their work in acme. "
    "Be short and concrete. Always answer in English."
)


def prompt(question, context):
    return [
        {"role": "system", "content": SYSTEM},
        {"role": "user", "content": "Context:\n%s\n\nQuestion: %s" % (context, question)},
    ]
