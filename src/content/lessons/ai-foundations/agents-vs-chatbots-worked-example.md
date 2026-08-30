---
title: "A Chatbot Grows a Tool Loop"
track: "ai-foundations"
status: live
summary: "A worked trace of one weather question through a memory-only chatbot versus a tool-calling agent, showing the observe-think-act loop step by step and where the agent's extra machin"
duration: "14 min read"
---

Ask a plain chatbot for the weather right now and it either hedges honestly or guesses confidently — it has no eyes on the sky and, until you tell it otherwise, no idea what city you're in. Hand the same question to an agent and you can watch it go get the real answer, tool call by tool call — and pick up a few new ways to be convincingly wrong along the way.

## The setup (specific)

You're in Bengaluru, India, mid-afternoon. You open a chat app and type exactly one thing, with no prior turns and no city mentioned in the message itself:

```text
what's the weather like right now?
```

A correct answer needs three things resolved: *where* "here" is, *what the conditions actually are* at this moment, and *which units* you think in (Celsius — this is India, not the US). None of those three are in the request text. The [agents vs. chatbots](/learn/ai-foundations/ai-agents-vs-chatbots) primer covers the architectural difference between a single forward pass and a loop with tools in the abstract; this page runs one concrete question through both and stops at every place something can go wrong.

One more constraint worth stating up front: the *application* serving this chat has your request's IP address and an `Accept-Language` header sitting in its logs. The *model* has neither, unless something explicitly puts them in front of it. That gap is where this whole lesson lives.

## Step by step

### 1. The memory-only chatbot's attempt

No tools, no request metadata in the prompt — just the message and whatever the model learned during training. Two realistic responses to the same input:

```text
You: what's the weather like right now?

Chatbot (hedges): I don't have access to real-time data or your location,
so I can't tell you the current weather. If you tell me your city I can
describe typical conditions for this time of year, but not what it's
doing right now.

Chatbot (guesses instead): It's a pleasant 72°F and partly cloudy today —
great weather to be outside!
```

The second response is the more interesting failure. Notice it defaults to Fahrenheit — a small tell that whatever correlations produced that sentence skew toward US weather small talk, not toward you specifically. It isn't a wrong reading; it's confident prose with no reading behind it at all.

> **Why this step?** A model's weights are a fixed function learned once, during training, then frozen for every conversation after that — see [training vs. inference](/learn/ai-foundations/training-vs-inference). "Right now" cannot be a fact those weights contain, no matter how large or recent the training run was: training and this conversation are always separated by *some* stretch of time, and weather changes on the scale of hours. Even a model trained an hour ago on every weather report ever published would still need you to name your city, and would still be describing last hour's sky as this hour's. This is also a clean example of [why LLMs hallucinate](/learn/ai-foundations/why-llms-hallucinate): "72°F, partly cloudy" is exactly the shape a real answer takes, produced with none of the process that makes a real answer true. Bigger models don't fix this — it's not a knowledge gap, it's a category the knowledge can't be in.

### 2. Observe — give the agent something to work with

Same message, but now running inside an agent loop. Here is everything actually available at this point — not what the server "knows," but what's been serialized into the model's context:

```json
{
  "conversation": [
    {"role": "user", "content": "what's the weather like right now?"}
  ],
  "tools_available": ["get_user_location", "get_weather"],
  "request_metadata": {
    "ip": "203.0.113.42",
    "accept_language": "en-IN"
  }
}
```

> **Why this step?** A model's context window is the entire world as far as generation is concerned — nothing exists for it that isn't tokens inside that window (see [tokens, context, cost](/learn/ai-foundations/tokens-context-cost)). The IP address sitting in a server log doesn't help until the application decides to expose it, either as literal text or as something a tool can read. "Observe" means "whatever got serialized this turn," full stop — not "whatever the system technically has access to somewhere."

### 3. Think then act — resolve the location

The model reasons that the message alone doesn't name a city, so before it can do anything else it needs to call something. Here's the tool, standing in for a real IP-geolocation API:

```python
def get_user_location(request_ip):
    """Stands in for a real IP-geolocation API call."""
    ip_db = {
        "203.0.113.42": {"city": "Bengaluru", "country": "IN", "lat": 12.97, "lon": 77.59},
        "198.51.100.7": {"city": "Amsterdam", "country": "NL", "lat": 52.37, "lon": 4.90},  # a VPN exit node
    }
    return ip_db[request_ip]
```

The turn looks like this in trace form:

```text
THINK  No location in the message or the conversation. Resolve it first.
ACT    call get_user_location(request_ip="203.0.113.42")
     → {'city': 'Bengaluru', 'country': 'IN', 'lat': 12.97, 'lon': 77.59}
```

> **Why this step?** You might expect the model to just read the IP string and know the city — that seems like a lookup, not a live reading like weather. But IP-to-location mapping is *also* a constantly-changing external table: ISPs reassign address blocks, VPN exit nodes rotate, mobile carriers route whole regions through one gateway. Nothing about that table holds still long enough to be memorized. Ask the same question you just asked about the weather — "is this a fact, or a live value?" — one level down, about the location itself. It's a live value. That's exactly the spot where an agent design quietly assumes more certainty than the tool provides, which is where this example is about to break.

### 4. Observe, think, act — fetch the conditions

The tool result comes back as new context, then the model decides units *before* calling the weather API, and calls it:

```python
def units_for_country(country_code):
    """Rough heuristic — everyday Fahrenheit use is largely a US habit.
    Real code would use a proper reference table, not a one-line guess."""
    return "imperial" if country_code == "US" else "metric"

def get_weather(lat, lon, units):
    """Stands in for a real weather API call, keyed by (rounded) coordinates."""
    weather_db = {
        (12.97, 77.59): {"temp_c": 24.6, "condition": "light rain", "humidity": 88},
        (52.37, 4.90):  {"temp_c": 18.2, "condition": "overcast",   "humidity": 76},
    }
    data = dict(weather_db[(lat, lon)])
    if units == "imperial":
        data["temp"] = data.pop("temp_c") * 9 / 5 + 32
        data["unit"] = "F"
    else:
        data["temp"] = data.pop("temp_c")
        data["unit"] = "C"
    return data
```

```text
THINK  Have coordinates. units_for_country('IN') -> 'metric'. Fetch conditions.
ACT    call get_weather(lat=12.97, lon=77.59, units="metric")
     → {'condition': 'light rain', 'humidity': 88, 'temp': 24.6, 'unit': 'C'}
```

> **Why this step?** `units_for_country` runs *before* the API call, not after — the unit decision is reasoning over data (a country code), which makes it a "think" step, not cosmetic formatting bolted on at the end. Also notice: that returned dictionary is now a chunk of prompt the model didn't write and has to read on the next turn, same token budget as anything else. Two tool calls in, this loop has already cost more latency and more tokens than the chatbot spent on its entire answer — see [inference cost and latency](/learn/ai-foundations/inference-cost-and-latency-intuition). Power isn't free here; every fact you fetch is a round trip you pay for.

### 5. Observe, think, act — compose the final answer

```python
def format_answer(location, weather):
    return f"It's {weather['temp']:.1f}°{weather['unit']} and {weather['condition']} in {location['city']} right now."
```

```text
THINK  Have everything needed. Compose the reply.
ACT    final_answer: "It's 24.6°C and light rain in Bengaluru right now."
```

> **Why this step?** Formatting is still a generation step, not a template fill — the model is choosing what to foreground and enforcing a unit decision made a turn earlier. It's also the *only* step a plain chatbot could ever reach on this task, and it could only get there by guessing every input the agent just spent two tool calls actually establishing.

Stitched into one loop and run:

```python
def run_agent(request_ip):
    trace = []

    trace.append(("OBSERVE", {"message": "what's the weather like right now?", "request_ip": request_ip}))
    trace.append(("THINK", "No location given. Resolve it before anything else."))
    location = get_user_location(request_ip)
    trace.append(("ACT", {"call": "get_user_location", "result": location}))

    trace.append(("OBSERVE", location))
    units = units_for_country(location["country"])
    trace.append(("THINK", f"Have coordinates. Units for {location['country']} are {units}."))
    weather = get_weather(location["lat"], location["lon"], units)
    trace.append(("ACT", {"call": "get_weather", "result": weather}))

    trace.append(("OBSERVE", weather))
    trace.append(("THINK", "Have everything needed. Compose the reply."))
    trace.append(("ACT", {"final_answer": format_answer(location, weather)}))
    return trace

for step, payload in run_agent("203.0.113.42"):
    print(step, payload)
```

That's the whole loop for one honest run: three iterations of observe → think → act, each one narrowing what's still unknown until nothing is.

## Where it breaks

Run the identical code against a different `request_ip` — nothing else changes:

```python
for step, payload in run_agent("198.51.100.7"):
    print(step, payload)
```

```text
OBSERVE {'message': "what's the weather like right now?", 'request_ip': '198.51.100.7'}
THINK   No location given. Resolve it before anything else.
ACT     {'call': 'get_user_location', 'result': {'city': 'Amsterdam', 'country': 'NL', 'lat': 52.37, 'lon': 4.9}}
OBSERVE {'city': 'Amsterdam', 'country': 'NL', 'lat': 52.37, 'lon': 4.9}
THINK   Have coordinates. Units for NL are metric.
ACT     {'call': 'get_weather', 'result': {'condition': 'overcast', 'humidity': 76, 'temp': 18.2, 'unit': 'C'}}
OBSERVE {'condition': 'overcast', 'humidity': 76, 'temp': 18.2, 'unit': 'C'}
THINK   Have everything needed. Compose the reply.
ACT     {'final_answer': "It's 18.2°C and overcast in Amsterdam right now."}
```

You're in Bengaluru. That IP happened to be a VPN exit node in Amsterdam. The agent just handed back a fully-formed, correctly-formatted, entirely wrong answer — with the exact same confidence as the correct one two paragraphs up.

This is the failure mode a memory-only chatbot cannot produce, because it never had real data to be wrong *about*. Its two options were an honest hedge or a guess that reads as a guess (72°F, "great weather to be outside," no city named). The agent's wrong answer reads as *sourced* — a real city name, a real-looking humidity reading — precisely because it is sourced, just from a tool that resolved the wrong location. Grounded-but-wrong is harder to catch than ungrounded-and-vague, and it's a failure mode that only exists because there's now a chain of tool calls where any single link can be quietly bad. A second version of the same problem, worth naming even without a full trace: if `get_weather` had returned `{"error": "upstream_timeout"}` instead of data, a formatting step that doesn't check for an `error` key before interpolating will happily render whatever fields happen to exist, or fill a template with a placeholder that looks like a reading. The chatbot's failure is legible — it says it's unsure. The agent's failures, left unchecked, dress themselves as the opposite.

**The fix** isn't a bigger model or a better weather API — it's not trusting a single tool's output as ground truth when a second, independent signal is available almost for free. The request already carries an `Accept-Language` header; cross-check its country against the IP-resolved one before spending a second tool call on data that might be about the wrong city entirely:

```python
def run_agent_v2(request_ip, accept_language_country=None):
    trace = []
    trace.append(("OBSERVE", {"message": "what's the weather like right now?", "request_ip": request_ip}))
    location = get_user_location(request_ip)
    trace.append(("ACT", {"call": "get_user_location", "result": location}))

    trace.append(("THINK", "Cross-check the IP-derived location against a second signal before trusting it."))
    if accept_language_country and accept_language_country != location["country"]:
        clarification = (
            f"Your connection looks like it's in {location['city']}, {location['country']}, "
            f"but your browser is set to {accept_language_country} — which city should I check?"
        )
        trace.append(("ACT", {"final_answer": clarification}))
        return trace

    units = units_for_country(location["country"])
    weather = get_weather(location["lat"], location["lon"], units)
    trace.append(("ACT", {"call": "get_weather", "result": weather}))
    answer = format_answer(location, weather) + " (based on your network location — say if that's wrong.)"
    trace.append(("ACT", {"final_answer": answer}))
    return trace

# already parsed from something like an Accept-Language: en-IN header
for step, payload in run_agent_v2("198.51.100.7", accept_language_country="IN"):
    print(step, payload)
```

```text
OBSERVE {'message': "what's the weather like right now?", 'request_ip': '198.51.100.7'}
ACT     {'call': 'get_user_location', 'result': {'city': 'Amsterdam', 'country': 'NL', ...}}
THINK   Cross-check the IP-derived location against a second signal before trusting it.
ACT     {'final_answer': "Your connection looks like it's in Amsterdam, NL, but your browser is set to IN — which city should I check?"}
```

Same VPN exit node, same wrong IP lookup — but now the mismatch surfaces as a question instead of a confident wrong answer. Run the same function on the real Bengaluru IP with a matching `accept_language_country="IN"` and it sails through unchanged, plus a one-line caveat naming *where* the answer came from. That caveat matters as much as the check: telling the user "based on your network location" turns a silent assumption into something they can catch themselves, which costs nothing and catches the cases your one heuristic doesn't.

None of this is free, worth saying plainly: the honest chatbot spent one generation. The agent — even in its fixed, safer form — spends at minimum one location lookup, a branch, and either a clarifying question or a second lookup plus a final generation. More round trips is exactly the trade [chain-of-thought reasoning](/learn/prompt-engineering/chain-of-thought-prompting) makes at the token level, playing out again at the tool-call level: more steps, more chances to be right for the right reasons, more chances to compound something small into something wrong.

## Takeaways

| Loop step added | Power it adds | Failure mode it adds |
|---|---|---|
| `get_user_location` | Knows *where* "here" is, not just what the training cutoff was | Wrong or stale geolocation, reported with full confidence |
| `get_weather` | A live reading instead of a training-data guess | Bad grid cell, stale cache, or a swallowed API error rendered as if it were data |
| `units_for_country` + formatting | Answers in the unit the user actually thinks in | A one-line heuristic standing in for a real preference, silently wrong at the edges |

- A memory-only chatbot's ceiling on this task is either an honest "I can't know that" or a guess that reads like one. It cannot be *confidently, specifically* wrong about your city, because it never had a city.
- An agent's tool calls remove that ceiling and replace it with a new floor: every tool result is now something the model has to trust before it can reason over it, and a wrong tool result looks exactly as finished as a right one.
- Treat "observe" as strictly what got serialized into context, "think" as the smallest missing fact you can identify at each turn, and "act" as one call at a time — that's the whole mechanism, and it's also where you'd instrument logging if you were debugging this loop for real.
- The fix pattern that generalizes: cross-check cheap signals against each other before spending an expensive call on the more confident one, and say out loud what the answer was based on so a wrong guess is checkable rather than silent.
- Evaluating this agent is a different problem than evaluating the chatbot's single completion — you're now scoring a chain where any one link's error propagates forward, which is exactly the harder case covered in [building an eval set](/learn/ai-foundations/building-an-eval-set-worked-example).

**Related:** [AI agents vs. chatbots](/learn/ai-foundations/ai-agents-vs-chatbots) · [Why LLMs hallucinate](/learn/ai-foundations/why-llms-hallucinate) · [Tokens, context, cost](/learn/ai-foundations/tokens-context-cost) · [Calling LLM APIs in Python](/learn/python-data-apis/calling-llm-apis-in-python) · [Chain-of-thought prompting](/learn/prompt-engineering/chain-of-thought-prompting) · [Building an eval set: a worked example](/learn/ai-foundations/building-an-eval-set-worked-example)
