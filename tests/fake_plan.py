"""The fake ChatGPT plan's model list (fake_provider.py's /models and its
model check): $FAKE_PLAN_MODELS, else three listed models and one hidden.
A model OpenAI has that the list lacks gets the plan route's own 400
(chatgpt-default, token-audit m_33677)."""
import os


def plan_models():
    """the account's model list, the real /v1/models shape of this route:
    $FAKE_PLAN_MODELS = "slug[:display name[:hide]],..." or three listed
    models and one hidden"""
    spec = os.environ.get("FAKE_PLAN_MODELS")
    if spec:
        out = []
        for one in spec.split(","):
            p = one.strip().split(":")
            out.append({"slug": p[0], "display_name": p[1] if len(p) > 1 and p[1] else p[0],
                        "visibility": "hide" if len(p) > 2 and p[2] == "hide" else "list"})
        return out
    return DEFAULT_PLAN_MODELS


DEFAULT_PLAN_MODELS = [{"slug": "gpt-6.1-sol", "display_name": "GPT-6.1 Sol", "visibility": "list"},
                       {"slug": "gpt-6-astra", "display_name": "GPT-6 Astra", "visibility": "list"},
                       {"slug": "gpt-6-luna", "display_name": "GPT-6 Luna", "visibility": "list"},
                       {"slug": "gpt-6-internal-eval", "display_name": "internal eval", "visibility": "hide"}]


def plan_model_error(body, oai_error):
    """the plan route's 400 for a model its list lacks, None when listed: a
    model OpenAI has (the default list's, or gpt-5.6-*) says the plan
    doesn't support it (token-audit m_33677), any other doesn't exist"""
    if body.get("model") in [m["slug"] for m in plan_models()]:
        return None
    known = [m["slug"] for m in DEFAULT_PLAN_MODELS] + ["gpt-5.6-terra", "gpt-5.6-luna"]
    if body.get("model") in known:
        return {"detail": "The '%s' model is not supported when using Codex with a ChatGPT account." % body.get("model")}
    return oai_error("model", "The model `%s` does not exist or you do not have access to it." % body.get("model"),
                     "model_not_found")
